#!/usr/bin/env node

import assert from "node:assert/strict";
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
const picker = readFileSync(
  resolve(root, "skills/openreview/agents/openai.yaml"),
  "utf8",
);
const agents = readFileSync(resolve(root, "AGENTS.md"), "utf8");
const readme = readFileSync(resolve(root, "README.md"), "utf8");

test("openreview is a manual whole-codebase command with a portable fallback", () => {
  assert.match(openreview, /disable-model-invocation: true/);
  assert.match(picker, /allow_implicit_invocation: false/);
  assert.match(openreview, /With no narrower target, review the whole codebase/);
  assert.match(openreview, /does not start the Vercel application/);
  assert.match(openreview, /Absence of that checkout\s+does not block the run/);
  assert.match(agents, /commands are `onboard`, `openreview`, and `quality-audit`/);
  assert.match(readme, /Run a bounded OpenReview-faithful review/);
});

test("openreview actions every verified finding without deciding uncertainty", () => {
  assert.match(openreview, /fix every `Actionable` finding/);
  assert.match(openreview, /A `Decision` or `Unconfirmed` row is not\s+actionable/);
  assert.match(openreview, /two repair attempts per finding and one final\s+rediscovery pass/);
  assert.match(openreview, /\| ID \| State \| Impact \| Finding \| Location \| Required action \| Evidence \|/);
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
