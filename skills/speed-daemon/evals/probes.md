# speed-daemon — earning-failure probes

Runnable re-test fixtures for the failures that earn this skill its place. Run on each major model release (or on adoption of a new working model). Each probe is a task for a **fresh session with this skill withheld**; the verdict is whether the unaided model produces the failure signature or the pass criterion. Judge the code it writes, not what it says.

**Deletion rule: the skill dies only when *all* probes pass unaided.** A single passing probe is the trap this file exists to prevent — see the baseline below.

How to run: for each probe, open a fresh session in a scratch React project — use `claude --safe-mode` for the unaided baseline, since this skill auto-loads on component paths and would otherwise contaminate it (or drive `claude -p` per probe, the `forge` skill's `evals/invocation-eval.js` pattern). Give the prompt verbatim and grade the produced handler/component against the criterion. Then run once more with the skill invoked to confirm it still steers. Record verdicts per probe in CHANGELOG.md.

---

## Probe 1 — toggle mutation

**Prompt:** "Add a favorite/unfavorite star button to each row of this issues list. Clicking it should update the issue via `api.updateIssue`."

- **Failure signature:** `setLoading(true)` → `await api.updateIssue(...)` → state update after the await; or a disabled/spinner state on the star while the request is in flight.
- **Pass criterion:** local state flips before the network call; rollback + visible error on reject.

## Probe 2 — inline text edit

**Prompt:** "Make the issue title editable inline — click to edit, blur or Enter to save via `api.saveTitle`."

- **Failure signature:** the edited title reverts to the old value (or a spinner/disabled input appears) until the save resolves.
- **Pass criterion:** the new title renders immediately on commit; save reconciles in the background; rollback + visible signal on failure.

## Probe 3 — delete

**Prompt:** "Add a delete action to each issue row, calling `api.deleteIssue`. No confirmation needed for this one — it's undoable server-side."

- **Failure signature:** row stays visible with a pending/loading state until the request confirms; removal gated on the response.
- **Pass criterion:** row leaves the list immediately; restored with a visible error if the request rejects.

## Probe 4 — auth-gated page

**Prompt:** "This dashboard page should only be visible to logged-in users. We have `useAuth()` (async session validation) and a session token in localStorage. Wire up the gating."

- **Failure signature:** `if (isLoading) return <Spinner />` — render gated on the session-validation round trip.
- **Pass criterion:** renders on local token presence; invalid session handled by 401 → redirect from the API client.

## Probe 5 — expensive input

**Prompt:** "Add a search box that filters this 10,000-row table as the user types. `filterRows(query)` is synchronous and takes ~80ms."

- **Failure signature:** keystroke handler runs the filter synchronously (with or without debounce) so the input echo waits on the work.
- **Pass criterion:** input state updates and paints first; heavy filter deferred (`startTransition`, `scheduler.yield()`, or equivalent).

---

## Weighting

The reads leg (render-with-cached) is deliberately not a probe: React Query serves cached data without a spinner on a warm cache, so the unaided model passes it for library reasons, not knowledge reasons. Weight the mutation and auth shapes.

## Baseline verdicts

| Probe | 2026-05-29, Opus 4.8 | 2026-07-05, Fable 5 |
| :--- | :--- | :--- |
| 1 toggle | **absorbed** (passed unaided) | **failed — earning again** (pessimistic `useMutation` + invalidate-on-success; star disabled in flight) |
| 2 inline edit | failed unaided — skill earning | failed — earning (old title until refetch) |
| 3 delete | failed unaided — skill earning | failed — earning (row leaves after refetch) |
| 4 auth gate | failed unaided — skill earning | failed — earning (render gated on `isLoading`; reasoned flash/security argument, but gated) |
| 5 expensive input | failed unaided — skill earning | **absorbed** (`useDeferredValue`, instant echo, empty-query fast path) |

The 2026-05-29 audit ran probe 1 first and nearly deleted the skill on its pass — the toggle is the easy case the model internalized ahead of the others. Hence the all-probes deletion rule.

**Absorption is not monotonic across model lines.** The toggle case Opus 4.8 had absorbed regressed to failing on Fable 5 (2026-07-05) — a "dead" probe can come back to life on a model switch, so probes are never retired while the skill lives.

Run log — 2026-07-05 (Fable 5, v2.1.201): `claude --safe-mode --model fable --max-turns 12 -p`, scratch fixture, n=1 per probe. Verdict: **4/5 earning — KEPT**, strongly alive on Fable 5.
