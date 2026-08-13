# Answering findings on the PR

Every finding gets its answer written on the surface that raised it, not only in the report at the end of the turn. `gh` comments as the authenticated account, so the answer lands under the owner's name on the PR, where they can see a bot's finding was actioned without reading a transcript or the diff.

Post after the fix is pushed and the provider's re-run on the new head confirms it, never before. Informational items need no comment. Everything else gets one: fixed, false positive, an approved suppression, or a question you're leaving for the owner.

| Where the finding came from | Where the answer goes |
|---|---|
| Inline review thread — Bugbot, CodeRabbit, a human | A thread reply, then resolve the thread |
| A review body with no thread | `gh pr comment <pr> --body '<answer>'`, naming the review |
| Check output or an annotation with no comment surface — React Doctor, Vercel Agent Review, scanners | One conversation comment per head, a row per finding |
| A failed deployment or preview build | The same per-head comment, naming the environment |

State these, in this order:

- the finding, named the way the provider named it, so the owner can match them up;
- the root cause in the source, at `path:line`;
- what the fix changed, and the fix commit SHA;
- the provider's result on the new head — the check name with its new conclusion, or the annotation that's now absent;
- that nothing was suppressed. If something was, under one of the two cases [pr-stabilization.md](pr-stabilization.md) allows, say which case and quote the evidence.

Write it the way the commit body is written: neutral, no attribution, no quality adjectives, no restating the diff. `gh pr comment <pr> --edit-last --body '<answer>'` updates the comment you already posted for this head instead of stacking near-identical ones.

```bash
gh pr comment <pr> --body 'React Doctor: effect re-runs every render, components/table.tsx:118

Cause: the sort comparator was rebuilt inline each render, so the effect
dependency changed identity every time. Hoisted it out of the component.

Fix: <sha>. React Doctor on <new-sha>: success, 0 annotations. No ignore
comment, allowlist entry, or severity change.'
```

Thread replies and resolution use the two GraphQL mutations in [pr-stabilization.md](pr-stabilization.md).
