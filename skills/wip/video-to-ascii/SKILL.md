---
name: video-to-ascii
description: "Turns a video or gif into a seamless, transparent-background ASCII animation shipped as text frame data plus a React component, rather than an exported image file. Measures glyph ink coverage in the destination font to build the density ramp, picks the loop window by centroid-registered frame comparison, and renders blank cells as genuinely empty so any background shows through. Use when asked to make ASCII art or an ASCII animation out of a clip, convert a video or gif into text or characters, build an ASCII hero, loader, or background loop for a site, reproduce an ascii-video effect, or when an existing ASCII export has a baked-in background, a visible jump where it loops, or a subject that renders hollow instead of solid."
---

# video-to-ascii

The deliverable is an array of text frames plus a component that swaps them, not an image file. **The attention shift: treat this as a typesetting problem measured against the destination font, not as an image-conversion problem.** Transparency, recolouring, and resolution-independence all follow from the output being text; each has to be fought for in a raster format.

Bundled: `scripts/find_loop.py`, `scripts/render_ascii.py`, `assets/AsciiLoop.tsx`. They need `ffmpeg`, `numpy`, and `Pillow`.

## Why text rather than a raster export

A GIF or WebP of the same loop runs roughly an order of magnitude larger, bakes in the colour, bakes in a background unless the format carries alpha, and fixes the resolution. Text frames gzip well because the glyph vocabulary is tiny and rows repeat. Compare the two before deciding — `render_ascii.py` prints the gzipped size of what it wrote.

Rasterise only when the destination cannot run a component (a design tool, an email, a README). When that is the ask, render the frames to PNGs with the same font and assemble with `ffmpeg`; expect the size penalty.

## Procedure

**1. Measure the destination font.** The ramp belongs to the font the page will use, so find that file first — check the project's `@font-face` sources, `public/fonts`, or the font repo it comes from.

    python3 scripts/render_ascii.py --font PATH.ttf --measure

Read the ceiling line for each palette. A palette whose densest glyph inks well under 100% of a full block cannot render a solid area, and a dark subject mapped into it will read as woven texture rather than mass. That is the palette choice: `ascii` for a subject that should read as made of type, `blocks` (which adds the U+2580 block range) when it should read as a silhouette. Confirm the block glyphs exist in the font before choosing `blocks` — the measure output says when they do not.

Do not order a ramp by the conventional `.:-=+*#%@` sequence without checking it against this table. That sequence is ordered by convention, and a glyph with large interior counters can sit at its dense end, which renders a solid subject as a field of rings.

**2. Find the loop.**

    python3 scripts/find_loop.py CLIP --work w

It compares every candidate window after registering each frame pair on the subject's centroid, so the score reflects pose rather than position, and reports the best starts and lengths. Take a diff near or below 0.01 as a clean seam. If nothing scores that low the clip has no repeating cycle; either the whole clip becomes the loop with a visible jump, or it needs a different source. Prefer the shortest window that scores well — one cycle of a repeating motion is a fraction of the payload of the full clip.

**3. Render, and look at it.**

    python3 scripts/render_ascii.py --work w --font PATH.ttf --palette ascii --preview

`--preview` prints frame 0. Read it before wiring anything up: a subject that is unrecognisable here will not improve in the browser. Knobs, and which symptom each one addresses, are in [references/tuning.md](references/tuning.md).

**4. Wire the component.** Copy `assets/AsciiLoop.tsx` into the project and pass it the JSON. It sizes itself to its container, pauses when scrolled offscreen, and renders one static frame under `prefers-reduced-motion`.

**5. Verify in a browser.** Confirm it animates rather than sitting on frame 0, watch the seam for a jump, and view it on both a light and a dark ground — the point of the format is that the background shows through, so check what shows through.

## What breaks it

- **`letter-spacing` other than `0`, or a non-monospaced family.** Either one shears the grid. The component sets `font-size` and `line-height` itself; a stylesheet that overrides them stretches the subject.
- **A fractional cell width.** Block glyphs tile against their neighbours, so a cell landing on a fractional pixel leaves hairline seams through a solid area. The component floors the cell to whole pixels in fit-to-width mode, which costs up to `cols - 1` pixels of slack at the right edge.
- **The frame text reaching a screen reader.** Thousands of punctuation characters, replaced many times a second. Put `role="img"` and a label on the wrapper and `aria-hidden` on the element holding the text.
- **A static JSON import on a critical path.** It bundles into the JS. `fetch` it and pass it as a prop when it should not block first paint.
- **Per-frame React state.** Re-rendering at the frame rate is unnecessary work; assign to the element's `textContent` through a ref instead.

## Choosing the grid

Column count is the quality-versus-payload dial; the row count follows from the crop's aspect and the cell aspect, so set columns only. Render two or three widths and compare the gzipped sizes against the previews rather than guessing. The `--aspect` value is baked into the data as cell width over cell height, and the component reproduces it by measuring the font's advance at runtime and setting `line-height` to match — so the data stays correct even if the family changes.

## Sources

> This skill draws inspiration from publicly available content from [FFmpeg](https://ffmpeg.org) and [Pillow](https://python-pillow.org).
