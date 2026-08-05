#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const emptyHome = mkdtempSync(join(tmpdir(), "skills-tailwind-home-"));
const fixtureRoot = mkdtempSync(join(tmpdir(), "skills-tailwind-missing-"));
const environmentWithoutOverride = { ...process.env };
delete environmentWithoutOverride.TAILWIND_LANGUAGE_SERVER_PATH;

process.on("exit", () => {
  rmSync(emptyHome, { recursive: true, force: true });
  rmSync(fixtureRoot, { recursive: true, force: true });
});

const repositoryResult = spawnSync(
  join(repositoryRoot, "bin/tailwind-intellisense-check"),
  ["skills/design-taste/SKILL.md"],
  {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: {
      ...environmentWithoutOverride,
      HOME: emptyHome,
    },
  },
);
assertResult({
  name: "repository-pinned Tailwind server resolves without an editor extension",
  result: repositoryResult,
  status: 0,
  output: /OK: Tailwind IntelliSense reports no diagnostics in 1 skill Markdown files\./,
});

mkdirSync(join(fixtureRoot, "bin"), { recursive: true });
mkdirSync(join(fixtureRoot, "skills/design/example"), { recursive: true });
mkdirSync(join(fixtureRoot, "tooling"), { recursive: true });
cpSync(
  join(repositoryRoot, "bin/tailwind-intellisense-check"),
  join(fixtureRoot, "bin/tailwind-intellisense-check"),
);
chmodSync(join(fixtureRoot, "bin/tailwind-intellisense-check"), 0o755);
writeFileSync(
  join(fixtureRoot, "skills/design/example/SKILL.md"),
  `---
name: example
description: Fixture.
---

# Example
`,
);
writeFileSync(
  join(fixtureRoot, "tooling/tailwind-intellisense.css"),
  '@import "tailwindcss";\n',
);

const missingResult = spawnSync(
  join(fixtureRoot, "bin/tailwind-intellisense-check"),
  [],
  {
    cwd: fixtureRoot,
    encoding: "utf8",
    env: {
      ...environmentWithoutOverride,
      HOME: join(fixtureRoot, "empty-home"),
    },
  },
);
assertResult({
  name: "missing Tailwind tooling fails with the install command",
  result: missingResult,
  status: 1,
  output: /npm ci --prefix tooling\/tailwind-language-server/,
});

console.log("\nOK: 2 Tailwind tooling fixture tests passed.");

function assertResult({ name, result, status, output }) {
  const combined = `${result.stdout}${result.stderr}`;
  if (result.status === status && output.test(combined)) {
    console.log(`PASS: ${name}`);
    return;
  }

  console.error(`FAIL: ${name}`);
  console.error(`  expected exit ${status}, received ${String(result.status)}`);
  console.error(`  expected output matching ${String(output)}`);
  console.error(
    combined
      .trimEnd()
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
  );
  process.exit(1);
}
