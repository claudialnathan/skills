# Flow and shell layout patterns

Load this file only for flow relationships and page/app shells: stack, cluster,
stateful navigation, content-flow sidebars, switchers, viewport covers, sticky
shells, centered measures, and boxes.

Owner tags: **sh** existing/shadcn behavioral component · **tw** native
Tailwind v4 utility · **css** authored CSS that passed the measurable-benefit
gate in `SKILL.md`.

## Contents

- [Stack](#stack--vertical-rhythm-between-siblings--tw)
- [Cluster](#cluster--inline-group-that-wraps-cleanly--tw)
- [Stateful app shell](#stateful-app-shell--sh-plus-layout-audit)
- [Content-flow sidebar](#content-flow-sidebar--a-narrow-column-beside-flexible-content--css)
- [Switcher](#switcher--two-columns-that-fold-to-one-at-a-content-width--css)
- [Cover](#cover--full-viewport-optional-centered-content--tw--css)
- [Sticky shell](#sticky-shell--sticky-headersidebar-bounded-by-page-regions--tw--css)
- [Center](#center--the-universal-max-width-container--css)
- [Box](#box--border-respecting-padded-container--twsh)

## Stack — vertical rhythm between siblings — tw

```tsx
<div className="flex flex-col gap-6">…</div>          {/* uniform spacing */}
<div className="flex flex-col [&>*+*]:mt-6">…</div>   {/* the "between" semantic */}
```

`gap` is the default and owns this — flex/grid + `gap-N`, nothing to hand-roll. Use the lobotomized owl (`[&>*+*]:mt-N`) only when (a) the container cannot be flex/grid (a `prose` block), or (b) the *between* semantic is required so the first/last child carries no externally imposed margin and stacks compose without double-padding.

**Anti-pattern**: `mb-N` on every child — the last child gets phantom space.

## Cluster — inline group that wraps cleanly — tw

```tsx
<div className="flex flex-wrap items-center gap-2">{tags.map(t => <Badge key={t}>{t}</Badge>)}</div>
```

Tag lists, breadcrumbs, button groups, bylines. `gap`, never margins (they compound at wrap boundaries). **When NOT**: a row that must stay one line (a toolbar, a nav) — don't add `flex-wrap`; that fights its intent.

## Stateful app shell — sh plus layout audit

Keep the installed project/shadcn shell as the behavioral owner. Improve its checked-in layout rather than replacing its provider, collapse state, mobile panel, focus behavior, or keyboard controls with a parallel shell.

The common shadcn composition is:

```text
SidebarProvider
├── Sidebar
└── SidebarInset
    └── Main content
```

Audit the seams around that structure:

- Give the flexible main/inset track permission to shrink (`min-inline-size: 0` or the project's utility) and diagnose its long-content policy separately.
- Name one block-axis scroll owner. Accidental overflow on the provider, inset, and inner page at once produces broken sticky regions and nested scroll traps.
- Test expanded, collapsed, mobile panel, and controlled states; preserve focus return, the existing trigger, and the keyboard shortcut.
- Sweep widths and 200% zoom with long navigation labels, deep menu nesting, wide tables/code blocks, and a page footer. Verify the sidebar never leaves the main track unusably narrow before its intended collapse.
- Keep shell responsiveness viewport-scoped when the shell fills the page. Use container queries inside cards/panels placed in `SidebarInset`, not to replace the shell's state contract.

**When NOT:** a passive content companion beside a main region has no provider, collapse state, mobile sheet, or keyboard contract. Use the content-flow sidebar below.

## Content-flow sidebar — a narrow column beside flexible content — css

Not the shadcn `Sidebar` (that's a stateful app-nav shell — owner **sh**). This is the content-flow Sidebar *pattern*: a sidebar-width child and a companion that fills the rest, collapsing to one column when narrow, **with no media/container query**. The wrapping behavior comes from Flexbox; a fixed two-track Grid does not collapse itself into one column.

Drop a `.sidebar` child into a wrapper and let `:has()` assemble the layout, parametric via custom properties. The `:has()` form supersedes the older `.with-sidebar` wrapper class:
```css
:has(> .sidebar) {
  display: flex; flex-wrap: wrap; gap: var(--sidebar-gap, 1rem);
}
.sidebar { flex-basis: var(--sidebar-size, 20rem); flex-grow: 1; }
:has(> .sidebar) > :not(.sidebar) {
  flex-basis: 0; flex-grow: 999;
  min-inline-size: var(--sidebar-wrap-at, 50%);   /* wrap threshold */
}
```
Override per instance like a prop: `<div style={{ "--sidebar-size": "8rem" } as React.CSSProperties}>`. If `.sidebar` is too easy to confuse with the shadcn component in a particular project, rename the marker consistently (for example, `[data-content-sidebar]`) without changing the selector structure.

Treat exactly two children as the default contract and expose incorrect markup during development:

```css
:root { --layout-error: 0.25rem solid red; }
:has(> .sidebar) > :only-child,
:has(> .sidebar) > :nth-child(3) {
  outline: var(--layout-error);
  --error: "Sidebar layouts expect exactly two child elements";
}
```

Multiple sidebars can work, but introduce more wrapping states; test each state rather than disabling Flexbox's normal behavior. Add one container query only when a real intermediate state makes the main content sidebar-narrow:

```css
:has(> .sidebar) { container-type: inline-size; }
@container (max-inline-size: 400px) {
  :has(> .sidebar) > .sidebar { inline-size: 100cqw; }
}
```

Keep that threshold intentional; at the 2026-07-22 reference snapshot, dimensional container queries cannot read the desired breakpoint from a custom property. Prefer nesting one two-child Sidebar inside another when that produces more predictable states. Selector cost is not a reason to avoid this pattern absent a measured style-recalculation hot path.

**When to reach for it**: a content column with an intrinsic-width companion (docs TOC, filters beside results). **When NOT**: a full app shell with collapsible nav + mobile drawer → shadcn `Sidebar`.

When the intent is explicitly to **stay two columns**, use the two-column Grid form instead:

```tsx
<div className="grid grid-cols-[fit-content(20ch)_minmax(min(50vw,30ch),1fr)] gap-6">
  <aside>{nav}</aside>
  <main>{content}</main>
</div>
```

This form constrains the tracks on narrow screens but never stacks them. Do not describe it as a wrapping/collapsing sidebar; use the Flex pattern above when a one-column state is required.

## Switcher — two columns that fold to one at a content width — css

```tsx
<div className="flex flex-wrap gap-6" style={{ "--measure": "60ch" } as React.CSSProperties}>
  <div className="grow basis-[calc((var(--measure)-100%)*999)]">{left}</div>
  <div className="grow basis-[calc((var(--measure)-100%)*999)]">{right}</div>
</div>
```

The basis evaluates hugely positive when the container is narrower than `--measure`, forcing each child onto its own row. When the result is negative, the declaration is invalid and drops out, leaving the children to share a row through `grow`. **No media query, content-driven.** This is clever CSS: use it only when the team recognizes or documents the pattern. **When NOT**: a fold the design pins to a *specific* breakpoint — use `@container`/breakpoint so it flips at the chosen width, not a content-derived one.

## Cover — full viewport, optional centered content — tw + css

```tsx
<section className="grid min-h-dvh gap-8 p-6 grid-rows-[auto_1fr_auto]">
  <header>{topbar}</header>
  <div className="place-self-center">{centered}</div>
  <footer>{footer}</footer>
</section>
```

`min-h-dvh` (owner **tw**) not `min-h-screen` (= `100vh`, wrong on mobile — ignores browser chrome). Use `min-h-svh` when content must always fit even with chrome shown (login screens). **When to reach for it**: heroes, full-screen modals, splash/login.

## Sticky shell — sticky header/sidebar bounded by page regions — tw + css

Keep the sidebar's sticky element inside an `aside` that occupies the shell's sidebar grid area. The grid item supplies the containing region, so the sticky child stops before the footer instead of overlapping it:

```css
.shell {
  --header-height: 5rem;
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 14rem minmax(0, 1fr);
}
.shell-header { grid-area: header; position: sticky; inset-block-start: 0; z-index: 2; }
.shell-sidebar { grid-area: sidebar; position: relative; }
.shell-sidebar > * { position: sticky; inset-block-start: var(--header-height); }
.shell-main { grid-area: main; min-inline-size: 0; }
.shell-footer { grid-area: footer; }
```

Use shadcn `Sidebar` instead when the shell also needs collapsible state, an off-canvas mobile panel, or keyboard controls. Test the actual scroll container: sticky positioning is relative to the nearest scrolling ancestor, and an accidental `overflow` ancestor commonly breaks it.

This is the wide shell state, not a complete mobile strategy. Add one intentional viewport/container transition when the fixed sidebar would leave the main area unusably narrow.

## Center — the universal max-width container — css

```tsx
<div style={{ width: "min(100% - 2rem, 60ch)", marginInline: "auto" }}>{prose}</div>
```

One rule, gutters built in, never overflows narrow viewports. **Reach for this before composing `max-w-* px-* mx-auto`** — it passes the cuts-lines test. Every prose container, page wrapper, form column. The `--measure`/max is the prop when componentized.

## Box — border-respecting padded container — tw/sh

Use shadcn `Card` when the content has card anatomy (header/content/footer) or the project already standardizes it. For a generic padded wrapper, use utilities; a Card is not the owner merely because both draw a box. When a boundary must survive forced-colors mode, add a transparent outline alongside the visual border (`outline outline-transparent`).
