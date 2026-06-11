---
name: flavored-md
description: "Writes GitHub-Flavored Markdown documents: READMEs, docs, CONTRIBUTING, issue/PR templates, technical .md files. Picks the form whose job matches the content (table for a comparison, alert for a callout, collapsible details for long output, task list, footnote, mermaid/math) and cuts everything decorative. Carries the GitHub-specific traps the default gets wrong: exact alert syntax, swatch and heading-anchor rendering rules. Use for structured documents that are scanned and looked up."
when_to_use: |
  Auto-loads on README / CONTRIBUTING / docs / .github files. Also: "write a README / CONTRIBUTING / docs", "document this", "create a markdown file", "format this as markdown", "clean up / fix this README", "this README is messy or too long", "add a table / callout / diagram / collapsible section", "make this render right on GitHub", "why isn't this markdown rendering", "write an issue or PR template".
paths:
  - '**/README*.md'
  - '**/CONTRIBUTING*.md'
  - '**/docs/**/*.md'
  - '**/.github/**/*.md'
---

<!-- Earned against: Opus 4.8, 2026-06-09, v2.1.165 — history: CHANGELOG.md -->

# GitHub-Flavored Markdown

Default Markdown output renders, but it's shaped like an essay with headings — flat prose where a table would land faster, footguns buried in a sentence instead of an alert, long output inline instead of folded away — or it's decorated: emoji headers, a row of ten badges, a hand-typed table of contents on a one-screen doc. Both miss the point. This skill redirects attention to one question, asked for every block you add: **what does this content do for the reader, and which form does that job?** Then cut whatever's only there to look finished.

This governs structure and markdown form. If the `saltintesta` skill is available, use it alongside this one for the words themselves.

## The reader scans — shape to that

A README or doc is read by scanning and lookup, not start to finish. That decides the ordering and the forms:

- **Lead with what the reader does, not what the project is.** First line: what it is and who it's for, in one sentence. Then the one thing they came for (install / quickstart). Then usage. The long tail — config, contributing, license — last. Project history and motivation are not the opening.
- **Reach for the dense form when it packs more lookup-value per line than prose**, and only then. A table the reader jumps into beats three paragraphs they read in order.

## Feature → job

Pick the form by the shape of the content, not for variety. Each row is also a trap: the form is filler when the content doesn't have that shape.

| Form | Reach for it when the content is… | Not when it's… |
| :--- | :--- | :--- |
| **Table** | a comparison or lookup across a fixed set of fields (consistent columns, several rows) | 2–3 sentences dressed up as rows |
| **Alert** (`> [!NOTE]` …) | a callout the reader must not miss mid-scan — a prereq, footgun, or breaking change | an ordinary sentence you want to look important |
| **Collapsible** `<details>` | long secondary output — logs, full config, a verbose example — that would bury the primary content | content the reader actually needs in front of them |
| **Task list** `- [ ]` | an actionable checklist someone (or a PR) will track and tick | a styled bullet list nobody checks off |
| **Footnote** `[^1]` | a citation or aside that would break the sentence's flow | an aside that belongs in the sentence, or should be cut |
| **Fenced code** + language tag | any code, command, or config — always tag the language | prose that isn't code |
| **Diagram** (mermaid/geoJSON/…) | a relationship, flow, or sequence that prose describes poorly | a restatement of the paragraph above it |
| **Math** `$…$` / `$$…$$` | actual notation (GitHub renders the KaTeX subset) | decorative formatting |

**Pick the right alert** — the five types carry distinct meanings; don't use `NOTE` and `WARNING` for everything:

- `[!NOTE]` — info worth taking into account · `[!TIP]` — optional, helps the reader succeed · `[!IMPORTANT]` — crucial to succeed · `[!WARNING]` — needs immediate attention, there's risk · `[!CAUTION]` — the negative consequences of an action.

## GitHub-specific traps

These bite even when you know Markdown — and the model's default gets several wrong:

- **Alert syntax is exact.** A line with only `> [!NOTE]` (uppercase, in brackets), then the body on following `>` lines. The old `> **Note:**` bold form renders as a plain blockquote, not the colored box. The five types are the only ones — an invented sixth silently degrades to a blockquote.
- **Color swatches only render in issues, PRs, and discussions — not in repo .md files.** A backticked `#0969DA` / `rgb(...)` / `hsl(...)` shows a swatch in a comment but is plain code in a committed README. Don't rely on it in docs. *(Verified 2026-06-09; long-standing GitHub limitation.)*
- **Heading anchors are auto-generated** — lowercased, spaces → hyphens, most punctuation and all emoji dropped, duplicates suffixed `-1`. So emoji or punctuation in a heading makes its anchor unpredictable and breaks any hand-written `[link](#heading)` or table of contents. Keep headings you link to plain.
- **Tables hold inline content only** — no lists, no fenced blocks, no multiple paragraphs in a cell. Escape hatch: `<br>` for line breaks and a little inline HTML. Leave a blank line before the table or it won't render.
- **`<details>` needs a blank line after `</summary>`** (and before `</details>`), or the Markdown inside renders as literal text.
- **Fenced blocks need a blank line before them.** To show a fence *inside* a fence, the outer one needs more backticks than the inner.
- **Relative links resolve against wherever the file is served** — github.com, npm, raw, a docs site. A README republished to npm gets broken relative links; use root-relative or absolute URLs for links and images that must survive republishing.
- **Diagrams and math do render in .md files** (mermaid/geoJSON/topoJSON/ASCII-STL since 2022; KaTeX math too), not only in issues/PRs — so a flow diagram belongs in the README, not a screenshot of one.

## README skeleton

The ordering a scanning reader wants. Adapt, don't pad — a section with nothing to say is cut, not filled. (Outer fence is four backticks so the inner `bash` fence shows — the nested-fence trap, used on purpose.)

````markdown
# project-name

One sentence: what it does and who it's for.

> [!NOTE]
> A prerequisite or the one caveat that blocks a first run.

## Install

```bash
npm install project-name
```

## Usage

Smallest real example that does something — runnable, not a fragment.

## Configuration

| Option   | Default | Does |
| :------- | :------ | :--- |
| `port`   | `3000`  | Port the server binds to |
| `silent` | `false` | Suppresses startup logging |

<details><summary>Full config reference</summary>

The long, exhaustive table lives here — folded so it doesn't bury Usage.

</details>
````

## Cut the fluff

Every block has to earn its place — layout can be filler the same way a sentence can:

- **No marketing intro.** Not "X is a powerful, comprehensive, modern solution for…" — say what it is and move on.
- **No meta-narration.** "In this guide we'll cover…", "This document describes…" — just start.
- **Badges:** one or two that carry live status (build, version) earn their place; a row of ten is decoration.
- **Emoji in headings:** breaks anchors (above) and is usually decoration — drop it unless the project genuinely uses emoji as consistent labels.
- **Table of contents:** GitHub auto-generates one from the heading menu, so a hand-maintained TOC on anything short of a long doc is pure maintenance cost. Add one only past a few screens.
- **The layout-as-filler test:** a three-row table dressing up three sentences, a diagram restating the paragraph above, an alert around an ordinary line — cut them the way you'd cut a filler sentence.
