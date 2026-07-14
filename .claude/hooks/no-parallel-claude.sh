#!/bin/bash
# PreToolUse gate: refuse agent-typed parallel / headless `claude` fan-out.
#
# The safe probe runners (bin/run-probes, bin/gen-probe) cap concurrency and gate
# on --confirm, but nothing stopped a session from bypassing them with raw shell.
# On 2026-07-08 one did — a hand-written `xargs -P 6 ... claude -p` wave drained a
# Max plan's session quota, then blindly relaunched on reset. Nested `claude -p`
# turns bill against the same account session limit as the interactive session,
# so parallel fan-out is a token bomb, not a speedup.
#
# This makes "don't fan out headless claude" a guarantee, not a request (hooks for
# guarantees, skills for guidance). Exit 2 blocks and feeds stderr back to Claude.
# The hook only sees agent-typed Bash; the sanctioned runners call `claude` in a
# child process the hook never intercepts, and are typed as `bin/run-probes ...`
# (no `claude` command word), so this never blocks the safe path.
#
# Deliberate human override for a single command:  PROBE_ALLOW_PARALLEL=1 <command>
# Earned against: Fable 5, 2026-07-08, v2.1.201

set -uo pipefail
[ "${PROBE_ALLOW_PARALLEL:-0}" = "1" ] && exit 0

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -n "$CMD" ] || exit 0

block() {
  {
    echo "BLOCKED: parallel/headless \`claude\` fan-out — the pattern that drained the plan on 2026-07-08."
    echo "Reason: $1"
    echo
    echo "Nested \`claude -p\` turns bill against the same session limit as this session."
    echo "Run probes the safe way instead:"
    echo "  bin/run-probes --dry-run             # see what would run, spend nothing"
    echo "  bin/grade-probe --all                # zero-token grade of existing outputs"
    echo "  bin/gen-probe   --confirm --only ID  # one cheap single-turn re-gen"
    echo "  bin/run-probes  --confirm --only ID  # one full agent replay (last resort)"
    echo
    echo "Never batch a full manifest in parallel. A human can override one command with PROBE_ALLOW_PARALLEL=1."
  } >&2
  exit 2
}

# 1. xargs parallel fan-out at concurrency >= 2
if echo "$CMD" | grep -Eq 'xargs[^|;&]*-P[[:space:]]*([2-9]|[1-9][0-9]+)'; then
  block "xargs -P with concurrency >= 2"
fi

# 2. GNU parallel
if echo "$CMD" | grep -Eq '(^|[[:space:];&|()])parallel[[:space:]]'; then
  block "GNU parallel invocation"
fi

# `claude` invoked as a command word (not the .claude dir or a claude-* path segment)
if echo "$CMD" | grep -Eq '(^|[[:space:];&|()]|env[[:space:]][^|;&]*)claude[[:space:]]'; then
  # 3. a claude command combined with any fan-out primitive
  if echo "$CMD" | grep -Eq '(xargs|(^|[[:space:]])for[[:space:]]|(^|[[:space:]])while[[:space:]]|&[[:space:]]*$|&[[:space:]]+claude)'; then
    block "a \`claude\` command combined with a loop / background / xargs fan-out"
  fi
  # 4. more than one claude command word in a single line (hand-rolled batch)
  n=$(echo "$CMD" | grep -Eo '(^|[[:space:];&|()])claude[[:space:]]' | wc -l | tr -d ' ')
  if [ "${n:-0}" -ge 2 ]; then
    block "multiple \`claude\` commands in one Bash call"
  fi
fi

exit 0
