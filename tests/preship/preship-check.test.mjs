#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const temporaryRoot = mkdtempSync(join(tmpdir(), "skills-preship-"));

process.on("exit", () => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

const baseSkill = `---
name: example
description: Example fixture skill.
---

# Example

Read [the guide](references/guide.md).
`;

const flatSkill = `---
name: flat-example
description: Flat top-level fixture skill.
---

# Flat Example
`;

const baseClaudeManifest = {
  name: "skills",
  description: "Fixture Claude plugin.",
  author: { name: "Fixture" },
  license: "MIT",
  keywords: ["fixture"],
  skills: ["./skills/design/example"],
};

const baseCursorManifest = {
  ...baseClaudeManifest,
  skills: ["./skills/design/example", "./skills/flat-example"],
};

const cases = [
  {
    name: "valid fixture passes",
    expectStatus: 0,
    expect: /OK — safe to ship\./,
  },
  {
    name: "changed token reporting is static and advisory",
    expectStatus: 0,
    expect:
      /Token efficiency \(changed skills; advisory, zero-model\):[\s\S]*token-audit fixture: --scope changed/,
    reject: /token-eval|--run/,
  },
  {
    name: "changed token reporting accepts an explicit Git base",
    expectStatus: 0,
    tokenAuditBase: "fixture-base-sha",
    expect:
      /token-audit fixture: --scope changed --base fixture-base-sha/,
  },
  {
    name: "changed token reporting failure remains advisory",
    expectStatus: 0,
    tokenAuditExit: 1,
    expect:
      /warn: changed-skill token reporting did not complete; see diagnostics above\./,
  },
  {
    name: "triple-backtick loader trigger blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/design/example/references/guide.md"),
        "```!fixture\n",
      );
    },
    expect: /Loader-trigger sequences[\s\S]*FAIL/,
  },
  {
    name: "bang-backtick loader trigger blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/design/example/references/guide.md"),
        "fixture !` marker\n",
      );
    },
    expect: /Loader-trigger sequences[\s\S]*FAIL/,
  },
  {
    name: "missing frontmatter field blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/design/example/SKILL.md"),
        baseSkill.replace("name: example\n", ""),
      );
    },
    expect: /Required frontmatter[\s\S]*missing name or description/,
  },
  {
    name: "oversized description blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/design/example/SKILL.md"),
        baseSkill.replace(
          "description: Example fixture skill.",
          `description: ${"x".repeat(1025)}`,
        ),
      );
    },
    expect: /description 1025 > 1024/,
  },
  {
    name: "oversized combined catalog fields block",
    mutate(root) {
      writeFileSync(
        join(root, "skills/design/example/SKILL.md"),
        baseSkill.replace(
          "description: Example fixture skill.",
          `description: ${"d".repeat(800)}\nwhen_to_use: ${"w".repeat(737)}`,
        ),
      );
    },
    expect: /combined 1538 > 1536/,
  },
  {
    name: "dangling reference blocks",
    mutate(root) {
      rmSync(join(root, "skills/design/example/references/guide.md"));
    },
    expect: /Dangling references[\s\S]*DANGLING/,
  },
  {
    name: "orphan reference blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/design/example/references/orphan.md"),
        "# Orphan\n",
      );
    },
    expect: /Reference orphans[\s\S]*ORPHAN/,
  },
  {
    name: "Claude manifest version blocks",
    mutate(root) {
      writeJson(join(root, ".claude-plugin/plugin.json"), {
        ...baseClaudeManifest,
        version: "1.0.0",
      });
    },
    expect: /Claude plugin SHA-versioning[\s\S]*has a "version" field/,
  },
  {
    name: "invalid Codex packaging blocks",
    mutate(root) {
      const path = join(root, ".codex-plugin/plugin.json");
      const manifest = JSON.parse(readFileSync(path, "utf8"));
      manifest.version = "latest";
      writeJson(path, manifest);
    },
    expect: /Codex plugin packaging[\s\S]*strict semver/,
  },
  {
    name: "skill missing from Claude manifest blocks",
    mutate(root) {
      writeJson(join(root, ".claude-plugin/plugin.json"), {
        ...baseClaudeManifest,
        skills: [],
      });
    },
    expect:
      /Manifest sync[\s\S]*has a SKILL\.md but is not in \.claude-plugin\/plugin\.json/,
  },
  {
    name: "missing Claude manifest target blocks",
    mutate(root) {
      writeJson(join(root, ".claude-plugin/plugin.json"), {
        ...baseClaudeManifest,
        skills: [
          "./skills/design/example",
          "./skills/design/missing",
        ],
      });
    },
    expect:
      /Manifest sync[\s\S]*\.claude-plugin\/plugin\.json lists \.\/skills\/design\/missing/,
  },
  {
    name: "skill missing from Cursor manifest blocks",
    mutate(root) {
      writeJson(join(root, ".cursor-plugin/plugin.json"), {
        ...baseClaudeManifest,
        skills: [],
      });
    },
    expect:
      /Manifest sync[\s\S]*has a SKILL\.md but is not in \.cursor-plugin\/plugin\.json/,
  },
  {
    name: "missing Cursor manifest target blocks",
    mutate(root) {
      writeJson(join(root, ".cursor-plugin/plugin.json"), {
        ...baseClaudeManifest,
        skills: [
          "./skills/design/example",
          "./skills/design/missing",
        ],
      });
    },
    expect:
      /Manifest sync[\s\S]*\.cursor-plugin\/plugin\.json lists \.\/skills\/design\/missing/,
  },
  {
    name: "Tailwind diagnostic command blocks",
    tailwindExit: 1,
    expect: /Tailwind IntelliSense[\s\S]*FAILED — see above\./,
  },
  {
    name: "flat skill missing from Cursor manifest blocks",
    mutate(root) {
      writeJson(join(root, ".cursor-plugin/plugin.json"), {
        ...baseCursorManifest,
        skills: ["./skills/design/example"],
      });
    },
    expect:
      /Manifest sync[\s\S]*\.\/skills\/flat-example has a SKILL\.md but is not in \.cursor-plugin\/plugin\.json/,
  },
  {
    name: "Claude container entry covers a nested grouping skill",
    mutate(root) {
      const wipSkillRoot = join(root, "skills/wip/example-wip");
      mkdirSync(wipSkillRoot, { recursive: true });
      writeFileSync(
        join(wipSkillRoot, "SKILL.md"),
        "---\nname: example-wip\ndescription: WIP fixture skill.\n---\n\n# Example WIP\n",
      );
      writeJson(join(root, ".claude-plugin/plugin.json"), {
        ...baseClaudeManifest,
        skills: ["./skills/design/example", "./skills/wip/"],
      });
      writeJson(join(root, ".cursor-plugin/plugin.json"), {
        ...baseCursorManifest,
        skills: [
          "./skills/design/example",
          "./skills/flat-example",
          "./skills/wip/example-wip",
        ],
      });
    },
    expectStatus: 0,
    expect: /OK — safe to ship\./,
  },
];

