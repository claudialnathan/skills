import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

export const ESTIMATOR = {
  name: "chars-div-4",
  version: "1",
  provenance: "estimated",
};

const FRONTMATTER_LIMITS = {
  description: 1024,
  combined: 1536,
};

export function parseFrontmatter(source) {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  if (lines[0] !== "---") return {};
  const result = {};
  let index = 1;

  while (index < lines.length && lines[index] !== "---") {
    const match = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]*(.*))?$/.exec(
      lines[index],
    );
    if (!match) {
      index += 1;
      continue;
    }
    const [, key, raw = ""] = match;
    const scalar = raw.trim();
    if (/^[|>][+-]?$/.test(scalar)) {
      const style = scalar[0];
      const chomping = scalar.slice(1);
      const block = [];
      index += 1;
      while (index < lines.length && lines[index] !== "---") {
        if (/^[A-Za-z_][A-Za-z0-9_-]*:/.test(lines[index])) break;
        block.push(lines[index]);
        index += 1;
      }
      const nonEmpty = block.filter((line) => line.trim().length > 0);
      const indent =
        nonEmpty.length === 0
          ? 0
          : Math.min(
              ...nonEmpty.map((line) => line.length - line.trimStart().length),
            );
      const dedented = block.map((line) => line.slice(Math.min(indent, line.length)));
      let value =
        style === "|"
          ? dedented.join("\n")
          : foldYamlLines(dedented);
      if (chomping === "-") value = value.replace(/\n+$/u, "");
      else if (chomping !== "+") value = `${value.replace(/\n+$/u, "")}\n`;
      result[key] = value;
      continue;
    }
    result[key] = parseScalar(scalar);
    index += 1;
  }
  return result;
}

function parseScalar(value) {
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replaceAll("''", "'");
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  return value;
}

function foldYamlLines(lines) {
  let output = "";
  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index];
    const next = lines[index + 1];
    output += current;
    if (next === undefined) continue;
    output += current === "" || next === "" ? "\n" : " ";
  }
  return output;
}

export function measureText(text) {
  const characters = text.length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/u).length;
  return {
    characters,
    words,
    bytes: Buffer.byteLength(text, "utf8"),
    lines: text === "" ? 0 : text.split("\n").length,
    estimatedTokens: {
      value: Math.ceil(characters / 4),
      unit: "tokens",
      provenance: "estimated",
      source: `${ESTIMATOR.name}@${ESTIMATOR.version}`,
    },
  };
}

