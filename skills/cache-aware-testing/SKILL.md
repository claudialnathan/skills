---
name: cache-aware-testing
description: |
  Decision framework for testing in a Next.js 16+ App Router project with Cache Components on, plus shadcn (built on Base UI), Supabase auth and database, React Query, and Vercel deployment. Covers the Vitest/Playwright pyramid (which APIs Vitest cannot render — async Server Components, the use-cache directive, Server Actions), the cache invalidation matrix (updateTag in Server Actions, revalidateTag with profile "max" for stale-while-revalidate, revalidateTag with the {expire:0} object form from Route Handlers), the dev-vs-prod Playwright variant split, Supabase testing patterns (service role, RLS bypass, the auth.users foreign-key trap), and Base-UI/shadcn locator patterns (data-state attributes over class fragments).
compatibility: Next.js 16+ App Router with Cache Components, Vitest, Playwright, Supabase
when_to_use: |
  Triggers:
  - "tests are flaky"
  - "tests don't see the new data"
  - "vitest vs playwright"
  - "where should I test this"
  - "is this test in the right layer"
  - "set up testing for next 16"
  - "playwright timing out"
  - "should this be a unit test"
  - "cache components and tests don't agree"
  - "supabase test fixture"
  - "service role vs anon in tests"
  - "rls in tests"
  - "auth.users foreign key trap"
  - "playwright auth setup"
  - "storage state"
  - "shadcn locator"
  - "base ui data-state"
  - "test-only api route"
  - "next dev compile latency"
  - "react query in unit tests"
paths:
  - "**/*.{test,spec}.{ts,tsx,js,jsx}"
  - "**/playwright*.config.{ts,js,mts,mjs}"
  - "**/vitest.config.{ts,js,mts,mjs}"
  - "tests/**"
  - "e2e/**"
  - "**/__tests__/**"
---

# Cache-aware testing for the Next.js + Supabase + shadcn stack

When testing or debugging tests in a Next.js App Router project with `cacheComponents: true`, three questions front-load almost every decision. Hold them in foreground for the whole session — every test failure, design choice, and proposed infra change should answer at least one:

1. **Layer.** Is this work testable as a sync unit, or does it require an async Server Component, a Server Action, a `'use cache'` read, or a hop through Supabase auth/RLS? The answer determines Vitest vs Playwright.
2. **Cache invalidation primitive.** When a mutation needs to be visible on the next render, which API applies? Three options, each with strict context rules. Mismatched primitives are the dominant source of "tests don't see the new data" flakes.
3. **Playwright variant.** Is this run hitting `next dev` or `next build && next start`? The first compiles routes on demand and produces compile-latency flakes after a long session; the second pre-compiles everything and is what CI sees.

The mechanics below answer each. Read top-to-bottom on first invocation; afterwards, jump to the section the failure points at.

## The pyramid

| Layer | Tool | Use for | Don't use for |
| :--- | :--- | :--- | :--- |
| Unit / component | Vitest + React Testing Library + jsdom | Pure functions, sync Server Components, sync Client Components, schemas (Zod), hooks that don't read cookies | Async Server Components, Server Actions, `'use cache'` reads, anything reading `cookies()`/`headers()`/`params`/`searchParams` |
| End-to-end | Playwright (Chromium) | Async Server Components, Server Actions, cache invalidation, full user journeys, anything that hits Supabase with auth or RLS | Pure-function unit logic that doesn't need a browser |

