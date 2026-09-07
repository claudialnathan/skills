#!/usr/bin/env node

import { readFileSync } from "node:fs";

const fail = (message) => {
  throw new Error(`OpenReview report: ${message}`);
};

const object = (value, name) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${name} must be an object`);
  }
  return value;
};

const array = (value, name) => {
  if (!Array.isArray(value)) {
    fail(`${name} must be an array`);
  }
  return value;
};

const compactDiagnostic = (value) => {
  const diagnostic = object(value, "diagnostic");
  return {
    analyzer: diagnostic.analyzer,
    fingerprint: diagnostic.fingerprint,
    id: diagnostic.id,
    location: diagnostic.location,
    message: diagnostic.message,
    provenance: diagnostic.provenance,
    ruleKey: diagnostic.ruleKey,
    runtimeConfirmationRequired: diagnostic.runtimeConfirmationRequired,
    severity: diagnostic.severity,
    title: diagnostic.title,
    ...(diagnostic.versionEvidence
      ? { versionEvidence: diagnostic.versionEvidence }
      : {}),
  };
};

const active = (diagnostics) =>
  array(diagnostics, "diagnostics")
    .filter((diagnostic) => diagnostic?.suppression?.state === "active")
    .map(compactDiagnostic);

const reportPath = process.argv[2];
if (!reportPath || process.argv.length !== 3) {
  console.error("Usage: compact-report.mjs <report.json>");
  process.exit(64);
}

try {
  const input = object(
    JSON.parse(readFileSync(reportPath, "utf8")),
    "document"
  );
  const comparison =
    input.schema === "openreview.scan-comparison" && input.schemaVersion === 1
      ? object(input.comparison, "comparison")
      : undefined;
  const report = comparison ? object(input.report, "report") : input;
  if (
    report.schema !== "openreview.diagnostic-report" ||
    report.schemaVersion !== 1
  ) {
    fail("expected openreview.diagnostic-report v1");
  }
  if (comparison && input.complete !== true && input.complete !== false) {
    fail("comparison completeness is missing");
  }
  if (report.complete !== true && report.complete !== false) {
    fail("report completeness is missing");
  }

  const diagnostics = array(report.diagnostics, "report diagnostics");
  const requiredSkips = array(report.skippedChecks, "skipped checks").filter(
    (check) => check?.required === true
  );
  const candidates = comparison
    ? [...active(comparison.added), ...active(comparison.unclassified)]
    : active(diagnostics);
  const suppressedDiagnosticCount = diagnostics.filter(
    (diagnostic) => diagnostic?.suppression?.state === "suppressed"
  ).length;

  const summary = {
    schema: input.schema,
    schemaVersion: input.schemaVersion,
    toolVersion: report.toolVersion,
    invocation: report.invocation,
    acceptance: comparison
      ? {
          complete: input.complete,
          reportComplete: report.complete,
          comparisonComplete: comparison.complete,
          ...(comparison.reason ? { comparisonReason: comparison.reason } : {}),
          visibilityComplete: input.visibility?.complete,
        }
      : { complete: report.complete, reportComplete: report.complete },
    projects: array(report.projects, "projects"),
    analyzedFileCount: report.analyzedFileCount,
    requiredSkips,
    optionalSkipCount:
      array(report.skippedChecks, "skipped checks").length -
      requiredSkips.length,
    deterministicCandidates: candidates,
    suppressedDiagnosticCount,
    ...(comparison
      ? {
          comparison: {
            added: array(comparison.added, "comparison added").length,
            moved: array(comparison.moved, "comparison moved").length,
            persistent: array(
              comparison.persistent,
              "comparison persistent"
            ).length,
            renamed: array(comparison.renamed, "comparison renamed").length,
            resolved: array(comparison.resolved, "comparison resolved").length,
            unclassified: array(
              comparison.unclassified,
              "comparison unclassified"
            ).length,
          },
        }
      : {}),
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
