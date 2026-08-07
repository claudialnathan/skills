# Loading and performance forensics

Answering how fast a page is, and which part is slow. Contents: [get a cold load](#get-a-cold-load) · [vitals first](#vitals-first) · [the waterfall](#the-waterfall) · [images](#images) · [fonts](#fonts) · [jank](#jank) · [comparing two sites](#comparing-two-sites)

Reference snapshot: 2026-08-07, agent-browser 0.33.2.

## Get a cold load

Every loading measurement is invalid on a warm cache, and the default state of a browser that has already visited the page is warm. A second visit can report an LCP several times better than a first-time visitor will ever see.

Launch clean, navigate once, measure. `agent-browser open` with no URL gives a fresh context to stage against; `navigate` then produces the load being measured. Where a session has already been used, a new session is cheaper than reasoning about what is cached.

Say which conditions were measured. A number without its cache state, viewport, and whether the network was throttled is not comparable to anything, including itself on a later run. Run a load more than once before reporting a number as the page's: single-run variance on a real site is large enough to invert a comparison.

## Vitals first

`vitals` returns LCP, CLS, TTFB, FCP and INP plus a React hydration summary, as a small output. It is the cheapest thing that will tell you where to look, and it answers a surprising share of questions on its own.

Read it as a router:

- **TTFB dominant** — the problem is upstream of the browser. Server, redirect chain, or origin distance. Nothing in the page's own code will fix it, so stop looking there.
- **LCP far behind FCP** — something renders early and the main content does not. Find the LCP element itself before theorising; it is frequently not what anyone expects, and a hero image, a web font, and a client-fetched heading are three different fixes.
- **CLS non-trivial** — something is arriving without reserved space. Images without dimensions, fonts swapping, or content injected above the fold.
- **INP poor** — a loading problem only incidentally. It is main-thread work between an input and the next paint, and belongs with jank below.

`--json` gives the full structured payload when the summary is not enough. Take the summary first.

## The waterfall

`network har start`, load, `network har stop <path>`, then query the file. A HAR embeds text response bodies by default, which makes it large and makes it the single worst thing to paste into context — the point of writing it to disk is that it can be queried instead of read. `--content none` records sizes and headers only when bodies are not the question, and is much smaller.

`network requests --filter <pattern>` is the lighter alternative when the question is about a known subset rather than the whole load.

What the waterfall answers that a total does not: what blocks first paint, what is requested but unused, what is discovered late because it is referenced from a stylesheet or a script rather than the document, and what is serialised behind something else. A resource that is large is a smaller problem than a resource that is small and third in a dependency chain.

Watch for third-party origins in particular. On most real sites the difference between the site's own performance and what a visitor experiences is a handful of third-party requests, and separating them changes what the finding means.

## Images

The question "how fast do the images load on this site" is usually four separate questions, and the interesting answer is rarely the file size.

Read for each significant image: the format actually served, which may differ from the extension via content negotiation; the transferred size against the intrinsic dimensions against the displayed dimensions, since serving a 3000px image into a 400px slot is the most common real fault; whether `srcset` and `sizes` are present and whether the browser's chosen candidate is a sensible one; `loading`, and specifically whether anything above the fold is lazy-loaded, which delays the LCP it should be racing; `fetchpriority`; and whether width and height or an aspect ratio are set, which is the CLS question.

Also check discovery. An image referenced from CSS or set by script is discovered later than one in the markup, and a preload may exist to compensate. The gap between when a request could have started and when it did is often larger than any saving available from compressing it.

## Fonts

Fonts affect both LCP and CLS, and the mechanism is visible in the waterfall. Read which font files are requested, when they are discovered, whether they are preloaded, and what `font-display` is in force. A font discovered from a stylesheet that is itself render-blocking arrives late enough to move text twice.

`document.fonts` gives what actually resolved, which is how to tell a font that was requested from one that is being used.

## Jank

Stutter is a main-thread problem and needs a trace rather than a metric. `trace start`, reproduce the interaction, `trace stop <path>`, then read the file. `profiler start` / `stop` gives a CPU profile when the question is which function rather than which frame.

Both write to disk, which is what makes them affordable. Reproduce the specific interaction that stutters and nothing else — a trace of a whole session is mostly idle and the interesting fifty milliseconds are hard to find in it.

Test under conditions that resemble the complaint. An animation profiled on an empty page at full speed will not reproduce a stutter that only appears with a large list rendered and the main thread busy. Where the report is device-specific, emulation changes viewport and user agent but not the rendering engine or the CPU, so a clean local trace does not refute it.

## Comparing two sites

When the task is "why is theirs faster than ours", measure both the same way in the same session and report the delta rather than two independent verdicts. Same viewport, same cache state, same number of runs.

Compare the structure before the numbers. Two sites with similar totals can differ entirely in what blocks first paint, and the actionable finding is nearly always structural — what is discovered when, what is deferred, what is third-party — rather than a byte count. A site that is faster because it ships less of a feature is not a performance lesson, and saying so is more useful than the measurement.
</content>
