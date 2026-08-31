# OpenReview implementation loop

Load this reference for Remediation or Direct implementation. The user's explicit implementation language supplies source-mutation authority only for the named plan, IDs, surface, or complete Actionable ledger. It does not authorize installs, paid services, credentials, commits, pushes, pull-request changes, deployments, or product decisions the evidence has not settled.

## Establish the mutation checkpoint

Before editing:

1. Inspect Git state and preserve unrelated work.
2. Freeze the selected ledger rows at the current revision.
3. Reopen every cited source location and complete owner/consumer path reached by the change.
4. Reconcile each evidence identity. Broad “everything” Remediation requires Actionable. An explicitly selected Remediation plan or ID and Direct implementation accept Actionable or Requested change.
5. For a deterministic row, run `openreview-next rules explain <rule-key>` and retain the exact trigger, non-trigger boundary, fix recipe, and verification recipe.
6. For an Advisor row, name the repository evidence and current primary framework source that prove either the defect and replacement contract or the user-settled requested target contract.
7. For a row whose evidence class is Runtime, retain the exact environment, route, tool, capture, and consequence evidence.

Direct implementation of a named change uses the same checkpoint in the working ledger but does not create a plan file unless the user asked for one. Use Requested change when the user settled an additive or behavior-preserving target that is not a defect. If several product-valid outcomes remain, classify the row as Decision and stop that row without blocking independent Actionable or Requested change work.

## Repair at the owning seam

Implement root causes in leverage and dependency order. Change the highest valid framework owner without broadening route-specific behavior into unrelated consumers. Reuse the target repository's conventions and update in-scope tests, fixtures, consumers, and durable instructions only where the contract changed.

Treat scanner diagnostics as source-level repair work. Never make a diagnostic disappear by lowering coverage, changing scope, disabling a rule, adding a suppression, weakening configuration, or hiding the affected file. If the canonical recipe contains a product choice that the ledger did not settle, return that row to Decision.

Run focused verification after each coherent root-cause batch. Run affected broad checks once after the selected set stabilizes. Allow two diagnosed repair attempts per root cause; after that, leave the row Blocked with the exact failing proof rather than layering another workaround.

## Re-audit the affected surface

After implementation:

1. Derive the complete authorized worktree path set from the ledger and Git state, including unstaged and newly created files. Run `openreview-next scan --scope files` with one `--file` per affected path plus `--untracked`; a committed comparison may additionally use changed or lines scope.
2. Confirm every remaining touched and newly created source path is present in `analyzedFiles`. Missing affected paths make scanner acceptance Unverified even when the report says `complete: true`; verify intentional deletions through Git state and affected repository checks instead.
3. Confirm each deterministic diagnostic ID/fingerprint is absent because the trigger is gone.
4. Confirm no new active diagnostic appeared in the affected scope.
5. Re-run the repository checks that prove the changed framework contract.
6. Exercise each required runtime route/state in the environment capable of proving it.
7. Trace affected owners and consumers for bypasses or partial migration.

Scanner unavailability, incomplete coverage, or an unavailable runtime/auth surface makes the dependent acceptance Unverified. It does not erase the implemented source change or turn an Advisor finding into deterministic proof.

## Finish with the result, not the process

Lead with the implementation verdict and highest-impact repaired seam. Report the selected rows in this form:

| ID | Result | Evidence class | Change | Proof | Remaining condition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| OR-001 | Fixed | Deterministic | ... | complete explicit-files scan + focused check | None |

Use Fixed for resolved Actionable defects and Implemented for completed Requested change work, plus Remaining, Regressed, Blocked, or Unverified where applicable. Then state affected checks, runtime coverage, unselected ledger state, and scoped Git state, distinguishing edited, staged, committed, pushed, and deployed. Do not manufacture a remaining issue when the affected surface is clean.
