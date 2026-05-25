#!/bin/bash
# PreToolUse hook: 偵測 icon-only host 用 padding-formula `(field-height - <iconPx>) / 2`
# 派(舊 idiom),warn 改用 padding-free `ICON_ONLY_BASE = 'aspect-square p-0 min-w-0 gap-0'`。
#
# Motivation(2026-04-25 user 在 Safari mobile DS Devmode 抓到 14×16 asymmetric):
#   舊 padding-formula 公式沒扣 border 2px → SVG 被 flex `min-w-0` 擠成 width<intrinsic
#   asymmetric(width=14px / height=16px,對齊 `--font-body-size` / `--font-body-lg-size`)。
#   修法 = padding-free idiom(Polaris/Atlassian 派),消除 magic number 完全。
#
# SSOT:`tokens/uiSize/uiSize.spec.md`「Icon-only 元件的 padding canonical」節。
# 已 migrate consumers:Button + SegmentedControl(2026-04-25)。
#
# Detection 規則(同時滿足才 fire):
#   1. .tsx 含 `iconOnly` keyword(prop / variant / variable name)
#   2. AND 含 `(var(--field-height-X) - <iconPx>px)` 公式 — iconPx ∈ {14,16,20,24}
#      (vertical centering 公式 `(field-height - 1lh)/2` 不觸發,因為 1lh 不是 px 數字)
#
# Allowlist:
#   //  @icon-only-padding-allow: <reason>(整檔豁免)
#
# Exit codes:
#   exit 0(non-blocking,injected context only)— PreToolUse 注入 warning,
#     依 user 判斷是否 migrate;不 hard block 因為某些舊 layer 公式可能仍合法。

# Per-hook fire logging
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

# 只查 design-system tsx(不查 stories 不查 test)
case "$FILE_PATH" in
  */packages/design-system/src/components/*.tsx|*/packages/design-system/src/patterns/*.tsx) ;;
  *) exit 0 ;;
esac
case "$FILE_PATH" in
  *.stories.tsx|*.test.tsx|*.spec.tsx) exit 0 ;;
esac

NEW_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

[ -z "${NEW_CONTENT//[[:space:]]/}" ] && exit 0

# Allowlist
FIRST=$(printf '%s\n' "$NEW_CONTENT" | sed -n '1,5p')
if echo "$FIRST" | grep -qE '//[[:space:]]*@icon-only-padding-allow:'; then
  exit 0
fi
if [ -f "$FILE_PATH" ]; then
  ON_DISK=$(sed -n '1,5p' "$FILE_PATH" 2>/dev/null || true)
  if echo "$ON_DISK" | grep -qE '//[[:space:]]*@icon-only-padding-allow:'; then
    exit 0
  fi
fi

# Combine new content with existing on-disk(若 Edit 局部改不一定包含 iconOnly)
COMBINED="$NEW_CONTENT"
if [ -f "$FILE_PATH" ]; then
  COMBINED="${COMBINED}
$(cat "$FILE_PATH" 2>/dev/null || echo "")"
fi

HAS_ICONONLY=0
HAS_FORMULA=0
FORMULA_SAMPLE=""

if echo "$COMBINED" | grep -qE 'iconOnly|ICON_ONLY|icon-only'; then
  HAS_ICONONLY=1
fi

# Match `(var(--field-height-X) - <iconPx>px ...) / 2` where iconPx ∈ 14/16/20/24
MATCH=$(printf '%s\n' "$COMBINED" | grep -oE 'calc\(\(var\(--field-height-(xs|sm|md|lg)\)\s*-\s*(14|16|20|24)px[^)]*\)\s*/\s*2\)' | head -1 || true)
if [ -n "$MATCH" ]; then
  HAS_FORMULA=1
  FORMULA_SAMPLE="$MATCH"
fi

if [ "$HAS_ICONONLY" = "1" ] && [ "$HAS_FORMULA" = "1" ]; then
  MSG="🚨 iconOnly host 用 padding-formula(舊 idiom)— $(basename "$FILE_PATH")\n\n"
  MSG="${MSG}偵測到:${FORMULA_SAMPLE}\n\n"
  MSG="${MSG}Canonical(2026-04-25):iconOnly 必用 padding-free idiom\n\n"
  MSG="${MSG}\`\`\`tsx\nconst ICON_ONLY_BASE = 'aspect-square p-0 min-w-0 gap-0'\n\`\`\`\n\n"
  MSG="${MSG}舊 idiom bug origin:公式沒扣 border 2px → SVG 被 flex min-w-0 擠成 14×16 不對稱。\n"
  MSG="${MSG}World-class 派(Polaris / Atlassian)走 padding-free,我們對齊。\n\n"
  MSG="${MSG}SSOT:tokens/uiSize/uiSize.spec.md「Icon-only 元件的 padding canonical」\n"
  MSG="${MSG}參照 migrated consumers:components/Button/button.tsx + components/SegmentedControl/segmented-control.tsx\n\n"
  MSG="${MSG}若此檔屬刻意保留舊公式(極罕見、需 spec rationale),檔首加 // @icon-only-padding-allow: <reason>"
  ESCAPED=$(printf '%b' "$MSG" | jq -Rs .)
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":%s}}\n' "$ESCAPED"
fi

exit 0
