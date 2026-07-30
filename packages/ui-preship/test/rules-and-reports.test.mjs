import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { RULES } from "../src/constants.mjs";
import {
  config,
  git,
  makeRepository,
  packageRoot,
  runCli,
  runJson,
  stage,
  write,
  writeConfig,
} from "./helpers.mjs";

function installBaseUiFixture(root) {
  write(
    resolve(root, "node_modules/@base-ui-components/react/package.json"),
    `${JSON.stringify({ name: "@base-ui-components/react", version: "1.2.3", types: "index.d.ts" })}\n`,
  );
  write(
    resolve(root, "node_modules/@base-ui-components/react/index.d.ts"),
    [
      "export interface TriggerDataAttributes {",
      '  "data-open"?: boolean;',
      '  "data-closed"?: boolean;',
      "}",
      "",
    ].join("\n"),
  );
  const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  manifest.dependencies["@base-ui-components/react"] = "1.2.3";
  write(resolve(root, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

test("UI diffs activate only applicable evidence and never turn heuristics into blockers", () => {
  const root = makeRepository();
  writeConfig(root, config({ blockingMode: "all" }));
  stage(
    root,
    "src/Layout.tsx",
    [
      "export function Layout() {",
      '  return <main className="grid overflow-auto transition-opacity" aria-label="Content" />;',
      "}",
      "",
    ].join("\n"),
  );
  const result = runJson(root, ["check", "--scope", "staged"]);
  assert.equal(result.status, 0);
  assert.ok(result.json.activatedLenses.includes("layout"));
  assert.ok(result.json.activatedLenses.includes("motion"));
  assert.ok(result.json.activatedLenses.includes("design"));
  assert.equal(result.json.findings.every((finding) => !finding.effectiveBlocker), true);
  assert.ok(
    result.json.requiredEvidence.every(
      (item) => item.state && item.mechanism && item.artifact && item.status === "unverified",
    ),
  );
});

test("mutation, shared composition, and public-output diffs route their own evidence", () => {
  const root = makeRepository();
  writeConfig(root);
  stage(
    root,
    "src/components/ui/Submit.tsx",
    "export async function submit() { await fetch('/api'); }\n",
  );
  stage(
    root,
    "src/opengraph-image.tsx",
    "export const ImageResponse = () => <div />;\n",
  );
  const result = runJson(root, ["check", "--scope", "staged"]);
  assert.equal(result.status, 0);
  for (const lens of ["composition", "mutation", "publicOutput"]) {
    assert.ok(result.json.activatedLenses.includes(lens), lens);
  }
});

test("Base UI warnings require installed ownership and preserve Radix and third-party exceptions", () => {
  const baseRoot = makeRepository();
  installBaseUiFixture(baseRoot);
  writeConfig(baseRoot);
  stage(
    baseRoot,
    "src/Popover.tsx",
    [
      'import { Popover } from "@base-ui-components/react/popover";',
      'export const Demo = () => <Popover.Trigger asChild className="data-[state=open]:block" />;',
      "",
    ].join("\n"),
  );
  let result = runJson(baseRoot, ["check", "--scope", "staged"]);
  assert.equal(result.status, 0);
  assert.ok(result.json.findings.some((finding) => finding.ruleId === "UP101"));
  assert.ok(result.json.findings.some((finding) => finding.ruleId === "UP102"));

  const validRoot = makeRepository();
  installBaseUiFixture(validRoot);
  writeConfig(validRoot);
  stage(
    validRoot,
    "src/Menu.tsx",
    [
      'import { Menu } from "@base-ui-components/react/menu";',
      'export const Demo = () => <Menu.Trigger className="data-open:block data-[side=top]:mt-1" />;',
      "",
    ].join("\n"),
  );
  result = runJson(validRoot, ["check", "--scope", "staged"]);
  assert.equal(
    result.json.findings.some((finding) => finding.ruleId === "UP102"),
    false,
  );

  const radixRoot = makeRepository();
  const manifest = JSON.parse(readFileSync(resolve(radixRoot, "package.json"), "utf8"));
  manifest.dependencies["@radix-ui/react-popover"] = "1.0.0";
  write(resolve(radixRoot, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeConfig(radixRoot);
  stage(
    radixRoot,
    "src/Popover.tsx",
    [
      'import * as Popover from "@radix-ui/react-popover";',
      "export const Demo = () => <Popover.Trigger asChild />;",
      "",
    ].join("\n"),
  );
  result = runJson(radixRoot, ["check", "--scope", "staged"]);
  assert.equal(result.status, 0);
  assert.equal(
    result.json.findings.some((finding) => ["UP101", "UP102"].includes(finding.ruleId)),
    false,
  );

  const thirdPartyRoot = makeRepository();
  installBaseUiFixture(thirdPartyRoot);
  writeConfig(thirdPartyRoot);
  stage(
    thirdPartyRoot,
    "src/Other.tsx",
    [
      'import { Thing } from "third-party";',
      'export const Demo = () => <Thing className="data-[state=open]:block" />;',
      "",
    ].join("\n"),
  );
  result = runJson(thirdPartyRoot, ["check", "--scope", "staged"]);
  assert.equal(
    result.json.findings.some((finding) => ["UP101", "UP102"].includes(finding.ruleId)),
    false,
  );
});

test("prompt output is bounded, activated-only, and carries exact rerun and artifact", () => {
  const root = makeRepository();
  installBaseUiFixture(root);
  writeConfig(root);
  stage(
    root,
    "src/components/ui/LayoutMotion.tsx",
    [
      'import { Popover } from "@base-ui-components/react/popover";',
      "export async function Demo() {",
      "  await fetch('/api');",
      '  return <Popover.Trigger asChild className="grid transition-all data-[state=open]:block" aria-label="Open" />;',
      "}",
      "",
    ].join("\n"),
  );
  const result = runCli(root, [
    "review",
    "--scope",
    "staged",
    "--profile",
    "quick",
    "--artifact",
    ".artifacts/prompt.json",
  ]);
  assert.equal(result.status, 0);
  const visible = result.stdout
    .split("\n")
    .filter((line) => /^- (?:FIX|REVIEW|DECIDE) /.test(line));
  assert.ok(visible.length <= 5);
  assert.ok(result.stdout.length < 12_000);
  assert.match(result.stdout, /Full JSON artifact: \.artifacts\/prompt\.json/);
  assert.match(result.stdout, /Exact re-run: ui-preship check --scope staged --profile quick/);
  assert.doesNotMatch(result.stdout, /Aggregate score/i);
});

test("every emitted rule is explainable and unknown IDs exit 2", () => {
  for (const id of Object.keys(RULES)) {
    const result = runCli(packageRoot, ["explain", id]);
    assert.equal(result.status, 0, id);
    assert.match(result.stdout, new RegExp(`^${id} —`));
  }
  const unknown = runCli(packageRoot, ["explain", "UP999"]);
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown rule ID/);
});

test("JSON remains valid on config errors and artifacts are private", () => {
  const root = makeRepository();
  write(resolve(root, "ui-preship.config.json"), "{ invalid\n");
  const result = runJson(root, ["check", "--scope", "all"]);
  assert.equal(result.status, 2);
  assert.equal(result.json.assessment, "unassessed");
  assert.equal(result.json.summary.unverified, 1);
  assert.equal(
    (readFileSync(resolve(root, ".artifacts/report.json")).length > 0),
    true,
  );
  assert.equal(statSync(resolve(root, ".artifacts/report.json")).mode & 0o777, 0o600);

  const invocation = runCli(root, [
    "check",
    "--unsupported",
    "value",
    "--format",
    "json",
  ]);
  assert.equal(invocation.status, 2);
  assert.equal(JSON.parse(invocation.stdout).assessment, "unassessed");
});

test("reasoned baselines prove pre-existing fingerprint failures and stale baselines exit 2", () => {
  const root = makeRepository();
  write(
    resolve(root, "scripts/fail.mjs"),
    'process.stderr.write("repository-wide failure\\n"); process.exit(1);\n',
  );
  const value = config({
    blockingMode: "introduced",
    commands: {
      test: {
        kind: "argv",
        argv: ["node", "scripts/fail.mjs"],
        cwd: ".",
        workspace: null,
        required: true,
        timeoutMs: 10_000,
      },
    },
    profiles: { quick: ["test"], full: ["test"] },
  });
  writeConfig(root, value);
  let result = runCli(root, [
    "baseline",
    "update",
    "--reason",
    "accepted pre-existing fixture debt",
    "--expires",
    "2099-12-31",
  ]);
  assert.equal(result.status, 0, result.stderr);
  stage(root, "README.md", "# fixture\n\nnew docs\n");
  result = runJson(root, ["check", "--scope", "staged"]);
  assert.equal(result.status, 0);
  assert.equal(result.json.findings.find((item) => item.ruleId === "UP002").baselineStatus, "existing");

  const baselinePath = resolve(root, ".ui-preship-baseline.json");
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  baseline.entries[0].expiresAt = "2000-01-01T00:00:00.000Z";
  write(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
  result = runJson(root, ["check", "--scope", "staged"]);
  assert.equal(result.status, 1);
  assert.equal(
    result.json.findings.find((item) => item.ruleId === "UP002").baselineStatus,
    "new-fingerprint",
  );

  baseline.entries[0].expiresAt = "2099-12-31T00:00:00.000Z";
  baseline.rulesetHash = "sha256:stale";
  write(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
  result = runJson(root, ["check", "--scope", "staged"]);
  assert.equal(result.status, 2);
  assert.equal(result.json.assessmentError.ruleId, "UP005");
});

test("exact suppressions do not hide unrelated paths or expired review dates", () => {
  const root = makeRepository();
  write(
    resolve(root, "scripts/fail.mjs"),
    [
      'process.stderr.write("src/App.tsx:1: first\\n");',
      'process.stderr.write("src/Other.tsx:1: second\\n");',
      "process.exit(1);",
      "",
    ].join("\n"),
  );
  writeConfig(
    root,
    config({
      blockingMode: "all",
      commands: {
        test: {
          kind: "argv",
          argv: ["node", "scripts/fail.mjs"],
          cwd: ".",
          workspace: null,
          required: true,
          timeoutMs: 10_000,
        },
      },
      profiles: { quick: ["test"], full: ["test"] },
      suppressions: [
        {
          ruleId: "UP002",
          path: "src/App.tsx",
          reason: "fixture suppression",
          reviewAfter: "2099-01-01",
        },
      ],
    }),
  );
  stage(root, "src/App.tsx", "export const App = () => <div />;\n");
  stage(root, "src/Other.tsx", "export const Other = () => <div />;\n");
  const result = runJson(root, ["check", "--scope", "staged"]);
  assert.equal(result.status, 1);
  const commandFindings = result.json.findings.filter((item) => item.ruleId === "UP002");
  assert.equal(commandFindings.length, 2);
  assert.equal(
    commandFindings.find((item) => item.path === "src/App.tsx").suppressed,
    true,
  );
  assert.equal(
    commandFindings.find((item) => item.path === "src/Other.tsx").effectiveBlocker,
    true,
  );
});

test("the private action pins Node setup and resolves the bundled package without publication", () => {
  const action = readFileSync(resolve(packageRoot, "../../actions/ui-preship/action.yml"), "utf8");
  const manifest = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8"));
  assert.match(
    action,
    /actions\/setup-node@[0-9a-f]{40} # v7\.0\.0/,
  );
  assert.match(action, /node-version: 22\.23\.1/);
  assert.match(action, /\.\.\/\.\.\/packages\/ui-preship/);
  assert.match(action, /--runner github/);
  assert.doesNotMatch(action, /(?:openai|anthropic|claude|model|prompt)/i);
  assert.equal(manifest.private, true);
  assert.equal(manifest.version, "0.1.0");
  assert.deepEqual(manifest.engines, { node: ">=22 <23" });
});

test("the action runner produces advisory PR-delta annotations, summary, and artifact output", () => {
  const root = makeRepository();
  writeConfig(root);
  git(root, ["add", "ui-preship.config.json"]);
  git(root, ["commit", "-qm", "configure preship"]);
  const base = git(root, ["rev-parse", "HEAD"]).trim();
  stage(
    root,
    "src/Layout.tsx",
    'export const Layout = () => <main className="grid" aria-label="Content" />;\n',
  );
  git(root, ["commit", "-qm", "change layout"]);
  const head = git(root, ["rev-parse", "HEAD"]).trim();

  const action = readFileSync(
    resolve(packageRoot, "../../actions/ui-preship/action.yml"),
    "utf8",
  );
  const scriptMatch = action.match(
    /    - name: Run ui-preship[\s\S]*?\n      run: \|\n([\s\S]+)$/,
  );
  assert.ok(scriptMatch);
  const script = scriptMatch[1]
    .split("\n")
    .map((line) => line.replace(/^        /, ""))
    .join("\n");
  const outputPath = resolve(root, "github-output.txt");
  const summaryPath = resolve(root, "github-summary.md");
  const result = spawnSync("bash", ["-e", "-c", script], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      GITHUB_OUTPUT: outputPath,
      GITHUB_STEP_SUMMARY: summaryPath,
      UI_PRESHIP_PACKAGE: packageRoot,
      UI_PRESHIP_CONFIG: "ui-preship.config.json",
      UI_PRESHIP_SCOPE: "changed",
      UI_PRESHIP_BASE: base,
      UI_PRESHIP_HEAD: head,
      UI_PRESHIP_PROFILE: "full",
      UI_PRESHIP_ARTIFACT: ".artifacts/ui-preship/github.json",
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /::warning /);
  assert.match(result.stdout, /0 block/);
  assert.match(
    readFileSync(outputPath, "utf8"),
    /artifact-path=\.artifacts\/ui-preship\/github\.json/,
  );
  assert.match(readFileSync(summaryPath, "utf8"), /## ui-preship/);
  const report = JSON.parse(
    readFileSync(resolve(root, ".artifacts/ui-preship/github.json"), "utf8"),
  );
  assert.equal(report.scope.base.sha, base);
  assert.equal(report.scope.head.sha, head);
  assert.equal(report.blockingMode, "none");
  assert.equal(report.summary.effectiveBlockers, 0);
});
