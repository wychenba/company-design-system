#!/bin/bash
# PreToolUse hook: detect hard-coded `mt-0.5` / `gap-0.5` in component .tsx(非 stories)
# 應改用 `var(--item-gap-label-desc)` token OR `<ItemContent>` primitive。
#
# Motivation (2026-04-23 SSOT architecture · item-anatomy「Label ↔ Desc 間距」token/primitive):
#   User 指出 mt-0.5 canonical 是 markdown 文字 / 13+ 消費者各自 hard-code = 非真 SSOT。
#   已建 `--item-gap-label-desc` token + `<ItemContent>` primitive,消費者應:
#     (a) 直接消費 token:`mt-[var(--item-gap-label-desc)]`
#     (b) 消費 primitive:`<ItemContent label desc ...>`
#   Hard-code `mt-0.5` / `gap-0.5` 會讓改值時漏同步 → DS drift
#
# 檢查 pattern:
#   P1 WARN  .tsx 有 `mt-0.5` / `gap-0.5` 字面 class → warn 改 token / primitive
#
# Scope: component / pattern .tsx(跳過 stories、跳過已知例外 Calendar event / FileViewer zoom)
#
# Allowlist:
#   // @item-gap-exempt: <reason>(整檔豁免 — consumer 有明文 rationale)
#   // @item-gap-exempt-next(下一行豁免)
#
# Exit codes:
#   exit 0 — pass OR warn only(不 block)

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

# Only check .tsx in components/ or patterns/(不查 stories / markdown / css)
case "$FILE_PATH" in
  */packages/design-system/src/components/*.tsx|*/packages/design-system/src/patterns/*.tsx) ;;
  *) exit 0 ;;
esac

# Skip stories
case "$FILE_PATH" in
  *.stories.tsx|*.anatomy.stories.tsx|*.principles.stories.tsx) exit 0 ;;
esac

# Skip known-exempt files(Calendar event column / FileViewer zoom pill — 非 label-desc 語義)
case "$FILE_PATH" in
  */Calendar/calendar.tsx|*/FileViewer/file-viewer.tsx) exit 0 ;;
esac

NEW_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

if [ -z "${NEW_CONTENT//[[:space:]]/}" ]; then
  exit 0
fi

# File-level allowlist
FIRST_LINES=$(printf '%s\n' "$NEW_CONTENT" | sed -n '1,3p')
if echo "$FIRST_LINES" | grep -qE '//[[:space:]]*@item-gap-exempt:'; then
  exit 0
fi
if [ -f "$FILE_PATH" ]; then
  ON_DISK_FIRST=$(sed -n '1,3p' "$FILE_PATH" 2>/dev/null || true)
  if echo "$ON_DISK_FIRST" | grep -qE '//[[:space:]]*@item-gap-exempt:'; then
    exit 0
  fi
fi

WARN_VIOLATIONS=""

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
printf '%s\n' "$NEW_CONTENT" > "$TMP"

ROW=0
SKIP_NEXT=0
while IFS= read -r LINE || [ -n "$LINE" ]; do
  ROW=$((ROW+1))

  if [ "$SKIP_NEXT" = "1" ]; then
    SKIP_NEXT=0
    continue
  fi
  if echo "$LINE" | grep -qE '//[[:space:]]*@item-gap-exempt-next|\{/\*[[:space:]]*@item-gap-exempt-next'; then
    SKIP_NEXT=1
    continue
  fi

  # P1 WARN: `mt-0.5` or `gap-0.5` 硬寫(非 comment)
  # heuristic:line 含 className=".*mt-0\.5|.*gap-0\.5" 且非純 comment
  if echo "$LINE" | grep -qE 'className\s*=\s*\{?[^}]*"[^"]*\b(mt-0\.5|gap-0\.5)\b' \
     || echo "$LINE" | grep -qE "'[^']*\b(mt-0\.5|gap-0\.5)\b[^']*'"; then
    WARN_VIOLATIONS="${WARN_VIOLATIONS}
────────────────────────────────
[P1 hard-coded mt-0.5 / gap-0.5(warn)] ${FILE_PATH}:${ROW}
  > $(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)
  建議修法(擇一):
    (a) 用 token:改成 \`mt-[var(--item-gap-label-desc)]\` / \`gap-[var(--item-gap-label-desc)]\`
    (b) 用 primitive:改用 \`<ItemContent label description descriptionTone mode>\`
        (from \`@/design-system/patterns/element-anatomy/item-anatomy\`)
  若此處刻意 hard-code 有 rationale,在該 tsx 檔首加 // @item-gap-exempt: <reason>
  SSOT: tokens/layoutSpace/layoutSpace.css + patterns/element-anatomy/item-anatomy.tsx(ItemContent)"
  fi

  # P2 WARN: suffix block formula `calc(1lh+2px+...)` 硬寫 2px(應用 token)
  if echo "$LINE" | grep -qE 'calc\(1lh\+2px\+'; then
    WARN_VIOLATIONS="${WARN_VIOLATIONS}
────────────────────────────────
[P2 hard-coded 2px in calc formula(warn)] ${FILE_PATH}:${ROW}
  > $(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)
  建議修法:\`calc(1lh+2px+...)\` → \`calc(1lh+var(--item-gap-label-desc)+...)\`
  Rationale:block formula 的 gap 2px 應跟 inline label↔desc gap 共用 SSOT token,
  確保「改 token 一處 → inline + block 兩層 formula 同步」。
  SSOT: tokens/layoutSpace/layoutSpace.css(\`--item-gap-label-desc\`)"
  fi

  # P3 WARN: `h-[1lh] shrink-0 flex items-center` 手刻 prefix wrapper(應用 ItemPrefix primitive)
  if echo "$LINE" | grep -qE '"[^"]*\bh-\[1lh\]\s+shrink-0\s+flex\s+items-center\b'; then
    WARN_VIOLATIONS="${WARN_VIOLATIONS}
────────────────────────────────
[P3 hard-coded prefix wrapper(warn)] ${FILE_PATH}:${ROW}
  > $(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)
  建議修法:改用 \`<ItemPrefix>\` primitive
    (from \`@/design-system/patterns/element-anatomy/item-anatomy\`)
  Rationale:\`h-[1lh] shrink-0 flex items-center\` 是 item-anatomy「Prefix 垂直對齊」
  canonical 的實作細節,ItemPrefix 已封裝(+ \`min-w-[var(--item-prefix-slot,auto)]\` 對齊行為)。
  手刻 = 未來改 prefix wrapper 規則需手動 grep 26+ 檔。
  若本 span 有 **特殊 width / justify-content 需求**(例如 TreeView 固定 iconPx 寬):
  加 // @item-gap-exempt-next 到此行上一行(必須附 rationale 在 spec.md)。
  SSOT: patterns/element-anatomy/item-anatomy.tsx(ItemPrefix)"
  fi

done < "$TMP"

if [ -n "$WARN_VIOLATIONS" ]; then
  {
    echo ""
    echo "┄┄┄┄ check_item_content_primitive — hard-coded mt-0.5 / gap-0.5(warn) ┄┄┄┄"
    printf '%s\n' "$WARN_VIOLATIONS"
  } >&2
fi

exit 0
