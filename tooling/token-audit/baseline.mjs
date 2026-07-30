import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { hashDirectory } from "./audit.mjs";

export function createBaseline(root, report, reason) {
  if (!reason?.trim()) {
    throw new Error("A non-empty --reason is required to write a baseline.");
  }
  const legacyControls = {};
  for (const name of ["design-polish", "design-taste"]) {
    const path = `skills/design/${name}`;
    const measurement = hashDirectory(join(root, path));
    legacyControls[name] = {
      path,
      ...measurement,
      markdown: measureMarkdownDirectory(join(root, path)),
    };
  }
  const reportHash = hashJson(report);
  return {
    schemaVersion: 1,
    kind: "static-token-baseline",
    recordedAt: new Date().toISOString(),
    reason: reason.trim(),
    source: report.source,
    report,
    legacyControls,
    integrity: {
      algorithm: "sha256",
      reportHash,
    },
  };
}

export function writeBaseline(path, baseline) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(baseline, null, 2)}\n`, {
    mode: 0o644,
  });
}

export function readAndValidateBaseline(path) {
  if (!existsSync(path)) throw new Error(`Baseline not found: ${path}`);
  const baseline = JSON.parse(readFileSync(path, "utf8"));
  if (
    baseline.schemaVersion !== 1 ||
    baseline.kind !== "static-token-baseline" ||
    !baseline.reason?.trim() ||
    !baseline.report ||
    !baseline.integrity?.reportHash
  ) {
    throw new Error("Baseline is missing its schema, reason, report, or integrity record.");
  }
  const actualHash = hashJson(baseline.report);
  if (actualHash !== baseline.integrity.reportHash) {
    throw new Error(
      `Baseline report hash mismatch: expected ${baseline.integrity.reportHash}, got ${actualHash}.`,
    );
  }
  return baseline;
}

export function compareToBaseline(root, current, baseline) {
  const metrics = [
    "catalogCharacters",
    "mainCharacters",
    "mainBytes",
    "directReferenceCharacters",
    "directReferenceBytes",
    "potentialRouteCharacters",
    "potentialRouteBytes",
    "generatedPromptCharacters",
    "packageBytes",
  ];
  const summary = Object.fromEntries(
    metrics.map((metric) => [
      metric,
      {
        baseline: baseline.report.summary[metric],
        current: current.summary[metric],
        delta:
          current.summary[metric] - baseline.report.summary[metric],
      },
    ]),
  );
  const controls = Object.entries(baseline.legacyControls ?? {}).map(
    ([name, expected]) => {
      const actual = hashDirectory(join(root, expected.path));
      return {
        name,
        path: expected.path,
        expectedHash: expected.hash,
        actualHash: actual.hash,
        unchanged: expected.hash === actual.hash,
      };
    },
  );
  return {
    baselineRecordedAt: baseline.recordedAt,
    baselineReason: baseline.reason,
    baselineSource: baseline.source,
    summary,
    controls,
    controlsUnchanged: controls.every((control) => control.unchanged),
  };
}

export function hashJson(value) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")}`;
}

function measureMarkdownDirectory(directory) {
  const files = listMarkdown(directory);
  let bytes = 0;
  let words = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    bytes += statSync(file).size;
    words +=
      source.trim() === "" ? 0 : source.trim().split(/\s+/u).length;
  }
  return { files: files.length, bytes, words };
}

function listMarkdown(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listMarkdown(path));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
  }
  return files.sort();
}
