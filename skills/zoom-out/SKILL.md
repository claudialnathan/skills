---
name: zoom-out
description: Conducts a zoomed-out strategic review of a whole project, harness, or body of work against its actual purpose. Treats the project's own docs as testimony to test rather than authority, strips the reviewer's own context bias with clean-context checks, re-derives what the work really competes with, follows where effort actually went versus where the mission needs it, sorts hygiene from strategy, extrapolates forward from the evidence to what the work could become, actions reversible decisions instead of returning option menus, and compresses the verdict into one sentence. Use when asked to zoom out, step back, reassess what actually matters, question whether a project still serves its purpose, give a fresh-eyes or unbiased assessment, imagine what a project could become, or check the center of gravity after a long stretch of maintenance work.
---

# zoom-out

<!-- Earned against: Fable 5 (claude-fable-5), 2026-07-06, v2.1.201 — history: CHANGELOG.md -->

The training-default response to "review this project and tell me what matters" is a compliance pass: take the project's stated goals as given, grade the work against them, list strengths and improvements in balanced proportion, and hand every real decision back as a question. Competent, symmetric, and useless at the exact moment it's needed — when the frame itself has drifted.

**The attention shift this skill makes: authority moves from the project's self-description to the evidence, and the deliverable moves from options to decisions.**

## Drop the claimed authority

Every README, CLAUDE.md, mission statement, and process doc is testimony from a past author under conditions that may no longer hold. The filesystem, the history, and the shipped output are the evidence. Where testimony and evidence disagree, the evidence wins, and the disagreement is itself a finding — usually a load-bearing one. No document is exempt, including the ones that proclaim what is "best" or "right", and including the framing of the review request itself.

## Strip your own context

The project's bias is only half the problem; the reviewer arrives contaminated. A session that produced work is the worst judge of it — sunk cost, agreement with the person asking, and the story the context window has been telling itself all pull toward a kind review. Use mechanism, not willpower: dispatch a clean-context subagent that gets only the evidence — files and history, no framing — and ask what the project appears to be for and where the effort goes; where its cold read diverges from the docs' story or from your own session-formed view, the divergence is a finding. For head-to-head claims, compare blind: an independent judge on unlabeled outputs. And write the verdict you would give a stranger's project before softening anything; if the softened version differs, report the stranger's.

## Question the question

A stated goal names an opponent, a metric, and a direction, and any of the three can be wrong. Before grading anything, re-derive them: if this project vanished tomorrow, what would its owner actually lose? What improves without it and will eventually absorb its job? The named rival is rarely the real opponent — the real ones are usually a moving baseline (whatever gets better while the project stands still) and the owner's finite time. State the real opponents explicitly; every judgment downstream inherits them. When the request itself aims at the wrong target, say so before answering it — a precise answer to the wrong question is the expensive kind of wrong.

## Follow the effort, not the story

Read the history — commit log, changelogs, what recent work actually produced — and total where effort went, then compare against where the re-derived mission needs it. A project can be locally excellent at every task while its center of gravity sits on the wrong layer; that failure is invisible from inside any single task, which is exactly why no one has named it. Name the ratio in one sentence. "Competent maintenance of the wrong center of gravity" is a verdict; "some areas could be improved" is not.

## Hygiene is not strategy

Sort what the review finds into three piles: **strategy** (moves the mission), **hygiene** (correct, cheap, worth keeping — but progress on it is not progress), and **ceremony** (apparatus that serves itself). The sorting must be asymmetric: a review that concludes everything matters at slightly different weights has failed. Deciding what matters means deciding what doesn't, and saying it.

## Promote the buried best idea

Somewhere in the work there is usually an idea better than the position it holds — invented ad hoc for one artifact, living in a tail section or a one-off script, never given a structural role. Finding it and promoting it is the highest-leverage single move a zoomed-out review can make, because it costs nothing new: the project already proved the idea works. Look deliberately where incremental review never reads — appendices, tails, scratch tooling.

## Imagine what could be

Diagnosis is half the review; the inventor's move is the other half. From what the evidence shows actually works — the assets, the buried ideas, the trajectory — extrapolate forward: what doesn't exist yet but has just become cheap to build, what doors the strongest assets open, what the project would look like if its best idea were the organizing principle instead of a footnote. Ground every imagined thing in something observed on the bench — inventors recombine real parts, and vision that cites no evidence is decoration. Name these as direction rather than commitment, respecting whatever gates the project keeps on new construction. But name them: a review that only grades the past has done half its job.

## Decide, then show the decision

Action what is reversible and present the decisions taken, each with its reason and its revert path — not an options menu. Questions back to the owner are reserved for genuinely irreversible or scope-changing calls. Rank whatever remains. Deference reads as rigor but is its opposite: leaving every call open hands the workload back to the person who asked to be relieved of it.

## Question yourself, in writing

The review ends on its own epistemics, stated plainly: what was read deeply versus known only from descriptions and greps, with claims confidence-marked accordingly; which of the review's own frames could be self-serving — the meta-frame is the classic, since it can become an excuse to build machinery instead of doing the harder editorial work; and which unilateral calls are one edit to revert. Then compress the whole review into one sentence. If it won't compress, there is no verdict yet — only notes.

## Anti-patterns

- **The symmetric review.** Strengths and weaknesses in balanced proportion is a shape, not a finding. Honest assessments are lopsided.
- **Grading what is easy to measure.** Structure, hygiene, and polish can be graded at a glance; whether the work serves the mission takes the whole review. Grade that first, or it is the one thing that goes ungraded.
- **Frame-taking.** Accepting the project's self-description as the constraints of the review. The self-description is inside the blast radius.
- **The options menu.** "Would you like me to A, B, or C?" on reversible work defers the exact decision the review was asked to make.
- **Machinery as deliverable.** Proposing new process is a finding only when that process demonstrably grades or improves the output; otherwise the review is adding ceremony of its own.
- **The kind review.** Softening the verdict for the person in the room, or for work this session produced, is bias wearing manners. The stranger-project verdict is the honest one.
- **Vision without a bench.** Forward claims that cite no observed asset are decoration, not invention.
- **Confident claims about unread work.** Portfolio-level verdicts built on skims must say so.

## When this stops earning its keep

The runnable re-test lives in [evals/probes.md](evals/probes.md) — four probes covering frame-taking, deference, effort-versus-story, and the inventor move, with per-model baseline verdicts. Deletion requires all probes passing unaided, and passing tells alone is not enough: decide-over-defer and question-the-question are owner preference as much as technique, so the owner column governs the final call.
