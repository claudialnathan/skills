#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
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
const compactReport = resolve(skillRoot, "scripts/compact-report.mjs");

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
  assert.match(openreview, /scripts\/compact-report\.mjs/);
  assert.match(openreview, /The initial scan is single-pass/);
  assert.match(openreview, /does not mean deep advisor review/);
  assert.match(openreview, /Do not invent a six-figure token allowance/);
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
  assert.match(workflow, /route\/layout ownership/);
  assert.match(workflow, /Server\/Client boundaries and client blast radius/);
  assert.match(workflow, /cache scopes, tags, invalidation/);
  assert.match(workflow, /Route Handlers, Server Actions, and public mutation boundaries/);
  assert.match(workflow, /navigation\/build\/dev\/browser evidence/);
  assert.match(openreview, /Comparison classes define the delta; visibility supplies locality without filtering project-level diagnostics/);
  assert.match(workflow, /Build the diff ledger from comparison classes/);
  assert.match(workflow, /does not turn a product review into a scanner debugging session/);
  assert.match(workflow, /smallest scanner-owned fixture/);
  assert.match(workflow, /only when it replaces equivalent exploration in the primary context/);
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

test("compact report reader keeps the review input small", () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "openreview-compact-"));
  const reportPath = join(temporaryRoot, "report.json");
  const diagnostic = {
    analyzer: "project",
    evidence: "trigger evidence",
    fingerprint: "a".repeat(64),
    id: "or_1234567890abcdef",
    location: { path: "app/page.tsx", start: { column: 1, line: 1 } },
    message: "Example finding",
    provenance: { kind: "openreview-rule", name: "OpenReview" },
    ruleKey: "openreview/example",
    runtimeConfirmationRequired: false,
    severity: "warning",
    suppression: { state: "active" },
    title: "Example",
    versionEvidence: { detected: "16.3.0" },
  };
  const report = {
    analyzedFileCount: 401,
    analyzedFiles: ["app/page.tsx"],
    complete: false,
    diagnostics: [diagnostic],
    invocation: { mode: "full" },
    projects: [
      {
        capabilities: ["app-router"],
        id: ".",
        nextVersion: "16.3.0",
        root: ".",
      },
    ],
    runtimeEvidence: [],
    schema: "openreview.diagnostic-report",
    schemaVersion: 1,
    skippedChecks: [
      {
        analyzer: "route-graph",
        code: "dynamic-next-config",
        reason: "Config is dynamic.",
        required: true,
      },
    ],
    timings: [],
    toolVersion: "0.1.0",
  };
  writeFileSync(
    reportPath,
    JSON.stringify(report)
  );

  const result = spawnSync(process.execPath, [compactReport, reportPath], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout);
  assert.deepEqual(summary.acceptance, {
    complete: false,
    reportComplete: false,
  });
  assert.equal(summary.analyzedFileCount, 401);
  assert.equal(summary.requiredSkips[0].code, "dynamic-next-config");
  assert.deepEqual(summary.deterministicCandidates[0], {
    analyzer: "project",
    fingerprint: "a".repeat(64),
    id: "or_1234567890abcdef",
    location: { path: "app/page.tsx", start: { column: 1, line: 1 } },
    message: "Example finding",
    provenance: { kind: "openreview-rule", name: "OpenReview" },
    ruleKey: "openreview/example",
    runtimeConfirmationRequired: false,
    severity: "warning",
    title: "Example",
    versionEvidence: { detected: "16.3.0" },
  });
  assert.equal("evidence" in summary.deterministicCandidates[0], false);
  assert.equal("analyzedFiles" in summary, false);

  writeFileSync(
    reportPath,
    JSON.stringify({
      comparison: {
        added: [diagnostic],
        complete: false,
        moved: [],
        persistent: [],
        reason: "head-incomplete",
        renamed: [],
        resolved: [],
        unclassified: [],
      },
      complete: false,
      report,
      schema: "openreview.scan-comparison",
      schemaVersion: 1,
      visibility: {
        changedFiles: ["app/page.tsx"],
        changedLines: {},
        complete: true,
        fileDiagnosticIds: [diagnostic.id],
        lineDiagnosticIds: [],
      },
    })
  );
  const comparisonResult = spawnSync(
    process.execPath,
    [compactReport, reportPath],
    { encoding: "utf8" }
  );
  rmSync(temporaryRoot, { force: true, recursive: true });

  assert.equal(comparisonResult.status, 0, comparisonResult.stderr);
  const comparisonSummary = JSON.parse(comparisonResult.stdout);
  assert.deepEqual(comparisonSummary.acceptance, {
    complete: false,
    comparisonComplete: false,
    comparisonReason: "head-incomplete",
    reportComplete: false,
    visibilityComplete: true,
  });
  assert.equal(comparisonSummary.comparison.added, 1);
  assert.equal(comparisonSummary.deterministicCandidates.length, 1);
});
