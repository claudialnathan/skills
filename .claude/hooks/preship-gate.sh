#!/bin/bash
# PreToolUse gate: run bin/preship-check for commit calls selected by the
# hook-level `if` predicate in .claude/settings.json.
#
# CLAUDE.md promises "run the preship check before commits" — this makes that
# a guarantee instead of a request (hooks for guarantees, skills for guidance).
# Exit 2 blocks the commit and feeds stderr back to Claude: fix, then retry.
# The predicate owns command filtering; this script only runs and reports.

set -uo pipefail

DIR="${CLAUDE_PROJECT_DIR:-.}"
GATE="$DIR/bin/preship-check"
if [[ ! -x "$GATE" ]]; then
  echo "preship-check could not run: $GATE is missing or not executable." >&2
  exit 2
fi

if OUT=$("$GATE" 2>&1); then
  exit 0
fi

{
  echo "preship-check failed — fix the findings below, then re-run the commit:"
  echo "$OUT"
} >&2
exit 2
