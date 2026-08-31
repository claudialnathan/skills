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
const implementation = readFileSync(
  resolve(skillRoot, "references/implementation.md"),
  "utf8",
);
const picker = readFileSync(resolve(skillRoot, "agents/openai.yaml"), "utf8");
const agents = readFileSync(resolve(root, "AGENTS.md"), "utf8");
const readme = readFileSync(resolve(root, "README.md"), "utf8");

test("openreview is a scanner-backed action with matched invocation policy", () => {
  assert.doesNotMatch(openreview, /disable-model-invocation: true/);
  assert.doesNotMatch(picker, /allow_implicit_invocation: false/);
  assert.match(openreview, /This skill should be used when the user asks to audit, review, improve, fix, plan, reconcile, or implement Next\.js framework work/);
  assert.match(openreview, /openreview-next scan --scope full --format json/);
  assert.match(openreview, /openreview-next scan --scope files --file <path> --untracked --format json/);
  assert.match(openreview, /openreview-next rules explain/);
  assert.match(openreview, /probe the command surface with `rules list`/);
  assert.match(openreview, /do not accept a single-purpose CI entrypoint/);
  assert.match(openreview, /parse a strict `openreview\.diagnostic-report` v1 result/);
  assert.match(openreview, /parse a strict `openreview\.scan-comparison` v1 envelope and its embedded strict `openreview\.diagnostic-report` v1 `report`/);
  assert.match(openreview, /Always pass an explicit `--scope`/);
  assert.match(openreview, /Reconcile the parsed report's `invocation\.mode`, applicable `baseRevision`, and exact file `scope` against the requested scan/);
  assert.match(openreview, /For a plain report, `report\.complete` is the acceptance boundary/);
  assert.match(openreview, /For changed or lines output, the top-level envelope `complete` is the acceptance boundary/);
  assert.match(openreview, /embedded `report\.complete`, `comparison\.complete` and reason, and `visibility\.complete` as separate supporting provenance/);
  assert.match(openreview, /does not distribute that CLI/);
  assert.match(openreview, /Never run a target repository's `openreview` package script/);
  assert.match(openreview, /Do not reproduce the deployed GitHub application's/);
  assert.match(agents, /actions are [^\n]*`openreview`/);
  assert.match(agents, /commands are `quality-audit`/);
  assert.match(readme, /requires a separately provisioned CLI/);
  assert.match(readme, /scanner coverage as Unverified/);
});

test("review stays read-only and explicit implementation routes through re-audit", () => {
  assert.match(openreview, /Review, Plan, and Reconcile are read-only on product source/);
  assert.match(openreview, /Remediation and Direct implementation require explicit implementation language/);
  assert.match(openreview, /a plan file is not a prerequisite/);
  assert.match(openreview, /reconcile its evidence identity according to its Deterministic, Advisor, or Runtime evidence class/);
  assert.match(openreview, /an explicitly selected plan or ID and Direct implementation may remain Actionable or Requested change/);
  assert.match(openreview, /Broad “everything” Remediation selects Actionable defects only/);
  assert.match(openreview, /Never infer package installation/);
  assert.match(openreview, /Keep every Decision, Runtime required, and Unconfirmed row outside execution/);
  assert.match(openreview, /Requested change.*user explicitly settled a named additive, behavioral, or behavior-preserving refactor outcome/);
  assert.match(implementation, /explicit implementation language supplies source-mutation authority only for the named plan, IDs, surface, or complete Actionable ledger/);
  assert.match(implementation, /Use Requested change when the user settled an additive or behavior-preserving target that is not a defect/);
  assert.match(implementation, /An explicitly selected Remediation plan or ID and Direct implementation accept Actionable or Requested change/);
  assert.match(implementation, /one `--file` per affected path plus `--untracked`/);
  assert.match(implementation, /every remaining touched and newly created source path is present in `analyzedFiles`/);
  assert.match(implementation, /Never make a diagnostic disappear by lowering coverage/);
  assert.match(implementation, /Implemented for completed Requested change work/);
});

test("one contract preserves deterministic, runtime, and advisor evidence", () => {
  assert.match(openreview, /rule key, ID, fingerprint/);
  assert.match(openreview, /forbids a clean conclusion/);
  assert.match(openreview, /Never relabel advisor judgment or a user request as deterministic/);
  assert.match(openreview, /Assign exactly one evidence class/);
  assert.match(openreview, /Then assign exactly one ledger state/);
  assert.match(openreview, /`<base>\.\.\.HEAD` comparison/);
  assert.match(openreview, /route and layout traffic/);
  assert.match(openreview, /client blast radius/);
  assert.match(openreview, /cache freshness/);
  assert.match(openreview, /public mutations/);
  assert.match(openreview, /navigation hot paths/);
  assert.match(openreview, /Comparison classes define the delta; visibility supplies locality without filtering project-level diagnostics/);
  assert.match(workflow, /Build the diff ledger from comparison classes/);
  assert.match(workflow, /neither set limits project-level rule execution or diagnostic inclusion/);
  assert.match(workflow, /`added` diagnostics are new active candidates/);
  assert.match(workflow, /`persistent`, `moved`, and `renamed` head diagnostics are pre-existing context/);
  assert.match(workflow, /`resolved` base diagnostics are evidence of removal/);
  assert.match(workflow, /`unclassified` head diagnostics remain Unverified/);
  assert.match(workflow, /Static scanner/);
  assert.match(workflow, /Next dev\/MCP import/);
  assert.match(workflow, /Browser import/);
});

test("plans use canonical recipes and retain decisions and verification", () => {
  assert.match(openreview, /canonical trigger, non-trigger boundary/);
  assert.match(openreview, /Do not approximate the fix from memory/);
  assert.match(planTemplate, /Evidence identity/);
  assert.match(planTemplate, /Ledger state: <Actionable\|Requested change>/);
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
