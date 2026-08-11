# Token-efficiency evaluation

This corpus compares quality and context cost without treating brevity as the
goal. The primary unit is a verified, complete outcome.

## Boundaries

- `scripts/token-eval --validate-corpus` and `--fixture-bakeoff` make no model call.
- A real run requires an owner approval document that validates against
  `tooling/token-audit/approval.schema.json`.
- Conditions use exclusive catalogs and exclude installed machine skills.
- Every run uses a fresh session. A run set is rejected when model, exact
  version, harness, adapter, reasoning, prompt, repository snapshot,
  permissions, or tool availability differs across paired conditions.
- Runtime metrics are `unavailable` unless a named adapter or imported trace
  can observe them. Static availability is never reported as a runtime read.
- The Claude Code adapter uses safe-mode condition injection. Native activation
  is therefore `unavailable`; streamed `Read` calls can still establish
  reference-read metrics.
- Raw prompts, responses, stdout, stderr, provider traces, environment values,
  account data, quota data, billing data, and secrets are absent from default
  artifacts.

## Corpus

`cases/initial-skills.json` gives every published skill audit,
implementation, boundary, selective-load, and unavailable-runtime coverage.
`cases/design-craft.json` adds the paired replacement and routing cases.
Expected authority, proof, and reference behavior live separately under
`expected/` so a fixture cannot pass merely by echoing its prompt.
Those coverage contracts also define critical-criterion applicability. A
required unjudged criterion keeps the hard gate inconclusive; an unjudged
criterion outside the case contract is excluded from that case's gate and is
never promoted to pass.

The five replacement conditions were:

1. frozen pre-merge `design-polish` plus `design-taste` controls;
2. isolated `design-craft` candidate;
3. no skill;
4. candidate plus the compact ambient rule;
5. candidate plus the bounded pre-ship prompt.

`published` is a corpus-only template used for future focused evaluations of
the other initial skills.

The two predecessor controls are now retired historical evidence. Their live
skill paths were removed after the published `designer` merge; control
verification continues to enforce the frozen directory hashes.

## Commands

```sh
scripts/token-eval --validate-corpus
scripts/token-eval --verify-controls
scripts/token-eval --fixture-bakeoff
scripts/token-eval --validate-run path/to/run.json
scripts/token-eval --compare-runs path/to/run-directory
scripts/token-eval --run --pilot \
  --approval working/token-efficiency/approvals/owner-approval.json \
  --adapter evals/token-efficiency/adapters/claude-code-stream.mjs
```

The fixture bakeoff proves evaluator behavior only. It is not model evidence,
quality parity, or authority to retire a skill.

The focused audit, implementation, no-change, selective-load, and
unavailable-runtime pilot contains 22 condition runs. Model adjudication uses a
second fresh blind session per run. The approval example independently
double-scores the five no-change conditions, for 49 Claude Code sessions. The
adapter divides the approved USD amount across the remaining sessions, refuses
API retries or model/tool/plugin drift, reports agreement by rubric dimension,
and stops on observed token or currency excess. Because Claude Code `2.1.220`
cannot hard-cap input or total tokens inside an in-flight request, that
possible one-request overshoot must be named in the owner approval.

Adapter `0.1.7` supplies the canonical rubric text and the case's applicable
critical criteria to future blind judges. The comparator applies the hard gate
only to those coverage-declared criteria.

## Real-run artifacts

Redacted records default to `.artifacts/token-eval/`, which is ignored. Raw
debug capture is opt-in, local-only, mode `0600`, and requires a future
retention deadline. Nothing in this repository uploads evaluation artifacts by
default.

Real approvals, spend ledgers, migration reports, and machine-derived baselines
belong under ignored `working/token-efficiency/`. The public `approvals/`
directory contains a template only.
