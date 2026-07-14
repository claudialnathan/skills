#!/usr/bin/env bash
# One probe run in a fresh fixture copy. Captures stdout + git diff.
# Called by run-probes.sh — do not batch this directly without that script's guardrails.
set -euo pipefail

usage() {
  cat <<'EOF'
usage: run-probe.sh --scratchpad DIR --run-id ID --fixture NAME --mode unaided|skill \
                    --prompt-file PATH [--skill NAME] [--max-turns N]
EOF
  exit 2
}

SP=""
RUNID=""
FIXTURE=""
MODE=""
SKILL=""
MAXTURNS=12
PROMPTFILE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --scratchpad) SP="$2"; shift 2 ;;
    --run-id) RUNID="$2"; shift 2 ;;
    --fixture) FIXTURE="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --skill) SKILL="$2"; shift 2 ;;
    --max-turns) MAXTURNS="$2"; shift 2 ;;
    --prompt-file) PROMPTFILE="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "unknown arg: $1" >&2; usage ;;
  esac
done

[ -n "$SP" ] && [ -n "$RUNID" ] && [ -n "$FIXTURE" ] && [ -n "$MODE" ] && [ -n "$PROMPTFILE" ] || usage
[ -d "$SP/fixtures/$FIXTURE" ] || { echo "missing fixture: $SP/fixtures/$FIXTURE" >&2; exit 1; }
[ -f "$PROMPTFILE" ] || { echo "missing prompt file: $PROMPTFILE" >&2; exit 1; }

REPO="$(cd "$(dirname "$0")/.." && pwd)"

RUN="$SP/runs/$RUNID"
rm -rf "$RUN"
mkdir -p "$SP/runs"
cp -R "$SP/fixtures/$FIXTURE" "$RUN"

mkdir -p "$RUN/.claude"
cat > "$RUN/.claude/settings.local.json" <<'EOF'
{
  "permissions": {
    "allow": [
      "Read", "Edit", "Write", "Glob", "Grep",
      "Bash(git:*)", "Bash(ls:*)", "Bash(cat:*)", "Bash(find:*)",
      "Bash(head:*)", "Bash(tail:*)", "Bash(wc:*)", "Bash(grep:*)"
    ]
  },
  "enabledPlugins": { "skills@claudia": false, "agent-kitchen@claudia": false }
}
EOF

PROMPT="$(cat "$PROMPTFILE")"
FLAGS=(--model fable --max-turns "$MAXTURNS" --permission-mode acceptEdits)
if [ "$MODE" = "unaided" ]; then
  FLAGS+=(--safe-mode)
else
  [ -n "$SKILL" ] || { echo "--skill required for skill mode" >&2; exit 1; }
  mkdir -p "$RUN/.claude/skills"
  cp -R "$REPO/skills/$SKILL" "$RUN/.claude/skills/$SKILL"
  PROMPT="$PROMPT

Use the $SKILL skill."
fi

cd "$RUN"
git add -A >/dev/null 2>&1
git -c user.name=fixture -c user.email=f@local commit -qm "pre-run" --no-verify >/dev/null 2>&1 || true

START=$(date +%s)
set +e
# Each probe is its own billed CLI turn — do not inherit nested-session env.
# ANTHROPIC_OAUTH_TOKEN is session-scoped when run from inside a Claude Code
# session; inheriting it 401s the nested CLI. Fall back to stored login.
env -u CLAUDECODE -u ANTHROPIC_OAUTH_TOKEN claude "${FLAGS[@]}" -p "$PROMPT" > "$RUN/OUTPUT.md" 2> "$RUN/STDERR.txt"
CODE=$?
set -e
END=$(date +%s)

git add -A >/dev/null 2>&1
git diff --cached -- . ':(exclude).claude' ':(exclude)OUTPUT.md' ':(exclude)STDERR.txt' > "$RUN/DIFF.patch" 2>/dev/null || true

echo "=== $RUNID done: exit=$CODE, $(( END - START ))s, diff=$(wc -l < "$RUN/DIFF.patch" | tr -d ' ') lines, output=$(wc -l < "$RUN/OUTPUT.md" | tr -d ' ') lines"
