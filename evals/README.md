# evals — probe replay harness

The runnable half of the "each skill is provable" discipline (see `../CLAUDE.md`). Each
skill keeps its gap as a fixture in `skills/<name>/evals/probes.md`: the verbatim prompt,
what the bare model gets wrong, the pass criterion, and a per-model baseline verdict table.
On each model release the probes replay against the bare model in a near-clean session;
when a skill's probes all pass unaided, the model has absorbed the skill's job and the skill
is deleted.

## The runners

Thin `bin/` wrappers drive the scripts here:

- `bin/gen-probe`  → `evals/gen-probe.sh`  — build a probe prompt from a skill's `probes.md`.
- `bin/run-probes` → `evals/run-probes.sh` — batch-replay probes into fresh fixtures (guardrailed:
  sequential by default, live runs need `--confirm`; run `bin/run-probes --dry-run` first).
- `bin/grade-probe`→ `evals/grade-probe.js`— grade existing run outputs against the `probes.md`
  criteria (free — prefer this over re-running).
- `evals/run-probe.sh` — one probe run in a fresh fixture copy (called by `run-probes.sh`).
- `evals/publish-readiness-batch.txt` — the run manifest.

These mirror the kitchen's forge eval machinery (`agent-kitchen`'s `skills/forge/evals/`), where
the *design-time* evals (trigger / invocation / depth) also live. The record of truth is the
`probes.md` verdict table plus `CHANGELOG.md`; run outputs and recorded baselines are re-runnable
and stay gitignored (`--safe-mode` still leaks some account context, so a raw baseline is never
authoritative on its own).
