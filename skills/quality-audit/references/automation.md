# Running quality-audit on a schedule

The skill works the same whether you type `/quality-audit` or wire it into a scheduler. To run it unattended, point the scheduler at this skill and pass one of the trigger bodies below.

- **Claude Code:** `/schedule` (routines) or `/loop`, with the trigger body as the prompt.
- **Cursor:** an Automation (cron / manual / webhook). Optionally check the prompt into `.agents/automations/quality-audit.md` so it travels with the repo.

## Suggested settings

| Field | Recommendation |
| :--- | :--- |
| Name | Quality audit |
| Description | Stack-aware read-only audit: lint, build, react-doctor, Next/shadcn/a11y/motion review. |
| Trigger | Cron `0 9 * * 1` (weekly) **or** manual / webhook |
| Repo | One automation per repo, or pass the repo in the webhook payload |
| Tools | None for audit-only. Optional: GitHub/Linear issue creation from the report. |
| Memory | Off |

## Trigger bodies

**Scheduled (full audit):**
```
Run quality-audit. mode: audit.
Load any installed specialist skills as applicable: shadcn-tailwind, design-engineer,
make-interfaces-feel-better, emil-design-eng, next-best-practices, react-best-practices,
react-doctor, fixing-motion-performance, fixing-accessibility, building-components,
web-design-guidelines, vercel-react-view-transitions. Skip the ones that aren't installed.
```

**Scoped to recent changes (PR pre-merge):**
```
Run quality-audit. mode: audit. Compare to main; scope to files changed since main
(pass --diff to react-doctor).
```

**Fix mode (opt-in, P0 only):**
```
Run quality-audit. mode: fix. P0 only. Branch from main first; re-run lint + build after.
```
