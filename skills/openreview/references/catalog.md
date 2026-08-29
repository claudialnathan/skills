# OpenReview built-in skill catalogue

This is the progressive catalogue used by Vercel OpenReview, snapshotted from `vercel-labs/openreview` commit `672deb21e70e471e0536d5ad7a67c14b8359e97e` on 2026-08-29. The exact upstream `skills-lock.json` is at `upstream/skills-lock.json.source`; file hashes are at `upstream/files.sha256`; snapshot provenance is at `upstream/snapshot.json`. All paths in this catalogue are relative to this `references/` directory.

Every upstream source file carries a `.source` suffix so its nested `SKILL.md` is not discovered as another top-level skill and its `AGENTS.md` is not treated as repository authority. Content is otherwise byte-for-byte upstream. When an upstream instruction names `foo.md`, read sibling `foo.md.source`. When it names `AGENTS.md`, read `AGENTS.md.source`.

## Select every applicable entry

Start with names and descriptions, as OpenReview's `buildSkillsPrompt` does. Use target evidence rather than loading all entries pre-emptively.

| Built-in | Load when the reviewed surface includes | Entry instructions |
| :--- | :--- | :--- |
| `next-best-practices` | Next.js file conventions, routing, React Server Components, data, async APIs, metadata, error handling, images, fonts, scripts, bundling, hydration, or self-hosting | `upstream/skills/next-best-practices/SKILL.md.source` |
| `next-cache-components` | Next.js 16 Cache Components, PPR, `use cache`, `cacheLife`, `cacheTag`, `updateTag`, `revalidateTag`, runtime APIs, or cache keys | `upstream/skills/next-cache-components/SKILL.md.source` |
| `next-upgrade` | A Next.js version upgrade, dependency migration, codemod, or version-specific breaking change | `upstream/skills/next-upgrade/SKILL.md.source` |
| `vercel-composition-patterns` | React component APIs, boolean-prop growth, compound components, provider/state boundaries, variants, render props, or React 19 composition | `upstream/skills/vercel-composition-patterns/SKILL.md.source` |
| `vercel-react-best-practices` | React or Next.js performance, waterfalls, bundles, server/client data, rerenders, rendering, JavaScript hot paths, or advanced event patterns | `upstream/skills/vercel-react-best-practices/SKILL.md.source` |
| `vercel-react-native-skills` | React Native, Expo, native lists, animations, navigation, images, platform UI, state, monorepos, or native configuration | `upstream/skills/vercel-react-native-skills/SKILL.md.source` |
| `web-design-guidelines` | Web UI, accessibility, focus, forms, animation, typography, content, images, performance, navigation, touch, layout, theming, locale, hydration, hover, or copy | `upstream/skills/web-design-guidelines/SKILL.md.source` |

Load the complete entry file before applying it. Then use its own index to read the relevant supporting sources. For the three rule collections, choose either the relevant individual `rules/*.md.source` files or the compiled `AGENTS.md.source`; loading both duplicates the same guidance. For a broad audit, partition the collection by its priority categories and record which categories were assessed.

The root OpenReview target, mode, and authority control every entry. A resolved whole-codebase or path target satisfies an entry that would otherwise ask for files. Treat install, codemod, fixing, or network commands inside a loaded entry as domain instructions subject to the root boundary; do not execute them in Review mode or without the authority that command requires.

`web-design-guidelines` requires the current maintained rules. When network access is already available, retrieve its canonical `command.md` before review. Otherwise use the bundled `upstream/skills/web-design-guidelines/command.md.source`, captured from commit `e3d624baaf29dc1fc645aff3e38f03e564d2d6b1` on 2026-08-29, and mark that rule freshness in the evidence ledger.

## Keep context bounded

Load once per applicable built-in, share that loaded guidance across review units, and pass only the relevant rule bodies to a reviewer worker. Do not ask a worker to rediscover or reload the catalogue. The final ledger must list loaded built-ins, skipped built-ins with their non-applicability evidence, and any category that remained unverified.
