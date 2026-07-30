# Approved static-depth finding

Correct only the activity card's approved depth treatment:

- replace its raw shadow value with `var(--shadow-card)`;
- preserve the border, radius, spacing, content, and interaction behavior.

The evaluator will run a deterministic source check. No browser or screenshot
tool is available, so rendered verification must remain unverified.
