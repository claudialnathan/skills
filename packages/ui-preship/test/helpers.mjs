import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const cliPath = resolve(packageRoot, "bin/ui-preship.mjs");

export function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

export function git(root, args, options = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });
}

export function makeRepository({ react = true } = {}) {
  const root = mkdtempSync(resolve(tmpdir(), "ui-preship-test-"));
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "fixture@example.test"]);
  git(root, ["config", "user.name", "Fixture"]);
  write(
    resolve(root, "package.json"),
    `${JSON.stringify(
      {
        name: "fixture",
        private: true,
        ...(react ? { dependencies: { react: "0.0.0-fixture" } } : {}),
      },
      null,
      2,
    )}\n`,
  );
  write(resolve(root, "README.md"), "# fixture\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "initial"]);
  return root;
}

export function config(overrides = {}) {
  return {
    version: 1,
    blockingMode: "none",
    workspaces: [],
    commands: {},
    profiles: {
      quick: [],
      full: [],
    },
    requiredTools: [],
    rules: {},
    suppressions: [],
    baseline: {
      path: ".ui-preship-baseline.json",
    },
    artifacts: {
      directory: ".artifacts/ui-preship",
    },
    ...overrides,
  };
}

export function writeConfig(root, value = config()) {
  write(resolve(root, "ui-preship.config.json"), `${JSON.stringify(value, null, 2)}\n`);
}

export function runCli(root, args, options = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
  });
}

export function runJson(root, args) {
  const result = runCli(root, [...args, "--format", "json", "--artifact", ".artifacts/report.json"]);
  return {
    ...result,
    json: result.stdout.trim() ? JSON.parse(result.stdout) : null,
  };
}

export function stage(root, path, content) {
  write(resolve(root, path), content);
  git(root, ["add", "--", path]);
}
