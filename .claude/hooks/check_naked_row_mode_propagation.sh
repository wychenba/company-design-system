#!/bin/bash
set -uo pipefail
# M19 PreToolUse hook(2026-05-05):cell-as-input naked variant 內部 wrapper alignment propagation。
#
# Rule(naked variant SSOT canonical / field.spec.md「Naked variant — Cell-as-input」):
#   naked variant 元件**所有內部 wrapper**(`<span class="...inline-flex items-center...">` / 多片段
#   inline 容器)必 import + apply `nakedCellRowModeAlign` SSOT(`field-wrapper.tsx`),
#   讓 host cell `data-row-mode` 自動 propagate alignment(autoRow→items-start / fixed→items-center)。
#
# 偵測(檔案層級 substantive check):
#   檔含 `variant: 'naked'` 或 `variant="naked"`(naked consumer)
#   AND 檔含 inner wrapper hardcode `items-center`(在 inline-flex / flex 容器中)
#   AND 檔**未** import `nakedCellRowModeAlign` AND **未** apply 該 SSOT class string
#   → P0 BLOCKER(exit 2)
#
# Allowlist:行尾 `// @naked-row-mode-allow: <reason>`(刻意 case,如某 wrapper 不在 cell context)。
# Skip:naked variant 定義檔自身(field-wrapper.tsx / textarea.tsx — SSOT 在內);非 component tsx。

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

# Skip SSOT host(field-wrapper.tsx)+ Textarea(naked variant 定義者,別處消費才檢查)
case "$FILE_PATH" in
  */field-wrapper.tsx|*/textarea.tsx) exit 0 ;;
esac

# Read merged file content(舊 + 新 edit)— 對 naked check 必須讀整檔判斷,不只 diff
FILE_CONTENT=""
if [ -f "$FILE_PATH" ]; then
  FILE_CONTENT=$(cat "$FILE_PATH")
fi
NEW_STRING=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")
MERGED_CONTENT="${FILE_CONTENT}
${NEW_STRING}"

[ -z "${MERGED_CONTENT//[[:space:]]/}" ] && exit 0

# Allowlist
if echo "$MERGED_CONTENT" | grep -q '@naked-row-mode-allow'; then
  exit 0
fi

# Step 1: 檔含 naked variant consumer?
if ! echo "$MERGED_CONTENT" | grep -E "variant:\s*['\"]naked['\"]|variant=\{?['\"]naked['\"]" >/dev/null; then
  exit 0
fi

# Step 2: 檔含 inner wrapper hardcode `items-center`(inline-flex / flex 容器)?
if ! echo "$MERGED_CONTENT" | grep -E "(inline-flex|flex)[^\"'\`]*items-center" >/dev/null; then
  exit 0
fi

# Step 3: 檔**未** import OR apply `nakedCellRowModeAlign`?
if echo "$MERGED_CONTENT" | grep -q "nakedCellRowModeAlign"; then
  exit 0
fi

cat >&2 <<EOF

┄┄┄ check_naked_row_mode_propagation — M19 BLOCKER ┄┄┄

[P0 BLOCKER] ${FILE_PATH}

偵測到此檔消費 \`variant="naked"\` + 內部 wrapper hardcode \`items-center\`,
但**未** import / apply \`nakedCellRowModeAlign\` SSOT。

⚠️  M19 canonical:naked variant 元件所有內部 wrapper 必 propagate host cell
    \`data-row-mode\`(autoRow→items-start / fixed→items-center),否則 cell-as-input
    在 autoRow 場景視覺垂直置中,跟其他純文字 cell baseline 漂移。

修法:
  1. \`import { nakedCellRowModeAlign } from '@/design-system/components/Field/field-wrapper'\`
  2. wrapper className 加上 SSOT:
     \`className={cn('flex-1 min-w-0 inline-flex items-center', nakedCellRowModeAlign)}\`
  3. 或 \`className={cn('flex items-center', nakedCellRowModeAlign, ...)}\`

詳 \`src/design-system/components/Field/field.spec.md\` 「Naked variant」 / M19。
刻意例外(rare):加行尾 \`// @naked-row-mode-allow: <reason>\` 豁免。

EOF
exit 2
