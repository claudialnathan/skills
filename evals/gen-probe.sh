#!/usr/bin/env bash
# Cheap single-turn probe generation — no agent exploration loop.
# Uses claude -p with tools disabled and fixture context inlined in the prompt.
#
#   bin/gen-probe --dry-run --run-id zo1-un
#   bin/gen-probe --confirm --run-id zo1-un
#   bin/gen-probe --confirm --only zo1-un,zo2-un
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$ROOT" ] || ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVAL_DIR="$ROOT/evals"
DEFAULT_MANIFEST="$EVAL_DIR/publish-readiness-batch.txt"
DEFAULT_SCRATCHPAD="$ROOT/.eval-runs"

MANIFEST="$DEFAULT_MANIFEST"
SCRATCHPAD="${PROBE_SCRATCHPAD:-$DEFAULT_SCRATCHPAD}"
CONFIRM=0
DRY_RUN=0
ONLY=""
MODEL="${PROBE_MODEL:-sonnet}"
MAX_TURNS=1

usage() {
  cat <<EOF
usage: $(basename "$0") [--dry-run] [--confirm] [--scratchpad DIR] [--manifest FILE]
       [--run-id ID | --only id1,id2] [--model MODEL]

One live turn per probe (~5–20k tokens vs ~100–300k for full agent runs).
Transcript probes (zo*, sa*): repo context bundled inline, --tools "".
Code probes (sd*, fm*, de*, st*): key files inlined; model returns edited files as fenced blocks.

Requires --confirm or PROBE_RUN_CONFIRM=1 for live runs.
EOF
  exit 2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --manifest) MANIFEST="$2"; shift 2 ;;
    --scratchpad) SCRATCHPAD="$2"; shift 2 ;;
    --confirm) CONFIRM=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --only) ONLY="$2"; shift 2 ;;
    --run-id) ONLY="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "unknown arg: $1" >&2; usage ;;
  esac
done

bundle_transcript_fixture() {
  local fixture="$1"
  local dir="$SCRATCHPAD/fixtures/$fixture"
  {
    echo "## README"
    cat "$dir/README.md" 2>/dev/null || true
    echo
    echo "## package.json"
    cat "$dir/package.json" 2>/dev/null || true
    echo
    echo "## src/cli.js"
    cat "$dir/src/cli.js" 2>/dev/null || true
    echo
    echo "## src/usage-metrics.js"
    cat "$dir/src/usage-metrics.js" 2>/dev/null || true
    echo
    echo "## scripts/reconstruct.js (excerpt)"
    head -n 40 "$dir/scripts/reconstruct.js" 2>/dev/null || true
    echo
    echo "## git log --oneline (recent)"
    git -C "$dir" log --oneline 2>/dev/null | head -n 25 || true
  }
}

bundle_code_fixture() {
  local fixture="$1"
  local stem="$2"
  local dir="$SCRATCHPAD/fixtures/$fixture"
  case "$stem" in
    sd*)
      echo "## src/IssuesList.tsx"
      cat "$dir/src/IssuesList.tsx"
      echo
      echo "## src/api.ts"
      cat "$dir/src/api.ts" 2>/dev/null || true
      ;;
    fm*)
      echo "## README.md"
      cat "$dir/README.md"
      ;;
    de*|st*)
      echo "## app/globals.css"
      cat "$dir/app/globals.css" 2>/dev/null || true
      echo
      echo "## components/ui/dialog.tsx"
      cat "$dir/components/ui/dialog.tsx" 2>/dev/null || true
      echo
      echo "## components/metric-tile.tsx"
      cat "$dir/components/metric-tile.tsx" 2>/dev/null || true
      ;;
    *)
      find "$dir" -type f ! -path '*/.git/*' | head -n 8 | while read -r f; do
        echo "## ${f#$dir/}"
        cat "$f"
        echo
      done
      ;;
  esac
}

