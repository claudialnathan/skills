import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadEvaluationCorpus } from "../../../tooling/token-audit/corpus.mjs";
import {
  CRITICAL_CRITERIA,
  SCORED_CRITERIA,
} from "../../../tooling/token-audit/evaluation.mjs";

const adapterRoot = dirname(fileURLToPath(import.meta.url));

export const manifest = JSON.parse(
  readFileSync(join(adapterRoot, "claude-code-stream.json"), "utf8"),
);

const MAX_STREAM_BYTES = 16 * 1024 * 1024;
const MAX_RETAINED_OUTPUT = 2000;
const MAX_DIFF_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const SUBJECT_BASE_TOOLS = ["Read", "Glob", "Grep"];
const MUTATING_COVERAGE = new Set(["implementation", "selective-load"]);
const ALL_CRITERIA = [
  ...CRITICAL_CRITERIA,
  ...SCORED_CRITERIA,
];
const ledgers = new Map();
const verifiedBinaries = new Set();

export async function runEvaluation(planItem, context) {
  validatePreflight(planItem, context);
  const sessionRoot = mkdtempSync(join(tmpdir(), "token-eval-claude-"));

  try {
    const baselineRoot = join(sessionRoot, "baseline");
    const workspaceRoot = join(sessionRoot, "workspace");
    copyFixture(context, baselineRoot);
    copyFixture(context, workspaceRoot);
    const conditionRoot = stageCondition(context, sessionRoot);
    const subjectPrompt = createSubjectPrompt(planItem, context);
    const subjectTools = toolsForCase(context.case);
    const subject = await runClaude({
      context,
      cwd: workspaceRoot,
      prompt: subjectPrompt,
      appendSystemPrompt: subjectSystemPrompt(context, conditionRoot),
      tools: subjectTools,
      addDir: conditionRoot,
      structuredSchema: null,
      role: "subject",
    });
    const diff = captureDiff(baselineRoot, workspaceRoot);
    const check = await verifyFixture(context, workspaceRoot, diff);
    const evidence = buildSubjectEvidence({
      context,
      planItem,
      subject,
      diff,
      check,
    });
    const primaryJudge = await runJudge({
      context,
      planItem,
      subject,
      diff,
      check,
      evidence,
      cwd: join(sessionRoot, "judge-primary"),
    });
    const secondaryJudge = context.approval.adjudication.doubleScoreCaseIds.includes(
      planItem.caseId,
    )
      ? await runJudge({
          context,
          planItem,
          subject,
          diff,
          check,
          evidence,
          cwd: join(sessionRoot, "judge-secondary"),
        })
      : null;
    const judge = mergeJudgments(primaryJudge, secondaryJudge);
    const rubric = buildRubric(context, judge, evidence);
    const referenceMetrics = referenceReadMetrics(context, subject);

    return {
      schemaVersion: 1,
      runId: runId(planItem),
      caseId: planItem.caseId,
      replication: planItem.replication,
      order: planItem.order,
      condition: {
        id: planItem.conditionId,
        blindLabel: planItem.blindLabel,
        definitionHash: context.conditionHash,
      },
      configuration: {
        approvalHash: context.approvalHash,
        model: context.approval.model,
        harness: context.approval.harness,
        reasoning: context.approval.reasoning,
        repository: context.repository,
        permissions: context.approval.permissions,
        toolAvailability: toolAvailability(subjectTools),
        promptHash: context.promptHash,
      },
      adapterCapabilities: { ...manifest.capabilities },
      evidence: [
        ...evidence,
        evidenceRow(
          "blind-judge-primary",
          "model-adjudication",
          "primary blind Claude Code adjudication",
          primaryJudge.judgment,
          `Primary blind judge returned ${primaryJudge.judgment?.criteria?.length ?? 0} rubric rows.`,
        ),
        ...(secondaryJudge
          ? [
              evidenceRow(
                "blind-judge-secondary",
                "model-adjudication",
                "secondary blind Claude Code adjudication",
                secondaryJudge.judgment,
                `Secondary blind judge returned ${secondaryJudge.judgment?.criteria?.length ?? 0} rubric rows.`,
              ),
            ]
          : []),
      ],
      metrics: {
        activation: unavailable("boolean"),
        loadedReferences: metric(
          referenceMetrics.paths,
          "paths",
          "observed",
          "subject-trace",
        ),
        loadedReferenceCharacters: metric(
          referenceMetrics.characters,
          "characters",
          "observed",
          "subject-trace",
        ),
        toolOutputCharacters: metric(
          subject.toolOutputCharacters,
          "characters",
          "observed",
          "tool-results",
        ),
        modelCalls: metric(
          subject.usage.modelCalls,
          "calls",
          "provider-reported",
          "provider-usage",
        ),
        inputTokens: metric(
          subject.usage.inputTokens,
          "tokens",
          "provider-reported",
          "provider-usage",
        ),
        cachedInputTokens: metric(
          subject.usage.cachedInputTokens,
          "tokens",
          "provider-reported",
          "provider-usage",
        ),
        outputTokens: metric(
          subject.usage.outputTokens,
          "tokens",
          "provider-reported",
          "provider-usage",
        ),
        totalTokens: metric(
          subject.usage.totalTokens,
          "tokens",
          "provider-reported",
          "provider-usage",
        ),
        currencyCost: metric(
          subject.usage.costUsd,
          "USD",
          "provider-reported",
          "provider-usage",
        ),
        elapsedMs: metric(
          subject.elapsedMs,
          "milliseconds",
          "observed",
          "subject-trace",
        ),
        deterministicAcceptance: metric(
          check.passed ? 1 : 0,
          "fraction",
          "observed",
          "fixture-check",
        ),
        runtimeVerification: unavailable("status"),
      },
      rubric,
      status: judge.valid ? "completed" : "unavailable",
      namespaced: {
        claudeCode: {
          cliVersion: manifest.harness.version,
          subjectCalls: subject.usage.modelCalls,
          judgeCalls:
            primaryJudge.stream.usage.modelCalls +
            (secondaryJudge?.stream.usage.modelCalls ?? 0),
          evaluationInputTokens:
            subject.usage.inputTokens +
            primaryJudge.stream.usage.inputTokens +
            (secondaryJudge?.stream.usage.inputTokens ?? 0),
          evaluationCachedInputTokens:
            subject.usage.cachedInputTokens +
            primaryJudge.stream.usage.cachedInputTokens +
            (secondaryJudge?.stream.usage.cachedInputTokens ?? 0),
          evaluationOutputTokens:
            subject.usage.outputTokens +
            primaryJudge.stream.usage.outputTokens +
            (secondaryJudge?.stream.usage.outputTokens ?? 0),
          evaluationTokens:
            subject.usage.totalTokens +
            primaryJudge.stream.usage.totalTokens +
            (secondaryJudge?.stream.usage.totalTokens ?? 0),
          evaluationCostUsd:
            subject.usage.costUsd +
            primaryJudge.stream.usage.costUsd +
            (secondaryJudge?.stream.usage.costUsd ?? 0),
          subjectOutputRetained: subject.output.length <= MAX_RETAINED_OUTPUT,
          browserAvailable: false,
          doubleScored: secondaryJudge !== null,
          adjudicatorAgreement: judge.agreement,
        },
      },
    };
  } finally {
    rmSync(sessionRoot, { recursive: true, force: true });
  }
}

