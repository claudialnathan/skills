---
name: shadcn-tailwind
description: "Stack-wide UI discipline for shadcn 4.x (Base UI) + Tailwind v4 — component architecture and token mechanics. Architecture: compose, don't prop; edit the source in `components/ui/`, don't wrap a parallel API; keep primitives uncontrolled by default; `data-state` for visual state, `data-slot` for parent-aware targeting. Mechanics: rem and oklch only (no px, no hex), semantic tokens over raw palettes, `render` not `asChild` on Base UI. Read `globals.css` for project `@theme` tokens before writing classNames. Auto-loads on UI files; pairs with figma-to-tailwind-tokens for design-translation workflows."
compatibility: Tailwind v4 + shadcn 4.x on Base UI
when_to_use: |
  Also trigger on: "review my UI", "audit my tailwind", "check shadcn", "shadcn best practices", "is this Base UI or Radix", "tailwind v4 conventions", "compose this component or add a prop", "extend or add a variant (cva)", "should this be controlled or uncontrolled", "lift state on this dialog", "client or server component", "how do I wrap Base UI without breaking it", "asChild vs render", "why isn't font-medium working", "should this be a token".
paths:
  - '**/*.{tsx,jsx,mdx}'
  - '**/globals.css'
  - '**/app.css'
  - '**/tailwind.css'
  - '**/components.json'
  - '**/components/**/*.{ts,tsx}'
---

# shadcn (latest) + Tailwind v4 discipline

You're working on UI in a project that likely uses the modern shadcn + Tailwind stack: shadcn 4.x components on Base UI, Tailwind v4 with `@theme` tokens declared in CSS. **The move: stop treating UI as className typing and start treating it as API shape.** Every component edit is a chance to ask whether composition, lifted state, or a variant in the source is cleaner than the next prop. Token mechanics (no `px`, no `#hex`) are the floor, not the lead — they catch symptoms; the architecture decisions below catch causes.

## Read the project's tokens first

The design system lives in an `@theme` block inside `globals.css` (sometimes `app.css` or `tailwind.css`). It declares CSS variables that Tailwind exposes as utility classes. **Open it once at the start of UI work in a project, before writing classNames.** The list of tokens varies per project; the file is the source of truth.

What to look for:

- **Custom font-weight scale** under `--font-weight-*`. Projects often use non-standard numeric values (e.g. 350/450/550/650 instead of 300/400/500/700), and may or may not declare `--font-weight-medium`. **Don't assume** `font-medium` exists — verify.
- **Semantic colors beyond shadcn defaults**: things like `--color-link`, `--color-foreground-subtle`, `--color-main-background`, role-specific status colors. These all become `bg-link`, `text-foreground-subtle`, etc.
- **Custom text sizes** like `--text-caption` (with paired `--text-caption--line-height`) → `text-caption`.
- **Custom radii** beyond the shadcn `xs/sm/md/lg/xl` defaults — projects sometimes go up to `2xl/3xl/4xl`.
- **`@theme inline`** vs plain `@theme` — `inline` uses the variable's _value_ in the utility, so chained `var()` references resolve correctly. Don't change the inline-vs-not without understanding the implication.

## Compose, don't prop

When a shadcn primitive feels limited, the first reach is _not_ a new boolean prop on a wrapper. It's composition.

**The tell:** you're about to write `<Button isLoading isDestructive iconLeft={…} />` or similar. Each new boolean prop is debt — it grows the component's surface, fights other props (`isLoading && isDestructive` — which wins?), and makes a future maintainer read source to know what's possible. The shadcn/Radix convention is to expose **slots** instead:

```tsx
// Reach: a new prop on a wrapped Button.
<MyButton isLoading icon={<TrashIcon />}>Delete</MyButton>

// Better: composition with the slots already in scope.
<Button variant="destructive" disabled={isLoading}>
  {isLoading ? <Spinner /> : <TrashIcon />}
  Delete
</Button>
```

For multi-part components (Dialog, Card, Accordion, Form), follow the namespaced sub-component pattern shadcn ships:

```tsx
<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger render={<Button variant="outline">Open</Button>} />
  <Dialog.Portal>
    <Dialog.Content>
      <Dialog.Title>…</Dialog.Title>
      <Dialog.Description>…</Dialog.Description>
      {children}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

When you find yourself wanting `<Dialog title="…" description="…" footer={…} />`, that's the prop-explosion antipattern. The sub-components already exist; use them.

## Edit the source, don't wrap

shadcn's model is "the code is yours." Components are copied into `src/components/ui/<name>.tsx`; that file is the component, not a re-export of a library.

When you need a new variant — `variant="success"`, `size="2xl"`, an icon-only style — **add it to `cva` in `components/ui/<name>.tsx`**, not to a parallel `MyButton` wrapper:

```tsx
// In components/ui/button.tsx — extend the cva config.
const buttonVariants = cva(base, {
  variants: {
    variant: {
      default: '…',
      destructive: '…',
      success: 'bg-success text-success-foreground hover:bg-success/90',
    },
    size: { sm: '…', md: '…', lg: '…' },
  },
});
```

Wrapping creates a divergent API: two places to learn, two places to break, and `Button` and `MyButton` slowly diverge in default props. Editing the source keeps a single surface. The exception is project-specific composition (e.g., a `PageHeader` that arranges `Button` + `Heading`) — that's a new component, not a wrapper around an existing primitive.

## Lift state only when it has to flow out

Base UI primitives are **uncontrolled by default**: `Dialog`, `Popover`, `Tabs`, `Switch`, `Select` all manage their own state internally. Switch to controlled (`open` / `onOpenChange`, `value` / `onValueChange`, `checked` / `onCheckedChange`) only when a parent needs to read or set that state — to coordinate with another component, to persist to URL/storage, to drive from a form library.

```tsx
// Default — uncontrolled.
<Dialog.Root>…</Dialog.Root>;

// Controlled — only when the parent needs to read or set open.
const [open, setOpen] = useState(false);
<Dialog.Root open={open} onOpenChange={setOpen}>
  …
</Dialog.Root>;
```

Reaching for controlled by default is the most common state-design slip on this stack: it adds a `useState` and a re-render path the component didn't need, and the state typically isn't doing anything outside the dialog. If you're authoring a primitive of your own that needs to support both modes, `@radix-ui/react-use-controllable-state` is the standard hook for merging — see Kibo UI's components for examples.

## `data-state` and `data-slot` are the styling API

Base UI exposes component state as `data-*` attributes — `data-state="open"`, `data-disabled`, `data-pending`, `data-invalid`, `data-pressed`, `data-side`, `data-orientation`. **Treat these as the contract between primitive and styles**, not as a syntax footnote:

```tsx
<Popover.Content
  className={cn(
    'rounded-md border bg-popover p-3 shadow-md',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2',
  )}
/>
```

These same attributes are what Playwright/Vitest tests should target — don't paste `data-testid` over them.

shadcn 4 also ships `data-slot="<name>"` on each sub-component (`data-slot="card-header"`, `data-slot="button"`). That gives parents stable selectors that survive className changes:

```tsx
// Parent-aware spacing without piercing the child.
<form className={cn('space-y-4', 'has-[>[data-slot=form-section]]:space-y-6', '[&_[data-slot=submit-button]]:w-full')}>
  {children}
</form>
```

`data-state` is for visual state. `data-slot` is for identity in a composition. Both are present on shadcn 4 primitives by default; lean on them before adding new className props.

## `render` prop: wrap without breaking the primitive

Modern shadcn (4.x+) ships components built on Base UI (`@base-ui-components/react`), not Radix Primitives. The most common training-data slip: `asChild` is the Radix pattern; Base UI uses a render prop. **`asChild` may type-check in a Base UI file but misbehaves at runtime** — the component doesn't honor it.

Two forms of `render`:

```tsx
// Element form — pass a JSX element. Base UI merges its computed props onto it.
<Dialog.Trigger render={<Button variant="outline" />}>Open</Dialog.Trigger>

// Function form — pass a function (props, state). State is the component's internal state.
<Switch.Root render={(props, state) => (
  <button {...props}>{state.checked ? 'On' : 'Off'}</button>
)} />
```

The function form is what `asChild` cannot express — use it when the rendered element depends on component state. Otherwise prefer the element form.

The reason this matters isn't syntactic: **the render prop preserves the primitive's focus/keyboard/ARIA contract**. Wrapping a Trigger in a `<div onClick={…}>` to add a tooltip, attach a ref, or layer an animation breaks the contract — focus management, keyboard handling, and `aria-*` plumbing all go through the primitive. The render prop adds your wrapper _inside_ that contract:

```tsx
// Breaks: the outer div eats focus and click semantics.
<div onClick={onOpen}><Dialog.Trigger /></div>

