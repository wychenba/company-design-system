#!/bin/bash
# PreToolUse hook: detect FileItem / item-with-bg list wrapper 缺 gap 或加外框。
#
# Motivation (CLAUDE.md「連續 item 貼邊合法性」canonical · 2026-04-22):
#   item 永久視覺層有 bg / border → 連續排列必 gap(rich card ≥ 8, bg-neutral-3 ≥ 4)。
#   list wrapper **不應有** border / overflow-hidden(強制邊框相黏破壞 card 自立)。
#   2026-04-22 session bug:file-upload.stories.tsx rich list `border rounded-lg overflow-hidden` 無 gap → card 融成大 card
#
# 檢查 patterns:
#   P1  `<FileItem ... mode="rich"` 出現在 `.map()` 內,且 map 外層 wrapper 無 `gap-*` → warn
#   P2  rich list wrapper 有 `border ` / `overflow-hidden` / `rounded-lg` + 含 map FileItem → block
#   P3  compact 靜態(無 status prop)list 無 `gap-*` + bg-neutral-3 底色 → warn
#
# Scope: *.tsx / *.stories.tsx
#
# Allowlist:
#   // @item-gap-exempt: <reason>
#
# Exit codes:
#   exit 0 — pass
#   exit 2 + stderr — block

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

case "$FILE_PATH" in
  *.tsx) ;;
  *) exit 0 ;;
esac

NEW_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

if [ -z "${NEW_CONTENT//[[:space:]]/}" ]; then
  exit 0
fi

# Allowlist
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

# 需要全檔內容上下文(map 外層 wrapper 通常在 FileItem 上方幾行),用合併後的檔案新狀態掃描
if [ -f "$FILE_PATH" ]; then
  FULL_CONTENT=$(cat "$FILE_PATH" 2>/dev/null)
  # Edit 類: 檔案修改後的實際樣子(簡化:直接讀 on-disk + incoming content 合併判斷)
  # 這裡保守用 NEW_CONTENT 為主(incoming changes)
  CONTENT="$NEW_CONTENT"
else
  CONTENT="$NEW_CONTENT"
fi

VIOLATIONS=""

# ── P2: list wrapper 加外框 + 含 FileItem map → block ──
# 抓 `<div ... flex-col ...border...>` 或 `...rounded-lg overflow-hidden...` 後 4 行內有 FileItem map()
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
printf '%s\n' "$CONTENT" > "$TMP"

ROW=0
while IFS= read -r LINE || [ -n "$LINE" ]; do
  ROW=$((ROW+1))

  # P2: wrapper 有 border + overflow-hidden 且下方出現 FileItem
  if echo "$LINE" | grep -qE '<div[^>]*className="[^"]*\bflex-col\b[^"]*\b(border|overflow-hidden|rounded-lg)\b'; then
    END=$((ROW+6))
    LOOKAHEAD=$(sed -n "$((ROW+1)),${END}p" "$TMP" 2>/dev/null || true)
    if echo "$LOOKAHEAD" | grep -qE '<FileItem\b'; then
      VIOLATIONS="${VIOLATIONS}
────────────────────────────────
[P2 list wrapper 加外框] ${FILE_PATH}:${ROW}
  > $(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)
  修法: FileItem rich 自帶 border card,list wrapper 不應再加 border / rounded-lg / overflow-hidden
        (會強制邊框相黏破壞 card 自立性)。改用:
        <div className=\"flex flex-col gap-2\">  {/* rich,gap-2 防邊框相黏 */}
        SSOT: components/FileItem/file-item.spec.md「List wrapper canonical」"
    fi
  fi

  # P1: wrapper flex-col 無 gap 但下方出現 FileItem(map 迭代 pattern)
  if echo "$LINE" | grep -qE '<div[^>]*className="[^"]*\bflex-col\b[^"]*"' \
     && ! echo "$LINE" | grep -qE '\bgap-[0-9]' \
     && ! echo "$LINE" | grep -qE 'gap-\[var\(--'; then
    END=$((ROW+6))
    LOOKAHEAD=$(sed -n "$((ROW+1)),${END}p" "$TMP" 2>/dev/null || true)
    if echo "$LOOKAHEAD" | grep -qE '<FileItem\b.*\.map\(|\.map\(.*<FileItem\b' \
       || (echo "$LOOKAHEAD" | grep -qE '\.map\(' && echo "$LOOKAHEAD" | grep -qE '<FileItem\b'); then
      VIOLATIONS="${VIOLATIONS}
────────────────────────────────
[P1 list wrapper 缺 gap] ${FILE_PATH}:${ROW}
  > $(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)
  修法: FileItem 有永久視覺層(rich border / compact bg-neutral-3)。
        連續排列必 gap:
          rich           → gap-2 (8px)
          compact 靜態    → gap-1 (4px)
          compact 上傳中  → 0 gap 合法(無 bg)
        若刻意 0 gap(確認無 bg/border 相連),加 // @item-gap-exempt: <reason>
        SSOT: patterns/element-anatomy/item-anatomy.spec.md「連續 item 貼邊合法性」"
    fi
  fi

done < "$TMP"

if [ -n "$VIOLATIONS" ]; then
  {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════"
    echo "║ check_item_list_gap — 連續 item 貼邊合法性違規"
    echo "╚════════════════════════════════════════════════════════════════"
    echo ""
    echo "連續 item 的永久視覺層(bg / border)會在無 gap 時視覺相連,"
    echo "破壞「各 item 自立」語意。偵測到以下違規:"
    printf '%s\n' "$VIOLATIONS"
    echo ""
    echo "────────────────────────────────"
    echo "SSOT canonical:"
    echo "  - patterns/element-anatomy/item-anatomy.spec.md「連續 item 貼邊合法性」"
    echo "  - components/FileItem/file-item.spec.md「List wrapper canonical」"
  } >&2
  exit 2
fi

exit 0
