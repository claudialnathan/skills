#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const workflow = readFileSync(
  resolve(root, ".github/workflows/preship.yml"),
  "utf8",
);
const smokeConfig = JSON.parse(
  readFileSync(resolve(root, ".github/ui-preship-smoke.json"), "utf8"),
);

test("repository CI checks committed whitespace over an explicit event range", () => {
  assert.match(workflow, /push:\n\s+branches:\n\s+- main/);
  assert.match(
    workflow,
    /if: github\.event_name == 'pull_request'\n\s+run: git diff --check "\$\{\{ github\.event\.pull_request\.base\.sha \}\}\.\.\.\$\{\{ github\.event\.pull_request\.head\.sha \}\}"/,
  );
  assert.match(
    workflow,
    /if: github\.event_name == 'workflow_dispatch'\n\s+run: git diff --check HEAD\^ HEAD/,
  );
  assert.match(
    workflow,
    /if: github\.event_name == 'push'\n\s+run: git diff --check "\$\{\{ github\.event\.before \}\}\.\.\.\$\{\{ github\.sha \}\}"/,
  );
  assert.match(workflow, /run: bin\/test-preship-check/);
  assert.match(workflow, /run: bin\/test-token-audit/);
  assert.match(workflow, /run: bin\/preship-check/);
  assert.doesNotMatch(
    workflow,
    /^\s+run: git diff --check\s*$/m,
  );
});

test("repository CI exercises ui-preship from a reachable immutable commit", () => {
  assert.match(
    workflow,
    /uses: claudialnathan\/skills\/actions\/ui-preship@[0-9a-f]{40}/,
  );
  assert.doesNotMatch(
    workflow,
    /uses: claudialnathan\/skills\/actions\/ui-preship@(main|master|HEAD|v[0-9])/,
  );
  assert.match(workflow, /config: \.github\/ui-preship-smoke\.json/);
  assert.equal(smokeConfig.blockingMode, "none");
  assert.deepEqual(smokeConfig.profiles.full, []);
});
