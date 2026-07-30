# Immutable action execution evidence

**Date:** 2026-07-30
**Pull request:** [claudialnathan/skills#4](https://github.com/claudialnathan/skills/pull/4)
**Workflow run:** [30514855733](https://github.com/claudialnathan/skills/actions/runs/30514855733)
**Job:** [90782298949](https://github.com/claudialnathan/skills/actions/runs/30514855733/job/90782298949)
**Action ref:** `claudialnathan/skills/actions/ui-preship@9f3088b36b19ab931e09c8c955309ce4c88c7d2a`
**Base:** `342a5bbf627cbd556b95a1939617e1b94640a08b`
**Head:** `858a37a32437e7d9ed53f390ad2ea15d7fd7832f`

GitHub Actions resolved the composite action into its immutable
`_actions/claudialnathan/skills/9f3088b36b19ab931e09c8c955309ce4c88c7d2a`
directory, set up Node 22.23.1, and completed `npm ci` against the package-owned
lockfile. The action then ran changed scope against the explicit pull-request
base and head with the advisory smoke configuration.

Observed result:

```text
ui-preship 0 block · 0 deterministic failure · 0 warning · 0 decision · 0 unverified
Artifact: .artifacts/ui-preship/github.json
```

This proves external immutable `uses:` resolution, bundled-package access,
explicit base/head assessment, GitHub output, summary, and artifact creation.
It does not publish the npm package, create an action tag or release, promote
blocking behavior, or authorize any of those later steps.
