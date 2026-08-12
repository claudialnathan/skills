"use client";

import { useEffect, useRef } from "react";

export type AsciiFrames = {
  cols: number;
  rows: number;
  fps: number;
  aspect: number;
  frames: string[];
};

export type AsciiLoopProps = {
  data: AsciiFrames;
  color?: string;
  fps?: number;
  fontSize?: number;
  paused?: boolean;
  label: string;
  className?: string;
};

export function AsciiLoop({
  data,
  color = "currentColor",
  fps,
  fontSize,
  paused = false,
  label,
  className,
}: AsciiLoopProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const rate = fps ?? data.fps;

  useEffect(() => {
    const host = hostRef.current;
    const pre = preRef.current;
    if (!host || !pre) return;

    let advance = 0.6;

    const measure = () => {
      const probe = document.createElement("span");
      const cs = getComputedStyle(pre);
      probe.style.cssText =
        "position:absolute;visibility:hidden;white-space:pre;letter-spacing:0";
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontWeight = cs.fontWeight;
      probe.style.fontSize = "100px";
      probe.textContent = "0".repeat(50);
      document.body.appendChild(probe);
      const w = probe.getBoundingClientRect().width / 50 / 100;
      probe.remove();
      if (w > 0) advance = w;
    };

    const layout = () => {
      const cell = fontSize
        ? fontSize * advance
        : Math.max(1, Math.floor(host.clientWidth / data.cols));
      pre.style.fontSize = `${cell / advance}px`;
      pre.style.lineHeight = `${Math.round(cell / data.aspect)}px`;
    };

    const remeasure = () => {
      measure();
      layout();
    };

    remeasure();
    document.fonts?.ready.then(remeasure);

    const ro = new ResizeObserver(layout);
    ro.observe(host);
    return () => ro.disconnect();
  }, [data, fontSize]);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;
    pre.textContent = data.frames[0];

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let running = false;
    let index = 0;
    let acc = 0;
    let last = 0;
    let onScreen = true;

    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      if (!last) last = t;
      const dt = t - last;
      last = t;
      if (!onScreen || paused) return;
      acc += dt;
      const spf = 1000 / rate;
      if (acc < spf) return;
      index = (index + Math.floor(acc / spf)) % data.frames.length;
      acc %= spf;
      pre.textContent = data.frames[index];
    };

    const start = () => {
      if (running || reduce.matches) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };
    const onReduceChange = () => (reduce.matches ? stop() : start());

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        last = 0;
      },
      { rootMargin: "128px" },
    );
    io.observe(pre);
    reduce.addEventListener("change", onReduceChange);
    start();

    return () => {
      stop();
      io.disconnect();
      reduce.removeEventListener("change", onReduceChange);
    };
  }, [data, rate, paused]);

  return (
    <div ref={hostRef} className={className} role="img" aria-label={label}>
      <pre
        ref={preRef}
        aria-hidden="true"
        style={{
          margin: 0,
          color,
          whiteSpace: "pre",
          letterSpacing: 0,
          fontFamily: "inherit",
          userSelect: "none",
        }}
      />
    </div>
  );
}
