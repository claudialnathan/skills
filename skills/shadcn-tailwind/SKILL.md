---
name: shadcn-tailwind
description: "Stack-wide UI discipline for shadcn 4.x (Base UI default, Radix supported) + Tailwind v4, covering component architecture and token mechanics. Architecture: edit the source in `components/ui/`, don't build a parallel component or wrapper; compose, don't prop; keep primitives uncontrolled by default; bare data attributes (`data-open`, `data-pressed`) for visual state, `data-slot` for parent-aware targeting. Mechanics: rem and oklch by default, hex never; semantic tokens over raw palettes; map design values to existing tokens and ask when nothing fits; `render` not `asChild` on Base UI. Read `globals.css` and the `shadcn/tailwind.css` base layer for project tokens before writing classNames. Use for any question about shadcn or Tailwind v4 conventions: composing or extending components, variants, controlled vs uncontrolled, wrapping Base UI, tokens, registries, or why a utility class isn't taking effect."
compatibility: Tailwind v4 + shadcn 4.x (Base UI default, Radix supported)
paths:
  - '**/*.{tsx,jsx,mdx}'
  - '**/globals.css'
  - '**/app.css'
  - '**/tailwind.css'
  - '**/components.json'
  - '**/components/**/*.{ts,tsx}'
---

# shadcn (latest) + Tailwind v4 discipline

<!-- Earned against: Fable 5, 2026-07-11, v2.1.204 — history: CHANGELOG.md -->

You're working on UI in a project that likely uses the modern shadcn + Tailwind stack: shadcn 4.x components with Base UI (`@base-ui/react`) as the default primitive library, Tailwind v4 with tokens declared in CSS. Radix remains a supported 4.x choice — trust `components.json` and the dependencies over version numbers (last section). **The move: stop treating UI as className typing and start treating it as API shape.** Every edit is a chance to ask whether editing the source, composing, or adding a variant is cleaner than the next wrapper or prop. Token mechanics are the floor, not the lead — they catch symptoms; the architecture decisions catch causes.

## The source in `components/ui/` is yours. Edit it.

shadcn's model is "the code is yours": components are copied into the project (wherever `components.json` points, typically `components/ui/` or `src/components/ui/`). That file is the component, not a vendored library surface. The most damaging habit on this stack is treating those files as untouchable. It produces recognizable wreckage:

- **A parallel component beside the real one** — a `DataTable` outside `ui/`, a second `Breadcrumb` — because editing the original felt off-limits. Now two sources drift.
- **Per-instance styling pasted at call sites.** "Repeated-but-visible beats DRY-but-buried" is not a defense; the point of owning the source is that the fix cascades.
- **A primitive re-implemented in raw HTML with inline styles**, silently dropping behavior the original shipped: table-header sorting, menu auto-close on select, focus and keyboard handling.

The smell test: if a stock shadcn behavior is missing — headers don't sort, the menu stays open after selecting — suspect a hand-rolled replacement and go find it. And before creating any UI pattern, check whether the app already renders it; edit that single source rather than adding a second.

When you need a new variant — `variant="success"`, `size="2xl"`, icon-only — add it to `cva` in `components/ui/<name>.tsx`:

```tsx
const buttonVariants = cva(base, {
  variants: {
    variant: {
      default: '…',
      success: 'bg-success text-success-foreground hover:bg-success/80',
    },
  },
});
```

The boundary: system-wide changes belong in the `ui/` source as variants; page-specific styling stays in the consumer via `className` — don't restyle a shared primitive to suit one page. A genuinely new composition (a `PageHeader` arranging `Button` + `Heading`) is a new component; a parallel API over an existing primitive never is.

## Compose, don't prop

When a primitive feels limited, the first reach is not a boolean prop on a wrapper — it's composition with the slots already in scope. The tell: `<MyButton isLoading isDestructive iconLeft={…} />`. Each boolean grows the surface, fights the others, and hides what's possible.

```tsx
<Button variant="destructive" disabled={isLoading}>
  {isLoading ? <Spinner /> : <TrashIcon />}
  Delete
</Button>
```

