import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import {
  basename,
  dirname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { pathToFileURL } from "node:url";
import {
  hashDirectory,
  measureText,
  parseFrontmatter,
} from "./audit.mjs";

export const CRITICAL_CRITERIA = new Set([
  "task-mode-authority",
  "scope-preservation",
  "domain-decision",
  "owner-propagation",
  "verification-honesty",
  "safety-runtime",
  "visible-decision-boundary",
]);

export const SCORED_CRITERIA = new Set([
  "evidence-quality",
  "judgment-prioritization",
  "selective-reference-use",
  "implementation-completeness",
  "verification-completeness",
  "actionability",
  "communication-clarity",
  "no-change-restraint",
]);

const PROVENANCE = new Set([
  "observed",
  "provider-reported",
  "estimated",
  "unavailable",
]);

const CAPABILITY_METRICS = {
  activation: "activation",
  loadedReferences: "referenceReads",
  loadedReferenceCharacters: "referenceReads",
  toolOutputCharacters: "toolOutput",
  inputTokens: "usage",
  cachedInputTokens: "usage",
  outputTokens: "usage",
  totalTokens: "usage",
  currencyCost: "usage",
};

const FORBIDDEN_KEYS = new Set([
  "apikey",
  "authorization",
  "accesstoken",
  "refreshtoken",
  "clientsecret",
  "password",
  "credential",
  "billing",
  "quota",
  "environment",
  "env",
  "stdout",
  "stderr",
  "prompttext",
  "rawprompt",
  "response",
  "rawresponse",
  "rawlog",
  "rawlogs",
  "rawtrace",
  "providertrace",
]);

export function validateOwnerApproval(
  approval,
  { root, corpus, adapterManifest, allowFixture = false } = {},
) {
  const errors = [];
  if (!isPlainObject(approval)) {
    return { errors: ["Approval must be a JSON object."] };
  }
  scanForbiddenKeys(approval, "$", errors);
  if (
    approval.schemaVersion !== 1 ||
    approval.kind !== "token-eval-owner-approval"
  ) {
    errors.push("Approval must use the token-eval-owner-approval v1 schema.");
  }
  for (const field of [
    "approvedBy",
    "approvedAt",
    "model",
    "harness",
    "reasoning",
    "pilotRepetitions",
    "maxFullRunRepetitions",
    "caseIds",
    "conditionIds",
    "budgets",
    "stopCondition",
    "adjudication",
    "unavailableMetrics",
    "permissions",
    "repository",
    "posture",
  ]) {
    if (approval[field] === undefined) errors.push(`Approval is missing ${field}.`);
  }
  if (
    !approval.approvedBy?.trim() ||
    isRequiredPlaceholder(approval.approvedBy)
  ) {
    errors.push("approvedBy must be non-empty and owner-supplied.");
  }
  if (!isDateTime(approval.approvedAt)) {
    errors.push("approvedAt must be an absolute ISO date-time.");
  }
  for (const field of ["provider", "name", "exactVersion"]) {
    if (!approval.model?.[field]?.trim()) {
      errors.push(`Approval model.${field} must be exact and non-empty.`);
    } else if (/^REQUIRED(?:\b|$)/.test(approval.model[field])) {
      errors.push(`Approval model.${field} still contains a template placeholder.`);
    }
  }
  if (/latest|current|default/i.test(approval.model?.exactVersion ?? "")) {
    errors.push("Model exactVersion cannot use latest, current, or default.");
  }
  for (const field of ["name", "version", "adapter", "adapterVersion"]) {
    if (
      !approval.harness?.[field]?.trim() ||
      isRequiredPlaceholder(approval.harness?.[field])
    ) {
      errors.push(`Approval harness.${field} must be exact and non-empty.`);
    }
  }
  if (
    !approval.reasoning?.trim() ||
    isRequiredPlaceholder(approval.reasoning)
  ) {
    errors.push("reasoning must be explicit.");
  }
  for (const field of ["pilotRepetitions", "maxFullRunRepetitions"]) {
    if (!Number.isInteger(approval[field]) || approval[field] < 1) {
      errors.push(`${field} must be a positive integer.`);
    }
  }
  if (!nonEmptyUniqueStrings(approval.caseIds)) {
    errors.push("caseIds must contain unique case IDs.");
  }
  if (
    !nonEmptyUniqueStrings(approval.conditionIds) ||
    approval.conditionIds.length < 2
  ) {
    errors.push("conditionIds must contain at least two unique conditions.");
  }
  for (const id of approval.caseIds ?? []) {
    if (corpus && !corpus.casesById.has(id)) {
      errors.push(`Approval names unknown case ${id}.`);
    }
  }
  for (const id of approval.conditionIds ?? []) {
    if (corpus && !corpus.conditions.has(id)) {
      errors.push(`Approval names unknown condition ${id}.`);
    }
  }
  validateBudgets(approval.budgets, errors);
  if (
    !approval.stopCondition?.trim() ||
    isRequiredPlaceholder(approval.stopCondition)
  ) {
    errors.push("stopCondition must be explicit.");
  }
  validateAdjudication(approval.adjudication, errors);
  for (const id of approval.adjudication?.doubleScoreCaseIds ?? []) {
    if (corpus && !corpus.casesById.has(id)) {
      errors.push(`Adjudication names unknown double-score case ${id}.`);
    }
    if (!approval.caseIds?.includes(id)) {
      errors.push(`Double-score case ${id} must be in the approved pilot.`);
    }
  }
  if (!Array.isArray(approval.unavailableMetrics)) {
    errors.push("unavailableMetrics must be an array.");
  } else {
    for (const [index, metric] of approval.unavailableMetrics.entries()) {
      if (!metric?.metric || !metric?.reason) {
        errors.push(`unavailableMetrics[${index}] needs metric and reason.`);
      }
      if (
        !["mark-unavailable", "exclude-with-explanation"].includes(
          metric?.handling,
        )
      ) {
        errors.push(`unavailableMetrics[${index}] has invalid handling.`);
      }
    }
  }
  if (!Array.isArray(approval.permissions)) {
    errors.push("permissions must be an array.");
  }
  for (const field of [
    "revision",
    "fixtureHash",
    "candidateHash",
    "controlsHash",
  ]) {
    if (!approval.repository?.[field]) {
      errors.push(`Approval repository.${field} is required.`);
    }
  }
  if (root && approval.repository) {
    const evidence = getEvaluationRepositoryEvidence(root);
    for (const field of [
      "revision",
      "fixtureHash",
      "candidateHash",
      "controlsHash",
    ]) {
      if (approval.repository[field] !== evidence[field]) {
        errors.push(
          `Approval repository.${field} does not match the current evaluation state.`,
        );
      }
    }
  }
  if (approval.posture?.hardGate !== "zero-new-critical-failures") {
    errors.push("Pilot hardGate must be zero-new-critical-failures.");
  }
  if (approval.posture?.numericTargets !== "report-only") {
    errors.push("Pilot numeric targets must remain report-only.");
  }
  if (typeof approval.posture?.fullRunAuthorized !== "boolean") {
    errors.push("posture.fullRunAuthorized must be explicit.");
  }
  if (approval.posture?.fullRunAuthorized) {
    if (
      !isDateTime(approval.posture.fullRunApprovedAt) ||
      !Number.isInteger(approval.posture.fullRunRepetitions) ||
      approval.posture.fullRunRepetitions < 1 ||
      !isPlainObject(approval.posture.derivedMargins)
    ) {
      errors.push(
        "A full run needs a second approval date, repetition count, and pilot-derived margins.",
      );
    }
  }
  if (adapterManifest) {
    if (
      approval.harness.adapter !== adapterManifest.id ||
      approval.harness.adapterVersion !== adapterManifest.version ||
      approval.harness.name !== adapterManifest.harness?.name ||
      approval.harness.version !== adapterManifest.harness?.version
    ) {
      errors.push("Approval does not match the selected adapter and harness.");
    }
    if (adapterManifest.testOnly && !allowFixture) {
      errors.push("A test-only adapter cannot run an owner evaluation.");
    }
    for (const [capability, supported] of Object.entries(
      adapterManifest.capabilities ?? {},
    )) {
      if (
        supported === false &&
        !approval.unavailableMetrics?.some(
          (entry) =>
            entry.metric === capability &&
            entry.handling === "mark-unavailable",
        )
      ) {
        errors.push(
          `Approval must record ${capability} as unavailable for this adapter.`,
        );
      }
    }
  }
  return { errors, hash: hashJson(approval) };
}

export function validateRunRecord(record, { corpus, adapterManifest } = {}) {
  const errors = [];
  if (!isPlainObject(record)) {
    return { errors: ["Run record must be a JSON object."] };
  }
  scanForbiddenKeys(record, "$", errors);
  if (record.schemaVersion !== 1) errors.push("Run schemaVersion must be 1.");
  for (const field of [
    "runId",
    "caseId",
    "replication",
    "order",
    "condition",
    "configuration",
    "adapterCapabilities",
    "evidence",
    "metrics",
    "rubric",
    "status",
  ]) {
    if (record[field] === undefined) errors.push(`Run is missing ${field}.`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(record.runId ?? "")) {
    errors.push("runId has an invalid shape.");
  }
  if (!Number.isInteger(record.replication) || record.replication < 1) {
    errors.push("replication must be a positive integer.");
  }
  if (!Number.isInteger(record.order) || record.order < 1) {
    errors.push("order must be a positive integer.");
  }
  const item = corpus?.casesById.get(record.caseId);
  if (corpus && !item) errors.push(`Unknown case ${record.caseId}.`);
  if (
    item &&
    !item.conditionIds.includes(record.condition?.id)
  ) {
    errors.push(
      `${record.caseId} does not permit condition ${record.condition?.id}.`,
    );
  }
  if (
    !/^condition-[a-f0-9]{8}$/.test(record.condition?.blindLabel ?? "") ||
    record.condition?.blindLabel?.includes(record.condition?.id ?? " ")
  ) {
    errors.push("Condition needs an opaque blind label.");
  }
  if (!isSha256(record.condition?.definitionHash)) {
    errors.push("Condition definitionHash must be sha256.");
  }
  validateConfiguration(record.configuration, errors);

  const evidenceIds = new Set();
  if (!Array.isArray(record.evidence)) {
    errors.push("evidence must be an array.");
  } else {
    for (const [index, evidence] of record.evidence.entries()) {
      if (!evidence?.id || evidenceIds.has(evidence.id)) {
        errors.push(`evidence[${index}] has a missing or duplicate ID.`);
      }
      evidenceIds.add(evidence?.id);
      if (!evidence?.kind || !evidence?.source || !isSha256(evidence?.digest)) {
        errors.push(`evidence[${index}] needs kind, source, and digest.`);
      }
      if ((evidence?.excerpt?.length ?? 0) > 2000) {
        errors.push(`evidence[${index}] excerpt exceeds 2000 characters.`);
      }
    }
  }

  if (!isPlainObject(record.adapterCapabilities)) {
    errors.push("adapterCapabilities must be an object.");
  }
  for (const capability of [
    "activation",
    "referenceReads",
    "toolOutput",
    "usage",
  ]) {
    if (typeof record.adapterCapabilities?.[capability] !== "boolean") {
      errors.push(`adapterCapabilities.${capability} must be boolean.`);
    }
    if (
      adapterManifest &&
      record.adapterCapabilities?.[capability] !==
        adapterManifest.capabilities?.[capability]
    ) {
      errors.push(`Run capability ${capability} disagrees with its adapter.`);
    }
  }

  if (!isPlainObject(record.metrics)) {
    errors.push("metrics must be an object.");
  } else {
    for (const [name, metric] of Object.entries(record.metrics)) {
      validateMetric(name, metric, evidenceIds, record, errors);
    }
  }

  validateRubric(record.rubric, evidenceIds, errors);
  if (!["completed", "failed", "unavailable"].includes(record.status)) {
    errors.push("status is invalid.");
  }

  if (item) {
    const expected =
      corpus.expectedCoverage?.[item.coverage] ?? {};
    const criteria = new Set(
      (record.rubric?.criteria ?? []).map((criterion) => criterion.id),
    );
    for (const id of expected.requiredCriticalCriteria ?? []) {
      if (!criteria.has(id)) {
        errors.push(`${record.caseId} is missing required rubric criterion ${id}.`);
      }
    }
    for (const kind of expected.requiredEvidenceKinds ?? []) {
      if (!(record.evidence ?? []).some((evidence) => evidence.kind === kind)) {
        errors.push(`${record.caseId} is missing ${kind} evidence.`);
      }
    }
    if (
      expected.requiredUnavailableMetric &&
      record.metrics?.[expected.requiredUnavailableMetric]?.provenance !==
        "unavailable"
    ) {
      errors.push(
        `${record.caseId} must keep ${expected.requiredUnavailableMetric} unavailable.`,
      );
    }
  }
  return { errors };
}

export function createJudgePacket(record) {
  return {
    schemaVersion: 1,
    runId: `judged-${sha256(record.runId).slice(-16)}`,
    caseId: record.caseId,
    condition: {
      blindLabel: record.condition.blindLabel,
    },
    evidence: (record.evidence ?? []).map((evidence) => ({
      id: evidence.id,
      kind: evidence.kind,
      source: `evidence:${evidence.id}`,
      digest: evidence.digest,
      ...(evidence.excerpt ? { excerpt: evidence.excerpt } : {}),
    })),
    rubricVersion: record.rubric?.version,
  };
}

export function planEvaluation(approval, corpus, seed = 1, mode = "pilot") {
  const repetitions =
    mode === "full"
      ? approval.posture?.fullRunRepetitions
      : approval.pilotRepetitions;
  if (!Number.isInteger(repetitions) || repetitions < 1) {
    throw new Error(`No approved ${mode} repetition count.`);
  }
  if (mode === "full" && !approval.posture?.fullRunAuthorized) {
    throw new Error("Full run is not owner-authorized.");
  }
  const items = [];
  for (const caseId of approval.caseIds) {
    const item = corpus.casesById.get(caseId);
    for (let replication = 1; replication <= repetitions; replication += 1) {
      for (const conditionId of approval.conditionIds) {
        if (!item.conditionIds.includes(conditionId)) continue;
        items.push({
          caseId,
          replication,
          conditionId,
          prompt: item.prompt,
          blindLabel: blindLabel(seed, caseId, replication, conditionId),
        });
      }
    }
  }
  const random = seededRandom(seed);
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [items[index], items[swap]] = [items[swap], items[index]];
  }
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

export async function executeApprovedEvaluation({
  root,
  corpus,
  approval,
  adapterPath,
  seed = 1,
  mode = "pilot",
  outputDirectory,
}) {
  const absoluteAdapterPath = resolve(root, adapterPath);
  const adapter = await import(pathToFileURL(absoluteAdapterPath).href);
  const adapterManifest = adapter.manifest;
  if (!adapterManifest || typeof adapter.runEvaluation !== "function") {
    throw new Error("Adapter must export manifest and runEvaluation.");
  }
  const approvalValidation = validateOwnerApproval(approval, {
    root,
    corpus,
    adapterManifest,
  });
  if (approvalValidation.errors.length > 0) {
    throw new Error(approvalValidation.errors.join("\n"));
  }
  const plan = planEvaluation(approval, corpus, seed, mode);
  const artifactRoot = resolve(
    root,
    outputDirectory ??
      `.artifacts/token-eval/${new Date().toISOString().replaceAll(":", "-")}`,
  );
  mkdirSync(artifactRoot, { recursive: true, mode: 0o700 });
  chmodSync(artifactRoot, 0o700);

  const records = [];
  for (const planItem of plan) {
    const condition = corpus.conditions.get(planItem.conditionId);
    const item = corpus.casesById.get(planItem.caseId);
    const context = {
      root,
      approval,
      approvalHash: approvalValidation.hash,
      adapterManifest,
      case: item,
      condition,
      conditionHash: hashJson(condition),
      promptHash: sha256(item.prompt),
      repository: approval.repository,
      mode,
    };
    let record;
    try {
      record = await adapter.runEvaluation(planItem, context);
    } catch (error) {
      const failurePath = join(artifactRoot, "failure.json");
      writePrivateJson(failurePath, {
        schemaVersion: 1,
        kind: "token-eval-failure",
        failedAt: new Date().toISOString(),
        approvalHash: approvalValidation.hash,
        adapter: {
          id: adapterManifest.id,
          version: adapterManifest.version,
        },
        planItem: {
          caseId: planItem.caseId,
          conditionId: planItem.conditionId,
          replication: planItem.replication,
          order: planItem.order,
        },
        failure:
          error?.tokenEvalFailure ?? {
            reason:
              error instanceof Error
                ? error.message.slice(0, 500)
                : String(error).slice(0, 500),
          },
      });
      throw new Error(
        `${error instanceof Error ? error.message : String(error)} Failure evidence: ${relative(root, failurePath)}`,
        { cause: error },
      );
    }
    const validation = validateRunRecord(record, {
      corpus,
      adapterManifest,
    });
    if (validation.errors.length > 0) {
      throw new Error(
        `${record?.runId ?? planItem.caseId} is invalid:\n${validation.errors.join("\n")}`,
      );
    }
    records.push(record);
    writePrivateJson(join(artifactRoot, `${record.runId}.json`), record);
    writePrivateJson(
      join(artifactRoot, `${record.runId}.judge.json`),
      createJudgePacket(record),
    );
    enforceObservedBudget(records, approval.budgets);
  }
  const comparison = compareRunSet(root, records, corpus);
  writePrivateJson(join(artifactRoot, "comparison.json"), comparison);
  return { artifactRoot, plan, records, comparison };
}

export async function runFixtureBakeoff(root, corpus) {
  const adapterPath = join(
    root,
    "evals/token-efficiency/adapters/fixture-harness.mjs",
  );
  const adapter = await import(pathToFileURL(adapterPath).href);
  const repository = getEvaluationRepositoryEvidence(root);
  const approval = {
    schemaVersion: 1,
    kind: "token-eval-owner-approval",
    approvedBy: "fixture-only",
    approvedAt: "2026-07-28T00:00:00Z",
    model: {
      provider: "none",
      name: "deterministic-fixture",
      exactVersion: "1.0.0",
    },
    harness: {
      name: adapter.manifest.harness.name,
      version: adapter.manifest.harness.version,
      adapter: adapter.manifest.id,
      adapterVersion: adapter.manifest.version,
    },
    reasoning: "none",
    pilotRepetitions: 1,
    maxFullRunRepetitions: 1,
    caseIds: ["DC-LOAD-001"],
    conditionIds: ["current", "candidate"],
    budgets: {
      maxInputTokens: 1,
      maxOutputTokens: 1,
      maxTotalTokens: 1,
      maxCurrency: { amount: 0, currency: "USD" },
    },
    stopCondition: "Stop after the deterministic fixture pair.",
    adjudication: {
      kind: "human",
      identity: "fixture-contract-only",
      version: "1.0.0",
      rubricVersion: corpus.manifest.rubricVersion,
      blind: true,
      doubleScoreCaseIds: [],
    },
    unavailableMetrics: [
      {
        metric: "usage",
        handling: "mark-unavailable",
        reason: "The deterministic fixture makes no model call.",
      },
    ],
    permissions: [],
    repository,
    posture: {
      hardGate: "zero-new-critical-failures",
      numericTargets: "report-only",
      fullRunAuthorized: false,
    },
  };
  const validation = validateOwnerApproval(approval, {
    root,
    corpus,
    adapterManifest: adapter.manifest,
    allowFixture: true,
  });
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join("\n"));
  }
  const plan = planEvaluation(approval, corpus, 17, "pilot");
  const records = [];
  for (const planItem of plan) {
    const condition = corpus.conditions.get(planItem.conditionId);
    const item = corpus.casesById.get(planItem.caseId);
    records.push(
      await adapter.runEvaluation(planItem, {
        root,
        approval,
        approvalHash: validation.hash,
        adapterManifest: adapter.manifest,
        case: item,
        condition,
        conditionHash: hashJson(condition),
        promptHash: sha256(item.prompt),
        repository,
        mode: "fixture",
      }),
    );
  }
  const selective = compareRunSet(root, records, corpus);
  const incompleteRuns = structuredClone(records);
  for (const record of incompleteRuns) {
    record.adapterCapabilities.usage = true;
    record.metrics.totalTokens = {
      value: record.condition.id === "candidate" ? 100 : 200,
      unit: "tokens",
      provenance: "observed",
      source: "fixture-trace",
    };
    if (record.condition.id === "candidate") {
      const criterion = record.rubric.criteria.find(
        (row) => row.id === "domain-decision",
      );
      criterion.verdict = "fail";
    }
  }
  const shorterIncomplete = compareRunSet(root, incompleteRuns, corpus);
  const notJudgedRuns = structuredClone(records);
  const candidate = notJudgedRuns.find(
    (record) => record.condition.id === "candidate",
  );
  const criterion = candidate.rubric.criteria.find(
    (row) => row.id === "verification-honesty",
  );
  criterion.verdict = "not_judged";
  criterion.reason = "Fixture intentionally withholds qualified judgment.";
  criterion.evidenceRefs = [];
  const notJudged = compareRunSet(root, notJudgedRuns, corpus);
  return {
    fixtureOnly: true,
    modelCalls: 0,
    records,
    selective,
    shorterIncomplete,
    notJudged,
  };
}

