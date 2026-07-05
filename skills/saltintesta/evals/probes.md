# saltintesta — earning-failure probes

Runnable re-test fixtures for a **taste skill** — calibration differs from expertise probes. The named tells (from `antipatterns.md`) are the mechanical floor a judge or grep can check; the ceiling — *does it read like the owner's voice* — is judged by the owner, and an owner verdict overrides a mechanical pass. Run each prompt in a fresh unaided session (`claude --safe-mode`), then with the skill.

**Deletion rule: all probes must pass unaided on the mechanical tells AND the owner accepts the unaided output.** The second condition is the real bar; the tells only make the first cheap to check.

---

## Probe 1 — short post from a bare topic

**Prompt:** "Write a short post on why we moved this app from Postgres to SQLite."

- **Failure signatures:** throat-clearing open ("In today's world of…", "When it comes to databases…"); the claim withheld for a reveal; matched-pair sentences ("It's not just X — it's Y"); the same idea restated in new clothes; a summary outro; hedged verdicts.
- **Pass criterion:** the claim lands in the first two sentences; talk register throughout; each sentence reaches ground the last didn't; ends pointing somewhere new or just stops.

## Probe 2 — tighten supplied flab

**Prompt:** "Tighten this up:" followed by this fixture paragraph:

> In today's rapidly evolving development landscape, it's becoming increasingly important to carefully consider the various tradeoffs associated with different deployment strategies. There are a number of factors that teams should potentially take into account. Ultimately, at the end of the day, the decision comes down to what makes the most sense for your specific use case and requirements, which can vary significantly from one organization to the next.

- **Failure signatures:** shortens but keeps the corporate register; preserves hedges ("potentially", "can vary"); restates rather than deletes; the paragraph still says nothing.
- **Pass criterion:** recognizes the paragraph has no claim and says so (or extracts the one real idea in a sentence or two of speech register). The honest verdict beats a fluent compression of emptiness.

## Probe 3 — announcement copy

**Prompt:** "Write the launch tweet and a short changelog-page paragraph for our new export feature."

- **Failure signatures:** "We're excited to announce"; exclamation inflation; superlatives ("powerful", "seamless", "supercharge"); features listed as marketing rather than stated as facts.
- **Pass criterion:** plain statement of what it does and who it's for; the reader can tell what changed without adjectives.

---

## Calibration note

Record two columns per run: the mechanical verdict (tells present/absent) and the owner verdict (accepted / rejected, one line why). Divergence between them is signal about the *tells list*, not noise — a mechanically-clean output the owner rejects means `antipatterns.md` is missing a tell; harvest it.

## Baseline verdicts

| Probe | Opus 4.8 — tells | Opus 4.8 — owner | 2026-07-05, Fable 5 — tells | Fable 5 — owner |
| :--- | :--- | :--- | :--- | :--- |
| 1 bare topic | not yet run | — | pass, borderline (no throat-clearing, claim early; but H2 scaffolding + bold-listicle body on a "short post" is heavier structure than form-follows-idea would produce) | **pending owner** |
| 2 tighten flab | not yet run | — | **pass** (named the paragraph "all frame and no content", offered the one-sentence version, asked for the real factors) | **pending owner** |
| 3 announcement | not yet run | — | pass, borderline (no "excited", no superlative inflation, assumptions flagged; mild marketing cadence — "One click, all your data", emoji) | **pending owner** |

No unaided baseline recorded at authoring.

Run log — 2026-07-05 (Fable 5, v2.1.201): `claude --safe-mode --model fable -p`, n=1 per probe. Outputs preserved for owner grading. Caveat discovered on this run: `--safe-mode` does **not** strip account-level context — probe 3's unaided output knew the owner's product domain, so the baseline is not a perfect clean room. Mechanical verdict alone cannot decide this skill; the owner columns rule.
