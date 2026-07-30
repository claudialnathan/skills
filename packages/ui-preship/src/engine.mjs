import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { applyBaseline, loadBaseline } from "./baseline.mjs";
import { classifyDiff } from "./classify-diff.mjs";
import {
  RULESET_HASH,
  RULESET_VERSION,
  TOOL_VERSION,
} from "./constants.mjs";
import { detectStack } from "./detect-stack.mjs";
import { prepareDebug, writeDebug } from "./debug.mjs";
import { AssessmentError } from "./errors.mjs";
import {
  resolveRepositoryRoot,
  resolveScope,
  runDiffCheck,
} from "./git-scope.mjs";
import { runConfiguredCommands } from "./run-commands.mjs";

function repositoryIdentity(remote) {
  if (!remote) return { id: "local", source: "local-fallback" };
  const normalized = remote
    .replace(/^git@github\.com:/, "")
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "");
  if (/^[^/]+\/[^/]+$/.test(normalized)) {
    return { id: normalized, source: "git-remote" };
  }
  return { id: "local", source: "local-fallback" };
}

async function gitRemote(root) {
  try {
    const config = await readFile(resolve(root, ".git/config"), "utf8");
    const section = config.match(
      /\[remote "origin"\][\s\S]*?\n\s*url\s*=\s*(.+?)(?:\n|$)/,
    );
    return section?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

function parseDiffCheck(raw, scope) {
  const findings = [];
  for (const line of raw.split(/\r?\n/).filter(Boolean)) {
    const match = line.match(/^(.+?):(\d+):\s*(.+)$/);
    const path = match?.[1] ?? null;
    const lineNumber = match ? Number(match[2]) : null;
    const source = path ? scope.files.find((file) => file.path === path) : null;
    const lineIntroduced = Boolean(
      source?.additions.some((addition) => addition.line === lineNumber),
    );
    findings.push({
      ruleId: "UP001",
      severity: "error",
      deterministic: true,
      required: true,
      path,
      line: lineNumber,
      evidence: match?.[3] ?? line,
      lineIntroduced,
      introduced: lineIntroduced,
      fingerprint: `sha256:${createHash("sha256").update(line).digest("hex")}`,
      effectiveBlocker: false,
    });
  }
  return findings;
}

function activeSuppression(config, finding) {
  const now = Date.now();
  return config.suppressions.find(
    (suppression) =>
      suppression.ruleId === finding.ruleId &&
      suppression.path === finding.path &&
      (!suppression.reviewAfter || Date.parse(suppression.reviewAfter) > now),
  );
}

function applySuppressions(config, findings) {
  const used = [];
  for (const finding of findings) {
    const suppression = activeSuppression(config, finding);
    if (!suppression) continue;
    finding.suppressed = true;
    finding.suppressionReason = suppression.reason;
    used.push(suppression);
  }
  return used;
}

function applyBlockingMode(mode, findings) {
  for (const finding of findings) {
    finding.effectiveBlocker = Boolean(
      !finding.suppressed &&
        finding.deterministic &&
        finding.required &&
        (mode === "all" || (mode === "introduced" && finding.introduced)),
    );
  }
}

function rerunFor(options) {
  const args = ["ui-preship", "check", "--scope", options.scope ?? "staged"];
  if (options.scope === "changed") {
    args.push("--base", options.base, "--head", options.head);
  }
  args.push("--profile", options.profile ?? "quick");
  if (options.configPath) args.push("--config", options.configPath);
  return args.join(" ");
}

export async function assess(options = {}) {
  const root = options.root ?? (await resolveRepositoryRoot(options.cwd ?? process.cwd()));
  const configRecord = options.configRecord;
  if (!configRecord) {
    throw new AssessmentError("assess() requires a validated config record.");
  }
  const config = configRecord.value;
  const debug = await prepareDebug(root, options);
  const scope = await resolveScope(root, options);
  const stack = await detectStack(root, config);
  const diffCheck = await runDiffCheck(root, scope);
  const commandResult = await runConfiguredCommands(
    root,
    config,
    scope,
    options.profile ?? "quick",
    { debug },
  );
  await writeDebug(debug, commandResult.debugRecords);
  const classification = stack.uiCapable
    ? await classifyDiff(root, scope, stack)
    : { findings: [], decisions: [], requiredEvidence: [], activatedLenses: [] };

  const findings = [
    ...parseDiffCheck(diffCheck, scope),
    ...commandResult.findings,
    ...classification.findings,
  ];
  const suppressions = applySuppressions(config, findings);
  const baseline = await loadBaseline(root, configRecord);
  applyBaseline(findings, baseline, config.blockingMode);
  applyBlockingMode(config.blockingMode, findings);

  const identity = repositoryIdentity(await gitRemote(root));
  const blockers = findings.filter((finding) => finding.effectiveBlocker);
  const deterministicFailures = findings.filter(
    (finding) => finding.deterministic && !finding.suppressed,
  );
  const warnings = findings.filter(
    (finding) => !finding.effectiveBlocker && !finding.suppressed,
  );
  const unverified =
    classification.requiredEvidence.filter((item) => item.status !== "passed").length +
    commandResult.commands.filter((command) => command.status === "unverified").length;

  return {
    schemaVersion: 1,
    toolVersion: TOOL_VERSION,
    assessment: "assessed",
    repository: {
      id: identity.id,
      workspace: config.workspaces.length === 1 ? config.workspaces[0] : null,
      identitySource: identity.source,
    },
    scope: {
      kind: scope.kind,
      base: scope.base,
      head: scope.head,
      files: scope.files.map(({ status, path, oldPath, score }) => ({
        status,
        path,
        ...(oldPath ? { oldPath } : {}),
        ...(score ? { score } : {}),
      })),
    },
    config: {
      path: configRecord.path,
      hash: configRecord.hash,
    },
    ruleset: {
      version: RULESET_VERSION,
      hash: RULESET_HASH,
    },
    provenance: {
      generatedAt: new Date().toISOString(),
      runner: options.runner ?? "local",
      invocation: options.invocation ?? ["ui-preship", "check"],
      packageManager: commandResult.packageManager,
      debug: debug
        ? { enabled: true, path: debug.path, retainUntil: debug.retainUntil }
        : { enabled: false },
      mergeBase: scope.mergeBase
        ? { sha: scope.mergeBase, source: "local-git" }
        : null,
    },
    blockingMode: config.blockingMode,
    stack,
    commands: commandResult.commands,
    findings,
    decisions: classification.decisions,
    requiredEvidence: classification.requiredEvidence,
    suppressions,
    baseline: {
      path: baseline.path,
      exists: baseline.exists,
      stale: baseline.stale,
    },
    activatedLenses: classification.activatedLenses,
    rerun: rerunFor(options),
    summary: {
      effectiveBlockers: blockers.length,
      deterministicFailures: deterministicFailures.length,
      warnings: warnings.length,
      decisions: classification.decisions.length,
      unverified,
    },
  };
}
