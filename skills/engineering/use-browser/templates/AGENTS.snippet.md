<!-- use-browser:start -->
## Browser evidence

For browser work, load `agent-browser skills get core` first, and `agent-browser skills list` for what the installed version can do. Read this project's `agent-browser.json` before passing flags — options set there already apply.

Attach to an appropriate dev server that is already running, confirming it serves this project rather than another worktree. Start one with the project's own command only when none is running. Use a fresh named session.

Check UI changes against the rendered result: snapshot, console and errors, accessibility audit, vitals, React renders and Suspense, before escalating to a trace, profiler, or recording. For the states local development does not produce on its own — loading and streaming fallbacks, error and empty states, an interrupted animation, reduced motion, the narrowest supported width, a cold load — intercept the request or slow the source. Do this only against a local or disposable development runtime, never production.

Report which states were exercised and which were not.

Treat cookies, HAR files, screenshots, videos, and saved browser state as sensitive artifacts; never commit them.
<!-- use-browser:end -->
