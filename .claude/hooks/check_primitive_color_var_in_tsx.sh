#!/bin/bash
set -uo pipefail
# C hook(2026-05-04 / Token rule 4 機械化):tsx 內直接消費 primitive `var(--color-*)`
# = violation。應透過 semantic alias 消費,語意層才能 evolve 不破壞 consumers。
#
# 偵測:Edit/Write 動到 *.tsx,added 含 `var(--color-{neutral|red|blue|green|yellow|...}-N)`
#   (含 -opaque suffix)→ P1 warn
#
# Allowlist:行尾 `// @primitive-color-allow: <reason>` OR 檔頭 `// primitive-color-allow-blanket`。
# 例外場景:Tag / Avatar / Chart 直接消費 primitive 已 codified(color.spec.md「Primitive 色票
#   與 Tag / Avatar 的消費」),這些 component 內 OK。

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

# Skip allowed components (codified primitive-consumer scope)
case "$FILE_PATH" in
  */components/Tag/*|*/components/Avatar/*|*/components/Chart/*|*/tokens/*) exit 0 ;;
esac

NEW_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

[ -z "${NEW_CONTENT//[[:space:]]/}" ] && exit 0

# blanket allowlist
if echo "$NEW_CONTENT" | grep -q 'primitive-color-allow-blanket'; then exit 0; fi

# Detect var(--color-*-N) where N is a digit step (primitive token shape)
VIOLATIONS=$(printf '%s' "$NEW_CONTENT" | grep -nE 'var\(--color-[a-z]+-[0-9](-opaque)?\)' | grep -v 'primitive-color-allow' || true)

if [ -n "$VIOLATIONS" ]; then
  cat >&2 <<EOF

┄┄┄ check_primitive_color_var_in_tsx — Token rule 4 violation 警告 ┄┄┄

[P1 WARN] ${FILE_PATH}
偵測到 tsx 內直接消費 primitive token \`var(--color-*-N)\`:
${VIOLATIONS}

⚠️ Token 命名 4 條規則:**禁 primitive 色名作 utility,用 semantic alias**。
   理由:semantic 層才能 evolve(ex. brand swap)而不破壞 consumers;直接消費 primitive
   = consumer 跟 primitive 強綁,語意層升級時 consumer 不會自動聯動。

修法 3 擇 1:
  1. **加 semantic alias** 在 tokens/color/semantic.css,consumer 用 semantic
     例:\`var(--border-opaque)\` semantic → 後盾 \`var(--color-neutral-5-opaque)\` primitive
  2. **既有 semantic 已存在**:用 \`var(--border)\` / \`var(--bg-disabled)\` 等
  3. **刻意例外**(Tag / Avatar / Chart 已 allowed scope):加 \`// @primitive-color-allow: <reason>\`

詳:tokens/color/color.spec.md「架構流派定位」+ 「Primitive 色票與 Tag / Avatar 的消費」。
EOF
fi

exit 0
