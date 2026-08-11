# Imported traces

Imports are opt-in local inputs to `scripts/token-eval --validate-run` or
`--compare-runs`. Do not commit provider traces, prompts, responses, raw
stdout/stderr, environment captures, account data, quota data, billing data, or
credentials here.

Convert an admissible source into the redacted run schema outside this
directory. Preserve metric provenance and an evidence digest; do not relabel an
estimate as observed or provider-reported. Missing evidence remains
`unavailable`.
