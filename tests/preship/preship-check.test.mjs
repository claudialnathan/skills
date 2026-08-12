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

// Claude's "skills" field ADDS to its always-on scan of skills/<name>/, so a flat
// fixture needs no entries at all.
const baseClaudeManifest = {
  name: "skills",
  description: "Fixture Claude plugin.",
  author: { name: "Fixture" },
  license: "MIT",
  keywords: ["fixture"],
};

const baseRootManifest = {
  $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  name: "skills",
  description: "Fixture portable plugin.",
  license: "MIT",
};

const cases = [
  {
    name: "valid fixture passes",
    expectStatus: 0,
    expect: /OK — safe to ship\./,
  },
  {
    name: "inert AGENTS stub blocks",
    mutate(root) {
      writeFileSync(join(root, "AGENTS.md"), "@CLAUDE.md\n");
    },
    expect:
      /Rules authority[\s\S]*AGENTS\.md imports CLAUDE\.md instead of defining the shared rules/,
  },
  {
    name: "placeholder AGENTS file blocks",
    mutate(root) {
      writeFileSync(join(root, "AGENTS.md"), "# Repository rules\n");
    },
    expect:
      /Rules authority[\s\S]*AGENTS\.md must contain substantive shared rules/,
  },
  {
    name: "Claude rules without AGENTS import block",
    mutate(root) {
      writeFileSync(join(root, "CLAUDE.md"), "# Claude-only rules\n");
    },
    expect:
      /Rules authority[\s\S]*CLAUDE\.md must import AGENTS\.md on its first line/,
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
        join(root, "skills/example/references/guide.md"),
        "```!fixture\n",
      );
    },
    expect: /Loader-trigger sequences[\s\S]*FAIL/,
  },
  {
    name: "bang-backtick loader trigger blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/example/references/guide.md"),
        "fixture !` marker\n",
      );
    },
    expect: /Loader-trigger sequences[\s\S]*FAIL/,
  },
  {
    name: "missing frontmatter field blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/example/SKILL.md"),
        baseSkill.replace("name: example\n", ""),
      );
    },
    expect: /Required frontmatter[\s\S]*missing name or description/,
  },
  {
    name: "oversized description blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/example/SKILL.md"),
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
        join(root, "skills/example/SKILL.md"),
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
      rmSync(join(root, "skills/example/references/guide.md"));
    },
    expect: /Dangling references[\s\S]*DANGLING/,
  },
  {
    name: "orphan reference blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/example/references/orphan.md"),
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
    name: "missing Claude manifest target blocks",
    mutate(root) {
      writeJson(join(root, ".claude-plugin/plugin.json"), {
        ...baseClaudeManifest,
        skills: [
          "./skills/example",
          "./skills/missing",
        ],
      });
    },
    expect:
      /Manifest conformance[\s\S]*\.claude-plugin\/plugin\.json lists \.\/skills\/missing/,
  },
  {
    name: "frontmatter key outside the spec blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/example/SKILL.md"),
        baseSkill.replace(
          "description: Example fixture skill.",
          "description: Example fixture skill.\nwhen_to_use: Whenever.",
        ),
      );
    },
    expect:
      /Frontmatter conformance[\s\S]*declares "when_to_use", outside the six spec keys/,
  },
  {
    name: "name not matching the directory blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/example/SKILL.md"),
        baseSkill.replace("name: example", "name: renamed-example"),
      );
    },
    expect:
      /Frontmatter conformance[\s\S]*declares name "renamed-example" but its directory is "example"/,
  },
  {
    name: "allowlisted argument-hint passes",
    mutate(root) {
      writeFileSync(
        join(root, "skills/example/SKILL.md"),
        baseSkill.replace(
          "description: Example fixture skill.",
          "description: Example fixture skill.\nargument-hint: '[optional scope]'",
        ),
      );
    },
    expectStatus: 0,
    expect: /Frontmatter conformance[\s\S]*OK[\s\S]*OK — safe to ship\./,
  },
  {
    name: "nested skill blocks",
    mutate(root) {
      const nestedRoot = join(root, "skills/wip/example-wip");
      mkdirSync(nestedRoot, { recursive: true });
      writeFileSync(
        join(nestedRoot, "SKILL.md"),
        "---\nname: example-wip\ndescription: Nested fixture skill.\n---\n\n# Example WIP\n",
      );
    },
    expect:
      /Manifest conformance[\s\S]*skills\/wip\/example-wip\/SKILL\.md is nested; Agent Plugins 1\.0\.0 section 7\.1/,
  },
  {
    name: "missing root manifest blocks",
    mutate(root) {
      rmSync(join(root, "plugin.json"));
    },
    expect: /Manifest conformance[\s\S]*missing plugin\.json/,
  },
  {
    name: "root manifest declaring skills blocks",
    mutate(root) {
      writeJson(join(root, "plugin.json"), {
        ...baseRootManifest,
        skills: ["./skills/example"],
      });
    },
    expect:
      /Manifest conformance[\s\S]*must not declare "skills" — discovery is fixed/,
  },
  {
    name: "root manifest with an unknown key blocks",
    mutate(root) {
      writeJson(join(root, "plugin.json"), {
        ...baseRootManifest,
        interface: { displayName: "Fixture" },
      });
    },
    expect: /Manifest conformance[\s\S]*unknown top-level key "interface"/,
  },
  {
    name: "root manifest with the wrong schema blocks",
    mutate(root) {
      writeJson(join(root, "plugin.json"), {
        ...baseRootManifest,
        $schema: "https://agent-plugins.org/schemas/0.9.0/plugin.schema.json",
      });
    },
    expect: /Manifest conformance[\s\S]*"\$schema" must be exactly/,
  },
  {
    name: "Tailwind diagnostic command blocks",
    tailwindExit: 1,
    expect: /Tailwind IntelliSense[\s\S]*FAILED — see above\./,
  },
  {
    name: "manual-only in Claude without the Codex policy blocks",
    mutate(root) {
      writeFileSync(
        join(root, "skills/example/SKILL.md"),
        baseSkill.replace(
          "description: Example fixture skill.",
          "description: Example fixture skill.\ndisable-model-invocation: true",
        ),
      );
    },
    expect:
      /Invocation parity[\s\S]*sets disable-model-invocation: true but skills\/example\/agents\/openai\.yaml has no policy\.allow_implicit_invocation: false/,
  },
  {
    name: "manual-only in Codex without the Claude field blocks",
    mutate(root) {
      const agentsRoot = join(root, "skills/example/agents");
      mkdirSync(agentsRoot, { recursive: true });
      writeFileSync(
        join(agentsRoot, "openai.yaml"),
        "policy:\n  allow_implicit_invocation: false\n",
      );
    },
    expect:
      /Invocation parity[\s\S]*sets policy\.allow_implicit_invocation: false but skills\/example\/SKILL\.md has no disable-model-invocation: true/,
  },
  {
    name: "matched manual-only invocation policy passes",
    mutate(root) {
      writeFileSync(
        join(root, "skills/example/SKILL.md"),
        baseSkill.replace(
          "description: Example fixture skill.",
          "description: Example fixture skill.\ndisable-model-invocation: true",
        ),
      );
      const agentsRoot = join(root, "skills/example/agents");
      mkdirSync(agentsRoot, { recursive: true });
      writeFileSync(
        join(agentsRoot, "openai.yaml"),
        "policy:\n  allow_implicit_invocation: false\n",
      );
    },
    expectStatus: 0,
    expect: /Invocation parity[\s\S]*OK[\s\S]*OK — safe to ship\./,
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
    join(fixtureRoot, "scripts/test-token-audit"),
    `#!/usr/bin/env bash\nprintf 'token-audit fixture: %s\\n' "$*"\nexit ${testCase.tokenAuditExit ?? 0}\n`,
  );

  const result = spawnSync(join(fixtureRoot, "scripts/preship-check"), {
    cwd: fixtureRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: join(fixtureRoot, "home"),
      PRESHIP_ROOT: fixtureRoot,
      PRESHIP_CODEX_VALIDATOR: join(
        fixtureRoot,
        "scripts/validate-codex-plugin",
      ),
      PRESHIP_TAILWIND_COMMAND: join(fixtureRoot, "bin/test-tailwind"),
      PRESHIP_TOKEN_AUDIT_COMMAND: join(
        fixtureRoot,
        "scripts/test-token-audit",
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
  const skillRoot = join(root, "skills/example");
  mkdirSync(join(skillRoot, "references"), { recursive: true });
  const flatSkillRoot = join(root, "skills/flat-example");
  mkdirSync(flatSkillRoot, { recursive: true });
  mkdirSync(join(root, ".claude-plugin"), { recursive: true });
  mkdirSync(join(root, ".codex-plugin"), { recursive: true });
  mkdirSync(join(root, ".agents/plugins"), { recursive: true });
  mkdirSync(join(root, "bin"), { recursive: true });
  mkdirSync(join(root, "home"), { recursive: true });

  writeFileSync(
    join(root, "AGENTS.md"),
    "# Repository rules\n\nFixture rules shared by every harness.\n",
  );
  writeFileSync(
    join(root, "CLAUDE.md"),
    "@AGENTS.md\n\n## Claude Code\n\nFixture Claude-only rules.\n",
  );
  writeFileSync(join(skillRoot, "SKILL.md"), baseSkill);
  writeFileSync(
    join(skillRoot, "references/guide.md"),
    "# Guide\n\nFixture reference.\n",
  );
  writeFileSync(join(flatSkillRoot, "SKILL.md"), flatSkill);
  writeJson(join(root, ".claude-plugin/plugin.json"), baseClaudeManifest);
  writeJson(join(root, "plugin.json"), baseRootManifest);

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
    join(repositoryRoot, "scripts/preship-check"),
    join(root, "scripts/preship-check"),
  );
  cpSync(
    join(repositoryRoot, "scripts/validate-codex-plugin"),
    join(root, "scripts/validate-codex-plugin"),
  );
  chmodSync(join(root, "scripts/preship-check"), 0o755);
  chmodSync(join(root, "scripts/validate-codex-plugin"), 0o755);
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