lookup_manifest_line() {
  local id="$1"
  awk -v id="$id" '$1 == id { print; exit }' "$MANIFEST"
}

run_one() {
  local line="$1"
  read -r id fixture mode skill _turns prompt <<< "$line"
  local prompt_file="$SCRATCHPAD/prompts/${prompt}.txt"
  local run_dir="$SCRATCHPAD/runs/$id"
  local task
  task="$(cat "$prompt_file")"

  local prefix="${id%%-*}"
  prefix="${prefix:0:2}"
  local bundle=""
  if [[ "$prefix" == "zo" || "$prefix" == "sa" ]]; then
    bundle="$(bundle_transcript_fixture "$fixture")"
  else
    bundle="$(bundle_code_fixture "$fixture" "$prompt")"
  fi

  local skill_block=""
  if [ "$mode" = "skill" ]; then
    skill_block="$(cat "$ROOT/skills/$skill/SKILL.md")"
  fi

  mkdir -p "$run_dir"
  local system="You are running a probe evaluation. Reply with your answer only."
  if [ -n "$skill_block" ]; then
    system="$system Follow the skill below.

$skill_block"
  fi

  local user="Context from the fixture repo:

$bundle

Task (answer directly — for code tasks return complete modified files as fenced code blocks labeled with paths; for review tasks return analysis only):
$task"

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "WOULD RUN: $id ($mode, model=$MODEL, max-turns=$MAX_TURNS, tools=none)"
    echo "  prompt chars: $(wc -c <<< "$user" | tr -d ' ')"
    return 0
  fi

  local flags=(--print --model "$MODEL" --max-turns "$MAX_TURNS" --tools "")
  if [ "$mode" = "unaided" ]; then
    flags+=(--safe-mode)
  fi

  # ANTHROPIC_OAUTH_TOKEN is session-scoped when run from inside a Claude Code
  # session; inheriting it 401s the nested CLI. Fall back to stored login.
  env -u CLAUDECODE -u ANTHROPIC_OAUTH_TOKEN claude "${flags[@]}" \
    --append-system-prompt "$system" \
    -p "$user" < /dev/null > "$run_dir/OUTPUT.md" 2> "$run_dir/STDERR.txt" || true

  : > "$run_dir/DIFF.patch"
  echo "=== $id gen done: output=$(wc -l < "$run_dir/OUTPUT.md" | tr -d ' ') lines"
  if grep -qi "session limit" "$run_dir/OUTPUT.md" 2>/dev/null; then
    echo "STOP: $id hit session limit — run again after reset" >&2
    return 42
  fi
}

filter_only() {
  local id="$1"
  [ -z "$ONLY" ] && return 0
  local IFS=,
  local part
  for part in $ONLY; do
    [ "$part" = "$id" ] && return 0
  done
  return 1
}

lines=()
if [ -n "$ONLY" ]; then
  IFS=',' read -r -a ids <<< "$ONLY"
  for id in "${ids[@]}"; do
    line="$(lookup_manifest_line "$id")"
    [ -n "$line" ] && lines+=("$line")
  done
else
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [ -n "$line" ] && lines+=("$line")
  done < "$MANIFEST"
fi

[ "${#lines[@]}" -gt 0 ] || { echo "no matching manifest lines" >&2; exit 1; }

if [ "$CONFIRM" -ne 1 ] && [ "${PROBE_RUN_CONFIRM:-0}" != "1" ] && [ "$DRY_RUN" -ne 1 ]; then
  echo "Refusing live gen without --confirm (or PROBE_RUN_CONFIRM=1)." >&2
  exit 1
fi

for line in "${lines[@]}"; do
  read -r id _ <<< "$line"
  filter_only "$id" || continue
  run_one "$line" || exit 42
done

if [ "$DRY_RUN" -ne 1 ]; then
  echo "Grade with: bin/grade-probe --all --scratchpad $SCRATCHPAD"
fi