For multi-part components, use the namespaced sub-components shadcn ships (`Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`, …). Wanting `<Dialog title="…" footer={…} />` is the prop-explosion antipattern; the sub-components already exist.

## Read the tokens first — both layers

The token system has two layers. The base layer ships as a package: `@import "shadcn/tailwind.css"` at the top of `globals.css` (it also provides utilities like `scroll-fade` and `shimmer`; `npx shadcn eject` inlines it for projects that want no CSS dependency). The project's own layer is the `@theme` / `@theme inline` block plus the `:root` and `.dark` variable definitions in `globals.css`. **Open `globals.css` once at the start of UI work, before writing classNames** — the project delta is the part you can't guess:

- **Custom font-weight scales** under `--font-weight-*` — projects redefine the numeric values (420/550 instead of 400/600) or omit steps entirely. Don't assume `font-medium` exists; verify.
- **Semantic colors beyond shadcn defaults** — `--color-link`, `--color-foreground-subtle`, status colors — which become `text-link`, `text-foreground-subtle`.
- **Custom text sizes** like `--text-caption`, each needing its paired `--text-caption--line-height`.
- **Custom radii** beyond the default `xs`–`xl` scale.
- **`@theme inline` semantics**: inline uses the variable's value in the utility, so chained `var()` references resolve — and inlined tokens are not emitted as CSS custom properties, so hand-written CSS can't `var()` them. Don't flip inline on or off without understanding both effects.

**The token layer is protected surface.** Don't edit `globals.css` as a side-effect of component work — propose the token change and wait. And never switch the dark-mode mechanism: check whether the project uses class-based dark mode (`@custom-variant dark (&:is(.dark *))` with next-themes) or `prefers-color-scheme` before touching any dark style; "simplifying" one into the other kills the manual override path.

