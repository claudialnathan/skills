import { chmod, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, resolveInside } from "./config.mjs";
import { TOOL_VERSION } from "./constants.mjs";
import { AssessmentError } from "./errors.mjs";
import { runProcess } from "./process.mjs";

const PACKAGE_SCRIPT =
  "ui-preship check --scope staged --profile quick --hook";
const HOOK_COMMAND =
  "./node_modules/.bin/ui-preship check --scope staged --profile quick --hook";
const CLAUDE_HOOK = `#!/usr/bin/env sh
# ui-preship managed Claude hook
set -u
cd "\${CLAUDE_PROJECT_DIR:-.}" || exit 2
exec ${HOOK_COMMAND}
`;
const AGENTS_START = "<!-- ui-preship:start -->";
const AGENTS_END = "<!-- ui-preship:end -->";
const MANAGED_WORKFLOW = "# ui-preship managed workflow";
const ACTION_REF_PATTERN =
  /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/actions\/ui-preship@[0-9a-f]{40}$/;
const TEMPLATE_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../templates",
);

async function readOptional(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function ensureObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AssessmentError(`${label} must be a JSON object.`);
  }
}

async function readJson(path, label) {
  const raw = await readOptional(path);
  if (raw === null) {
    throw new AssessmentError(`Cannot initialize without ${label}.`);
  }
  try {
    const parsed = JSON.parse(raw);
    ensureObject(parsed, label);
    return parsed;
  } catch (error) {
    if (error instanceof AssessmentError) throw error;
    throw new AssessmentError(`Invalid JSON in ${label}: ${error.message}`);
  }
}

function dependencyNames(manifest) {
  return {
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
    ...(manifest.optionalDependencies ?? {}),
  };
}

function assertPrivatePilotDependency(manifest) {
  const spec = dependencyNames(manifest)["ui-preship"];
  if (typeof spec !== "string" || !spec.trim()) {
    throw new AssessmentError(
      "The private pilot requires ui-preship to be installed before initialization.",
      {
        remediation:
          `Install the packed ui-preship ${TOOL_VERSION} package as an exact development dependency, then rerun init.`,
      },
    );
  }
  if (
    !spec.startsWith("file:") &&
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(spec)
  ) {
    throw new AssessmentError(
      `The ui-preship development dependency is not exact: ${spec}`,
      {
        remediation:
          "Use the packed file dependency during the private pilot; semver ranges, tags, and URLs are not accepted.",
      },
    );
  }
}

function addPackageScript(manifest) {
  if (manifest.scripts !== undefined) {
    ensureObject(manifest.scripts, "package.json scripts");
  }
  manifest.scripts ??= {};
  const existing = manifest.scripts["ui-preship"];
  if (existing !== undefined && existing !== PACKAGE_SCRIPT) {
    throw new AssessmentError(
      'package.json already defines an opaque "ui-preship" script.',
      {
        remediation:
          `Review the existing script manually; the managed command is "${PACKAGE_SCRIPT}".`,
      },
    );
  }
  manifest.scripts["ui-preship"] = PACKAGE_SCRIPT;
}

function managedBlock(current, block, path) {
  if (current === null || current.trim() === "") return `${block.trim()}\n`;
  const start = current.indexOf(AGENTS_START);
  const end = current.indexOf(AGENTS_END);
  if ((start >= 0) !== (end >= 0) || (start >= 0 && end < start)) {
    throw new AssessmentError(`${path} contains an incomplete ui-preship managed block.`);
  }
  if (start < 0) return `${current.trimEnd()}\n\n${block.trim()}\n`;
  const after = end + AGENTS_END.length;
  return `${current.slice(0, start)}${block.trim()}${current.slice(after)}`;
}

function appendGitignore(current) {
  const lines = current === null ? [] : current.split(/\r?\n/);
  for (const entry of [".artifacts/ui-preship/", ".ui-preship-debug/"]) {
    if (!lines.includes(entry)) lines.push(entry);
  }
  return `${lines.filter((line, index) => line || index < lines.length - 1).join("\n")}\n`;
}

function assertManagedOrAbsent(current, path, expectedPrefix) {
  if (current === null || current === expectedPrefix) return;
  throw new AssessmentError(`Refusing to overwrite opaque existing adapter ${path}.`, {
    remediation:
      `Integrate "${HOOK_COMMAND}" manually, or remove the existing adapter after review and rerun init.`,
  });
}

