#!/bin/bash
set -uo pipefail
# K3 PreToolUse hook(2026-05-04 / M24):
#   Disabled state precedence — element 在 disabled state 時,placeholder 必對應切 fg-disabled,
#   不能繼續用 fg-muted(state 勝 emphasis)。
#
# 偵測:Edit/Write 動到 *.tsx,added line 含 `placeholder:text-fg-muted` 或
#   `<span className="text-fg-muted">{...placeholder...}</span>` 而檔案內無對應
#   `disabled:placeholder:text-fg-disabled` / `data-field-mode="disabled"` /
#   `resolvedMode === 'disabled'` override → P1 warn。
#
# Allowlist:行尾 `// @disabled-color-allow: <reason>`(已驗證 disabled 用 muted 是刻意設計,如某些 caption / footnote)
# Skip:純 caption / helper text(text-fg-muted 不接 placeholder context)。

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
  *.tsx|*.ts) ;;
  *) exit 0 ;;
esac

# Read full new content from edits
NEW_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

[ -z "${NEW_CONTENT//[[:space:]]/}" ] && exit 0

# Skip if allowlist marker present
if echo "$NEW_CONTENT" | grep -q '@disabled-color-allow'; then
  exit 0
fi

# Detect placeholder:text-fg-muted hardcoded(without disabled override in same edit/file context)
SUSPECT=""
if echo "$NEW_CONTENT" | grep -E "placeholder:text-fg-muted" >/dev/null; then
  # Check whether disabled override exists in the same content batch
  if ! echo "$NEW_CONTENT" | grep -E "(disabled:placeholder:text-fg-disabled|group-data-\[field-mode=disabled\].*placeholder:text-fg-disabled|resolvedMode\s*===\s*'disabled'.*text-fg-disabled)" >/dev/null; then
    SUSPECT="$SUSPECT [placeholder:text-fg-muted 無對應 disabled override]"
  fi
fi

# Detect <span text-fg-muted> wrapping placeholder JSX
if echo "$NEW_CONTENT" | grep -E '<span[^>]*"text-fg-muted"[^>]*>\s*\{[^}]*placeholder' >/dev/null 2>&1; then
  if ! echo "$NEW_CONTENT" | grep -E "resolvedMode\s*===\s*'disabled'" >/dev/null; then
    SUSPECT="$SUSPECT [<span text-fg-muted>{placeholder} 不分 mode]"
  fi
fi

if [ -n "$SUSPECT" ]; then
  cat >&2 <<EOF

┄┄┄ check_disabled_placeholder_color — M24 violation 警告 ┄┄┄

[P1 WARN] ${FILE_PATH}
偵測到 placeholder/text 用 \`text-fg-muted\` 而無對應 disabled override:
${SUSPECT}

⚠️  M24 canonical:disabled state 顯著性優於 muted。disabled element 內所有文字載體
    (label / value / placeholder / icon)統一切 \`text-fg-disabled\`(neutral-6),
    不繼續 \`text-fg-muted\`(neutral-7)。

修法 3 擇 1:
  1. \`disabled:placeholder:text-fg-disabled\`(Tailwind variant — Input/Textarea idiom)
  2. \`group-data-[field-mode=disabled]/field:placeholder:text-fg-disabled\`(group selector
     依賴 fieldWrapperStyles \`group/field\` + Field 元件 wrapper \`data-field-mode={mode}\`)
  3. JSX 條件:\`<span className={resolvedMode === 'disabled' ? 'text-fg-disabled' : 'text-fg-muted'}>\`

詳:tokens/color/color.spec.md「Disabled state precedence canonical」/ M24
若刻意用 muted(rare):加 \`// @disabled-color-allow: <reason>\` 行尾豁免。
EOF
fi

exit 0
