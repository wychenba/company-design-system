#!/bin/bash
# PreToolUse hook: detect FileItem list wrapper 加外框(P2 block)或 likely-missing gap(P1 warn)。
#
# Motivation(CLAUDE.md「連續 item 貼邊合法性」v2 canonical · 2026-04-22):
#   Permanent standalone card/pill(bg + radius + inset)→ 必 gap(防融合)
#   Permanent flush full-width / transparent → 0 gap 合法(靠 border-b / progress bar / separator)
#
#   FileItem rich    → permanent border card → standalone → 必 gap-2
#   FileItem compact no status(Type B form attachment) → permanent bg-secondary pill → 必 gap-1
#   FileItem compact with status(Type A upload manager) → flush + progress bar 分隔線型 → 0 gap 合法
#
# 檢查 patterns(scope: FileItem MVP,未來可擴其他 standalone card 類元件):
#   P1  list wrapper `flex-col` 無 `gap-*` + FileItem map 內 → **WARN**(exit 0 + stderr)
#       靜態 grep 難 reliably 區分 Type A / Type B,交給人判斷
#   P2  list wrapper 加 `border` / `overflow-hidden` / `rounded-lg` + FileItem map 內 → **BLOCK**(exit 2)
#       無論 Type A / B / rich,外框 + overflow-hidden 都是 wrong(強制邊框相黏、雙重 card)
#
# Allowlist:
#   // @item-gap-exempt: <reason>
#
# Exit codes:
#   exit 0 — pass(OR P1 warn only,stderr has 訊息但不 block)
#   exit 2 + stderr — P2 block

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

BLOCK_VIOLATIONS=""   # P2 — always wrong(block)
WARN_VIOLATIONS=""    # P1 — likely wrong but depends on Type A/B(warn,不 block)

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
printf '%s\n' "$CONTENT" > "$TMP"

ROW=0
while IFS= read -r LINE || [ -n "$LINE" ]; do
  ROW=$((ROW+1))

  # P2 BLOCK: wrapper 有 border / overflow-hidden / rounded-lg 外框 + FileItem map → 總是錯
  if echo "$LINE" | grep -qE '<div[^>]*className="[^"]*\bflex-col\b[^"]*\b(border|overflow-hidden|rounded-lg)\b'; then
    END=$((ROW+6))
    LOOKAHEAD=$(sed -n "$((ROW+1)),${END}p" "$TMP" 2>/dev/null || true)
    if echo "$LOOKAHEAD" | grep -qE '<FileItem\b'; then
      BLOCK_VIOLATIONS="${BLOCK_VIOLATIONS}
────────────────────────────────
[P2 list wrapper 加外框] ${FILE_PATH}:${ROW}
  > $(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)
  修法: FileItem rich 自帶 border card、compact 自帶 bg-secondary(Type B)或 progress bar(Type A)。
        list wrapper **不應**再加 border / rounded-lg / overflow-hidden。
        (overflow-hidden 會強制邊框合併、雙重外框破壞 card 自立)
        改用:<div className=\"flex flex-col [gap-*]\">
        SSOT: components/FileItem/file-item.spec.md「List wrapper canonical」"
    fi
  fi

  # P1 WARN: wrapper flex-col 無 gap + FileItem map → 可能缺 gap(Type A / B 判斷由人)
  if echo "$LINE" | grep -qE '<div[^>]*className="[^"]*\bflex-col\b[^"]*"' \
     && ! echo "$LINE" | grep -qE '\bgap-[0-9]' \
     && ! echo "$LINE" | grep -qE 'gap-\[var\(--'; then
    END=$((ROW+6))
    LOOKAHEAD=$(sed -n "$((ROW+1)),${END}p" "$TMP" 2>/dev/null || true)
    if echo "$LOOKAHEAD" | grep -qE '<FileItem\b'; then
      WARN_VIOLATIONS="${WARN_VIOLATIONS}
────────────────────────────────
[P1 list wrapper 可能缺 gap(warn)] ${FILE_PATH}:${ROW}
  > $(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)
  判斷: FileItem 依 mode / status 有不同 gap 需求:
          rich(任何 status)        → standalone card → 必 gap-2
          compact + 無 status(Type B) → standalone pill(bg-secondary)→ 必 gap-1
          compact + 有 status(Type A) → flush + progress bar 分隔線 → 0 gap 合法
        若此處是 Type A(compact 上傳狀態,progress bar 作分隔)→ 合法,可忽略。
        若是 rich / Type B → 補 gap-2 / gap-1。
        SSOT: patterns/element-anatomy/item-anatomy.spec.md「連續 item 貼邊合法性 v2」"
    fi
  fi

done < "$TMP"

# Emit warnings(stderr but continue)
if [ -n "$WARN_VIOLATIONS" ]; then
  {
    echo ""
    echo "┄┄┄┄ check_item_list_gap — P1 warn(可能缺 gap,依 mode/status 判斷) ┄┄┄┄"
    printf '%s\n' "$WARN_VIOLATIONS"
  } >&2
fi

# Emit block only for P2
if [ -n "$BLOCK_VIOLATIONS" ]; then
  {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════"
    echo "║ check_item_list_gap — list wrapper 加外框(P2 block)"
    echo "╚════════════════════════════════════════════════════════════════"
    printf '%s\n' "$BLOCK_VIOLATIONS"
    echo ""
    echo "────────────────────────────────"
    echo "SSOT canonical:"
    echo "  - patterns/element-anatomy/item-anatomy.spec.md「連續 item 貼邊合法性 v2」"
    echo "  - components/FileItem/file-item.spec.md「List wrapper canonical」"
  } >&2
  exit 2
fi

exit 0
