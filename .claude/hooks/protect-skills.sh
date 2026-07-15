#!/bin/bash
# Pre-tool-use guard for .claude/skills/ artifacts.
#
# Skills are *authored* in this workshop repo and *consumed* (read-only) in
# every other repo. The workshop is identified by a plugin manifest at the
# project root (.claude-plugin/plugin.json or marketplace.json), not a
# hardcoded path — so this survives the repo being moved or renamed, works
# wherever the repo lives, and doesn't bake an absolute home-directory path
# into a public repo.
#
# When a session running in any other working directory tries to
# Edit/Write/MultiEdit a file under any `.claude/skills/` tree, surface a
# permission prompt — the user must approve explicitly, otherwise the edit is
# blocked.
#
# To switch to a hard block instead of an "ask" prompt, change the
# permissionDecision value to "deny".

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Not a skill file? allow silently.
if [[ "$FILE_PATH" != *".claude/skills/"* ]]; then
  exit 0
fi

# In the workshop repo? allow silently — this is where skills are authored.
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
if [[ -n "$PROJECT_DIR" && ( -f "$PROJECT_DIR/.claude-plugin/plugin.json" || -f "$PROJECT_DIR/.claude-plugin/marketplace.json" ) ]]; then
  exit 0
fi

# Anywhere else: require explicit permission.
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "Skill files are authored in the workshop repo (the one with a .claude-plugin/ manifest at its root). This session is in $PROJECT_DIR and is about to edit $FILE_PATH. Approve only if this is an intentional one-off; otherwise edit the canonical version in the workshop and re-copy."
  }
}
EOF
exit 0
