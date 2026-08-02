# Quality audit dimensions

Apply only dimensions proven relevant by repository evidence. Each finding
records evidence status, location, impact, reach, confidence, proposed action,
and proof. Static suspicion remains inferred until runtime or system evidence
reproduces its consequence.

## A. Correctness and tooling

- Run project-owned format, lint, type, test, build, generation, and migration
  checks against the correct workspace.
- Distinguish introduced failures from pre-existing debt only when an exact
  diff, stable diagnostic, or baseline proves it.
- Grade by effect: a build command can fail because the wrong target was used;
  a lint diagnostic can reveal a release blocker. Category alone sets neither
  severity.
- Report missing, unsupported, timed-out, and unrun checks separately.

## B. Next.js and framework behavior

- Resolve router, Next.js version, configuration, cache features, and runtime
  from installed evidence before applying API guidance.
- Review server/client boundaries, serializable props, route API contracts,
  error/not-found behavior, metadata and runtime-produced public outputs.
- Check cache scope, tags/lifetimes, request-time APIs, stale behavior, and
  external-data fallback only where the installed version supports them.
- Trace data waterfalls and public route failures in the rendered/runtime
  target; do not infer field behavior from source alone.

## C. React performance

- Find serial fetches that can safely run in parallel and missing boundaries
  that delay independent content.
- Inspect broad client islands, oversized serialization, barrel imports,
  expensive render subscriptions, and genuinely heavy dynamic-import
  candidates.
- Preserve correctness and interaction priority. A static suspicion about
  renders or bundles remains `Inferred` until measurement can support it.

## D. shadcn and Tailwind seam

- Detect `components.json`, actual aliases, CSS entry points, primitive imports,
  resolved packages, installed types, and Tailwind configuration.
- Probe for configured-source drift, dead state selectors, a Base UI/Radix
  composition mismatch, or a token/utility that does not reach computed style.
- Treat raw values, brackets, `px`, hex, RGB, palette utilities, and aliases as
  signals. They become defects only under project policy or exact
  compiler/type/language-server proof.
- Keep ownership compact: identify whether a canonical component or consumer
  is bypassed without duplicating the full adoption/migration method.

## E. Visual craft

On the primary applicable route and one pressure state, verify:

- intended first and second visual priorities;
- recognizable affordances and state distinctions;
- consistency with strong comparable local examples;
- whether novel color, type, radius, depth, icon, or image treatment carries
  semantic or product-character meaning;
- realistic content, focus, disabled/invalid, dark, and high-contrast behavior
  as applicable.

Treat preference-only differences as `Decision`, not defects. Report at most
three rendered visual findings with proof. Do not prescribe universal radius
formulas, accent counts, press scales, shadows, wrapping, or image outlines.

## F. Motion

- Establish purpose, frequency, identity/carrier, interruption, input method,
  first-render behavior, and a useful reduced/static alternative.
- Reproduce rapid reversal, mount/unmount, navigation, scroll, and busy-page
  behavior where relevant.
- Treat layout/paint properties, animated blur, persistent `will-change`,
  off-screen loops, scroll-driven JavaScript, and broad transitions as risk
  signals that require profiling and product context—not universal defects.
- Keep view-transition applicability compact. Verify navigation/history,
  snapshot identity, support/fallback, focus, interruption, and reduced motion
  only when view-transition code exists.

## G. Accessibility

- Inspect accessible name, role, state, relationships, landmarks, and semantic
  hierarchy.
- Exercise the keyboard path and rendered focus visibility, including sticky
  and overflow owners.
- Verify form purpose, `type`, input mode, autocomplete, validation,
  `aria-invalid`/description relationships, and recovery from the field’s real
  data semantics.
- Test target size and spacing against the applicable WCAG 2.2 criterion;
  distinguish AA minimum/exception from a project design floor.
- Measure text/UI/focus contrast in relevant rendered states. `currentColor`
  alone proves no contrast result.