export function hashDirectory(directory) {
  const hash = createHash("sha256");
  const files = listFiles(directory);
  for (const file of files) {
    const rel = relative(directory, file).split(sep).join("/");
    hash.update(rel);
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return {
    hash: `sha256:${hash.digest("hex")}`,
    files: files.length,
    bytes: files.reduce((total, file) => total + statSync(file).size, 0),
  };
}

export function listSkillPackages(root) {
  const skillsRoot = join(root, "skills");
  if (!existsSync(skillsRoot)) return [];
  const packages = [];
  for (const name of sortedDirectories(skillsRoot)) {
    const directory = join(skillsRoot, name);
    if (existsSync(join(directory, "SKILL.md"))) {
      packages.push(directory);
      continue;
    }
    // Not a skill itself - a grouping folder such as wip/ or archive/, so
    // look one level deeper for the skills it holds.
    for (const nested of sortedDirectories(directory)) {
      const nestedDirectory = join(directory, nested);
      if (existsSync(join(nestedDirectory, "SKILL.md"))) {
        packages.push(nestedDirectory);
      }
    }
  }
  return packages;
}

export function validateExceptions(document, today = new Date()) {
  const errors = [];
  const warnings = [];
  if (
    document?.schemaVersion !== 1 ||
    !Array.isArray(document?.exceptions)
  ) {
    return {
      errors: ["Exception document must have schemaVersion 1 and an exceptions array."],
      warnings,
    };
  }
  for (const [index, exception] of document.exceptions.entries()) {
    const prefix = `exceptions[${index}]`;
    for (const key of [
      "path",
      "metric",
      "approvedValue",
      "reason",
      "supportingCaseIds",
      "reviewDate",
    ]) {
      if (
        exception[key] === undefined ||
        exception[key] === "" ||
        (Array.isArray(exception[key]) && exception[key].length === 0)
      ) {
        errors.push(`${prefix}.${key} is required.`);
      }
    }
    if (typeof exception.path === "string" && /[*?[]/.test(exception.path)) {
      errors.push(`${prefix}.path must be exact; wildcards are invalid.`);
    }
    if (
      exception.reviewDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(exception.reviewDate)
    ) {
      errors.push(`${prefix}.reviewDate must use YYYY-MM-DD.`);
    } else if (
      exception.reviewDate &&
      exception.reviewDate < today.toISOString().slice(0, 10)
    ) {
      warnings.push(`${prefix} expired on ${exception.reviewDate}.`);
    }
  }
  return { errors, warnings };
}

export function buildStaticReport(root, options = {}) {
  const budgets = readJson(join(root, "tooling/token-audit/budgets.json"));
  const exceptionPath =
    options.exceptionPath ?? join(root, "tooling/token-audit/exceptions.json");
  const exceptions = existsSync(exceptionPath)
    ? readJson(exceptionPath)
    : { schemaVersion: 1, exceptions: [] };
  const exceptionValidation = validateExceptions(exceptions);
  const findings = exceptionValidation.errors.map((message, index) => ({
    id: `TE-EXCEPTION-${index + 1}`,
    level: "error",
    surface: "exceptions",
    message,
  }));
  findings.push(
    ...exceptionValidation.warnings.map((message, index) => ({
      id: `TE-EXPIRED-${index + 1}`,
      level: "warning",
      surface: "exceptions",
      message,
    })),
  );

  const allPackages = listSkillPackages(root);
  const selection = selectPackages(
    root,
    allPackages,
    options.scope ?? "all",
    options.changedBase,
  );
  const selectedPackages = selection.packages;
  if (selection.error) {
    findings.push({
      id: "TE011",
      level: "error",
      surface: "change-scope",
      message: selection.error,
    });
  }
  const seenNames = new Map();
  const catalog = [];
  const mainFiles = [];
  const routeBundles = [];
  const generatedPrompts = [];
  const commandOutputRisks = [];
  const packageMeasurements = [];

  for (const directory of selectedPackages) {
    const skillPath = join(directory, "SKILL.md");
    const source = readFileSync(skillPath, "utf8");
    const frontmatter = parseFrontmatter(source);
    const name = String(frontmatter.name || basename(directory));
    const description = String(frontmatter.description ?? "");
    const whenToUse = String(frontmatter.when_to_use ?? "");
    const combined = `${description}${whenToUse}`;
    const relSkillPath = normalizePath(relative(root, skillPath));
    const openAiPath = join(directory, "agents/openai.yaml");
    const openAiSource = existsSync(openAiPath)
      ? readFileSync(openAiPath, "utf8")
      : "";
    const implicit =
      !/^disable-model-invocation:\s*true\s*$/m.test(source) &&
      !/allow_implicit_invocation:\s*false\s*$/m.test(openAiSource);

    const prior = seenNames.get(name);
    if (prior) {
      findings.push({
        id: "TE001",
        level: "error",
        surface: "catalog",
        path: relSkillPath,
        message: `Duplicate canonical skill name ${name}; first seen at ${prior}.`,
      });
    } else {
      seenNames.set(name, relSkillPath);
    }

    const descriptionMetrics = measureText(description);
    const combinedMetrics = measureText(combined);
    catalog.push({
      name,
      path: relSkillPath,
      implicit,
      description: descriptionMetrics,
      whenToUse: measureText(whenToUse),
      descriptionAndWhenToUse: combinedMetrics,
    });

    if (descriptionMetrics.characters > FRONTMATTER_LIMITS.description) {
      findings.push({
        id: "TE002",
        level: "error",
        surface: "catalog",
        path: relSkillPath,
        metric: "catalog.descriptionChars",
        measured: descriptionMetrics.characters,
        limit: FRONTMATTER_LIMITS.description,
        message: "Description exceeds the cross-harness hard limit.",
      });
    } else if (
      descriptionMetrics.characters >
      budgets.advisoryReviewThresholds["catalog.descriptionChars"]
    ) {
      addAdvisory({
        findings,
        exceptions,
        id: "TE003",
        path: relSkillPath,
        metric: "catalog.descriptionChars",
        measured: descriptionMetrics.characters,
        limit:
          budgets.advisoryReviewThresholds["catalog.descriptionChars"],
        message: "Description exceeds the advisory standing-context review threshold.",
      });
    }
    if (combinedMetrics.characters > FRONTMATTER_LIMITS.combined) {
      findings.push({
        id: "TE004",
        level: "error",
        surface: "catalog",
        path: relSkillPath,
        metric: "catalog.descriptionAndWhenToUseChars",
        measured: combinedMetrics.characters,
        limit: FRONTMATTER_LIMITS.combined,
        message: "Combined catalog fields exceed the Claude listing hard limit.",
      });
    }

    const mainMetrics = measureText(source);
    mainFiles.push({
      name,
      path: relSkillPath,
      ...mainMetrics,
    });
    if (
      mainMetrics.characters >
      budgets.advisoryReviewThresholds["skill.mainChars"]
    ) {
      addAdvisory({
        findings,
        exceptions,
        id: "TE005",
        path: relSkillPath,
        metric: "skill.mainChars",
        measured: mainMetrics.characters,
        limit: budgets.advisoryReviewThresholds["skill.mainChars"],
        message: "Router exceeds the advisory main-file review threshold.",
      });
    }

    const declaredReferences = [
      ...new Set(source.match(/references\/[A-Za-z0-9_.-]+\.md/g) ?? []),
    ].sort();
    const referenceRows = [];
    for (const reference of declaredReferences) {
      const absolute = join(directory, reference);
      if (!existsSync(absolute)) {
        findings.push({
          id: "TE006",
          level: "error",
          surface: "route",
          path: relSkillPath,
          message: `Declared reference is missing: ${reference}.`,
        });
        continue;
      }
      const referenceSource = readFileSync(absolute, "utf8");
      const metrics = measureText(referenceSource);
      const relReference = normalizePath(relative(root, absolute));
      referenceRows.push({ path: relReference, ...metrics });
      if (
        metrics.characters >
        budgets.advisoryReviewThresholds["reference.singleFileChars"]
      ) {
        addAdvisory({
          findings,
          exceptions,
          id: "TE007",
          path: relReference,
          metric: "reference.singleFileChars",
          measured: metrics.characters,
          limit:
            budgets.advisoryReviewThresholds["reference.singleFileChars"],
          message: "Reference exceeds the advisory single-file review threshold.",
        });
      }
    }
    const potentialSource = [
      source,
      ...referenceRows.map((row) =>
        readFileSync(join(root, row.path), "utf8"),
      ),
    ].join("");
    routeBundles.push({
      name,
      mainPath: relSkillPath,
      routeKind: "declared-potential",
      declaredReferences: referenceRows,
      potentialBundle: measureText(potentialSource),
    });

    const defaultPrompt = extractYamlString(openAiSource, "default_prompt");
    if (defaultPrompt !== undefined) {
      const promptPath = normalizePath(relative(root, openAiPath));
      const metrics = measureText(defaultPrompt);
      generatedPrompts.push({
        name,
        path: promptPath,
        field: "interface.default_prompt",
        ...metrics,
      });
      if (
        metrics.characters >
        budgets.hardSpecificationLimits["generatedPrompt.chars"]
      ) {
        findings.push({
          id: "TE008",
          level: "error",
          surface: "generated-prompt",
          path: promptPath,
          metric: "generatedPrompt.chars",
          measured: metrics.characters,
          limit:
            budgets.hardSpecificationLimits["generatedPrompt.chars"],
          message: "Declared generated prompt exceeds its hard character budget.",
        });
      } else if (
        metrics.characters >
        budgets.advisoryReviewThresholds["generatedPrompt.chars"]
      ) {
        addAdvisory({
          findings,
          exceptions,
          id: "TE009",
          path: promptPath,
          metric: "generatedPrompt.chars",
          measured: metrics.characters,
          limit:
            budgets.advisoryReviewThresholds["generatedPrompt.chars"],
          message: "Declared generated prompt exceeds its advisory review threshold.",
        });
      }
    }

    const packageHash = hashDirectory(directory);
    packageMeasurements.push({
      name,
      path: normalizePath(relative(root, directory)),
      ...packageHash,
    });
    for (const script of listFiles(join(directory, "scripts"))) {
      commandOutputRisks.push({
        name,
        path: normalizePath(relative(root, script)),
        surface: "skill-script",
        declaredOutputBudget:
          budgets.advisoryReviewThresholds["toolOutput.singleSummaryChars"],
      });
    }
  }

  for (const script of listFiles(join(root, "bin"))) {
    commandOutputRisks.push({
      name: basename(script),
      path: normalizePath(relative(root, script)),
      surface: "repository-command",
      declaredOutputBudget:
        budgets.advisoryReviewThresholds["toolOutput.singleSummaryChars"],
    });
  }

  const sourceHash = hashSelectedPackages(root, allPackages);
  const installed =
    options.installed === true
      ? inspectInstalledRegistrations(root, allPackages)
      : undefined;
  if (installed) {
    for (const duplicate of installed.duplicates) {
      findings.push({
        id: "TE010",
        level: "warning",
        surface: "installed-registration",
        name: duplicate.name,
        harness: duplicate.harness,
        message: `${duplicate.name} has ${duplicate.count} effective ${duplicate.harness} registrations.`,
      });
    }
  }

  const report = {
    schemaVersion: 1,
    assessment: findings.some((finding) => finding.level === "error")
      ? "assessment-error"
      : "assessed",
    scope: options.scope ?? (options.installed ? "installed" : "all"),
    source: {
      revision: gitValue(root, ["rev-parse", "HEAD"]) ?? "unavailable",
      workingTree: gitWorkingTree(root),
      skillContentHash: sourceHash,
      changedBase: selection.base,
    },
    estimator: ESTIMATOR,
    budgets,
    publishedCatalogs: buildPublishedCatalogs(root, catalog),
    catalog,
    mainFiles,
    routeBundles,
    generatedPrompts,
    commandOutputRisks,
    packages: packageMeasurements,
    findings,
    summary: summarize({
      catalog,
      mainFiles,
      routeBundles,
      generatedPrompts,
      packageMeasurements,
      findings,
    }),
  };
  if (installed) {
    report.installedRegistrations = installed.registrations;
    report.installedDuplicates = installed.duplicates;
  }
  return report;
}

function selectPackages(root, packages, scope, changedBase) {
  if (scope !== "changed") {
    return { packages, base: null, error: null };
  }
  const changed = new Set();
  const status = gitRawValue(root, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
  if (status !== undefined) {
    for (const path of status
      .split("\n")
      .filter(Boolean)
      .map((line) => line.slice(3).split(" -> ").at(-1))
      .map(normalizePath)) {
      changed.add(path);
    }
  }
  if (changedBase) {
    const diff = gitRawValue(root, [
      "diff",
      "--name-only",
      `${changedBase}...HEAD`,
    ]);
    if (diff === undefined) {
      return {
        packages: [],
        base: changedBase,
        error: `Cannot resolve changed-file base ${changedBase}.`,
      };
    }
    for (const path of diff.split("\n").filter(Boolean).map(normalizePath)) {
      changed.add(path);
    }
  } else if (status === undefined) {
    return { packages, base: null, error: null };
  }
  return {
    packages: packages.filter((directory) => {
      const prefix = `${normalizePath(relative(root, directory))}/`;
      return [...changed].some((path) => path.startsWith(prefix));
    }),
    base: changedBase ?? null,
    error: null,
  };
}

function buildPublishedCatalogs(root, catalog) {
  const byPath = new Map(catalog.map((row) => [dirname(row.path), row]));
  const manifests = [
    ["claude", ".claude-plugin/plugin.json"],
    ["cursor", ".cursor-plugin/plugin.json"],
    ["codex", ".agents/plugins/marketplace.json"],
  ];
  const catalogs = [];
  for (const [harness, path] of manifests) {
    const absolute = join(root, path);
    if (!existsSync(absolute)) continue;
    let entries;
    if (harness === "codex") {
      entries = catalog;
    } else {
      const manifest = readJson(absolute);
      entries = (manifest.skills ?? [])
        .map((entry) => byPath.get(entry.replace(/^\.\//u, "")))
        .filter(Boolean);
    }
    catalogs.push({
      harness,
      manifest: path,
      entries: entries.length,
      descriptionAndWhenToUseCharacters: entries.reduce(
        (total, entry) =>
          total + entry.descriptionAndWhenToUse.characters,
        0,
      ),
      estimate: {
        value: Math.ceil(
          entries.reduce(
            (total, entry) =>
              total + entry.descriptionAndWhenToUse.characters,
            0,
          ) / 4,
        ),
        unit: "tokens",
        provenance: "estimated",
        source: `${ESTIMATOR.name}@${ESTIMATOR.version}`,
      },
    });
  }
  return catalogs;
}

function addAdvisory({
  findings,
  exceptions,
  id,
  path,
  metric,
  measured,
  limit,
  message,
}) {
  const exception = exceptions.exceptions.find(
    (item) => item.path === path && item.metric === metric,
  );
  const active =
    exception &&
    exception.reviewDate >= new Date().toISOString().slice(0, 10) &&
    measured <= exception.approvedValue;
  findings.push({
    id,
    level: active ? "info" : "warning",
    surface: metric.split(".")[0],
    path,
    metric,
    measured,
    limit,
    exception: active ? "active" : "none",
    message,
  });
}

function inspectInstalledRegistrations(root, packages) {
  const canonicalNames = new Set(
    packages.map((directory) => {
      const frontmatter = parseFrontmatter(
        readFileSync(join(directory, "SKILL.md"), "utf8"),
      );
      return String(frontmatter.name || basename(directory));
    }),
  );
  const home = process.env.TOKEN_AUDIT_HOME ?? homedir();
  const surfaces = [
    ["codex", join(home, ".agents/skills"), "personal-or-symlink"],
    ["cursor", join(home, ".cursor/skills"), "personal-or-symlink"],
    ["claude", join(home, ".claude/skills"), "personal-or-symlink"],
    ["codex", join(home, ".codex/plugins/cache"), "plugin-cache"],
    ...claudeInstallPaths(home).map((path) => [
      "claude",
      path,
      "installed-plugin",
    ]),
  ];
  const registrations = [];
  for (const [harness, directory, sourceKind] of surfaces) {
    for (const skillFile of findSkillFiles(directory, 10)) {
      const frontmatter = parseFrontmatter(readFileSync(skillFile, "utf8"));
      const name = String(frontmatter.name || basename(dirname(skillFile)));
      if (!canonicalNames.has(name)) continue;
      const registrationPath = normalizePath(skillFile);
      let resolvedPath = registrationPath;
      try {
        resolvedPath = normalizePath(realpathSync(skillFile));
      } catch {
        // Retain the registration path when a stale link cannot resolve.
      }
      registrations.push({
        name,
        harness,
        sourceKind,
        registrationPath,
        resolvedPath,
        isSymlink: isPathWithinSymlink(skillFile, directory),
        pointsToRepository: resolvedPath.startsWith(`${normalizePath(root)}/`),
      });
    }
  }
  registrations.sort((a, b) =>
    `${a.harness}:${a.name}:${a.registrationPath}`.localeCompare(
      `${b.harness}:${b.name}:${b.registrationPath}`,
    ),
  );
  const groups = new Map();
  for (const registration of registrations) {
    const key = `${registration.harness}:${registration.name}`;
    const rows = groups.get(key) ?? [];
    rows.push(registration);
    groups.set(key, rows);
  }
  const duplicates = [...groups.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => ({
      harness: key.split(":")[0],
      name: key.slice(key.indexOf(":") + 1),
      count: rows.length,
      sources: rows.map((row) => row.registrationPath),
    }));
  return { registrations, duplicates };
}

function claudeInstallPaths(home) {
  const manifestPath = join(home, ".claude/plugins/installed_plugins.json");
  if (!existsSync(manifestPath)) {
    return [join(home, ".claude/plugins/cache")];
  }
  try {
    const manifest = readJson(manifestPath);
    return [
      ...new Set(
        Object.values(manifest.plugins ?? {})
          .flat()
          .map((entry) => entry?.installPath)
          .filter((path) => typeof path === "string" && path.length > 0),
      ),
    ].sort();
  } catch {
    return [join(home, ".claude/plugins/cache")];
  }
}

function isPathWithinSymlink(file, root) {
  let current = dirname(file);
  const boundary = resolve(root);
  while (current.startsWith(boundary)) {
    try {
      if (lstatSync(current).isSymbolicLink()) return true;
    } catch {
      return false;
    }
    if (current === boundary) break;
    current = dirname(current);
  }
  return false;
}

function findSkillFiles(directory, maxDepth, depth = 0) {
  if (!existsSync(directory) || depth > maxDepth) return [];
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const results = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(directory, entry.name);
    if (entry.isFile() && entry.name === "SKILL.md") results.push(path);
    else if (entry.isDirectory() || entry.isSymbolicLink()) {
      results.push(...findSkillFiles(path, maxDepth, depth + 1));
    }
  }
  return results;
}

function summarize({
  catalog,
  mainFiles,
  routeBundles,
  generatedPrompts,
  packageMeasurements,
  findings,
}) {
  return {
    skills: catalog.length,
    catalogCharacters: catalog.reduce(
      (total, row) => total + row.descriptionAndWhenToUse.characters,
      0,
    ),
    mainCharacters: mainFiles.reduce(
      (total, row) => total + row.characters,
      0,
    ),
    mainBytes: mainFiles.reduce((total, row) => total + row.bytes, 0),
    directReferenceCharacters: routeBundles.reduce(
      (total, row) =>
        total +
        row.declaredReferences.reduce(
          (sum, reference) => sum + reference.characters,
          0,
        ),
      0,
    ),
    directReferenceBytes: routeBundles.reduce(
      (total, row) =>
        total +
        row.declaredReferences.reduce(
          (sum, reference) => sum + reference.bytes,
          0,
        ),
      0,
    ),
    potentialRouteCharacters: routeBundles.reduce(
      (total, row) => total + row.potentialBundle.characters,
      0,
    ),
    potentialRouteBytes: routeBundles.reduce(
      (total, row) => total + row.potentialBundle.bytes,
      0,
    ),
    generatedPromptCharacters: generatedPrompts.reduce(
      (total, row) => total + row.characters,
      0,
    ),
    packageBytes: packageMeasurements.reduce(
      (total, row) => total + row.bytes,
      0,
    ),
    errors: findings.filter((finding) => finding.level === "error").length,
    warnings: findings.filter((finding) => finding.level === "warning").length,
    infos: findings.filter((finding) => finding.level === "info").length,
  };
}

function hashSelectedPackages(root, packages) {
  const hash = createHash("sha256");
  for (const directory of packages) {
    const packageHash = hashDirectory(directory);
    hash.update(normalizePath(relative(root, directory)));
    hash.update("\0");
    hash.update(packageHash.hash);
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

function extractYamlString(source, key) {
  const match = new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, "m").exec(source);
  if (!match) return undefined;
  return parseScalar(match[1]);
}

function gitWorkingTree(root) {
  const status = gitValue(root, ["status", "--porcelain=v1"]);
  if (status === undefined) return "unavailable";
  return status === "" ? "clean" : "dirty";
}

function gitValue(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

function gitRawValue(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return undefined;
  }
}

function sortedDirectories(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizePath(path) {
  return path.split(sep).join("/");
}