let failures = 0;

for (const testCase of cases) {
  const fixtureRoot = createFixture(testCase.name);
  testCase.mutate?.(fixtureRoot);
  writeExecutable(
    join(fixtureRoot, "bin/test-tailwind"),
    `#!/usr/bin/env bash\nexit ${testCase.tailwindExit ?? 0}\n`,
  );
  writeExecutable(
    join(fixtureRoot, "bin/test-token-audit"),
    `#!/usr/bin/env bash\nprintf 'token-audit fixture: %s\\n' "$*"\nexit ${testCase.tokenAuditExit ?? 0}\n`,
  );

  const result = spawnSync(join(fixtureRoot, "bin/preship-check"), {
    cwd: fixtureRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: join(fixtureRoot, "home"),
      PRESHIP_ROOT: fixtureRoot,
      PRESHIP_CODEX_VALIDATOR: join(
        fixtureRoot,
        "bin/validate-codex-plugin",
      ),
      PRESHIP_TAILWIND_COMMAND: join(fixtureRoot, "bin/test-tailwind"),
      PRESHIP_TOKEN_AUDIT_COMMAND: join(
        fixtureRoot,
        "bin/test-token-audit",
      ),
      ...(testCase.tokenAuditBase
        ? { PRESHIP_TOKEN_AUDIT_BASE: testCase.tokenAuditBase }
        : {}),
    },
  });
  const output = `${result.stdout}${result.stderr}`;
  const expectedStatus = testCase.expectStatus ?? 1;
  const passed =
    result.status === expectedStatus &&
    testCase.expect.test(output) &&
    (!testCase.reject || !testCase.reject.test(output));

  if (passed) {
    console.log(`PASS: ${testCase.name}`);
  } else {
    failures += 1;
    console.error(
      [
        `FAIL: ${testCase.name}`,
        `  expected exit ${expectedStatus}, received ${String(result.status)}`,
        `  expected output matching ${String(testCase.expect)}`,
        ...(testCase.reject
          ? [`  expected output not matching ${String(testCase.reject)}`]
          : []),
        indent(output),
      ].join("\n"),
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} preship fixture test(s) failed.`);
  process.exit(1);
}

console.log(`\nOK: ${cases.length} preship fixture tests passed.`);

function createFixture(label) {
  const root = join(
    temporaryRoot,
    label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
  );
  const skillRoot = join(root, "skills/design/example");
  mkdirSync(join(skillRoot, "references"), { recursive: true });
  const flatSkillRoot = join(root, "skills/flat-example");
  mkdirSync(flatSkillRoot, { recursive: true });
  mkdirSync(join(root, ".claude-plugin"), { recursive: true });
  mkdirSync(join(root, ".cursor-plugin"), { recursive: true });
  mkdirSync(join(root, ".codex-plugin"), { recursive: true });
  mkdirSync(join(root, ".agents/plugins"), { recursive: true });
  mkdirSync(join(root, "bin"), { recursive: true });
  mkdirSync(join(root, "home"), { recursive: true });

  writeFileSync(join(skillRoot, "SKILL.md"), baseSkill);
  writeFileSync(
    join(skillRoot, "references/guide.md"),
    "# Guide\n\nFixture reference.\n",
  );
  writeFileSync(join(flatSkillRoot, "SKILL.md"), flatSkill);
  writeJson(join(root, ".claude-plugin/plugin.json"), baseClaudeManifest);
  writeJson(join(root, ".cursor-plugin/plugin.json"), baseCursorManifest);

  const pluginName = basename(root);
  writeJson(join(root, ".codex-plugin/plugin.json"), {
    name: pluginName,
    version: "0.1.0",
    description: "Fixture Codex plugin.",
    author: { name: "Fixture" },
    license: "MIT",
    skills: "./skills/",
    interface: {
      displayName: "Fixture Skills",
      shortDescription: "Fixture skill package.",
      longDescription: "Fixture skill package for preship tests.",
      developerName: "Fixture",
      category: "Productivity",
      capabilities: ["Interactive"],
      defaultPrompt: ["Use the fixture skill."],
    },
  });
  writeJson(join(root, ".agents/plugins/marketplace.json"), {
    name: "fixture-marketplace",
    interface: { displayName: "Fixture Skills" },
    plugins: [
      {
        name: pluginName,
        source: { source: "local", path: "./" },
        policy: {
          installation: "AVAILABLE",
          authentication: "ON_INSTALL",
        },
        category: "Productivity",
      },
    ],
  });

  cpSync(
    join(repositoryRoot, "bin/preship-check"),
    join(root, "bin/preship-check"),
  );
  cpSync(
    join(repositoryRoot, "bin/validate-codex-plugin"),
    join(root, "bin/validate-codex-plugin"),
  );
  chmodSync(join(root, "bin/preship-check"), 0o755);
  chmodSync(join(root, "bin/validate-codex-plugin"), 0o755);
  return root;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeExecutable(path, contents) {
  writeFileSync(path, contents);
  chmodSync(path, 0o755);
}

function indent(value) {
  return value
    .trimEnd()
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}
