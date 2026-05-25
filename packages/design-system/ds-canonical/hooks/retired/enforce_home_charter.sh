#!/bin/bash
# PreToolUse hook for Write:
# When creating a NEW file in a classification-sensitive dir (patterns / skills / hooks /
# components / tokens), inject the home's README.md charter as additionalContext so AI
# cannot skip seeing it before creating new classification.
#
# Design choice — non-blocking context injection (not exit 2 block):
#   - Correct placements must not get blocked → zero friction when AI classifies well
#   - Incorrect placements: AI sees charter, the「這裡不收」table tells AI where to go instead
#   - The injection happens on EVERY Write to sensitive dirs, so AI cannot「forget」the charter
#
# Exit codes (Claude Code hook protocol):
#   0 + stdout JSON — inject additionalContext (non-blocking)

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

[ "$TOOL" = "Write" ] || exit 0
[ -n "$FILE_PATH" ] || exit 0

# Skip if file already exists (overwrite, not classification event).
[ -e "$FILE_PATH" ] && exit 0

# README.md itself — the charter file, no self-reference needed.
case "$(basename "$FILE_PATH")" in
  README.md) exit 0 ;;
esac

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Longest prefix first for nested matches.
SENSITIVE_DIRS=(
  "$PROJECT_ROOT/packages/design-system/src/patterns"
  "$PROJECT_ROOT/packages/design-system/src/components"
  "$PROJECT_ROOT/packages/design-system/src/tokens"
  "$PROJECT_ROOT/packages/design-system/src"
  "$PROJECT_ROOT/.claude/skills"
  "$PROJECT_ROOT/.claude/hooks"
  "$PROJECT_ROOT/.claude/commands"
  "$PROJECT_ROOT/.claude/agents"
)

MATCHED_DIR=""
for dir in "${SENSITIVE_DIRS[@]}"; do
  if [[ "$FILE_PATH" == "$dir/"* ]]; then
    MATCHED_DIR="$dir"
    break
  fi
done

[ -n "$MATCHED_DIR" ] || exit 0

README_PATH="$MATCHED_DIR/README.md"
[ -f "$README_PATH" ] || exit 0

REL_IN_HOME="${FILE_PATH#$MATCHED_DIR/}"
FIRST_SEGMENT="${REL_IN_HOME%%/*}"
NEW_SUBDIR_PATH="$MATCHED_DIR/$FIRST_SEGMENT"

IS_FLAT_FILE="false"
[ "$REL_IN_HOME" = "$FIRST_SEGMENT" ] && IS_FLAT_FILE="true"

# Flat files are CONVENTION for these dirs (per Claude Code native format):
#   .claude/hooks/       — individual hook scripts
#   .claude/commands/    — individual command .md files
#   .claude/agents/      — individual agent .md files
# For these, flat file is not a classification anomaly; exit silently.
case "$MATCHED_DIR" in
  */.claude/hooks|*/.claude/commands|*/.claude/agents)
    if [ "$IS_FLAT_FILE" = "true" ]; then
      exit 0
    fi
    ;;
esac

IS_NEW_SUBDIR="false"
if [ "$IS_FLAT_FILE" = "false" ] && [ ! -d "$NEW_SUBDIR_PATH" ]; then
  IS_NEW_SUBDIR="true"
fi

# Only fire on classification events:
#   - flat file directly under sensitive dir root (usually wrong — breaks convention)
#   - new sub-folder creation (first time this classification exists)
# Nested writes into existing sub-folders are not classification events; stay silent.
if [ "$IS_FLAT_FILE" = "false" ] && [ "$IS_NEW_SUBDIR" = "false" ]; then
  exit 0
fi

HOME_NAME="${MATCHED_DIR#$PROJECT_ROOT/}"
CHARTER_CONTENT=$(cat "$README_PATH")

if [ "$IS_FLAT_FILE" = "true" ]; then
  HEADER="⚠️  FLAT FILE at $HOME_NAME/ root — convention requires sub-folder structure. Verify this is not a misplacement before proceeding."
else
  HEADER="🚪 NEW SUB-FOLDER being created in $HOME_NAME/ (classification event). Verify against the charter below BEFORE the Write proceeds."
fi

cat <<EOJSON
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":$(jq -Rs . <<<"HOME CHARTER GATE — $HOME_NAME/

$HEADER

Path being written: $FILE_PATH

=== CHARTER ($README_PATH) ===
$CHARTER_CONTENT
=== END CHARTER ===

Three-question verification BEFORE proceeding with Write:
  1. Does your content match 「這裡只收」?
  2. Does it match any row of 「這裡不收」 (i.e. belongs elsewhere)?
  3. Does it pass all 「新增 criteria」?

If misplaced → STOP, cancel this Write, redirect to correct home.
If charter is outdated → update README.md first.
If placement is correct → proceed.")}}
EOJSON

exit 0
