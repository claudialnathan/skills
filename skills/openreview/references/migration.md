# Legacy `action` migration

The former OpenReview command treated `action` as immediate authority to review and edit every verified finding in one invocation. That combined discovery, product decisions, and broad mutation before a stable diagnostic contract or selected plan existed.

Preserve the owner's intent to resolve every verified Actionable row without silently preserving the old authority boundary:

1. State that `action` is deprecated.
2. Run Review mode read-only and freeze the complete ledger.
3. Treat the legacy request itself as selection of every Actionable row and write one self-contained plan per Actionable root cause.
4. Keep Decision, Runtime required, and Unconfirmed rows outside executable steps.
5. Require `execute-plan <path or ID>` before product-source mutation.
6. Reconcile each selected plan against the current revision before execution.

Suggested response for a bare legacy invocation:

> `action` now preserves fix-everything intent through a scanner-backed ledger and plans, but it no longer grants immediate repository-wide edit authority. I’ll run the read-only review first; select the resulting IDs or invoke `openreview execute-plan <plan>` to start mutation.

Do not describe `action` as an alias for `execute-plan`; that would silently reinterpret legacy breadth as authority for an unspecified plan. Do not discard the intent either: keep every verified Actionable row in the ledger and make the plan set cover all selected rows.
