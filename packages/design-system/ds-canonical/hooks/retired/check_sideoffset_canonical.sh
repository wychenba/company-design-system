#!/bin/bash
# PostToolUse hook: catch non-canonical sideOffset overrides on overlay primitives.
#
# DS canonical: all overlay primitives (Popover / Tooltip / DropdownMenu / HoverCard /
# SelectMenu / Coachmark) use sideOffset=8 (Notion / Linear / Figma 6-8px idiom).
# Consumers should NEVER override sideOffset — if they think they need to, the
# visual is fighting the DS and the right fix is to discuss, not to patch locally.
#
# This hook warns when a file sets sideOffset to anything other than 8 (the DS
# canonical). Overlay primitive SOURCE files are exempt (they set the default).
#
# Trigger: PostToolUse on Edit/Write/MultiEdit for any .tsx/.md file that
# contains `sideOffset=`.

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

FILE_PATH="${CLAUDE_TOOL_INPUT_FILE_PATH:-}"

# Only .tsx / .md files
case "$FILE_PATH" in
  *.tsx|*.md) ;;
  *) exit 0 ;;
esac

[ -f "$FILE_PATH" ] || exit 0

# Exempt the overlay primitive source files themselves (they set defaults).
case "$FILE_PATH" in
  */Popover/popover.tsx) exit 0 ;;
  */Tooltip/tooltip.tsx) exit 0 ;;
  */DropdownMenu/dropdown-menu.tsx) exit 0 ;;
  */HoverCard/hover-card.tsx) exit 0 ;;
  */SelectMenu/select-menu.tsx) exit 0 ;;
  */Coachmark/coachmark.tsx) exit 0 ;;
esac

# Look for sideOffset set to a literal number != 8
# Matches: sideOffset={4}  sideOffset = 4  sideOffset={12}  etc.
# Does NOT match:
#   sideOffset={8}                                                (canonical)
#   sideOffset={sideOffset}                                       (prop passthrough)
#   sideOffset (mentioned in prose / tables / comments)
VIOLATIONS=$(grep -nE 'sideOffset[[:space:]]*=[[:space:]]*\{[[:space:]]*[0-9]+[[:space:]]*\}' "$FILE_PATH" 2>/dev/null \
  | grep -vE 'sideOffset[[:space:]]*=[[:space:]]*\{[[:space:]]*8[[:space:]]*\}' || true)

if [ -n "$VIOLATIONS" ]; then
  cat <<EOF
⚠️  Non-canonical \`sideOffset\` override — $FILE_PATH

$VIOLATIONS

DS canonical: all overlay primitives use \`sideOffset={8}\` (世界級 idiom, Notion /
Linear / Figma / Stripe 6-8px). Consumer should NOT override. If the default
feels wrong visually, the fix is to discuss & change the canonical — NOT to
sprinkle \`sideOffset={4}\` locally.

Remove the override unless you have a documented exception. See
\`components/Popover/popover.spec.md\` 「觸發距離 canonical」.
EOF
fi

exit 0
