# Web launch checklist

A combined, updated checklist based on the Awwwards Development Award Guidelines v0.7 and Catnose's Web App Pre-Launch Checklist.

Awwwards applies the six weighted developer criteria below after a site wins Site of the Day; a Developer Jury score above 7 earns the Developer Award.

Use **N/A** when a check does not apply, and record why. Do not mark an item complete without evidence.

## Launch record

| Field             | Value      |
| ----------------- | ---------- |
| Site              |            |
| Production URL    |            |
| Release or commit |            |
| Review date       |            |
| Owner             |            |
| Reviewer          |            |
| Result            | Go / No-go |

## 1. Security and data protection

### Authentication and sessions

- [ ] Authentication cookies use `HttpOnly`.
- [ ] Authentication cookies use `Secure` and are sent only over HTTPS.
- [ ] `SameSite` is set to `Lax` or `Strict` as required by the sign-in flow.
- [ ] No `GET` request changes state, especially when cookies use `SameSite=Lax`.
- [ ] Cookie scope is deliberate; prefer a host-only cookie with no `Domain` value.
- [ ] Where suitable, authentication cookie names use the `__Host-` prefix with `Secure`, `Path=/`, and no `Domain`.
- [ ] Sensitive actions, such as changing an email address or deleting an account, require a recent sign-in.
- [ ] Every create, read, update, and delete operation enforces server-side authorization.
- [ ] All cloud and infrastructure accounts have multi-factor authentication enabled.

### Input, output, and uploads

- [ ] All untrusted input is validated on the server, not only in the browser.
- [ ] User-supplied URLs are parsed and restricted to allowed protocols and destinations.
- [ ] URL validation resists case, encoding, and partial-match bypasses.
- [ ] User content is escaped or sanitized before HTML rendering; raw input never reaches `innerHTML` or `dangerouslySetInnerHTML` unchecked.
- [ ] Database queries use parameterized APIs and are tested against injection.
- [ ] Public handles cannot collide with application routes or reserved names.
- [ ] Redirect targets are allow-listed or restricted to safe same-origin paths.
- [ ] User input is never inserted directly into response headers.
- [ ] File uploads enforce allowed type, verified content, size, filename, and storage rules.
- [ ] Public object storage listing is disabled unless it is an explicit product feature.
- [ ] Raw stack traces, database errors, secrets, and server internals never reach users.

### Data integrity and caching

- [ ] Every update and delete query has a reviewed, appropriately narrow filter.
- [ ] Destructive bulk database operations have explicit safeguards.
- [ ] Private and user-specific responses cannot be cached by a shared CDN, proxy, or key-value cache.
- [ ] Database backups are enabled and a restore has been tested.
- [ ] Object storage backups or versioning are enabled and a restore has been tested.
- [ ] Browser storage is not the only durable copy of important user data.
- [ ] The app still works if Safari removes script-set storage after inactivity.
- [ ] The app does not depend on third-party cookies.

### Transport and browser protections

- [ ] All production traffic uses HTTPS with no mixed content.
- [ ] `Strict-Transport-Security` is set with a safe rollout plan before adding `includeSubDomains` or `preload`.
- [ ] `Content-Security-Policy` is defined and tested for the site's actual scripts, frames, media, and connections.
- [ ] CSP `frame-ancestors` or an equivalent policy prevents unwanted embedding.
- [ ] `X-Content-Type-Options: nosniff` is set.
- [ ] Security headers are checked on representative production responses.

## 2. Web performance - Awwwards weight: 20%

- [ ] Performance is measured on the production build, not the development server.
- [ ] Key pages are tested on a representative mobile device and constrained network.
- [ ] Core Web Vitals are measured with field data where available and lab data where field data is not yet available.
- [ ] Server response time is acceptable for cached and uncached requests.
- [ ] The critical rendering path prioritizes visible content.
- [ ] Non-critical scripts are deferred, delayed, or conditionally loaded.
- [ ] CSS and JavaScript are minified and unnecessary code is removed.
- [ ] JavaScript bundles have been inspected; large dependencies and duplicate code are justified.
- [ ] Text responses use Brotli or gzip compression.
- [ ] Images are correctly sized, compressed, and delivered in efficient formats.
- [ ] Responsive images use suitable `srcset` and `sizes` values.
- [ ] Images reserve their rendered space with intrinsic dimensions or `aspect-ratio`.
- [ ] Below-the-fold images, video, embeds, and other heavy assets load only when needed.
- [ ] Fonts are subset, compressed, and loaded without invisible text or layout shift.
- [ ] Static assets use a CDN or equivalent edge delivery where it improves delivery.
- [ ] Static assets have correct, durable `Cache-Control` headers; dynamic content has safe cache rules.
- [ ] Redirect chains, DNS lookups, origins, requests, and third-party scripts are kept to a justified minimum.
- [ ] Embeds, iframes, visual filters, and other expensive effects are used only when their value exceeds their cost.
- [ ] The page has no unexpected layout shifts during load or interaction.
- [ ] Scrolling and interaction remain responsive while media and scripts load.
- [ ] The console has no errors, failed requests, or accidental production logging.
- [ ] The site works on its supported browsers and degrades safely when a feature is unavailable.

