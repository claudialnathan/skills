<!-- ui-preship:start -->
Before committing UI changes, run the repository's `ui-preship` script.
Treat deterministic failures as blockers only when they qualify under the
repository's active blocking mode. Treat static signals as review prompts and
unrun runtime checks as unverified. Do not auto-fix product or visual decisions.
Re-run the exact reported command after remediation.
<!-- ui-preship:end -->
