# OpenReview plan template

Write one file per selected root cause. Keep prose paragraphs physically unwrapped.

```markdown
# <imperative plan title>

Status: READY
Target revision: <full commit SHA>
Selected ledger IDs: <OR-IDs>
Evidence identity: <deterministic rule key, diagnostic ID, and fingerprint; or advisor/runtime finding ID and exact retained evidence>
Evidence class: <Deterministic|Advisor|Runtime>
Ledger state: Actionable

## Outcome

<One falsifiable paragraph describing the resulting framework behavior and why it matters.>

## Current evidence

- `<path:line>` — <exact current behavior and relevant code excerpt>
- Scanner — <schema/tool version, complete/incomplete, trigger evidence, suppression state>
- Canonical rule — <source URLs, trigger/non-trigger boundary, ambiguity>
- Repository exemplar — `<path:line>` — <local convention to preserve>
- Runtime — <exact environment/URL/tool evidence, or Unverified with the missing mechanism>

## Decisions already settled

- <Only decisions supported by the selected ledger and owner response.>

## Out of scope

- <Adjacent changes, unresolved decisions, and unrelated diagnostics that must remain untouched.>

## Implementation

1. In `<exact path>`, <specific source change using the canonical recipe and current symbols>.
2. In `<exact path>`, <test or fixture proving the trigger and non-trigger>.
3. Preserve <public API, freshness semantics, routing ownership, accessibility, or local convention>.

## Verification

- Deterministic proof: when a scanner diagnostic exists, `<exact OpenReview command>` removes diagnostic `<ID/fingerprint>` with complete coverage and no new suppressions/config weakening.
- Advisor/runtime proof: when no scanner diagnostic exists, `<exact repository or runtime check>` disproves the recorded failure condition with `<expected evidence>`.
- Regression scan: `<exact OpenReview command>` completes without new active diagnostics in the affected scope.
- Focused: `<exact test/typecheck/lint command>` produces <expected artifact>.
- Broad: `<exact affected repository check>` produces <expected artifact>.
- Runtime: at `<environment and URL/state>`, use `<mechanism>` to observe `<falsifiable behavior>`; otherwise report Unverified.

## Executor stop conditions

- Stop if <assumption becomes false, plan is stale, Decision remains, credentials/install/deploy are needed, or unrelated work overlaps>.
- Do not choose between <named product-valid options>.
```

Instantiate this template only for Actionable rows. A Decision, Runtime required, or Unconfirmed row cannot be `READY` and stays in the ledger until its missing decision or evidence is resolved. Keep only the applicable deterministic or advisor/runtime proof line; never require a nonexistent diagnostic to disappear.

Plans must contain enough current source and canonical rule detail for an executor with no conversation context. Do not write “apply the scanner recommendation” without inlining the exact recipe and semantic choice already settled.

Maintain `plans/README.md` with columns for plan, ledger IDs, dependency, target revision, status, and last reconciliation date. Use `READY`, `IN PROGRESS`, `BLOCKED`, `DONE`, or `STALE` without inventing completion from incomplete scanner coverage.
