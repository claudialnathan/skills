import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseFrontmatter } from "./audit.mjs";

const COVERAGE_TO_EXPERIMENT = {
  audit: "execution",
  implementation: "execution",
  boundary: "routing",
  "selective-load": "progressive-reference",
  "unavailable-runtime": "execution",
};

const COVERAGE_KEYS = {
  audit: "audit",
  implementation: "implementation",
  boundary: "boundary",
  "selective-load": "selectiveLoad",
  "unavailable-runtime": "unavailableRuntime",
};

const COVERAGE_IDS = {
  audit: "AUDIT",
  implementation: "IMPLEMENT",
  boundary: "BOUNDARY",
  "selective-load": "LOAD",
  "unavailable-runtime": "RUNTIME",
};

export function loadEvaluationCorpus(root) {
  const errors = [];
  const manifest = readJson(
    join(root, "evals/token-efficiency/manifest.json"),
    errors,
  );
  if (!manifest) return emptyCorpus(errors);
  if (manifest.schemaVersion !== 1) {
    errors.push("Evaluation manifest must use schemaVersion 1.");
  }

  const expectedCoverage = readMergedDocuments(
    root,
    manifest.expectedFiles,
    errors,
  ).find((document) => document.coverage)?.coverage;
  const expectedSkills = readMergedDocuments(
    root,
    manifest.expectedFiles,
    errors,
  ).find((document) => document.skills)?.skills;
  if (!expectedCoverage) errors.push("Expected coverage definitions are missing.");
  if (!expectedSkills) errors.push("Expected skill decisions are missing.");

  const conditions = new Map();
  for (const relativePath of manifest.conditionFiles ?? []) {
    const condition = readJson(join(root, relativePath), errors);
    if (!condition) continue;
    const id = condition.condition;
    if (!id || conditions.has(id)) {
      errors.push(`Condition ${id || relativePath} is missing or duplicated.`);
      continue;
    }
    if (condition.catalogIsolation !== "exclusive") {
      errors.push(`Condition ${id} must use an exclusive catalog.`);
    }
    if (condition.allowInstalledSkills !== false) {
      errors.push(`Condition ${id} must exclude installed machine skills.`);
    }
    for (const path of [
      ...(condition.skillPaths ?? []),
      ...(condition.contextPaths ?? []),
    ]) {
      if (!existsSync(join(root, path))) {
        errors.push(`Condition ${id} points to missing path ${path}.`);
      }
    }
    conditions.set(id, { ...condition, sourcePath: relativePath });
  }
  for (const id of manifest.replacementConditions ?? []) {
    if (!conditions.has(id)) {
      errors.push(`Replacement condition ${id} is missing.`);
    }
  }

  const adapters = new Map();
  for (const relativePath of manifest.adapterManifests ?? []) {
    const adapter = readJson(join(root, relativePath), errors);
    if (!adapter) continue;
    if (!adapter.id || adapters.has(adapter.id)) {
      errors.push(`Adapter ${adapter.id || relativePath} is missing or duplicated.`);
      continue;
    }
    validateAdapterManifest(adapter, errors);
    adapters.set(adapter.id, { ...adapter, sourcePath: relativePath });
  }

  const cases = [];
  for (const relativePath of manifest.caseFiles ?? []) {
    const document = readJson(join(root, relativePath), errors);
    if (!document) continue;
    if (document.kind === "skill-coverage-matrix") {
      cases.push(
        ...expandSkillMatrix(root, document, manifest, conditions, errors),
      );
    } else if (document.kind === "explicit-cases") {
      for (const item of document.cases ?? []) {
        cases.push({ ...item, sourcePath: relativePath });
      }
    } else {
      errors.push(`Unknown case document kind in ${relativePath}.`);
    }
  }

  const seenCases = new Set();
  const coverageBySkill = new Map();
  const experiments = new Set();
  for (const item of cases) {
    validateCase(item, conditions, errors);
    if (seenCases.has(item.id)) errors.push(`Duplicate case ID ${item.id}.`);
    seenCases.add(item.id);
    experiments.add(item.experiment);
    if (!coverageBySkill.has(item.skill)) {
      coverageBySkill.set(item.skill, new Set());
    }
    coverageBySkill.get(item.skill).add(item.coverage);
    if (!expectedSkills?.[item.skill]) {
      errors.push(`Case ${item.id} has no expected skill decision.`);
    }
    if (!expectedCoverage?.[item.coverage]) {
      errors.push(`Case ${item.id} has no expected coverage contract.`);
    }
  }

  for (const [skill, coverage] of coverageBySkill) {
    for (const required of manifest.requiredCoverage ?? []) {
      if (!coverage.has(required)) {
        errors.push(`${skill} is missing ${required} evaluation coverage.`);
      }
    }
  }
  const publishedSkills = listExpectedPublishedSkills(expectedSkills);
  for (const skill of publishedSkills) {
    if (!coverageBySkill.has(skill)) {
      errors.push(`Published skill ${skill} has no evaluation cases.`);
    }
  }
  for (const requiredExperiment of [
    "routing",
    "execution",
    "progressive-reference",
    "generated-prompt",
  ]) {
    if (!experiments.has(requiredExperiment)) {
      errors.push(`Corpus is missing ${requiredExperiment} coverage.`);
    }
  }

  return {
    manifest,
    cases,
    casesById: new Map(cases.map((item) => [item.id, item])),
    conditions,
    adapters,
    expectedCoverage,
    expectedSkills,
    errors,
    summary: {
      cases: cases.length,
      skills: coverageBySkill.size,
      conditions: conditions.size,
      adapters: adapters.size,
    },
  };
}