- Verify announcement need and existing primitive semantics before adding live
  regions; avoid duplicate announcements.
- Check zoom, drag alternatives, visual/focus order, non-color state cues, and
  decorative versus meaningful alternative text.
- Verify navigational affordances are real anchors in the rendered tree —
  keyboard-activatable, and reachable through the browser's own new-tab and
  middle-click paths — rather than click handlers on generic elements.
- Do not require exactly one `h1` or purely sequential heading levels as a
  proxy. Test whether the accessible hierarchy communicates the page.

## H. Components and propagation

- Identify canonical checked-in source, clones/bypass imports, shared consumer
  reach, and catalog/test coverage.
- Probe prop combinations, slots, variants, events, state ownership,
  server/client boundaries, and primitive semantics for invalid states or
  dropped behavior.
- Repetition alone does not prove a component, token, or variant. Shared
  meaning and a stable owner do.
- A catalogue is evidence only when it imports production exports and exercises
  meaningful states; it is not a parallel implementation.

## I. Project rules

- Apply tracked repository authority relevant to the scope.
- Resolve conflicts against executable configuration and installed behavior.
- Do not present ignored/private notes as published contracts.
- Absence of a template rule is not a finding.

## J. Web-vitals risk

- Check dimensions/aspect reservation for images, video, iframes, embeds, and
  injected dynamic content.
- Inspect LCP candidate delivery, initial HTML, font loading/fallback metrics,
  third-party script strategy, and large synchronous event work.
- Review long-list containment/virtualization only at realistic volume.
- Keep source risk and measured field/lab outcomes separate. Quote current
  targets only from decision-bearing current primary documentation.

## K. Client security and platform hardening

- Run the project’s configured dependency/security tooling without an implicit
  latest-package download.
- Review raw HTML and script/style sinks, sanitization/Trusted Types, mixed
  content, third-party assets, source-map exposure, cookie handling, and
  security-header configuration.
- Grade vulnerable dependencies by affected version, reachable usage,
  exploitability, data/system impact, and mitigation—not scanner category
  alone.
- Verify event/error handling and passive/cancelable listener intent where it
  affects platform safety or responsiveness.

## L. Server security and data exposure

Trace client → endpoint/action → data/service → response:

- re-check authentication and authorization inside every callable mutation or
  sensitive read;
- derive user/org/tenant identity from trusted session state and scope record
  lookup to it;
- verify RLS/security rules when a client can reach a BaaS directly;
- use parameterized queries and constrain shell, filesystem, redirect, fetch,
  upload, and prompt-injection boundaries;
- keep secrets and privileged environment variables out of client bundles;
- return only required fields and redact errors/logs;
- verify webhook signatures, CSRF defenses, rate limits, and server-side
  preconditions where applicable.

Missing authorization, reachable privileged secrets, exploitable injection, or
cross-tenant access can be P0 when evidence shows meaningful reach. Benign,
unreachable, or fully mitigated signals are not assigned the same grade.

## M. State integrity and failure handling

- Guard non-idempotent mutations against repeat submission and server replay;
  treat irreversible/paid operations according to their actual preconditions.
- Author only applicable loading, cached, empty, partial, failure, retry, and
  recovery states. Do not require every async surface to show all states or
  replace every wait with a skeleton.
- Ensure failures surface or recover; reject infinite pending states and
  swallowed errors.
- Clean up subscriptions, timers, listeners, and requests. Prevent stale
  responses from overwriting newer visible/persisted state.
- Verify optimistic/local-first changes roll back and reconcile with server
  truth; do not apply optimism to irreversible or server-preconditioned work.
- Parse/narrow response shapes at boundaries and revalidate destructive state
  against current server truth.
- Where a view is meant to be shareable or resumable, verify stateful views
  survive a URL round-trip: reload, back/forward, and a pasted link restore the
  same filters, tab, page, and scroll position. Do not require every transient
  UI state to be encoded in the URL.

Exercise forced failure and race paths end to end where risk warrants it.