async function hookManager(root, manifest) {
  const dependencies = dependencyNames(manifest);
  const candidates = [];
  if (
    Object.hasOwn(dependencies, "simple-git-hooks") ||
    Object.hasOwn(manifest, "simple-git-hooks")
  ) {
    candidates.push("simple-git-hooks");
  }
  if (Object.hasOwn(dependencies, "husky") || (await exists(resolve(root, ".husky")))) {
    candidates.push("husky");
  }
  if (
    Object.hasOwn(dependencies, "lefthook") ||
    (await exists(resolve(root, "lefthook.yml"))) ||
    (await exists(resolve(root, "lefthook.yaml")))
  ) {
    candidates.push("lefthook");
  }
  if (candidates.length > 1) {
    throw new AssessmentError(
      `Multiple Git hook managers are present: ${candidates.join(", ")}.`,
      { remediation: "Select and reconcile one hook manager before rerunning init." },
    );
  }
  return candidates[0] ?? "native";
}

function configureSimpleGitHooks(manifest) {
  if (manifest["simple-git-hooks"] !== undefined) {
    ensureObject(manifest["simple-git-hooks"], "package.json simple-git-hooks");
  }
  manifest["simple-git-hooks"] ??= {};
  const existing = manifest["simple-git-hooks"]["pre-commit"];
  if (existing !== undefined && existing !== HOOK_COMMAND) {
    throw new AssessmentError(
      "Refusing to overwrite an opaque simple-git-hooks pre-commit command.",
      {
        remediation:
          `Integrate "${HOOK_COMMAND}" manually in package.json, preserving the existing command.`,
      },
    );
  }
  manifest["simple-git-hooks"]["pre-commit"] = HOOK_COMMAND;
}

async function nativeHookPath(root) {
  const result = await runProcess("git", ["rev-parse", "--git-path", "hooks/pre-commit"], {
    cwd: root,
    timeoutMs: 10_000,
  });
  if (result.status !== "passed" || !result.stdout.trim()) {
    throw new AssessmentError("Git could not resolve the native pre-commit hook path.");
  }
  const absolute = resolve(root, result.stdout.trim());
  const rel = relative(root, absolute);
  if (rel === ".." || rel.startsWith(`..${sep}`)) {
    throw new AssessmentError(
      "The resolved Git hook path is outside this checkout.",
      {
        remediation:
          `Integrate "${HOOK_COMMAND}" manually; init will not write a shared or machine-scope hook path.`,
      },
    );
  }
  return rel;
}

function mergeClaudeSettings(settings, adapter) {
  settings.hooks ??= {};
  ensureObject(settings.hooks, ".claude/settings.json hooks");
  settings.hooks.PreToolUse ??= [];
  if (!Array.isArray(settings.hooks.PreToolUse)) {
    throw new AssessmentError(
      ".claude/settings.json hooks.PreToolUse must be an array.",
    );
  }
  const command = adapter.hooks[0].command;
  const alreadyPresent = settings.hooks.PreToolUse.some((entry) =>
    Array.isArray(entry?.hooks)
      ? entry.hooks.some((hook) => hook?.command === command)
      : false,
  );
  if (!alreadyPresent) {
    settings.hooks.PreToolUse.push(adapter);
  }
  return settings;
}

function defaultConfig() {
  return {
    $schema: "./node_modules/ui-preship/schema/ui-preship.schema.json",
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
  };
}

function queue(changes, path, current, content, options = {}) {
  changes.push({
    path,
    action: current === content ? "unchanged" : current === null ? "create" : "update",
    content,
    mode: options.mode,
  });
}

async function applyChanges(root, changes) {
  for (const change of changes) {
    if (change.action === "unchanged") continue;
    const absolute = resolveInside(root, change.path, "initializer path");
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, change.content, {
      encoding: "utf8",
      ...(change.mode ? { mode: change.mode } : {}),
    });
    if (change.mode) await chmod(absolute, change.mode);
  }
}

async function workflowContent(actionRef) {
  if (!ACTION_REF_PATTERN.test(actionRef ?? "")) {
    throw new AssessmentError(
      "--ci requires --action-ref OWNER/REPOSITORY/actions/ui-preship@FULL_COMMIT_SHA.",
      {
        remediation:
          "Supply a reviewed 40-character immutable commit SHA; branches and tags are not accepted.",
      },
    );
  }
  const template = await readFile(resolve(TEMPLATE_ROOT, "github-workflow.yml"), "utf8");
  return template.replace("__UI_PRESHIP_ACTION_REF__", actionRef);
}

