#!/bin/bash
set -uo pipefail
# F2' PreToolUse hook(2026-05-04):
#   FieldControlGroup CSS variants `[&>*]` 直接子選擇器,如果 children 用 `<div>` / `<span>` wrapper
#   包 Field control,CSS rules 命中 wrapper(無 border/radius)→ inner control 圓角破圖。
#
# 偵測:Edit/Write 動到 *.tsx,added line 含 `<FieldControlGroup>` 且後續同 block 出現 `<div` / `<span`
#   (純 wrapper)→ P1 warn。
#
# 真實 case(2026-05-04):FilterRow 包 `<div className="flex-1 min-w-0">` 在 FilterValuePicker 外
#   → 圓角破圖 user 抓到。fix = 移 wrapper + className forward 透過 prop。
#
# Allowlist:檔頭 `// @fcg-wrapper-allow` 或行尾 `// @fcg-wrapper-allow`。

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

[ -z "${NEW_CONTENT//[[:space:]]/}" ] && exit 0

# Check if FieldControlGroup is used + has inline div/span wrapper as immediate child
if ! echo "$NEW_CONTENT" | grep -q '<FieldControlGroup'; then
  exit 0
fi

# Allowlist
if echo "$NEW_CONTENT" | grep -q '@fcg-wrapper-allow'; then
  exit 0
fi

# Heuristic: FieldControlGroup 後接幾行內出現 `<div` 或 `<span`(在 children slot)
# 排除 FieldControlGroup 自身包在 div 內的 case(parent wrapper 不算 child wrapper)
SUSPECT=$(printf '%s' "$NEW_CONTENT" | awk '
  /<FieldControlGroup/ { inFCG=1; next }
  /<\/FieldControlGroup>/ { inFCG=0; next }
  inFCG && /^[[:space:]]*<(div|span)[[:space:]>]/ {
    # Skip if it has self-closing or class indicates contents:display
    if ($0 !~ /display:[[:space:]]*contents/ && $0 !~ /@fcg-wrapper-allow/) print NR ":" $0
  }
')

if [ -n "$SUSPECT" ]; then
  cat >&2 <<EOF

┄┄┄┄ check_field_control_group_direct_child — wrapper div 警告 ┄┄┄┄

[P1 WARN] ${FILE_PATH}
偵測到 FieldControlGroup 內有 \`<div>\` / \`<span>\` wrapper(可能破壞 CSS variants):
${SUSPECT}

⚠️  FieldControlGroup CSS \`[&>*]\` 直接子選擇器:wrapper 命中(無 border/radius)→ inner Field control 圓角破圖
   2026-05-04 真實 bug:FilterRow 包 \`<div flex-1>\` → user 抓到圓角破圖。

修法 3 擇 1:
  1. 移除 wrapper div,Field control 直接是 FieldControlGroup direct child
  2. 透過 component prop forward className(e.g. \`<FilterValuePicker className="flex-1 min-w-0">\`)
  3. 確認 wrapper 用 \`display:contents\` 或刻意豁免 → 加 \`// @fcg-wrapper-allow: <reason>\`

詳:components/FieldControlGroup/field-control-group.spec.md「禁止事項」段
EOF
  exit 1
fi

exit 0