export function validateControlledRuns(records, corpus) {
  const errors = [];
  if (!Array.isArray(records) || records.length < 2) {
    return { errors: ["A controlled comparison needs at least two runs."] };
  }
  const orders = new Set();
  const approvalHashes = new Set();
  const globalConfigurations = new Set();
  const groups = new Map();
  for (const record of records) {
    const validation = validateRunRecord(record, { corpus });
    errors.push(
      ...validation.errors.map((error) => `${record.runId ?? "run"}: ${error}`),
    );
    if (orders.has(record.order)) errors.push(`Duplicate run order ${record.order}.`);
    orders.add(record.order);
    approvalHashes.add(record.configuration?.approvalHash);
    globalConfigurations.add(
      stableJson({
        model: record.configuration?.model,
        harness: record.configuration?.harness,
        reasoning: record.configuration?.reasoning,
        repository: record.configuration?.repository,
        permissions: record.configuration?.permissions,
        adapterCapabilities: record.adapterCapabilities,
      }),
    );
    const key = `${record.caseId}::${record.replication}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  if (approvalHashes.size !== 1) {
    errors.push("Runs do not share one owner approval.");
  }
  if (globalConfigurations.size !== 1) {
    errors.push(
      "Runs changed model, harness, version, effort, repository, permissions, or adapter observability.",
    );
  }
  for (const [key, group] of groups) {
    const promptHashes = new Set(
      group.map((record) => record.configuration?.promptHash),
    );
    if (promptHashes.size !== 1) {
      errors.push(`${key} changed the initial prompt.`);
    }
    const toolProfiles = new Set(
      group.map((record) =>
        stableJson(record.configuration?.toolAvailability),
      ),
    );
    if (toolProfiles.size !== 1) {
      errors.push(`${key} changed tool availability across conditions.`);
    }
    const conditionIds = new Set();
    const blindLabels = new Set();
    for (const record of group) {
      if (conditionIds.has(record.condition?.id)) {
        errors.push(`${key} repeats condition ${record.condition?.id}.`);
      }
      conditionIds.add(record.condition?.id);
      if (blindLabels.has(record.condition?.blindLabel)) {
        errors.push(`${key} repeats a blind condition label.`);
      }
      blindLabels.add(record.condition?.blindLabel);
    }
  }
  return { errors, groups };
}

export function compareRunSet(root, records, corpus) {
  const controlled = validateControlledRuns(records, corpus);
  if (controlled.errors.length > 0) {
    return {
      assessment: "uncontrolled",
      errors: controlled.errors,
      hardGate: "not-assessed",
    };
  }
  const pairs = [];
  const newCriticalFailures = [];
  const notJudged = [];
  for (const [key, group] of controlled.groups) {
    const current = group.find((record) => record.condition.id === "current");
    const candidate = group.find(
      (record) => record.condition.id === "candidate",
    );
    if (!current || !candidate) continue;
    const currentCriteria = criterionMap(current);
    const candidateCriteria = criterionMap(candidate);
    for (const id of applicableCriticalCriteria(corpus, current.caseId)) {
      const before = currentCriteria.get(id)?.verdict;
      const after = candidateCriteria.get(id)?.verdict;
      if (after === "fail" && before !== "fail") {
        newCriticalFailures.push({
          pair: key,
          criterion: id,
          current: before ?? "missing",
          candidate: after,
        });
      }
      if (
        before === "not_judged" ||
        after === "not_judged" ||
        before === undefined ||
        after === undefined
      ) {
        notJudged.push({
          pair: key,
          criterion: id,
          current: before ?? "missing",
          candidate: after ?? "missing",
        });
      }
    }
    pairs.push({
      key,
      current,
      candidate,
      metrics: comparePairMetrics(current, candidate),
      scoredQuality: {
        current: scoreRun(current),
        candidate: scoreRun(candidate),
      },
    });
  }
  if (pairs.length === 0) {
    return {
      assessment: "inconclusive",
      errors: ["No current/candidate pairs were present."],
      hardGate: "not-assessed",
    };
  }

  const metricSummary = summarizePairMetrics(pairs);
  const deterministicAcceptance = summarizeDeterministicAcceptance(pairs);
  const catalog = compareConditionCatalog(root, corpus);
  let assessment = "inconclusive";
  if (newCriticalFailures.length > 0) {
    assessment = "quality-regression";
  } else if (notJudged.length > 0) {
    assessment = "inconclusive";
  } else if (
    metricSummary.totalTokens.pairs > 0 &&
    metricSummary.totalTokens.candidateMedian <
      metricSummary.totalTokens.currentMedian &&
    deterministicAcceptance.candidate >= deterministicAcceptance.current
  ) {
    assessment = "confirmed-gain";
  } else if (metricSummary.totalTokens.pairs > 0) {
    assessment = "inconclusive-noise";
  }

  return {
    assessment,
    hardGate:
      newCriticalFailures.length > 0
        ? "reject"
        : notJudged.length > 0
          ? "inconclusive"
          : "pass",
    criticalApplicability: "coverage-contract",
    pilotPosture: {
      numericTargets: "report-only",
      retirementAuthority: false,
    },
    pairs: pairs.length,
    newCriticalFailures,
    notJudged,
    deterministicAcceptance,
    metrics: metricSummary,
    standingCatalog: catalog,
    selectiveReferenceReduction: {
      confirmed:
        metricSummary.loadedReferenceCharacters.pairs > 0 &&
        metricSummary.loadedReferenceCharacters.candidateMedian <
          metricSummary.loadedReferenceCharacters.currentMedian,
      provenance: metricSummary.loadedReferenceCharacters.provenance,
    },
    errors: [],
  };
}

function applicableCriticalCriteria(corpus, caseId) {
  const item = corpus?.casesById?.get(caseId);
  const required =
    corpus?.expectedCoverage?.[item?.coverage]?.requiredCriticalCriteria;
  if (!Array.isArray(required) || required.length === 0) {
    return [...CRITICAL_CRITERIA];
  }
  return required.filter((id) => CRITICAL_CRITERIA.has(id));
}

export function renderComparisonHuman(comparison) {
  const lines = [
    `TOKEN EVAL — ${comparison.assessment}`,
    `hard gate: ${comparison.hardGate}`,
  ];
  if (comparison.errors?.length) {
    for (const error of comparison.errors) lines.push(`error: ${error}`);
    return `${lines.join("\n")}\n`;
  }
  lines.push(
    `pairs: ${comparison.pairs}`,
    `new critical failures: ${comparison.newCriticalFailures.length}`,
    `not judged: ${comparison.notJudged.length}`,
    `catalog chars: ${comparison.standingCatalog.current.characters} current → ${comparison.standingCatalog.candidate.characters} candidate`,
  );
  const loaded = comparison.metrics.loadedReferenceCharacters;
  lines.push(
    loaded.pairs > 0
      ? `loaded reference chars: ${loaded.currentMedian} current → ${loaded.candidateMedian} candidate (${loaded.provenance})`
      : "loaded reference chars: unavailable",
  );
  const total = comparison.metrics.totalTokens;
  lines.push(
    total.pairs > 0
      ? `total tokens: ${total.currentMedian} current → ${total.candidateMedian} candidate (${total.provenance})`
      : "total tokens: unavailable",
    "numeric targets: report-only; fixture results are not retirement authority.",
  );
  return `${lines.join("\n")}\n`;
}

export function readRunRecords(path) {
  const absolute = resolve(path);
  if (!existsSync(absolute)) throw new Error(`Run path not found: ${absolute}`);
  if (statSync(absolute).isFile()) {
    const value = JSON.parse(readFileSync(absolute, "utf8"));
    return Array.isArray(value) ? value : [value];
  }
  return readdirSync(absolute, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".json") &&
        !entry.name.endsWith(".judge.json") &&
        entry.name !== "failure.json" &&
        entry.name !== "comparison.json",
    )
    .map((entry) =>
      JSON.parse(readFileSync(join(absolute, entry.name), "utf8")),
    );
}

export function getEvaluationRepositoryEvidence(root) {
  let revision = "unavailable";
  try {
    revision = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    // The explicit value remains unavailable and cannot validate an approval.
  }
  return {
    revision,
    fixtureHash: hashEvaluationFixtures(root),
    candidateHash: hashDirectory(
      join(root, "evals/token-efficiency/candidates/design-craft"),
    ).hash,
    controlsHash: hashDirectory(
      join(root, "evals/token-efficiency/controls"),
    ).hash,
  };
}

export function createApprovalTemplate(root, corpus) {
  const evidence = getEvaluationRepositoryEvidence(root);
  return {
    schemaVersion: 1,
    kind: "token-eval-owner-approval",
    approvedBy: "REQUIRED",
    approvedAt: "REQUIRED ISO DATE-TIME",
    model: {
      provider: "REQUIRED",
      name: "REQUIRED",
      exactVersion: "REQUIRED",
    },
    harness: {
      name: "REQUIRED",
      version: "REQUIRED",
      adapter: "REQUIRED",
      adapterVersion: "REQUIRED",
    },
    reasoning: "REQUIRED",
    pilotRepetitions: 1,
    maxFullRunRepetitions: 1,
    caseIds: corpus.cases
      .filter((item) => item.skill === "design-craft")
      .map((item) => item.id),
    conditionIds: [
      "current",
      "candidate",
      "no-skill",
      "ambient-rule",
      "pre-ship-prompt",
    ],
    budgets: {
      maxInputTokens: 1,
      maxOutputTokens: 1,
      maxTotalTokens: 1,
      maxCurrency: { amount: 0, currency: "USD" },
    },
    stopCondition:
      "REQUIRED explicit stop condition for token, cost, failure, and retry limits",
    adjudication: {
      kind: "REQUIRED human, model, or mixed",
      identity: "REQUIRED",
      version: "REQUIRED",
      rubricVersion: corpus.manifest.rubricVersion,
      blind: true,
      doubleScoreCaseIds: [],
    },
    unavailableMetrics: [],
    permissions: [],
    repository: evidence,
    posture: {
      hardGate: "zero-new-critical-failures",
      numericTargets: "report-only",
      fullRunAuthorized: false,
    },
  };
}

export function writeProtectedDebugLog(
  root,
  relativePath,
  contents,
  retainUntil,
  now = new Date(),
) {
  if (!isDateTime(retainUntil) || new Date(retainUntil) <= now) {
    throw new Error("Debug retention deadline must be an absolute future date-time.");
  }
  const allowedRoot = resolve(root, ".artifacts/token-eval/debug");
  const output = resolve(root, relativePath);
  if (!isInside(allowedRoot, output)) {
    throw new Error("Debug logs must stay under .artifacts/token-eval/debug.");
  }
  mkdirSync(dirname(output), { recursive: true, mode: 0o700 });
  writeFileSync(output, contents, { mode: 0o600, flag: "wx" });
  chmodSync(output, 0o600);
  writePrivateJson(`${output}.retention.json`, {
    retainUntil,
    removeAfter: retainUntil,
    upload: false,
  });
  return output;
}

function validateConfiguration(configuration, errors) {
  if (!isPlainObject(configuration)) {
    errors.push("configuration must be an object.");
    return;
  }
  if (!isSha256(configuration.approvalHash)) {
    errors.push("configuration.approvalHash must be sha256.");
  }
  for (const field of ["provider", "name", "exactVersion"]) {
    if (!configuration.model?.[field]) {
      errors.push(`configuration.model.${field} is required.`);
    }
  }
  for (const field of ["name", "version", "adapter", "adapterVersion"]) {
    if (!configuration.harness?.[field]) {
      errors.push(`configuration.harness.${field} is required.`);
    }
  }
  if (!configuration.reasoning) errors.push("configuration.reasoning is required.");
  for (const field of [
    "revision",
    "fixtureHash",
    "candidateHash",
    "controlsHash",
  ]) {
    if (!configuration.repository?.[field]) {
      errors.push(`configuration.repository.${field} is required.`);
    }
  }
  if (!Array.isArray(configuration.permissions)) {
    errors.push("configuration.permissions must be an array.");
  }
  if (!isPlainObject(configuration.toolAvailability)) {
    errors.push("configuration.toolAvailability must be an object.");
  }
  if (!isSha256(configuration.promptHash)) {
    errors.push("configuration.promptHash must be sha256.");
  }
}

function validateMetric(name, metric, evidenceIds, record, errors) {
  if (!isPlainObject(metric)) {
    errors.push(`metrics.${name} must be an object.`);
    return;
  }
  if (!metric.unit || !PROVENANCE.has(metric.provenance)) {
    errors.push(`metrics.${name} needs a unit and valid provenance.`);
    return;
  }
  if (metric.provenance === "unavailable") {
    if (metric.value !== null || metric.source !== null) {
      errors.push(`metrics.${name} unavailable value and source must be null.`);
    }
  } else {
    if (metric.value === null || metric.value === undefined) {
      errors.push(`metrics.${name} has a value missing for ${metric.provenance}.`);
    }
    if (!metric.source) {
      errors.push(`metrics.${name} requires a source.`);
    }
  }
  if (
    ["observed", "provider-reported"].includes(metric.provenance) &&
    !evidenceIds.has(metric.source)
  ) {
    errors.push(`metrics.${name} points to absent evidence ${metric.source}.`);
  }
  const capability = CAPABILITY_METRICS[name];
  if (
    capability &&
    record.adapterCapabilities?.[capability] === false &&
    metric.provenance !== "unavailable"
  ) {
    errors.push(
      `metrics.${name} must be unavailable because the adapter cannot observe ${capability}.`,
    );
  }
}

function validateRubric(rubric, evidenceIds, errors) {
  if (!isPlainObject(rubric)) {
    errors.push("rubric must be an object.");
    return;
  }
  if (!rubric.version) errors.push("rubric.version is required.");
  if (rubric.conditionVisibleToAdjudicator !== false) {
    errors.push("Condition labels must be hidden from the adjudicator.");
  }
  if (!Array.isArray(rubric.criteria)) {
    errors.push("rubric.criteria must be an array.");
    return;
  }
  const seen = new Set();
  for (const [index, criterion] of rubric.criteria.entries()) {
    if (!criterion?.id || seen.has(criterion.id)) {
      errors.push(`rubric.criteria[${index}] has a missing or duplicate ID.`);
    }
    seen.add(criterion?.id);
    const expectedClass = CRITICAL_CRITERIA.has(criterion?.id)
      ? "critical"
      : SCORED_CRITERIA.has(criterion?.id)
        ? "scored"
        : null;
    if (!expectedClass || criterion.class !== expectedClass) {
      errors.push(`rubric criterion ${criterion?.id} has an invalid class.`);
    }
    if (!["pass", "fail", "not_judged"].includes(criterion?.verdict)) {
      errors.push(`rubric criterion ${criterion?.id} has an invalid verdict.`);
    }
    if (
      criterion.class === "scored" &&
      criterion.verdict !== "not_judged" &&
      (!Number.isFinite(criterion.score) ||
        criterion.score < 0 ||
        criterion.score > 4)
    ) {
      errors.push(`rubric criterion ${criterion.id} needs a score from 0 to 4.`);
    }
    if (
      criterion.verdict === "not_judged" &&
      !criterion.reason?.trim()
    ) {
      errors.push(`rubric criterion ${criterion.id} needs a not_judged reason.`);
    }
    if (
      criterion.verdict !== "not_judged" &&
      (!Array.isArray(criterion.evidenceRefs) ||
        criterion.evidenceRefs.length === 0)
    ) {
      errors.push(`rubric criterion ${criterion.id} needs cited evidence.`);
    }
    for (const reference of criterion.evidenceRefs ?? []) {
      if (!evidenceIds.has(reference)) {
        errors.push(
          `rubric criterion ${criterion.id} cites absent evidence ${reference}.`,
        );
      }
    }
    for (const field of ["kind", "identity", "version"]) {
      if (!criterion.adjudicator?.[field]) {
        errors.push(`rubric criterion ${criterion.id} adjudicator needs ${field}.`);
      }
    }
    if (criterion.adjudicator?.kind === "model") {
      for (const field of [
        "provider",
        "model",
        "harness",
        "effort",
        "promptHash",
      ]) {
        if (!criterion.adjudicator[field]) {
          errors.push(
            `Model adjudicator for ${criterion.id} needs ${field}.`,
          );
        }
      }
    }
  }
}

function validateBudgets(budgets, errors) {
  for (const field of [
    "maxInputTokens",
    "maxOutputTokens",
    "maxTotalTokens",
  ]) {
    if (!Number.isInteger(budgets?.[field]) || budgets[field] < 1) {
      errors.push(`budgets.${field} must be a positive integer.`);
    }
  }
  if (
    Number.isFinite(budgets?.maxInputTokens) &&
    Number.isFinite(budgets?.maxTotalTokens) &&
    budgets.maxTotalTokens < budgets.maxInputTokens
  ) {
    errors.push("maxTotalTokens cannot be below maxInputTokens.");
  }
  if (
    !Number.isFinite(budgets?.maxCurrency?.amount) ||
    budgets.maxCurrency.amount < 0 ||
    !/^[A-Z]{3}$/.test(budgets?.maxCurrency?.currency ?? "")
  ) {
    errors.push("maxCurrency needs a non-negative amount and ISO currency.");
  }
}

function validateAdjudication(adjudication, errors) {
  if (!["human", "model", "mixed"].includes(adjudication?.kind)) {
    errors.push("adjudication.kind must be human, model, or mixed.");
  }
  for (const field of ["identity", "version", "rubricVersion"]) {
    if (
      !adjudication?.[field]?.trim() ||
      isRequiredPlaceholder(adjudication?.[field])
    ) {
      errors.push(`adjudication.${field} is required.`);
    }
  }
  if (adjudication?.blind !== true) {
    errors.push("adjudication must be blind.");
  }
  if (!Array.isArray(adjudication?.doubleScoreCaseIds)) {
    errors.push("adjudication.doubleScoreCaseIds must be an array.");
  } else if (
    adjudication.doubleScoreCaseIds.some(
      (id) => typeof id !== "string" || !id.trim(),
    ) ||
    new Set(adjudication.doubleScoreCaseIds).size !==
      adjudication.doubleScoreCaseIds.length
  ) {
    errors.push(
      "adjudication.doubleScoreCaseIds must contain unique case IDs.",
    );
  }
}

function isRequiredPlaceholder(value) {
  return /\bREQUIRED\b/i.test(String(value ?? ""));
}

function comparePairMetrics(current, candidate) {
  const result = {};
  for (const name of [
    "totalTokens",
    "inputTokens",
    "outputTokens",
    "loadedReferenceCharacters",
    "toolOutputCharacters",
    "elapsedMs",
  ]) {
    const before = current.metrics?.[name];
    const after = candidate.metrics?.[name];
    const comparable =
      before &&
      after &&
      before.provenance !== "unavailable" &&
      after.provenance !== "unavailable" &&
      before.unit === after.unit &&
      Number.isFinite(before.value) &&
      Number.isFinite(after.value);
    result[name] = {
      comparable,
      current: comparable ? before.value : null,
      candidate: comparable ? after.value : null,
      provenance:
        comparable && before.provenance === after.provenance
          ? before.provenance
          : comparable
            ? "mixed"
            : "unavailable",
    };
  }
  return result;
}

function summarizePairMetrics(pairs) {
  const result = {};
  for (const name of [
    "totalTokens",
    "inputTokens",
    "outputTokens",
    "loadedReferenceCharacters",
    "toolOutputCharacters",
    "elapsedMs",
  ]) {
    const rows = pairs.map((pair) => pair.metrics[name]).filter((row) => row.comparable);
    result[name] = {
      pairs: rows.length,
      currentMedian:
        rows.length > 0 ? median(rows.map((row) => row.current)) : null,
      candidateMedian:
        rows.length > 0 ? median(rows.map((row) => row.candidate)) : null,
      provenance:
        rows.length === 0
          ? "unavailable"
          : new Set(rows.map((row) => row.provenance)).size === 1
            ? rows[0].provenance
            : "mixed",
    };
  }
  return result;
}

function summarizeDeterministicAcceptance(pairs) {
  const current = [];
  const candidate = [];
  for (const pair of pairs) {
    const before = pair.current.metrics?.deterministicAcceptance;
    const after = pair.candidate.metrics?.deterministicAcceptance;
    if (
      before?.provenance !== "unavailable" &&
      after?.provenance !== "unavailable" &&
      Number.isFinite(before?.value) &&
      Number.isFinite(after?.value)
    ) {
      current.push(before.value);
      candidate.push(after.value);
    }
  }
  return {
    current: current.length > 0 ? median(current) : null,
    candidate: candidate.length > 0 ? median(candidate) : null,
    pairs: current.length,
  };
}

function compareConditionCatalog(root, corpus) {
  const current = measureConditionCatalog(root, corpus.conditions.get("current"));
  const candidate = measureConditionCatalog(
    root,
    corpus.conditions.get("candidate"),
  );
  return {
    current,
    candidate,
    deltaCharacters: candidate.characters - current.characters,
    deterministicReduction: candidate.characters < current.characters,
    provenance: "observed",
    source: "condition frontmatter",
  };
}

function measureConditionCatalog(root, condition) {
  let characters = 0;
  let entries = 0;
  for (const path of condition?.skillPaths ?? []) {
    const source = readFileSync(join(root, path, "SKILL.md"), "utf8");
    const frontmatter = parseFrontmatter(source);
    const text = `${frontmatter.description ?? ""}${frontmatter.when_to_use ?? ""}`;
    characters += measureText(text).characters;
    entries += 1;
  }
  return { characters, entries };
}

function scoreRun(record) {
  const scores = (record.rubric?.criteria ?? [])
    .filter(
      (criterion) =>
        criterion.class === "scored" && Number.isFinite(criterion.score),
    )
    .map((criterion) => criterion.score);
  return {
    total: scores.reduce((sum, score) => sum + score, 0),
    criteria: scores.length,
  };
}

function criterionMap(record) {
  return new Map(
    (record.rubric?.criteria ?? []).map((criterion) => [
      criterion.id,
      criterion,
    ]),
  );
}

function enforceObservedBudget(records, budgets) {
  const totals = { inputTokens: 0, outputTokens: 0, totalTokens: 0, currencyCost: 0 };
  for (const record of records) {
    for (const name of Object.keys(totals)) {
      const metric = record.metrics?.[name];
      if (
        metric &&
        metric.provenance !== "unavailable" &&
        Number.isFinite(metric.value)
      ) {
        totals[name] += metric.value;
      }
    }
  }
  if (totals.inputTokens > budgets.maxInputTokens) {
    throw new Error("Observed input-token budget exceeded.");
  }
  if (totals.outputTokens > budgets.maxOutputTokens) {
    throw new Error("Observed output-token budget exceeded.");
  }
  if (totals.totalTokens > budgets.maxTotalTokens) {
    throw new Error("Observed total-token budget exceeded.");
  }
  if (totals.currencyCost > budgets.maxCurrency.amount) {
    throw new Error("Observed currency budget exceeded.");
  }
}

function hashEvaluationFixtures(root) {
  const paths = [
    "evals/token-efficiency/manifest.json",
    "evals/token-efficiency/rubric.md",
    "evals/token-efficiency/cases",
    "evals/token-efficiency/expected",
    "evals/token-efficiency/conditions",
    "evals/token-efficiency/surfaces",
    "evals/token-efficiency/fixtures/design-craft",
    "evals/token-efficiency/adapters",
    "tooling/token-audit",
    "bin/token-eval",
  ];
  const hash = createHash("sha256");
  for (const path of paths) {
    const absolute = join(root, path);
    if (statSync(absolute).isDirectory()) {
      const measured = hashDirectory(absolute);
      hash.update(path);
      hash.update("\0");
      hash.update(measured.hash);
      hash.update("\0");
    } else {
      hash.update(path);
      hash.update("\0");
      hash.update(readFileSync(absolute));
      hash.update("\0");
    }
  }
  return `sha256:${hash.digest("hex")}`;
}

function writePrivateJson(path, value) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  chmodSync(path, 0o600);
}

function scanForbiddenKeys(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      scanForbiddenKeys(item, `${path}[${index}]`, errors),
    );
    return;
  }
  if (typeof value === "string") {
    if (
      /\bBearer\s+[A-Za-z0-9._~-]{12,}/u.test(value) ||
      /\b(?:sk|ghp|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{12,}/u.test(
        value,
      ) ||
      /\bAKIA[A-Z0-9]{16}\b/u.test(value) ||
      /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/u.test(value)
    ) {
      errors.push(`${path} contains a secret-like value.`);
    }
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase().replaceAll(/[^a-z]/g, "");
    if (FORBIDDEN_KEYS.has(normalized)) {
      errors.push(`${path}.${key} is forbidden in persisted evaluation data.`);
    }
    scanForbiddenKeys(child, `${path}.${key}`, errors);
  }
}

function blindLabel(seed, caseId, replication, conditionId) {
  return `condition-${createHash("sha256")
    .update(`${seed}:${caseId}:${replication}:${conditionId}`)
    .digest("hex")
    .slice(0, 8)}`;
}

function seededRandom(seed) {
  let state = Number(seed) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function hashJson(value) {
  return sha256(stableJson(value));
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isInside(parent, child) {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !rel.startsWith(sep));
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isSha256(value) {
  return /^sha256:[a-f0-9]{64}$/.test(value ?? "");
}

function isDateTime(value) {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value)) &&
    /T/.test(value)
  );
}

function nonEmptyUniqueStrings(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === "string" && entry.length > 0) &&
    new Set(value).size === value.length
  );
}
