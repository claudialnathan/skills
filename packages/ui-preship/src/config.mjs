import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { delimiter, isAbsolute, relative, resolve, sep } from "node:path";
import { DEFAULT_ARTIFACT_DIRECTORY, DEFAULT_CONFIG } from "./constants.mjs";
import { AssessmentError } from "./errors.mjs";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function resolveInside(root, target, label) {
  const absolute = isAbsolute(target) ? resolve(target) : resolve(root, target);
  const rel = relative(root, absolute);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new AssessmentError(`${label} must stay inside the repository: ${target}`, {
      remediation: `Use a repository-relative ${label}.`,
    });
  }
  return absolute;
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item)) {
    throw new AssessmentError(`${label} must be an array of non-empty strings.`);
  }
}

function validateCommand(id, command, workspaces) {
  if (!isObject(command)) {
    throw new AssessmentError(`commands.${id} must be an object.`);
  }
  if (!["script", "argv"].includes(command.kind)) {
    throw new AssessmentError(`commands.${id}.kind must be "script" or "argv".`);
  }
  if (typeof command.cwd !== "string" || !command.cwd) {
    throw new AssessmentError(`commands.${id}.cwd must be a non-empty repository-relative path.`);
  }
  if (command.workspace !== null && command.workspace !== undefined) {
    if (typeof command.workspace !== "string" || !command.workspace) {
      throw new AssessmentError(`commands.${id}.workspace must be null or a non-empty string.`);
    }
    if (!workspaces.includes(command.workspace)) {
      throw new AssessmentError(
        `commands.${id}.workspace is not declared in the top-level workspaces array.`,
      );
    }
    if (command.cwd !== ".") {
      throw new AssessmentError(
        `commands.${id} cannot combine workspace "${command.workspace}" with cwd "${command.cwd}".`,
      );
    }
  }
  if (typeof command.required !== "boolean") {
    throw new AssessmentError(`commands.${id}.required must be boolean.`);
  }
  if (
    !Number.isInteger(command.timeoutMs) ||
    command.timeoutMs < 1 ||
    command.timeoutMs > 600_000
  ) {
    throw new AssessmentError(`commands.${id}.timeoutMs must be an integer from 1 to 600000.`);
  }
  if (command.kind === "script") {
    if (typeof command.script !== "string" || !command.script) {
      throw new AssessmentError(`commands.${id}.script must be a non-empty string.`);
    }
    if ("argv" in command) {
      throw new AssessmentError(`commands.${id} cannot declare argv for a script command.`);
    }
  } else {
    if (
      !Array.isArray(command.argv) ||
      command.argv.length === 0 ||
      command.argv.some((arg) => typeof arg !== "string" || !arg)
    ) {
      throw new AssessmentError(`commands.${id}.argv must be a non-empty string array.`);
    }
    if ("script" in command) {
      throw new AssessmentError(`commands.${id} cannot declare script for an argv command.`);
    }
  }
}

function validateSuppressions(suppressions) {
  if (!Array.isArray(suppressions)) {
    throw new AssessmentError("suppressions must be an array.");
  }
  for (const [index, item] of suppressions.entries()) {
    if (
      !isObject(item) ||
      typeof item.ruleId !== "string" ||
      typeof item.path !== "string" ||
      typeof item.reason !== "string" ||
      !item.reason.trim()
    ) {
      throw new AssessmentError(
        `suppressions[${index}] must name ruleId, path, and a non-empty reason.`,
      );
    }
    if (item.reviewAfter !== undefined && Number.isNaN(Date.parse(item.reviewAfter))) {
      throw new AssessmentError(`suppressions[${index}].reviewAfter must be an ISO date.`);
    }
  }
}

async function rootManifestDeclaresWorkspaces(root) {
  try {
    const manifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
    return Array.isArray(manifest.workspaces) ||
      (isObject(manifest.workspaces) && Array.isArray(manifest.workspaces.packages));
  } catch {
    return false;
  }
}

