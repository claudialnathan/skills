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

// This repository keeps no decision log, so the commit body is the only record: what a
// diff cannot carry has to be in the message or it is nowhere.
test("ship puts the undiffable part of a decision in the commit body", () => {
  assert.match(ship, /tried, reverted, and never committed/);
  assert.match(ship, /what's still open/);
  assert.doesNotMatch(ship, /CHANGELOG/);
});
