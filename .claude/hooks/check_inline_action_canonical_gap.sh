#!/bin/bash
set -uo pipefail
# M19 PreToolUse hook(2026-05-05 v4):inline-action gap canonical SSOT enforcement。
#
# Rule(`patterns/element-anatomy/inline-action.spec.md:80`):
#   inline-action 跟 sibling 之間 gap 必 = `gap-2`(8px),對齊 fieldWrapperStyles 元素間距
#   (Select clear X + ChevronDown gap-2)。**不是** 12px(那是 `--table-cell-px`)/ 16px / 24px。
#
# 偵測:Edit/Write 動 components/**/*.tsx 或 patterns/**/*.tsx,added line 含
#   `<ItemInlineAction` / `<ItemInlineActionButton` / `<DropdownMenuTrigger asChild>` 包
#   `<ItemInlineActionButton`,且**同一 className 字串**含 `gap-{1|3|4|6|8|10|12}`(非 gap-2)。
#
# Allowlist:行尾 `// @inline-action-gap-allow: <reason>`(如 inline-action 跟非-sibling 容器)。
# Skip:stories / tests / SSOT 定義 source(inline-action.tsx 自身)。

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

case "$FILE_PATH" in
  */item-anatomy.tsx) exit 0 ;;  # SSOT host
  *.stories.tsx|*.test.*) exit 0 ;;
esac

NEW_STRING=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

[ -z "${NEW_STRING//[[:space:]]/}" ] && exit 0

if echo "$NEW_STRING" | grep -q '@inline-action-gap-allow'; then
  exit 0
fi

# Heuristic:檔含 ItemInlineAction* 引用 + className 含非-2 的 gap-N 數字
if ! echo "$NEW_STRING" | grep -qE '<ItemInlineAction(Button)?\b|DropdownMenuTrigger.*ItemInlineAction'; then
  exit 0
fi

# 抓 Wrong gap class(非 gap-2)on lines containing inline-action context
WRONG_GAP=$(echo "$NEW_STRING" | grep -nE 'className=.*\bgap-(1|3|4|5|6|8|10|12)\b' | head -3 || true)
if [ -n "$WRONG_GAP" ]; then
  cat >&2 <<EOF

┄┄┄ check_inline_action_canonical_gap — inline-action.spec.md:80 ┄┄┄

[P1 WARN] ${FILE_PATH}
偵測到 ItemInlineAction* consumer 用非 \`gap-2\` 的 gap class:
${WRONG_GAP}

⚠️  inline-action canonical(\`patterns/element-anatomy/inline-action.spec.md:80\`):
    inline-action 跟 sibling 之間 gap **必 = \`gap-2\`(8px)**,跟 fieldWrapperStyles
    元素間距一致(Select clear X + ChevronDown 就是 gap-2)。

12px = \`--table-cell-px\`(cell L/R padding,不是 inline-action gap)。
24px / 16px = 其他語境 token,不適用 inline-action sibling spacing。

修法:className gap → \`gap-2\`。或加 \`// @inline-action-gap-allow: <reason>\` 行尾豁免。

EOF
fi

exit 0
