#!/bin/bash
# DataTable unified invariant hook(2026-05-08 cluster B consolidation)
#
# Merges 3 DataTable hooks(原各檔已 retire,合併入此):
#   B.1 row drag getRowId(原 check_data_table_row_drag_get_row_id,P2 stderr)
#   B.2 column size NUMBER → meta.width(原 check_data_table_size_num_to_meta_width,P2 stderr)
#   B.3 filter↔sort sibling sync reminder(原 check_data_table_sort_parallel,P2 reminder)
#
# Why merge:皆 DataTable-family invariant,共用 INPUT parsing + tsx filter pattern。
# 散裝是 M17 SSOT 違反 + Anthropic ≤ 15 hook best-practice 偏離。
#
# 全 3 sub-rules 都是 P2 stderr-only(原檔皆 exit 0),所以本 hook 統一 exit 0。
# 同時掛 PreToolUse + PostToolUse OK(reminder 性質,雙 event fire 不 break 任何流程,
# 但本實作 settings.json 只 register PreToolUse 避免 fire 重複)。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

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

NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // ""')

# ── B.1 row drag getRowId(P2 stderr)─────────────────────────────────────────
# Skip DataTable internal source(本身 implement enableRowDrag)
case "$FILE_PATH" in
  */data-table.tsx|*/data-table.spec.md) ;; # skip B.1 + B.2 internal
  *)
    if echo "$NEW_CONTENT" | grep -q "enableRowDrag"; then
      EXISTING=""
      [ -f "$FILE_PATH" ] && EXISTING=$(cat "$FILE_PATH" 2>/dev/null || echo "")
      COMBINED="$EXISTING
$NEW_CONTENT"
      if ! echo "$COMBINED" | grep -q "getRowId"; then
        cat >&2 <<EOF

┄┄┄ B.1 check_datatable_invariants — row drag getRowId WARN ┄┄┄

[P2] ${FILE_PATH}
使用 enableRowDrag 但 file 內無 getRowId — dnd 會退化用 row.index 導致 reorder 錯位。
詳 data-table.spec.md「L4 Row drag 必填 getRowId」段。

EOF
      fi
    fi
    ;;
esac

# ── B.2 column size NUMBER → meta.width(P2 stderr)────────────────────────────
case "$FILE_PATH" in
  */data-table.tsx|*/cell-registry.tsx|*/column-types.ts) ;; # skip DS internal
  *)
    if echo "$NEW_CONTENT" | grep -qE "accessor[Key]?|createColumnHelper"; then
      HITS=$(echo "$NEW_CONTENT" | grep -nE "size:\s*[0-9]+" | grep -v "size:\s*['\"]" || true)
      if [ -n "$HITS" ]; then
        cat >&2 <<EOF

┄┄┄ B.2 check_datatable_invariants — column size NUMBER WARN ┄┄┄

[P2] ${FILE_PATH}
DataTable column def 用 root \`size: NUMBER\`(TanStack 慣例)。
DS canonical 走 \`meta.width\`(2026-05-06 v14.3,M23 命名衝突修)。

修法:
  before: { accessorKey: 'name', size: 240, meta: { type: 'string' } }
  after:  { accessorKey: 'name', meta: { type: 'string', width: 240 } }

命中 lines:
$(echo "$HITS" | sed 's/^/  /')

詳 data-table.spec.md「六之二、Column 寬度 API」。

EOF
      fi
    fi
    ;;
esac

# ── B.3 filter↔sort sibling sync reminder(P2 reminder)────────────────────────
case "$FILE_PATH" in
  *data-table-filter-panel.tsx)
    cat >&2 <<EOF

┄┄┄ B.3 check_datatable_invariants — sibling sync reminder ┄┄┄

[P2] 動到 filter panel → 是否需要對應修 data-table-sort-manager.tsx?
Self-check:row gap / row layout / row meta button / chrome corner action /
empty state 行為 / CTA button variant — sort row 是否同步?

EOF
    ;;
  *data-table-sort-manager.tsx)
    cat >&2 <<EOF

┄┄┄ B.3 check_datatable_invariants — sibling sync reminder ┄┄┄

[P2] 動到 sort manager → 是否需要對應修 data-table-filter-panel.tsx?
Self-check:row gap / row layout / row meta button / chrome corner action /
empty state 行為 / CTA button variant — filter row 是否同步?

EOF
    ;;
esac

exit 0