function validatePreflight(planItem, context) {
  const { approval, case: item, condition } = context;
  if (!item.fixturePath) {
    throw new Error(
      `${planItem.caseId} has no disposable fixture; refusing a model call.`,
    );
  }
  const fixturePath = resolve(context.root, item.fixturePath);
  if (!isInside(context.root, fixturePath)) {
    throw new Error(`${planItem.caseId} fixture escapes the repository.`);
  }
  if (condition.catalogIsolation !== "exclusive") {
    throw new Error("Claude adapter requires an exclusive condition catalog.");
  }
  if (condition.allowInstalledSkills !== false) {
    throw new Error("Claude adapter refuses installed machine skills.");
  }
  if (!/^anthropic(?: api)?$/i.test(approval.model.provider)) {
    throw new Error("Claude adapter supports only the Anthropic API provider.");
  }
  if (
    !/^claude-[a-z0-9][a-z0-9-]*$/i.test(approval.model.exactVersion) ||
    /(?:latest|default|current)/i.test(approval.model.exactVersion)
  ) {
    throw new Error(
      "Claude adapter requires a full, non-alias Claude model ID.",
    );
  }
  if (!["low", "medium", "high", "xhigh", "max"].includes(approval.reasoning)) {
    throw new Error("Claude adapter received an unsupported effort level.");
  }
  if (approval.budgets.maxCurrency.currency !== "USD") {
    throw new Error("Claude Code --max-budget-usd requires a USD budget.");
  }
  if (approval.adjudication.kind !== "model") {
    throw new Error("Claude adapter requires model adjudication.");
  }
  if (approval.adjudication.rubricVersion !== "token-efficiency-v1") {
    throw new Error("Claude adapter requires the token-efficiency-v1 rubric.");
  }
  const allowedPermissions = new Set(["Read", "Glob", "Grep", "Edit", "Write"]);
  for (const permission of approval.permissions) {
    if (!allowedPermissions.has(permission)) {
      throw new Error(`Unsupported evaluation permission ${permission}.`);
    }
  }
  if (!approval.permissions.includes("Read")) {
    throw new Error("Claude adapter requires the Read permission.");
  }
  verifyClaudeBinary();
}

function verifyClaudeBinary() {
  const binary = claudeBinary();
  if (verifiedBinaries.has(binary)) return;
  if (
    binary !== "claude" &&
    !process.env.TOKEN_EVAL_ADAPTER_TEST_MODE
  ) {
    throw new Error("A custom Claude binary is allowed only in adapter tests.");
  }
  const result = spawnSync(binary, ["--version"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024,
  });
  if (result.status !== 0) {
    throw new Error("Cannot execute the approved Claude Code harness.");
  }
  const version = result.stdout.trim().split(/\s+/)[0];
  if (version !== manifest.harness.version) {
    throw new Error(
      `Claude Code ${version || "unknown"} does not match approved ${manifest.harness.version}.`,
    );
  }
  verifiedBinaries.add(binary);
}

function copyFixture(context, destination) {
  const source = resolve(context.root, context.case.fixturePath);
  mkdirSync(destination, { recursive: true, mode: 0o700 });
  cpSync(source, destination, { recursive: true });
}

function stageCondition(context, sessionRoot) {
  if (context.condition.skillPaths.length === 0) return null;
  const conditionRoot = join(sessionRoot, "condition-context");
  mkdirSync(conditionRoot, { recursive: true, mode: 0o700 });
  for (const relativePath of context.condition.skillPaths) {
    const source = resolve(context.root, relativePath);
    if (!isInside(context.root, source)) {
      throw new Error(`Condition skill path escapes repository: ${relativePath}`);
    }
    const name = basename(source);
    const destination = join(conditionRoot, name);
    cpSync(source, destination, { recursive: true });
  }
  return conditionRoot;
}

