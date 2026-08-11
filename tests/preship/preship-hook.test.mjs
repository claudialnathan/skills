#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const fixtureRoot = mkdtempSync(join(tmpdir(), "skills-preship-hook-"));

process.on("exit", () => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

const settings = JSON.parse(
  readFileSync(join(repositoryRoot, ".claude/settings.json"), "utf8"),
);
const group = settings.hooks?.PreToolUse?.find(
  (candidate) => candidate.matcher === "Bash",
);
const handler = group?.hooks?.find(
  (candidate) =>
    candidate.command ===
    '"$CLAUDE_PROJECT_DIR"/.claude/hooks/preship-gate.sh',
);

assert(
  handler?.if === "Bash(git commit *)",
  "commit hook uses the current hook-level Bash(git commit *) predicate",
);

for (const [command, expected] of [
  ["git commit", true],
  ["git commit -m fixture", true],
  ["git -C . commit -m fixture", true],
  ["npm test && git commit -m fixture", true],
  ["git status --short", false],
  ["npm test", false],
]) {
  assert(
    matchesDocumentedCommitPredicate(command) === expected,
    `${JSON.stringify(command)} ${expected ? "matches" : "does not match"} the commit predicate`,
  );
}

mkdirSync(join(fixtureRoot, ".claude/hooks"), { recursive: true });
mkdirSync(join(fixtureRoot, "scripts"), { recursive: true });
cpSync(
  join(repositoryRoot, ".claude/hooks/preship-gate.sh"),
  join(fixtureRoot, ".claude/hooks/preship-gate.sh"),
);
chmodSync(join(fixtureRoot, ".claude/hooks/preship-gate.sh"), 0o755);

for (const command of [
  "scripts/test-preship-check",
  "scripts/test-token-audit",
  "scripts/preship-check",
]) {
  writeExecutable(
    join(fixtureRoot, command),
    "#!/usr/bin/env bash\nexit 0\n",
  );
}
let result = runHook();
assert(
  result.status === 0 && result.stdout === "" && result.stderr === "",
  "clean hook pass is silent",
);

writeExecutable(
  join(fixtureRoot, "scripts/preship-check"),
  '#!/usr/bin/env bash\necho "fixture invariant failed"\nexit 1\n',
);
result = runHook();
assert(
  result.status === 2 &&
    result.stderr.includes("scripts/preship-check failed") &&
    result.stderr.includes("fixture invariant failed"),
  "gate failure blocks with concise actionable stderr",
);

writeExecutable(
  join(fixtureRoot, "scripts/preship-check"),
  "#!/usr/bin/env bash\nexit 0\n",
);
writeExecutable(
  join(fixtureRoot, "scripts/test-token-audit"),
  '#!/usr/bin/env bash\necho "fixture token test failed"\nexit 1\n',
);
result = runHook();
assert(
  result.status === 2 &&
    result.stderr.includes("scripts/test-token-audit failed") &&
    result.stderr.includes("fixture token test failed"),
  "token tooling test failure blocks the commit",
);

writeExecutable(
  join(fixtureRoot, "scripts/test-token-audit"),
  "#!/usr/bin/env bash\nexit 0\n",
);
writeExecutable(
  join(fixtureRoot, "scripts/test-preship-check"),
  '#!/usr/bin/env bash\necho "fixture gate test failed"\nexit 1\n',
);
result = runHook();
assert(
  result.status === 2 &&
    result.stderr.includes("scripts/test-preship-check failed") &&
    result.stderr.includes("fixture gate test failed"),
  "repository gate test failure blocks the commit",
);

rmSync(join(fixtureRoot, "scripts/preship-check"));
writeExecutable(
  join(fixtureRoot, "scripts/test-preship-check"),
  "#!/usr/bin/env bash\nexit 0\n",
);
result = runHook();
assert(
  result.status === 2 &&
    result.stderr.includes("scripts/preship-check could not run") &&
    result.stderr.includes("missing or not executable"),
  "missing gate blocks instead of silently allowing a commit",
);

console.log("\nOK: 12 preship hook fixture tests passed.");

function runHook() {
  return spawnSync(
    join(fixtureRoot, ".claude/hooks/preship-gate.sh"),
    {
      cwd: fixtureRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: fixtureRoot,
      },
      input: JSON.stringify({
        tool_name: "Bash",
        tool_input: { command: "git commit -m fixture" },
      }),
    },
  );
}

function matchesDocumentedCommitPredicate(command) {
  return command
    .split(/\s*(?:&&|\|\||;)\s*/)
    .map(normalizeGitGlobalOptions)
    .some((subcommand) => /^git commit(?:\s|$)/.test(subcommand));
}

function normalizeGitGlobalOptions(command) {
  const words = command.trim().split(/\s+/);
  if (words[0] !== "git") return command.trim();

  let index = 1;
  while (index < words.length) {
    const word = words[index];
    if (["-C", "-c", "--git-dir", "--work-tree", "--namespace"].includes(word)) {
      index += 2;
      continue;
    }
    if (
      word.startsWith("--git-dir=") ||
      word.startsWith("--work-tree=") ||
      word.startsWith("--namespace=")
    ) {
      index += 1;
      continue;
    }
    break;
  }
  return ["git", ...words.slice(index)].join(" ");
}

function writeExecutable(path, contents) {
  writeFileSync(path, contents);
  chmodSync(path, 0o755);
}

function assert(condition, name) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    process.exit(1);
  }
  console.log(`PASS: ${name}`);
}
