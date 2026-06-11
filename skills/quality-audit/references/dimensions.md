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
*Always. Deeper: `best-practices`; run `npm audit` (or the pnpm/yarn/bun equivalent). Confirmed vulnerable deps and unsanitized HTML sinks are P0.*
- Known-vulnerable dependencies (`npm audit`) — P0.
- No raw HTML sinks: `dangerouslySetInnerHTML` / `innerHTML` only with sanitization (DOMPurify) or Trusted Types.
- Security headers configured (next.config / middleware / vercel.json): CSP with `frame-ancestors`, `base-uri`, `form-action`; HSTS; `X-Content-Type-Options: nosniff`; `Referrer-Policy`; `Permissions-Policy`. Flag legacy `X-XSS-Protection` if present — removed from browsers, sometimes harmful.
- Third-party `<script>` / `<link rel="stylesheet">` from CDNs not under the project's control: pinned with SRI (`integrity` + `crossorigin`) — or bundled instead. Never runtime polyfills from a third-party CDN (the polyfill.io supply-chain compromise, 2024).
- Session cookies set server-side with `Secure; HttpOnly; SameSite` — never via `document.cookie`.
- Production source maps hidden (`sourcemap: 'hidden'`), `sourcesContent` stripped from error-tracker uploads, no `.map` files publicly served.
- No mixed content or protocol-relative `//` URLs; no deprecated APIs (sync XHR, `document.write`, AppCache).
- Touch/wheel listeners passive unless `preventDefault` is genuinely needed.
- Global handlers for `error` and `unhandledrejection` feed the error tracker; React trees have error boundaries.
