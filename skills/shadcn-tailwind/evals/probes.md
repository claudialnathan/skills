# shadcn-tailwind — earning-failure probes

Runnable re-test fixtures. Each probe runs in a **fresh unaided session** (`claude --safe-mode` — this skill auto-loads on UI paths) inside a scratch project on the modern stack: shadcn 4.x on Base UI (`@base-ui/react` in deps), Tailwind v4 with an `@theme` block in `globals.css`. Grade the code; probe 5 grades the transcript.

**Deletion rule: all probes must pass unaided.**

---

## Probe 1 — variant belongs in the source

**Prompt:** "We need a success (green) style for our buttons."

- **Failure signature:** a `SuccessButton` wrapper component, or green classNames pasted at the call site.
- **Pass criterion:** `success` variant added to `cva` in `components/ui/button.tsx`, using semantic tokens (`bg-success` proposed as a token if absent — not `bg-green-500`).

## Probe 2 — `render`, not `asChild`

**Prompt:** "Make the dialog trigger render as our styled Button component."

- **Failure signature:** `<Dialog.Trigger asChild>` — the Radix idiom, which type-checks but misbehaves on Base UI.
- **Pass criterion:** `<Dialog.Trigger render={<Button …/>} />`.

## Probe 3 — uncontrolled by default

**Prompt:** "Add a delete-confirmation dialog to this row's dropdown menu."

- **Failure signature:** `useState` + `open`/`onOpenChange` when nothing outside the dialog reads the state.
- **Pass criterion:** uncontrolled `Dialog.Root` (state lifted only if the implementation genuinely coordinates with a parent — and then says why).

## Probe 4 — spec values map to tokens

**Prompt:** "Designer spec for this label: 13px, color #6b7280."

- **Failure signature:** `text-[13px] text-[#6b7280]` — px and hex written verbatim.
- **Pass criterion:** proposes the token mapping first (`text-caption` / `text-muted-foreground` or the project's equivalents); if none fits, rem + oklch with the named-utility check.

## Probe 5 — reads `@theme` before writing

**Prompt:** "Style this card to match the rest of the app."

- **Failure signature (transcript):** classNames written without ever opening `globals.css`; invented values or assumed `font-medium` exists.
- **Pass criterion (transcript):** opens the `@theme` block first, uses tokens found there.

## Probe 6 — bare data attributes, not `data-[state=…]`

**Prompt:** "Animate this popover's open and close."

- **Failure signature:** `data-[state=open]:` / `data-[state=closed]:` selectors — the Radix idiom, which matches nothing on Base UI primitives; the animation silently never runs.
- **Pass criterion:** `data-open:` / `data-closed:` (or `data-starting-style` / `data-ending-style` transitions). Valued attributes like `data-[side=top]` may keep the bracket form.

## Probe 7 — edit the shared source, not the call sites

**Prompt:** "Cards across the app need softer shadows and more padding."

- **Failure signature:** per-call-site classNames, a wrapper component, or a second Card implementation.
- **Pass criterion:** edits `components/ui/card.tsx` once (token-based values), letting the change cascade.

## Probe 8 — verify `data-*` selectors against the installed `.d.ts`

**Fixture addition:** `components/ui/toggle.tsx` importing `@base-ui/react/toggle`, its className carrying both `data-[state=on]:bg-muted` and a redundant `aria-pressed:bg-muted`; `node_modules/@base-ui/react/toggle/ToggleDataAttributes.d.ts` present, declaring only `data-pressed` and `data-disabled`.

**Prompt:** "Review `components/ui/toggle.tsx` — is the pressed-state styling correct?"

- **Failure signature:** calls the file correct (the `aria-pressed:` sibling makes it look right), or renders a verdict on `data-[state=on]:` — either way — from memory of the Base UI pattern, without reading the installed `*DataAttributes.d.ts`. The right answer by the wrong route fails: the earning incident is asserting from recall instead of source.
- **Pass criterion:** reads `ToggleDataAttributes.d.ts`, cites it, and identifies `data-[state=on]:` as dead CSS masked by the redundant `aria-pressed:` sibling.

---

## Baseline verdicts

| Probe | Opus 4.8 | 2026-07-05, Fable 5 |
| :--- | :--- | :--- |
| 1 variant in source | not yet run | **absorbed** (oklch token proposed + cva edit in source, destructive-pattern-matched) |
| 2 render prop | not yet run | **absorbed** (`render=` with explicit Base-UI-not-Radix reasoning; caveat — fixture contained a `render=` exemplar it cited, so partly in-context learning) |
| 3 uncontrolled | not yet run | passed (controlled, but genuinely justified: menu-item unmount forces lifted `deleteTarget`; reason stated) |
| 4 token mapping | not yet run | **failed — earning** (wrote `text-[13px] text-[#6b7280]` verbatim "matching the spec exactly", offered the token mapping only second) |
| 5 theme first | not yet run | **absorbed** (read `@theme`, used `text-caption` / `font-semi` 550 / `bg-card`, cited sibling usage) |
| 6 bare data attributes | not yet run | not yet run |
| 7 edit the shared source | not yet run | not yet run |
| 8 verify against `.d.ts` | not yet run | **failed — earning** (production session, not a clean-room run: judged `data-*` selectors from memory twice; reading the installed `.d.ts` required direct confrontation both times) |

No unaided baseline was recorded at authoring (2026-06-17).

Run log — 2026-07-05 (Fable 5, v2.1.201): `claude --safe-mode --model fable --max-turns 12 -p`, scratch fixture, n=1 per probe. Verdict: **KEPT, major shrink candidate** — 4/5 passing; the earning leg is px/hex discipline under explicit designer-spec pressure (the skill's hard rule). Prediction inverted: the currency claim (probe 2) fell first, the discipline claim (probe 4) held. Re-run 4 at n≥2 before shrinking.

Probe additions — 2026-07-11: probes 6–7 added with the SKILL.md revision (bare-data-attribute idiom; edit-the-shared-source); fixture dep corrected to `@base-ui/react`. No runs yet; probe 4's n≥2 re-run still pending.

Probe addition — 2026-07-13: probe 8 added from two confirmed dead-selector bugs in a production repo (toggle `data-[state=on]:` masked by `aria-pressed:`; tooltip `data-[state=delayed-open]:` beside correct `data-open:`/`data-closed:`). Its Fable 5 baseline verdict is from that production session, not a `--safe-mode` clean run — replace with a clean-room run before using it in a deletion decision.
