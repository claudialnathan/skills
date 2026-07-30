# ui-preship pilot architecture

**Decision date:** 2026-07-29
**Status:** retained as a private advisory pilot by Checkpoint 5 owner decision

- Repository: this skills repository, isolated at `packages/ui-preship/`.
- Package manager: npm, with `packages/ui-preship/package-lock.json` as the
  package-owned lockfile. The repository does not become an npm workspace.
- Runtime and format: Node 22, dependency-free ESM.
- Tests: built-in `node:test`.
- Package and executable: `ui-preship`, versioned from
  `packages/ui-preship/package.json`, initially `0.1.0`.
- Action: reusable subdirectory action at `actions/ui-preship/action.yml`.
- Release: `private: true`, with no npm publication, release workflow, release
  or action tag, or provenance claim. A later release requires separate owner
  approval after external immutable-action evidence.
- Ownership while private: the repository owner owns the ruleset, adapters,
  releases, security updates, and baseline schema. A later repository split
  must name replacement maintainers before publication.

The same-repository option is selected because source, fixtures, the action, and
the existing pre-ship design contract can be reviewed atomically during the
pilot. A separate public repository is rejected for this phase because it would
create release permissions, issue ownership, and a second stabilization cadence
before consumer evidence exists.

The Phase 5 runner installed a packed tarball into five disposable Git
repositories covering Next.js/Base UI/Tailwind, React without shadcn,
Radix-based shadcn, an explicit `apps/web` workspace, and a non-React shape.
All stayed advisory, matched their expected rule/lens contracts, and recorded
zero unexpected activations. The action runner also passed an exact local
PR-delta probe with annotations, summary, output, and redacted artifact.

External immutable `uses:` execution passed on 2026-07-30. Pull request #4
loaded `claudialnathan/skills/actions/ui-preship` from commit
`9f3088b36b19ab931e09c8c955309ce4c88c7d2a` in GitHub Actions run
`30514855733`, installed the bundled package lockfile, and completed an exact
base/head assessment with zero blockers, deterministic failures, warnings,
decisions, or unverified checks. The evidence is recorded in
`pilot/2026-07-30-immutable-action.md`.

This closes the immutable-action evidence gap only. The package remains private
and is not presented as registry-available.

## Checkpoint 5 owner disposition

On 2026-07-29, the owner retained the `ui-preship` package and executable name,
kept `blockingMode: none`, selected no default adapter, declined publication,
and declined another paid token-efficiency bakeoff. This decision authorizes
local reconciliation only; it does not authorize a commit, push, publication,
tag, release, global installation, or external immutable-action run.

On 2026-07-30, the owner separately authorized commit and delivery through the
repository's `ship` workflow. That authorization produced the immutable action
evidence above; it did not authorize npm publication, an action tag, a release,
or global installation.
