#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  buildStaticReport,
  hashDirectory,
  measureText,
  parseFrontmatter,
  validateExceptions,
} from "../../tooling/token-audit/audit.mjs";
import {
  compareToBaseline,
  createBaseline,
  readAndValidateBaseline,
  writeBaseline,
} from "../../tooling/token-audit/baseline.mjs";
import { validateCandidatePackage } from "../../tooling/token-audit/candidate.mjs";
import { validateCheckpoint2 } from "../../tooling/token-audit/checkpoint2.mjs";
import { loadEvaluationCorpus } from "../../tooling/token-audit/corpus.mjs";
import {
  CRITICAL_CRITERIA,
  SCORED_CRITERIA,
  compareRunSet,
  createApprovalTemplate,
  createJudgePacket,
  executeApprovedEvaluation,
  planEvaluation,
  readRunRecords,
  runFixtureBakeoff,
  validateControlledRuns,
  validateOwnerApproval,
  validateRunRecord,
  writeProtectedDebugLog,
} from "../../tooling/token-audit/evaluation.mjs";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const temporaryRoot = mkdtempSync(join(tmpdir(), "token-audit-test-"));

process.on("exit", () => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

const tests = [];

test("parses block, folded, quoted, and unquoted frontmatter", () => {
  const fixtureRoot = join(
    repositoryRoot,
    "evals/token-efficiency/fixtures/frontmatter",
  );
  const block = parseFrontmatter(
    readFileSync(join(fixtureRoot, "block-scalar.md"), "utf8"),
  );
  equal(block.description, "First line.\nSecond line.");
  equal(block.when_to_use, "Use for parser fixture coverage.");

  const quoted = parseFrontmatter(
    readFileSync(join(fixtureRoot, "quoted.md"), "utf8"),
  );
  equal(quoted.description, "Quoted description with a colon: retained.");
  equal(
    quoted.when_to_use,
    "Single-quoted value with 'apostrophe' coverage.",
  );

  const single = parseFrontmatter(
    readFileSync(join(fixtureRoot, "single-line.md"), "utf8"),
  );
  equal(single.description, "One unquoted line.");
  equal(single.when_to_use, "Another unquoted line.");
});

test("counts fenced Markdown as body text without leaking it into frontmatter", () => {
  const source = readFileSync(
    join(
      repositoryRoot,
      "evals/token-efficiency/fixtures/frontmatter/fenced-code.md",
    ),
    "utf8",
  );
  const frontmatter = parseFrontmatter(source);
  equal(frontmatter.name, "fenced-code");
  assert(!frontmatter.description.includes("not-a-route"));
  const measured = measureText(source);
  assert(measured.characters > frontmatter.description.length);
  equal(measured.estimatedTokens.provenance, "estimated");
  equal(measured.estimatedTokens.source, "chars-div-4@1");
});

test("keeps hard limits distinct from advisory review thresholds", () => {
  const budgets = JSON.parse(
    readFileSync(
      join(repositoryRoot, "tooling/token-audit/budgets.json"),
      "utf8",
    ),
  );
  equal(budgets.hardSpecificationLimits["catalog.descriptionChars"], 1024);
  equal(
    budgets.advisoryReviewThresholds["catalog.descriptionChars"],
    700,
  );
  assert(
    budgets.hardSpecificationLimits["catalog.descriptionChars"] >
      budgets.advisoryReviewThresholds["catalog.descriptionChars"],
  );
});

test("requires exact, evidenced, absolutely dated advisory exceptions", () => {
  const fixtureRoot = join(
    repositoryRoot,
    "evals/token-efficiency/fixtures/exceptions",
  );
  const valid = validateExceptions(
    JSON.parse(readFileSync(join(fixtureRoot, "valid.json"), "utf8")),
  );
  equal(valid.errors.length, 0);
  const invalid = validateExceptions(
    JSON.parse(
      readFileSync(join(fixtureRoot, "invalid-wildcard.json"), "utf8"),
    ),
  );
  assert(invalid.errors.some((error) => error.includes("wildcards")));
});

test("reports missing references and duplicate canonical names as errors", () => {
  const fixture = createRepository("invalid-static");
  writeSkill(fixture, "alpha", "same-name", {
    body: "Read references/missing.md.\n",
  });
  writeSkill(fixture, "beta", "same-name");
  writeManifests(fixture, ["alpha", "beta"]);
  const report = buildStaticReport(fixture, { scope: "all" });
  assert(report.findings.some((finding) => finding.id === "TE001"));
  assert(report.findings.some((finding) => finding.id === "TE006"));
  assert(report.summary.errors >= 2);
});

test("keeps catalog, router, route, prompt, and command-risk surfaces separate", () => {
  const fixture = createRepository("surface-separation");
  writeSkill(fixture, "alpha", "alpha", {
    reference: "# Reference\n",
    openAi:
      'interface:\n  short_description: "Alpha"\n  default_prompt: "Review alpha."\n',
    script: "#!/usr/bin/env node\nconsole.log('fixture')\n",
  });
  writeManifests(fixture, ["alpha"]);
  const report = buildStaticReport(fixture, { scope: "all" });
  equal(report.catalog.length, 1);
  equal(report.mainFiles.length, 1);
  equal(report.routeBundles.length, 1);
  equal(report.routeBundles[0].declaredReferences.length, 1);
  equal(report.generatedPrompts.length, 1);
  assert(report.commandOutputRisks.some((row) => row.surface === "skill-script"));
  assert(!("actualLoadedReferences" in report.routeBundles[0]));
  assert(
    report.commandOutputRisks.every((row) => !("actualOutput" in row)),
  );
});

test("changed scope combines a clean base diff with working-tree edits", () => {
  const fixture = createRepository("changed-scope");
  writeSkill(fixture, "alpha", "alpha");
  writeSkill(fixture, "beta", "beta");
  writeManifests(fixture, ["alpha", "beta"]);
  runGit(fixture, ["init"]);
  runGit(fixture, ["config", "user.email", "fixture@example.test"]);
  runGit(fixture, ["config", "user.name", "Fixture"]);
  runGit(fixture, ["add", "."]);
  runGit(fixture, ["commit", "-m", "baseline"]);
  const base = runGit(fixture, ["rev-parse", "HEAD"]).trim();

  const betaPath = join(fixture, "skills/design/beta/SKILL.md");
  writeFileSync(
    betaPath,
    `${readFileSync(betaPath, "utf8")}\nClean committed change.\n`,
  );
  runGit(fixture, ["add", betaPath]);
  runGit(fixture, ["commit", "-m", "change beta"]);

  const alphaPath = join(fixture, "skills/design/alpha/SKILL.md");
  writeFileSync(
    alphaPath,
    `${readFileSync(alphaPath, "utf8")}\nDirty working-tree change.\n`,
  );

  const report = buildStaticReport(fixture, {
    scope: "changed",
    changedBase: base,
  });
  equal(report.source.changedBase, base);
  equal(
    JSON.stringify(report.catalog.map((row) => row.name).sort()),
    JSON.stringify(["alpha", "beta"]),
  );

  const invalid = buildStaticReport(fixture, {
    scope: "changed",
    changedBase: "missing-base",
  });
  assert(invalid.findings.some((finding) => finding.id === "TE011"));
  equal(invalid.assessment, "assessment-error");
});

test("requires a reason to write a baseline and detects tampering", () => {
  const fixture = createRepository("baseline");
  writeSkill(fixture, "alpha", "alpha");
  writeSkill(fixture, "design-polish", "design-polish");
  writeSkill(fixture, "design-taste", "design-taste");
  writeManifests(fixture, ["alpha", "design-polish", "design-taste"]);
  const report = buildStaticReport(fixture, { scope: "all" });
  throws(() => createBaseline(fixture, report, ""), /reason/);
  const baseline = createBaseline(fixture, report, "Fixture baseline");
  const baselinePath = join(fixture, "baseline.json");
  writeBaseline(baselinePath, baseline);
  const reloaded = readAndValidateBaseline(baselinePath);
  const comparison = compareToBaseline(fixture, report, reloaded);
  assert(comparison.controlsUnchanged);

  const tampered = JSON.parse(readFileSync(baselinePath, "utf8"));
  tampered.report.summary.catalogCharacters += 1;
  writeFileSync(baselinePath, `${JSON.stringify(tampered, null, 2)}\n`);
  throws(
    () => readAndValidateBaseline(baselinePath),
    /report hash mismatch/,
  );
});

test("reports machine-local duplicate registrations without changing them", () => {
  const fixture = createRepository("installed");
  writeSkill(fixture, "alpha", "alpha");
  writeManifests(fixture, ["alpha"]);
  const fakeHome = join(fixture, "home");
  mkdirSync(join(fakeHome, ".agents/skills"), { recursive: true });
  mkdirSync(join(fakeHome, ".codex/plugins/cache/example/skills"), {
    recursive: true,
  });
  symlinkSync(
    join(fixture, "skills/design/alpha"),
    join(fakeHome, ".agents/skills/alpha"),
  );
  cpSync(
    join(fixture, "skills/design/alpha"),
    join(fakeHome, ".codex/plugins/cache/example/skills/alpha"),
    { recursive: true },
  );
  const before = hashDirectory(fakeHome).hash;
  const priorHome = process.env.TOKEN_AUDIT_HOME;
  process.env.TOKEN_AUDIT_HOME = fakeHome;
  const report = buildStaticReport(fixture, {
    scope: "all",
    installed: true,
  });
  if (priorHome === undefined) delete process.env.TOKEN_AUDIT_HOME;
  else process.env.TOKEN_AUDIT_HOME = priorHome;
  const after = hashDirectory(fakeHome).hash;
  assert(
    report.installedDuplicates.some(
      (row) => row.name === "alpha" && row.harness === "codex",
    ),
  );
  equal(before, after);
});

test("token-eval refuses live or frozen control drift", () => {
  const fixture = createRepository("controls");
  for (const name of ["design-polish", "design-taste"]) {
    writeSkill(fixture, name, name);
    const controlPath = join(
      fixture,
      `evals/token-efficiency/controls/${name}`,
    );
    cpSync(join(fixture, `skills/design/${name}`), controlPath, {
      recursive: true,
    });
  }
  const controls = ["design-polish", "design-taste"].map((name) => ({
    name,
    livePath: `skills/design/${name}`,
    controlPath: `evals/token-efficiency/controls/${name}`,
    expectedHash: hashDirectory(join(fixture, `skills/design/${name}`)).hash,
  }));
  writeJson(
    join(fixture, "evals/token-efficiency/controls/controls.json"),
    { schemaVersion: 1, controls },
  );

  let result = spawnSync(join(repositoryRoot, "bin/token-eval"), [
    "--verify-controls",
  ], {
    encoding: "utf8",
    env: { ...process.env, TOKEN_AUDIT_ROOT: fixture },
  });
  equal(result.status, 0);

  writeFileSync(
    join(fixture, "skills/design/design-polish/drift.txt"),
    "drift\n",
  );
  result = spawnSync(join(repositoryRoot, "bin/token-eval"), [
    "--verify-controls",
  ], {
    encoding: "utf8",
    env: { ...process.env, TOKEN_AUDIT_ROOT: fixture },
  });
  equal(result.status, 1);
  assert(result.stdout.includes("live DRIFT"));
});

test("validates the isolated design-craft candidate without publishing it", () => {
  const candidate = join(
    repositoryRoot,
    "evals/token-efficiency/candidates/design-craft",
  );
  const result = validateCandidatePackage(candidate);
  equal(result.name, "design-craft");
  equal(result.errors.length, 0);
  const source = readFileSync(join(candidate, "SKILL.md"), "utf8");
  for (const mode of [
    "Ambient:",
    "Findings:",
    "Proposal:",
    "Approved implementation:",
    "No change:",
  ]) {
    assert(source.includes(mode), `Missing candidate mode ${mode}`);
  }
  const openAi = readFileSync(join(candidate, "agents/openai.yaml"), "utf8");
  assert(openAi.includes("allow_implicit_invocation: true"));
});

test("runs checkpoint 2 probes without claiming runtime observations", () => {
  const result = validateCheckpoint2(repositoryRoot);
  equal(result.errors.length, 0);
  equal(result.harness.modelCalls.value, 0);
  equal(result.cases.length, 6);
  for (const probeCase of result.cases) {
    equal(probeCase.status, "pass");
    equal(probeCase.activation.provenance, "unavailable");
    equal(probeCase.loadedReferences.provenance, "unavailable");
  }
});

test("covers every initial skill and replacement route in the Phase 3 corpus", () => {
  const corpus = loadEvaluationCorpus(repositoryRoot);
  equal(corpus.errors.length, 0);
  equal(corpus.summary.skills, 12);
  equal(corpus.summary.cases, 62);
  equal(corpus.summary.adapters, 2);
  for (const name of Object.keys(corpus.expectedSkills)) {
    const coverage = new Set(
      corpus.cases
        .filter((item) => item.skill === name)
        .map((item) => item.coverage),
    );
    for (const required of corpus.manifest.requiredCoverage) {
      assert(coverage.has(required), `${name} lacks ${required}`);
    }
  }
  const experiments = new Set(corpus.cases.map((item) => item.experiment));
  for (const expected of [
    "routing",
    "execution",
    "progressive-reference",
    "generated-prompt",
  ]) {
    assert(experiments.has(expected));
  }
});

test("keeps design-craft references selective after the pilot trace", () => {
  const corpus = loadEvaluationCorpus(repositoryRoot);
  const expected = {
    "DC-AUDIT-001": {
      expected: ["references/judgment.md"],
      forbidden: ["references/finish.md"],
    },
    "DC-IMPLEMENT-001": {
      expected: [],
      forbidden: ["references/judgment.md", "references/finish.md"],
    },
    "DC-BOUNDARY-001": {
      expected: ["references/judgment.md"],
      forbidden: ["references/finish.md"],
    },
    "DC-LOAD-001": {
      expected: ["references/finish.md"],
      forbidden: ["references/judgment.md"],
    },
    "DC-RUNTIME-001": {
      expected: ["references/judgment.md"],
      forbidden: ["references/finish.md"],
    },
  };
  for (const [caseId, route] of Object.entries(expected)) {
    const item = corpus.casesById.get(caseId);
    assert(item, `Missing ${caseId}`);
    equal(JSON.stringify(item.expectedReferences), JSON.stringify(route.expected));
    equal(
      JSON.stringify(item.forbiddenReferences),
      JSON.stringify(route.forbidden),
    );
  }
});

test("requires a complete owner checkpoint before dynamic execution", () => {
  const corpus = loadEvaluationCorpus(repositoryRoot);
  const template = createApprovalTemplate(repositoryRoot, corpus);
  const result = validateOwnerApproval(template, {
    root: repositoryRoot,
    corpus,
  });
  assert(result.errors.some((error) => error.includes("approvedAt")));
  assert(result.errors.some((error) => error.includes("exactVersion")));
  assert(result.errors.some((error) => error.includes("adjudication.kind")));
  const command = spawnSync(join(repositoryRoot, "bin/token-eval"), ["--run"], {
    encoding: "utf8",
  });
  equal(command.status, 2);
  assert(command.stderr.includes("--approval is required"));
});

test("randomizes and replicates condition order reproducibly", () => {
  const corpus = loadEvaluationCorpus(repositoryRoot);
  const approval = createApprovalTemplate(repositoryRoot, corpus);
  approval.caseIds = ["DC-LOAD-001"];
  approval.conditionIds = ["current", "candidate"];
  approval.pilotRepetitions = 2;
  const first = planEvaluation(approval, corpus, 42, "pilot");
  const second = planEvaluation(approval, corpus, 42, "pilot");
  equal(JSON.stringify(first), JSON.stringify(second));
  equal(first.length, 4);
  equal(new Set(first.map((item) => item.blindLabel)).size, 4);
  assert(
    first.every(
      (item) => !item.blindLabel.includes(item.conditionId),
    ),
  );
});

test("fixture bakeoff rejects incomplete brevity and preserves inconclusive truth", async () => {
  const corpus = loadEvaluationCorpus(repositoryRoot);
  const fixture = await runFixtureBakeoff(repositoryRoot, corpus);
  equal(fixture.modelCalls, 0);
  equal(fixture.selective.selectiveReferenceReduction.confirmed, true);
  equal(fixture.selective.metrics.totalTokens.provenance, "unavailable");
  equal(fixture.selective.assessment, "inconclusive");
  equal(fixture.shorterIncomplete.assessment, "quality-regression");
  equal(fixture.shorterIncomplete.hardGate, "reject");
  equal(fixture.notJudged.assessment, "inconclusive");
  equal(fixture.selective.standingCatalog.deterministicReduction, true);
});

test("hard-gates only critical criteria applicable to each coverage contract", async () => {
  const corpus = loadEvaluationCorpus(repositoryRoot);
  const fixture = await runFixtureBakeoff(repositoryRoot, corpus);
  const auditRecords = structuredClone(fixture.records);
  for (const record of auditRecords) {
    record.caseId = "DC-AUDIT-001";
    record.runId = `dc-audit-applicability-${record.condition.id}`;
  }
  const auditCurrent = auditRecords.find(
    (record) => record.condition.id === "current",
  );
  const auditOwner = auditCurrent.rubric.criteria.find(
    (criterion) => criterion.id === "owner-propagation",
  );
  auditOwner.verdict = "not_judged";
  auditOwner.reason =
    "Owner propagation is outside the audit coverage contract.";
  auditOwner.evidenceRefs = [];

  const auditComparison = compareRunSet(
    repositoryRoot,
    auditRecords,
    corpus,
  );
  equal(auditComparison.hardGate, "pass");
  equal(auditComparison.notJudged.length, 0);

  const implementationRecords = structuredClone(fixture.records);
  for (const record of implementationRecords) {
    record.caseId = "DC-IMPLEMENT-001";
    record.runId = `dc-implementation-applicability-${record.condition.id}`;
  }
  const implementationCandidate = implementationRecords.find(
    (record) => record.condition.id === "candidate",
  );
  const implementationOwner = implementationCandidate.rubric.criteria.find(
    (criterion) => criterion.id === "owner-propagation",
  );
  implementationOwner.verdict = "not_judged";
  implementationOwner.reason =
    "Fixture intentionally withholds required owner-propagation judgment.";
  implementationOwner.evidenceRefs = [];

  const implementationComparison = compareRunSet(
    repositoryRoot,
    implementationRecords,
    corpus,
  );
  equal(implementationComparison.hardGate, "inconclusive");
  assert(
    implementationComparison.notJudged.some(
      (row) =>
        row.pair === "DC-IMPLEMENT-001::1" &&
        row.criterion === "owner-propagation",
    ),
  );
});

test("validates provenance and hides condition labels from judge packets", async () => {
  const corpus = loadEvaluationCorpus(repositoryRoot);
  const fixture = await runFixtureBakeoff(repositoryRoot, corpus);
  const record = fixture.records[0];
  equal(validateRunRecord(record, { corpus }).errors.length, 0);
  const packet = createJudgePacket(record);
  assert(!("id" in packet.condition));
  assert(!JSON.stringify(packet).includes(record.condition.id));

  const invalid = structuredClone(record);
  invalid.metrics.loadedReferenceCharacters.source = "missing-evidence";
  const result = validateRunRecord(invalid, { corpus });
  assert(
    result.errors.some((error) => error.includes("absent evidence")),
  );

  const polluted = structuredClone(record);
  polluted.namespaced.fixture.apiKey = "not-a-real-secret";
  const pollutedResult = validateRunRecord(polluted, { corpus });
  assert(
    pollutedResult.errors.some((error) => error.includes("forbidden")),
  );

  const failedRunDirectory = join(temporaryRoot, "failed-run-records");
  mkdirSync(failedRunDirectory, { recursive: true });
  writeFileSync(
    join(failedRunDirectory, `${record.runId}.json`),
    `${JSON.stringify(record)}\n`,
  );
  writeFileSync(
    join(failedRunDirectory, "failure.json"),
    `${JSON.stringify({ kind: "token-eval-failure" })}\n`,
  );
  equal(readRunRecords(failedRunDirectory).length, 1);
});

test("rejects uncontrolled model or effort changes", async () => {
  const corpus = loadEvaluationCorpus(repositoryRoot);
  const fixture = await runFixtureBakeoff(repositoryRoot, corpus);
  const records = structuredClone(fixture.records);
  records[0].configuration.reasoning = "different";
  const result = validateControlledRuns(records, corpus);
  assert(
    result.errors.some((error) =>
      error.includes("model, harness, version, effort"),
    ),
  );
});

test("scopes tool availability to each case while preserving condition parity", async () => {
  const corpus = loadEvaluationCorpus(repositoryRoot);
  const fixture = await runFixtureBakeoff(repositoryRoot, corpus);

  const crossCase = structuredClone(fixture.records);
  crossCase[1].caseId = "DC-AUDIT-001";
  crossCase[1].runId = "dc-audit-001-r1-condition-fixture";
  crossCase[1].configuration.toolAvailability.edit = true;
  equal(validateControlledRuns(crossCase, corpus).errors.length, 0);

  const withinCase = structuredClone(fixture.records);
  withinCase[1].configuration.toolAvailability.edit = true;
  const result = validateControlledRuns(withinCase, corpus);
  assert(
    result.errors.some((error) =>
      error.includes("changed tool availability across conditions"),
    ),
  );
});

test("runs the Claude stream adapter against a zero-spend fake harness", async () => {
  const corpus = loadEvaluationCorpus(repositoryRoot);
  const adapter = await import(
    pathToFileURL(
      join(
        repositoryRoot,
        "evals/token-efficiency/adapters/claude-code-stream.mjs",
      ),
    ).href
  );
  const fakeClaude = join(temporaryRoot, "fake-claude.mjs");
  const criteria = [
    ...CRITICAL_CRITERIA,
    ...SCORED_CRITERIA,
  ];
  writeFileSync(
    fakeClaude,
    `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes("--version")) {
  process.stdout.write("2.1.220\\n");
  process.exit(0);
}
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? "" : args[index + 1] ?? "";
};
const model = valueAfter("--model");
const tools = valueAfter("--tools").split(",").filter(Boolean);
const conditionContext = args.includes("--add-dir");
const judge = args.includes("--json-schema");
const exposedTools =
  judge || process.env.TOKEN_EVAL_FAKE_SUBJECT_STRUCTURED_TOOL === "1"
    ? [...tools, "StructuredOutput"]
    : tools;
const settings = JSON.parse(valueAfter("--settings"));
if (
  !args.includes("--safe-mode") ||
  valueAfter("--setting-sources") !== "" ||
  Object.keys(settings.enabledPlugins ?? {}).length !== 0 ||
  valueAfter("--prompt-suggestions") !== "false" ||
  process.env.CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION !== "false" ||
  process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL !== model ||
  process.env.ANTHROPIC_SMALL_FAST_MODEL !== model ||
  !args.includes("--disable-slash-commands")
) {
  process.stderr.write("missing exclusive settings isolation\\n");
  process.exit(2);
}
const emit = (value) => process.stdout.write(JSON.stringify(value) + "\\n");
emit({
  type: "system",
  subtype: "init",
  model,
  tools: exposedTools,
  plugins:
    process.env.TOKEN_EVAL_FAKE_PLUGIN === "1"
      ? [{ name: "unexpected-fixture", path: "/withheld" }]
      : [],
});
if (!judge) {
  emit({
    type: "assistant",
    message: {
      model,
      content: conditionContext
        ? [
            {
              type: "tool_use",
              id: "read-reference",
              name: "Read",
              input: {
                file_path: "/tmp/skills/design-craft/references/judgment.md",
              },
            },
          ]
        : [],
    },
  });
  emit({
    type: "user",
    message: {
      content: [
        {
          type: "tool_result",
          tool_use_id: "read-reference",
          content: "bounded fixture tool evidence",
        },
      ],
    },
  });
}
const usage = {
  input_tokens: 20,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
  output_tokens: 5,
};
const judgment = {
  criteria: ${JSON.stringify(criteria)}.map((id) => ({
    id,
    verdict: "pass",
    score: ${JSON.stringify([...SCORED_CRITERIA])}.includes(id) ? 3 : null,
    confidence: 0.8,
    reason: "Retained fixture evidence supports this verdict.",
    evidenceRefs: ["subject-output"],
  })),
};
emit({
  type: "result",
  subtype: "success",
  result: judge
    ? JSON.stringify(judgment)
    : "The source suggests competing emphasis. Rendered behavior remains unverified.",
  structured_output: judge ? judgment : undefined,
  usage,
  total_cost_usd: 0.01,
  num_turns: 1,
  modelUsage: { [process.env.TOKEN_EVAL_FAKE_RESULT_MODEL || model]: {} },
});
`,
  );
  chmodSync(fakeClaude, 0o700);

  const approval = createApprovalTemplate(repositoryRoot, corpus);
  Object.assign(approval, {
    approvedBy: "adapter-test",
    approvedAt: "2026-07-28T00:00:00Z",
    model: {
      provider: "Anthropic",
      name: "Claude test",
      exactVersion: "claude-test-1",
    },
    harness: {
      name: adapter.manifest.harness.name,
      version: adapter.manifest.harness.version,
      adapter: adapter.manifest.id,
      adapterVersion: adapter.manifest.version,
    },
    reasoning: "high",
    pilotRepetitions: 1,
    maxFullRunRepetitions: 1,
    caseIds: ["DC-AUDIT-001"],
    conditionIds: ["candidate", "no-skill"],
    budgets: {
      maxInputTokens: 1000,
      maxOutputTokens: 1000,
      maxTotalTokens: 2000,
      maxCurrency: { amount: 1, currency: "USD" },
    },
    stopCondition: "Stop before retries or any approved budget is exceeded.",
    adjudication: {
      kind: "model",
      identity: "fake-blind-judge",
      version: "1.0.0",
      rubricVersion: "token-efficiency-v1",
      blind: true,
      doubleScoreCaseIds: ["DC-AUDIT-001"],
    },
    unavailableMetrics: [
      {
        metric: "activation",
        handling: "mark-unavailable",
        reason:
          "Safe-mode condition injection does not expose native skill activation.",
      },
    ],
    permissions: ["Read", "Glob", "Grep"],
  });

  const previousBinary = process.env.TOKEN_EVAL_CLAUDE_BIN;
  const previousMode = process.env.TOKEN_EVAL_ADAPTER_TEST_MODE;
  const previousFakePlugin = process.env.TOKEN_EVAL_FAKE_PLUGIN;
  const previousFakeResultModel = process.env.TOKEN_EVAL_FAKE_RESULT_MODEL;
  const previousFakeSubjectStructuredTool =
    process.env.TOKEN_EVAL_FAKE_SUBJECT_STRUCTURED_TOOL;
  process.env.TOKEN_EVAL_CLAUDE_BIN = fakeClaude;
  process.env.TOKEN_EVAL_ADAPTER_TEST_MODE = "1";
  try {
    const result = await executeApprovedEvaluation({
      root: repositoryRoot,
      corpus,
      approval,
      adapterPath:
        "evals/token-efficiency/adapters/claude-code-stream.mjs",
      seed: 9,
      mode: "pilot",
      outputDirectory: join(temporaryRoot, "claude-adapter-artifacts"),
    });
    equal(result.records.length, 2);
    assert(
      result.records.every(
        (record) =>
          record.configuration.model.exactVersion === "claude-test-1" &&
          record.metrics.runtimeVerification.provenance === "unavailable" &&
          record.rubric.conditionVisibleToAdjudicator === false &&
          record.namespaced.claudeCode.judgeCalls === 2 &&
          record.namespaced.claudeCode.evaluationInputTokens === 60 &&
          record.namespaced.claudeCode.evaluationCachedInputTokens === 0 &&
          record.namespaced.claudeCode.evaluationOutputTokens === 15 &&
          record.namespaced.claudeCode.evaluationTokens === 75 &&
          record.namespaced.claudeCode.evaluationCostUsd === 0.03 &&
          record.namespaced.claudeCode.adjudicatorAgreement.available === true,
      ),
    );
    const candidate = result.records.find(
      (record) => record.condition.id === "candidate",
    );
    equal(candidate.metrics.activation.provenance, "unavailable");
    equal(candidate.metrics.loadedReferences.value.length, 1);

    process.env.TOKEN_EVAL_FAKE_PLUGIN = "1";
    const failureDirectory = join(
      temporaryRoot,
      "claude-adapter-failure-artifacts",
    );
    let failure;
    try {
      await executeApprovedEvaluation({
        root: repositoryRoot,
        corpus,
        approval,
        adapterPath:
          "evals/token-efficiency/adapters/claude-code-stream.mjs",
        seed: 9,
        mode: "pilot",
        outputDirectory: failureDirectory,
      });
    } catch (error) {
      failure = error;
    }
    assert(failure?.message.includes("unexpected plugin"));
    const failureArtifact = JSON.parse(
      readFileSync(join(failureDirectory, "failure.json"), "utf8"),
    );
    equal(failureArtifact.kind, "token-eval-failure");
    equal(failureArtifact.failure.observed.loadedPluginCount, 1);
    equal(
      failureArtifact.failure.observed.loadedPluginNames[0],
      "unexpected-fixture",
    );
    equal(failureArtifact.failure.usage.costUsd, 0.01);
    assert(!JSON.stringify(failureArtifact).includes("/withheld"));

    delete process.env.TOKEN_EVAL_FAKE_PLUGIN;
    process.env.TOKEN_EVAL_FAKE_RESULT_MODEL = "claude-unapproved-1";
    const modelFailureDirectory = join(
      temporaryRoot,
      "claude-adapter-model-failure-artifacts",
    );
    let modelFailure;
    try {
      await executeApprovedEvaluation({
        root: repositoryRoot,
        corpus,
        approval,
        adapterPath:
          "evals/token-efficiency/adapters/claude-code-stream.mjs",
        seed: 9,
        mode: "pilot",
        outputDirectory: modelFailureDirectory,
      });
    } catch (error) {
      modelFailure = error;
    }
    assert(modelFailure?.message.includes("model drifted"));
    const modelFailureArtifact = JSON.parse(
      readFileSync(join(modelFailureDirectory, "failure.json"), "utf8"),
    );
    equal(
      modelFailureArtifact.failure.observed.resultModels[0],
      "claude-unapproved-1",
    );

    delete process.env.TOKEN_EVAL_FAKE_RESULT_MODEL;
    process.env.TOKEN_EVAL_FAKE_SUBJECT_STRUCTURED_TOOL = "1";
    const toolFailureDirectory = join(
      temporaryRoot,
      "claude-adapter-tool-failure-artifacts",
    );
    let toolFailure;
    try {
      await executeApprovedEvaluation({
        root: repositoryRoot,
        corpus,
        approval,
        adapterPath:
          "evals/token-efficiency/adapters/claude-code-stream.mjs",
        seed: 9,
        mode: "pilot",
        outputDirectory: toolFailureDirectory,
      });
    } catch (error) {
      toolFailure = error;
    }
    assert(toolFailure?.message.includes("unexpected tool StructuredOutput"));
    const toolFailureArtifact = JSON.parse(
      readFileSync(join(toolFailureDirectory, "failure.json"), "utf8"),
    );
    equal(
      toolFailureArtifact.failure.observed.tools.includes("StructuredOutput"),
      true,
    );
  } finally {
    if (previousBinary === undefined) {
      delete process.env.TOKEN_EVAL_CLAUDE_BIN;
    } else {
      process.env.TOKEN_EVAL_CLAUDE_BIN = previousBinary;
    }
    if (previousMode === undefined) {
      delete process.env.TOKEN_EVAL_ADAPTER_TEST_MODE;
    } else {
      process.env.TOKEN_EVAL_ADAPTER_TEST_MODE = previousMode;
    }
    if (previousFakePlugin === undefined) {
      delete process.env.TOKEN_EVAL_FAKE_PLUGIN;
    } else {
      process.env.TOKEN_EVAL_FAKE_PLUGIN = previousFakePlugin;
    }
    if (previousFakeResultModel === undefined) {
      delete process.env.TOKEN_EVAL_FAKE_RESULT_MODEL;
    } else {
      process.env.TOKEN_EVAL_FAKE_RESULT_MODEL = previousFakeResultModel;
    }
    if (previousFakeSubjectStructuredTool === undefined) {
      delete process.env.TOKEN_EVAL_FAKE_SUBJECT_STRUCTURED_TOOL;
    } else {
      process.env.TOKEN_EVAL_FAKE_SUBJECT_STRUCTURED_TOOL =
        previousFakeSubjectStructuredTool;
    }
  }
});

test("writes opt-in debug logs privately with a future removal record", () => {
  const fixtureRoot = createRepository("debug-artifact");
  const output = writeProtectedDebugLog(
    fixtureRoot,
    ".artifacts/token-eval/debug/fixture.log",
    "redacted fixture output\n",
    "2099-01-01T00:00:00Z",
    new Date("2026-07-28T00:00:00Z"),
  );
  equal(statSync(output).mode & 0o777, 0o600);
  equal(statSync(`${output}.retention.json`).mode & 0o777, 0o600);
  const retention = JSON.parse(readFileSync(`${output}.retention.json`, "utf8"));
  equal(retention.upload, false);
  throws(
    () =>
      writeProtectedDebugLog(
        fixtureRoot,
        "outside.log",
        "no\n",
        "2099-01-01T00:00:00Z",
      ),
    /under \.artifacts/,
  );
});

let failures = 0;
for (const { name, run } of tests) {
  try {
    await run();
    process.stdout.write(`PASS: ${name}\n`);
  } catch (error) {
    failures += 1;
    process.stderr.write(`FAIL: ${name}\n  ${error.stack ?? error}\n`);
  }
}

if (failures > 0) {
  process.stderr.write(`\nFAILED: ${failures} token-audit tests.\n`);
  process.exit(1);
}
process.stdout.write(`\nOK: ${tests.length} token-audit tests passed.\n`);

function test(name, run) {
  tests.push({ name, run });
}

function createRepository(name) {
  const root = join(temporaryRoot, name);
  mkdirSync(join(root, "skills/design"), { recursive: true });
  mkdirSync(join(root, "bin"), { recursive: true });
  mkdirSync(join(root, "tooling/token-audit"), { recursive: true });
  cpSync(
    join(repositoryRoot, "tooling/token-audit/budgets.json"),
    join(root, "tooling/token-audit/budgets.json"),
  );
  cpSync(
    join(repositoryRoot, "tooling/token-audit/exceptions.json"),
    join(root, "tooling/token-audit/exceptions.json"),
  );
  writeFileSync(join(root, "bin/example"), "#!/usr/bin/env bash\n");
  return root;
}

function writeSkill(
  root,
  directoryName,
  canonicalName,
  {
    body = "",
    reference,
    openAi = 'interface:\n  short_description: "Fixture"\n',
    script,
  } = {},
) {
  const directory = join(root, `skills/design/${directoryName}`);
  mkdirSync(join(directory, "agents"), { recursive: true });
  writeFileSync(
    join(directory, "SKILL.md"),
    `---\nname: ${canonicalName}\ndescription: Fixture ${canonicalName} skill.\n---\n\n# ${canonicalName}\n\n${
      reference === undefined ? body : "Read references/guide.md.\n"
    }`,
  );
  writeFileSync(join(directory, "agents/openai.yaml"), openAi);
  if (reference !== undefined) {
    mkdirSync(join(directory, "references"), { recursive: true });
    writeFileSync(join(directory, "references/guide.md"), reference);
  }
  if (script !== undefined) {
    mkdirSync(join(directory, "scripts"), { recursive: true });
    writeFileSync(join(directory, "scripts/example.mjs"), script);
  }
}

function writeManifests(root, directoryNames) {
  for (const directory of [".claude-plugin", ".cursor-plugin"]) {
    writeJson(join(root, `${directory}/plugin.json`), {
      name: "fixture",
      skills: directoryNames.map((name) => `./skills/design/${name}`),
    });
  }
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function runGit(root, args) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed: ${result.stderr || result.stdout}`,
    );
  }
  return result.stdout;
}

function assert(condition, message = "Assertion failed") {
  if (!condition) throw new Error(message);
}

function equal(actual, expected) {
  if (actual !== expected) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`,
    );
  }
}

function throws(run, pattern) {
  try {
    run();
  } catch (error) {
    if (pattern.test(error.message)) return;
    throw error;
  }
  throw new Error(`Expected error matching ${pattern}.`);
}
