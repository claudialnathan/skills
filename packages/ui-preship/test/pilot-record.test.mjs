import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { packageRoot } from "./helpers.mjs";

test("the Phase 5 pilot records all five advisory applicability contracts", () => {
  const report = JSON.parse(
    readFileSync(resolve(packageRoot, "pilot/2026-07-29.json"), "utf8"),
  );
  assert.equal(report.package.installedFromPackedTarball, true);
  assert.equal(report.posture.modelCalls, 0);
  assert.equal(report.posture.blockingPromotions, 0);
  assert.equal(report.posture.publication, false);
  assert.equal(report.posture.remoteImmutableActionExecution, "unverified");
  assert.equal(report.results.length, 5);
  assert.deepEqual(
    report.results.map((result) => result.id),
    [
      "next-base-ui-tailwind",
      "react-no-shadcn",
      "radix-shadcn",
      "explicit-monorepo",
      "non-react",
    ],
  );
  assert.equal(
    report.results.every(
      (result) =>
        result.assessment === "assessed" &&
        result.blockingMode === "none" &&
        result.effectiveBlockers === 0 &&
        result.promptChars <= 6_000 &&
        result.falsePositiveIds.length === 0,
    ),
    true,
  );
  const baseUi = report.results.find(
    (result) => result.id === "next-base-ui-tailwind",
  );
  assert.deepEqual(baseUi.actionableFindingIds, ["UP101", "UP102"]);
  const radix = report.results.find((result) => result.id === "radix-shadcn");
  assert.deepEqual(radix.actionableFindingIds, []);
  const monorepo = report.results.find(
    (result) => result.id === "explicit-monorepo",
  );
  assert.equal(monorepo.repositoryWorkspace, "apps/web");
  const nonReact = report.results.find((result) => result.id === "non-react");
  assert.deepEqual(nonReact.activatedLenses, []);
  assert.equal(nonReact.unverified, 0);
  assert.equal(report.totals.falsePositives, 0);
  assert.equal(report.totals.effectiveBlockers, 0);
});

test("the post-pilot report records external immutable action execution", () => {
  const evidence = readFileSync(
    resolve(packageRoot, "pilot/2026-07-30-immutable-action.md"),
    "utf8",
  );

  assert.match(
    evidence,
    /claudialnathan\/skills\/actions\/ui-preship@9f3088b36b19ab931e09c8c955309ce4c88c7d2a/,
  );
  assert.match(evidence, /actions\/runs\/30514855733/);
  assert.match(evidence, /job\/90782298949/);
  assert.match(
    evidence,
    /0 block · 0 deterministic failure · 0 warning · 0 decision · 0 unverified/,
  );
  assert.match(evidence, /does not publish the npm package/);
});
