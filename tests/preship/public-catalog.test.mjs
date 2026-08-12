#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
// No manifest enumerates the skills any more: Agent Plugins 1.0.0 section 7.1 fixes
// discovery at the immediate children of skills/, so the filesystem is the catalogue
// and the README is checked against it directly.
const skillNames = readdirSync(resolve(root, "skills"), {
  withFileTypes: true,
})
  .filter(
    (entry) =>
      entry.isDirectory() &&
      existsSync(resolve(root, "skills", entry.name, "SKILL.md")),
  )
  .map((entry) => entry.name)
  .sort();
const readme = readFileSync(resolve(root, "README.md"), "utf8");
const rootLicense = readFileSync(resolve(root, "LICENSE"), "utf8");

test("README skill catalogue matches the skills on disk", () => {
  const readmeSkills = [...readme.matchAll(
    /<td><code>([a-z0-9-]+)<\/code><\/td>/g,
  )]
    .map((match) => match[1])
    .sort();

  assert.deepEqual(readmeSkills, skillNames);
});

test("public manifests and the packed package use the repository MIT license", () => {
  const manifestPaths = [
    "plugin.json",
    ".claude-plugin/plugin.json",
    ".codex-plugin/plugin.json",
    "packages/ui-preship/package.json",
    "packages/ui-preship/package-lock.json",
  ];

  for (const manifestPath of manifestPaths) {
    const packageManifest = JSON.parse(
      readFileSync(resolve(root, manifestPath), "utf8"),
    );
    const declaredLicense = manifestPath.endsWith("package-lock.json")
      ? packageManifest.packages[""].license
      : packageManifest.license;

    assert.equal(declaredLicense, "MIT", manifestPath);
  }

  assert.match(rootLicense, /^MIT License\n/);
  assert.equal(
    readFileSync(resolve(root, "packages/ui-preship/LICENSE"), "utf8"),
    rootLicense,
  );
});
