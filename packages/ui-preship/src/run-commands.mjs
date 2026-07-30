import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AssessmentError } from "./errors.mjs";
import { findExecutable, resolveInside } from "./config.mjs";
import { boundedDiagnostics, runProcess } from "./process.mjs";

const LOCKFILES = {
  npm: "package-lock.json",
  pnpm: "pnpm-lock.yaml",
  yarn: "yarn.lock",
  bun: "bun.lock",
};

async function exists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function readManifest(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

export async function detectPackageManager(root, config) {
  const detected = [];
  for (const [manager, lockfile] of Object.entries(LOCKFILES)) {
    if (await exists(resolve(root, lockfile))) detected.push(manager);
  }
  if (config.packageManager) {
    if (detected.length > 0 && !detected.includes(config.packageManager)) {
      throw new AssessmentError(
        `Configured package manager ${config.packageManager} does not own a root lockfile.`,
      );
    }
    return config.packageManager;
  }
  if (detected.length > 1) {
    throw new AssessmentError(
      `Multiple package managers are plausible: ${detected.join(", ")}.`,
      { remediation: "Set packageManager explicitly in ui-preship.config.json." },
    );
  }
  if (detected.length === 1) return detected[0];

  const manifest = await readManifest(resolve(root, "package.json"));
  const declared = manifest?.packageManager?.split("@")[0];
  if (["npm", "pnpm", "yarn", "bun"].includes(declared)) return declared;
  return null;
}

function scriptInvocation(manager, command) {
  const workspace = command.workspace;
  if (manager === "npm") {
    return {
      executable: "npm",
      args: ["run", command.script, ...(workspace ? ["--workspace", workspace] : [])],
    };
  }
  if (manager === "pnpm") {
    return {
      executable: "pnpm",
      args: [...(workspace ? ["--filter", `./${workspace}`] : []), "run", command.script],
    };
  }
  if (manager === "yarn") {
    return {
      executable: "yarn",
      args: workspace
        ? ["workspace", workspace, "run", command.script]
        : ["run", command.script],
    };
  }
  if (manager === "bun") {
    return {
      executable: "bun",
      args: workspace
        ? ["run", "--filter", workspace, command.script]
        : ["run", command.script],
    };
  }
  throw new AssessmentError("A script command requires one unambiguous package manager.", {
    remediation: "Add one root lockfile or set packageManager explicitly.",
  });
}

function diagnosticLocations(lines, root) {
  const locations = [];
  for (const line of lines) {
    const match = line.match(/^(.+?):(\d+)(?::(\d+))?(?:\s|:)/);
    if (!match) continue;
    const absolute = resolve(root, match[1]);
    const path = absolute.startsWith(`${root}/`) ? absolute.slice(root.length + 1) : match[1];
    locations.push({
      path,
      line: Number(match[2]),
      column: match[3] ? Number(match[3]) : null,
    });
  }
  return locations.slice(0, 20);
}

function intersectsAddedLine(scope, location) {
  const file = scope.files.find((candidate) => candidate.path === location.path);
  return Boolean(file?.additions.some((addition) => addition.line === location.line));
}

function commandFingerprint(commandId, diagnostics, exitCode) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify({ commandId, diagnostics, exitCode }))
    .digest("hex")}`;
}

async function assertScriptExists(root, command, id) {
  const manifestRoot = command.workspace ?? command.cwd;
  const manifest = await readManifest(resolve(root, manifestRoot, "package.json"));
  if (!manifest) {
    throw new AssessmentError(`Command "${id}" has no readable package.json owner.`);
  }
  if (typeof manifest.scripts?.[command.script] !== "string") {
    throw new AssessmentError(
      `Command "${id}" references missing package script "${command.script}".`,
    );
  }
}

export async function runConfiguredCommands(root, config, scope, profileName, options = {}) {
  const commandIds = config.profiles[profileName];
  if (!commandIds) {
    throw new AssessmentError(`Unknown profile "${profileName}".`);
  }
  const packageManager = await detectPackageManager(root, config);

  for (const tool of config.requiredTools) {
    if (!(await findExecutable(tool, root))) {
      throw new AssessmentError(`Required tool is unavailable: ${tool}`, {
        ruleId: "UP003",
        remediation: `Install or expose "${tool}" on PATH, then rerun.`,
      });
    }
  }

  const commands = [];
  const findings = [];
  const debugRecords = [];
  for (const id of commandIds) {
    const command = config.commands[id];
    let invocation;
    if (command.kind === "script") {
      await assertScriptExists(root, command, id);
      invocation = scriptInvocation(packageManager, command);
    } else {
      invocation = { executable: command.argv[0], args: command.argv.slice(1) };
    }

    const cwd = resolveInside(root, command.cwd, `commands.${id}.cwd`);
    if (!(await findExecutable(invocation.executable, cwd))) {
      if (command.required) {
        throw new AssessmentError(
          `Required command "${id}" cannot resolve executable "${invocation.executable}".`,
          {
            ruleId: "UP003",
            remediation: `Install or expose "${invocation.executable}", then rerun.`,
          },
        );
      }
      commands.push({
        id,
        kind: command.kind,
        required: false,
        status: "unverified",
        reason: `Optional executable unavailable: ${invocation.executable}`,
        durationMs: 0,
        diagnostics: [],
      });
      continue;
    }

    const result = await runProcess(invocation.executable, invocation.args, {
      cwd,
      timeoutMs: command.timeoutMs,
    });
    if (options.debug) {
      debugRecords.push({
        id,
        executable: invocation.executable,
        args: invocation.args,
        cwd: command.cwd,
        status: result.status,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      });
    }
    const diagnostics = boundedDiagnostics(result.stdout, result.stderr);
    if (result.status === "timeout" && command.required) {
      throw new AssessmentError(
        `Required command "${id}" timed out after ${command.timeoutMs} ms.`,
        {
          ruleId: "UP004",
          remediation: `Resolve the timeout or review commands.${id}.timeoutMs, then rerun.`,
        },
      );
    }

    const record = {
      id,
      kind: command.kind,
      required: command.required,
      status:
        result.status === "passed"
          ? "passed"
          : result.status === "timeout"
            ? "unverified"
            : "failed",
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      diagnostics,
    };
    commands.push(record);

    if (record.status === "failed") {
      const locations = diagnosticLocations(diagnostics, root);
      const targets = locations.length > 0 ? locations : [{}];
      for (const target of targets) {
        const diagnostic =
          diagnostics.find((line) =>
            target.path && target.line
              ? line.startsWith(`${target.path}:${target.line}:`)
              : false,
          ) ??
          diagnostics[0] ??
          `Configured command exited with status ${String(result.exitCode)}.`;
        findings.push({
          ruleId: "UP002",
          commandId: id,
          severity: command.required ? "error" : "warning",
          deterministic: true,
          required: command.required,
          path: target.path ?? null,
          line: target.line ?? null,
          column: target.column ?? null,
          locations: target.path ? [target] : [],
          evidence: diagnostic,
          lineIntroduced: target.path ? intersectsAddedLine(scope, target) : false,
          fingerprint: commandFingerprint(
            id,
            [target.path ? `${target.path}:${target.line}:${diagnostic}` : diagnostic],
            result.exitCode,
          ),
          effectiveBlocker: false,
        });
      }
    }
  }

  return { packageManager, commands, findings, debugRecords };
}
