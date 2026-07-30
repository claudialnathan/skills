import { spawn } from "node:child_process";

const DEFAULT_CAPTURE_LIMIT = 1024 * 1024;

function appendBounded(current, chunk, limit) {
  if (current.length >= limit) return current;
  return `${current}${chunk}`.slice(0, limit);
}

export function runProcess(
  command,
  args,
  {
    cwd,
    timeoutMs = 120_000,
    env = process.env,
    captureLimit = DEFAULT_CAPTURE_LIMIT,
  } = {},
) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;
    let child;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({
        command,
        args,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
        timedOut,
        ...result,
      });
    };

    try {
      child = spawn(command, args, {
        cwd,
        env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      finish({ status: "missing", exitCode: null, error });
      return;
    }

    child.stdout.on("data", (chunk) => {
      stdout = appendBounded(stdout, chunk.toString("utf8"), captureLimit);
    });
    child.stderr.on("data", (chunk) => {
      stderr = appendBounded(stderr, chunk.toString("utf8"), captureLimit);
    });
    child.on("error", (error) => {
      finish({
        status: error.code === "ENOENT" ? "missing" : "failed",
        exitCode: null,
        error,
      });
    });
    child.on("close", (exitCode, signal) => {
      finish({
        status: timedOut ? "timeout" : exitCode === 0 ? "passed" : "failed",
        exitCode,
        signal,
      });
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!settled) child.kill("SIGKILL");
      }, 250).unref();
    }, timeoutMs);
    timer.unref();
    child.on("close", () => clearTimeout(timer));
  });
}

const SECRET_PATTERNS = [
  /\b(Bearer)\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(api[_-]?key|authorization|password|secret|token)\b(\s*[:=]\s*)([^\s,;]+)/gi,
  /\b(gh[opurs]_[A-Za-z0-9]{20,})\b/g,
  /\b(sk-[A-Za-z0-9_-]{16,})\b/g,
];

export function redactText(value) {
  let redacted = String(value ?? "");
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, (_match, label, separator) =>
      separator ? `${label}${separator}[REDACTED]` : "[REDACTED]",
    );
  }
  return redacted;
}

export function boundedDiagnostics(stdout, stderr, maxLines = 20) {
  const lines = redactText(`${stderr}\n${stdout}`)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(0, maxLines)
    .map((line) => (line.length > 320 ? `${line.slice(0, 317)}...` : line));
  return lines;
}
