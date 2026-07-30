import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { RULESET_HASH } from "./constants.mjs";
import { AssessmentError } from "./errors.mjs";
import { resolveInside } from "./config.mjs";

export async function loadBaseline(root, configRecord) {
  const path = configRecord.value.baseline.path;
  const absolutePath = resolveInside(root, path, "baseline path");
  let raw;
  try {
    raw = await readFile(absolutePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return { path, absolutePath, exists: false, stale: false, entries: [] };
    }
    throw new AssessmentError(`Cannot read baseline ${path}: ${error.message}`);
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new AssessmentError(`Invalid baseline JSON in ${path}: ${error.message}`);
  }
  if (value.schemaVersion !== 1 || !Array.isArray(value.entries)) {
    throw new AssessmentError(`${path} is not a ui-preship baseline schema version 1.`);
  }
  const stale =
    value.configHash !== configRecord.hash || value.rulesetHash !== RULESET_HASH;
  return {
    path,
    absolutePath,
    exists: true,
    stale,
    entries: value.entries,
    value,
  };
}

export function applyBaseline(findings, baseline, blockingMode) {
  const now = Date.now();
  let staleEvidenceRequired = false;
  for (const finding of findings) {
    if (!finding.deterministic || !finding.required || finding.suppressed) continue;
    if (finding.lineIntroduced) {
      finding.introduced = true;
      continue;
    }
    if (blockingMode !== "introduced" || !finding.fingerprint || !baseline.exists) {
      finding.introduced = false;
      continue;
    }
    if (baseline.stale) {
      staleEvidenceRequired = true;
      continue;
    }
    const matched = baseline.entries.some(
      (entry) =>
        entry.ruleId === finding.ruleId &&
        entry.path === (finding.path ?? ".") &&
        entry.fingerprint === finding.fingerprint &&
        (!entry.expiresAt || Date.parse(entry.expiresAt) > now),
    );
    finding.introduced = !matched;
    finding.baselineStatus = matched ? "existing" : "new-fingerprint";
  }
  if (staleEvidenceRequired) {
    throw new AssessmentError(
      "The stale baseline is required to classify one or more command failures as introduced.",
      {
        ruleId: "UP005",
        remediation:
          "Review and explicitly update the baseline, or use blockingMode none/all until evidence is current.",
      },
    );
  }
}

export async function writeBaseline(root, configRecord, report, options) {
  if (!options.reason?.trim()) {
    throw new AssessmentError("Baseline update requires a non-empty --reason.");
  }
  const expiresAt = new Date(options.expires);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    throw new AssessmentError("Baseline update requires a future --expires date.");
  }
  const actor = options.actor || "unknown";
  const entries = report.findings
    .filter((finding) => finding.deterministic && finding.fingerprint)
    .map((finding) => ({
      ruleId: finding.ruleId,
      path: finding.path ?? ".",
      fingerprint: finding.fingerprint,
      reason: options.reason.trim(),
      owner: options.owner ?? null,
      expiresAt: expiresAt.toISOString(),
    }));
  const value = {
    schemaVersion: 1,
    repositoryId: report.repository.id,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    configHash: configRecord.hash,
    rulesetHash: RULESET_HASH,
    updateProvenance: {
      actor,
      command: [
        "ui-preship",
        "baseline",
        "update",
        "--reason",
        options.reason.trim(),
        "--expires",
        options.expires,
      ],
    },
    entries,
  };
  const path = resolve(root, configRecord.value.baseline.path);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  return { path: configRecord.value.baseline.path, entryCount: entries.length };
}
