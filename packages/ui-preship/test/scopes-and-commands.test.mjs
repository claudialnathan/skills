import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import {
  config,
  git,
  makeRepository,
  runCli,
  runJson,
  stage,
  write,
  writeConfig,
} from "./helpers.mjs";

test("non-UI staged changes stay quiet while configured argv commands pass", () => {
  const root = makeRepository({ react: false });
  write(resolve(root, "scripts/pass.mjs"), 'process.stdout.write("ok\\n");\n');
  writeConfig(
    root,
    config({
      commands: {
        test: {
          kind: "argv",
          argv: ["node", "scripts/pass.mjs"],
          cwd: ".",
          workspace: null,
          required: true,
          timeoutMs: 10_000,
        },
      },
      profiles: { quick: ["test"], full: ["test"] },
    }),
  );
  stage(root, "README.md", "# fixture\n\nDocs only.\n");

  const result = runJson(root, ["check", "--scope", "staged", "--profile", "quick"]);
  assert.equal(result.status, 0);
  assert.equal(result.json.assessment, "assessed");
  assert.deepEqual(result.json.activatedLenses, []);
  assert.equal(result.json.commands[0].status, "passed");
  assert.equal(result.json.summary.unverified, 0);
});

test("staged, changed, and all scopes retain exact file provenance", () => {
  const root = makeRepository();
  writeConfig(root);
  stage(root, "src/App.tsx", "export function App() { return <main className=\"grid\" />; }\n");

  const staged = runJson(root, ["check", "--scope", "staged"]);
  assert.equal(staged.status, 0);
  assert.equal(staged.json.scope.kind, "staged");
  assert.equal(staged.json.scope.files[0].path, "src/App.tsx");

  git(root, ["commit", "-qm", "add app"]);
  const head = git(root, ["rev-parse", "HEAD"]).trim();
  const base = git(root, ["rev-parse", "HEAD^"]).trim();
  const changed = runJson(root, [
    "check",
    "--scope",
    "changed",
    "--base",
    base,
    "--head",
    head,
  ]);
  assert.equal(changed.status, 0);
  assert.equal(changed.json.scope.base.sha, base);
  assert.equal(changed.json.scope.head.sha, head);
  assert.equal(changed.json.provenance.mergeBase.sha, base);

  const all = runJson(root, ["check", "--scope", "all"]);
  assert.equal(all.status, 0);
  assert.equal(all.json.scope.kind, "all");
  assert.ok(all.json.scope.files.some((file) => file.path === "src/App.tsx"));
});

