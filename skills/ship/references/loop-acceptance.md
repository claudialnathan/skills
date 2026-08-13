# Loop acceptance scenarios

Given/Then tests for the loop in [pr-stabilization.md](pr-stabilization.md). Run them when you change that workflow.

- **Given a required CI failure,** then read the logs, fix the cause, verify locally, push, and restart the loop on the new head.
- **Given a green React Doctor or other bot check,** then open it with `--show check:<id>` whenever its entry shows a non-zero `textChars`, treat warnings in the full output as findings despite the conclusion, and never call it clean off the snippet alone.
- **Given a fix diff whose only change against a finding is an ignore comment, an allowlist entry, or a severity downgrade,** then revert it and either fix the cause or ask. Don't commit it, and don't report the finding fixed.
- **Given a finding whose only available answer is a suppression,** then ask the owner rather than approving one yourself.
- **Given a late inline Bugbot or other bot comment,** then catch it through a changed `actionableFingerprint` and restart if it's actionable.
- **Given a green Vercel review with zero suggestions,** then record it as clean informational evidence.
- **Given a finding a follow-up fix made outdated,** then confirm it's obsolete on the new head and don't count it as unresolved.
- **Given a new head commit,** then throw away the previous cycle's clean claim and run everything again.
- **Given a bot that edits its deployment comment every minute,** then re-read that comment, keep `actionableFingerprint` stable, and converge.
- **Given a check still queued after the wait budget,** then inventory, act on what finished, and wait again next round; report it as the blocker only after two rounds with no progress.
- **Given a failed preview deployment while every check run is green,** then read the build log, fix the cause in the branch, push, and wait for the new deployment rather than ending the turn or reporting ready.
- **Given a fixed finding from a provider with no thread to reply to,** then post the per-head conversation comment naming the finding, the cause, the fix commit and the new conclusion, before reporting ready.
- **Given an accessibility, `prefer-useReducer` or `no-giant-component` finding on a PR nobody has opened in a browser,** then fix it and verify the behavior afterwards, or ask if the fix outgrows what you're shipping. Don't reclassify it as a suggestion and report ready.
- **Given `BLOCKED` plus `REVIEW_REQUIRED` with all checks green,** then report it ready and awaiting human review rather than trying to clear the block.
- **Given `DIRTY` or `BEHIND`,** then stop and ask before touching the branch.
- **Given a third stabilization round that fixed something,** then keep going; a productive round doesn't spend a budget.
- **Given two consecutive rounds with no fix landed and no provider result returned,** then stop, report what's left, and ask before continuing.
- **Given a finding whose fix is pushed and verified but not answered on the PR,** then post the answer before reporting ready.
- **Given no explicit merge request in this conversation,** then leave the PR open and unmerged, in every scenario.
