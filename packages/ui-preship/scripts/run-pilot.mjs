#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ACTION_REF =
  "claudialnathan/skills/actions/ui-preship@0123456789abcdef0123456789abcdef01234567";
const LENS_RULES = new Set(["UP110", "UP111", "UP112", "UP113", "UP114", "UP115"]);

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
  });
  if (result.status !== 0) {
    throw new Error(
      [
        `${command} ${args.join(" ")} exited ${String(result.status)}.`,
        result.stderr.trim(),
        result.stdout.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  return result;
}

function git(root, args) {
  return run("git", args, { cwd: root }).stdout.trim();
}

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function configureRepository(root, shape, tarball, npmCache) {
  mkdirSync(root, { recursive: true });
  write(
    resolve(root, "package.json"),
    `${JSON.stringify(
      {
        name: `ui-preship-pilot-${shape.id}`,
        version: "1.0.0",
        private: true,
      },
      null,
      2,
    )}\n`,
  );
  write(resolve(root, ".gitignore"), "node_modules/\n");
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "pilot@example.test"]);
  git(root, ["config", "user.name", "ui-preship pilot"]);
  run(
    "npm",
    [
      "install",
      "--save-dev",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      tarball,
    ],
    {
      cwd: root,
      env: { npm_config_cache: npmCache },
    },
  );

  const manifestPath = resolve(root, "package.json");
  const manifest = json(manifestPath);
  manifest.dependencies = shape.dependencies;
  if (shape.workspaces.length > 0) manifest.workspaces = shape.workspaces;
  write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  if (shape.baseUiContract) {
    write(
      resolve(root, "node_modules/@base-ui-components/react/package.json"),
      `${JSON.stringify(
        {
          name: "@base-ui-components/react",
          version: "1.2.3",
          types: "index.d.ts",
        },
        null,
        2,
      )}\n`,
    );
    write(
      resolve(root, "node_modules/@base-ui-components/react/index.d.ts"),
      'export interface TriggerDataAttributes { "data-open"?: boolean; "data-closed"?: boolean; }\n',
    );
  }

  for (const [path, content] of Object.entries(shape.baselineFiles)) {
    write(resolve(root, path), content);
  }

  const cli = resolve(root, "node_modules/ui-preship/bin/ui-preship.mjs");
  run(
    process.execPath,
    [
      cli,
      "init",
      "--yes",
      "--agents",
      "--ci",
      "--action-ref",
      ACTION_REF,
    ],
    { cwd: root },
  );

  write(
    resolve(root, "ui-preship.config.json"),
    `${JSON.stringify(shape.config, null, 2)}\n`,
  );

  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "pilot baseline"]);
  const base = git(root, ["rev-parse", "HEAD"]);
  write(resolve(root, shape.change.path), shape.change.content);
  git(root, ["add", "--", shape.change.path]);
  git(root, ["commit", "-qm", `pilot ${shape.id} change`]);
  const head = git(root, ["rev-parse", "HEAD"]);
  return { cli, base, head };
}

