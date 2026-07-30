#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { writeBaseline } from "../src/baseline.mjs";
import { loadConfig } from "../src/config.mjs";
import { RULES, TOOL_VERSION } from "../src/constants.mjs";
import { assess } from "../src/engine.mjs";
import { AssessmentError, UsageError } from "../src/errors.mjs";
import { resolveRepositoryRoot } from "../src/git-scope.mjs";
import {
  initializeProject,
  renderInitialization,
} from "../src/init.mjs";
import {
  createUnassessedReport,
  prepareArtifactPath,
  renderReport,
  writeArtifact,
} from "../src/report.mjs";
import { runProcess } from "../src/process.mjs";

const HELP = `ui-preship ${TOOL_VERSION}

Usage:
  ui-preship init --dry-run [--agents] [--hook] [--claude] [--ci --action-ref REF]
  ui-preship init --yes [--agents] [--hook] [--claude] [--ci --action-ref REF]
  ui-preship check [--scope staged|changed|all] [--profile NAME]
  ui-preship review [check options] [--format prompt]
  ui-preship explain RULE_ID
  ui-preship baseline update --reason TEXT --expires YYYY-MM-DD
  ui-preship doctor [--format human|json]

Options:
  --root PATH       repository working directory
  --config PATH     config path (default ui-preship.config.json)
  --scope KIND      staged, changed, or all
  --base REF        explicit local base for changed scope
  --head REF        explicit local head for changed scope
  --profile NAME    configured profile (default quick)
  --format FORMAT   human, json, prompt, or github
  --artifact PATH   repository-relative JSON artifact path
  --hook            silent exit 0; concise stderr on exit 1 or 2
  --runner NAME     local or github provenance
  --debug-log PATH  explicit local raw command log (must be gitignored)
  --debug-retain-until TIMESTAMP  required future deadline, at most 7 days
  --dry-run         preview initializer changes without writing
  --yes             apply initializer changes non-interactively
  --agents          install the short project rule
  --hook            install a recognized pre-commit adapter
  --claude          install the optional Claude Code commit adapter
  --ci              install the advisory pull-request workflow
  --action-ref REF  immutable OWNER/REPO/actions/ui-preship@FULL_SHA
`;

const CHECK_OPTIONS = new Set([
  "root",
  "config",
  "scope",
  "base",
  "head",
  "profile",
  "format",
  "artifact",
  "hook",
  "runner",
  "debug-log",
  "debug-retain-until",
]);

function parseOptions(args, allowed = CHECK_OPTIONS) {
  const options = {};
  const booleans = new Set([
    "--hook",
    "--dry-run",
    "--yes",
    "--agents",
    "--claude",
    "--ci",
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--") || !allowed.has(token.slice(2))) {
      throw new UsageError(`Unsupported option: ${token}`);
    }
    if (booleans.has(token)) {
      options[token.slice(2).replaceAll("-", "_")] = true;
      continue;
    }
    const value = args[++index];
    if (value === undefined || value.startsWith("--")) {
      throw new UsageError(`${token} requires a value.`);
    }
    options[token.slice(2).replaceAll("-", "_")] = value;
  }
  return options;
}

function invocation() {
  return ["ui-preship", ...process.argv.slice(2)];
}

function normalizeCheckOptions(parsed) {
  return {
    cwd: parsed.root ? resolve(parsed.root) : process.cwd(),
    configPath: parsed.config ?? "ui-preship.config.json",
    scope: parsed.scope ?? "staged",
    base: parsed.base,
    head: parsed.head,
    profile: parsed.profile ?? "quick",
    format: parsed.format ?? "human",
    artifactPath: parsed.artifact,
    hook: Boolean(parsed.hook),
    runner: parsed.runner ?? "local",
    debugLog: parsed.debug_log,
    debugRetainUntil: parsed.debug_retain_until,
    invocation: invocation(),
  };
}

function validateFormat(format) {
  if (!["human", "json", "prompt", "github"].includes(format)) {
    throw new UsageError(`Unsupported format "${format}".`);
  }
}

async function configAndRoot(options) {
  const root = await resolveRepositoryRoot(options.cwd);
  const configRecord = await loadConfig(root, options.configPath);
  return { root, configRecord };
}

async function runCheck(parsed, forcedFormat) {
  const options = normalizeCheckOptions(parsed);
  if (forcedFormat) options.format = forcedFormat;
  validateFormat(options.format);
  let root;
  let configRecord;
  let artifact;
  try {
    root = await resolveRepositoryRoot(options.cwd);
    configRecord = await loadConfig(root, options.configPath);
    artifact = prepareArtifactPath(root, configRecord.value, options.artifactPath);
    const report = await assess({ ...options, root, configRecord });
    report.artifact = { path: artifact.path };
    await writeArtifact(report, artifact);
    const exitCode = report.summary.effectiveBlockers > 0 ? 1 : 0;
    if (!options.hook || exitCode !== 0) {
      const output = await renderReport(report, options.format);
      (options.hook ? process.stderr : process.stdout).write(`${output}\n`);
    }
    process.exitCode = exitCode;
  } catch (error) {
    const normalized =
      error instanceof AssessmentError || error instanceof UsageError
        ? error
        : new AssessmentError(error.message);
    if (root && !artifact) {
      try {
        artifact = prepareArtifactPath(root, configRecord?.value, options.artifactPath);
      } catch {
        artifact = null;
      }
    }
    const report = createUnassessedReport(normalized, {
      invocation: options.invocation,
      scope: options.scope,
      base: options.base,
      head: options.head,
      configPath: options.configPath,
      configHash: configRecord?.hash,
      runner: options.runner,
      artifact,
    });
    if (artifact) {
      await writeArtifact(report, artifact);
    }
    const output = await renderReport(report, options.format);
    (options.hook ? process.stderr : process.stdout).write(`${output}\n`);
    process.exitCode = 2;
  }
}