Source: the official [Next.js testing guide](https://nextjs.org/docs/app/guides/testing) plus the [Vitest setup guide](https://nextjs.org/docs/app/guides/testing/vitest). The Next.js docs explicitly recommend E2E for async Server Components because Vitest/Jest cannot render them yet.

**Decision rule for "where does this test go?"** Write E2E if any of these is true:
- Reads cookies, headers, `params`, or `searchParams`.
- Has `'use cache'` or `cacheTag(...)`.
- Calls a Server Action.
- Calls any helper that touches Supabase with the user's session (`createClient` from `@supabase/ssr`).
- Depends on RLS policies for correctness.

Otherwise, Vitest. When in doubt, Playwright. A skipped unit test costs nothing; an integration test that mocks too much is expensive and lies.

## Cache invalidation matrix

Mutations need to make their changes visible on the next render. Pick the primitive by *where the call site lives*:

| Where the call lives | Primitive | Behaviour | When to use |
| :--- | :--- | :--- | :--- |
| Server Action (`'use server'`) | `updateTag(tag)` | Synchronous; the same request reads fresh data | Default for action-side mutations the UI just performed. Read-your-own-writes |
| Anywhere | `revalidateTag(tag, "max")` | Stale-while-revalidate; tag marked stale, refetched on next access | When fresh-on-next-render isn't required and serving the previous value once is OK |
| Route Handler (`route.ts`) | `revalidateTag(tag, { expire: 0 })` | Immediate expiration; next read blocks on a fresh fetch | Webhooks, third-party callbacks, **and test-only routes** that need fresh-on-next-page-load |

### Critical traps

- **`updateTag` only works in a Server Action.** Calling it from a Route Handler throws with a message like `updateTag can only be called from within a Server Action`. Use the `revalidateTag` two-arg form instead.
- **Single-arg `revalidateTag(tag)` is deprecated** in Next 16. The official [revalidateTag reference](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) says: "It currently works if TypeScript errors are suppressed, but this behavior may be removed in a future version." Always pass the second argument.
- **`revalidateTag(tag, "max")` from a Route Handler is asynchronous.** Tests that call `page.goto(...)` immediately after the route returns will race the invalidation and see previously-cached rows. The fix is `{ expire: 0 }`, not retries or sleeps. The official docs explicitly bless `{ expire: 0 }` from Route Handlers for "webhooks or third-party services that need immediate expiration" — test processes are exactly that case.
- **`revalidateTag` doesn't work in Client Components or middleware.** Server-environments only.

## Dev vs CI Playwright variants

`next dev` compiles routes on demand. After a session of hot-reloads, the compile cache thrashes. Playwright steps that hit a cold route intermittently exhaust the 30s timeout. CI doesn't see this because every CI run starts a fresh server. Locally the symptom is "tests pass solo, fail on full-suite runs, fail more often after I've been editing for an hour."

Two configs solve this cleanly:

| Variant | Server | Use when |
| :--- | :--- | :--- |
| Dev | `next dev` (reuses an existing server if one is running) | Iterating on a test — fast feedback, hot-reload |
| CI / prod-build | `next build && next start` (always fresh, never reused) | Pre-push hook, GitHub Actions, "is this actually green?" verification |

The CI variant pays a 30–60s build cost up front, then every request is pre-compiled and timing is rock-solid. Reproduces what GitHub Actions sees byte-for-byte.

### Implementation shape

A second Playwright config that imports the base, overrides `webServer` to do `pnpm build && pnpm start`, sets `reuseExistingServer: false`, and sets `NODE_ENV=production` and `ENABLE_TEST_ROUTES=1` in `webServer.env`. Wire `pnpm test:e2e:ci` as the script that runs it. Pre-push hook and CI both call it.

## Test-only API routes

Tests often need to admin-write data (reset state, seed fixtures, sign in as a test user) without going through the UI. The pattern that actually composes with Cache Components:

1. Create routes under `src/app/api/test-{action}/route.ts`.
2. Gate them on production-without-override:
   ```ts
   if (
     process.env.NODE_ENV === "production" &&
     process.env.ENABLE_TEST_ROUTES !== "1"
   ) {
     return NextResponse.json({ error: "not found" }, { status: 404 });
   }
   ```
   The CI Playwright variant sets the override in `webServer.env`; real Vercel deploys never set it.
3. Inside the route: do the admin write (with the Supabase service-role client), then call `revalidateTag(tag, { expire: 0 })` for *every* cache tag the write affects.
4. Test helpers POST to these routes instead of admin-writing directly from the test process. **Direct admin-writes from outside the Next runtime cannot bust the cache** — that's why the route-handler intermediary exists. If a helper bypasses it, page renders after the helper will see stale rows.

## Supabase testing patterns

Supabase introduces three testing concerns Next-only guides skip:

### Service role vs anon key

- The **anon key** runs as the public role and is subject to RLS. Use it for code paths that simulate a real user.
- The **service role key** bypasses RLS. Use it for fixture setup, fixture teardown, and any admin-write inside a test-only route. *Never* use it from a Server Component or a route a real user can reach.
- Initialise two clients in test infrastructure: a service-role admin client (used only inside `api/test-*` routes) and the normal SSR-bound client (used by everything else).

### The `auth.users` foreign-key trap

Most app tables that reference a user have a foreign key to `auth.users(id)`. You cannot `INSERT` into `auth.users` directly even with the service role — Supabase manages that table.

To create a test user, use the auth admin API:
```ts
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: "test@example.com",
  password: "test-password",
  email_confirm: true,
});
```
Then any rows that FK to `auth.users(id)` use the returned `data.user.id`. If you forget `email_confirm: true`, sign-in will fail in tests because Supabase requires confirmation by default.

### RLS in tests

Two postures:
- **Test the RLS** — sign in as the test user (via `signInWithPassword` or the admin-issued JWT), use the SSR client, exercise the real policies. This is what most E2E tests should do; broken policies are a real bug class.
- **Bypass the RLS** — use the service-role client for setup/teardown so fixture creation isn't gated by the policies the test is about to exercise. Bypass for *setup*, never for the assertion.

If a test is failing with "row not found" on a fixture you definitely just inserted, suspect RLS first. The service-role insert succeeded; the user-context read can't see it.

### Auth setup with storage state

Standard Playwright pattern: a one-time `setup` project signs in once, persists the auth cookies to `tests/e2e/.auth/<role>.json` via `storageState`, and the main test projects depend on `setup` so they start signed-in without re-running login per test.

The setup project either calls `supabaseAdmin.auth.admin.generateLink` and visits the generated URL, or POSTs to an `api/test-signin` route that creates the session directly. The latter is faster and more deterministic.

### Local Supabase

`supabase start` runs a full local stack (Postgres, GoTrue, Storage, etc.) for tests that should never touch a shared remote DB. The trade-off is migration drift: local Supabase needs `supabase db reset` after schema changes. For most teams, a dedicated cloud project ("staging" or "test") that the test runner targets via env vars is operationally simpler than per-developer local stacks.

## React Query in unit tests

A common gotcha. Components that call `useQuery` need a `QueryClientProvider` in the test render tree, or the test errors out. Wrap the render:

```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

render(
  <QueryClientProvider client={queryClient}>
    <ComponentUnderTest />
  </QueryClientProvider>
);
```

`retry: false` keeps failing queries from retrying for 30 seconds in tests; `staleTime: Infinity` keeps the test from re-fetching mid-assertion. Build a small `tests/unit/render-with-providers.tsx` helper so every test doesn't reinvent this.

## shadcn + Base UI locator patterns

shadcn 4.x components are built on **Base UI** (the successor to Radix Primitives, by the same authors). Base UI components expose `data-state` and other accessibility-oriented data attributes that are the right Playwright locator anchors — better than `data-testid` and far more stable than Tailwind class fragments.

| Component family | Stable Playwright anchor |
| :--- | :--- |
| Dialog / AlertDialog | `getByRole("dialog")`, then `getByRole("button", { name: "..." })` for actions; the `[data-state="open"]` attribute marks open dialogs |
| Popover / Tooltip | `[data-state="open"]` on the content; the trigger has `aria-expanded` |
| Select / Combobox / Listbox | `getByRole("combobox")`, options via `getByRole("option", { name: "..." })` |
| Switch / Checkbox / Radio | `getByRole("switch" \| "checkbox" \| "radio", { name: "..." })`; the `[data-state="checked"]` attribute reflects state |
| Tabs | `getByRole("tab", { name: "..." })`; `[data-state="active"]` marks the selected tab |
| DropdownMenu / ContextMenu | `getByRole("menu")` + `getByRole("menuitem", { name: "..." })` |
| Form fields (with shadcn Form) | `getByLabel("...")` — shadcn Form wires up the label/input pairing automatically |

**Two anti-patterns to avoid:**
- `data-testid` everywhere. The accessible role tree is already a stable identifier; `data-testid` is a fallback for cases where the role tree is genuinely ambiguous.
- Asserting on Tailwind class fragments. `getByText("...")` and `[data-state="..."]` are stable across class renames; class names like `text-muted-foreground` are tokens (stable) but utilities like `opacity-50` or `scale-95` are transient and may be replaced by animated wrappers.

**`asChild` caveat:** Base UI's `asChild` composition merges props into a child element. The role and data-attributes follow whatever the child renders, not the original component name. Inspect the rendered DOM (Playwright's trace viewer or `await page.locator(...).innerHTML()`) when a locator is unexpectedly empty.

