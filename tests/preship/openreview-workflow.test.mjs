#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const skillRoot = resolve(root, "skills/openreview");
const openreview = readFileSync(resolve(skillRoot, "SKILL.md"), "utf8");
const workflow = readFileSync(
  resolve(skillRoot, "references/workflow.md"),
  "utf8",
);
const planTemplate = readFileSync(
  resolve(skillRoot, "references/plan-template.md"),
  "utf8",
);
const migration = readFileSync(
  resolve(skillRoot, "references/migration.md"),
  "utf8",
);
const picker = readFileSync(resolve(skillRoot, "agents/openai.yaml"), "utf8");
const agents = readFileSync(resolve(root, "AGENTS.md"), "utf8");
const readme = readFileSync(resolve(root, "README.md"), "utf8");

test("openreview is a scanner-backed command with matched invocation policy", () => {
  assert.match(openreview, /disable-model-invocation: true/);
  assert.match(picker, /allow_implicit_invocation: false/);
  assert.match(openreview, /openreview-next scan --format json/);
  assert.match(openreview, /openreview-next rules explain/);
  assert.match(openreview, /does not distribute that CLI/);
  assert.match(openreview, /Never run a target repository's `openreview` package script/);
  assert.match(openreview, /Do not reproduce the deployed GitHub application's/);
  assert.match(agents, /commands are `openreview` and `quality-audit`/);
  assert.match(readme, /compatible CLI is separately provisioned/);
  assert.match(readme, /scanner coverage as Unverified/);
});

test("discovery and planning are read-only and execution is explicit", () => {
  assert.match(openreview, /Discovery and planning are read-only/);
  assert.match(openreview, /Require `execute-plan <path or ID>`/);
  assert.match(openreview, /reconcile its evidence identity according to its Deterministic, Advisor, or Runtime evidence class/);
  assert.match(openreview, /Require the reconciled ledger state to remain Actionable/);
  assert.match(openreview, /Never infer package installation/);
  assert.match(openreview, /Keep every Decision and Unconfirmed row outside execution/);
  assert.match(migration, /`action` is deprecated/);
  assert.match(migration, /selection of every Actionable row/);
  assert.match(migration, /automatically create a plan for every Actionable root cause/);
  assert.doesNotMatch(migration, /select the resulting IDs/);
  assert.match(migration, /Require `execute-plan <path or ID>` before product-source mutation/);
});

test("one contract preserves deterministic, runtime, and advisor evidence", () => {
  assert.match(openreview, /rule key, ID, fingerprint/);
  assert.match(openreview, /forbids a clean conclusion/);
  assert.match(openreview, /Never relabel advisor judgment as deterministic/);
  assert.match(openreview, /Assign exactly one evidence class/);
  assert.match(openreview, /Then assign exactly one ledger state/);
  assert.match(openreview, /`<base>\.\.\.HEAD` comparison/);
  assert.match(openreview, /route and layout traffic/);
  assert.match(openreview, /client blast radius/);
  assert.match(openreview, /cache freshness/);
  assert.match(openreview, /public mutations/);
  assert.match(openreview, /navigation hot paths/);
  assert.match(workflow, /Static scanner/);
  assert.match(workflow, /Next dev\/MCP import/);
  assert.match(workflow, /Browser import/);
});

test("plans use canonical recipes and retain decisions and verification", () => {
  assert.match(openreview, /canonical trigger, non-trigger boundary/);
  assert.match(openreview, /Do not approximate the fix from memory/);
  assert.match(planTemplate, /Evidence identity/);
  assert.match(planTemplate, /Ledger state: Actionable/);
  assert.match(planTemplate, /Decisions already settled/);
  assert.match(planTemplate, /Executor stop conditions/);
  assert.match(planTemplate, /complete coverage and no new suppressions/);
  assert.match(planTemplate, /Advisor\/runtime proof/);
  assert.match(planTemplate, /never require a nonexistent diagnostic/);
});

test("vendored upstream snapshots no longer own built-in behavior", () => {
  assert.equal(existsSync(resolve(skillRoot, "references/catalog.md")), false);
  assert.equal(
    existsSync(resolve(skillRoot, "references/upstream/snapshot.json")),
    false,
  );
  assert.doesNotMatch(openreview, /complete seven-skill catalogue/);
  assert.match(openreview, /Use `rules explain` for the canonical/);
});