async function runCheckArgs(args, forcedFormat) {
  try {
    return await runCheck(parseOptions(args), forcedFormat);
  } catch (error) {
    const normalized =
      error instanceof AssessmentError || error instanceof UsageError
        ? error
        : new AssessmentError(error.message);
    const formatIndex = args.indexOf("--format");
    const requestedFormat =
      forcedFormat ??
      (formatIndex >= 0 && args[formatIndex + 1] ? args[formatIndex + 1] : "human");
    const format = ["human", "json", "prompt", "github"].includes(requestedFormat)
      ? requestedFormat
      : "human";
    const report = createUnassessedReport(normalized, {
      invocation: invocation(),
    });
    const output = await renderReport(report, format);
    const hook = args.includes("--hook");
    (hook ? process.stderr : process.stdout).write(`${output}\n`);
    process.exitCode = 2;
  }
}

async function runExplain(args) {
  if (args.length !== 1) throw new UsageError("explain requires exactly one rule ID.");
  const id = args[0].toUpperCase();
  const rule = RULES[id];
  if (!rule) throw new UsageError(`Unknown rule ID "${args[0]}".`);
  process.stdout.write(
    `${id} — ${rule.title}\nKind: ${rule.kind}\n${rule.description}\nAcceptance: ${rule.acceptance}\n`,
  );
}

async function gitActor(root) {
  const result = await runProcess("git", ["config", "user.name"], {
    cwd: root,
    timeoutMs: 10_000,
  });
  return result.status === "passed" && result.stdout.trim()
    ? result.stdout.trim()
    : "unknown";
}

async function runBaseline(args) {
  if (args[0] !== "update") {
    throw new UsageError('baseline supports only "update".');
  }
  const parsed = parseOptions(
    args.slice(1),
    new Set(["root", "config", "artifact", "profile", "reason", "expires", "owner"]),
  );
  const options = normalizeCheckOptions({
    ...parsed,
    scope: "all",
    profile: parsed.profile ?? "full",
    format: "json",
  });
  const { root, configRecord } = await configAndRoot(options);
  const artifact = prepareArtifactPath(root, configRecord.value, options.artifactPath);
  const report = await assess({ ...options, root, configRecord });
  report.artifact = { path: artifact.path };
  await writeArtifact(report, artifact);
  const result = await writeBaseline(root, configRecord, report, {
    reason: parsed.reason,
    expires: parsed.expires,
    owner: parsed.owner,
    actor: await gitActor(root),
  });
  process.stdout.write(
    `Updated ${result.path} with ${result.entryCount} deterministic finding fingerprint(s).\n`,
  );
}

async function runDoctor(args) {
  const parsed = parseOptions(args, new Set(["root", "config", "format"]));
  const options = normalizeCheckOptions(parsed);
  const { root, configRecord } = await configAndRoot(options);
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const result = {
    assessment: nodeMajor === 22 ? "assessed" : "unassessed",
    node: process.versions.node,
    requiredNode: ">=22 <23",
    root,
    config: configRecord.path,
    configHash: configRecord.hash,
  };
  if (parsed.format === "json") {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(
      `ui-preship doctor: ${result.assessment}\nNode: ${result.node} (required ${result.requiredNode})\nConfig: ${result.config}\n`,
    );
  }
  process.exitCode = result.assessment === "assessed" ? 0 : 2;
}

async function runInit(args) {
  const parsed = parseOptions(
    args,
    new Set([
      "root",
      "dry-run",
      "yes",
      "agents",
      "hook",
      "claude",
      "ci",
      "action-ref",
    ]),
  );
  const root = await resolveRepositoryRoot(
    parsed.root ? resolve(parsed.root) : process.cwd(),
  );
  const result = await initializeProject(root, {
    dryRun: Boolean(parsed.dry_run),
    yes: Boolean(parsed.yes),
    agents: Boolean(parsed.agents),
    hook: Boolean(parsed.hook),
    claude: Boolean(parsed.claude),
    ci: Boolean(parsed.ci),
    actionRef: parsed.action_ref,
  });
  process.stdout.write(`${renderInitialization(result)}\n`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(HELP);
    return;
  }
  if (command === "--version" || command === "-v") {
    process.stdout.write(`${TOOL_VERSION}\n`);
    return;
  }
  if (command === "init") return runInit(args);
  if (command === "check") return runCheckArgs(args);
  if (command === "review") return runCheckArgs(args, "prompt");
  if (command === "explain") return runExplain(args);
  if (command === "baseline") return runBaseline(args);
  if (command === "doctor") return runDoctor(args);
  throw new UsageError(`Unsupported command "${command}".`);
}

try {
  await main();
} catch (error) {
  const normalized =
    error instanceof AssessmentError || error instanceof UsageError
      ? error
      : new AssessmentError(error.message);
  process.stderr.write(`${normalized.ruleId}: ${normalized.message}\n`);
  process.exitCode = 2;
}
