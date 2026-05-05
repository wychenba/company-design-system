#!/bin/bash
set -uo pipefail
# M19 PreToolUse hook(2026-05-05 v8):row-layout slot SSOT consumption enforcement。
#
# Rule(`patterns/element-anatomy/item-anatomy.tsx` `<ItemPrefix>` / `<ItemSuffix>` SSOT):
#   row-layout prefix/suffix slot 必走 L1 primitive。禁自刻 `<span class="h-[1lh] shrink-0
#   flex items-center...">` 平行 wrapper(M1+M17 違反 — 之前 nakedCellPrefixSlot/SuffixSlot
#   是該違反案例,2026-05-05 v8 已 retire 改消費 L1)。
#
# 偵測:Edit/Write 動 components/*.tsx,added line 含
#   `h-\[1lh\].*shrink-0.*flex.*items-center` 或 `shrink-0.*flex.*items-center.*h-\[1lh\]`
#   檔案非 SSOT host(item-anatomy.tsx / field-wrapper.tsx)+ 非 stories / tests
#   → BLOCKER(該用 `<ItemPrefix>` / `<ItemSuffix>`)
#
# Allowlist:行尾 `// @row-slot-handcraft-allow: <reason>`(e.g. 特殊 forced width 必須 inline style)。
# Skip:SSOT host 檔(item-anatomy.tsx 自身定義 ItemPrefix/ItemSuffix)+ stories / tests。

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
  *components/*.tsx|*patterns/*.tsx) ;;
  *) exit 0 ;;
esac

# Skip SSOT hosts + non-prod files
case "$FILE_PATH" in
  */item-anatomy.tsx|*/field-wrapper.tsx) exit 0 ;;
  *.stories.tsx|*.test.*|*.spec.tsx) exit 0 ;;
esac

NEW_STRING=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

[ -z "${NEW_STRING//[[:space:]]/}" ] && exit 0

# Allowlist
if echo "$NEW_STRING" | grep -q '@row-slot-handcraft-allow'; then
  exit 0
fi

# Match: h-[1lh] + shrink-0 + flex items-center 在同一 className(任意順序)
if echo "$NEW_STRING" | grep -E 'h-\[1lh\][^"]*shrink-0[^"]*flex[^"]*items-center|shrink-0[^"]*h-\[1lh\][^"]*flex[^"]*items-center|flex[^"]*items-center[^"]*h-\[1lh\][^"]*shrink-0' >/dev/null; then
  cat >&2 <<'EOF'

┄┄┄ check_row_slot_handcraft — M19 BLOCKER ┄┄┄

[P0] 偵測到自刻 row-layout slot wrapper:`<span class="h-[1lh] shrink-0 flex items-center...">`
這是平行 SSOT(M1+M17 違反)— 該消費 L1 primitive。

⚠️  M19 canonical(2026-05-05 v8):row prefix/suffix slot 必走 `patterns/element-anatomy`:

  import { ItemPrefix, ItemSuffix } from '@/design-system/patterns/element-anatomy/item-anatomy'

  <ItemPrefix><StartIcon /></ItemPrefix>             // prefix slot(startIcon / value-icon / checkbox / indicator)
  <ItemSuffix>{chevron}</ItemSuffix>                  // suffix slot(chevron / clear / calendar / endAction)
  <ItemSuffix hoverReveal hoverGroup="tree-item">     // hover-reveal inline actions(MenuItem/TreeView/Sidebar)
    {actions}
  </ItemSuffix>

`<ItemPrefix>` / `<ItemSuffix>` 永遠 `h-[1lh] shrink-0 flex items-center`(item-anatomy.spec.md
line 175+190 verbatim:單行視覺 = items-center,多行 pin 第 1 行)。

允: 行尾 `// @row-slot-handcraft-allow: <reason>` 豁免(特殊 forced width / 第三方 wrapper 等)。
EOF
  exit 2
fi

exit 0
