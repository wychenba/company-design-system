#!/usr/bin/env bash
# check_third_party_dom_verified.sh
#
# Purpose: Warn when .tsx uses `[&[data-xxx]]:` attribute selector targeting
# a 3rd-party library's internal DOM state. History: react-day-picker v9
# DateGrid used `[&[data-range-middle]]:bg-...` assuming `data-range-middle`
# existed, but v9 only emits `data-selected`/`data-disabled` etc. Attribute
# selector silently failed.
#
# This is the CLAUDE.md Meta-Pattern M2 mechanical guardrail:
# "消費 3rd-party lib 必驗 rendered DOM".
#
# Exit 0 always (non-blocking warning).

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('tool_name', ''))" 2>/dev/null || echo "")
case "$TOOL_NAME" in
  Write|Edit|MultiEdit) ;;
  *) exit 0 ;;
esac

FILE_PATH=$(echo "$INPUT" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('tool_input', {}).get('file_path', ''))" 2>/dev/null || echo "")

case "$FILE_PATH" in
  *.tsx) ;;
  *.ts) ;;
  *) exit 0 ;;
esac

# Extract new content from tool input (content for Write, new_string for Edit)
NEW_CONTENT=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
ti = d.get('tool_input', {})
# Write: content;  Edit: new_string;  MultiEdit: edits[].new_string joined
if 'content' in ti:
    print(ti.get('content', ''))
elif 'new_string' in ti:
    print(ti.get('new_string', ''))
elif 'edits' in ti:
    print('\n'.join([e.get('new_string', '') for e in ti.get('edits', [])]))
else:
    print('')
" 2>/dev/null || echo "")

# Detect pattern: attribute selector targeting data-* that could be 3rd-party
# Matches:  [&[data-xxx]]  or  [&[data-xxx=yyy]]  inside className or cva strings
if ! echo "$NEW_CONTENT" | grep -qE '\[&\[data-[a-z-]+'; then
  exit 0
fi

# Only warn if the file imports a known 3rd-party UI library
THIRD_PARTY_LIBS="react-day-picker|@radix-ui|cmdk|sonner|embla-carousel|react-zoom-pan-pinch|@tanstack/react-virtual|@tanstack/react-table|recharts|react-aria"

if ! echo "$NEW_CONTENT" | grep -qE "from ['\"]($THIRD_PARTY_LIBS)"; then
  exit 0
fi

# Emit warning
cat >&2 <<'EOF'
⚠️  3rd-party DOM 驗證檢查:attribute selector 針對第三方 lib 內部 DOM

偵測到 `[&[data-xxx]]:` 類 attribute selector,且檔案 import 了第三方 UI lib。

Meta-Pattern M2 canonical(CLAUDE.md):**消費 3rd-party lib 必驗 rendered DOM
(不信 docs)**。第三方 lib 的內部 DOM attribute 常跟 docs 不符,或在不同
version 行為漂移。

歷史 bug anchor:
  react-day-picker v9 的 Day CELL 只有 data-selected / data-disabled /
  data-today / data-outside / data-focused;**data-range-start / data-range-middle
  / data-range-end 不存在**。用 `[&[data-range-middle]]:bg-...` 是靜默失效。

驗證步驟(寫這類 selector 之前)──

  1. 開 Storybook 或 dev server
  2. Inspect element 看實際 rendered DOM 有哪些 data-* attribute
  3. 或查 lib 源碼 `node_modules/{lib}/dist/` 找 emit 的 attribute 清單
  4. 確認 attribute 存在 + 在當前 version 穩定 + document 過,再寫 selector

替代做法(若 attribute 不存在):
  - 透過 lib 官方 API(classNames / components props)傳 class
  - 例:react-day-picker 用 `classNames={{ range_middle: 'bg-...' }}`,
    lib 內部 `getClassNamesForModifiers` 會附加到 cell

(本 hook 非 blocking,只是提醒。寫下 selector 前,請確認已驗過 DOM。)
EOF

exit 0