// Preserves: the trigger is now a styled MotionButton with the primitive's behavior intact.
<Dialog.Trigger render={<MotionButton whileTap={{ scale: 0.97 }}>Open</MotionButton>} />
```

Component sources live where `components.json` configures (typically `src/components/ui/`). Import from there, not from `@base-ui-components/react` directly — the shadcn-installed copy is the project's customizable surface. When porting examples from Radix-era docs, grep for `asChild` against any file importing `@base-ui-components/react`; every match is a bug.

## Default to existing tokens. Don't extend silently.

When the user gives a casual UI prompt — "make it look like X", a Figma reference, a copy-paste — assume the values they describe should map to existing tokens. **Lazy design language usually means "use what we already have."** Only add new entries to `globals.css` when the user explicitly says "new token" or "add a color", or when no existing token plausibly fits and you've checked.

If unsure whether a value matches an existing token, propose the mapping ("I think this is `text-caption` with `text-foreground-subtle`") rather than reaching for `text-[13px] text-[#6b7280]`.

## Color discipline

- **Semantic over raw.** Use shadcn's semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`, `bg-accent`, `text-accent-foreground`) plus the project's custom semantic tokens. Reach for raw palettes (`bg-red-500`, `text-zinc-900`, `bg-emerald-50`) only when no semantic equivalent exists — and then propose adding one.
- **Don't pair light/dark overrides** like `bg-white dark:bg-gray-950` when a semantic token already adapts. `bg-card` and `bg-background` already swap correctly under `.dark`.
- **`dark:` variant is for genuinely-different dark values**, not for backfilling a missing semantic token. If you find yourself writing `dark:bg-X` to compensate, stop and reach for the right semantic token instead.

## Spacing and arbitrary values

Tailwind v4's spacing scale is driven by `--spacing` (default `0.25rem`). Utilities like `min-h-15`, `w-23`, `gap-6`, `px-4` resolve to `N × --spacing`. So `min-h-15 = 3.75rem`, `w-23 = 5.75rem`, `gap-6 = 1.5rem`.

**If you find yourself typing an arbitrary value like `[3.75rem]` or `[20px]`, divide by `--spacing` (default 0.25rem) and try the named utility first.** `min-h-[3.75rem]` should be `min-h-15`. The Tailwind LSP will flag this; Claude often misses it because the multiplication isn't obvious.

Arbitrary values are legitimate for: `calc()` expressions, values not on the scale, or one-off designer requirements off the scale. They are **not** legitimate just because the named utility didn't come to mind first.

## No `px`. No `#hex`. Always rem and oklch.

Hard rule, no exceptions: **never write `px` or `#hex` values.** Not in arbitrary values, not in inline styles, not in new CSS, not in token declarations. Convert in passing when you see them, even in code you weren't otherwise touching.

- **Lengths are rem.** `px ÷ 16 = rem`. `[3px]` → `[0.1875rem]`, `[20px]` → `[1.25rem]`, `[180px]` → `[11.25rem]` (and try the named utility first — `[11.25rem]` is `45 × --spacing` so it's `min-h-45` / `w-45`). Applies to _every_ length: spacing, sizing, border, ring, offset, blur. Reason: rem scales with the user's root font size and inherits the project's typographic rhythm; px is a fixed pixel that ignores both.
- **Colors are oklch.** shadcn 4.x ships oklch in its `@theme` variables by default; the project's tokens already are. When you have to write a colour value (new token, gradient stop, shadow), it's `oklch(...)`, not `#rrggbb` and not `rgb(...)`. Hex never appears. If you're tempted to reach for an arbitrary `text-[#6b7280]`, the answer is a semantic token, not a hex literal.
- **"In passing" means in passing.** Editing a file with `[20px]` or `#6b7280` already in it: fix it while you're there. Don't introduce new ones; don't leave the old ones because they're not part of your task. The drift is what the skill exists to stop.

The only carve-out: third-party code, generated CSS, and external dependencies you don't own. Anything you author or edit is rem + oklch.

## Client/server boundary on UI files

On the Next.js App Router stack, any Base UI primitive with state (`Dialog`, `Popover`, `Tabs`, `Select`, controlled inputs) needs `'use client'`. That's expected. The discipline is around the _size_ of the client island:

- **Lift data fetching to the server component above** and pass plain data down. Don't reach for `useEffect` + `fetch` in a client island when the server can hand the data over already-resolved.
- **Keep the client island small.** A page that's mostly static with a few interactive widgets should be a server component that renders client components at the leaves, not a single `'use client'` page wrapping everything.
- **Server-only utilities stay on the server.** Importing a `'use server'` action into a client component is fine; importing the server-side data fetcher directly is not — that pulls the dependency tree into the client bundle.

This is one paragraph because shadcn-tailwind isn't a perf skill. The rule of thumb: if a file has `'use client'`, ask whether it earned the line.

## Before considering UI work done

A short self-check, run mentally before saying "done":

- [ ] Reached for composition (slots, sub-components) before adding a new prop on a wrapper.
- [ ] New variant lives in `components/ui/<name>.tsx` via `cva`, not jury-rigged in the consumer or hidden in a parallel wrapper.
- [ ] Base UI primitives are uncontrolled unless a parent genuinely needs to read or set the state.
- [ ] State-dependent styles use `data-[state=…]` / `data-[disabled]` selectors against Base UI's exposed attributes — not className-toggling in JS.
- [ ] `data-slot` used for parent-aware targeting (`has-[…]`, `[&_…]`) rather than fragile child-selector pierce.
- [ ] No `asChild` in components built on Base UI (use `render`); no `<div onClick>` wrapper around a Trigger.
- [ ] No raw color palette classes (`bg-red-500`, `text-zinc-700`) — replaced with semantic tokens or a justified extension to `globals.css`.
- [ ] Font-weight classes match what's declared in the project's `@theme` block. If using `font-medium`, verified `--font-weight-medium` exists.
- [ ] No `px` anywhere — arbitrary lengths are in rem (`[0.1875rem]` not `[3px]`). Existing px values fixed in passing.
- [ ] No `#hex` anywhere — colours via semantic tokens or `oklch(...)`. Existing hex fixed in passing.
- [ ] Arbitrary values are intentional, not first-reach. Tried the named utility first.
- [ ] No `dark:` overrides backfilling a missing semantic token.
- [ ] If the file has `'use client'`, the boundary earned its keep — data fetching is at the server level above; the island is as small as it can be.

## When implementing from a design

This skill is the always-on baseline. When the task is specifically _"implement this design"_ — Figma frame, mockup, design-token spec — invoke the `figma-to-tailwind-tokens` skill (or it'll fire automatically when you mention Figma). That skill has the deeper workflow: building the theme allowlist, property-by-property mapping, the "ask before snapping a near-miss" discipline. Treat this skill as the discipline that applies regardless; treat `figma-to-tailwind-tokens` as the procedure for design-translation tasks.

## When the stack assumptions don't hold

If the project is on Tailwind v3 (`tailwind.config.js` instead of CSS-first `@theme`) or shadcn 3.x (`@radix-ui/*` in deps, `asChild` in `src/components/ui/*`), the architecture discipline above still applies — composition over props, edit source not wrap, uncontrolled by default, `data-*` for state — only the syntax differs:

- v3: token system is in `tailwind.config.js`'s `theme.extend`, not `@theme`. Same "use the named utility" rule.
- shadcn 3.x: `asChild` is correct on Radix primitives; don't switch to `render`. Radix exposes the same `data-state` attributes Base UI does, so the styling-via-data-state guidance is unchanged.

Trust what's in the project. Verify by checking `package.json` (`tailwindcss` major version, `@radix-ui` vs `@base-ui-components` presence) when in doubt. This skill was written for the modern stack; if neither check fits, this skill probably isn't relevant and you can disregard.

## References

- Tailwind v4 theme: https://tailwindcss.com/docs/theme
- shadcn docs: https://ui.shadcn.com/docs
- shadcn CLI: https://ui.shadcn.com/docs/cli
- Base UI: https://base-ui.com
- Base UI composition (render prop): https://base-ui.com/react/handbook/composition
