#!/usr/bin/env python3
"""Render a loop window as ASCII frame data, using glyph coverage measured in the
font the page will actually use.

    python3 render_ascii.py --font FONT.ttf --measure
    python3 render_ascii.py --font FONT.ttf --start 16 --length 29 --cols 150
"""
import argparse
import gzip
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

PALETTES = {
    "ascii": " .':-=+*#%&$8BWM",
    "blocks": " .':-=+*#░▒▓█",
    "solid": " ░▒▓█",
}


def advance_ratio(font_path):
    return ImageFont.truetype(font_path, 1000).getlength("0") / 1000.0


MISSING_PROBE = chr(0xE000)  # private use; renders as the font's .notdef


def raw_coverage(font_path, chars, aspect):
    size = 48
    cw = advance_ratio(font_path) * size
    ch = cw / aspect
    font = ImageFont.truetype(font_path, size)
    out = {}
    for c in dict.fromkeys(chars):
        im = Image.new("L", (max(1, int(cw * 2)), max(1, int(ch * 2))), 0)
        ImageDraw.Draw(im).text((cw * 0.5, ch * 0.4), c, font=font, fill=255)
        out[c] = float(np.asarray(im, dtype=np.float32).mean())
    return out


def coverage(font_path, chars, aspect):
    """Per-glyph ink, normalised to the densest glyph in the set (this drives the LUT)."""
    out = raw_coverage(font_path, chars, aspect)
    top = max(out.values())
    if top <= 0:
        sys.exit("no glyph in the palette inked anything; wrong font file?")
    return {c: v / top for c, v in out.items()}, top


def solid_reference(font_path, aspect):
    """Raw ink of a full block, or None when the font has no block glyph."""
    probe = raw_coverage(font_path, ["█", MISSING_PROBE], aspect)
    block, notdef = probe["█"], probe[MISSING_PROBE]
    if block <= 0 or abs(block - notdef) < 1e-6:
        return None
    return block


def solid_fraction(top, reference):
    return None if not reference else top / reference


def build_lut(cov, levels=256):
    chars = list(cov)
    return [min(chars, key=lambda c: abs(cov[c] - i / (levels - 1))) for i in range(levels)]


