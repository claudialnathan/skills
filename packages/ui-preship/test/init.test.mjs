import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  config,
  makeRepository,
  runCli,
  write,
  writeConfig,
} from "./helpers.mjs";

const ACTION_REF =
  "claudialnathan/skills/actions/ui-preship@0123456789abcdef0123456789abcdef01234567";

function declarePrivatePackage(root, extra = {}) {
  const path = resolve(root, "package.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  const { devDependencies = {}, ...rest } = extra;
  manifest.devDependencies = {
    "ui-preship": "file:../ui-preship-0.1.0.tgz",
    ...devDependencies,
  };
  Object.assign(manifest, rest);
  write(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

test("init dry-run previews core and optional adapters without writing", () => {
  const root = makeRepository();
  declarePrivatePackage(root);
  const originalPackage = readFileSync(resolve(root, "package.json"), "utf8");
  const result = runCli(root, [
    "init",
    "--dry-run",
    "--agents",
    "--hook",
    "--claude",
    "--ci",
    "--action-ref",
    ACTION_REF,
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^ui-preship init: dry-run/m);
  assert.match(result.stdout, /Hook manager: native/);
  assert.match(result.stdout, /CREATE ui-preship\.config\.json/);
  assert.match(result.stdout, /CREATE AGENTS\.md/);
  assert.match(result.stdout, /CREATE \.github\/workflows\/ui-preship\.yml/);
  assert.match(result.stdout, /No files written\./);
  assert.equal(readFileSync(resolve(root, "package.json"), "utf8"), originalPackage);
  assert.equal(existsSync(resolve(root, ".gitignore")), false);
});

test("init applies an advisory idempotent native, Claude, project-rule, and CI setup", () => {
  const root = makeRepository();
  declarePrivatePackage(root);
  const args = [
    "init",
    "--yes",
    "--agents",
    "--hook",
    "--claude",
    "--ci",
    "--action-ref",
    ACTION_REF,
  ];
  let result = runCli(root, args);
  assert.equal(result.status, 0, result.stderr);

  const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  assert.equal(
    manifest.scripts["ui-preship"],
    "ui-preship check --scope staged --profile quick --hook",
  );
  assert.equal(
    JSON.parse(readFileSync(resolve(root, "ui-preship.config.json"), "utf8"))
      .blockingMode,
    "none",
  );
  assert.match(readFileSync(resolve(root, "AGENTS.md"), "utf8"), /ui-preship:start/);
  assert.match(
    readFileSync(resolve(root, ".gitignore"), "utf8"),
    /\.artifacts\/ui-preship\//,
  );
  const nativeHook = resolve(root, ".git/hooks/pre-commit");
  assert.match(readFileSync(nativeHook, "utf8"), /--scope staged/);
  assert.equal(statSync(nativeHook).mode & 0o777, 0o755);
  const claudeHook = resolve(root, ".claude/hooks/ui-preship.sh");
  assert.equal(statSync(claudeHook).mode & 0o777, 0o755);
  const settings = JSON.parse(
    readFileSync(resolve(root, ".claude/settings.json"), "utf8"),
  );
  assert.equal(settings.hooks.PreToolUse.length, 1);
  assert.equal(settings.hooks.PreToolUse[0].hooks[0].type, "command");

  const workflow = readFileSync(
    resolve(root, ".github/workflows/ui-preship.yml"),
    "utf8",
  );
  assert.match(workflow, new RegExp(ACTION_REF.replaceAll("/", "\\/")));
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /cancel-in-progress: true/);
  assert.doesNotMatch(workflow, /workflow_dispatch/);
  for (const reference of workflow.matchAll(/uses:\s+([^\s]+)/g)) {
    assert.match(reference[1], /@[0-9a-f]{40}$/);
  }

  result = runCli(root, args);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /(?:CREATE|UPDATE) /);
  assert.match(result.stdout, /UNCHANGED package\.json/);
});

test("init supports empty Husky and simple-git-hooks adapters", () => {
  const huskyRoot = makeRepository();
  declarePrivatePackage(huskyRoot, {
    devDependencies: { husky: "9.1.7" },
  });
  write(resolve(huskyRoot, ".husky/.gitignore"), "_\n");
  let result = runCli(huskyRoot, ["init", "--yes", "--hook"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Hook manager: husky/);
  assert.match(
    readFileSync(resolve(huskyRoot, ".husky/pre-commit"), "utf8"),
    /ui-preship managed hook/,
  );

  const simpleRoot = makeRepository();
  declarePrivatePackage(simpleRoot, {
    devDependencies: { "simple-git-hooks": "2.13.1" },
  });
  result = runCli(simpleRoot, ["init", "--yes", "--hook"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Hook manager: simple-git-hooks/);
  const manifest = JSON.parse(
    readFileSync(resolve(simpleRoot, "package.json"), "utf8"),
  );
  assert.match(manifest["simple-git-hooks"]["pre-commit"], /ui-preship/);
});

test("init refuses opaque hooks, promoted blocking, mutable CI refs, and missing package installs", () => {
  const opaqueRoot = makeRepository();
  declarePrivatePackage(opaqueRoot);
  write(resolve(opaqueRoot, ".git/hooks/pre-commit"), "#!/bin/sh\necho opaque\n");
  let result = runCli(opaqueRoot, ["init", "--yes", "--hook"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Refusing to overwrite opaque existing adapter/);
  assert.equal(
    readFileSync(resolve(opaqueRoot, ".git/hooks/pre-commit"), "utf8"),
    "#!/bin/sh\necho opaque\n",
  );

  const blockingRoot = makeRepository();
  declarePrivatePackage(blockingRoot);
  writeConfig(blockingRoot, config({ blockingMode: "introduced" }));
  result = runCli(blockingRoot, ["init", "--dry-run"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /advisory-only/);

  const mutableRoot = makeRepository();
  declarePrivatePackage(mutableRoot);
  result = runCli(mutableRoot, [
    "init",
    "--dry-run",
    "--ci",
    "--action-ref",
    "claudialnathan/skills/actions/ui-preship@main",
  ]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /FULL_COMMIT_SHA/);

  const missingRoot = makeRepository();
  result = runCli(missingRoot, ["init", "--dry-run"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /requires ui-preship to be installed/);

  const rangedRoot = makeRepository();
  declarePrivatePackage(rangedRoot);
  const rangedManifestPath = resolve(rangedRoot, "package.json");
  const rangedManifest = JSON.parse(readFileSync(rangedManifestPath, "utf8"));
  rangedManifest.devDependencies["ui-preship"] = "^0.1.0";
  write(rangedManifestPath, `${JSON.stringify(rangedManifest, null, 2)}\n`);
  result = runCli(rangedRoot, ["init", "--dry-run"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /not exact/);
});
