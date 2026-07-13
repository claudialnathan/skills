# Dimension fallback checklists

The depth for each dimension lives in its specialist skill (see the routing table in `SKILL.md`). **These checklists are the fallback** — the high-leverage, distinctive checks to apply when that skill isn't installed in the session. They are deliberately not exhaustive; when the specialist skill is present, defer to it.

Each finding: `file:line` · one-sentence why · concrete fix · severity (P0/P1/P2).

## Contents
- [A. Correctness & tooling](#a-correctness--tooling)
- [B. Next.js](#b-nextjs)
- [C. React performance](#c-react-performance)
- [D. shadcn + Tailwind](#d-shadcn--tailwind)
- [E. Design & UI polish](#e-design--ui-polish)
- [F. Motion performance](#f-motion-performance)
- [G. Accessibility](#g-accessibility)
- [H. Components](#h-components)
- [I. View transitions](#i-view-transitions)
- [J. Project-specific rules](#j-project-specific-rules)
- [K. Web vitals (code level)](#k-web-vitals-code-level)
- [L. Security & best practices](#l-security--best-practices)
- [M. Server-side security & data exposure](#m-server-side-security--data-exposure)
- [N. State integrity & failure handling](#n-state-integrity--failure-handling)

## A. Correctness & tooling
*Always. From Step 1 output.*
- Every lint / type error is at least **P1**; a build failure is **P0**.
- `react-doctor`: triage errors before warnings; deprioritize false positives documented in the repo's own rules.
- A formatter that rewrites many files on `lint:fix` is a config-drift signal worth flagging.

## B. Next.js
*If `next` is present. Deeper: `next-best-practices`, `vercel:nextjs`, `vercel:next-cache-components`.*
- Server Components by default; `"use client"` only where interactivity demands it, pushed to leaves.
- `error.tsx` and `not-found.tsx` on user-facing routes.
- Metadata / OG / `robots` / `sitemap` on public pages.
- `'use cache'` paired with `cacheLife` + `cacheTag`; no request-time runtime APIs inside a cached scope without a refactor.
- Cached fetchers: prefer a resolved fallback over `throw` for non-critical external data.
- Await async route APIs: `params`, `searchParams`, `cookies`, `headers`.
- `next/image` for content images.

## C. React performance
*If React is present. Deeper: `vercel:react-best-practices`, `react-doctor`.*
- Fetch waterfalls that should be parallel; missing `Suspense` boundaries.
- Bundle bloat: barrel imports pulling whole libraries, heavy client islands, dynamic-import candidates.
- Over-serialization: large or non-serializable props handed from server to client components.

## D. shadcn + Tailwind
*If `components.json` or Tailwind present. Deeper: `shadcn-tailwind` (bundled), `shadcn`.*
- Read `@theme` / design tokens **before** judging any className.
- No `px`, no `#hex` in authored code — rem and oklch.
- Base UI: `render` not `asChild`; `nativeButton={false}` for link-styled buttons.
- `gap-*` over `space-y-*`; semantic tokens over raw palette values.
- Compose primitives; don't build a parallel wrapper API over a shadcn component.

## E. Design & UI polish
*Any UI. Deeper: `design-engineer` (bundled), `make-interfaces-feel-better`, `emil-design-eng`, `web-design-guidelines`. Report as Before | After.*
- Concentric border radius (outer = inner + padding).
- `tabular-nums` on numbers that change in place.
- `text-balance` on headings, `text-pretty` on body.
- `min-h-dvh` not `min-h-screen`.
- `active:scale-[0.96]` on buttons (never below 0.95).
- Visible `focus-visible` rings; minimum 40×40px hit targets.
- `prefers-reduced-motion` handled at the token / CSS layer, not per-component.
- No `transition: all`. One accent color per view; no unrequested gradients or glow-as-affordance.
- Empty states give one clear next action.

## F. Motion performance
*If animations exist. Deeper: `fixing-motion-performance`, `framer-motion-animator`, `baseline-ui`.*
- No interleaved layout read/write in an animation loop (FLIP: measure once, then animate).
- Large or meaningful surfaces animate `transform` / `opacity` only — never `width`/`height`/`top`/`left`/`margin`.
- No scroll-position-driven JS animation; prefer Scroll/View Timelines or IntersectionObserver.
- Blur ≤ 8px, short and one-shot, never continuous or on large surfaces.
- No `requestAnimationFrame` loop without a stop condition; pause animations off-screen.
- `will-change` only during an active animation.

## G. Accessibility
*Any UI. Deeper: `fixing-accessibility`, `wcag-audit-patterns`, `accessibility` (WCAG 2.2 AA baseline).*
- Accessible names; icon-only controls have an `aria-label`.
- Full keyboard access with a visible focus indicator; never hide the focus outline. Focus indicator contrast ≥ 3:1 against its background.
- Contrast: 4.5:1 normal text, 3:1 large text and UI components (AA).
- Targets ≥ 24×24px (SC 2.5.8); adjacent hit areas don't overlap.
- Keyboard focus not hidden under sticky bars — `scroll-margin` on focusables (SC 2.4.11).
- Drag interactions have a single-pointer alternative (SC 2.5.7).
- Native elements over `role` hacks; don't rebuild keyboard/focus behavior by hand.
- Form errors linked with `aria-invalid` + `aria-describedby`, shown next to the field; first error focused on submit.
- Meaningful link text; decorative icons `aria-hidden`.
- Logical heading order; one `<h1>` per page where applicable.
- Don't disable zoom; never rely on color alone to convey state.

## H. Components
*Component code. Deeper: `building-components`.*
- Composition over boolean-prop explosion.
- Controlled state only when the parent needs the value; otherwise keep primitives uncontrolled.
- `data-state` / `data-slot` for styling where primitives expose them.
- Use the project's existing primitives first; never mix primitive systems in one interaction surface.

## I. View transitions
*Only if view-transition code exists. Deeper: `vercel-react-view-transitions`.*
- `default="none"` on `<ViewTransition>`.
- Directional slides for hierarchical navigation only.
- Apply VT on page components, not layout; provide reduced-motion CSS.
- Avoid VT where interruption or cancellation is required.

## J. Project-specific rules
*Always.*
- Apply only the checklists that **actually exist** in this repo's `CLAUDE.md`, `.cursor/rules/`, or `AGENTS.md`.
- Do not assume a template / portfolio / launch checklist exists. Absence of a rule is not a finding.

## K. Web vitals (code level)
*Any web UI. Deeper: `core-web-vitals`, `performance`. A code audit can't measure field numbers; these are the code shapes that decide them. Targets at p75: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.*
- Every image / video / iframe / embed sized — `width`/`height` or `aspect-ratio` (CLS).
- LCP image eager and high-priority: `next/image` `priority`, or `<link rel="preload" fetchpriority="high">`; below-fold images lazy.
- Fonts don't block or shift text: `next/font` or `font-display: swap` with a metric-matched fallback (`size-adjust` / `ascent-override`); critical fonts preloaded, self-hosted.
- Third-party scripts never render-blocking: `next/script` with a non-blocking strategy; heavy embeds (video players, chat widgets) behind a facade, loaded on interaction or visibility.
- No heavy synchronous work in event handlers — feedback paints first, then yield (`scheduler.yield()` / `useTransition`); analytics deferred to `requestIdleCallback`.
- Dynamic content (banners, notifications) never injected above existing content without reserved space.
- Long lists (> ~100 items) virtualized, or `content-visibility: auto` with `contain-intrinsic-size`.
- LCP content in the initial HTML where the framework allows (SSR/SSG), not client-rendered after hydration.

## L. Security & best practices
*Always. Client-delivery scope — server-side authz, injection, and data exposure live in section M. Deeper: `best-practices`; run `npm audit` (or the pnpm/yarn/bun equivalent). Confirmed vulnerable deps and unsanitized HTML sinks are P0.*
- Known-vulnerable dependencies (`npm audit`) — P0.
- No raw HTML sinks: `dangerouslySetInnerHTML` / `innerHTML` only with sanitization (DOMPurify) or Trusted Types.
- Security headers configured (next.config / middleware / vercel.json): CSP with `frame-ancestors`, `base-uri`, `form-action`; HSTS; `X-Content-Type-Options: nosniff`; `Referrer-Policy`; `Permissions-Policy`. Flag legacy `X-XSS-Protection` if present — removed from browsers, sometimes harmful.
- Third-party `<script>` / `<link rel="stylesheet">` from CDNs not under the project's control: pinned with SRI (`integrity` + `crossorigin`) — or bundled instead. Never runtime polyfills from a third-party CDN (the polyfill.io supply-chain compromise, 2024).
- Session cookies set server-side with `Secure; HttpOnly; SameSite` — never via `document.cookie`.
- Production source maps hidden (`sourcemap: 'hidden'`), `sourcesContent` stripped from error-tracker uploads, no `.map` files publicly served.
- No mixed content or protocol-relative `//` URLs; no deprecated APIs (sync XHR, `document.write`, AppCache).
- Touch/wheel listeners passive unless `preventDefault` is genuinely needed.
- Global handlers for `error` and `unhandledrejection` feed the error tracker; React trees have error boundaries.

## M. Server-side security & data exposure
*Only if the repo has server code — route handlers (`app/**/route.*`, `pages/api/`), server actions (`"use server"`), or a DB/auth/BaaS SDK (Supabase, Firebase, Prisma, Drizzle, Auth.js, Clerk, Stripe). A purely static frontend skips this section. Trace flows end-to-end — client → endpoint → database — not files in isolation; the vulnerability is usually the check a flow skips, not a line a grep finds.*
- Every route handler and server action re-checks authentication **and** authorization inside itself; a check in the page, layout, or middleware alone does not protect an endpoint called directly. Missing server-side check on a mutation = **P0**.
- Never trust client-supplied identity or ownership: user / org / tenant IDs come from the session, and record lookups are scoped to the caller. A record fetched by bare ID from the request (IDOR, cross-tenant read) = **P0**.
- When the client holds the database keys, the rules **are** the authorization: Supabase RLS enabled on every exposed table (the anon key is not an access control); Firebase rules never blanket-`true`; storage buckets not publicly writable. Missing = **P0**.
- Injection at every sink: parameterized queries only — no string-built SQL (`$queryRawUnsafe`, template-literal SQL); no shell execution of user input; user content interpolated into an LLM prompt is a prompt-injection boundary and gets flagged as one.
- Secrets stay server-side: audit `NEXT_PUBLIC_` / `VITE_` env vars for anything privileged; no service-role key, API secret, or admin credential reachable from a client bundle. Exposed secret = **P0**.
- Responses return the fields the UI needs, not whole serialized records — no password hashes, tokens, or other users' data riding along. Production error responses and logs don't leak stack traces, queries, or internal endpoints.
- User-supplied URLs that the server fetches or redirects to are validated against an allowlist (SSRF, open redirect); user-supplied filenames never joined into filesystem paths (traversal); upload type and size enforced server-side.
- Webhook handlers verify the provider's signature before acting on the payload.
- Cookie-authenticated state-changing endpoints have CSRF protection (framework-provided or explicit — verify, don't assume); auth and expensive endpoints rate-limited (**P1**).

## N. State integrity & failure handling
*Any app with mutations or nontrivial async data. No specialist skill routes here — this checklist is the depth.*
- Non-idempotent mutations guarded on **both** sides: the control disabled while the request is in flight, and the server deduplicating (idempotency key, unique constraint) — a double-click, retry, or refresh must not create duplicate orders, messages, or jobs. A duplicate-payment path = **P0**.
- Every async surface has loading, error, and empty states; a failed request never leaves an infinite spinner or a dead form with no path to retry.
- No swallowed errors: empty `catch` blocks, promises without rejection handling, `catch` that logs and leaves the UI mid-operation. Every failure path recovers, rolls back, or surfaces to the user.
- Effects and listeners cleaned up: subscriptions, intervals, event listeners, in-flight fetches aborted on unmount; out-of-order responses guarded so a stale response can't overwrite newer state (race between successive requests).
- Optimistic updates roll back on failure and reconcile with server truth; a failure path that leaves client state and persisted data disagreeing is a finding even when nothing throws.
- Response-shape assumptions checked at the boundary — nullability, empty arrays, ordering — narrowed or parsed (e.g. zod) rather than asserted with `as`.
- Destructive or paid actions re-validate current state server-side rather than trusting what a possibly-stale tab last rendered (multi-tab, long-idle sessions).
