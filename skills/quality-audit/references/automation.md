# Scheduled read-only quality reports

Use this template only after the owner separately authorizes scheduling,
permissions, destination, retention, and the exact pinned harness/version.
Normal audit work does not authorize automation changes.

## Contract

- Run findings mode only. Do not create branches, edit product files, commit,
  push, open PRs, install or update tools, or apply fixes.
- Use the repository’s pinned package manager and existing commands.
- Pin the audit harness and any workflow actions to reviewed versions.
- Grant read-only repository permissions unless an explicitly approved report
  destination needs one narrower write permission.
- Store redacted structured findings, command statuses, provenance, and reruns;
  do not persist raw prompts, provider traces, secrets, environment values, or
  unbounded logs.
- Distinguish new, pre-existing, unverified, and unsupported results.
- Set an absolute retention/review date and a removal owner.

## Trigger body

```text
Run quality-audit in findings mode. Preserve the current checkout. Use only
project-pinned or already installed tools. Report command statuses and
applicable dimensions, keep all unrun checks unverified, and make no writes.
```

For a changed-scope report, supply an exact locally available base/head pair.
Do not fetch, switch branches, or infer a merge base inside the audit.

## Output

Write one bounded report containing:

- repository identity and exact revision/scope;
- harness/tool versions;
- applied and skipped dimensions;
- at most five visible decision groups plus complete P0 counts;
- redacted structured artifact location;
- exact rerun commands;
- review/removal date.

Scheduled mutation remains out of scope. Apply accepted findings later through
an explicitly authorized remediation run in a reviewed checkout.
