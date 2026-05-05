#!/bin/bash
set -uo pipefail
# M19 PreToolUse hook(2026-05-05 v4):Field naked variant state ring token SSOT enforcement。
#
# Rule(`field-wrapper.tsx` `nakedCellHoverRing` / `nakedCellFocusRing` / `nakedCellOpenRing` SSOT):
#   cell-as-input naked variant state ring **必走 outline + token SSOT**(同 Field default + bare 共用
#   `--border` / `--primary` token)。禁止 hardcode `box-shadow inset` / 禁止寫死 token alias
#   (例 `border-border-hover` 在 naked context — 應該用 SSOT const,改 token 同步動)。
#
# 偵測:Edit/Write 動 components/*.tsx,added line 含 naked variant + state ring class:
#   match A:`focus-within:shadow-\[inset` / `hover:shadow-\[inset`(舊 box-shadow inset 寫法)
#   match B:`(hover|focus|focus-within|focus-visible|data-\[state=open\]):outline-(border|primary)` 但
#           檔案**未** import `nakedCellHoverRing|FocusRing|OpenRing` SSOT const → 自寫 token,違反
#           「token-level SSOT」原則(改 const → 全變體跟動)。
#
# Allowlist:行尾 `// @field-state-ring-allow: <reason>`。
# Skip:`field-wrapper.tsx`(SSOT host)+ `textarea.tsx`(SSOT host 同層)+ stories / tests。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

case "$FILE_PATH" in
  *components/*.tsx) ;;
  *) exit 0 ;;
esac

# Skip SSOT hosts + non-prod files
case "$FILE_PATH" in
  */field-wrapper.tsx|*/textarea.tsx) exit 0 ;;
  *.stories.tsx|*.test.*|*.spec.tsx) exit 0 ;;
esac

NEW_STRING=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

[ -z "${NEW_STRING//[[:space:]]/}" ] && exit 0

# Allowlist
if echo "$NEW_STRING" | grep -q '@field-state-ring-allow'; then
  exit 0
fi

# Match A: 舊 box-shadow inset 寫法(naked state ring)
if echo "$NEW_STRING" | grep -E "(hover|focus-within|data-\[state=open\]):shadow-\[inset" >/dev/null; then
  cat >&2 <<'EOF'

┄┄┄ check_field_state_token_consume — M19 BLOCKER ┄┄┄

[P0] 偵測到 cell-as-input naked variant state ring 用 `box-shadow inset` 寫法。

⚠️  M19 canonical(2026-05-05 v4):state ring 必用 `outline-2 outline-offset-[-1px]`
    straddle cell edge,不用 inset shadow(只畫內側,不蓋 adjacent grid)。

修法:import + apply SSOT const(field-wrapper.tsx):
  - `nakedCellHoverRing` / `nakedCellFocusRing` / `nakedCellOpenRing`
  輸出 `outline-2 outline-offset-[-1px] outline-{border|primary}` 格式,
  改 `--border` / `--primary` token → Field default + bare + naked **三變體全動**。

允: 行尾 `// @field-state-ring-allow: <reason>` 豁免。
EOF
  exit 2
fi

# Match B: outline state ring 但無 SSOT import
HAS_NAKED_OUTLINE=$(echo "$NEW_STRING" | grep -E "(hover|focus-within|focus-visible|data-\[state=open\]):outline-(border|primary)" || true)
if [ -n "$HAS_NAKED_OUTLINE" ]; then
  FILE_CONTENT=""
  if [ -f "$FILE_PATH" ]; then FILE_CONTENT=$(cat "$FILE_PATH"); fi
  MERGED="${FILE_CONTENT}
${NEW_STRING}"
  if ! echo "$MERGED" | grep -qE "nakedCell(Hover|Focus|Open)Ring"; then
    cat >&2 <<'EOF'

┄┄┄ check_field_state_token_consume — M19 BLOCKER ┄┄┄

[P0] 偵測到 outline state ring(`hover:outline-border` / `focus:outline-primary` 等)
但檔案**未** import `nakedCellHoverRing` / `nakedCellFocusRing` / `nakedCellOpenRing` SSOT const。

⚠️  M19 canonical:state ring 必走 SSOT const(`field-wrapper.tsx` export),
    不可在元件內自寫 outline class — 否則改 token / 改 outline 規則時不同步。

修法:
  import { nakedCellHoverRing, nakedCellFocusRing, nakedCellOpenRing } from '@/design-system/components/Field/field-wrapper'
  className={cn(..., nakedCellHoverRing, nakedCellFocusRing)}

允: 行尾 `// @field-state-ring-allow: <reason>` 豁免。
EOF
    exit 2
  fi
fi

exit 0
