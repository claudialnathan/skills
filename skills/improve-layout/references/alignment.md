# Alignment diagnosis

Use the five alignment classifications in `SKILL.md`, then count the distinct edges, spines, and baselines on the surface. Check whether box alignment or text metrics make mathematically equal spacing look optically unequal.

Edges below are named **leading** and **trailing** — the edge the writing direction starts from, and the one it ends at. In a left-to-right locale the leading edge is the left one; under `dir="rtl"` it is the right. Naming the rule by direction rather than by side is what keeps each fix expressible as a logical property (`ms-*` / `ps-*` / `text-start`), so a corrected alignment mirrors instead of inverting.

Check two mechanics:

- **Invisible bounding boxes.** An icon or component can carry a consistent box larger than its visible mass. If box-based spacing looks off-center, correct to the visible form.
- **Text metrics are not the visible glyphs.** A line of text sits inside a line-box with leading above the cap height and below the baseline. Padding measured to the line-box top reads visibly larger than the same value on the sides. This is why baseline alignment drifts against variable-height content, and why title-led containers need their top padding trimmed.

## Recurring cases

| Symptom | Cause | Correction | Guard |
| :-- | :-- | :-- | :-- |
| Navigation elements appear aligned individually but not as a group | Logo, text, icons, controls, and avatars establish separate rules | Put icon and control centers on one shared spine and text on one shared leading edge | Keep only the distinct rules required by intentional regions |
| An icon-label button looks heavier on the icon side despite equal padding | The icon's bounding box is wider than its visible mass | Reduce padding on the icon side or increase it on the label side until the visible insets balance | Use logical padding so the correction mirrors under RTL |
| A title-led card looks top-heavy with equal padding | Leading above the visible cap height increases the apparent top inset | Trim block-start padding by the excess leading | If the browser floor supports `text-box-trim` / `text-box-edge`, verify it and retain the manual trim as fallback |
| A larger emphasized list row breaks the established edge | Its icon no longer shares the smaller icons' edge | Center all icons on one vertical spine and keep text on the shared leading edge | Preserve both shared rules instead of adding one for the emphasized row |
| A trailing accessory shifts between one- and two-line rows | Title-baseline alignment moves with the content height | Center the row contents on a horizontal spine | Test both one- and two-line content |
| One centered region interrupts a leading-edge layout | The region follows a different rule without a separate surface | Give it a distinct container, or align its contents to the page's leading edge | Do not leave an uncontained centered island inside the edge-aligned surface |
| Form headers, labels, fields, and selectors appear to start at different points | Some align to the input's inner text inset while controls use a baseline | Put the major elements on one leading edge and center controls on a horizontal spine | Include nearby navigation elements when counting competing rules |
| A correction works in LTR but reverses in RTL | It uses physical-side properties | Use logical utilities such as `ps-*`, `pe-*`, `ms-*`, `me-*`, and `text-start` | Verify the corrected surface under `dir="rtl"` |

## Applied examples

### Button icon

```tsx
{/* not equal px-3 on both sides — the icon's box makes it look off */}
<button className="inline-flex items-center gap-2 py-2 ps-2.5 pe-3.5">
  <Icon className="size-4" /> <span>Publish</span>
</button>
```

### Variable-height list accessory

```tsx
<li className="flex items-center justify-between gap-3">   {/* items-center, not a baseline */}
  <div><p className="font-medium">Auto Invest</p><p className="text-muted-foreground">Set up recurring buys</p></div>
  <span className="text-muted-foreground">Off</span>
</li>
```
