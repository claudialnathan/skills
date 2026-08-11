#!/bin/bash
# PreToolUse gate: run repository verification for commit calls selected by
# the hook-level `if` predicate in .claude/settings.json.
#
# AGENTS.md promises verification before commits — this makes that
# a guarantee instead of a request (hooks for guarantees, skills for guidance).
# Exit 2 blocks the commit and feeds stderr back to Claude: fix, then retry.
# The predicate owns command filtering; this script only runs and reports.

set -uo pipefail

DIR="${CLAUDE_PROJECT_DIR:-.}"
CHECKS=(
  "scripts/test-preship-check"
  "scripts/test-token-audit"
  "scripts/preship-check"
)

for RELATIVE in "${CHECKS[@]}"; do
  COMMAND="$DIR/$RELATIVE"
  if [[ ! -x "$COMMAND" ]]; then
    echo "$RELATIVE could not run: $COMMAND is missing or not executable." >&2
    exit 2
  fi

  if ! OUT=$("$COMMAND" 2>&1); then
    {
      echo "$RELATIVE failed — fix the findings below, then re-run the commit:"
      echo "$OUT"
    } >&2
    exit 2
  fi
done
