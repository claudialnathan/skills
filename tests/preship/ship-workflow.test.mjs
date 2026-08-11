#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ship = readFileSync(
  resolve(root, "skills/ship/SKILL.md"),
  "utf8",
);
const changelogReference = readFileSync(
  resolve(root, "skills/ship/references/changelog.md"),
  "utf8",
);
const readme = readFileSync(resolve(root, "README.md"), "utf8");

const propagationCommands = [
  "scripts/sync-cross-tool",
  "codex plugin marketplace upgrade claudia-skills",
  "codex plugin add skills@claudia-skills",
  "claude plugin marketplace update claudia",
  "claude plugin update skills@claudia",
];

test("ship propagates pushed skill revisions across every supported harness", () => {
  for (const command of propagationCommands) {
    assert.match(ship, new RegExp(command.replaceAll(" ", "\\s+")));
    assert.match(readme, new RegExp(command.replaceAll(" ", "\\s+")));
  }

  assert.match(ship, /Each harness still needs a new session/);
  assert.match(ship, /marketplace upgrade.*refreshes the Git marketplace snapshot/);
  assert.match(ship, /plugin add.*rewrites the installed plugin cache/);
  assert.match(ship, /configured source ref/);
  assert.match(ship, /plugin-cache refresh as deferred until merge/);
  assert.match(ship, /propagation state per harness/);
});

test("ship respects tracked and intentionally ignored decision logs", () => {
  assert.match(ship, /git check-ignore/);
  assert.match(ship, /(?:don't|never) force-add(?:ed)?/);
  assert.match(changelogReference, /Referenced by `ship`/);
  assert.match(changelogReference, /git add -f/);
  assert.doesNotMatch(changelogReference, /Referenced by `land`/);
});
