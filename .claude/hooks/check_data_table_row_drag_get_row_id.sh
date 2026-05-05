#!/bin/bash
set -uo pipefail
# F3 row drag PreToolUse hook(2026-05-05):
#   寫入含 `enableRowDrag` 的 DataTable consumer 時,grep 同檔是否傳 `getRowId`。
#   缺 getRowId 時 dnd 退化用 row.index → reorder 後錯位(runtime 不 throw,行為錯)。
#   見 data-table.spec.md「L4 Row drag 必填 getRowId」。
#
# 機制:soft warning(non-blocking),只在新增 enableRowDrag 時提醒

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

# 只 scan tsx consumer(不掃 DataTable 本身 + spec)
case "$FILE_PATH" in
  *.tsx) ;;
  *) exit 0 ;;
esac
case "$FILE_PATH" in
  */data-table.tsx|*/data-table.spec.md) exit 0 ;;
esac

# 取 new content(Write 取 content;Edit 取 new_string)
NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // ""')

# 只有當新增 enableRowDrag 才檢查
if echo "$NEW_CONTENT" | grep -q "enableRowDrag"; then
  # 看新內容 + 檔案既有狀態合併判斷有沒有 getRowId
  EXISTING=""
  if [[ -f "$FILE_PATH" ]]; then
    EXISTING=$(cat "$FILE_PATH" 2>/dev/null || echo "")
  fi
  COMBINED="$EXISTING
$NEW_CONTENT"
  if ! echo "$COMBINED" | grep -q "getRowId"; then
    echo "⚠️  使用 enableRowDrag 但 file 內無 getRowId — dnd 會退化用 row.index 導致 reorder 錯位。" >&2
    echo "   詳 data-table.spec.md「L4 Row drag 必填 getRowId」段。" >&2
  fi
fi

exit 0
