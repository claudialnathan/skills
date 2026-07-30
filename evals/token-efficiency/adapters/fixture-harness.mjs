import { createHash } from "node:crypto";

export const manifest = {
  id: "fixture-harness",
  version: "1.0.0",
  testOnly: true,
  harness: {
    name: "deterministic-fixture-harness",
    version: "1.0.0",
  },
  capabilities: {
    activation: true,
    referenceReads: true,
    toolOutput: true,
    usage: false,
  },
  freshSessionPerRun: true,
  supportsExclusiveCatalog: true,
  enforcesBudget: true,
  persistsRawLogs: false,
  uploadsArtifacts: false,
};

const criticalCriteria = [
  "task-mode-authority",
  "scope-preservation",
  "domain-decision",
  "owner-propagation",
  "verification-honesty",
  "safety-runtime",
  "visible-decision-boundary",
];

const scoredCriteria = [
  "evidence-quality",
  "judgment-prioritization",
  "selective-reference-use",
  "implementation-completeness",
  "verification-completeness",
  "actionability",
  "communication-clarity",
  "no-change-restraint",
];

export async function runEvaluation(planItem, context) {
  const traceId = "fixture-trace";
  const checkId = "fixture-check";
  const outputId = "fixture-output";
  const diffId = "fixture-diff";
  const references = loadedReferences(planItem, context.case);
  const activation =
    context.case.expectedActivation === false ? false : true;
  const evidence = [
    evidenceRow(
      traceId,
      "adapter-trace",
      "fixture adapter event stream",
      `${planItem.caseId}:${planItem.conditionId}:trace`,
    ),
    evidenceRow(
      checkId,
      "check",
      "fixture deterministic acceptance",
      `${planItem.caseId}:${planItem.conditionId}:check`,
    ),
    evidenceRow(
      outputId,
      "bounded-output",
      "fixture bounded result",
      `${planItem.caseId}:${planItem.conditionId}:output`,
      "Synthetic evaluator evidence; no model call or quality claim.",
    ),
    evidenceRow(
      diffId,
      "diff",
      "fixture scoped diff",
      `${planItem.caseId}:${planItem.conditionId}:diff`,
    ),
  ];
  return {
    schemaVersion: 1,
    runId: `${planItem.caseId.toLowerCase()}-${planItem.replication}-${planItem.conditionId}`,
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
      toolAvailability: {
        browser: false,
        filesystem: false,
        model: false,
      },
      promptHash: context.promptHash,
    },
    adapterCapabilities: { ...manifest.capabilities },
    evidence,
    metrics: {
      activation: metric(activation, "boolean", "observed", traceId),
      loadedReferences: metric(
        references,
        "paths",
        "observed",
        traceId,
      ),
      loadedReferenceCharacters: metric(
        referenceCharacters(planItem.conditionId, references),
        "characters",
        "observed",
        traceId,
      ),
      toolOutputCharacters: metric(
        92,
        "characters",
        "observed",
        outputId,
      ),
      modelCalls: metric(0, "calls", "observed", traceId),
      inputTokens: unavailable("tokens"),
      cachedInputTokens: unavailable("tokens"),
      outputTokens: unavailable("tokens"),
      totalTokens: unavailable("tokens"),
      currencyCost: unavailable("USD"),
      elapsedMs: metric(1, "milliseconds", "observed", traceId),
      deterministicAcceptance: metric(
        1,
        "fraction",
        "observed",
        checkId,
      ),
      runtimeVerification: unavailable("status"),
    },
    rubric: {
      version: "token-efficiency-v1",
      conditionVisibleToAdjudicator: false,
      criteria: [
        ...criticalCriteria.map((id) => criterion(id, "critical", outputId)),
        ...scoredCriteria.map((id) =>
          criterion(id, "scored", outputId, 4),
        ),
      ],
    },
    status: "completed",
    namespaced: {
      fixture: {
        testOnly: true,
        modelCalls: 0,
      },
    },
  };
}

function loadedReferences(planItem, item) {
  if (item.expectedActivation === false || planItem.conditionId === "no-skill") {
    return [];
  }
  if (planItem.conditionId === "current") {
    if (item.id === "DC-LOAD-001") {
      return [
        "evals/token-efficiency/controls/design-polish/references/polish.md",
        "evals/token-efficiency/controls/design-taste/references/taste.md",
      ];
    }
    return [
      "evals/token-efficiency/controls/design-taste/references/taste.md",
    ];
  }
  return (item.expectedReferences ?? []).map(
    (reference) =>
      `evals/token-efficiency/candidates/design-craft/${reference}`,
  );
}

function referenceCharacters(conditionId, references) {
  if (references.length === 0) return 0;
  if (conditionId === "current") return references.length * 9000;
  return references.length * 5000;
}

function evidenceRow(id, kind, source, digestInput, excerpt) {
  return {
    id,
    kind,
    source,
    digest: sha256(digestInput),
    ...(excerpt ? { excerpt } : {}),
  };
}

function criterion(id, classification, evidenceRef, score) {
  return {
    id,
    class: classification,
    verdict: "pass",
    ...(score === undefined ? {} : { score }),
    confidence: 1,
    adjudicator: {
      kind: "deterministic",
      identity: "fixture-contract-adjudicator",
      version: "1.0.0",
    },
    evidenceRefs: [evidenceRef],
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

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