## Vercel deployment context

- **`PLAYWRIGHT_BASE_URL` env var.** Point Playwright at any URL — local, preview deploy, production. Useful for smoke-testing a Vercel preview deployment with the existing test suite: `PLAYWRIGHT_BASE_URL=https://my-pr-123.vercel.app pnpm test:e2e`.
- **Vercel preview env vs production env.** Preview deployments use `VERCEL_ENV=preview`. Test-only routes gated on `NODE_ENV` *only* will refuse to run on preview — Vercel sets `NODE_ENV=production` for both preview and production builds. If you need test routes on preview, gate on `VERCEL_ENV !== "production"` rather than `NODE_ENV !== "production"`.
- **Don't run admin-write fixtures against production.** A test-only route on a production deploy is a footgun even when 404'd; the safer pattern is to ensure the service-role key is *not present* in the production environment at all.

## Failure triage — when tests fail mid-session

Read in this order. Stop at the first one that explains the symptom:

1. **The screenshot at `test-results/<spec>/test-failed-1.png`**, before the error message. The page state usually tells you immediately what's wrong: stale rows, empty page, overlay covering the click target, an unexpected redirect — all visible at a glance.
2. **Stale rows from a prior run.** Cache wasn't invalidated. Check that the route handler uses `{ expire: 0 }`, not `"max"`. Check that the action uses `updateTag`, not the deprecated single-arg `revalidateTag`. Check that *every* affected cache tag is invalidated, not just the most obvious one.
3. **Empty page where the seed should be.** Either the reset endpoint succeeded but the seed didn't persist (check the DB directly via SQL or `supabaseAdmin`), or the cache was warmed empty between the reset call and the seed call. Combine reset+seed into one endpoint to eliminate the gap, and call `revalidateTag(tag, { expire: 0 })` once at the end of the combined endpoint.
4. **"Row not found" on a fixture that was definitely inserted.** RLS. The service-role insert succeeded; the user-context read can't see the row. Either fix the policy, or sign the test user in before the read, or use the service-role client for the read too.
5. **"User already registered" on test-user creation.** A previous test run left the user behind. The reset endpoint should `auth.admin.deleteUser(id)` for the test user before re-creating, or the test setup should be idempotent (create-or-fetch).
6. **Class assertion fails on an animated state.** The animation likely uses `transform` / `opacity`, not utility classes. Switch the assertion to a `data-state` attribute (`[data-state="open"]`) or a stable token (`text-muted-foreground`).
7. **Timeout waiting for an interactive element on the 4th+ test in a sequence.** Dev-server compile latency. Run the same suite under the CI variant (`pnpm test:e2e:ci`) to confirm — if it passes, the dev variant's compile cache was the issue, not the test.
8. **All tests that mutate fail; reads pass.** The `revalidateTag` second-arg form is wrong, or the project is on a Next version that doesn't support the two-arg signature. Check `package.json` for a Next 16+ release; verify against the canonical [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) doc for the version you're on.
9. **Dev widget intercepting events.** Dev-only overlays (devtools panels, agentation/feedback widgets, theme switchers in development mode) can block clicks. Gate the overlay's render on `!navigator.webdriver` so Playwright's Chromium doesn't see it.
10. **Sign-in works locally, fails on CI.** `email_confirm: true` was likely omitted on user creation, and the CI Supabase project requires confirmation. Either set `email_confirm: true` or disable confirmation in the test environment's auth settings.

