#!/bin/bash
# PostToolUse hook for Edit/Write on component .tsx:
# When a change touches cva() defaultVariants, grep for 3-way consistency across
# spec.md + docblock + anatomy.stories.tsx and warn if any disagree on the default.
#
# Prevents the SegmentedControl bug class: cva says 'md', spec/docblock/anatomy say
# 'sm ★default' — silently drifts until audit catches it.
#
# Exit: 0 + stdout JSON additionalContext (non-blocking warning)

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/../_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

# Only target component .tsx files (not stories, not specs)
if ! echo "$FILE_PATH" | grep -qE 'packages/design-system/src/components/[^/]+/[^/]+\.tsx$'; then
  exit 0
fi
echo "$FILE_PATH" | grep -qE '\.stories\.tsx$' && exit 0

# Only fire if the file actually contains defaultVariants (post-edit state)
[ -f "$FILE_PATH" ] || exit 0
grep -q "defaultVariants" "$FILE_PATH" || exit 0

# Diff-aware: only fire if this edit actually touched cva / defaultVariants content.
# Extract old_string + new_string (Edit / MultiEdit) or content (Write) — if none
# mention cva(, defaultVariants, or variants: , skip noise.
DIFF_TEXT=$(echo "$INPUT" | jq -r '
  (.tool_input.old_string // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  (.tool_input.content    // "") + "\n" +
  ([.tool_input.edits[]? | (.old_string + "\n" + .new_string + "\n")] | join(""))
' 2>/dev/null || echo "")
if [ -n "$DIFF_TEXT" ] && ! echo "$DIFF_TEXT" | grep -qE 'cva\(|defaultVariants|variants:[[:space:]]*\{'; then
  exit 0
fi

COMP_DIR=$(dirname "$FILE_PATH")
COMP_NAME=$(basename "$COMP_DIR")
SPEC_FILE="$COMP_DIR/$(basename "$FILE_PATH" .tsx).spec.md"
ANATOMY_FILE="$COMP_DIR/$(basename "$FILE_PATH" .tsx).anatomy.stories.tsx"

# Extract default values from each source (best-effort grep; signal not proof)
CVA_DEFAULTS=$(grep -A5 "defaultVariants" "$FILE_PATH" 2>/dev/null | grep -E "(size|variant|state):" | head -3 | tr -d ' "' | sed 's/,$//' || echo "")
SPEC_DEFAULTS=""
[ -f "$SPEC_FILE" ] && SPEC_DEFAULTS=$(grep -E "★|預設|default" "$SPEC_FILE" 2>/dev/null | head -5 || echo "")
ANATOMY_DEFAULTS=""
[ -f "$ANATOMY_FILE" ] && ANATOMY_DEFAULTS=$(grep -E "★|default|defaultVariants" "$ANATOMY_FILE" 2>/dev/null | head -5 || echo "")

WARNING="⚠️ $COMP_NAME cva/defaultVariants touched — verify 3-way sync: tsx cva ↔ spec.md default markers ↔ anatomy SIZE_SPECS. Ref: SegmentedControl drift bug. Grep \"★|預設|default\" in $COMP_DIR/."

# Escape for JSON via jq
ESCAPED=$(printf '%s' "$WARNING" | jq -Rs .)

cat <<EOJSON
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":$ESCAPED}}
EOJSON

exit 0
