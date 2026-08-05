#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
// Claude's manifest lists only the skills/wip/ and skills/archive/ directory
// pointers (flat top-level skills auto-discover, so a leaf name no longer
// appears there); Cursor's manifest is the one still required to enumerate
// every shipped skill by exact leaf path, so it is the source of truth here.
const manifest = JSON.parse(
  readFileSync(resolve(root, ".cursor-plugin/plugin.json"), "utf8"),
);
const readme = readFileSync(resolve(root, "README.md"), "utf8");
const rootLicense = readFileSync(resolve(root, "LICENSE"), "utf8");

test("README skill catalogue matches the explicit Cursor plugin manifest", () => {
  const manifestSkills = manifest.skills
    .map((skillPath) => skillPath.split("/").at(-1))
    .sort();
  const readmeSkills = [...readme.matchAll(
    /<td><code>([a-z0-9-]+)<\/code><\/td>/g,
  )]
    .map((match) => match[1])
    .sort();

  assert.deepEqual(readmeSkills, manifestSkills);
});

test("public manifests and the packed package use the repository MIT license", () => {
  const manifestPaths = [
    ".claude-plugin/plugin.json",
    ".codex-plugin/plugin.json",
    ".cursor-plugin/plugin.json",
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
