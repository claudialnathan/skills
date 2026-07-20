# shadcn + Tailwind v4 — pre-ship checklist

Work through this before reporting any UI change on this stack done, and when reviewing UI code. Each item's full reasoning lives in the `SKILL.md` sections above; this is the gate you run against.

- [ ] Existing pattern reused or its single source edited — no parallel component, no per-instance restyling of a shared primitive.
- [ ] New variants live in `components/ui/<name>.tsx` via `cva`; page-specific styling stayed in the consumer.
- [ ] Composition (slots, sub-components) before new props on a wrapper.
- [ ] Design values mapped to existing tokens and named utilities; off-scale values surfaced and approved, never silently minted.
- [ ] No bracket value that resolves to a named utility (fractional steps count: `size-2.75`, `p-7.5`); scale composed via `--spacing()` inside grid/calc expressions.
- [ ] rem + oklch in everything authored; px only in the named carve-outs; no hex anywhere.
- [ ] State styles use bare Base UI attributes (`data-open:`, `data-pressed:`); bracket form only for valued attributes; every `data-*` selector on a Base UI part checked against its `*DataAttributes.d.ts` — including ones already in the file, where a working `aria-*` or bare-attribute sibling can be masking a dead one.
- [ ] No `asChild` on Base UI — `render` used; links-as-buttons carry `nativeButton={false}`.
- [ ] Primitives uncontrolled unless a parent genuinely reads or sets the state.
- [ ] New or renamed tokens verified to generate their class; custom `--text-*` registered with tailwind-merge; paired line-heights set.
- [ ] `globals.css` untouched unless the token change was the task or was explicitly approved.
- [ ] The changed interaction was exercised before calling it done.