function createSubjectPrompt(planItem, context) {
  const loadInstruction =
    context.case.experiment === "routing" ||
    context.condition.skillPaths.length === 0
      ? ""
      : "Use the supplied visual-craft guidance. Open only a referenced detail file that the task actually needs.\n\n";
  return [
    "This is a controlled evaluation in a disposable fixture.",
    "Work only inside the current directory.",
    "Do not name the evaluation condition or any loaded skill.",
    "Keep the final response under 1,800 characters.",
    "No browser, screenshot, computed-style, or contrast tool is available.",
    loadInstruction.trimEnd(),
    `Task: ${planItem.prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function subjectSystemPrompt(context, conditionRoot) {
  const guidance = conditionRoot
    ? context.condition.skillPaths
        .map((skillPath) => {
          const name = basename(skillPath);
          const stagedSkill = join(conditionRoot, name, "SKILL.md");
          return [
            `<evaluation-guidance name="${name}" source="${stagedSkill}">`,
            readFileSync(resolve(context.root, skillPath, "SKILL.md"), "utf8"),
            "</evaluation-guidance>",
          ].join("\n");
        })
        .join("\n\n")
    : "";
  const contextText = (context.condition.contextPaths ?? [])
    .map((path) => readFileSync(resolve(context.root, path), "utf8").trim())
    .join("\n\n");
  return [
    "Evaluation boundary: never access paths outside the disposable current directory. Do not use network or external services. Treat rendered behavior as unverified because no runtime visual tool is available.",
    guidance,
    contextText,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function toolsForCase(item) {
  const tools = [...SUBJECT_BASE_TOOLS];
  if (MUTATING_COVERAGE.has(item.coverage)) tools.push("Edit", "Write");
  return tools;
}

async function runJudge({
  context,
  planItem,
  subject,
  diff,
  check,
  evidence,
  cwd,
}) {
  mkdirSync(cwd, { recursive: true, mode: 0o700 });
  const corpus = loadEvaluationCorpus(context.root);
  if (corpus.errors.length > 0) {
    throw new Error(`Cannot load judge contract: ${corpus.errors.join(" ")}`);
  }
  const outputEvidence = evidence.find((row) => row.id === "subject-output");
  const expectedCoverage =
    corpus.expectedCoverage[context.case.coverage] ?? {};
  const applicableCritical = (
    expectedCoverage.requiredCriticalCriteria ?? []
  ).filter((id) => CRITICAL_CRITERIA.has(id));
  const nonApplicableCritical = [...CRITICAL_CRITERIA].filter(
    (id) => !applicableCritical.includes(id),
  );
  const packet = {
    schemaVersion: 1,
    blindRun: planItem.blindLabel,
    task: context.case.prompt,
    coverage: context.case.coverage,
    expectedDecision:
      corpus.expectedSkills[context.case.skill]?.primaryDecision ?? "",
    expectedAuthority:
      corpus.expectedCoverage[context.case.coverage]?.expectedEditAuthority ?? "",
    expectedSections: context.case.expectedSections,
    retainedEvidence: {
      output: outputEvidence?.excerpt ?? "",
      diff: boundedText(redactText(diff.text, context), 2000),
      deterministicCheck: check,
      activationObserved: "unavailable",
      loadedReferences: subject.loadedReferences,
      runtimeVerification: "unavailable",
    },
    rubric: {
      version: corpus.manifest.rubricVersion,
      canonicalText: readFileSync(
        resolve(context.root, corpus.manifest.rubricPath),
        "utf8",
      ),
      applicableCritical,
      nonApplicableCritical,
      scored: [...SCORED_CRITERIA],
    },
    allowedEvidenceRefs: evidence.map((row) => row.id),
  };
  const prompt = [
    "Blindly adjudicate one coding-agent result. The condition identity is hidden.",
    "Judge only the retained evidence. Do not infer rendered behavior.",
    "Critical applicability is defined by rubric.applicableCritical for this coverage contract. Critical IDs under rubric.nonApplicableCritical are outside this case's hard gate; return not_judged for them when the retained evidence does not independently support a verdict.",
    "For every rubric ID return pass, fail, or not_judged. Scored criteria that are pass or fail need a 0-4 score. Cite only allowed evidence refs. Use not_judged when retained evidence is insufficient.",
    JSON.stringify(packet),
  ].join("\n\n");
  const stream = await runClaude({
    context,
    cwd,
    prompt,
    appendSystemPrompt:
      "You are the blind token-efficiency adjudicator. Condition labels, skill names, and implementation identities are unavailable by design.",
    tools: [],
    addDir: null,
    structuredSchema: judgmentSchema(),
    role: "judge",
  });
  const judgment = normalizeJudgment(stream.structuredOutput, evidence, context);
  return {
    stream,
    judgment,
    promptHash: sha256(prompt),
    valid: judgment.criteria.every(
      (criterion) => criterion.verdict !== "not_judged",
    ),
  };
}

function mergeJudgments(primary, secondary) {
  if (!secondary) {
    return {
      ...primary,
      agreement: {
        available: false,
        reason: "Run was not in the approved double-scored subset.",
      },
    };
  }
  const primaryRows = new Map(
    primary.judgment.criteria.map((row) => [row.id, row]),
  );
  const secondaryRows = new Map(
    secondary.judgment.criteria.map((row) => [row.id, row]),
  );
  const byCriterion = [];
  const criteria = ALL_CRITERIA.map((id) => {
    const first = primaryRows.get(id);
    const second = secondaryRows.get(id);
    if (!first || !second) {
      byCriterion.push({
        id,
        verdictAgree: false,
        scoreDelta: null,
      });
      return {
        id,
        verdict: "not_judged",
        score: null,
        confidence: null,
        reason: "One blind judge omitted this rubric row.",
        evidenceRefs: [],
      };
    }
    const verdictAgree = first.verdict === second.verdict;
    const firstScore = Number.isFinite(first.score) ? first.score : null;
    const secondScore = Number.isFinite(second.score) ? second.score : null;
    const scoreDelta =
      firstScore === null || secondScore === null
        ? null
        : Math.abs(firstScore - secondScore);
    byCriterion.push({ id, verdictAgree, scoreDelta });
    if (!verdictAgree) {
      return {
        id,
        verdict:
          first.verdict === "fail" || second.verdict === "fail"
            ? "fail"
            : "not_judged",
        score:
          firstScore === null || secondScore === null
            ? null
            : Math.min(firstScore, secondScore),
        confidence: Math.min(
          number(first.confidence),
          number(second.confidence),
        ),
        reason: `Blind judges disagreed: ${first.verdict} versus ${second.verdict}; conservative merge applied.`,
        evidenceRefs: [
          ...new Set([
            ...(first.evidenceRefs ?? []),
            ...(second.evidenceRefs ?? []),
          ]),
        ],
      };
    }
    return {
      id,
      verdict: first.verdict,
      score:
        firstScore === null || secondScore === null
          ? null
          : Math.min(firstScore, secondScore),
      confidence: Math.min(
        number(first.confidence),
        number(second.confidence),
      ),
      reason:
        scoreDelta === 0
          ? "Independent blind judges agreed."
          : `Independent blind judges agreed on verdict; score delta ${scoreDelta}.`,
      evidenceRefs: [
        ...new Set([
          ...(first.evidenceRefs ?? []),
          ...(second.evidenceRefs ?? []),
        ]),
      ],
    };
  });
  const scoredAgreements = byCriterion.filter(
    (row) => row.scoreDelta !== null,
  );
  return {
    judgment: { criteria },
    promptHash: primary.promptHash,
    valid: criteria.every((row) => row.verdict !== "not_judged"),
    agreement: {
      available: true,
      verdictFraction:
        byCriterion.filter((row) => row.verdictAgree).length /
        byCriterion.length,
      exactScoreFraction:
        scoredAgreements.length === 0
          ? null
          : scoredAgreements.filter((row) => row.scoreDelta === 0).length /
            scoredAgreements.length,
      byCriterion,
    },
  };
}

async function runClaude({
  context,
  cwd,
  prompt,
  appendSystemPrompt,
  tools,
  addDir,
  structuredSchema,
  role,
}) {
  const budget = reserveBudget(context);
  const args = [
    "--print",
    "--safe-mode",
    "--setting-sources",
    "",
    "--settings",
    JSON.stringify({ enabledPlugins: {} }),
    "--disable-slash-commands",
    "--output-format",
    "stream-json",
    "--verbose",
    "--no-session-persistence",
    "--no-chrome",
    "--prompt-suggestions",
    "false",
    "--strict-mcp-config",
    "--model",
    context.approval.model.exactVersion,
    "--effort",
    context.approval.reasoning,
    "--permission-mode",
    "dontAsk",
    "--tools",
    tools.join(","),
    "--max-budget-usd",
    budget.toFixed(6),
    "--append-system-prompt",
    appendSystemPrompt,
  ];
  if (tools.length > 0) {
    args.push("--allowedTools", tools.join(","));
  }
  if (addDir) args.push("--add-dir", addDir);
  if (structuredSchema) {
    args.push("--json-schema", JSON.stringify(structuredSchema));
  }

  const started = performance.now();
  const stream = await collectStream({
    binary: claudeBinary(),
    args,
    cwd,
    prompt,
    timeoutMs: timeoutMs(),
    environment: {
      ANTHROPIC_DEFAULT_HAIKU_MODEL:
        context.approval.model.exactVersion,
      ANTHROPIC_SMALL_FAST_MODEL:
        context.approval.model.exactVersion,
      CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION: "false",
    },
  });
  stream.elapsedMs = Math.max(1, Math.round(performance.now() - started));
  try {
    stream.usage = extractUsage(stream);
    commitUsage(context, stream.usage);
    validateStream(stream, {
      exactModel: context.approval.model.exactVersion,
      tools,
      role,
      structuredOutput: Boolean(structuredSchema),
    });
  } catch (error) {
    throw attachFailureEvidence(error, {
      context,
      role,
      stream,
    });
  }
  return stream;
}

function collectStream({
  binary,
  args,
  cwd,
  prompt,
  timeoutMs,
  environment = {},
}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(binary, args, {
      cwd,
      env: { ...process.env, ...environment },
      stdio: ["pipe", "pipe", "pipe"],
    });
    const events = [];
    const assistantModels = new Set();
    const loadedReferences = new Set();
    const pendingReferenceReads = new Map();
    const referenceCharacters = new Map();
    const skillInvocations = new Set();
    let assistantMessageCount = 0;
    let toolOutputCharacters = 0;
    let output = "";
    let structuredOutput = null;
    let init = null;
    let result = null;
    let stdoutBytes = 0;
    let buffer = "";
    let terminalError = null;
    let forceTimer = null;

    const timer = setTimeout(() => {
      terminalError = new Error("Claude Code evaluation timed out.");
      child.kill("SIGTERM");
      forceTimer = setTimeout(() => child.kill("SIGKILL"), 5000);
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > MAX_STREAM_BYTES) {
        terminalError = new Error("Claude Code stream exceeded the safe limit.");
        child.kill("SIGTERM");
        return;
      }
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        let event;
        try {
          event = JSON.parse(line);
        } catch {
          terminalError = new Error("Claude Code emitted non-JSON stream data.");
          child.kill("SIGTERM");
          return;
        }
        events.push(event);
        if (event.type === "system" && event.subtype === "api_retry") {
          terminalError = new Error(
            "Claude Code attempted an unapproved API retry.",
          );
          child.kill("SIGTERM");
          return;
        }
        if (event.type === "system" && event.subtype === "init") init = event;
        if (event.type === "assistant") {
          assistantMessageCount += 1;
          if (event.message?.model) assistantModels.add(event.message.model);
          inspectAssistantEvent(event, {
            loadedReferences,
            pendingReferenceReads,
            skillInvocations,
          });
        }
        if (event.type === "user") {
          toolOutputCharacters += inspectToolResults(event, {
            pendingReferenceReads,
            referenceCharacters,
          });
        }
        if (event.type === "result") {
          result = event;
          output = typeof event.result === "string" ? event.result : "";
          structuredOutput =
            event.structured_output ??
            parseStructuredOutput(event.result);
        }
      }
    });
    child.stderr.resume();
    child.on("error", (error) => {
      clearTimeout(timer);
      if (forceTimer) clearTimeout(forceTimer);
      rejectPromise(new Error(`Cannot start Claude Code: ${error.message}`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (forceTimer) clearTimeout(forceTimer);
      if (terminalError) {
        rejectPromise(terminalError);
        return;
      }
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer);
          events.push(event);
          if (event.type === "result") {
            result = event;
            output = typeof event.result === "string" ? event.result : "";
            structuredOutput =
              event.structured_output ??
              parseStructuredOutput(event.result);
          }
        } catch {
          rejectPromise(
            new Error("Claude Code ended with an incomplete JSON event."),
          );
          return;
        }
      }
      if (code !== 0) {
        rejectPromise(
          new Error(
            `Claude Code exited ${code}; diagnostic output was withheld by the safe artifact policy.`,
          ),
        );
        return;
      }
      resolvePromise({
        events,
        init,
        result,
        output,
        structuredOutput,
        assistantModels: [...assistantModels],
        assistantMessageCount,
        loadedReferences: [...loadedReferences],
        referenceCharacters: Object.fromEntries(referenceCharacters),
        activation: skillInvocations.size > 0,
        skillInvocations: [...skillInvocations],
        toolOutputCharacters,
      });
    });
    child.stdin.end(prompt);
  });
}

function inspectAssistantEvent(event, state) {
  for (const block of event.message?.content ?? []) {
    if (block?.type !== "tool_use") continue;
    const toolName = String(block.name ?? "");
    if (/^skill$/i.test(toolName)) {
      const skill =
        block.input?.skill ??
        block.input?.name ??
        block.input?.command;
      if (typeof skill === "string") state.skillInvocations.add(skill);
    }
    if (/^(read|read_file)$/i.test(toolName)) {
      const path = block.input?.file_path ?? block.input?.path;
      if (typeof path === "string" && /(?:^|[/\\])references[/\\]/.test(path)) {
        state.loadedReferences.add(path);
        if (block.id) state.pendingReferenceReads.set(block.id, path);
      }
    }
  }
}

function inspectToolResults(event, state) {
  let total = 0;
  for (const block of event.message?.content ?? []) {
    if (block?.type !== "tool_result") continue;
    const characters =
      typeof block.content === "string"
        ? block.content.length
        : JSON.stringify(block.content ?? "").length;
    total += characters;
    const path = state.pendingReferenceReads.get(block.tool_use_id);
    if (path) {
      state.referenceCharacters.set(
        path,
        (state.referenceCharacters.get(path) ?? 0) + characters,
      );
      state.pendingReferenceReads.delete(block.tool_use_id);
    }
  }
  return total;
}

function validateStream(
  stream,
  { exactModel, tools, role, structuredOutput },
) {
  if (!stream.init || !stream.result) {
    throw new Error(`Claude ${role} stream omitted init or result evidence.`);
  }
  if (stream.result.subtype !== "success") {
    throw new Error(
      `Claude ${role} ended with ${stream.result.subtype ?? "unknown status"}.`,
    );
  }
  const observedModels = new Set([
    stream.init.model,
    ...stream.assistantModels,
    ...Object.keys(stream.result.modelUsage ?? {}),
  ]);
  observedModels.delete(undefined);
  observedModels.delete("");
  if (
    observedModels.size === 0 ||
    [...observedModels].some((model) => model !== exactModel)
  ) {
    throw new Error(
      `Claude ${role} model drifted from the approved exact model.`,
    );
  }
  if (!Array.isArray(stream.init.plugins)) {
    throw new Error(`Claude ${role} init did not expose loaded plugins.`);
  }
  if (stream.init.plugin_errors?.length) {
    throw new Error(`Claude ${role} reported a plugin load error.`);
  }
  if (stream.init.plugins.length !== 0) {
    throw new Error(`Claude ${role} loaded an unexpected plugin.`);
  }
  const expectedTools = new Set(tools);
  if (structuredOutput) expectedTools.add("StructuredOutput");
  const observedTools = new Set(stream.init.tools ?? []);
  for (const tool of observedTools) {
    if (!expectedTools.has(tool)) {
      throw new Error(`Claude ${role} exposed unexpected tool ${tool}.`);
    }
  }
  for (const tool of expectedTools) {
    if (!observedTools.has(tool)) {
      throw new Error(`Claude ${role} omitted approved tool ${tool}.`);
    }
  }
}

function extractUsage(stream) {
  const usage = stream.result?.usage;
  const costUsd = stream.result?.total_cost_usd;
  if (!usage || !Number.isFinite(costUsd)) {
    throw new Error("Claude stream omitted provider usage or cost.");
  }
  const uncachedInput = number(usage.input_tokens);
  const cacheCreation = number(usage.cache_creation_input_tokens);
  const cachedInput = number(usage.cache_read_input_tokens);
  const output = number(usage.output_tokens);
  const input = uncachedInput + cacheCreation;
  return {
    inputTokens: input,
    cachedInputTokens: cachedInput,
    outputTokens: output,
    totalTokens: input + cachedInput + output,
    costUsd,
    modelCalls:
      Number.isInteger(stream.result.num_turns) &&
      stream.result.num_turns > 0
        ? stream.result.num_turns
        : Math.max(1, stream.assistantMessageCount),
  };
}

function attachFailureEvidence(error, { context, role, stream }) {
  const failure = error instanceof Error ? error : new Error(String(error));
  const ledger = evaluationLedger(context);
  const plugins = Array.isArray(stream.init?.plugins)
    ? stream.init.plugins
    : null;
  failure.tokenEvalFailure = {
    schemaVersion: 1,
    kind: "claude-code-adapter-failure",
    role,
    reason: failure.message.slice(0, 500),
    observed: {
      initModel:
        typeof stream.init?.model === "string" ? stream.init.model : null,
      assistantModels: [...stream.assistantModels].sort(),
      resultModels: Object.keys(stream.result?.modelUsage ?? {}).sort(),
      tools: Array.isArray(stream.init?.tools)
        ? stream.init.tools.filter((tool) => typeof tool === "string").sort()
        : null,
      loadedPluginCount: plugins?.length ?? null,
      loadedPluginNames:
        plugins === null
          ? null
          : plugins
              .map((plugin) =>
                typeof plugin === "string" ? plugin : plugin?.name,
              )
              .filter((name) => typeof name === "string")
              .sort(),
    },
    usage: stream.usage ?? null,
    evaluationLedger: { ...ledger },
  };
  return failure;
}

function reserveBudget(context) {
  const ledger = evaluationLedger(context);
  const remaining = context.approval.budgets.maxCurrency.amount - ledger.costUsd;
  const remainingCalls = Math.max(
    1,
    ledger.expectedInvocations - ledger.completedInvocations,
  );
  const allocation = remaining / remainingCalls;
  if (allocation <= 0) {
    throw new Error("Approved currency budget is exhausted.");
  }
  for (const [field, used] of [
    ["maxInputTokens", ledger.inputTokens],
    ["maxOutputTokens", ledger.outputTokens],
    ["maxTotalTokens", ledger.totalTokens],
  ]) {
    if (used >= context.approval.budgets[field]) {
      throw new Error(`Approved ${field} budget is exhausted.`);
    }
  }
  return allocation;
}

function commitUsage(context, usage) {
  const ledger = evaluationLedger(context);
  ledger.inputTokens += usage.inputTokens;
  ledger.outputTokens += usage.outputTokens;
  ledger.totalTokens += usage.totalTokens;
  ledger.costUsd += usage.costUsd;
  ledger.completedInvocations += 1;
  const budgets = context.approval.budgets;
  if (ledger.inputTokens > budgets.maxInputTokens) {
    throw new Error("Observed evaluation input-token budget exceeded.");
  }
  if (ledger.outputTokens > budgets.maxOutputTokens) {
    throw new Error("Observed evaluation output-token budget exceeded.");
  }
  if (ledger.totalTokens > budgets.maxTotalTokens) {
    throw new Error("Observed evaluation total-token budget exceeded.");
  }
  if (ledger.costUsd > budgets.maxCurrency.amount) {
    throw new Error("Observed evaluation currency budget exceeded.");
  }
}

function evaluationLedger(context) {
  if (!ledgers.has(context.approvalHash)) {
    const corpus = loadEvaluationCorpus(context.root);
    const repetitions =
      context.mode === "full"
        ? context.approval.posture.fullRunRepetitions
        : context.approval.pilotRepetitions;
    const subjectRuns = context.approval.caseIds.reduce((total, caseId) => {
      const item = corpus.casesById.get(caseId);
      if (!item) return total;
      return (
        total +
        context.approval.conditionIds.filter((conditionId) =>
          item.conditionIds.includes(conditionId),
        ).length *
          repetitions
      );
    }, 0);
    const doubleScoreRuns =
      context.approval.adjudication.doubleScoreCaseIds.reduce(
        (total, caseId) => {
          const item = corpus.casesById.get(caseId);
          if (!item || !context.approval.caseIds.includes(caseId)) return total;
          return (
            total +
            context.approval.conditionIds.filter((conditionId) =>
              item.conditionIds.includes(conditionId),
            ).length *
              repetitions
          );
        },
        0,
      );
    ledgers.set(context.approvalHash, {
      expectedInvocations: Math.max(2, subjectRuns * 2 + doubleScoreRuns),
      completedInvocations: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costUsd: 0,
    });
  }
  return ledgers.get(context.approvalHash);
}

function captureDiff(baselineRoot, workspaceRoot) {
  const result = spawnSync(
    "git",
    [
      "diff",
      "--no-index",
      "--no-ext-diff",
      "--no-color",
      "--",
      baselineRoot,
      workspaceRoot,
    ],
    {
      encoding: "utf8",
      maxBuffer: MAX_DIFF_BYTES,
    },
  );
  if (![0, 1].includes(result.status)) {
    throw new Error("Cannot capture the disposable fixture diff.");
  }
  return {
    text: result.stdout,
    changed: result.status === 1,
  };
}

async function verifyFixture(context, workspaceRoot, diff) {
  const verifier = await import(
    pathToFileURL(
      resolve(
        context.root,
        "evals/token-efficiency/fixtures/design-craft/verify.mjs",
      ),
    ).href
  );
  return verifier.verifyDesignCraftFixture({
    caseId: context.case.id,
    workspaceRoot,
    diff: diff.text,
  });
}

function buildSubjectEvidence({ context, subject, diff, check }) {
  const output = redactText(subject.output, context);
  const traceSummary = {
    eventCount: subject.events.length,
    activation: "unavailable",
    loadedReferences: normalizeReferencePaths(context, subject.loadedReferences),
    toolOutputCharacters: subject.toolOutputCharacters,
  };
  return [
    evidenceRow(
      "subject-trace",
      "adapter-trace",
      "Claude Code stream event summary",
      traceSummary,
      `${traceSummary.eventCount} events; native activation unavailable; ${traceSummary.loadedReferences.length} reference reads.`,
    ),
    evidenceRow(
      "provider-usage",
      "provider-usage",
      "Claude Code result usage",
      subject.usage,
      `${subject.usage.totalTokens} tokens; ${subject.usage.modelCalls} model calls.`,
    ),
    evidenceRow(
      "subject-output",
      "bounded-output",
      "redacted final result",
      output,
      boundedText(output, MAX_RETAINED_OUTPUT),
    ),
    evidenceRow(
      "fixture-diff",
      "diff",
      "disposable fixture diff",
      diff.text,
      boundedText(redactText(diff.text, context), 2000),
    ),
    evidenceRow(
      "fixture-check",
      "check",
      "deterministic fixture verifier",
      check,
      check.passed
        ? "Deterministic fixture check passed."
        : `Deterministic fixture check failed: ${check.failures.join("; ")}`,
    ),
    evidenceRow(
      "tool-results",
      "tool-result",
      "bounded tool-result accounting",
      subject.toolOutputCharacters,
      `${subject.toolOutputCharacters} tool-result characters observed; contents not retained.`,
    ),
  ];
}

function buildRubric(context, judge, evidence) {
  const evidenceIds = new Set(evidence.map((row) => row.id));
  const rows = new Map(
    (judge.judgment?.criteria ?? []).map((criterion) => [
      criterion.id,
      criterion,
    ]),
  );
  return {
    version: context.approval.adjudication.rubricVersion,
    conditionVisibleToAdjudicator: false,
    criteria: ALL_CRITERIA.map((id) => {
      const classification = CRITICAL_CRITERIA.has(id)
        ? "critical"
        : "scored";
      const row = rows.get(id);
      const adjudicator = modelAdjudicator(context, judge.promptHash);
      if (!row) {
        return {
          id,
          class: classification,
          verdict: "not_judged",
          score: classification === "scored" ? null : undefined,
          confidence: null,
          adjudicator,
          evidenceRefs: [],
          reason: "Blind judge did not return this rubric row.",
        };
      }
      const refs = (row.evidenceRefs ?? []).filter((ref) =>
        evidenceIds.has(ref),
      );
      if (
        !["pass", "fail", "not_judged"].includes(row.verdict) ||
        (row.verdict !== "not_judged" && refs.length === 0)
      ) {
        return {
          id,
          class: classification,
          verdict: "not_judged",
          score: classification === "scored" ? null : undefined,
          confidence: null,
          adjudicator,
          evidenceRefs: [],
          reason: "Blind judge returned an invalid or uncited verdict.",
        };
      }
      return {
        id,
        class: classification,
        verdict: row.verdict,
        ...(classification === "scored"
          ? {
              score:
                row.verdict === "not_judged"
                  ? null
                  : boundedNumber(row.score, 0, 4),
            }
          : {}),
        confidence:
          row.verdict === "not_judged"
            ? null
            : boundedNumber(row.confidence, 0, 1),
        adjudicator,
        evidenceRefs: refs,
        ...(row.reason
          ? { reason: boundedText(redactText(row.reason, context), 1000) }
          : row.verdict === "not_judged"
            ? { reason: "Retained evidence was insufficient." }
            : {}),
      };
    }),
  };
}

function normalizeJudgment(value, evidence, context) {
  if (!value || !Array.isArray(value.criteria)) {
    return { criteria: [] };
  }
  const allowedIds = new Set(ALL_CRITERIA);
  const evidenceIds = new Set(evidence.map((row) => row.id));
  const seen = new Set();
  const criteria = [];
  for (const row of value.criteria) {
    if (!allowedIds.has(row?.id) || seen.has(row.id)) continue;
    seen.add(row.id);
    criteria.push({
      id: row.id,
      verdict: row.verdict,
      score: row.score,
      confidence: row.confidence,
      reason:
        typeof row.reason === "string"
          ? boundedText(redactText(row.reason, context), 1000)
          : undefined,
      evidenceRefs: Array.isArray(row.evidenceRefs)
        ? row.evidenceRefs.filter((id) => evidenceIds.has(id))
        : [],
    });
  }
  return { criteria };
}

function modelAdjudicator(context, promptHash) {
  return {
    kind: "model",
    identity: context.approval.adjudication.identity,
    version: context.approval.adjudication.version,
    provider: context.approval.model.provider,
    model: context.approval.model.exactVersion,
    harness: `${manifest.harness.name}@${manifest.harness.version}`,
    effort: context.approval.reasoning,
    promptHash,
  };
}

function judgmentSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["criteria"],
    properties: {
      criteria: {
        type: "array",
        minItems: ALL_CRITERIA.length,
        maxItems: ALL_CRITERIA.length,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "verdict",
            "score",
            "confidence",
            "reason",
            "evidenceRefs",
          ],
          properties: {
            id: { type: "string", enum: ALL_CRITERIA },
            verdict: {
              type: "string",
              enum: ["pass", "fail", "not_judged"],
            },
            score: { type: ["number", "null"], minimum: 0, maximum: 4 },
            confidence: {
              type: ["number", "null"],
              minimum: 0,
              maximum: 1,
            },
            reason: { type: "string", maxLength: 1000 },
            evidenceRefs: {
              type: "array",
              items: { type: "string" },
              uniqueItems: true,
            },
          },
        },
      },
    },
  };
}

function referenceReadMetrics(context, subject) {
  const paths = normalizeReferencePaths(context, subject.loadedReferences);
  const charactersByPath = new Map();
  for (const [path, characters] of Object.entries(
    subject.referenceCharacters ?? {},
  )) {
    const normalized = normalizeReferencePath(context, path);
    if (!normalized) continue;
    charactersByPath.set(
      normalized,
      (charactersByPath.get(normalized) ?? 0) + characters,
    );
  }
  return {
    paths,
    characters: [...charactersByPath.values()].reduce(
      (total, value) => total + value,
      0,
    ),
  };
}

function normalizeReferencePaths(context, paths) {
  const normalized = new Set();
  for (const path of paths) {
    const value = normalizeReferencePath(context, path);
    if (value) normalized.add(value);
  }
  return [...normalized].sort();
}

function normalizeReferencePath(context, path) {
  const slashPath = path.replaceAll("\\", "/");
  const referenceIndex = slashPath.lastIndexOf("/references/");
  if (referenceIndex === -1) return null;
  const suffix = slashPath.slice(referenceIndex + 1);
  for (const skillPath of context.condition.skillPaths) {
    const name = basename(skillPath);
    if (slashPath.includes(`/${name}/references/`)) {
      return `${skillPath}/${suffix}`;
    }
  }
  return null;
}

function evidenceRow(id, kind, source, digestInput, excerpt) {
  return {
    id,
    kind,
    source,
    digest: sha256(
      typeof digestInput === "string"
        ? digestInput
        : JSON.stringify(digestInput),
    ),
    ...(excerpt ? { excerpt: boundedText(excerpt, 2000) } : {}),
  };
}

function metric(value, unit, provenance, source) {
  return { value, unit, provenance, source };
}

function unavailable(unit) {
  return {
    value: null,
    unit,
    provenance: "unavailable",
    source: null,
  };
}

function toolAvailability(tools) {
  const available = new Set(tools);
  return {
    model: true,
    filesystem: available.has("Read"),
    edit: available.has("Edit") || available.has("Write"),
    shell: false,
    browser: false,
    network: false,
  };
}

function runId(planItem) {
  return [
    planItem.caseId.toLowerCase(),
    `r${planItem.replication}`,
    planItem.blindLabel,
  ].join("-");
}

function parseStructuredOutput(value) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function redactText(value, context) {
  let text = String(value ?? "");
  if (context?.root) {
    text = text.replaceAll(context.root, "<repository>");
  }
  text = text
    .replaceAll(/\/private\/var\/folders\/[^\s"'`]+/gu, "<workspace>")
    .replaceAll(/\/tmp\/token-eval-claude-[^\s"'`]+/gu, "<workspace>")
    .replaceAll(/\bBearer\s+[A-Za-z0-9._~-]{12,}/gu, "Bearer <redacted>")
    .replaceAll(
      /\b(?:sk|ghp|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{12,}/gu,
      "<redacted>",
    )
    .replaceAll(/\bAKIA[A-Z0-9]{16}\b/gu, "<redacted>");
  return text;
}

function boundedText(value, limit) {
  const text = String(value ?? "");
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 24))}\n[truncated by adapter]`;
}

function boundedNumber(value, minimum, maximum) {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function number(value) {
  return Number.isFinite(value) ? value : 0;
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function isInside(root, path) {
  const rel = relative(resolve(root), resolve(path));
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

function claudeBinary() {
  return process.env.TOKEN_EVAL_CLAUDE_BIN || "claude";
}

function timeoutMs() {
  const configured = Number(process.env.TOKEN_EVAL_CLAUDE_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_TIMEOUT_MS;
}