function pilotShape(root, shape, tarball, npmCache) {
  const { cli, base, head } = configureRepository(
    root,
    shape,
    tarball,
    npmCache,
  );
  const artifact = ".artifacts/ui-preship/pilot.json";
  const args = [
    cli,
    "check",
    "--scope",
    "changed",
    "--base",
    base,
    "--head",
    head,
    "--profile",
    "full",
    "--format",
    "json",
    "--artifact",
    artifact,
  ];
  const startedAt = performance.now();
  const check = run(process.execPath, args, { cwd: root });
  const runtimeMs = Math.round((performance.now() - startedAt) * 100) / 100;
  const report = JSON.parse(check.stdout);

  const prompt = run(
    process.execPath,
    [
      cli,
      "review",
      "--scope",
      "changed",
      "--base",
      base,
      "--head",
      head,
      "--profile",
      "full",
      "--artifact",
      ".artifacts/ui-preship/prompt.json",
    ],
    { cwd: root },
  ).stdout;

  const findingIds = report.findings.map((finding) => finding.ruleId);
  const expected = new Set(shape.expectedFindingIds);
  const unexpectedFindingIds = [
    ...new Set(findingIds.filter((id) => !expected.has(id))),
  ];
  const missingFindingIds = shape.expectedFindingIds.filter(
    (id) => !findingIds.includes(id),
  );
  const unexpectedLenses = report.activatedLenses.filter(
    (lens) => !shape.expectedLenses.includes(lens),
  );
  const missingLenses = shape.expectedLenses.filter(
    (lens) => !report.activatedLenses.includes(lens),
  );
  const falsePositiveIds = [
    ...new Set([
      ...unexpectedFindingIds,
      ...unexpectedLenses.map((lens) => `lens:${lens}`),
    ]),
  ];
  const actionableFindingIds = findingIds.filter((id) => !LENS_RULES.has(id));

  if (
    report.assessment !== "assessed" ||
    report.blockingMode !== "none" ||
    report.summary.effectiveBlockers !== 0 ||
    missingFindingIds.length > 0 ||
    missingLenses.length > 0 ||
    falsePositiveIds.length > 0 ||
    prompt.length > 6_000
    || report.repository.workspace !== shape.expectedWorkspace
  ) {
    throw new Error(
      `${shape.id} violated its pilot contract: ${JSON.stringify(
        {
          assessment: report.assessment,
          blockingMode: report.blockingMode,
          effectiveBlockers: report.summary.effectiveBlockers,
          missingFindingIds,
          missingLenses,
          falsePositiveIds,
          promptChars: prompt.length,
          repositoryWorkspace: report.repository.workspace,
          expectedWorkspace: shape.expectedWorkspace,
        },
        null,
        2,
      )}`,
    );
  }

  return {
    id: shape.id,
    projectShape: shape.label,
    runtimeMs,
    assessment: report.assessment,
    blockingMode: report.blockingMode,
    effectiveBlockers: report.summary.effectiveBlockers,
    deterministicFailures: report.summary.deterministicFailures,
    warnings: report.summary.warnings,
    actionableFindingIds,
    activatedLenses: report.activatedLenses,
    decisions: report.summary.decisions,
    unverified: report.summary.unverified,
    promptChars: prompt.length,
    falsePositiveIds,
    noiseCount: falsePositiveIds.length,
    repositoryWorkspace: report.repository.workspace,
  };
}

const baseConfig = {
  version: 1,
  blockingMode: "none",
  workspaces: [],
  commands: {
    verify: {
      kind: "argv",
      argv: ["node", "scripts/verify.mjs"],
      cwd: ".",
      workspace: null,
      required: true,
      timeoutMs: 10_000,
    },
  },
  profiles: {
    quick: ["verify"],
    full: ["verify"],
  },
  requiredTools: [],
  rules: {},
  suppressions: [],
  baseline: {
    path: ".ui-preship-baseline.json",
  },
  artifacts: {
    directory: ".artifacts/ui-preship",
  },
};

