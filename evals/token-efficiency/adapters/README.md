# Harness adapter contract

An adapter exports:

```js
export const manifest = {
  id: "adapter-id",
  version: "exact-version",
  harness: { name: "harness", version: "exact-version" },
  capabilities: {
    activation: true,
    referenceReads: true,
    toolOutput: true,
    usage: true,
  },
  freshSessionPerRun: true,
  supportsExclusiveCatalog: true,
  enforcesBudget: true,
  testOnly: false,
};

export async function runEvaluation(planItem, context) {
  return schemaValidRedactedRun;
}
```

The manifest must match the owner approval exactly. The adapter receives one
randomized plan item and must create a fresh session with only that condition's
catalog. It must enforce the remaining token and currency budget before
starting a call, emit only bounded redacted evidence, and return a record that
validates against `tooling/token-audit/run.schema.json`.

Unsupported activation, reference-read, tool-output, or usage metrics remain
`unavailable`. The adapter may not infer them from files available to the
model.

The checked-in fixture adapter is test-only and makes zero model calls. A
fixture result cannot establish quality parity or authorize retirement.

## Claude Code stream adapter

`claude-code-stream.mjs` targets Claude Code `2.1.220` as observed on
2026-07-28. It uses `--safe-mode`, excludes user/project/local setting sources,
passes an explicit empty plugin map, disables slash commands, exposes only the
approved filesystem tools, starts every subject and judge in a fresh
non-persisted process, and requires the `system/init` event to report no loaded
plugins. Frozen condition guidance is injected explicitly; its reference
directory is the only additional readable directory.

The adapter also disables headless prompt suggestions because they are outside
the evaluation task. A live attempt showed that Haiku remained in
`result.modelUsage` with suggestions disabled, so this surface was not the
source of the auxiliary model.

Claude Code can also use its Haiku-class small-fast model for background tasks.
The adapter sets both `ANTHROPIC_DEFAULT_HAIKU_MODEL` and the deprecated
`ANTHROPIC_SMALL_FAST_MODEL` to the approval's exact model inside every child
process. This retains the harness behavior while keeping all provider-reported
model usage on the approved model identity.

Blind judges use Claude Code's `--json-schema` structured-output interface.
Claude Code `2.1.220` reports its internal `StructuredOutput` mechanism in the
init tool inventory for those sessions. The adapter requires that built-in for
schema-constrained judges and permits it nowhere else; judge sessions still
receive no filesystem or external tools.

This isolation keeps native skill activation unavailable rather than inferring
it from injected guidance. Reference reads remain observable when the model
uses the streamed `Read` tool. Browser and rendered-verification metrics remain
unavailable.

The adapter retains only bounded redacted evidence, provider usage, normalized
reference paths, disposable diffs, deterministic fixture checks, and blind
rubric rows. Adapter `0.1.6` records subject-plus-judge input, cached-input,
output, total-token, and cost aggregates on each successful record so every
approved budget category remains auditable after completion. A rejected
completed stream additionally records its init, assistant-message, and
result-usage model names, approved tool names, plugin count and names, provider
usage, and cumulative evaluation ledger. It does not persist the stream,
prompts, complete responses, session IDs, account data, or credentials.

Adapter `0.1.7` also sends the canonical rubric text and the
coverage-declared applicable critical criteria to every future blind judge.
Non-applicable critical rows may remain `not_judged`; the comparator excludes
them from that case's hard gate without promoting them to pass. Required
unjudged criteria still make the gate inconclusive.

Claude Code enforces the allocated USD limit before each process and the
adapter stops after provider usage crosses an approved token limit. Claude Code
`2.1.220` has no per-process input or total-token flag, so one in-flight request
can cross a remaining token threshold before the adapter observes it. The
owner approval must explicitly accept that bounded overshoot risk or select a
harness with a hard token cap.

The focused five-case pilot expands to 22 subject sessions and 22 independent
blind-judge sessions because `DC-LOAD-001` permits only current and candidate
while the other four cases permit all five conditions. The approval example
double-scores all five `DC-BOUNDARY-001` conditions to estimate judge
reliability, producing 49 sessions total. Disagreements merge conservatively
and remain visible by rubric dimension. The first approval authorizes only
those pilot sessions.

Primary references:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-usage)
- [Non-interactive stream output](https://code.claude.com/docs/en/headless)
- [Claude Code authentication](https://code.claude.com/docs/en/authentication)