## Locator philosophy

- Prefer accessible queries: `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`. They survive class renames, component swaps, and most refactors.
- For Base UI / shadcn state, use `[data-state="..."]` over class assertions.
- Avoid `data-testid` unless there's no semantic anchor.
- Wait for *signal*, not time. `await expect(locator).toBeVisible()`, not `waitForTimeout`. If you find yourself reaching for a sleep, there's a missing cache invalidation upstream, a missing `await`, or a missing `data-state` to assert against.
- For dynamic apps, wait for the page to settle before inspecting the DOM: `await page.waitForLoadState('networkidle')` after `page.goto(...)`. Inspecting a dynamic page before networkidle returns intermittent locator-not-found failures that look like flake but are actually a missed wait. Static HTML doesn't need this; anything that hydrates client-side does.

## When this skill doesn't apply

- Project doesn't use Cache Components (`cacheComponents: false` or unset). The pyramid still applies; the cache invalidation matrix doesn't.
- Project uses Pages Router. Different conventions — consult the Pages Router testing guides.
- Project uses a different UI library (Mantine, Chakra, etc.). The pyramid and Supabase patterns still apply; the locator section is shadcn-and-Base-UI-specific.
- Project uses Prisma + a different database, not Supabase. The pyramid, cache matrix, and locator patterns still apply; the Supabase section doesn't.
- Project has its own established test harness with documented conventions. Read those first; this skill encodes the canonical Next.js + Supabase + shadcn defaults plus the `{ expire: 0 }` insight, the auth.users foreign-key trap, and the dev-vs-prod variant split.

