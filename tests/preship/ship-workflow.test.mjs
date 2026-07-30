#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ship = readFileSync(
  resolve(root, "skills/workflow/ship/SKILL.md"),
  "utf8",
);
const changelogReference = readFileSync(
  resolve(root, "skills/workflow/ship/references/changelog.md"),
  "utf8",
);
const readme = readFileSync(resolve(root, "README.md"), "utf8");

const propagationCommands = [
  "bin/sync-cross-tool",
  "codex plugin marketplace upgrade claudia-skills",
  "claude plugin marketplace update claudia",
  "claude plugin update skills@claudia",
];

test("ship propagates pushed skill revisions across every supported harness", () => {
  for (const command of propagationCommands) {
    assert.match(ship, new RegExp(command.replaceAll(" ", "\\s+")));
    assert.match(readme, new RegExp(command.replaceAll(" ", "\\s+")));
  }

  assert.match(ship, /new Cursor, Codex, or Claude session/);
  assert.match(ship, /marketplace's configured source ref/);
  assert.match(ship, /plugin-cache refresh as deferred until merge/);
  assert.match(ship, /propagation state per harness/);
});

test("ship respects tracked and intentionally ignored decision logs", () => {
  assert.match(ship, /git check-ignore/);
  assert.match(ship, /never force-added/);
  assert.match(changelogReference, /Referenced by `ship`/);
  assert.match(changelogReference, /git add -f/);
  assert.doesNotMatch(changelogReference, /Referenced by `land`/);
});
