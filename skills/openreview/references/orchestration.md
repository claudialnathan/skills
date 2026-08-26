# Bounded whole-codebase orchestration

Use this reference only when the repository map is too large for one careful
context or the owner explicitly requested workflows or subagents. Parallelism
is for independent reading and verification; it is not evidence by itself.

## Build review units

Partition by subsystem, entry point, trust boundary, persistence/mutation path,
or shared owner. Do not create one worker per file. Give every worker:

- the exact directories and cross-boundary callers it owns;
- the relevant project rules and skill bodies, not the entire skill catalog;
- the selected central check results rather than instructions to rerun them;
- read-only tools during discovery; and
- the same structured result fields: state, impact, finding, location, required
  action, evidence, and missing evidence.

Start one representative unit first. Use its coverage and cost to size the rest.
Unless the owner supplied a different budget, dispatch at most three reviewer
workers in the run and reserve the final quarter of any visible token or cost
budget for reopening evidence, deduplication, and the final ledger. When the
harness exposes no aggregate budget control, the worker limit is the guardrail.

The coordinator owns the repository map and final proof. Reopen every cited
location before accepting a worker finding. Verify related candidates together;
do not create another model call for every individual row. A missing worker
result becomes `Unconfirmed` coverage rather than disappearing.

## Claude Code

Verified on 2026-08-26 with Claude Code v2.1.243. Dynamic workflows can keep
intermediate results in script variables, show per-phase token usage, and share
prompt-cache prefixes across matching workers. Their size guideline is advice,
not a hard cost cap, and their workers run with edits accepted. Use a workflow
only when its workers can be restricted to read-only discovery or verification;
return to the main session for Action mode and owner decisions.

Prefer a small workflow with one mapping phase, a bounded review fan-out, and
one synthesis/verification phase. Do not enable session-wide `ultracode` for
this skill: it can create several workflows for one request and increases token
use. See the maintained [dynamic workflows documentation](https://code.claude.com/docs/en/workflows)
before relying on version-specific syntax or limits.

## Codex and other harnesses

Use the harness's bounded subagent mechanism when available. Reviewer workers
remain read-only and return only their structured findings; the parent keeps the
map, deduplicates, reopens evidence, and owns Action mode. Do not assume a fixed
worker count from another harness: stay within the three-reviewer skill budget
and the current session's actual concurrency limit.

When no isolated worker mechanism exists, review the same units serially. Do
not reduce the evidence or output contract merely because execution is serial.
