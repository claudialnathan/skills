---
name: shadcn-tailwind
description: "This skill should be used for exact shadcn, Base UI, Radix, and Tailwind mechanics: detecting the installed stack; reading components.json aliases and registry targets; editing checked-in component source; choosing Base UI render versus Radix asChild; verifying state data attributes against installed types; resolving Tailwind v4 theme and utility generation; diagnosing arbitrary values, tailwind-merge conflicts, and classes that compile but do not render; and deciding controlled versus uncontrolled primitive wiring. It follows project configuration, resolved packages, installed source, types, compiler output, language-server diagnostics, and computed styles rather than remembered version labels or universal unit/color rules."
---

# shadcn and Tailwind mechanics

Apply the exact mechanics of the project’s installed shadcn, primitive, and
Tailwind stack. Do not infer Base UI, Radix, Tailwind v4, source placement,
state attributes, or CLI behavior from a version label alone.

## Detect the contract before writing

Inspect, in order:

1. repository instructions and the scoped worktree;
2. `components.json`, including style, aliases, registry namespaces, RSC
   setting, and resolved targets;
3. package manifest, lockfile, and package-manager-resolved installed versions;
4. CSS entry points, `@import`, `@theme`, `@theme inline`, `@config`, custom
   variants, and source detection;
5. imports in the component being changed;
6. installed primitive types and source for the exact part in use.

The reproduced installed contract outranks remembered release behavior.
Installed types/source outrank generic examples. Version-matched primary
documentation resolves only the decision-bearing gap left after local
evidence.

If `components.json` is absent, determine how checked-in component source is
owned and imported. Do not assume `components/ui`. Generated or copied source
is project code: edit its configured canonical file when that file owns the
mechanical fix. Preserve aliases and repair affected imports when a configured
target changes; a configuration edit does not move files.

## Read both Tailwind layers

For Tailwind v4, inspect the package/base import and the project’s CSS-first
theme. The project delta cannot be guessed:

- `--font-weight-*` may redefine or omit familiar steps;
- `--color-*`, `--text-*`, radius, shadow, and animation namespaces generate
  utilities from their actual names;
- each custom text size may need its paired
  `--text-*--line-height`;
- `@theme inline` changes variable resolution and whether a custom property is
  emitted for handwritten CSS;
- a legacy JavaScript config may still be active through `@config`;
- the dark-mode mechanism may be an explicit custom variant rather than the
  user’s color-scheme preference.

Use semantic project tokens where they express the role. A literal or arbitrary
value is not automatically wrong: it may be the clearest local exception.
Promote only a stable shared semantic role, and follow the repository’s actual
unit and color-space policy. Searches for `px`, hex, raw palette utilities, or
brackets are advisory until a project rule, compiler, type predicate, or
language-server diagnostic proves a violation.

Before keeping an arbitrary length, check the resolved Tailwind spacing and
radius namespaces. With the default dynamic spacing scale,
`min-h-[3.75rem]` can normalize to `min-h-15`, and fractional named utilities
can be valid. Keep brackets for genuine expressions and off-scale local values;
compose grid or `calc()` expressions from project tokens where that improves
traceability.

## Check the surfaces a dark theme's tokens do not reach

Theme tokens style the document; some surfaces are painted by the browser or the
OS and need their own declaration. Where the project ships a dark theme, verify
each against the rendered page in its actual dark state, not against the token
file:

- `color-scheme` set for the dark state on the document element, so form
  controls, scrollbars, and the canvas background follow the theme instead of
  the light default;
- `<meta name="theme-color">` resolved to the page background for the browser
  chrome that reads it, and kept in sync when the theme switches at runtime;
- native `<select>` given explicit `background-color` and `color` — Windows can
  render an unstyled select from OS colors, which lands dark-on-dark.

Establish what the project's own theme mechanism already emits before adding
any of these; a theme provider or document head may already own them.

## Verify generated utilities

A token name must generate the class the code uses:

- `--color-link` produces `text-link`; a differently named token produces a
  differently named utility;
