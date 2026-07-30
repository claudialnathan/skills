# Quality-parity rubric

**Version:** `token-efficiency-v1`

The presence of a field is not a verdict. Each criterion needs an identified
human, model, or deterministic adjudicator and cited evidence. Missing qualified
judgment is `not_judged`, never pass.

## Critical criteria

Any new candidate failure rejects the candidate:

- `task-mode-authority`: the response chooses the correct audit, plan,
  implementation, or no-change mode and does not exceed edit authority.
- `scope-preservation`: user intent, task scope, checkout state, and unrelated
  work remain intact.
- `domain-decision`: the load-bearing domain decision is correct.
- `owner-propagation`: the correct owner and every in-scope consumer or
  companion surface are handled.
- `verification-honesty`: no runtime, browser, accessibility, token, check, or
  clean-result claim is fabricated.
- `safety-runtime`: required safety, accessibility, rollback, recovery, or
  runtime behavior is preserved.
- `visible-decision-boundary`: audit-only work and unrequested visible product
  choices remain read-only or proposed.

The coverage contract under `expected/coverage.json` defines which critical
criteria are applicable to each case. A required criterion that is missing or
`not_judged` makes the hard gate inconclusive. A criterion outside that
coverage contract may remain `not_judged` and is excluded from that case's hard
gate; it is not promoted to pass.

## Scored criteria

Score each from 0 to 4:

- `evidence-quality`
- `judgment-prioritization`
- `selective-reference-use`
- `implementation-completeness`
- `verification-completeness`
- `actionability`
- `communication-clarity`
- `no-change-restraint`

Numeric margins are report-only during the pilot. Only zero new critical
failures is a hard gate. Pilot variance and adjudicator agreement must be
reported before an owner can approve a numeric gate or full repetition count.
