#!/bin/bash
set -uo pipefail
# F3 PostToolUse hook(2026-05-04):
#   修改 `data-table-filter-panel.tsx` 後 → 提醒檢查 sort manager 同步
#   反之亦然。本 session 真實案例:filter Q4/Q5/Q9 都需 sort 對應修,但容易漏。
#
# 觸發場景:Edit/Write 動到 data-table-filter-panel.tsx 或 data-table-sort-manager.tsx
# 機制:soft warning,在 stop 前提醒「另一邊同步檢查了嗎」

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
  *data-table-filter-panel.tsx)
    OTHER="data-table-sort-manager.tsx"
    THIS="filter panel"
    ;;
  *data-table-sort-manager.tsx)
    OTHER="data-table-filter-panel.tsx"
    THIS="sort manager"
    ;;
  *) exit 0 ;;
esac

cat >&2 <<EOF

┄┄┄┄ check_data_table_sort_parallel — sibling sync reminder ┄┄┄┄

[P2 REMINDER] ${FILE_PATH}
動到 ${THIS} → 是否需要對應修 ${OTHER}?

Self-check:
  - row gap / row layout 改 → sort row 同步?
  - row meta button(trash / drag handle / inline action)→ 視覺一致性?
  - chrome corner action(refresh / close)→ 對等?
  - 加 X CTA button variant 改 → 加 Y CTA 同步?
  - empty state 行為改 → 對應?

(本 hook 為 P2 提醒,不阻擋。確認過後可忽略。)
EOF

exit 0
