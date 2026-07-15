---
name: design-polish
description: "The proactive polish layer for shadcn (Base UI) + Tailwind v4 interfaces — details proposed unprompted where they fit: concentric radii, tabular-nums on changing numbers, text-balance and text-pretty, focus-visible rings, 40px hit areas, scroll-margin under sticky bars, safe-area insets, skeletons over spinners, empty/loading/error states, z-index from a token scale. Owns the pre-ship UI checklist. Use when finishing or reviewing any UI surface, when asked to polish or tighten an interface, before shipping UI work, or when a build stopped at the literal ask and needs the last 10%."
compatibility: Tailwind v4 + shadcn (Base UI) + Next.js
paths:
  - '**/components/**/*.{ts,tsx,jsx}'
  - '**/app/**/*.{tsx,jsx,mdx}'
  - '**/pages/**/*.{tsx,jsx,mdx}'
  - '**/src/components/**/*.{ts,tsx,jsx}'
---

# design-polish

<!-- Earned against: Fable 5, 2026-07-15, v2.1.210 -->

Scaffolding is not finished UI. Structure generated from a mockup is the foundation; the polish pass — states, focus, spacing details, microcopy — is separate, deliberate work, and the default model stops at the literal ask. **The attention shift this skill makes: propose the polish items unprompted, each where it fits the surface and with its reason stated.** Match the codebase's conventions first — if `tabular-nums` is consistently applied to similar surfaces, follow that pattern; if a value exists as a token, use the token, and don't mint new tokens unprompted (flag them for discussion instead).

## The polish table

Some items are universal (focus-visible, no `transition: all`, reduced-motion at the token layer); others are conditional on the design (concentric radii need nested rounded surfaces; image outlines need content images). Judgment, not a checklist sweep. Full reasoning per item: [references/polish.md](references/polish.md).

|     | Pattern | Why |
| :-- | :--- | :--- |
| 1   | **Concentric radii** — outer = inner + padding | Mismatched nested radii is the #1 visual smell |
| 2   | **`tabular-nums`** on counters / timers / prices / dynamic counts | Prevents per-digit layout shift |
| 3   | **`text-balance`** on headings, **`text-pretty`** on body | Eliminates orphans and lopsided wraps |
| 4   | **`scale-[0.97]` on `:active`** for buttons | Tactile feedback; never below 0.95 |
| 5   | **focus-visible** with `outline: max(2px, 0.08em) solid currentColor; outline-offset: 0.15em` | `currentColor` adapts to dark mode for free |
| 6   | **Image outline** at 10% pure black (light) / 10% pure white (dark) | Tinted neutrals read as dirt on the edge |
| 7   | **`scrollbar-gutter: stable`** on scroll containers | Prevents layout shift on overflow |
| 8   | **`scroll-margin-top`** on anchored sections and focusables under sticky bars | Clears sticky headers; keeps keyboard focus visible (WCAG 2.2 SC 2.4.11) |
| 9   | **`-webkit-font-smoothing: antialiased`** at the root (macOS) | Crisper text |
| 10  | **40×40px hit area** (44 for AAA / primary touch); pseudo-element extension for icon-only | WCAG 2.2 floor is 24px (SC 2.5.8); 40 clears it, 44 is AAA (SC 2.5.5) |
| 11  | **No `transition: all`** — always specify properties | Prevents accidental animation on layout/paint |
| 12  | **`will-change`** only on `transform`/`opacity`/`filter`, only when first-frame stutter is observed | Don't preemptively |
| 13  | **`@media (prefers-reduced-motion: reduce)`** at the token layer | One rule covers every component |
| 14  | **`aria-live="polite"`** on toast/error containers | Screen readers announce without focus theft |
| 15  | **Hover-flicker pattern** — animate a child, not the element itself, when hover triggers a position change | Cursor leaving mid-tween ends hover; outer wrapper stays still |
| 16  | **Safe-area insets** on fixed/sticky bars (`pb-[max(…,env(safe-area-inset-bottom))]`) + `viewport-fit=cover` | iOS home indicator and notch clip fixed bars otherwise |
| 17  | **Fixed `z-index` scale** at the token layer — no `z-[N]` arbitrary | Stops the z-9999 spiral |
| 18  | **Pause looping animations off-screen** (IntersectionObserver or `animation-timeline: view()`) | Off-screen compositor work costs battery; nobody sees it |

## Add unprompted

When building a UI surface, propose these where they fit and aren't already handled:

- Focus-visible ring on every interactive element; hit-area floor (40×40px) on every button.
- `tabular-nums` anywhere a number changes; `text-balance` on headings; `text-pretty` on paragraphs.
- `scale-[0.97]` on `:active` for buttons; `aria-label` on icon-only buttons.
- `scroll-margin-top` on fragment-link targets and focusables a sticky bar could hide.
- Image outlines on content images (10% black/white); semantic input types (`type="email"`, `inputMode="numeric"`).
- Empty state with a real message (not a blank panel). **Loading state via skeleton — preserves layout — for any waiting beyond ~300ms**; the skeleton is for the cold-cache case only (if cached data exists, render it instead of a waiting state).
- Safe-area insets on fixed bars, bottom sheets, and full-bleed mobile surfaces.
- `AlertDialog` (not `Dialog`) for destructive or irreversible actions; `z-index` read from the token scale.
- One accent color per view — greys carry the rest; a second only when it earned the seat.

## Review output contract

When reviewing existing UI code, present every change as a markdown table with **Before** and **After** columns — every change made or proposed, not a subset; never loose "Before:" / "After:" lines outside a table. Group changes by principle with a heading above each table, and keep each row to a single diff so the whole list scans quickly. Write every **After** snippet in the styling system the project already uses, carry the one-line reason with each row, and cite `file:line` when it isn't obvious from the snippet. A principle that was reviewed and needed nothing gets no table at all.

## Pre-ship

Before saying "done" on any UI work, run [references/checklist.md](references/checklist.md) — the standalone pre-ship review list. When the `web-design-guidelines` skill is installed and the ask is a review/audit, its authoritative URL takes precedence over the bundled list.

Sibling disciplines, each standalone when installed: `design-layout` (structure and fluid sizing), `design-motion` (whether and how to animate), `design-taste` (stating the reason), `shadcn-tailwind` (token mechanics — auto-loads on the same files).

## References

| File | Scope |
| :--- | :--- |
| [`references/polish.md`](references/polish.md) | Concentric radii, optical alignment, shadows over borders, image outlines, depth via blur+stagger, tabular nums, scale-on-press, hit areas — full reasoning per item. |
| [`references/checklist.md`](references/checklist.md) | Pre-ship review checklist used at the end of any UI task. |

Open one file at a time; the body is the always-on layer, references are on-demand depth.