Record the evidence:

| Measure                 | Mobile | Desktop | Target or note |
| ----------------------- | -----: | ------: | -------------- |
| LCP                     |        |         |                |
| INP                     |        |         |                |
| CLS                     |        |         |                |
| Total transferred bytes |        |         |                |
| JavaScript transferred  |        |         |                |
| Requests                |        |         |                |
| Third-party origins     |        |         |                |

## 3. Responsive design and mobile - Awwwards weight: 20%

- [ ] Layout uses flexible grids and containers rather than one fixed viewport.
- [ ] Images, video, embeds, canvas, and 3D content stay within their containers.
- [ ] The full experience works at phone, tablet, laptop, and large desktop sizes.
- [ ] The layout is checked between named breakpoints, not only at exact device presets.
- [ ] Content order and information hierarchy remain clear at every size.
- [ ] Typography stays readable, with useful line length and no clipped or overlapping text.
- [ ] Navigation is understandable and fully usable on small screens.
- [ ] Primary actions and critical content remain available on mobile.
- [ ] Touch targets have enough size and separation.
- [ ] Controls support the input methods relevant to the device: touch, pointer, and keyboard.
- [ ] Device features are detected by capability rather than brittle browser-name checks.
- [ ] High-density displays receive sharp images and graphics without wasteful downloads.
- [ ] Safe areas, zoom, orientation changes, and virtual keyboards do not hide content or controls.
- [ ] Long names, URLs, translations, and user-generated content do not break the layout.
- [ ] Permanent scrollbars and modal scroll locking do not shift the page unexpectedly.
- [ ] The mobile experience performs well and does not merely reproduce a heavy desktop version.

## 4. HTML and metadata - Awwwards weight: 15%

- [ ] Pages use valid, standards-based HTML.
- [ ] Each document declares the correct doctype, character encoding, viewport, and language.
- [ ] Native semantic elements are used before generic containers or custom controls.
- [ ] Markup is as small and meaningful as the design and interaction allow.
- [ ] Heading levels describe the real content hierarchy.
- [ ] Landmarks such as `header`, `nav`, `main`, and `footer` identify page regions.
- [ ] Links navigate and buttons perform actions.
- [ ] Images have `src`, intrinsic dimensions, and suitable alternative text; captions are used where needed.
- [ ] Metadata is accurate for the current page and environment.
- [ ] Structured data is added only when it describes visible page content and passes validation.
- [ ] Code and naming are clear enough to maintain without redundant wrappers or comments.
- [ ] A favicon is available in the required formats and sizes.
- [ ] An `apple-touch-icon` is available.

## 5. Semantics, SEO, and sharing - Awwwards weight: 20%

### Search foundations

- [ ] Every indexable page has a unique, descriptive `<title>`.
- [ ] SEO-critical pages have useful meta descriptions.
- [ ] Public URLs are stable, readable, and consistently cased.
- [ ] Canonical URLs are correct on important or duplicate-prone pages.
- [ ] Alternate language or regional pages use correct `hreflang` links where applicable.
- [ ] Important navigation and content are text in semantic HTML, not only images, canvas, or JavaScript handlers.
- [ ] Link text describes its destination.
- [ ] Images use helpful filenames and alternative text where the image carries meaning.
- [ ] Public content is original, accurate, complete, and proofread.
- [ ] Broken links and accidental redirect chains are removed.
- [ ] Permanent moves use permanent redirects; temporary moves use temporary redirects.
- [ ] Deleted content returns an honest `404` or `410` unless a genuine replacement exists.
- [ ] Error pages return the correct `4xx` or `5xx` status and are not indexed.
- [ ] Search-result and other low-value generated pages are `noindex` or properly canonicalized.
- [ ] Staging protection and site-wide `noindex` are removed from production.
- [ ] `robots.txt` allows required pages and rendering assets while blocking only deliberate targets.
- [ ] An XML sitemap includes canonical public pages and is submitted where useful.
- [ ] Pagination is crawlable through ordinary links and does not depend on obsolete `rel=prev/next` behavior.
- [ ] Paid or untrusted links use the appropriate `rel` values.

