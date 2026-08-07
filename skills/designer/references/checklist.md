# Pre-ship checklist for UI work

Walk this over the files the pass touched, before saying "done". Grouped by concern; tick or fix.

## Tokens

- [ ] No `#hex` or `rgb()` literal. Colors via semantic tokens, or `oklch()` where no token fits.
- [ ] No `px` in lengths. Values in `rem` or the spacing token.
- [ ] No raw palette classes (`bg-zinc-100`, `text-red-500`) where a semantic token exists.
- [ ] Named utility tried before arbitrary (`min-h-15` before `min-h-[3.75rem]`).
- [ ] Font-weight token confirmed before reaching for `font-medium` / `font-semibold`.
- [ ] A value that recurred three times is now a token, and the token name reflects intent (`--ease-out`, not `--ease-1`).

## Polish

- [ ] Concentric radii — outer = inner + padding on every nested rounded surface.
- [ ] Optical alignment checked on icon-with-text buttons, play triangles, asymmetric icons.
- [ ] Shadows over borders where depth is implied.
- [ ] Focus-visible ring on every interactive element (`outline: max(2px, 0.08em) solid currentColor; outline-offset: 0.15em`).
- [ ] Image outlines added — 10% pure black in light, 10% pure white in dark, never tinted.
- [ ] `tabular-nums` on every changing number: counter, price, timer.
- [ ] `text-balance` on headings; `text-pretty` on paragraphs.
- [ ] `:active scale(0.97)` on buttons, never below 0.95.
- [ ] Hit area ≥ 40×40px, with a pseudo-element extension where the visible target is smaller.
- [ ] `scrollbar-gutter: stable` on scroll containers.
- [ ] `scroll-margin-top` on anchored sections and on focusables a sticky bar could hide.
- [ ] `-webkit-font-smoothing: antialiased` at the root (macOS).
- [ ] Safe-area insets on fixed and sticky bars; `viewport-fit=cover` set in the viewport meta.
- [ ] `z-index` from the token scale; no arbitrary `z-[N]`.
- [ ] Backdrop blur on overlays; edge-fade masks on horizontal scrollers.
- [ ] `AlertDialog`, not `Dialog`, for destructive or irreversible actions.
- [ ] Curly quotes in UI copy; straight quotes only in code and copy-pasteable strings.
- [ ] Single `…` character on follow-up menu items ("Rename…") and loading labels, never three periods.
- [ ] Non-breaking spaces in units, shortcut lockups and brand names (`10&nbsp;MB`, `⌘&nbsp;K`).
- [ ] `translate="no"` on brand names, code tokens and identifiers.
- [ ] Dates, times and numbers formatted via `Intl`, not hand-assembled.
- [ ] First tooltip in a group delayed; peers instant while one is open.
- [ ] `-webkit-tap-highlight-color` set to match the design system, not left at the platform default.

## Motion hygiene

- [ ] No `transition: all`, and no bare Tailwind `transition` without a property suffix.
- [ ] `prefers-reduced-motion` covered once at the token layer.
- [ ] `will-change` only on `transform` / `opacity` / `filter`, and only where first-frame stutter was observed.
- [ ] Stagger between items held to 30–80ms.
- [ ] Looping animations paused off-screen (IntersectionObserver or a scroll timeline).
- [ ] No animated `tracking-*`; animated blur radius ≤ 8px, one-shot, small surfaces only.

## Anti-slop

- [ ] No decorative purple or multicolor gradients on cards and panels — one subtle hero gradient at most, and only if briefed.
- [ ] No glow as a primary affordance.
- [ ] One accent color per view; a second only where it earned the seat.

## Accessibility

- [ ] Focus order matches visual order.
- [ ] `aria-live="polite"` on toast and status; `role="alert"` on errors.
- [ ] `aria-label` on icon-only buttons.
- [ ] Semantic `type` and `inputMode` on form inputs (`type="email"`, `inputMode="numeric"`, `autoComplete="…"`).
- [ ] Color is not the only signal — an icon or text accompanies status colors.
- [ ] Alt text descriptive, or `alt=""` on decorative images.
- [ ] Keyboard-only path tested: tab through, every interactive reachable, focus visible.
- [ ] Modals and sheets have a clear close affordance — escape key plus a visible button.
- [ ] Heading hierarchy sequential (h1 → h2 → h3, no level skipped).
- [ ] Touch targets ≥ 44×44pt on mobile: the ≥40px floor plus an 8px gap from the next element.

## Forms

- [ ] Paste never blocked in `<input>` or `<textarea>`; one-time codes pasteable; password managers and 2FA unobstructed.
- [ ] Enter preserves native submit for a single-control form or the last control in a multi-control form; ⌘/Ctrl+Enter submits from inside a `<textarea>`.
- [ ] Submit stays enabled until the request starts, then disables with a spinner and its original label.
- [ ] Free-form text accepted and validated after; incomplete submission allowed so validation surfaces.
- [ ] Validation errors inline beside their field; focus moves to the first errored field on submit.
- [ ] Unsaved changes warn before navigation (`beforeunload`, or the router's guard).
- [ ] Surrounding whitespace trimmed only where the field contract makes it non-semantic; passwords, exact tokens and meaningful user content stay byte-for-byte intact.
- [ ] `spellCheck={false}` on emails, codes and usernames.
- [ ] Placeholders show an expected value or pattern, not a restated label.
- [ ] Label and control share one hit target on checkboxes and radios — no dead zones.

## States

- [ ] Empty state with a real message and a suggested action, not a blank panel.
- [ ] Loading state via skeleton, preserving layout, for any wait past ~300ms; cached data rendered instead where it exists.
- [ ] Error state with a recovery path — a retry button or an actionable message, not just "Error".
- [ ] Disabled state visually distinct (reduced opacity 0.5–0.6, `cursor-not-allowed`).
- [ ] Read-only state distinct from disabled.
- [ ] URL reflects view state — filters, tabs, pagination and expanded panels are deep-linkable.
- [ ] Back and forward restore state *and* scroll position, verified against any virtualized list.
- [ ] Navigation uses a real `<a>` or `<Link>`, so Cmd/Ctrl-click and middle-click open a new tab.

## Reason articulation

- [ ] Every taste call — scale value, duration, easing, radius, shadow, color choice — has a stated *why*, in the review output, in the commit message, or mentally for routine ones.

## Final pass

- [ ] Read the diff straight through, looking for arbitrary values that should be tokens, raw palette colors that should be semantic, `vh` that should be `dvh`, and hardcoded durations that should be tokens.
- [ ] Type-check passed (`tsc --noEmit`).
- [ ] If interactive: clicked through in a browser, keyboard tested, checked at a small viewport, checked with `prefers-reduced-motion: reduce`.
- [ ] If the user asked for a review or audit: every change reported as a Before/After row with its reason.

## When a check fails

Don't disable the check; fix the underlying choice. Most failures here come from reaching for a default before considering the right tool, animating something the user sees frequently, or adding novelty for novelty's sake.