def separate(frames):
    hist = np.bincount(frames.astype(np.uint8).ravel(), minlength=256)
    bg = float(np.argmax(hist))
    dark = float(np.clip(bg - frames, 0, None).mean())
    light = float(np.clip(frames - bg, 0, None).mean())
    if dark >= light:
        return np.clip((bg - frames) / max(bg, 1.0), 0, 1), bg, True
    return np.clip((frames - bg) / max(255.0 - bg, 1.0), 0, 1), bg, False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", default="ascii-work")
    ap.add_argument("--font", required=True)
    ap.add_argument("--start", type=int)
    ap.add_argument("--length", type=int)
    ap.add_argument("--cols", type=int, default=150)
    ap.add_argument("--aspect", type=float, default=0.6,
                    help="cell width / cell height baked into the data")
    ap.add_argument("--palette", default="ascii", choices=sorted(PALETTES))
    ap.add_argument("--gamma", type=float, default=1.0)
    ap.add_argument("--floor", type=float, default=0.10,
                    help="density below this becomes a blank cell")
    ap.add_argument("--pad", type=int, default=6, help="crop padding, analysis pixels")
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--out", default="ascii-out")
    ap.add_argument("--name", default="loop")
    ap.add_argument("--measure", action="store_true",
                    help="print the coverage table for every palette and exit")
    ap.add_argument("--preview", action="store_true", help="print frame 0 to stdout")
    args = ap.parse_args()

    if args.measure:
        print(f"advance ratio: {advance_ratio(args.font):.4f} em")
        reference = solid_reference(args.font, args.aspect)
        if reference is None:
            print("no block glyph in this font; solid fills are unavailable")
        print()
        for name, chars in sorted(PALETTES.items()):
            cov, top = coverage(args.font, chars, args.aspect)
            ranked = sorted(cov.items(), key=lambda kv: kv[1])
            frac = solid_fraction(top, reference)
            headline = f"{name}: {len(cov)} levels"
            if frac is not None:
                headline += f", densest glyph inks {frac * 100:.0f}% of a full block"
            print(headline)
            print("  " + "  ".join(f"{c or 'sp'}={v:.2f}" for c, v in ranked) + "\n")
        print("Values are relative to the densest glyph in each palette; that is what "
              "drives the mapping. The percentage is the absolute ceiling: a palette "
              "that tops out well below 100% cannot render a solid mass.")
        return

    if args.start is None or args.length is None:
        loop_path = os.path.join(args.work, "loop.json")
        if not os.path.exists(loop_path):
            sys.exit("pass --start/--length, or run find_loop.py first")
        loop = json.load(open(loop_path))
        args.start = loop["start"] if args.start is None else args.start
        args.length = loop["length"] if args.length is None else args.length

    raw = os.path.join(args.work, "raw")
    files = sorted(os.listdir(raw))[args.start:args.start + args.length]
    if len(files) < args.length:
        sys.exit(f"only {len(files)} frames available from index {args.start}")
    imgs = [Image.open(os.path.join(raw, f)).convert("L") for f in files]
    w, h = imgs[0].size

    arr = np.stack([np.asarray(i, dtype=np.float32) for i in imgs])
    ink, bg, subject_is_dark = separate(arr)
    fill = 255 if subject_is_dark else 0

    strong = np.where(ink > 0.35, ink, 0.0)
    mass = strong.sum(axis=(1, 2))
    cx = (strong * np.arange(w)[None, None, :]).sum(axis=(1, 2)) / mass
    cy = (strong * np.arange(h)[None, :, None]).sum(axis=(1, 2)) / mass

    # Remove only the linear trend: camera drift goes, the subject's own bounce stays,
    # and the first and last frames end up registered against each other.
    t = np.arange(args.length)
    dx = np.polyval(np.polyfit(t, cx, 1), 0) - np.polyval(np.polyfit(t, cx, 1), t)
    dy = np.polyval(np.polyfit(t, cy, 1), 0) - np.polyval(np.polyfit(t, cy, 1), t)
    shifted = [im.transform((w, h), Image.AFFINE, (1, 0, -sx, 0, 1, -sy),
                            resample=Image.BICUBIC, fillcolor=fill)
               for im, sx, sy in zip(imgs, dx, dy)]

    sa = np.stack([np.asarray(s, dtype=np.float32) for s in shifted])
    si, _, _ = separate(sa)
    mask = si > 0.30
    ys, xs = np.where(mask.any(axis=0))
    x0, x1 = max(0, xs.min() - args.pad), min(w, xs.max() + 1 + args.pad)
    y0, y1 = max(0, ys.min() - args.pad), min(h, ys.max() + 1 + args.pad)
    crop_w, crop_h = x1 - x0, y1 - y0
    rows = max(1, round(crop_h / crop_w * args.cols * args.aspect))

    cov, top = coverage(args.font, PALETTES[args.palette], args.aspect)
    lut = build_lut(cov)

    frames = []
    for s in shifted:
        cell = s.crop((x0, y0, x1, y1)).resize((args.cols, rows), Image.BOX)
        v = np.asarray(cell, dtype=np.float32)
        if subject_is_dark:
            d = np.clip((bg - v) / max(bg, 1.0), 0, 1)
        else:
            d = np.clip((v - bg) / max(255.0 - bg, 1.0), 0, 1)
        d = d ** args.gamma
        d = np.where(d < args.floor, 0.0, (d - args.floor) / (1 - args.floor))
        idx = np.clip((d * 255 + 0.5).astype(int), 0, 255)
        frames.append("\n".join("".join(lut[k] for k in row).rstrip() for row in idx))

    os.makedirs(args.out, exist_ok=True)
    data = {"cols": args.cols, "rows": rows, "fps": args.fps, "aspect": args.aspect,
            "palette": args.palette, "frames": frames}
    blob = json.dumps(data, separators=(",", ":"))
    path = os.path.join(args.out, f"{args.name}-{args.palette}.json")
    open(path, "w").write(blob)

    print(f"grid {args.cols}x{rows}, {len(frames)} frames, palette {args.palette}")
    frac = solid_fraction(top, solid_reference(args.font, args.aspect))
    if frac is not None:
        print(f"densest glyph in this palette inks {frac * 100:.0f}% of a full block")
    print(f"{path}: {len(blob) / 1024:.1f} KB raw, "
          f"{len(gzip.compress(blob.encode(), 9)) / 1024:.1f} KB gzipped")
    if args.preview:
        print("\n" + frames[0])


if __name__ == "__main__":
    main()