### Social previews

- [ ] Shared pages define accurate `og:title`, `og:description`, `og:url`, and `og:image` values.
- [ ] The X/Twitter card type and image are configured where relevant.
- [ ] Social preview images render correctly at platform crop sizes.
- [ ] Structured data, Open Graph data, canonicals, titles, and visible content agree.

## 6. Motion and transitions - Awwwards weight: 15%

- [ ] Motion has a clear job: explain relationships, guide attention, show state, or support the story.
- [ ] Interaction feedback covers hover, focus, active, loading, success, and failure where relevant.
- [ ] Timing, easing, rhythm, and direction are consistent across the site.
- [ ] Motion is not too slow, too frequent, or visually inconsistent.
- [ ] Animations remain smooth under realistic CPU and GPU load.
- [ ] DOM animations avoid repeated layout and paint work when a transform or opacity change will do.
- [ ] Scroll-linked and parallax effects stay synchronized during fast scroll and reverse scroll.
- [ ] 2D, 3D, canvas, WebGL, and shader effects have tested CPU, GPU, memory, and asset budgets.
- [ ] Animation loops, listeners, contexts, workers, and media are cleaned up when no longer needed.
- [ ] Page and section transitions preserve navigation, URL history, focus, scroll, and loading state.
- [ ] Pointer-specific motion has an equivalent touch and keyboard experience.
- [ ] Motion works in supported browsers and has a safe fallback.
- [ ] `prefers-reduced-motion` removes or reduces non-essential motion without hiding content or state.
- [ ] Auto-starting movement or updates that continue for more than five seconds can be paused, stopped, or hidden.

## 7. Accessibility - Awwwards weight: 10%

- [ ] The target standard and legal requirement are defined; use WCAG 2.2 AA as the default baseline where suitable.
- [ ] All functionality works with only a keyboard, with no traps or dead ends.
- [ ] Focus order follows the visual and reading order.
- [ ] Focus is visible and moves correctly when dialogs, menus, routes, and errors change.
- [ ] Custom controls follow expected keyboard and touch patterns.
- [ ] Every control has an accessible name, role, state, and value.
- [ ] Native HTML controls are used instead of ARIA recreations where possible.
- [ ] Page landmarks, headings, lists, tables, and live regions expose the correct structure.
- [ ] Decorative content is hidden from assistive technology without hiding useful content.
- [ ] Text alternatives describe meaningful non-text content.
- [ ] Audio and video provide captions; transcripts and audio descriptions are supplied where required.
- [ ] Text and essential graphics meet contrast requirements in every state and theme.
- [ ] Information is not communicated by colour, hover, position, sound, or motion alone.
- [ ] Text remains legible at browser zoom and with user font settings.
- [ ] Content reflows without two-dimensional scrolling at narrow widths where the content type permits.
- [ ] Tap targets are large enough and do not overlap.
- [ ] Forms have persistent labels, clear instructions, and errors that identify the problem and the next action.
- [ ] Status and validation messages are announced without unexpectedly moving focus.
- [ ] Browser back, forward, refresh, deep links, and restored state behave predictably.
- [ ] The experience remains understandable with styles unavailable and remains useful if non-essential scripts fail.
- [ ] The site is tested with automated accessibility tools, keyboard-only use, and at least one relevant screen reader.
- [ ] Windows forced-colours or another high-contrast mode remains usable.
- [ ] The A11Y Project checklist has been reviewed for any remaining applicable checks.

## 8. Email delivery

- [ ] User-controlled text cannot turn product email into an advertising or harassment channel.
- [ ] Notification fan-out is capped so one action cannot send a mass email burst.
- [ ] Email-triggering endpoints and jobs are rate-limited against abuse.
- [ ] SPF, DKIM, and DMARC are configured and passing.
- [ ] Retried or at-least-once jobs are idempotent and do not send duplicate messages.
- [ ] Marketing email can be unsubscribed from without signing in.
- [ ] Marketing messages support `List-Unsubscribe` and one-click unsubscribe where required.
- [ ] Transactional and marketing consent are kept separate.
- [ ] Bounce, complaint, and delivery failures are monitored.

