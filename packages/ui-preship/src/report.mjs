import { appendFile, chmod, mkdir, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import {
  DEFAULT_ARTIFACT_DIRECTORY,
  RULES,
  RULESET_HASH,
  RULESET_VERSION,
  TOOL_VERSION,
} from "./constants.mjs";
import { AssessmentError } from "./errors.mjs";

function ruleTitle(ruleId) {
  return RULES[ruleId]?.title ?? ruleId;
}

function location(item) {
  if (!item.path) return "";
  return `${item.path}${item.line ? `:${item.line}` : ""}`;
}

function groupReport(report) {
  return {
    block: report.findings.filter((finding) => finding.effectiveBlocker),
    warn: report.findings.filter(
      (finding) => !finding.effectiveBlocker && !finding.suppressed,
    ),
    decide: report.decisions,
    verify: report.requiredEvidence.filter((item) => item.status !== "passed"),
    passed: report.commands.filter((command) => command.status === "passed"),
  };
}

export function renderHuman(report) {
  if (report.assessment !== "assessed") {
    const issue = report.assessmentError;
    return [
      `UNASSESSED ${issue.ruleId}: ${issue.message}`,
      `Remediation: ${issue.remediation}`,
      `Artifact: ${report.artifact?.path ?? "not written"}`,
    ].join("\n");
  }

  const groups = groupReport(report);
  const lines = [
    `ui-preship ${report.summary.effectiveBlockers} block · ${report.summary.deterministicFailures} deterministic failure · ${report.summary.warnings} warning · ${report.summary.decisions} decision · ${report.summary.unverified} unverified`,
  ];
  const visible = [
    ...groups.block.map((item) => ["BLOCK", item]),
    ...groups.warn.map((item) => ["WARN", item]),
    ...groups.decide.map((item) => ["DECIDE", item]),
  ].slice(0, 5);
  for (const [label, item] of visible) {
    if (label === "DECIDE") {
      lines.push(`${label} ${item.id} ${location(item)} — ${item.question}`.trim());
    } else {
      lines.push(
        `${label} ${item.ruleId} ${location(item)} — ${ruleTitle(item.ruleId)}`.trim(),
      );
    }
  }
  const evidenceByLens = new Map();
  for (const evidence of groups.verify) {
    if (!evidenceByLens.has(evidence.lens)) evidenceByLens.set(evidence.lens, []);
    evidenceByLens.get(evidence.lens).push(evidence);
  }
  for (const [lens, evidence] of [...evidenceByLens].slice(0, 5)) {
    lines.push(
      `VERIFY ${lens} — ${evidence.length} check${evidence.length === 1 ? "" : "s"} remain unverified`,
    );
  }
  if (groups.passed.length > 0) {
    lines.push(`PASSED ${groups.passed.map((command) => command.id).join(", ")}`);
  }
  if (groups.block.length > 0) {
    lines.push(`Blocker IDs: ${groups.block.map((item) => item.ruleId).join(", ")}`);
  }
  lines.push(`Artifact: ${report.artifact.path}`);
  lines.push(`Re-run: ${report.rerun}`);
  return lines.join("\n");
}

export function renderPrompt(report) {
  if (report.assessment !== "assessed") {
    return [
      "# ui-preship review handoff",
      "",
      `Assessment: unassessed`,
      `Issue: ${report.assessmentError.ruleId} — ${report.assessmentError.message}`,
      `Remediation: ${report.assessmentError.remediation}`,
      `Artifact: ${report.artifact?.path ?? "not written"}`,
      `Re-run: ${report.rerun}`,
    ].join("\n");
  }

  const groups = groupReport(report);
  const items = [
    ...groups.block.map((item) => ({ type: "FIX", item })),
    ...groups.warn.map((item) => ({ type: "REVIEW", item })),
    ...groups.decide.map((item) => ({ type: "DECIDE", item })),
  ].slice(0, 5);
  const lines = [
    "# ui-preship review handoff",
    "",
    `Repository: ${report.repository.id}`,
    `Scope: ${report.scope.kind}${report.scope.base ? ` ${report.scope.base.sha}..${report.scope.head.sha}` : ""}`,
    `Assessment: ${report.assessment}`,
    `Tool/ruleset: ${report.toolVersion} / ${report.ruleset.version}`,
    `Config/ruleset hashes: ${report.config.hash} / ${report.ruleset.hash}`,
    `Summary: ${report.summary.effectiveBlockers} blockers; ${report.summary.deterministicFailures} deterministic failures; ${report.summary.warnings} warnings; ${report.summary.decisions} decisions; ${report.summary.unverified} unverified`,
    "",
    "## Activated work",
  ];
  if (items.length === 0) lines.push("- No fix or decision group activated.");
  for (const { type, item } of items) {
    if (type === "DECIDE") {
      lines.push(`- ${type} ${item.id} ${location(item)}: ${item.question}`.trim());
    } else {
      const rule = RULES[item.ruleId];
      lines.push(
        `- ${type} ${item.ruleId} ${location(item)}: ${item.evidence} Acceptance: ${rule.acceptance}`.trim(),
      );
    }
  }

  const byLens = new Map();
  for (const evidence of groups.verify) {
    if (!byLens.has(evidence.lens)) byLens.set(evidence.lens, []);
    byLens.get(evidence.lens).push(evidence);
  }
  if (byLens.size > 0) {
    lines.push("", "## Runtime verification");
    for (const [lens, evidence] of byLens) {
      lines.push(`- ${lens}:`);
      for (const item of evidence) {
        lines.push(
          `  - State: ${item.state}; mechanism: ${item.mechanism}; artifact: ${item.artifact}; status: ${item.status}.`,
        );
      }
    }
  }
  lines.push(
    "",
    `Complete blocker IDs: ${groups.block.map((item) => item.ruleId).join(", ") || "none"}`,
    `Full JSON artifact: ${report.artifact.path}`,
    `Exact re-run: ${report.rerun}`,
  );
  return lines.join("\n");
}

function escapeWorkflow(value) {
  return String(value)
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A")
    .replaceAll(":", "%3A")
    .replaceAll(",", "%2C");
}

export async function renderGithub(report) {
  const lines = [];
  if (report.assessment !== "assessed") {
    lines.push(
      `::error title=${escapeWorkflow(report.assessmentError.ruleId)}::${escapeWorkflow(report.assessmentError.message)}`,
    );
  } else {
    for (const finding of report.findings.filter((item) => !item.suppressed)) {
      const level = finding.effectiveBlocker ? "error" : "warning";
      const properties = [
        `title=${escapeWorkflow(`${finding.ruleId} ${ruleTitle(finding.ruleId)}`)}`,
      ];
      if (finding.path) properties.push(`file=${escapeWorkflow(finding.path)}`);
      if (finding.line) properties.push(`line=${finding.line}`);
      lines.push(
        `::${level} ${properties.join(",")}::${escapeWorkflow(finding.evidence)}`,
      );
    }
  }
  lines.push(renderHuman(report));

  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = [
      "## ui-preship",
      "",
      "```text",
      renderHuman(report),
      "```",
      "",
    ].join("\n");
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, "utf8");
  }
  return lines.join("\n");
}

