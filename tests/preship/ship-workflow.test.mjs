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
const propagation = readFileSync(
  resolve(root, "skills/ship/references/propagation.md"),
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
  assert.match(ship, /references\/propagation\.md/);

  for (const command of propagationCommands) {
    assert.match(propagation, new RegExp(command.replaceAll(" ", "\\s+")));
    assert.match(readme, new RegExp(command.replaceAll(" ", "\\s+")));
  }

  assert.match(propagation, /Each harness needs a new session/);
  assert.match(propagation, /configured source ref/);
  assert.match(propagation, /deferred until merge/);
  assert.match(
    propagation,
    /both `marketplace upgrade` and `plugin add` are required/,
  );
  assert.match(propagation, /Report that harness as unpropagated/);
  assert.match(ship, /propagation per harness/);
});

// This repository keeps no decision log, so the commit body is the only record: what a
// diff cannot carry has to be in the message or it is nowhere.
test("ship puts the undiffable part of a decision in the commit body", () => {
  assert.match(ship, /information the diff cannot recover/);
  assert.match(ship, /a rejected approach/);
  assert.match(ship, /what remains open/);
  assert.doesNotMatch(ship, /CHANGELOG/);
});
