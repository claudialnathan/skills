#!/usr/bin/env python3
"""Extract frames from a clip and score every candidate loop window.

Frames are compared after registering each pair on the subject's centroid, so the
score reflects pose similarity rather than where the subject sits in frame.

    python3 find_loop.py CLIP [--work DIR] [--min 8] [--max 48]
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ANALYSIS_WIDTH = 352


def extract(src, work):
    raw = os.path.join(work, "raw")
    if os.path.isdir(raw) and os.listdir(raw):
        return raw
    os.makedirs(raw, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-i", src, "-vf",
         f"scale='min({ANALYSIS_WIDTH},iw)':-2:flags=area,format=gray",
         os.path.join(raw, "f%04d.png")],
        check=True,
    )
    return raw


def load(raw):
    files = sorted(os.listdir(raw))
    if not files:
        sys.exit(f"no frames extracted into {raw}")
    return np.stack([np.asarray(Image.open(os.path.join(raw, f)), dtype=np.float32)
                     for f in files])


def separate(frames):
    """Return (ink 0..1, background level, 'dark' or 'light' subject)."""
    hist = np.bincount(frames.astype(np.uint8).ravel(), minlength=256)
    bg = float(np.argmax(hist))
    dark = float(np.clip(bg - frames, 0, None).mean())
    light = float(np.clip(frames - bg, 0, None).mean())
    if dark >= light:
        return np.clip((bg - frames) / max(bg, 1.0), 0, 1), bg, "dark"
    return np.clip((frames - bg) / max(255.0 - bg, 1.0), 0, 1), bg, "light"


def centroids(ink, threshold=0.35):
    strong = np.where(ink > threshold, ink, 0.0)
    mass = strong.sum(axis=(1, 2))
    if (mass == 0).any():
        sys.exit("some frames have no subject above threshold; try a different clip")
    n, h, w = ink.shape
    cx = (strong * np.arange(w)[None, None, :]).sum(axis=(1, 2)) / mass
    cy = (strong * np.arange(h)[None, :, None]).sum(axis=(1, 2)) / mass
    return cx, cy


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("clip")
    ap.add_argument("--work", default="ascii-work")
    ap.add_argument("--min", type=int, default=8, dest="lo")
    ap.add_argument("--max", type=int, default=48, dest="hi")
    ap.add_argument("--top", type=int, default=10)
    args = ap.parse_args()

    os.makedirs(args.work, exist_ok=True)
    raw = extract(args.clip, args.work)
    frames = load(raw)
    n, h, w = frames.shape
    ink, bg, polarity = separate(frames)
    cx, cy = centroids(ink)
    print(f"{n} frames at {w}x{h}; background level {bg:.0f}; {polarity} subject")
    print(f"subject drift: x {cx.max()-cx.min():.1f}px, y {cy.max()-cy.min():.1f}px")

    def pose_diff(i, j):
        shifted = np.roll(np.roll(ink[j], int(round(cy[i] - cy[j])), axis=0),
                          int(round(cx[i] - cx[j])), axis=1)
        return float(np.abs(ink[i] - shifted).mean())

    hi = min(args.hi, n - 3)
    if hi < args.lo:
        sys.exit(f"clip too short: {n} frames cannot hold a {args.lo}-frame loop")

    scored = []
    for length in range(args.lo, hi + 1):
        for start in range(0, n - length - 1):
            # the seam is last->first; the following pair keeps velocity continuous
            d = pose_diff(start, start + length) + pose_diff(start + 1, start + length + 1)
            scored.append((d / 2, start, length))
    scored.sort()

    print(f"\n{'diff':>9}  {'start':>5}  {'len':>4}  seconds at 24fps")
    for d, start, length in scored[: args.top]:
        print(f"{d:9.5f}  {start:5d}  {length:4d}  {length / 24:.2f}s")

    best = scored[0]
    json.dump({"frames": n, "width": w, "height": h, "background": bg,
               "polarity": polarity, "start": best[1], "length": best[2],
               "diff": best[0]},
              open(os.path.join(args.work, "loop.json"), "w"), indent=2)
    print(f"\nwrote {os.path.join(args.work, 'loop.json')}")
    print("A diff near or below 0.01 is a clean seam. If the best score is much higher, "
          "the clip has no repeating cycle and needs a different source.")


if __name__ == "__main__":
    main()
