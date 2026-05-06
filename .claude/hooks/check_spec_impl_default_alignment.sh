#!/bin/bash
set -uo pipefail
# F1 PreToolUse hook(2026-05-04):
#   spec.md 寫「default = X」/ 「預設 = X」/「default value: X」時,對應 implementation 必須有
#   實證該 default 值的 code OR 註解。防範:寫 spec 沒同步驗 impl(本 session SelectMenu width
#   D1 真實案例:spec L72 寫「width 預設跟 trigger 同寬」,但 implementation 被 PopoverContent
#   default w-72 蓋過,導致 spec canonical 沒生效。M14 違反一例。
#
# 觸發場景:Edit/Write 動到 *.spec.md 且 added/modified line 含「default」/「預設」/「預値」keyword
# 機制:soft P1 warning,提醒對應 impl 需 verify(不阻擋 commit,但敦促 author 自驗)
#
# Allowlist:檔頭 `// @spec-impl-allow` 整檔豁免

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
  *.spec.md) ;;
  *) exit 0 ;;
esac

NEW_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

[ -z "${NEW_CONTENT//[[:space:]]/}" ] && exit 0

# Allowlist
FIRST_LINES=$(printf '%s\n' "$NEW_CONTENT" | sed -n '1,5p')
if echo "$FIRST_LINES" | grep -q '@spec-impl-allow'; then
  exit 0
fi

# 偵測「default = X」/ 「預設 ... X」/ 「預值 ... X」keyword(寬鬆 match)
DEFAULT_LINES=$(printf '%s' "$NEW_CONTENT" | grep -nE '預設|預値|default[ \t]*[=:]|`default`|預設值' | head -3)

if [ -n "$DEFAULT_LINES" ]; then
  cat >&2 <<EOF

┄┄┄┄ check_spec_impl_default_alignment — soft warning ┄┄┄┄

[P1 INFO] ${FILE_PATH}
偵測到「default」/「預設」keyword:
${DEFAULT_LINES}

⚠️  spec 寫了預設值 → 必對應 implementation 驗證一致(M14 + D1 真實案例:SelectMenu spec
   寫「width 預設 = trigger-width」但 PopoverContent w-72 hardcode override,canonical 失效)

下一步建議(self-check):
  - 找對應 implementation file(同 component 目錄)
  - grep 該 default value 是否 hardcode / 是否被外層 override
  - 若不一致 → 修 implementation OR 修 spec 對齊
  - 若一致 → 在 implementation 加 inline comment「Default per spec L<N>」回扣 spec

整檔豁免:檔頭加 \`// @spec-impl-allow: <reason>\`

(本 hook 為 soft warning,不阻擋 commit)
EOF
fi

exit 0
