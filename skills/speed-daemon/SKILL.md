---
name: speed-daemon
description: Default to optimistic-UI patterns when building UIs where perceived speed matters — render from cached state immediately, mutate optimistically with rollback, don't gate render on session validation. Use when building mutation handlers, save/edit/delete/toggle flows, list/detail views, dashboards, or any reactive UI where the user names Linear / Superhuman / Raycast / Vercel-dashboard-class apps as the speed bar. Also triggers on "feels slow", "spinner", "optimistic update", "loading state", "feels sluggish", "snappier", "why is this lag", "no loading state please", or "this list takes forever to show". Not a sync engine / CRDT / IndexedDB-architecture skill — this is the coding pattern at the component layer, not the data layer.
when_to_use: |
  Auto-loads on reactive UI files. Trigger phrases:
  - "make this feel snappier"
  - "this save button feels slow"
  - "add optimistic updates"
  - "why is there a spinner here"
  - "render this faster"
  - "no loading state for the save"
  - "feels laggy when I click"
  - "make it feel like Linear / Superhuman / Raycast"
  - "this list takes too long to show"
  - "optimistic mutation"
  - "useMutation optimistic"
  - "swr optimistic"
  - "should I show a spinner here"
  - "this dashboard is slow"
---

# speed-daemon

<!-- Earned against: Opus 4.7, 2026-05-22. Article-derived (https://performance.dev/how-is-linear-so-fast-a-technical-breakdown), not session-derived. The proxy failure is the React training-data default of spinner-gated mutations and fetch-blocked first paints. Re-validate on next major model release: build several mutation shapes (toggle, inline-edit, delete) plus an auth-gated page in fresh sessions, and check whether Claude reaches for setLoading(true) before the local update. If no, delete this skill — the model has absorbed the pattern. If yes, the skill is still earning its rent. Re-tested 2026-05-29 (Opus 4.8): KEPT. Across 3 fresh skill-withheld mutation trials, 2 (inline-edit, delete) reproduced the spinner/confirmed default and only the toggle came back optimistic; the auth leg reproduced the isLoading-gated render; reads are marginal on React Query (the library serves cached data). n=1 on the toggle nearly mis-deleted this — the toggle is the easy case. -->

The training-default React mutation handler is shaped like this:

```ts
async function save() {
  setLoading(true)
  await api.save(data)
  setLoading(false)
}
```

That shape gates the UI on the network. The user clicks; nothing visible happens; spinner; then the result lands. Across dozens of interactions a day, this is what "feels slow" actually means — not slow network, but a UI that waits for the network before moving.

**The attention shift this skill makes: the canonical view of the user's intent lives in the browser, not on the server. Write the local update first; treat the network as reconciliation, not gating.**

Apps that feel like Linear / Superhuman / Raycast share this default. The data architecture under it (IndexedDB, sync engines, CRDTs) is a separate decision — this skill is about the coding pattern at the component layer, which composes with whatever data layer the project has chosen.

## Three places this default applies

### 1. Mutations — apply local, queue async, rollback on reject

For any mutation the user initiates from the UI (toggle, status change, title edit, create, delete, save), the default shape is:

```ts
async function save(next: Item) {
  const prev = current
  setLocal(next)                          // 1. UI moves immediately
  try {
    await api.save(next)                  // 2. Network catches up
  } catch (err) {
    setLocal(prev)                        // 3. Rollback only on reject
    surfaceError(err)                     // 4. Tell the user it failed
  }
}
```

The rollback path is **mandatory, not optional**. Without it the UI silently diverges from the server on every failure and the user is acting on a lie.

Use this shape with whatever state lib the project uses. React Query: `useMutation({ onMutate, onError })` with `queryClient.setQueryData` / `queryClient.cancelQueries`. SWR: `mutate(key, optimisticData, { rollbackOnError: true })`. Zustand / Jotai / Redux / MobX: store update on the way in, store revert on the way out. The library doesn't matter; the four-step shape does.

### 2. Reads — render with what's cached, refetch in the background

The default training shape is `useEffect(() => fetch(...), [])` → spinner → render. The optimistic default: if cached data exists, render it immediately and refetch in the background. The spinner is reserved for the cache-empty case.

```ts
// Default — render blocked on fetch.
const { data, isLoading } = useQuery(['issues'], fetchIssues)
if (isLoading) return <Spinner />
return <List items={data} />

// Optimistic — render with cached, refetch quietly.
const { data } = useQuery(['issues'], fetchIssues, {
  initialData: () => cache.get('issues'),
  staleTime: 0,
})
return <List items={data ?? []} />
```

The empty-cache case is the only one that earns a skeleton (and that case defers to `design-engineer`'s skeleton rule — preserves layout, ≥300ms threshold). Every other case should render-with-cached, not render-after-fetch.

### 3. Auth — assume the happy path, redirect on 401

The default training shape: validate session, *then* render. The optimistic shape: render if a local session token exists; let the first failed API call trigger redirect.

```ts
// Default — gated render.
const { user, isLoading } = useAuth()
if (isLoading) return <Spinner />
if (!user) redirect('/login')
return <App />

// Optimistic — assume valid, redirect on the rejection that actually comes.
const cached = localStorage.getItem('session')
if (!cached) redirect('/login')
return <App />  // API client will redirect on 401 if session is invalid
```

The cost of being wrong is one extra redirect after the first failed API call. The benefit is no perceptible pre-render gate on the common case (token present and valid).

This pattern needs the API client to handle 401 → redirect centrally. If the project doesn't have that, install it once — it pays back on every page.

## Granular reactivity makes optimistic updates feel right

Optimistic UI compounds with **granular subscriptions**. When 50 issues update in a batch, the result should be 50 cell re-renders, not one big list re-render. If the project's state library exposes per-field subscriptions (MobX observables, Solid signals, Jotai atoms, React Query per-key cache, Zustand selectors), use them — read one field, re-render on that field.

Avoid `useState` for shared data that several components read. Avoid passing whole objects down when only a property is read. Both create wide re-render cones that erase the smoothness the optimistic update was meant to deliver.

This is downstream of the main rule, not separate from it. A optimistic update on a non-granular store can still feel janky; granular reads without optimistic writes still wait on spinners. The combination is what feels Linear-fast.

## What this skill is *not* for

- **Server-rendered apps** where data lands in HTML on first paint. Optimistic patterns add complexity without the perceived-speed payoff — the server already moved the UI immediately.
- **Mutations with hard server-side preconditions** — payments, irreversible writes, regulatory checks, anything where "rollback the UI" isn't a real recovery. Use a confirmation dialog and a spinner here; optimism is dishonest when the server is the source of truth.
- **Sync engines / CRDTs / IndexedDB data architecture.** This skill is the *coding pattern* at the component layer. The data-architecture decision (Linear's sync engine, ElectricSQL, Replicache, Yjs, Automerge) is a separate, much larger commitment. If the user is asking about *that*, recommend they treat it as an architecture spike, not a skill invocation.
- **First-time UI for never-cached data.** A cold load has nothing local to render; a skeleton (per `design-engineer`'s rule) is correct here. This skill applies once the cache is warm — which is most of the lifetime of a session.

## Anti-patterns

- **`setLoading(true)` before a mutation.** The UI should already have moved. If you're reaching for a loading flag on a write, the local update is missing.
- **`if (isLoading) return <Spinner />` at the top of a component that has cached data available.** That's gating render on a fetch that has nothing new to add.
- **Rolling back silently.** A failed mutation needs a visible signal — toast, banner, inline error. Otherwise the user thinks it succeeded and the lie compounds.
- **Optimistic updates without a rollback path.** "It usually works" isn't a recovery strategy. The rollback is what makes optimism honest.
- **Optimistic updates on irreversible operations.** If `rollback()` can't actually restore the prior state (because the server already charged the card, sent the email, deleted the record), don't pretend it can. Confirm first.
- **Whole-object subscriptions where a field would do.** `useStore()` returning the whole store and destructuring the field you need re-renders on every unrelated mutation. Use a selector.

## Composing with sibling skills

- **`design-engineer`** owns the skeleton rule (`for any waiting beyond ~300ms, use a skeleton that preserves layout`). This skill applies *before* that decision: if cached data exists, don't enter the waiting state at all. The skeleton is correct for the cold-load minority case.
- **`shadcn-tailwind`** owns component-architecture discipline (compose-not-prop, edit-the-source). Orthogonal — pairs cleanly.
- **`emil-design-eng`** (when present) owns animation craft for the rollback's visible signal (toast enter/exit, error banner animation). If a rollback triggers a toast, that toast's motion is its problem, not this skill's.

## Pre-ship check

Before saying "done" on a mutation, list, or auth flow:

- [ ] If the user initiates the mutation, the UI moves *before* the network call returns. No `setLoading(true)` between user click and visible state change.
- [ ] Every optimistic update has a rollback path. Failed-mutation case is exercised at least once mentally.
- [ ] Failed mutations surface a visible signal (toast, banner, inline error). Not just a silent revert.
- [ ] Reads check cached state first; only fall through to a skeleton/spinner on cold cache.
- [ ] Auth render isn't gated on an `isLoading` flag from a session-validation call. Local token presence is sufficient to render; 401 triggers redirect.
- [ ] Component subscribes to the narrowest slice of state it needs — selector / signal / per-key cache, not whole-store reads.
- [ ] Mutation isn't optimistic on irreversible operations (payments, sends, hard deletes). Confirmation + spinner here is correct.

## When this stops earning its keep

This skill is article-derived, not failure-derived. On the next major model release, re-test in fresh sessions without invoking this skill — and **test more than one mutation shape**. The 2026-05-29 audit (Opus 4.8) found the model had absorbed the *toggle* case but still reached for the spinner/confirmed default on **inline-edit** and **delete**, and still gated **auth** render on `isLoading`. A single-mutation probe nearly deleted the skill by mistake — the toggle is the easy case the model has internalized; the others it hasn't.

The protocol:

- Build at least three mutations of different shapes — a toggle, an inline text edit, and a delete — plus one auth-gated page.
- The skill is obsolete only if the model reaches for local-update-first (and token-presence-gated auth render) across *all* of them unprompted.
- If any shape still reaches for `setLoading(true)` or `if (isLoading) return <Spinner />`, the skill is still doing work.

The reads leg is marginal on React Query — the library serves cached data without a spinner on a warm cache — so weight the mutation and auth shapes. The audit trigger is the model bump.