const shapes = [
  {
    id: "next-base-ui-tailwind",
    label: "Next.js + Base UI + Tailwind",
    dependencies: {
      react: "19.2.0",
      next: "16.0.0",
      tailwindcss: "4.1.0",
      "@base-ui-components/react": "1.2.3",
    },
    workspaces: [],
    baseUiContract: true,
    baselineFiles: {
      "scripts/verify.mjs": 'process.stdout.write("verified\\n");\n',
    },
    config: baseConfig,
    change: {
      path: "src/components/ui/Popover.tsx",
      content:
        'import { Popover } from "@base-ui-components/react/popover";\nexport const Demo = () => <Popover.Trigger asChild className="grid data-[state=open]:block" aria-label="Open" />;\n',
    },
    expectedFindingIds: ["UP101", "UP102", "UP110", "UP112", "UP114"],
    expectedLenses: ["layout", "composition", "design"],
    expectedWorkspace: null,
  },
  {
    id: "react-no-shadcn",
    label: "React without shadcn",
    dependencies: {
      react: "19.2.0",
    },
    workspaces: [],
    baselineFiles: {
      "scripts/verify.mjs": 'process.stdout.write("verified\\n");\n',
    },
    config: baseConfig,
    change: {
      path: "src/Layout.tsx",
      content:
        'export const Layout = () => <main className="flex overflow-auto" aria-label="Content" />;\n',
    },
    expectedFindingIds: ["UP110", "UP114"],
    expectedLenses: ["layout", "design"],
    expectedWorkspace: null,
  },
  {
    id: "radix-shadcn",
    label: "Radix-based shadcn",
    dependencies: {
      react: "19.2.0",
      "@radix-ui/react-popover": "1.1.0",
    },
    workspaces: [],
    baselineFiles: {
      "scripts/verify.mjs": 'process.stdout.write("verified\\n");\n',
      "components.json": '{"style":"new-york","rsc":true}\n',
    },
    config: baseConfig,
    change: {
      path: "src/components/ui/popover.tsx",
      content:
        'import * as Popover from "@radix-ui/react-popover";\nexport const Trigger = () => <Popover.Trigger asChild className="data-[state=open]:block" aria-label="Open" />;\n',
    },
    expectedFindingIds: ["UP112", "UP114"],
    expectedLenses: ["composition", "design"],
    expectedWorkspace: null,
  },
  {
    id: "explicit-monorepo",
    label: "Monorepo with explicit app target",
    dependencies: {},
    workspaces: ["apps/web"],
    baselineFiles: {
      "scripts/verify.mjs": 'process.stdout.write("root verified\\n");\n',
      "apps/web/package.json":
        '{"name":"@pilot/web","private":true,"dependencies":{"react":"19.2.0"},"scripts":{"verify":"node scripts/verify.mjs"}}\n',
      "apps/web/scripts/verify.mjs":
        'process.stdout.write("workspace verified\\n");\n',
    },
    config: {
      ...baseConfig,
      workspaces: ["apps/web"],
      commands: {
        verify: {
          kind: "script",
          script: "verify",
          cwd: ".",
          workspace: "apps/web",
          required: true,
          timeoutMs: 10_000,
        },
      },
    },
    change: {
      path: "apps/web/src/Form.tsx",
      content:
        "export async function submit() { await fetch('/api'); return <form aria-label=\"Submit\" />; }\n",
    },
    expectedFindingIds: ["UP113", "UP114"],
    expectedLenses: ["mutation", "design"],
    expectedWorkspace: "apps/web",
  },
  {
    id: "non-react",
    label: "Non-React repository",
    dependencies: {},
    workspaces: [],
    baselineFiles: {
      "scripts/verify.mjs": 'process.stdout.write("verified\\n");\n',
    },
    config: baseConfig,
    change: {
      path: "styles/layout.css",
      content: ".layout { display: grid; }\n",
    },
    expectedFindingIds: [],
    expectedLenses: [],
    expectedWorkspace: null,
  },
];

function runPilot() {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "ui-preship-pilot-"));
  try {
    const packDirectory = resolve(temporaryRoot, "pack");
    const npmCache = resolve(temporaryRoot, "npm-cache");
    mkdirSync(packDirectory, { recursive: true });
    const packed = JSON.parse(
      run(
        "npm",
        ["pack", "--json", "--pack-destination", packDirectory],
        {
          cwd: packageRoot,
          env: { npm_config_cache: npmCache },
        },
      ).stdout,
    )[0];
    const tarball = resolve(packDirectory, packed.filename);
    const results = shapes.map((shape) =>
      pilotShape(
        resolve(temporaryRoot, "consumers", shape.id),
        shape,
        tarball,
        npmCache,
      ),
    );
    return {
      schemaVersion: 1,
      pilot: "ui-preship-phase-5",
      date: new Date().toISOString().slice(0, 10),
      package: {
        name: packed.name,
        version: packed.version,
        size: packed.size,
        unpackedSize: packed.unpackedSize,
        shasum: packed.shasum,
        integrity: packed.integrity,
        installedFromPackedTarball: true,
      },
      runtime: {
        node: process.version,
        npm: run("npm", ["--version"], { cwd: packageRoot }).stdout.trim(),
      },
      posture: {
        modelCalls: 0,
        networkFetchesByCli: 0,
        blockingPromotions: 0,
        publication: false,
        remoteImmutableActionExecution: "unverified",
        remoteImmutableActionReason:
          "The action is not present at a reachable committed SHA during the private dirty-worktree pilot.",
      },
      results,
      totals: {
        projects: results.length,
        runtimeMs: Math.round(
          results.reduce((sum, result) => sum + result.runtimeMs, 0) * 100,
        ) / 100,
        actionableFindings: results.reduce(
          (sum, result) => sum + result.actionableFindingIds.length,
          0,
        ),
        decisions: results.reduce((sum, result) => sum + result.decisions, 0),
        unverified: results.reduce((sum, result) => sum + result.unverified, 0),
        promptChars: results.reduce((sum, result) => sum + result.promptChars, 0),
        falsePositives: results.reduce(
          (sum, result) => sum + result.falsePositiveIds.length,
          0,
        ),
        effectiveBlockers: results.reduce(
          (sum, result) => sum + result.effectiveBlockers,
          0,
        ),
      },
    };
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const report = runPilot();
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
