#!/bin/bash
# PostToolUse hook: enforce "person avatar → NameCard hoverCard" DS-wide canonical.
#
# Canonical source: packages/design-system/src/components/Avatar/avatar.spec.md
#   「Avatar HoverCard 原則(DS-wide canonical,必遵守)」section
#
# Rule: any `<Avatar>` with `alt="..."` that looks like a PERSON name
#   must also have `hoverCard={...}` prop (typically `<NameCard .../>`).
#
# Person-name heuristic (avoid false positive on entity names):
#   - alt contains a space (人名常有空格:"Alan Chen" / "張三 / Ada Chen")
#   - alt pattern like Ch/En first+last name
#   - OR alt is a variable like `{p.name}` / `{member.name}` / `{user.name}` / `{person.name}`
#
# Entity names (NOT person, exempt):
#   - single word + company suffix (Inc / Corp / Ltd / Co)
#   - icon shape (alt matches "icon" variable)
#   - file thumbnails (shape="square")
#
# Output: WARN (additionalContext), not block — AI reads and fixes next iteration.

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

FILE_PATH=$(jq -r '.tool_input.file_path // empty')

# Scope: only design-system files (tsx + stories.tsx)
if ! echo "$FILE_PATH" | grep -qE 'src/(design-system|explorations|app)/.*\.tsx$'; then
  exit 0
fi
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Exempt core Avatar/NameCard/HoverCard self-files and some internal primitives
if echo "$FILE_PATH" | grep -qE '(Avatar/avatar\.tsx|NameCard/|HoverCard/|Empty/empty\.tsx|FileItem/file-item\.tsx|PeoplePicker/person-display\.tsx)'; then
  exit 0
fi

VIOLATIONS=""

# Find <Avatar uses that look like person avatars but lack hoverCard
# We match <Avatar ... alt={...name...} ... /> without hoverCard in the same tag
PERSON_AVATARS=$(grep -nE '<Avatar[^>]*(alt=\{[^}]*\.name|alt="[A-Z][a-z]+\s[A-Z][a-z]+")' "$FILE_PATH" | while read -r line; do
  # Extract line number + line content
  LINE_NUM=$(echo "$line" | cut -d: -f1)
  LINE_CONTENT=$(echo "$line" | cut -d: -f2-)
  # Check: does this Avatar tag (multi-line possible) contain hoverCard?
  # Read next 8 lines after start to catch multi-line <Avatar ... />
  BLOCK=$(sed -n "${LINE_NUM},$(( LINE_NUM + 8 ))p" "$FILE_PATH")
  if ! echo "$BLOCK" | grep -q "hoverCard"; then
    echo "  - $FILE_PATH:$LINE_NUM — <Avatar alt=... without hoverCard (person avatar 需 NameCard — 見 avatar.spec.md「Avatar HoverCard 原則」)"
  fi
done)

# Also check AvatarData object literals with .name-like alt
AVATAR_DATA=$(grep -nE '\{[[:space:]]*alt:[[:space:]]*[`"'\''"]?[A-Z][a-z]+ [A-Z][a-z]+' "$FILE_PATH" | while read -r line; do
  LINE_NUM=$(echo "$line" | cut -d: -f1)
  # Check same object doesn't have hoverCard
  BLOCK=$(sed -n "${LINE_NUM},$(( LINE_NUM + 3 ))p" "$FILE_PATH")
  if ! echo "$BLOCK" | grep -q "hoverCard"; then
    echo "  - $FILE_PATH:$LINE_NUM — AvatarData with person alt 缺 hoverCard (MenuItem/SelectionItem/SelectMenu avatar prop 支援 hoverCard,必傳 NameCard)"
  fi
done)

if [ -n "$PERSON_AVATARS" ] || [ -n "$AVATAR_DATA" ]; then
  VIOLATIONS="$PERSON_AVATARS
$AVATAR_DATA"
  cat <<EOF >&2
⚠️ Person avatar 缺 hoverCard(NameCard):

$VIOLATIONS

Canonical:avatar.spec.md「Avatar HoverCard 原則(DS-wide canonical)」— person avatar 必 hover → NameCard(default,非 opt-in)。

修法:
  <Avatar
    src={...} alt={person.name} size={N}
    hoverCard={<NameCard name={person.name} subtitle={...} actions={<NameCardDefaultActions />} />}
  />

OR AvatarData:
  { alt: person.name, src: ..., hoverCard: <NameCard ... /> }

豁免(entity avatar,不適用):organization logo / 專案 icon / app icon / file thumbnail
EOF
  exit 0
fi

exit 0