## 9. Payments and subscriptions

- [ ] Payment requests and webhooks are idempotent so retries cannot create duplicate charges.
- [ ] Provider state and application state are reconciled after partial failures.
- [ ] Payment mismatches are detected, logged, and surfaced for review.
- [ ] Account deletion, suspension, and restoration have defined billing behavior.
- [ ] Active subscriptions are cancelled or otherwise handled when an account is deleted or frozen.
- [ ] Refund and proration rules appear in the terms and at the point of cancellation.
- [ ] Cancellation is easy to find and complete.
- [ ] Receipts and invoices remain available after cancellation.
- [ ] Payment success, failure, retry, refund, dispute, and subscription lifecycle paths have been tested.

## 10. Reliability, monitoring, and recovery

- [ ] Server errors are captured with enough context to diagnose them without recording secrets.
- [ ] Alerts exist for user-facing failures and route to a named owner.
- [ ] Availability, latency, error rate, and critical business flows are monitored.
- [ ] Health checks test meaningful dependencies rather than only returning `200`.
- [ ] Queue, webhook, scheduled job, and background task failures are visible and retry safely.
- [ ] Rate limits and resource limits fail with clear, recoverable responses.
- [ ] User-friendly `404` and `5xx` pages provide a useful next action.
- [ ] Analytics is included only when it has a defined purpose, lawful basis, and consent behavior.
- [ ] Production source maps, logs, dashboards, and runbooks are available to the people who need them.
- [ ] Rollback steps are documented and have been exercised for this release path.

## 11. Cross-platform, content, and legal

- [ ] The site is tested in every supported browser and operating system combination.
- [ ] System and web fonts render naturally on supported operating systems.
- [ ] The interface is tested with always-visible scrollbars.
- [ ] Real content, empty states, loading states, errors, long text, and maximum-size data are checked.
- [ ] Terms of service and privacy information are present, accurate, and reachable.
- [ ] Cookie and tracking consent matches the actual technologies in use.
- [ ] Contact, support, company, and required regulatory information is correct.
- [ ] Dates, currencies, numbers, time zones, names, addresses, and right-to-left text work where the audience requires them.
- [ ] User-facing copy is final, consistent, and free of placeholders.

## 12. Final production smoke test

- [ ] The production URL points to the intended release.
- [ ] Environment variables, domains, redirects, callbacks, webhooks, and scheduled jobs use production values.
- [ ] Sign-up, sign-in, sign-out, password recovery, and session expiry work.
- [ ] The primary user journey works from a new account through its intended completion state.
- [ ] Destructive actions show the consequence and require the right confirmation.
- [ ] Email, payment, upload, search, sharing, and third-party integrations work where applicable.
- [ ] Browser console, network requests, and server logs show no unexplained errors.
- [ ] Security, performance, accessibility, responsive, and SEO checks were run against production.
- [ ] Backups, alerts, ownership, rollback, and support coverage are active.
- [ ] The final go/no-go decision and all exceptions are recorded below.

## Exceptions and follow-up

| Check | Status | Owner | Due date | Risk and reason |
| ----- | ------ | ----- | -------- | --------------- |
|       |        |       |          |                 |

## Sources and update notes

- [Awwwards Developer Award](https://www.awwwards.com/developer-award/) and its [current linked Development Award Guidelines v0.7](https://docs.google.com/document/d/1Gvmg6Z60UQ-4BOM3XyUcBKvq2shd4J-l_MoXT26JFEg/edit), internally revised 14 December 2016. The six jury categories and weights are retained. Advice tied to older browser delivery patterns was rewritten as outcome-based checks.
- [Awwwards Evaluation System](https://www.awwwards.com/about-evaluation/) for the current Developer Jury stage and score threshold.
- [Catnose: Web App Pre-Launch Checklist](https://catnose.me/notes/web-checklist), published 29 November 2025. Its security, email, SEO, payment, performance, cross-platform, and operational checks are included and merged with overlaps.
- Accessibility references in the source material have been updated from WCAG 2.0 to a WCAG 2.2 AA baseline. Confirm the standard and laws that apply to the specific product and audience.
