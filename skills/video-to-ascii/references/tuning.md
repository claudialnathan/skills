# Tuning

Every flag below belongs to `scripts/render_ascii.py` unless stated otherwise. Change one at a time and reread `--preview`.

## Flags by symptom

| Symptom | Flag | What it does |
| :--- | :--- | :--- |
| Subject unrecognisable; details lost | `--cols` | More columns, more detail, larger payload. Rows follow automatically. |
| Interior flat and featureless | `--gamma` below 1 | Expands the dense end, so variation inside a dark mass survives. |
| Speckle in the background | `--floor` up | Density below the floor becomes a blank cell. |
| Subject looks eaten away at its edges | `--floor` down | The falloff is being cut too early. |
| Subject reads hollow, like rings | `--palette blocks` | The ASCII ceiling is too low for a solid mass. Check `--measure` first. |
| Subject too bold, type not visible | `--palette ascii` | Removes the block glyphs. |
| Vertically squashed or stretched | `--aspect` | Cell width over cell height. Must match what the component reproduces. |
| Subject cropped at an edge | `--pad` | Padding around the union bounding box, in analysis pixels. |

## Cell aspect

`--aspect` defaults to `0.6`, close to a monospaced advance against a line-height near `1`. It is a free choice as long as the data and the rendering agree: the number is written into the JSON, and the component reads it back, measures the font's real advance, and sets `line-height` to `advance / aspect`. Lower values mean taller cells and fewer rows for the same columns.

## Palettes

Defined at the top of `render_ascii.py`:

- `ascii` — printable ASCII only.
- `blocks` — ASCII plus U+2591 through U+2588, so the ramp reaches a full cell.
- `solid` — the block range and a space. Fewest levels, smallest payload, no typographic texture.

Editing a palette is a one-line change. Each cell is then mapped to whichever glyph in the set has the nearest measured coverage, so a set with uneven spacing still maps correctly — there is no requirement that the characters be evenly spaced in density, only that the set is measured.

Adding many glyphs of near-identical coverage adds texture but costs compression, because it raises the entropy of the frame text without changing what the eye reads. Check the gzipped figure after widening a palette.

## Stabilisation

`render_ascii.py` fits a straight line to the subject's centroid across the loop window and subtracts only that. Camera drift is removed while the subject's own motion is kept, and the first and last frames end up registered against each other, which is what keeps the seam closed. A clip where the subject genuinely traverses the frame will therefore be re-centred; if the traverse is the point, skip the loop search and use the whole clip.

The crop is the union bounding box of the subject across every frame of the window, so the subject never leaves the grid.

## Polarity

Both scripts detect whether the subject is darker or lighter than its background by taking the modal pixel level as the background, then comparing how much mass sits either side of it. Light-subject-on-dark clips work without any flag. A clip with no dominant background level — a busy scene rather than a subject on a plain ground — breaks this assumption, and the density mapping will key off the wrong level.

## Frame rate

`--fps` is written into the JSON as the playback rate and does not resample the frames; the loop keeps whatever frames `find_loop.py` selected. To cut the payload, drop the frame count by taking every second frame from a longer window rather than lowering this number.

## Rasterising

When the destination cannot run a component, render each frame to a transparent PNG with the same font, then assemble. GIF carries only 1-bit alpha, so antialiased glyph edges have to be thresholded and will look harder than the component does; animated WebP carries a full alpha channel and generally looks closer, where the destination reads it.
