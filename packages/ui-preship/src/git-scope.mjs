import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { AssessmentError } from "./errors.mjs";
import { runProcess } from "./process.mjs";

async function git(root, args, options = {}) {
  const result = await runProcess("git", args, {
    cwd: root,
    timeoutMs: options.timeoutMs ?? 30_000,
    captureLimit: options.captureLimit ?? 4 * 1024 * 1024,
  });
  if (result.status === "missing") {
    throw new AssessmentError("Git is required but unavailable.", {
      ruleId: "UP003",
      remediation: "Install Git and ensure it is available on PATH.",
    });
  }
  return result;
}

export async function resolveRepositoryRoot(cwd) {
  const result = await git(cwd, ["rev-parse", "--show-toplevel"]);
  if (result.status !== "passed") {
    throw new AssessmentError("ui-preship must run inside a local Git repository.", {
      remediation: "Run from a Git worktree containing the requested config.",
    });
  }
  return result.stdout.trim();
}

function parseNameStatus(raw) {
  const tokens = raw.split("\0");
  if (tokens.at(-1) === "") tokens.pop();
  const files = [];
  for (let index = 0; index < tokens.length; ) {
    const status = tokens[index++];
    if (!status) continue;
    if (/^[RC]\d+$/.test(status)) {
      const oldPath = tokens[index++];
      const path = tokens[index++];
      files.push({ status: status[0], score: status.slice(1), oldPath, path });
    } else {
      files.push({ status: status[0], path: tokens[index++] });
    }
  }
  return files;
}

function parsePorcelainPaths(raw) {
  const tokens = raw.split("\0");
  if (tokens.at(-1) === "") tokens.pop();
  const paths = new Set();
  for (let index = 0; index < tokens.length; index += 1) {
    const record = tokens[index];
    if (record.length < 4) continue;
    const status = record.slice(0, 2);
    paths.add(record.slice(3));
    if (status.includes("R") || status.includes("C")) {
      const secondPath = tokens[++index];
      if (secondPath) paths.add(secondPath);
    }
  }
  return paths;
}

async function resolveCommit(root, ref, label) {
  const result = await git(root, ["rev-parse", "--verify", `${ref}^{commit}`]);
  if (result.status !== "passed") {
    throw new AssessmentError(`The ${label} ref is not available locally: ${ref}`, {
      remediation: `Supply a locally available ${label} ref. ui-preship never fetches implicitly.`,
    });
  }
  return result.stdout.trim();
}

async function collectAddedLines(root, diffArgs, file) {
  if (file.status === "D") return [];
  const result = await git(root, [
    "diff",
    ...diffArgs,
    "--no-color",
    "--no-ext-diff",
    "--unified=0",
    "--",
    file.path,
  ]);
  if (result.status !== "passed") {
    throw new AssessmentError(`Cannot inspect the exact diff for ${file.path}.`);
  }

  const additions = [];
  let nextLine = null;
  for (const line of result.stdout.split(/\r?\n/)) {
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      nextLine = Number(hunk[1]);
      continue;
    }
    if (nextLine === null) continue;
    if (line.startsWith("+") && !line.startsWith("+++")) {
      additions.push({ line: nextLine, text: line.slice(1) });
      nextLine += 1;
    } else if (!line.startsWith("-") && !line.startsWith("\\")) {
      nextLine += 1;
    }
  }
  return additions;
}

async function readAllFile(root, file) {
  if (file.status === "D") return [];
  try {
    const content = await readFile(resolve(root, file.path), "utf8");
    return content
      .slice(0, 250_000)
      .split(/\r?\n/)
      .map((text, index) => ({ line: index + 1, text }));
  } catch {
    return [];
  }
}

