#!/bin/bash
# PreToolUse gate: run bin/preship-check before any `git commit` Bash call.
#
# CLAUDE.md promises "run the preship check before commits" — this makes that
# a guarantee instead of a request (hooks for guarantees, skills for guidance).
# Exit 2 blocks the commit and feeds stderr back to Claude: fix, then retry.
# Non-commit commands pass through silently.
# Approved by Claudia 2026-06-10 (harness-audit session).

set -uo pipefail

INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

case "$CMD" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

DIR="${CLAUDE_PROJECT_DIR:-.}"
GATE="$DIR/bin/preship-check"
[[ -x "$GATE" ]] || exit 0

if OUT=$("$GATE" 2>&1); then
  exit 0
fi

{
  echo "preship-check failed — fix the findings below, then re-run the commit:"
  echo "$OUT"
} >&2
exit 2
