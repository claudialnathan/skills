#!/usr/bin/env bash
# Safe batch runner for evals/probes.md replay. Sequential by default; opt-in parallelism.
#
# Each line in the manifest:
#   <run-id> <fixture> <unaided|skill> <skill-name> <max-turns> <prompt-stem>
#
# Examples:
#   bin/run-probes --dry-run
#   bin/run-probes --status
#   bin/run-probes --confirm --only zo1-un,zo2-un
#   bin/run-probes --confirm --concurrency 1 --manifest evals/publish-readiness-batch.txt
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$ROOT" ] || ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVAL_DIR="$ROOT/evals"
PROBE_SH="$EVAL_DIR/run-probe.sh"
DEFAULT_MANIFEST="$EVAL_DIR/publish-readiness-batch.txt"
DEFAULT_SCRATCHPAD="$ROOT/.eval-runs"

MANIFEST="$DEFAULT_MANIFEST"
SCRATCHPAD="${PROBE_SCRATCHPAD:-$DEFAULT_SCRATCHPAD}"
CONFIRM=0
DRY_RUN=0
STATUS=0
CONCURRENCY=1
ONLY=""
SKIP_DONE=1
LOG=""

usage() {
  cat <<EOF
usage: $(basename "$0") [--dry-run|--status] [--confirm] [--scratchpad DIR] [--manifest FILE]
       [--concurrency N] [--only id1,id2] [--no-skip-done] [--log FILE]

Guardrails (on purpose):
  - Default concurrency is 1. Max allowed: 2 (Fable headless runs share your session limit).
  - Live runs require --confirm or PROBE_RUN_CONFIRM=1.
  - --skip-done (default) skips runs whose OUTPUT.md exists and did not hit the session limit.
  - Run bin/run-probes --dry-run before any live batch.

Manifest: $DEFAULT_MANIFEST
Scratchpad: fixtures + prompts + runs live under PROBE_SCRATCHPAD (default: session scratchpad if present).
EOF
  exit 2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --manifest) MANIFEST="$2"; shift 2 ;;
    --scratchpad) SCRATCHPAD="$2"; shift 2 ;;
    --confirm) CONFIRM=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --status) STATUS=1; shift ;;
    --concurrency) CONCURRENCY="$2"; shift 2 ;;
    --only) ONLY="$2"; shift 2 ;;
    --no-skip-done) SKIP_DONE=0; shift ;;
    --log) LOG="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "unknown arg: $1" >&2; usage ;;
  esac
done

[ -f "$MANIFEST" ] || { echo "missing manifest: $MANIFEST" >&2; exit 1; }
[ -x "$PROBE_SH" ] || chmod +x "$PROBE_SH"

run_done() {
  local id="$1"
  local out="$SCRATCHPAD/runs/$id/OUTPUT.md"
  [ -f "$out" ] || return 1
  grep -qi "session limit" "$out" && return 1
  [ "$(wc -l < "$out" | tr -d ' ')" -gt 2 ] && return 0
  return 1
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
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [ -n "$line" ] && lines+=("$line")
done < "$MANIFEST"

pending=()
done_ids=()
for line in "${lines[@]}"; do
  read -r id _rest <<< "$line"
  filter_only "$id" || continue
  if [ "$SKIP_DONE" -eq 1 ] && run_done "$id"; then
    done_ids+=("$id")
  else
    pending+=("$line")
  fi
done

if [ "$STATUS" -eq 1 ] || [ "$DRY_RUN" -eq 1 ]; then
  echo "scratchpad: $SCRATCHPAD"
  echo "manifest:   $MANIFEST ($((${#lines[@]})) lines)"
  echo "done:       ${#done_ids[@]} — ${done_ids[*]:-"(none)"}"
  echo "pending:    ${#pending[@]} — $(printf '%s\n' "${pending[@]}" | awk '{print $1}' | paste -sd, -)"
  echo "concurrency would be: $CONCURRENCY"
  echo
  echo "Cost shape: prefer bin/grade-probe (free) on existing runs; bin/gen-probe (~1 turn each) before bin/run-probes (full agent)."
  echo "Run ONE probe first (--only <id> --confirm) before any batch."
  [ "$DRY_RUN" -eq 1 ] && exit 0
  [ "$STATUS" -eq 1 ] && exit 0
fi

if [ "$CONFIRM" -ne 1 ] && [ "${PROBE_RUN_CONFIRM:-0}" != "1" ]; then
  echo "Refusing to spawn live probe runs without --confirm (or PROBE_RUN_CONFIRM=1)." >&2
  echo "Run: bin/run-probes --dry-run" >&2
  exit 1
fi

if [ "${#pending[@]}" -eq 0 ]; then
  echo "Nothing pending."
  exit 0
fi

if [ "$CONCURRENCY" -gt 2 ]; then
  echo "Refusing concurrency $CONCURRENCY — max 2. Parallel headless runs share one session limit." >&2
  exit 1
fi

[ -d "$SCRATCHPAD/fixtures" ] || {
  echo "missing fixtures under $SCRATCHPAD — build them first (see session scratchpad build-fixtures.sh)." >&2
  exit 1
}

LOG="${LOG:-$SCRATCHPAD/batch-log-safe.txt}"
: > "$LOG"

run_line() {
  local line="$1"
  read -r id fixture mode skill turns prompt <<< "$line"
  bash "$PROBE_SH" \
    --scratchpad "$SCRATCHPAD" \
    --run-id "$id" \
    --fixture "$fixture" \
    --mode "$mode" \
    --skill "$skill" \
    --max-turns "$turns" \
    --prompt-file "$SCRATCHPAD/prompts/${prompt}.txt" \
    >> "$LOG" 2>&1
  if grep -qi "session limit" "$SCRATCHPAD/runs/$id/OUTPUT.md" 2>/dev/null; then
    echo "!!! $id HIT SESSION LIMIT — stopping batch" >> "$LOG"
    echo "STOP: $id hit session limit" >&2
    exit 42
  fi
}
export -f run_line
export PROBE_SH SCRATCHPAD LOG

echo "Running ${#pending[@]} probe(s) at concurrency=$CONCURRENCY — log: $LOG"
if [ "$CONCURRENCY" -le 1 ]; then
  for line in "${pending[@]}"; do
    run_line "$line"
  done
else
  printf '%s\n' "${pending[@]}" | xargs -P "$CONCURRENCY" -I {} bash -c 'run_line "$@"' _ {}
fi

echo "ALL RUNS COMPLETE" >> "$LOG"
echo "Done. See $LOG"
