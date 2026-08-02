#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const qualityAudit = readFileSync(
  resolve(root, "skills/engineering/quality-audit/SKILL.md"),
  "utf8",
);
const launchReference = readFileSync(
  resolve(
    root,
    "skills/engineering/quality-audit/references/release-readiness.md",
  ),
  "utf8",
);
const picker = readFileSync(
  resolve(root, "skills/engineering/quality-audit/agents/openai.yaml"),
  "utf8",
);
const readme = readFileSync(resolve(root, "README.md"), "utf8");

test("quality-audit keeps launch readiness explicit and progressively disclosed", () => {
  assert.match(qualityAudit, /profile: repository\|launch/);
  assert.match(qualityAudit, /Use `launch` only when the user explicitly asks/);
  assert.match(qualityAudit, /references\/release-readiness\.md/);
  assert.match(launchReference, /catnose\.me\/notes\/web-checklist/);
  assert.match(picker, /launch-readiness checkup/);
  assert.match(readme, /launch-readiness checkup/);
});

test("quality-audit settles authorized findings against current evidence", () => {
  assert.match(qualityAudit, /Read their output even[\s\S]*reports success/);
  assert.match(qualityAudit, /about 10 minutes for the round/);
  assert.match(qualityAudit, /at most 3 rounds per\s+invocation/);
  assert.match(qualityAudit, /2 fix attempts per finding/);
  assert.match(qualityAudit, /invalidates prior evidence/);
  assert.match(qualityAudit, /require two inventories/);
  assert.match(qualityAudit, /Blocked` and `unverified`[\s\S]*never passes/);
  assert.match(launchReference, /green provider conclusion with a warning/);
  assert.match(launchReference, /source, configuration, or deployment change/);
});

test("quality-audit preserves read-only and authority boundaries", () => {
  assert.match(qualityAudit, /make no writes unless remediation is also explicit/);
  assert.match(launchReference, /Given findings-only mode/);
  assert.match(launchReference, /Never install a latest scanner/);
  assert.match(launchReference, /never infer clean external configuration/);
});
