---
name: speed-daemon
description: Default to optimistic-UI patterns where perceived speed matters. Render from cached state immediately, mutate optimistically with rollback, don't gate render on session validation, and never let heavy synchronous work sit between an input and the next paint. Applies to mutation handlers (save / edit / delete / toggle), list and detail views, dashboards, and any reactive UI measured against Linear / Superhuman / Raycast / Vercel-dashboard-class speed. The coding pattern at the component layer only, not a sync-engine, CRDT, or IndexedDB-architecture skill. Use when an interface feels slow, laggy, or sluggish on input (including a bad INP score), when deciding whether to show a spinner or loading state, or when asked for optimistic updates or Linear-class snappiness.
paths:
  - '**/components/**/*.{ts,tsx,jsx}'
  - '**/app/**/*.{tsx,jsx}'
  - '**/pages/**/*.{tsx,jsx}'
  - '**/src/**/*.{ts,tsx,jsx}'
  - '**/hooks/**/*.{ts,tsx}'
---

# speed-daemon

<!-- Earned against: Opus 4.7, 2026-05-22 — history: CHANGELOG.md -->

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

## Four places this default applies

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

### 4. Local heavy work — paint the feedback, then yield

The network isn't the only thing that gates the UI; a long main-thread task does the same with no spinner to blame. The user types in a filter box, the handler synchronously filters 10,000 rows, and the keystroke doesn't echo until the work finishes. This is what INP measures — the worst input-to-next-paint latency of the visit, good at ≤ 200ms (p75), budgeted roughly as input delay < 50ms + processing < 100ms + presentation < 50ms.

The same default applies: move the UI first, do the expensive part after the paint.

```ts
async function onFilterChange(query: string) {
  setQuery(query)                               // 1. Cheap visible update — keystroke echoes
  await yieldToBrowser()                        // 2. Browser paints it before we block
  setResults(expensiveFilter(query))            // 3. Heavy work after the paint
  requestIdleCallback(() => track('filter'))    // 4. Lowest-priority work when idle
}

const yieldToBrowser = () =>
  'scheduler' in window && 'yield' in scheduler
    ? scheduler.yield()                  // continuation resumes at boosted priority
    : new Promise(r => setTimeout(r, 0)) // fallback yields, but loses queue priority
```

In React, `useTransition` is this shape with the bookkeeping done: keep the input's own state update synchronous, wrap the expensive derived update in `startTransition(() => setResults(...))`. To find offenders in the field, the `web-vitals` attribution build's `onINP()` reports which script and which phase (input delay / processing / presentation) ate the budget.

## Granular reactivity makes optimistic updates feel right

Optimistic UI compounds with **granular subscriptions**. When 50 issues update in a batch, the result should be 50 cell re-renders, not one big list re-render. If the project's state library exposes per-field subscriptions (MobX observables, Solid signals, Jotai atoms, React Query per-key cache, Zustand selectors), use them — read one field, re-render on that field.

Avoid `useState` for shared data that several components read. Avoid passing whole objects down when only a property is read. Both create wide re-render cones that erase the smoothness the optimistic update was meant to deliver.

This is downstream of the main rule, not separate from it. An optimistic update on a non-granular store can still feel janky; granular reads without optimistic writes still wait on spinners. The combination is what feels Linear-fast.

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
- [ ] No heavy synchronous work between an input and the next paint — cheap state echo first, then yield (`scheduler.yield()` / `startTransition`), heavy work after.
- [ ] Every optimistic update has a rollback path. Failed-mutation case is exercised at least once mentally.
- [ ] Failed mutations surface a visible signal (toast, banner, inline error). Not just a silent revert.
- [ ] Reads check cached state first; only fall through to a skeleton/spinner on cold cache.
- [ ] Auth render isn't gated on an `isLoading` flag from a session-validation call. Local token presence is sufficient to render; 401 triggers redirect.
- [ ] Component subscribes to the narrowest slice of state it needs — selector / signal / per-key cache, not whole-store reads.
- [ ] Mutation isn't optimistic on irreversible operations (payments, sends, hard deletes). Confirmation + spinner here is correct.

## When this stops earning its keep

This skill is article-derived, not failure-derived; it dies when the model reaches for these patterns unprompted. The runnable re-test lives in [evals/probes.md](evals/probes.md) — five probes across mutation shapes, auth, and expensive input, with per-model baseline verdicts. Deletion requires **all** probes passing unaided: a single-probe check nearly deleted this skill by mistake once, because the model had absorbed the easy toggle case while still failing inline-edit, delete, and auth. The audit trigger is the model bump.
