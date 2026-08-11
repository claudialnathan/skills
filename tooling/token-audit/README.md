# Static token audit

`scripts/token-audit` measures structural context surfaces without calling a model.
It reports exact JavaScript string code units, UTF-8 bytes, words, and a named
`chars-div-4@1` estimate. The estimate is comparative only; it is never labeled
as provider usage or an exact tokenizer count.

The report keeps these surfaces separate:

- standing catalog strings;
- `SKILL.md` router files;
- declared references and their potential route bundles;
- picker/default prompts;
- scripts whose output can enter an agent context;
- published and machine-local registrations.

Static availability is not runtime use. Activation, loaded-reference, tool
output, and provider-token fields are absent unless a future schema-valid trace
adapter supplies them with provenance.

## Commands

```sh
scripts/token-audit --scope all
scripts/token-audit --scope changed
scripts/token-audit --scope changed --base <git-sha>
scripts/token-audit --scope all --format json
scripts/token-audit --installed
scripts/token-audit --write-baseline working/token-efficiency/baselines/static.json \
  --reason "Explain why this local baseline is accepted"
scripts/token-audit --compare working/token-efficiency/baselines/static.json
scripts/token-audit --explain TE001
```

Baseline writes require a non-empty reason and preserve the frozen predecessor
controls declared in `evals/token-efficiency/controls/controls.json`.
Exceptions are advisory-only and must name one exact path and metric, an
approved value, a reason, supporting case IDs, and an absolute review date.
Wildcards are invalid.

Installed-registration reports can contain absolute home, plugin-cache, and
repository paths. Keep machine-derived baselines under ignored `working/`
storage; do not commit them as portable repository fixtures.

Changed scope combines dirty/untracked working-tree paths with
`<git-sha>...HEAD` when `--base` or `TOKEN_AUDIT_BASE` is supplied. An
unresolvable base is an assessment error rather than a silent empty report.
`scripts/preship-check` runs this changed-skill report as an advisory zero-model
step. Pull-request CI passes the PR base explicitly; normal local pre-ship uses
the working tree.

## Dynamic quality-parity evaluation

`scripts/token-eval` is the explicit dynamic surface. It validates the case corpus,
owner approvals, redacted run records, controlled comparisons, metric
provenance, and adjudication evidence. It does not start a model run without a
schema-valid owner checkpoint that names the exact model/version, harness and
adapter, reasoning, repetitions, token and currency budgets, adjudicator, and
unavailable-metric handling.

```sh
scripts/token-eval --validate-corpus
scripts/token-eval --approval-template
scripts/token-eval --validate-approval path/to/approval.json \
  --adapter path/to/adapter.mjs
scripts/token-eval --fixture-bakeoff
scripts/token-eval --compare-runs path/to/redacted-runs
```

The fixture bakeoff makes zero model calls. It proves that the evaluator rejects
a shorter critical regression, records selective-reference evidence, and
labels missing usage or adjudication as inconclusive. It does not prove the
candidate, authorize predecessor retirement, or supply an owner approval.

## Cadence and spend boundary

| Surface | Cadence | Model calls |
| :--- | :--- | :--- |
| `scripts/preship-check` / `scripts/token-audit --scope changed` | Every local pre-ship, pull request, and `main` push | Never |
| Focused `scripts/token-eval --run --pilot` | After a material trigger, router, reference, or output-contract change | Only with a fresh exact owner approval |
| `scripts/token-eval --run --full` | Reviewed release candidate or scheduled evaluation | Only with a separate full-run approval |

No commit hook, pre-ship command, or default CI job invokes `scripts/token-eval`.
Static reduction remains advisory; the dynamic comparator continues to reject
a shorter candidate with a new critical quality failure.