function ensureArtifactInsideRoot(root, absolutePath) {
  const rel = relative(root, absolutePath);
  if (rel === ".." || rel.startsWith(`..${sep}`)) {
    throw new AssessmentError("Artifact path must stay inside the assessed repository.");
  }
}

export function prepareArtifactPath(root, config, requestedPath) {
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const absolutePath = requestedPath
    ? resolve(root, requestedPath)
    : resolve(
        root,
        config?.artifacts?.directory ?? DEFAULT_ARTIFACT_DIRECTORY,
        `${timestamp}.json`,
      );
  ensureArtifactInsideRoot(root, absolutePath);
  return {
    absolutePath,
    path: relative(root, absolutePath),
  };
}

export async function writeArtifact(report, artifact) {
  await mkdir(resolve(artifact.absolutePath, ".."), { recursive: true, mode: 0o700 });
  await chmod(resolve(artifact.absolutePath, ".."), 0o700);
  await writeFile(artifact.absolutePath, `${JSON.stringify(report, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(artifact.absolutePath, 0o600);
}

export function createUnassessedReport(error, context = {}) {
  const invocation = context.invocation ?? ["ui-preship", "check"];
  return {
    schemaVersion: 1,
    toolVersion: TOOL_VERSION,
    assessment: "unassessed",
    repository: {
      id: context.repositoryId ?? "unknown",
      workspace: null,
      identitySource: "unavailable",
    },
    scope: {
      kind: context.scope ?? "unknown",
      base: context.base ? { ref: context.base, sha: null, source: "unresolved" } : null,
      head: context.head ? { ref: context.head, sha: null, source: "unresolved" } : null,
      files: [],
    },
    config: {
      path: context.configPath ?? null,
      hash: context.configHash ?? null,
    },
    ruleset: {
      version: RULESET_VERSION,
      hash: RULESET_HASH,
    },
    provenance: {
      generatedAt: new Date().toISOString(),
      runner: context.runner ?? "local",
      invocation,
      packageManager: null,
      mergeBase: null,
    },
    blockingMode: null,
    stack: {},
    commands: [],
    findings: [],
    decisions: [],
    requiredEvidence: [
      {
        lens: "assessment",
        state: "target assessment",
        mechanism: error.remediation,
        artifact: context.configPath ?? ".",
        status: "unverified",
      },
    ],
    suppressions: [],
    rerun: invocation.join(" "),
    assessmentError: {
      ruleId: error.ruleId ?? "UP006",
      message: error.message,
      remediation: error.remediation,
    },
    artifact: context.artifact ? { path: context.artifact.path } : null,
    summary: {
      effectiveBlockers: 0,
      deterministicFailures: 0,
      warnings: 0,
      decisions: 0,
      unverified: 1,
    },
  };
}

export async function renderReport(report, format) {
  if (format === "json") return JSON.stringify(report, null, 2);
  if (format === "prompt") return renderPrompt(report);
  if (format === "github") return renderGithub(report);
  return renderHuman(report);
}