export async function initializeProject(root, options) {
  if (options.dryRun === options.yes) {
    throw new AssessmentError("init requires exactly one of --dry-run or --yes.");
  }

  const packagePath = resolve(root, "package.json");
  const manifest = await readJson(packagePath, "package.json");
  assertPrivatePilotDependency(manifest);
  addPackageScript(manifest);

  const changes = [];
  const configPath = resolve(root, "ui-preship.config.json");
  const currentConfig = await readOptional(configPath);
  if (currentConfig === null) {
    queue(
      changes,
      "ui-preship.config.json",
      null,
      `${JSON.stringify(defaultConfig(), null, 2)}\n`,
    );
  } else {
    const config = await loadConfig(root, "ui-preship.config.json");
    if (config.value.blockingMode !== "none") {
      throw new AssessmentError(
        "The private initializer is advisory-only and will not retain a promoted blocking mode.",
        {
          remediation:
            'Review the repository policy and set blockingMode to "none" before running the pilot initializer.',
        },
      );
    }
    queue(changes, "ui-preship.config.json", currentConfig, currentConfig);
  }

  let selectedHookManager = null;
  if (options.hook) {
    selectedHookManager = await hookManager(root, manifest);
    if (selectedHookManager === "lefthook") {
      throw new AssessmentError(
        "Lefthook is recognized, but this private initializer will not merge an existing YAML hook graph.",
        {
          remediation:
            `Add "${HOOK_COMMAND}" to the repository's pre-commit commands manually.`,
        },
      );
    }
    if (selectedHookManager === "simple-git-hooks") {
      configureSimpleGitHooks(manifest);
    } else {
      const managedHook = await readFile(resolve(TEMPLATE_ROOT, "pre-commit"), "utf8");
      const hookPath =
        selectedHookManager === "husky"
          ? ".husky/pre-commit"
          : await nativeHookPath(root);
      const current = await readOptional(resolve(root, hookPath));
      assertManagedOrAbsent(current, hookPath, managedHook);
      queue(changes, hookPath, current, managedHook, { mode: 0o755 });
    }
  }

  const packageRaw = await readOptional(packagePath);
  queue(changes, "package.json", packageRaw, `${JSON.stringify(manifest, null, 2)}\n`);

  const gitignorePath = resolve(root, ".gitignore");
  const gitignore = await readOptional(gitignorePath);
  queue(changes, ".gitignore", gitignore, appendGitignore(gitignore));

  if (options.agents) {
    const snippet = await readFile(resolve(TEMPLATE_ROOT, "AGENTS.snippet.md"), "utf8");
    const agentsPath = resolve(root, "AGENTS.md");
    const agents = await readOptional(agentsPath);
    queue(changes, "AGENTS.md", agents, managedBlock(agents, snippet, "AGENTS.md"));
  }

  if (options.claude) {
    const hookPath = ".claude/hooks/ui-preship.sh";
    const currentHook = await readOptional(resolve(root, hookPath));
    assertManagedOrAbsent(currentHook, hookPath, CLAUDE_HOOK);
    queue(changes, hookPath, currentHook, CLAUDE_HOOK, { mode: 0o755 });

    const settingsPath = resolve(root, ".claude/settings.json");
    const settingsRaw = await readOptional(settingsPath);
    const settings =
      settingsRaw === null
        ? {}
        : await readJson(settingsPath, ".claude/settings.json");
    const adapter = JSON.parse(
      await readFile(resolve(TEMPLATE_ROOT, "claude-settings.json"), "utf8"),
    );
    const merged = mergeClaudeSettings(settings, adapter);
    queue(
      changes,
      ".claude/settings.json",
      settingsRaw,
      `${JSON.stringify(merged, null, 2)}\n`,
    );
  }

  if (options.ci) {
    const path = ".github/workflows/ui-preship.yml";
    const current = await readOptional(resolve(root, path));
    const desired = await workflowContent(options.actionRef);
    if (
      current !== null &&
      current !== desired &&
      !current.startsWith(`${MANAGED_WORKFLOW}\n`)
    ) {
      throw new AssessmentError(`Refusing to overwrite opaque existing adapter ${path}.`, {
        remediation:
          "Move or manually reconcile the existing workflow before rerunning init.",
      });
    }
    queue(changes, path, current, desired);
  }

  if (options.yes) await applyChanges(root, changes);
  return {
    mode: options.dryRun ? "dry-run" : "applied",
    root,
    hookManager: selectedHookManager,
    changes: changes.map(({ path, action }) => ({ path, action })),
  };
}

export function renderInitialization(result) {
  const lines = [`ui-preship init: ${result.mode}`];
  if (result.hookManager) lines.push(`Hook manager: ${result.hookManager}`);
  for (const change of result.changes) {
    lines.push(`${change.action.toUpperCase()} ${change.path}`);
  }
  if (result.mode === "dry-run") lines.push("No files written.");
  return lines.join("\n");
}