export async function loadConfig(root, requestedPath = DEFAULT_CONFIG) {
  const absolutePath = resolveInside(root, requestedPath, "config path");
  let raw;
  try {
    raw = await readFile(absolutePath, "utf8");
  } catch (error) {
    throw new AssessmentError(`Cannot read ${requestedPath}: ${error.message}`, {
      remediation: `Create ${requestedPath} from the package schema and rerun.`,
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new AssessmentError(`Invalid JSON in ${requestedPath}: ${error.message}`);
  }
  if (!isObject(parsed) || parsed.version !== 1) {
    throw new AssessmentError(`${requestedPath} must be an object with version 1.`);
  }
  if (!["none", "introduced", "all"].includes(parsed.blockingMode)) {
    throw new AssessmentError(
      `${requestedPath}.blockingMode must be "none", "introduced", or "all".`,
    );
  }

  const hasWorkspaceDeclaration = Object.hasOwn(parsed, "workspaces");
  const workspaces = parsed.workspaces ?? [];
  assertStringArray(workspaces, "workspaces");
  if ((await rootManifestDeclaresWorkspaces(root)) && !hasWorkspaceDeclaration) {
    throw new AssessmentError(
      "Monorepo target is ambiguous: workspaces must be explicitly declared, including [] for root-only.",
    );
  }
  for (const workspace of workspaces) {
    resolveInside(root, workspace, "workspace");
  }

  if (!isObject(parsed.commands)) {
    throw new AssessmentError("commands must be an object.");
  }
  for (const [id, command] of Object.entries(parsed.commands)) {
    if (!/^[a-z][a-z0-9-]*$/.test(id)) {
      throw new AssessmentError(`Command ID "${id}" must use lowercase letters, digits, or hyphens.`);
    }
    validateCommand(id, command, workspaces);
    resolveInside(root, command.cwd, `commands.${id}.cwd`);
  }

  if (!isObject(parsed.profiles) || Object.keys(parsed.profiles).length === 0) {
    throw new AssessmentError("profiles must be a non-empty object.");
  }
  for (const [name, commandIds] of Object.entries(parsed.profiles)) {
    assertStringArray(commandIds, `profiles.${name}`);
    for (const commandId of commandIds) {
      if (!Object.hasOwn(parsed.commands, commandId)) {
        throw new AssessmentError(`profiles.${name} references unknown command "${commandId}".`);
      }
    }
  }

  const requiredTools = parsed.requiredTools ?? [];
  assertStringArray(requiredTools, "requiredTools");
  validateSuppressions(parsed.suppressions ?? []);
  if (parsed.rules !== undefined && !isObject(parsed.rules)) {
    throw new AssessmentError("rules must be an object.");
  }
  if (parsed.packageManager !== undefined && !["npm", "pnpm", "yarn", "bun"].includes(parsed.packageManager)) {
    throw new AssessmentError("packageManager must be npm, pnpm, yarn, or bun.");
  }

  const baseline = parsed.baseline ?? { path: ".ui-preship-baseline.json" };
  if (!isObject(baseline) || typeof baseline.path !== "string" || !baseline.path) {
    throw new AssessmentError("baseline.path must be a non-empty string.");
  }
  resolveInside(root, baseline.path, "baseline path");

  const artifacts = parsed.artifacts ?? { directory: DEFAULT_ARTIFACT_DIRECTORY };
  if (!isObject(artifacts) || typeof artifacts.directory !== "string" || !artifacts.directory) {
    throw new AssessmentError("artifacts.directory must be a non-empty string.");
  }
  resolveInside(root, artifacts.directory, "artifact directory");

  return {
    path: requestedPath,
    absolutePath,
    hash: `sha256:${createHash("sha256").update(raw).digest("hex")}`,
    value: {
      ...parsed,
      workspaces,
      requiredTools,
      rules: parsed.rules ?? {},
      suppressions: parsed.suppressions ?? [],
      baseline,
      artifacts,
    },
  };
}

export async function findExecutable(name, cwd, env = process.env) {
  if (name.includes("/") || name.includes("\\")) {
    const candidate = isAbsolute(name) ? name : resolve(cwd, name);
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      return null;
    }
  }
  for (const directory of String(env.PATH ?? "").split(delimiter)) {
    if (!directory) continue;
    const candidate = resolve(directory, name);
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Continue through PATH.
    }
  }
  return null;
}
