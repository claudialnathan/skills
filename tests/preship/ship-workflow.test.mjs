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

test("ship discovers the repository's delivery layers instead of duplicating CI", () => {
  assert.match(ship, /Do not install or reconfigure a PR-only reviewer/);
  assert.match(ship, /Honor a review bot's configured scope/);
  assert.match(ship, /Never pass `--no-verify`/);
  assert.match(ship, /re-run only the gates that fix reaches/);
});

test("ship is the loop and a repo wrapper names the gates", () => {
  assert.match(ship, /skills:ship/);
  assert.match(ship, /The wrapper wins where the two differ/);
  assert.match(ship, /Harness-bundled helpers/);
  assert.match(ship, /never merges or enables auto-merge without an explicit request/);
});
