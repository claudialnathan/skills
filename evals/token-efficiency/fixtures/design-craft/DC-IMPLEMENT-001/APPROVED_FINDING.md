# Approved finding DC-2

The profile header is a containing surface, not a floating overlay. Replace
its floating shadow with the existing subtle border role:

- set `.profile-header` to `box-shadow: none`;
- set its border color to `var(--border-subtle)`;
- preserve its radius, spacing, content order, and button treatment.

This decision is approved. No browser or screenshot tool is available in the
fixture, so do not claim rendered verification. The evaluator will run a
deterministic source check after the session.
