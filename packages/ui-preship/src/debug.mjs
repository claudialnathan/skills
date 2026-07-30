import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";
import { AssessmentError } from "./errors.mjs";
import { resolveInside } from "./config.mjs";
import { runProcess } from "./process.mjs";

const MAX_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export async function prepareDebug(root, options) {
  const requestedPath = options.debugLog;
  const requestedRetention = options.debugRetainUntil;
  if (!requestedPath && !requestedRetention) return null;
  if (!requestedPath || !requestedRetention) {
    throw new AssessmentError(
      "Debug capture requires both --debug-log and --debug-retain-until.",
    );
  }
  if (options.runner === "github") {
    throw new AssessmentError("Raw debug capture is unavailable in GitHub runner mode.");
  }
  const retainUntil = new Date(requestedRetention);
  const remaining = retainUntil.getTime() - Date.now();
  if (
    Number.isNaN(retainUntil.getTime()) ||
    remaining <= 0 ||
    remaining > MAX_RETENTION_MS
  ) {
    throw new AssessmentError(
      "--debug-retain-until must be an absolute future timestamp no more than 7 days away.",
    );
  }
  const absolutePath = resolveInside(root, requestedPath, "debug log path");
  const relativePath = relative(root, absolutePath);
  const ignored = await runProcess("git", ["check-ignore", "-q", "--", relativePath], {
    cwd: root,
    timeoutMs: 10_000,
  });
  if (ignored.status !== "passed") {
    throw new AssessmentError(
      `Debug log path is not gitignored: ${relativePath}`,
      {
        remediation:
          "Add the task-owned debug directory to .gitignore, then rerun with an explicit retention deadline.",
      },
    );
  }
  return {
    absolutePath,
    path: relativePath,
    retainUntil: retainUntil.toISOString(),
  };
}

export async function writeDebug(debug, records) {
  if (!debug) return;
  await mkdir(dirname(debug.absolutePath), { recursive: true, mode: 0o700 });
  await chmod(dirname(debug.absolutePath), 0o700);
  await writeFile(
    debug.absolutePath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        warning: "Explicit local raw debug output. Delete no later than retainUntil.",
        retainUntil: debug.retainUntil,
        commands: records,
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  await chmod(debug.absolutePath, 0o600);
}