export async function resolveScope(root, options) {
  const kind = options.scope ?? "staged";
  if (!["staged", "changed", "all"].includes(kind)) {
    throw new AssessmentError(`Unsupported scope "${kind}".`);
  }

  let files;
  let diffArgs;
  let base = null;
  let head = null;
  let mergeBase = null;

  if (kind === "staged") {
    const result = await git(root, [
      "diff",
      "--cached",
      "--name-status",
      "-z",
      "--find-renames",
      "--diff-filter=ACDMRTUXB",
    ]);
    if (result.status !== "passed") {
      throw new AssessmentError("Cannot resolve the exact staged diff.");
    }
    files = parseNameStatus(result.stdout);
    diffArgs = ["--cached"];
  } else if (kind === "changed") {
    if (!options.base || !options.head) {
      throw new AssessmentError("Changed scope requires explicit --base and --head refs.");
    }
    const baseSha = await resolveCommit(root, options.base, "base");
    const headSha = await resolveCommit(root, options.head, "head");
    const mergeResult = await git(root, ["merge-base", "--all", baseSha, headSha]);
    const candidates = mergeResult.stdout.trim().split(/\s+/).filter(Boolean);
    if (mergeResult.status !== "passed" || candidates.length !== 1) {
      throw new AssessmentError(
        candidates.length > 1
          ? "The requested base/head pair has an ambiguous merge base."
          : "No local merge base is available for the requested base/head pair.",
        {
          remediation:
            "Provide complete local history and unambiguous refs. The CLI will not fetch them.",
        },
      );
    }
    mergeBase = candidates[0];
    const result = await git(root, [
      "diff",
      "--name-status",
      "-z",
      "--find-renames",
      "--diff-filter=ACDMRTUXB",
      `${mergeBase}..${headSha}`,
    ]);
    if (result.status !== "passed") {
      throw new AssessmentError("Cannot resolve the requested base/head diff.");
    }
    files = parseNameStatus(result.stdout);
    diffArgs = [`${mergeBase}..${headSha}`];
    base = { ref: options.base, sha: baseSha, source: "explicit-local" };
    head = { ref: options.head, sha: headSha, source: "explicit-local" };

    const dirtyResult = await git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
    if (dirtyResult.status !== "passed") {
      throw new AssessmentError("Cannot inspect worktree overlap for changed scope.");
    }
    const dirtyPaths = parsePorcelainPaths(dirtyResult.stdout);
    const overlap = files
      .flatMap((file) => [file.path, file.oldPath].filter(Boolean))
      .filter((path) => dirtyPaths.has(path));
    if (overlap.length > 0) {
      throw new AssessmentError(
        `Dirty worktree paths overlap the requested base/head target: ${overlap.slice(0, 5).join(", ")}`,
        {
          remediation:
            "Use a clean disposable worktree or assess the exact staged scope; ui-preship will not stash changes.",
        },
      );
    }
  } else {
    const result = await git(root, [
      "ls-files",
      "-z",
      "--cached",
      "--others",
      "--exclude-standard",
    ]);
    if (result.status !== "passed") {
      throw new AssessmentError("Cannot enumerate repository files.");
    }
    files = result.stdout
      .split("\0")
      .filter(Boolean)
      .map((path) => ({ status: "A", path }));
    diffArgs = null;
  }

  for (const file of files) {
    file.additions =
      kind === "all" ? await readAllFile(root, file) : await collectAddedLines(root, diffArgs, file);
  }

  return {
    kind,
    base,
    head,
    mergeBase,
    files,
    diffArgs,
  };
}

export async function runDiffCheck(root, scope) {
  const args =
    scope.kind === "staged"
      ? ["diff", "--cached", "--check"]
      : scope.kind === "changed"
        ? ["diff", "--check", ...scope.diffArgs]
        : ["diff", "--check", "HEAD"];
  const result = await git(root, args);
  if (result.status === "timeout" || result.status === "missing") {
    throw new AssessmentError("Git diff check could not assess the target.");
  }
  if (result.exitCode !== 0) {
    const diagnostic = result.stderr || result.stdout;
    if (diagnostic.trim()) return diagnostic;
    throw new AssessmentError("Git diff check failed to inspect the requested target.");
  }
  return "";
}

export function repositoryRelative(root, path) {
  return relative(root, path) || ".";
}
