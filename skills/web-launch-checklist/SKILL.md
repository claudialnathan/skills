---
name: web-launch-checklist
description: "Run the maintained 192-item web launch checklist and produce an evidence-backed go/no-go record for an exact release. Use when asked to work through a pre-launch checklist, fill a web launch record, or make a checklist-based launch decision. A general whole-repository quality audit, remediation, or deployment is a separate job."
---

# Web launch checklist

Assess one website or web-app release against the maintained checklist in
[`REF.md`](REF.md). A complete result lets another reviewer trace every checked
item to current evidence and understand every gap, exception, and N/A decision.

## Authority

A checklist review is read-only unless the user explicitly asks to fix its
findings. Inspect the repository, deployed target, project-owned checks,
browser behavior, and external-service evidence available in the current
session. Do not deploy, create accounts, change provider configuration, send
production email, charge a payment method, or mutate production data without
separate authority.

`REF.md` is the maintained source copy. Read it in full before assessing a
release, and never edit it during a checklist run. When a check appears to have
drifted from current platform or standards guidance, verify the current primary
source and report the discrepancy as checklist-maintenance work rather than
silently rewriting or ignoring the check.

## Fix the target before judging it

Complete the launch-record identity from evidence first: site, exact production
or preview URL, release or commit, review date, owner, and reviewer. A preview,
staging deployment, and production deployment are different targets; evidence
from one does not establish another.

Resolve the supported browsers and devices and the product capabilities that
control applicability: authentication, user content, uploads, storage, email,
payments, subscriptions, search discovery, analytics, localization, and
regulated data. Read the repository and deployed target before asking. Ask only
for facts neither can establish, and leave the affected checks open when the
answer is unavailable.

If the request covers only a section or named concern, keep that scope and say
that the remaining checklist was not assessed. A scoped review cannot produce
a whole-release `Go` result.

## Work the checklist

Follow `REF.md` in its existing section and item order. Give every item exactly
one disposition:

- mark it complete only with evidence tied to this target;
- mark it `N/A` only with the product fact that makes it inapplicable;
- otherwise leave it open and record the observed failure or the evidence still
  needed.

Match the proof to the claim:

| Claim | Evidence that can establish it |
| :--- | :--- |
| Source or configuration | Current path and relevant setting, handler, policy, schema, or test |
| Build or automated check | Project-owned command, target, exit status, and useful output |
| HTTP or network behavior | Exact URL, status, redirect chain, header, cookie, request, or payload |
| Rendered behavior | Named browser, viewport or device, interaction path, and observed result |
| External service | Read-only provider, DNS, log, dashboard, backup, or delivery evidence with date |
| Product, legal, or risk decision | Named owner, approved requirement or exception, and date |

Use current official documentation when a version-specific requirement decides
the result. A source declaration cannot prove deployed behavior, a scanner's
overall score cannot prove every underlying item, and absence of repository
configuration cannot prove an external service is correctly configured. Keep
those items open until the matching evidence exists.

Use disposable test identities, sandbox payment fixtures, safe test messages,
and non-destructive requests where a check needs active exercise. Do not force a
production failure or destructive path merely to complete the record.

## Produce the launch record

When the user requests a persistent record, create a new Markdown file at the
path they choose by copying the checklist structure and annotating that copy;
never overwrite `REF.md`. Otherwise present the assessed record in the response.

Preserve the checklist wording and add compact evidence beside each item. Fill
the launch-record fields, summarize completed, open, and N/A counts by section,
and put unresolved launch risks in the existing exceptions-and-follow-up table
with an owner, due date, and reason.

Set `Go` only when every applicable item has current evidence or appears as an
explicitly accepted exception owned by someone accountable for the launch. Set
`No-go` when an applicable blocker remains, required evidence is unavailable
and unaccepted, or the reviewed URL and release cannot be identified. A source,
configuration, release, or deployment change invalidates the affected evidence;
rerun those checks before changing the verdict.

## Sources

> This skill draws inspiration from publicly available content from [Awwwards](https://www.awwwards.com/) and [Ishikawa](https://catnose.me/).