function expandSkillMatrix(root, document, manifest, conditions, errors) {
  const cases = [];
  const requiredCoverage = manifest.requiredCoverage ?? [];
  for (const skill of document.skills ?? []) {
    const skillFile = join(root, skill.path ?? "", "SKILL.md");
    if (!existsSync(skillFile)) {
      errors.push(`Skill matrix points to missing ${skill.path}/SKILL.md.`);
      continue;
    }
    const frontmatter = parseFrontmatter(readFileSync(skillFile, "utf8"));
    if (frontmatter.name !== skill.name) {
      errors.push(
        `Skill matrix name ${skill.name} does not match ${frontmatter.name || basename(skill.path)}.`,
      );
    }
    for (const coverage of requiredCoverage) {
      const source = skill[COVERAGE_KEYS[coverage]];
      if (!source?.prompt) {
        errors.push(`${skill.name} is missing a ${coverage} prompt.`);
        continue;
      }
      cases.push({
        id: `${skill.idPrefix}-${COVERAGE_IDS[coverage]}-001`,
        skill: skill.name,
        skillPath: skill.path,
        experiment: COVERAGE_TO_EXPERIMENT[coverage],
        coverage,
        prompt: source.prompt,
        conditionIds: [...(document.conditions ?? [])],
        expectedActivation: coverage === "boundary" ? null : true,
        expectedReferences: [...(source.expectedReferences ?? [])],
        forbiddenReferences: [...(source.forbiddenReferences ?? [])],
        expectedSections: [...(source.expectedSections ?? [])],
        wholeFileAcceptable: source.wholeFileAcceptable ?? true,
        sourcePath: "evals/token-efficiency/cases/initial-skills.json",
      });
    }
  }
  for (const id of document.conditions ?? []) {
    if (!conditions.has(id)) {
      errors.push(`Skill matrix uses missing condition ${id}.`);
    }
  }
  return cases;
}

function validateCase(item, conditions, errors) {
  const prefix = item.id || "unnamed case";
  for (const field of [
    "id",
    "skill",
    "experiment",
    "coverage",
    "prompt",
  ]) {
    if (!item[field]) errors.push(`${prefix} is missing ${field}.`);
  }
  if (!Array.isArray(item.conditionIds) || item.conditionIds.length < 1) {
    errors.push(`${prefix} must declare at least one condition.`);
  }
  for (const condition of item.conditionIds ?? []) {
    if (!conditions.has(condition)) {
      errors.push(`${prefix} uses missing condition ${condition}.`);
    }
  }
  for (const field of [
    "expectedReferences",
    "forbiddenReferences",
    "expectedSections",
  ]) {
    if (!Array.isArray(item[field])) {
      errors.push(`${prefix}.${field} must be an array.`);
    }
  }
  const overlap = (item.expectedReferences ?? []).filter((reference) =>
    (item.forbiddenReferences ?? []).includes(reference),
  );
  if (overlap.length > 0) {
    errors.push(`${prefix} both expects and forbids ${overlap.join(", ")}.`);
  }
}

function validateAdapterManifest(adapter, errors) {
  const prefix = `Adapter ${adapter.id || "unknown"}`;
  for (const field of [
    "version",
    "harness",
    "capabilities",
    "freshSessionPerRun",
    "supportsExclusiveCatalog",
    "enforcesBudget",
  ]) {
    if (adapter[field] === undefined) errors.push(`${prefix} is missing ${field}.`);
  }
  for (const capability of [
    "activation",
    "referenceReads",
    "toolOutput",
    "usage",
  ]) {
    if (typeof adapter.capabilities?.[capability] !== "boolean") {
      errors.push(`${prefix} must declare ${capability} observability.`);
    }
  }
  if (adapter.freshSessionPerRun !== true) {
    errors.push(`${prefix} must create a fresh session for every run.`);
  }
  if (adapter.supportsExclusiveCatalog !== true) {
    errors.push(`${prefix} must support an exclusive catalog.`);
  }
  if (adapter.enforcesBudget !== true) {
    errors.push(`${prefix} must enforce the approved budget.`);
  }
  if (adapter.uploadsArtifacts !== false) {
    errors.push(`${prefix} must not upload artifacts by default.`);
  }
}

function listExpectedPublishedSkills(expectedSkills = {}) {
  return Object.keys(expectedSkills).filter((name) => name !== "design-craft");
}

function readMergedDocuments(root, paths = [], errors) {
  return paths
    .map((path) => readJson(join(root, path), errors))
    .filter(Boolean);
}

function readJson(path, errors) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`Cannot read ${path}: ${error.message}`);
    return null;
  }
}

function emptyCorpus(errors) {
  return {
    manifest: null,
    cases: [],
    casesById: new Map(),
    conditions: new Map(),
    adapters: new Map(),
    expectedCoverage: {},
    expectedSkills: {},
    errors,
    summary: { cases: 0, skills: 0, conditions: 0, adapters: 0 },
  };
}
