#!/bin/bash
# PreToolUse hook for Write:
# When creating a NEW {name}.spec.md under packages/design-system/src/components/{Name}/,
# inject a Layout Family declaration reminder. Prevents silent drift where
# a new component spec is created without Family 1/2/3/4 or exception declared —
# which bypasses the 4-Family Model taxonomy and accumulates classification debt.
#
# Exit: 0 + stdout JSON additionalContext (non-blocking)

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

[ "$TOOL" = "Write" ] || exit 0
[ -n "$FILE_PATH" ] || exit 0
[ -e "$FILE_PATH" ] && exit 0   # only fire on NEW file

# Match: packages/design-system/src/components/{Name}/{name}.spec.md (exclude nested sub-specs)
if ! echo "$FILE_PATH" | grep -qE 'packages/design-system/src/components/[^/]+/[^/]+\.spec\.md$'; then
  exit 0
fi

# Exclude Field sub-specs (field-controls.spec.md, form-validation.spec.md — these are
# Field-system shared specs, not single-component specs — they inherit from field.spec.md)
BASE_NAME=$(basename "$FILE_PATH" .spec.md)
case "$BASE_NAME" in
  field-controls|form-validation|field-types) exit 0 ;;
esac

cat <<EOJSON
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"🏛️ NEW COMPONENT SPEC — Layout Family declaration REQUIRED in first paragraph.\n\nPath: $FILE_PATH\n\nMANDATORY first-paragraph declaration (see CLAUDE.md '# 系統內部 Layout — 4-Family Model' + patterns/element-anatomy/item-anatomy.spec.md):\n\n  **Layout Family**: <one of>\n    - Family 1 (Menu item layout, scanning mode)\n    - Family 2 (List item layout, reading mode)\n    - Family 3 (Pill layout, action trigger OR data indicator sub-profile)\n    - Family 4 (Field control layout)\n    - Non-family (self-contained primitive OR composite multi-section) + rationale\n\nIf Family 1/2 → consume <MenuItem> or compose item-anatomy slot primitives (<ItemIcon>, <ItemAvatar>, <ItemLabel>, <ItemSuffix>, <ItemInlineAction>), don't reinvent.\nIf Family 3 → follow Button Pill Layout.\nIf Family 4 → follow field-controls.spec.md.\nIf Non-family → spec MUST justify why (self-contained vs composite).\n\nForgetting this declaration accumulates taxonomy debt. Also consider invoking /component-quality-gate before merging this component into DS."}}
EOJSON

exit 0
