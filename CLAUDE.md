This repo holds the owner's applied Claude Code skills — the artifacts that have survived several seasons of models and audits. They are designed, probed, and pruned in the **agent-kitchen** repo (the kitchen: forge, harness-audit, harvest, ingest); this repo is what survived. Every fact, rule, and opinion here is perishable — nothing holds higher authority than what the code shows today. If a statement here contradicts the code, the code is authoritative; flag the drift before relying on the rule.

## What earns a place here

A frontier model's default in any domain is the competent-average version of the thing. Each skill here is a commitment that drags the model off that median in a chosen direction, and it competes with two forces only: the unaided frontier model (which absorbs generic craft every release) and the owner's time (which every skill charges rent on).

The standing claim this repo holds itself to: **each expertise or taste skill is built to be provable — it earns its place only by beating the unaided current model on the gap that created it, checked by a runnable probe (`evals/probes.md`), not assumed.** Deletion is the expected end of every such artifact, not a failure of one. Process skills (changelog, quality-audit, advisor, retest) are exempt — their value is the owner wanting the procedure, which no release absorbs, so they carry no probe and no deletion rule.

- Each such skill keeps the gap that earned it as a runnable fixture in `evals/probes.md`: the verbatim prompt, what the bare model gets wrong, the pass criterion, and a per-model baseline verdict table.
- On each model release the probes replay against the bare model in a near-clean session (`--safe-mode` still leaks some account context). Verdicts land in the per-model table and CHANGELOG.md. When every probe passes unaided, the model has absorbed the skill's job and the skill is deleted.
- Absorption is not monotonic: a case one model absorbed can regress on the next model line, so probes never retire while the skill lives.
- The probe runners live in `evals/` with thin `bin/` wrappers (they mirror the kitchen's forge eval machinery — see `evals/README.md`). The record of truth is the `probes.md` verdict table plus CHANGELOG.md; raw baseline outputs are re-runnable and stay gitignored.

## Model-version pinning and provenance

Skills are earned against a specific model. Both the gap and the model move. The discipline:

- Each non-trivial skill carries a **one-line** pin near the top of its body: `<!-- Earned against: <model>, <YYYY-MM-DD>, <CC version> -->`. The pin is a trigger, not a history — the earning event only. `re-tested`/`revised` clauses read like pin material but they are history and go to CHANGELOG.md. `bin/preship-check` warns when a pin outgrows one line or gains a second event.
- Everything else — why the skill exists, sunset triggers, re-test verdicts, eval results — lives in **CHANGELOG.md** (committed, newest-first, keyed by date and model state). Reference skills by name and section, not line numbers.
- A pinned model can be **withdrawn**, not just superseded; a pin to an unreachable model is a dead trigger — re-pin those to the period's durable default and record the withdrawal in CHANGELOG.md.
- **Skills do not reference the conversation that produced them** — no session narration, no addressing the reader, no quoting requests. Write provenance as neutral fact in the changelog and the skill's README `src:` links. Canonical doc URLs the agent can verify against mid-task are the exception — they direct action.

## Authoring footgun: skill loader trigger sequences

The skill loader scans file contents for dynamic-context-injection markers regardless of markdown context. Two byte sequences are intercepted as shell commands and break loading: a triple-backtick followed immediately by an exclamation mark, and an exclamation mark followed immediately by a backtick. Code fences, inline-code spans, and block quotes do not protect against the scan. This applies to any file inside a skill directory, not just `SKILL.md`. `bin/preship-check` greps for both; a committed PreToolUse hook runs it on every `git commit` and blocks on failure.

## Publishing footgun: keep the plugin versionless (commit-SHA versioning)

The `skills` plugin carries **no `version` field** — not in `.claude-plugin/plugin.json`, and not in the `claudia` marketplace entry (that entry lives in the **agent-kitchen** repo, which hosts the marketplace and points its `skills` plugin source at this repo). That keeps Claude Code in commit-SHA versioning: every pushed commit is a new version, so a marketplace install picks up skill changes on the next `/plugin update` with no manual bump. **Do not add a `version` field.** A `version` string pins the install cache, `/plugin update` then reports "already at the latest version," and pushed changes silently never reach other repos. `bin/preship-check` fails if a `version` field reappears. Propagation after a change: commit → push → `/plugin marketplace update claudia` → `/plugin update skills@claudia`.

## Dates

Use absolute YYYY-MM-DD in skills, references, and CHANGELOG. Relative phrases ("last month", "recently") rot fast. For artifacts tied to Claude Code behavior, also record the Claude Code version from `code.claude.com/docs/en/changelog`, e.g. `2026-07-14, v2.1.207` — the version scopes which features were live when the artifact was earned.

## Other

- When a skill name here collides with one at `~/.claude/skills/<name>`, flag it and ask the owner how to proceed — personal scope shadows the plugin, so pushed changes won't win. `bin/preship-check` warns on the collision.
- Authoring never writes machine-scope config (anything under `~/.claude/`, user or enterprise settings, global plugins); machine-scope findings are reported for the owner to action. `bin/sync-cross-tool` manages the cross-tool skill mirrors (`~/.cursor`, `~/.codex`) and the repo-local `.claude/skills/`, and is run deliberately by the owner.
