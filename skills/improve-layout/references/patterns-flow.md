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
- [Center](#center--bounded-max-width-container--css)
- [Box](#box--border-respecting-padded-container--twsh)

## Stack — vertical rhythm between siblings — tw

```tsx
<div className="flex flex-col gap-6">…</div>          {/* uniform spacing */}
<div className="flex flex-col [&>*+*]:mt-6">…</div>   {/* the "between" semantic */}
```

Use flex/grid with `gap-N` by default. Use the lobotomized owl
(`[&>*+*]:mt-N`) when the container cannot be flex/grid (for example, a
`prose` block), or when only the space *between* siblings should contribute to
the stack.

**Anti-pattern**: `mb-N` on every child adds a trailing margin after the last
child.

## Cluster — inline group that wraps cleanly — tw

```tsx
<div className="flex flex-wrap items-center gap-2">{tags.map(t => <Badge key={t}>{t}</Badge>)}</div>
```

Use for tag lists, breadcrumbs, button groups, and bylines. Prefer `gap` because
child margins compound at wrap boundaries. **When NOT**: a toolbar or navigation
row that must remain on one line.

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
- Name one block-axis scroll owner. Overflow on the provider, inset, and inner page at once breaks sticky regions and creates nested scrolling.
- Test expanded, collapsed, mobile panel, and controlled states; preserve focus return, the existing trigger, and the keyboard shortcut.
- Sweep widths and 200% zoom with long navigation labels, deep menu nesting, wide tables/code blocks, and a page footer. Verify the sidebar never leaves the main track unusably narrow before its intended collapse.
- Keep shell responsiveness viewport-scoped when the shell fills the page. Use container queries inside cards/panels placed in `SidebarInset`, not to replace the shell's state contract.

**When NOT:** a passive content companion beside a main region has no provider, collapse state, mobile sheet, or keyboard contract. Use the content-flow sidebar below.

## Content-flow sidebar — a narrow column beside flexible content — css

Use this pattern for a passive content companion, not a shadcn `Sidebar` with
collapse state, a mobile panel, or keyboard behavior (owner **sh**). It has
exactly two direct children: a sidebar-width child and a flexible companion.
Flex wrapping moves them to one column when the companion reaches its minimum
inline size; a fixed two-track Grid does not.

Mark the sidebar child with `.sidebar`; `:has()` configures its parent. Custom
properties expose the size, gap, and wrap threshold:
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
Override a property per instance, for example
`<div style={{ "--sidebar-size": "8rem" } as React.CSSProperties}>`. Rename the
marker consistently (for example, `[data-content-sidebar]`) when `.sidebar`
could be confused with the shadcn component.

Keep the two-child contract. Nest another two-child pattern when the layout has
more regions. Add a container query only when testing exposes an intermediate
state that leaves the main content too narrow:

```css
:has(> .sidebar) { container-type: inline-size; }
@container (max-inline-size: 400px) {
  :has(> .sidebar) > .sidebar { inline-size: 100cqw; }
}
```

Choose the threshold from the failing content width. At the 2026-07-22
reference snapshot, dimensional container queries cannot read it from a custom
property. Investigate selector cost only when measurement identifies style
recalculation as a hot path.

**When to reach for it**: a content column with an intrinsic-width companion (docs TOC, filters beside results). **When NOT**: a full app shell with collapsible nav + mobile drawer → shadcn `Sidebar`.

When the intent is explicitly to **stay two columns**, use the two-column Grid form instead:

```tsx
<div className="grid grid-cols-[fit-content(20ch)_minmax(min(50vw,30ch),1fr)] gap-6">
  <aside>{nav}</aside>
  <main>{content}</main>
</div>
```

This form constrains the tracks on narrow screens and keeps two columns at every
width. Use the Flex pattern above when a one-column state is required.

## Switcher — two columns that fold to one at a content width — css

```tsx
<div className="flex flex-wrap gap-6" style={{ "--measure": "60ch" } as React.CSSProperties}>
  <div className="grow basis-[calc((var(--measure)-100%)*999)]">{left}</div>
  <div className="grow basis-[calc((var(--measure)-100%)*999)]">{right}</div>
</div>
```

Below `--measure`, the positive basis makes each child occupy a row. Above it,
the negative basis is invalid, so `grow` lets the children share the row.
Document the formula where it is used because the transition is not apparent
from the utilities. **When NOT**: a design that pins the fold to a specific
breakpoint; use a container or viewport query at that width.

## Cover — full viewport, optional centered content — tw + css

```tsx
<section className="grid min-h-dvh gap-8 p-6 grid-rows-[auto_1fr_auto]">
  <header>{topbar}</header>
  <div className="place-self-center">{centered}</div>
  <footer>{footer}</footer>
</section>
```

Use `min-h-dvh` (owner **tw**) when the surface should track dynamic browser
chrome. Use `min-h-svh` when it must fit with the chrome shown, such as a login
screen. **When to reach for it**: heroes, full-screen modals, and splash/login
screens.

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

## Center — bounded max-width container — css

```tsx
<div style={{ width: "min(100% - 2rem, 60ch)", marginInline: "auto" }}>{prose}</div>
```

`min()` combines the inline gutters and maximum measure in one rule. Use it for
prose containers, page wrappers, and form columns; expose the measure when the
pattern is componentized.

## Box — border-respecting padded container — tw/sh

Use shadcn `Card` when the content has card anatomy (header/content/footer) or the project already standardizes it. For a generic padded wrapper, use utilities; a Card is not the owner merely because both draw a box. When a boundary must survive forced-colors mode, add a transparent outline alongside the visual border (`outline outline-transparent`).
