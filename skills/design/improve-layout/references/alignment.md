# Alignment — the "feels-off" scenarios and their fixes

Alignment work is diagnosis before correction. When something reads as unresolved, count the invisible rules first — every distinct edge, spine, and baseline the elements answer to — then find the spacing that is mathematically equal but optically wrong. The five methods and three principles are in SKILL.md; this file is the recurring patterns where they break, each as symptom → fix.

Two mechanics underlie most of them:

- **Invisible bounding boxes.** Icons — and many components — carry a consistent, invisible box larger than their visible mass. Space them by the box and the visible shape looks off-center. Correct to the visible form, not the box.
- **Text metrics are not the visible glyphs.** A line of text sits inside a line-box with leading above the cap height and below the baseline. Padding measured to the line-box top reads visibly larger than the same value on the sides. This is why baseline alignment drifts against variable-height content, and why title-led containers need their top padding trimmed.

## Navigation — collapse the rule count

Nav bars accumulate elements that each want their own alignment: a logo, section headers, page icons, controls, avatars. Left unmanaged, each establishes its own edge or spine, and the bar reads as busy and faintly misaligned even when every element is "aligned to something."

**Fix**: reduce to the fewest rules that still read as intentional. Put icon and control *centers* on one shared spine — they differ in shape, so an edge will not do — and put text on one shared left edge. Items of different sizes then read as aligned because they share a spine or an edge, not because their boxes match.

## Button icons — optical, not mathematical, padding

An icon + label button spaced with equal (mathematical) padding looks unbalanced: the icon's invisible bounding box is wider than its visible glyph, so the visible icon sits too far from the label and the leading edge looks heavy.

**Fix**: nudge optically. Reduce the padding on the icon side (or add a touch on the label side) until the *visible* icon reads as evenly inset. Trust the eye over the equal numbers — the corrected values are deliberately unequal.

```tsx
{/* not equal px-3 on both sides — the icon's box makes it look off */}
<button className="inline-flex items-center gap-2 py-2 pl-2.5 pr-3.5">
  <Icon className="size-4" /> <span>Publish</span>
</button>
```

## Containers — trim the top padding

A card or panel with equal padding on all sides looks top-heavy when its first child is a title. The title's line-box adds leading above the cap height, so the visible gap above the title is larger than the equal gap on the sides — the button problem at container scale.

**Fix**: trim the top padding so the title's *visible* top sits at the same optical inset as the sides. The exact trim depends on the font's line-height; start by shaving roughly the leading and adjust by eye. `text-box-trim` / `text-box-edge` (where the browser floor allows) removes the leading at the source and can make equal padding correct again — verify support and keep the manual trim as the fallback.

## Content lists — three recurring cases

### Emphasized row breaks the edge

A list aligned to a left edge gains an emphasized row — larger icon, heavier text. Under pure edge alignment its larger icon and text no longer sit on the rule the other rows establish, so the row looks misaligned rather than emphasized.

**Fix**: give the icons a vertical spine (align centers) and keep the text on the left edge. The emphasized row's larger icon centers on the same spine; its text still starts on the same edge. Two rules, both shared — the row reads as bigger, not broken.

### Accessories baseline-aligned against variable content

Trailing accessories — a status label, a disclosure chevron — aligned to the baseline of the row's title look balanced only while every row is one line. As soon as rows vary between one and two lines, baseline alignment lands the accessory in a different vertical spot per row and the column reads as unsettled.

**Fix**: align everything in the row to a horizontal spine (vertical centers) instead of the baseline. The accessory then sits centered regardless of one or two lines of content.

```tsx
<li className="flex items-center justify-between gap-3">   {/* items-center, not a baseline */}
  <div><p className="font-medium">Auto Invest</p><p className="text-muted-foreground">Set up recurring buys</p></div>
  <span className="text-muted-foreground">Off</span>
</li>
```

### One region centered inside a left-edge layout

A list mostly aligned to the left edge contains one region that is axis-aligned (centered) — a points total, a stat block. The lone centered block jumps out and reads as unresolved, because it answers to a different rule than everything around it.

**Fix**, either: (a) give the centered region its own container — a border or a background — so the change of alignment reads as a deliberate, separate surface; or (b) switch it to a component that respects the left edge and drop the centering. Do not leave a centered island inside an edge-aligned page.

## Forms — one left edge, controls on a spine

A form where the page header aligns to the text *inside* the inputs, and the field selectors align to a baseline, looks unbalanced — especially with a nav icon nearby pulling a competing edge.

**Fix**: align all the major elements — header, labels, inputs — to one shared left edge, and align the form controls to a horizontal spine (centers). The page stops answering to the incidental text-inset and control-baseline rules and reads as one column.

## Anti-patterns

- Spacing an icon by its invisible bounding box instead of its visible mass — optically off-center; nudge it.
- Equal padding on a title-led container — the top reads heavy; trim it (or `text-box-trim`).
- Baseline-aligning accessories in a list whose rows vary in height — switch to a center spine.
- A lone center-aligned region inside an edge-aligned layout — contain it, or re-align it.
- Adding a third or fourth alignment rule to a screen that already reads fine on one — every invisible rule costs; stop at the fewest that work.
- "Fixing" alignment by making everything mathematically equal — equal is the starting guess, balanced is the goal.
