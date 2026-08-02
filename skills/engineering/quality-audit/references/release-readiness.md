# Launch-readiness checkup

Use this reference only with `profile: launch`. It adapts the concerns in
Ishikawa's public [Web App Pre-Launch Checklist](https://catnose.me/notes/web-checklist)
into an evidence contract; it does not treat that checklist, a scanner, or an
agent's memory as project authority.

## Establish applicability first

Record the exact target revision, deployment URL/environment, date, and known
service configuration. Then mark each launch domain `applicable`,
`not-applicable`, or `unverified`, with the evidence behind that decision.

Resolve at least these product facts before judging absence:

- public, authenticated, administrative, and tenant-sensitive routes;
- user-generated content, redirects, uploads, object storage, and public APIs;
- transactional or marketing email;
- payments, subscriptions, refunds, and account deletion;
- public discovery requirements such as search indexing and sharing;
- analytics, monitoring, backups, cloud accounts, and third-party services;
- legal, privacy, regional, or accessibility obligations supplied by the
  project or owner.

Do not require a sitemap from a private application, payment recovery from an
application with no billing, or marketing unsubscribe behavior from a product
that sends no marketing email. Do not infer that backups, MFA, monitoring, or
provider settings pass merely because the repository contains no contrary
evidence.

## Keep evidence types separate

Use the narrowest trustworthy source for each claim:

| Evidence | Appropriate proof |
| :--- | :--- |
| Source and configuration | Routes, handlers, schemas, policies, framework configuration, provider configuration checked into the repository |
| Project-owned commands | Existing lint, type, test, build, migration, dependency, accessibility, and security commands |
| Runtime and browser | Exact response headers/status, cookies, rendered metadata, keyboard paths, failure states, responsive layouts, resource behavior |
| External service | Read-only provider configuration, DNS records, delivery state, storage policy, backups, monitoring, billing sandbox, deployment logs |
| Product or owner decision | Legal copy, cancellation/refund policy, analytics need, risk acceptance, launch scope |

Record unavailable evidence as `unverified`. Never install a latest scanner,
provision a service, change cloud configuration, send production email, charge
a payment method, or mutate production data merely to complete the checkup.

## Review applicable launch domains

### Identity, input, and server boundaries

- Verify authentication-cookie scope and flags against the actual response,
  including host/domain intent and cross-site requirements.
- Trace server-side validation, authorization, tenant scoping, redirects,
  uploads, raw HTML, query construction, and response-header construction at
  their callable boundaries.
- Check sensitive-action reauthentication, CSRF assumptions, rate limits,
  cache privacy, safe error responses, and required security headers against
  the deployed target. Treat HSTS subdomain/preload changes as an explicit
  operational decision, not a generic autofix.
- Exercise CRUD permissions and failure paths with disposable test identities
  and records. Never use destructive production probes.

### Data and operational recovery

- Establish whether database and object-storage backups exist, their scope,
  retention, and most recent restore evidence. An enabled toggle is not restore
  proof.
- Check public storage/listing exposure and privileged cloud-account MFA from
  read-only provider evidence where access exists.
- Verify server-error monitoring and alert ownership. Distinguish telemetry
  configured in source from a live alert path.
- Review client persistence and third-party-cookie assumptions against the
  browsers and authentication model the product supports.

### Email and abuse resistance

- Trace user-controlled content entering email, notification fan-out, rate
  limits, queue retries, and deduplication/idempotency.
- Verify SPF, DKIM, and DMARC from current DNS/provider evidence when email is
  sent from the product domain.
- Exercise unsubscribe behavior without authentication where marketing mail is
  applicable, and inspect one-click unsubscribe headers through a safe test
  message or provider artifact.

### Discovery and public artifacts

- Request representative public, private, error, and search-result routes.
  Check meaningful titles, canonical intent, status codes, indexing directives,
  robots behavior, sitemap applicability, and accidental site-wide `noindex`.
- Render or request Open Graph/Twitter metadata and images on routes likely to
  be shared. Inspect the actual artifact, not only source declarations.
- Verify favicon and touch-icon output from the deployed target.

### Payments and account lifecycle

- Use sandbox fixtures, provider test mode, or existing integration tests to
  exercise payment success with application failure, retries, duplicate
  submission, cancellation, refund/proration, and webhook replay.
- Trace account deletion or suspension through subscriptions, retained
  invoices, stored data, and access recovery. Do not infer consistency from one
  successful UI path.
- Treat pricing, refund terms, legal promises, and cancellation policy as
  owner decisions. Verify the implemented path only against approved policy.

### Accessibility, performance, and cross-platform behavior

- Apply the repository quality dimensions and project-owned checks first, then
  verify the rendered critical path with keyboard, focus, zoom, long content,
  phone/tablet widths, persistent scrollbars, and applicable assistive
  technology.
- Inspect image dimensions and delivered sizes, layout-shift reservation,
  critical resource loading, bundle evidence, and realistic long-list cost.
- Review essential database indexes only through known query shapes and data
  access patterns; absence of a guessed index is not automatically a finding.
- Record operating-system, browser, device, low-power, throttling, and font
  coverage exactly. A platform that was not exercised remains unverified.

### Product, legal, and observability decisions

- Confirm that required Terms and Privacy surfaces exist and match the approved
  product scope; do not author legal commitments from a generic checklist.
- Establish whether analytics is needed, consent applies, and collection
  matches the stated privacy contract. No analytics can be a valid decision.
- Verify friendly recovery paths for 404/5xx states and an owned response for
  operational incidents.

## Complete the checkup

Run the skill's accepted-finding settlement loop. Preserve one evidence record
per check containing the target revision/environment, applicability, status,
location or provider, observed proof, proposed action, rerun, and timestamp.

Do not call the launch ready while a required provider is still pending, a
green provider output contains an actionable warning, a code or deployment
change has invalidated earlier proof, or required high-impact evidence is still
unverified without explicit risk acceptance.

## Acceptance scenarios

- **Given a green provider conclusion with a warning in its output,** classify
  the warning and fix it when actionable; never count the conclusion alone as a
  pass.
- **Given a provider still pending at the wait budget,** preserve its exact
  pending state and report the target as not ready; never start an unbounded
  second wait.
- **Given a source, configuration, or deployment change,** discard affected
  prior evidence and restart the inventory on the new identity.
- **Given an actionable finding that survives 2 focused fix attempts,** stop,
  report both attempts and remaining proof, and ask before continuing.
- **Given missing credentials or inaccessible provider state,** report the
  check as `unverified`; never infer clean external configuration from source.
- **Given findings-only mode,** wait and inventory as needed but make no fixes.
- **Given 2 stable inventories for the same target and no actionable accepted
  findings,** report the checkup settled while preserving every remaining
  decision, blocker, and unsupported surface.