Color discipline follows from the tokens: semantic over raw (`bg-card`, `text-muted-foreground`, `bg-primary` — plus the project's custom semantics), raw palette classes (`bg-red-500`, `text-zinc-900`) only when no semantic fits and then propose one. Never pair `bg-white dark:bg-gray-950` when a semantic token already adapts; writing `dark:` to backfill a missing token means the token is what's missing.

## Design values are never new

When implementing from a design reference — Figma, Paper, a screenshot, a casual "make it look like X" — assume every value maps to something that already exists. Colors, sizes, gaps, shadows, strokes: match them to the project's tokens and named utilities. The order is named utility → existing token → **stop and ask**. When nothing closely matches, say what you found ("closest is `text-caption` + `text-muted-foreground`; the spec says 13px/#6b7280") and let the owner decide — never mint a token or an arbitrary value to close the gap silently.

When the reference is another surface in the app ("same as the control panel"), open that component and derive from its actual classes. Approximating from a screenshot produces a second, slightly-wrong implementation of a treatment that already has a source.

## Spacing and brackets

Tailwind v4's spacing scale is dynamic, driven by `--spacing` (default 0.25rem). Any multiple resolves as a named utility, including fractional steps: `p-7.5`, `size-2.75`, `gap-0.5` all work natively. Never mint tokens like `--spacing-7_5`.

Before typing a bracket, divide by `--spacing`: `min-h-[3.75rem]` is `min-h-15`; `size-[0.6875rem]` is `size-2.75`; `rounded-[0.125rem]` is `rounded-xs`. The rule covers every length position, not just padding and gap — `size-*`, radii, and values inside grid templates are exactly where it gets skipped. When a value genuinely must live inside an arbitrary expression (grid templates, `calc()`), compose it from the scale instead of hardcoding: `grid-rows-[repeat(5,--spacing(2.75))]`, not `grid-rows-[repeat(5,0.6875rem)]`.

Arbitrary values are for true off-scale needs, after the named-utility check — and under the contract above, an off-scale designer value is a stop-and-ask, not a bracket.

## rem and oklch

Everything you author is rem and oklch. `px ÷ 16 = rem` for any length. Colors are semantic tokens first, `oklch(…)` when a literal is unavoidable; `#hex` and `rgb()` never appear in new code. Convert stray px/hex in passing — in files you're already editing, never as side-effect edits to `globals.css` (protected surface, above).

The carve-outs are principled and small:

- **Shadow offsets and blur radii stay px** — device-pixel concepts that shouldn't grow with the user's font size (Tailwind's own shadow scale is px). Shadow colors are still oklch with alpha, never rgba.
- **Form inputs keep `font-size: max(16px, 1rem)`** — below an effective 16px, iOS Safari zooms on focus.
- **Hit-area floors** (≥40×40px targets) are device-pixel by nature.

Third-party and generated code you don't own is exempt. Everything else: rem + oklch.

## Style state through the data attributes

Base UI exposes component state as **bare data attributes** — `data-open`, `data-closed`, `data-pressed`, `data-disabled`, `data-checked` / `data-unchecked`, `data-highlighted`, `data-popup-open` (on triggers), plus `data-starting-style` / `data-ending-style` for CSS transitions. Tailwind targets them without brackets:

```tsx
<Popover.Popup
  className={cn(
    'rounded-md border bg-popover p-3 shadow-md',
    'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
    'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
    'data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2',
  )}
/>
```

`data-[state=open]` is the **Radix** idiom — on Base UI primitives it matches nothing and the styles silently never apply. Valued attributes (`data-side`, `data-orientation`) keep the bracket form. Don't blanket-rewrite `data-[state=…]` on sight, though: some libraries set it themselves (TanStack Table puts `data-state="selected"` on rows), and on a Radix-based project it's correct. Each Base UI component's API reference lists its attributes — check it rather than guessing.

Treat these attributes as the contract between primitive and styles — and target them in tests too, instead of pasting `data-testid` over them.

shadcn also stamps `data-slot="<name>"` on every sub-component (`data-slot="card-header"`, `data-slot="button"`). That's identity, not state: stable selectors for parent-aware styling that survive className changes —

```tsx
<form className={cn('space-y-4', '[&_[data-slot=submit-button]]:w-full')}>
```

Lean on `data-*` selectors before adding className props or toggling classes from JS.

## `render`, not `asChild`

Base UI (`@base-ui/react`) composes through a `render` prop; `asChild` is the Radix idiom — it may type-check but the component ignores it. Element form for the common case, function form when the rendered element depends on component state:

```tsx
<Dialog.Trigger render={<Button variant="outline" />}>Open</Dialog.Trigger>

<Switch.Root render={(props, state) => (
  <button {...props}>{state.checked ? 'On' : 'Off'}</button>
)} />
```

The point isn't syntax: `render` keeps your element inside the primitive's focus/keyboard/ARIA contract, where a `<div onClick>` wrapper around a Trigger breaks it.

The form that bites in practice is **links as buttons**: `<Button render={<Link href="…" />} nativeButton={false}>` — without `nativeButton={false}`, the console errors that a native button element was expected. External URLs stay plain `<a>` (typedRoutes rejects them on `Link`).

Import from the shadcn-installed copy (`@/components/ui/*`), not `@base-ui/react` directly. When porting Radix-era examples, grep for `asChild` in any file importing `@base-ui/react`; every match is a bug.

## Uncontrolled by default

Base UI primitives manage their own state. Reach for `open`/`onOpenChange`, `value`/`onValueChange`, `checked`/`onCheckedChange` only when a parent must read or set that state — coordinating with another component, persisting to URL/storage, driving from a form library. Adding `useState` to a dialog nothing else reads is the most common state-design slip on this stack; when you do lift, say why.

## Verify before done

- **Prove the class exists.** A token you add or rename must produce the utility you think: `--color-text-links` generates `text-text-links`, not `text-links` (name color tokens `--color-link` → `text-link`); an `@theme inline` line mapping to an undefined `:root` var compiles into a rule that paints nothing; a duplicate token definition silently takes the last value. Compile the project's CSS and grep the output for the class when in doubt.
- **Register custom tokens with tailwind-merge.** `cn()` classifies unknown `text-*` values as colors, so `cn('text-xxs', 'text-foreground')` silently drops the font size. Any custom `--text-*` token needs `extendTailwindMerge({ extend: { classGroups: { 'font-size': [{ text: ['xxs'] }] } } })` in the `cn` module.
- **Paired line-heights.** Overriding a `--text-*` size without its `--text-*--line-height` inherits a ratio designed for a different size.
- **When a change "didn't take", read the computed styles** and find the winning rule — never argue with the observation. Usual suspects: a second implementation of the component rendering on that page, an `@theme inline` indirection, a broken `var()` chain falling back (borders suddenly black is that failure).
- **Drive the interaction.** Click it, tab it, open it before reporting done — a fix that was never exercised isn't one.

## Search the registry before hand-building

The shadcn MCP server (`npx shadcn@latest mcp`, usually already in the project's `.mcp.json`) searches every registry the project configures: `search_items_in_registries` to find, `get_item_examples_from_registries` for full demo code, `get_add_command_for_items` for the install command. Registries are namespaced (`@acme/…`) and any public GitHub repo with a `registry.json` works (`shadcn add <user>/<repo>/<item>`). Check what exists before building a component from scratch. For Base UI API details, read the live docs (`base-ui.com/llms.txt` indexes them) rather than trusting memory — the library moves faster than training data.

## Before considering UI work done

- [ ] Existing pattern reused or its single source edited — no parallel component, no per-instance restyling of a shared primitive.
- [ ] New variants live in `components/ui/<name>.tsx` via `cva`; page-specific styling stayed in the consumer.
- [ ] Composition (slots, sub-components) before new props on a wrapper.
- [ ] Design values mapped to existing tokens and named utilities; off-scale values surfaced and approved, never silently minted.
- [ ] No bracket value that resolves to a named utility (fractional steps count: `size-2.75`, `p-7.5`); scale composed via `--spacing()` inside grid/calc expressions.
- [ ] rem + oklch in everything authored; px only in the named carve-outs; no hex anywhere.
- [ ] State styles use bare Base UI attributes (`data-open:`, `data-pressed:`); bracket form only for valued attributes; no `data-[state=…]` against Base UI primitives.
- [ ] No `asChild` on Base UI — `render` used; links-as-buttons carry `nativeButton={false}`.
- [ ] Primitives uncontrolled unless a parent genuinely reads or sets the state.
- [ ] New or renamed tokens verified to generate their class; custom `--text-*` registered with tailwind-merge; paired line-heights set.
- [ ] `globals.css` untouched unless the token change was the task or was explicitly approved.
- [ ] The changed interaction was exercised before calling it done.

## When implementing from a design

This skill is the always-on baseline. When the task is specifically "implement this design" — a Figma frame, a mockup, a design-token spec — the `figma-to-tailwind-tokens` skill, if available, carries the deeper translation workflow (theme allowlist, property-by-property mapping, ask-before-snapping). The contract here applies regardless.

## When the stack assumptions don't hold

Detection is `components.json` plus dependencies, never version numbers: a `style` beginning `base-` (`base-nova`, `base-mira`) and `@base-ui/react` in deps mean Base UI; `@radix-ui/*` (or the unified `radix-ui` package) means Radix — a current, fully supported shadcn 4.x choice, where `asChild` is correct and the `render` guidance above doesn't apply. Radix exposes `data-state="open"`-style attributes, so there the bracket idiom is right. On Tailwind v3 (`tailwind.config.js` instead of CSS-first `@theme`), the architecture discipline holds and the token system lives in `theme.extend`. If neither shadcn nor Tailwind fits the project, disregard this skill.

## References

- Tailwind v4 theme: https://tailwindcss.com/docs/theme
- shadcn docs: https://ui.shadcn.com/docs — changelog: https://ui.shadcn.com/docs/changelog
- Base UI: https://base-ui.com — live API index: https://base-ui.com/llms.txt