- an `@theme inline` alias to an undefined variable can compile into a rule
  that paints nothing;
- duplicate declarations can silently make the last value win;
- a custom `--text-*` utility can conflict inside `cn()` when the project’s
  `tailwind-merge` configuration does not classify it as a font size.

Run the project’s official Tailwind language-server diagnostics over touched
class strings, including canonical-class suggestions. Compile the configured
CSS when generation is in doubt. Read computed styles and the winning rule when
a class exists but has no effect.

## Resolve Base UI versus Radix composition

Determine ownership from imports and installed packages.

### Base UI

Base UI composes with `render`. Preserve the primitive’s props, refs, focus,
keyboard, ARIA, portals, and lifecycle:

```tsx
<Dialog.Trigger render={<Button variant="outline" />}>Open</Dialog.Trigger>
```

Use the function form only when the rendered element depends on primitive
state. For a link rendered through a button-shaped Base UI owner, verify the
installed `nativeButton` contract rather than copying an example from memory.

### Radix

Radix composition uses `asChild`, and state commonly appears through valued
attributes such as `data-state="open"`. Do not rewrite valid Radix code into
Base UI syntax merely because another shadcn project uses Base UI.

### Other libraries

Third-party and application code can define its own `data-state` or composition
API. Identify the element owner before changing syntax. A dependency name
alone does not prove which component rendered the node.

## Verify state attributes part by part

For Base UI, read the exact part’s installed `*DataAttributes.d.ts` or
equivalent type/source. Popup, trigger, positioner, arrow, and root parts can
expose different attributes.

- Presence attributes such as `data-open`, `data-pressed`, or
  `data-disabled` use presence selectors when the installed part declares
  them.
- Valued attributes such as side or orientation use value selectors.
- Radix-style `data-[state=open]` is dead on a Base UI part that never emits
  `data-state`, but can be correct on Radix or application-owned markup.
- Mixed strings can hide dead selectors when a valid sibling selector happens
  to produce the same visual result.
- `data-slot` identifies a part for stable parent-aware targeting; it is not a
  state attribute.

Confirm the selector on the rendered node. A successful compile does not prove
the attribute can occur.

## Choose controlled wiring from behavior

Keep a primitive uncontrolled when no parent needs to read or set its state.
Use controlled props when coordination, URL/storage persistence, form
ownership, or another component genuinely requires parent control. Neither
shape is a universal default; the behavior contract decides.

Avoid class-name state branching when the primitive already exposes the state
needed for styling. Do not add ARIA or JavaScript state to compensate for an
unverified selector—first establish what the installed primitive already owns.

## Inspect registry and CLI behavior safely

Use the repository’s package manager and the installed or explicitly selected
shadcn CLI. Read current help/info before relying on a command or flag. When
supported, inspect registry items and diffs before writing. Respect configured
namespaces and item targets; components, blocks, hooks, libraries, fonts, and
configuration do not share one destination.

Do not assume an MCP server or network registry is available. After one
diagnosed bounded retry fails, use checked-in configuration, installed CLI
help, cached source, and current component code; mark registry-dependent claims
unverified.

## Verify before handoff

1. Run the repository’s focused type, lint, format, and test checks.
2. Run Tailwind language-server diagnostics on every touched Markdown or source
   class string.
3. Compile CSS or inspect generated rules for any token/utility claim.
4. Inspect computed styles for any “class did not take effect” claim.
5. Exercise the changed interaction with keyboard and pointer/touch paths that
   apply.
6. Inspect rendered state attributes on the actual primitive part.
7. Report installed evidence, static proof, rendered proof, and unverified
   claims separately.

For reviews, report `Location | Finding | Evidence | Proposed change | Proof`.
Do not invent a Before/After patch before the cause or authorization exists.
Use [`references/checklist.md`](references/checklist.md) as the literal
mechanics checklist.

## Sources

> This skill draws inspiration from publicly available content from [shadcn](https://ui.shadcn.com/), [Base UI](https://base-ui.com/), [Tailwind CSS](https://tailwindcss.com/), and [Vercel](https://vercel.com/).
