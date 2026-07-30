import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { hashDirectory } from "./audit.mjs";
import { validateCandidatePackage } from "./candidate.mjs";

const REQUIRED_CASES = new Set([
  "DC-AMBIENT-001",
  "DC-AUDIT-001",
  "DC-PROPOSAL-001",
  "DC-APPLY-001",
  "DC-NOCHANGE-001",
  "DC-NEG-001",
]);

export function validateCheckpoint2(root) {
  const errors = [];
  const probePath = join(
    root,
    "evals/token-efficiency/probes/checkpoint-2.json",
  );
  const probe = readJson(probePath, errors);
  if (!probe) return { errors, cases: [] };

  const candidateCondition = readJson(
    join(root, "evals/token-efficiency/conditions/candidate.json"),
    errors,
  );
  const expectedCandidatePath =
    "evals/token-efficiency/candidates/design-craft";
  if (candidateCondition?.catalogIsolation !== "exclusive") {
    errors.push("Candidate condition must use an exclusive catalog.");
  }
  if (candidateCondition?.allowInstalledSkills !== false) {
    errors.push("Candidate condition must exclude installed machine skills.");
  }
  if (
    JSON.stringify(candidateCondition?.skillPaths) !==
    JSON.stringify([expectedCandidatePath])
  ) {
    errors.push("Candidate condition must expose only the design-craft candidate.");
  }

  const candidateDirectory = join(root, expectedCandidatePath);
  const candidateResult = validateCandidatePackage(candidateDirectory);
  errors.push(...candidateResult.errors);
  const candidateSourcePath = join(candidateDirectory, "SKILL.md");
  const candidateSource = existsSync(candidateSourcePath)
    ? readFileSync(candidateSourcePath, "utf8")
    : "";

  const controls = readJson(
    join(root, "evals/token-efficiency/controls/controls.json"),
    errors,
  );
  for (const control of controls?.controls ?? []) {
    if (!existsSync(join(root, control.livePath))) {
      errors.push(`Missing live predecessor ${control.livePath}.`);
      continue;
    }
    const live = hashDirectory(join(root, control.livePath));
    const frozen = hashDirectory(join(root, control.controlPath));
    if (live.hash !== control.expectedHash) {
      errors.push(`Live predecessor drifted: ${control.name}.`);
    }
    if (frozen.hash !== control.expectedHash) {
      errors.push(`Frozen control drifted: ${control.name}.`);
    }
  }

  for (const manifestPath of [
    ".claude-plugin/plugin.json",
    ".codex-plugin/plugin.json",
    ".cursor-plugin/plugin.json",
    ".agents/plugins/marketplace.json",
  ]) {
    const absolutePath = join(root, manifestPath);
    if (
      existsSync(absolutePath) &&
      readFileSync(absolutePath, "utf8").includes("design-craft")
    ) {
      errors.push(`Unvalidated candidate is published in ${manifestPath}.`);
    }
  }
  if (existsSync(join(root, "skills/design/design-craft"))) {
    errors.push("Unvalidated candidate exists under the published skills tree.");
  }

  if (
    probe?.harness?.modelCalls?.value !== 0 ||
    probe?.harness?.modelCalls?.provenance !== "observed"
  ) {
    errors.push("Checkpoint 2 probes must record the zero-model boundary.");
  }
  for (const metric of ["activation", "loadedReferences"]) {
    const value = probe?.runtimeEvidence?.[metric];
    if (value?.value !== null || value?.provenance !== "unavailable") {
      errors.push(`${metric} must remain explicitly unavailable.`);
    }
  }

  const cases = [];
  const seen = new Set();
  for (const probeCase of probe?.cases ?? []) {
    if (seen.has(probeCase.id)) {
      errors.push(`Duplicate checkpoint 2 probe ID ${probeCase.id}.`);
    }
    seen.add(probeCase.id);
    const caseErrors = [];
    for (const evidence of probeCase.contractEvidence ?? []) {
      if (!candidateSource.includes(evidence)) {
        caseErrors.push(`missing contract evidence: ${evidence}`);
      }
    }
    for (const reference of probeCase.declaredReferences ?? []) {
      if (!existsSync(join(candidateDirectory, reference))) {
        caseErrors.push(`missing declared reference: ${reference}`);
      }
    }
    if (
      probeCase.expectedActivation === false &&
      (probeCase.declaredReferences ?? []).length > 0
    ) {
      caseErrors.push("non-activation case declares references");
    }
    if (caseErrors.length > 0) {
      errors.push(`${probeCase.id}: ${caseErrors.join("; ")}.`);
    }
    cases.push({
      id: probeCase.id,
      status: caseErrors.length === 0 ? "pass" : "fail",
      expectedActivation: probeCase.expectedActivation,
      expectedMode: probeCase.expectedMode,
      declaredReferences: probeCase.declaredReferences,
      activation: probe.runtimeEvidence.activation,
      loadedReferences: probe.runtimeEvidence.loadedReferences,
    });
  }
  for (const id of REQUIRED_CASES) {
    if (!seen.has(id)) errors.push(`Missing checkpoint 2 probe ${id}.`);
  }

  return {
    checkpoint: 2,
    harness: probe.harness,
    candidate: candidateResult,
    controls: (controls?.controls ?? []).map((control) => ({
      name: control.name,
      expectedHash: control.expectedHash,
    })),
    cases,
    errors,
  };
}

function readJson(path, errors) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`Cannot read ${path}: ${error.message}`);
    return null;
  }
}