## Methodology note

When stuck on a Cache Components or Supabase testing problem, **fetch the canonical doc page directly**, don't rely on training data. The cache-invalidation API surface in particular is moving fast (Next 15 → 16 changed the recommended forms) and Supabase auth/admin APIs change between minor versions. The canonical pages worth bookmarking:

- [Next.js testing guide](https://nextjs.org/docs/app/guides/testing) — the pyramid, what each tool can render.
- [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) — the second-arg semantics, deprecation status, the `{ expire: 0 }` blessing for Route Handlers.
- [updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag) — Server-Action-only behaviour and error message.
- [cacheTag](https://nextjs.org/docs/app/api-reference/functions/cacheTag) and [`'use cache'`](https://nextjs.org/docs/app/api-reference/directives/use-cache) — the cache directive and tag binding.
- [Supabase auth admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser) — `createUser`, `deleteUser`, `generateLink`.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy semantics; relevant when fixtures are silently invisible.
- [Playwright locators](https://playwright.dev/docs/locators) — which queries are recommended and why.
- [Base UI](https://base-ui.com/) — the actual primitives shadcn 4.x ships with; useful when a `data-state` attribute isn't where you expect.

If a section above contradicts what's currently on the canonical pages, trust the canonical pages and update this skill. The whole skill is a snapshot, not an authority.

---

## Portability

This skill is written to be portable across any repo with the same stack: Next.js 16+ App Router with Cache Components on, Supabase, shadcn 4+ on Base UI, React Query, Playwright + Vitest. To install in a new repo, copy the entire `cache-aware-testing/` directory into that repo's `.claude/skills/`. No project-specific paths or names are referenced anywhere; the only project-coupled assumption is the test-only route convention (`api/test-*`) and the env-var names (`ENABLE_TEST_ROUTES`, `PLAYWRIGHT_BASE_URL`), which are widely-used conventions and can be renamed in a per-repo override if needed.

If a repo uses a meaningfully different shape — Drizzle instead of the Supabase JS client, Vitest with `@vitejs/plugin-react-swc` instead of Babel, a different storage-state path — those are local edits to the relevant section, not reasons to fork the skill.