test("rename, delete, and spaces-in-path survive staged scope parsing", () => {
  const root = makeRepository();
  writeConfig(root);
  write(resolve(root, "old.tsx"), "export const Old = () => <div />;\n");
  write(resolve(root, "delete.tsx"), "export const Gone = () => <div />;\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "add files"]);
  git(root, ["mv", "old.tsx", "new name.tsx"]);
  git(root, ["rm", "-q", "delete.tsx"]);

  const result = runJson(root, ["check", "--scope", "staged"]);
  assert.equal(result.status, 0);
  assert.ok(
    result.json.scope.files.some(
      (file) => file.status === "R" && file.oldPath === "old.tsx" && file.path === "new name.tsx",
    ),
  );
  assert.ok(
    result.json.scope.files.some(
      (file) => file.status === "D" && file.path === "delete.tsx",
    ),
  );
});

test("changed scope rejects missing local refs and dirty overlap without fetching", () => {
  const root = makeRepository();
  writeConfig(root);
  const missing = runJson(root, [
    "check",
    "--scope",
    "changed",
    "--base",
    "origin/not-local",
    "--head",
    "HEAD",
  ]);
  assert.equal(missing.status, 2);
  assert.equal(missing.json.assessment, "unassessed");
  assert.match(missing.json.assessmentError.message, /not available locally/);

  stage(root, "src/App.tsx", "export const App = () => <div />;\n");
  git(root, ["commit", "-qm", "app"]);
  const base = git(root, ["rev-parse", "HEAD^"]).trim();
  write(resolve(root, "src/App.tsx"), "export const App = () => <main />;\n");
  const overlap = runJson(root, [
    "check",
    "--scope",
    "changed",
    "--base",
    base,
    "--head",
    "HEAD",
  ]);
  assert.equal(overlap.status, 2);
  assert.match(overlap.json.assessmentError.message, /overlap/);
});

test("changed scope rejects ambiguous merge bases and shallow missing history", () => {
  const root = makeRepository();
  const initial = git(root, ["rev-parse", "HEAD"]).trim();
  writeConfig(root);
  git(root, ["switch", "-qc", "branch-a"]);
  stage(root, "a.txt", "a\n");
  git(root, ["commit", "-qm", "a"]);
  const a = git(root, ["rev-parse", "HEAD"]).trim();
  const treeA = git(root, ["rev-parse", "HEAD^{tree}"]).trim();
  git(root, ["switch", "-qc", "branch-b", initial]);
  stage(root, "b.txt", "b\n");
  git(root, ["commit", "-qm", "b"]);
  const b = git(root, ["rev-parse", "HEAD"]).trim();
  const treeB = git(root, ["rev-parse", "HEAD^{tree}"]).trim();
  const mergeA = execFileSync("git", ["commit-tree", treeA, "-p", a, "-p", b, "-m", "merge a"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const mergeB = execFileSync("git", ["commit-tree", treeB, "-p", b, "-p", a, "-m", "merge b"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  let result = runJson(root, [
    "check",
    "--scope",
    "changed",
    "--base",
    mergeA,
    "--head",
    mergeB,
  ]);
  assert.equal(result.status, 2);
  assert.match(result.json.assessmentError.message, /ambiguous merge base/);

  const source = makeRepository();
  writeConfig(source);
  stage(source, "src/one.tsx", "export const One = () => <div />;\n");
  git(source, ["commit", "-qm", "one"]);
  const missingBase = git(source, ["rev-parse", "HEAD^"]).trim();
  stage(source, "src/two.tsx", "export const Two = () => <div />;\n");
  git(source, ["commit", "-qm", "two"]);
  const shallow = mkdtempSync(resolve(tmpdir(), "ui-preship-shallow-parent-"));
  const checkout = resolve(shallow, "checkout");
  execFileSync("git", ["clone", "-q", "--depth", "1", `file://${source}`, checkout]);
  writeConfig(checkout);
  assert.equal(git(checkout, ["rev-parse", "--is-shallow-repository"]).trim(), "true");
  result = runJson(checkout, [
    "check",
    "--scope",
    "changed",
    "--base",
    missingBase,
    "--head",
    "HEAD",
  ]);
  assert.equal(result.status, 2);
  assert.match(result.json.assessmentError.message, /not available locally/);
});

test("required missing tools and required timeouts exit 2; optional tools remain unverified", () => {
  const root = makeRepository();
  writeConfig(
    root,
    config({
      requiredTools: ["definitely-not-a-real-ui-preship-tool"],
    }),
  );
  let result = runJson(root, ["check", "--scope", "all"]);
  assert.equal(result.status, 2);
  assert.equal(result.json.assessmentError.ruleId, "UP003");

  writeConfig(
    root,
    config({
      commands: {
        optional: {
          kind: "argv",
          argv: ["definitely-not-a-real-ui-preship-tool"],
          cwd: ".",
          workspace: null,
          required: false,
          timeoutMs: 100,
        },
      },
      profiles: { quick: ["optional"], full: ["optional"] },
    }),
  );
  result = runJson(root, ["check", "--scope", "all"]);
  assert.equal(result.status, 0);
  assert.equal(result.json.commands[0].status, "unverified");

  write(resolve(root, "scripts/slow.mjs"), "setTimeout(() => {}, 5000);\n");
  writeConfig(
    root,
    config({
      commands: {
        slow: {
          kind: "argv",
          argv: ["node", "scripts/slow.mjs"],
          cwd: ".",
          workspace: null,
          required: true,
          timeoutMs: 20,
        },
      },
      profiles: { quick: ["slow"], full: ["slow"] },
    }),
  );
  result = runJson(root, ["check", "--scope", "all"]);
  assert.equal(result.status, 2);
  assert.equal(result.json.assessmentError.ruleId, "UP004");

  writeConfig(
    root,
    config({
      commands: {
        slow: {
          kind: "argv",
          argv: ["node", "scripts/slow.mjs"],
          cwd: ".",
          workspace: null,
          required: false,
          timeoutMs: 20,
        },
      },
      profiles: { quick: ["slow"], full: ["slow"] },
    }),
  );
  result = runJson(root, ["check", "--scope", "all"]);
  assert.equal(result.status, 0);
  assert.equal(result.json.commands[0].status, "unverified");
});

test("argv commands never invoke a shell and command evidence is redacted", () => {
  const root = makeRepository();
  write(
    resolve(root, "scripts/args.mjs"),
    [
      'import { existsSync } from "node:fs";',
      'if (process.argv[2] !== "$(touch shell-owned)") process.exit(4);',
      'process.stderr.write("TOKEN=super-secret-value\\n");',
      'process.stderr.write("src/App.tsx:1: deterministic failure\\n");',
      "process.exit(1);",
      "",
    ].join("\n"),
  );
  writeConfig(
    root,
    config({
      blockingMode: "none",
      commands: {
        unsafe: {
          kind: "argv",
          argv: ["node", "scripts/args.mjs", "$(touch shell-owned)"],
          cwd: ".",
          workspace: null,
          required: true,
          timeoutMs: 10_000,
        },
      },
      profiles: { quick: ["unsafe"], full: ["unsafe"] },
    }),
  );
  stage(root, "src/App.tsx", "export const App = () => <div />;\n");
  const result = runJson(root, ["check", "--scope", "staged"]);
  assert.equal(result.status, 0);
  assert.equal(result.json.summary.deterministicFailures, 1);
  assert.equal(existsSync(resolve(root, "shell-owned")), false);
  assert.doesNotMatch(JSON.stringify(result.json), /super-secret-value/);
  assert.match(JSON.stringify(result.json), /REDACTED/);
});

test("blocking modes none, introduced, and all preserve exact semantics", () => {
  for (const [mode, expectedStatus] of [
    ["none", 0],
    ["introduced", 1],
    ["all", 1],
  ]) {
    const root = makeRepository();
    write(
      resolve(root, "scripts/fail.mjs"),
      'process.stderr.write("src/App.tsx:1: exact fixture failure\\n"); process.exit(1);\n',
    );
    writeConfig(
      root,
      config({
        blockingMode: mode,
        commands: {
          test: {
            kind: "argv",
            argv: ["node", "scripts/fail.mjs"],
            cwd: ".",
            workspace: null,
            required: true,
            timeoutMs: 10_000,
          },
        },
        profiles: { quick: ["test"], full: ["test"] },
      }),
    );
    stage(root, "src/App.tsx", "export const App = () => <main />;\n");
    const result = runJson(root, ["check", "--scope", "staged"]);
    assert.equal(result.status, expectedStatus, mode);
    assert.equal(result.json.findings.find((item) => item.ruleId === "UP002").lineIntroduced, true);
  }
});

test("git diff check is exact and obeys the configured blocking mode", () => {
  for (const [mode, expectedStatus] of [
    ["none", 0],
    ["introduced", 1],
    ["all", 1],
  ]) {
    const root = makeRepository();
    writeConfig(root, config({ blockingMode: mode }));
    stage(root, "src/App.tsx", "export const App = () => <div />;   \n");
    const result = runJson(root, ["check", "--scope", "staged"]);
    assert.equal(result.status, expectedStatus, `${mode}: ${result.stdout}`);
    const finding = result.json.findings.find((item) => item.ruleId === "UP001");
    assert.ok(finding, mode);
    assert.equal(finding.lineIntroduced, true);
  }
});

test("script commands support explicit npm workspaces and reject ambiguous managers", () => {
  const root = makeRepository();
  write(
    resolve(root, "package.json"),
    `${JSON.stringify({ name: "root", private: true, workspaces: ["apps/web"] }, null, 2)}\n`,
  );
  write(
    resolve(root, "apps/web/package.json"),
    `${JSON.stringify(
      {
        name: "@fixture/web",
        private: true,
        scripts: { verify: "node scripts/pass.mjs" },
      },
      null,
      2,
    )}\n`,
  );
  write(resolve(root, "apps/web/scripts/pass.mjs"), 'process.stdout.write("workspace ok\\n");\n');
  write(resolve(root, "package-lock.json"), '{"name":"root","lockfileVersion":3,"packages":{}}\n');
  writeConfig(
    root,
    config({
      workspaces: ["apps/web"],
      commands: {
        verify: {
          kind: "script",
          script: "verify",
          cwd: ".",
          workspace: "apps/web",
          required: true,
          timeoutMs: 10_000,
        },
      },
      profiles: { quick: ["verify"], full: ["verify"] },
    }),
  );
  let result = runJson(root, ["check", "--scope", "all"]);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.json.provenance.packageManager, "npm");

  write(resolve(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  result = runJson(root, ["check", "--scope", "all"]);
  assert.equal(result.status, 2);
  assert.match(result.json.assessmentError.message, /Multiple package managers/);

  result = runJson(root, ["check", "--scope", "all", "--profile", "unknown"]);
  assert.equal(result.status, 2);
  assert.match(result.json.assessmentError.message, /Unknown profile/);
});

test("hook mode is silent on exit 0 and concise on failure", () => {
  const root = makeRepository();
  writeConfig(root);
  const pass = runCli(root, [
    "check",
    "--scope",
    "all",
    "--hook",
    "--artifact",
    ".artifacts/hook.json",
  ]);
  assert.equal(pass.status, 0);
  assert.equal(pass.stdout, "");
  assert.equal(pass.stderr, "");

  const failure = runCli(root, [
    "check",
    "--scope",
    "changed",
    "--base",
    "missing",
    "--head",
    "HEAD",
    "--hook",
    "--artifact",
    ".artifacts/hook-failure.json",
  ]);
  assert.equal(failure.status, 2);
  assert.equal(failure.stdout, "");
  assert.match(failure.stderr, /^UNASSESSED UP006:/);
});

test("raw debug output is explicit, local-only, gitignored, mode 0600, and retention-bounded", () => {
  const root = makeRepository();
  write(resolve(root, ".gitignore"), ".ui-preship-debug/\n.artifacts/\n");
  write(
    resolve(root, "scripts/fail.mjs"),
    'process.stderr.write("TOKEN=raw-debug-secret\\n"); process.exit(1);\n',
  );
  writeConfig(
    root,
    config({
      commands: {
        test: {
          kind: "argv",
          argv: ["node", "scripts/fail.mjs"],
          cwd: ".",
          workspace: null,
          required: true,
          timeoutMs: 10_000,
        },
      },
      profiles: { quick: ["test"], full: ["test"] },
    }),
  );
  const retainUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const result = runJson(root, [
    "check",
    "--scope",
    "all",
    "--debug-log",
    ".ui-preship-debug/raw.json",
    "--debug-retain-until",
    retainUntil,
  ]);
  assert.equal(result.status, 0, result.stdout);
  assert.doesNotMatch(JSON.stringify(result.json), /raw-debug-secret/);
  const debugPath = resolve(root, ".ui-preship-debug/raw.json");
  assert.match(readFileSync(debugPath, "utf8"), /raw-debug-secret/);
  assert.equal(statSync(debugPath).mode & 0o777, 0o600);
  assert.equal(result.json.provenance.debug.retainUntil, retainUntil);

  const ci = runJson(root, [
    "check",
    "--scope",
    "all",
    "--runner",
    "github",
    "--debug-log",
    ".ui-preship-debug/ci.json",
    "--debug-retain-until",
    retainUntil,
  ]);
  assert.equal(ci.status, 2);
  assert.match(ci.json.assessmentError.message, /unavailable in GitHub/);
});
