#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const openreview = readFileSync(
  resolve(root, "skills/openreview/SKILL.md"),
  "utf8",
);
const orchestration = readFileSync(
  resolve(root, "skills/openreview/references/orchestration.md"),
  "utf8",
);
const catalog = readFileSync(
  resolve(root, "skills/openreview/references/catalog.md"),
  "utf8",
);
const upstreamRoot = resolve(
  root,
  "skills/openreview/references/upstream",
);
const snapshot = JSON.parse(
  readFileSync(resolve(upstreamRoot, "snapshot.json"), "utf8"),
);
const skillsLock = JSON.parse(
  readFileSync(resolve(upstreamRoot, "skills-lock.json.source"), "utf8"),
);
const picker = readFileSync(
  resolve(root, "skills/openreview/agents/openai.yaml"),
  "utf8",
);
const agents = readFileSync(resolve(root, "AGENTS.md"), "utf8");
const readme = readFileSync(resolve(root, "README.md"), "utf8");

test("openreview is a manual whole-codebase command with a bundled engine", () => {
  assert.match(openreview, /disable-model-invocation: true/);
  assert.match(picker, /allow_implicit_invocation: false/);
  assert.match(openreview, /With no narrower target, review the whole codebase/);
  assert.match(openreview, /does not start the Vercel application/);
  assert.match(openreview, /references\/catalog\.md/);
  assert.match(openreview, /complete built-in skill system/);
  assert.match(
    openreview,
    /do not substitute a similarly named installed skill/,
  );
  assert.match(agents, /commands are `openreview` and `quality-audit`/);
  assert.match(
    readme,
    /Run Vercel OpenReview locally with its complete seven-skill catalogue/,
  );
});

test("openreview actions every verified finding without deciding uncertainty", () => {
  assert.match(openreview, /fix every `Actionable` finding/);
  assert.match(openreview, /A `Decision` or `Unconfirmed` row is not\s+actionable/);
  assert.match(openreview, /two repair attempts per finding and one final\s+rediscovery pass/);
  assert.match(
    openreview,
    /\| ID \| State \| Impact \| Finding \| Location \| Required action \| Evidence \|/,
  );
  assert.match(openreview, /Skills: \{loaded with applicability evidence/);
  assert.match(openreview, /does not authorize installing packages/);
  assert.match(openreview, /committing, pushing, opening or merging a pull request/);
});

test("openreview bounds parallel review and preserves serial quality", () => {
  assert.match(orchestration, /at most three reviewer\s+workers/);
  assert.match(orchestration, /reserve the final quarter/);
  assert.match(orchestration, /read-only tools during discovery/);
  assert.match(orchestration, /selected central check results rather than instructions to rerun them/);
  assert.match(orchestration, /review the same units serially/);
  assert.match(orchestration, /2026-08-26 with Claude Code v2\.1\.243/);
});

test("openreview carries an integrity-checked copy of every upstream source", () => {
  const manifest = readFileSync(
    resolve(upstreamRoot, "files.sha256"),
    "utf8",
  )
    .trim()
    .split("\n")
    .map((line) => {
      const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
      assert.ok(match, `invalid source hash row: ${line}`);
      return { expected: match[1], path: match[2] };
    });

  assert.equal(manifest.length, snapshot.totalSourceFileCount);

  for (const { expected, path } of manifest) {
    const source = readFileSync(resolve(upstreamRoot, path));
    const actual = createHash("sha256").update(source).digest("hex");
    assert.equal(actual, expected, `upstream source drifted: ${path}`);
  }

  assert.equal(snapshot.openreview.sourceFileCount, 134);
  assert.equal(
    snapshot.openreview.commit,
    "672deb21e70e471e0536d5ad7a67c14b8359e97e",
  );
});

test("openreview exposes and progressively loads all seven built-in skills", () => {
  const names = Object.keys(skillsLock.skills).sort();
  assert.deepEqual(names, [
    "next-best-practices",
    "next-cache-components",
    "next-upgrade",
    "vercel-composition-patterns",
    "vercel-react-best-practices",
    "vercel-react-native-skills",
    "web-design-guidelines",
  ]);

  for (const name of names) {
    assert.match(catalog, new RegExp("\\| `" + name + "` \\|"));
    assert.match(catalog, new RegExp(`${name}/SKILL\\.md\\.source`));
  }

  assert.match(
    openreview,
    /Load the complete entry instructions for every applicable built-in/,
  );
  assert.match(openreview, /Several\s+skills can apply to one review/);
  assert.match(
    catalog,
    /When an\s+upstream instruction names `foo\.md`, read sibling `foo\.md\.source`/,
  );
  assert.match(catalog, /command\.md\.source/);
  assert.match(catalog, /loading both duplicates the same guidance/);
  assert.match(
    catalog,
    /root OpenReview target, mode, and authority control every entry/,
  );
});
