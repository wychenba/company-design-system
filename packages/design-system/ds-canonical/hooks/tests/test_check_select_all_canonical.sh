#!/bin/bash
# Tests for check_select_all_canonical.sh(2026-05-16)
#
# Hook 規則:PreToolUse Edit/Write on packages/design-system/src/**。
# 若 NEW_CONTENT 含「Select All」 handler keyword(handleSelectAll / onSelectAll /
# onCheckAll / handleCheckAll / 全選 / checkAll= / selectAll=)但無 import
# `applySelectAll` 或 `multi-select-ordering` SSOT primitive → stderr 警告
# 「Select All ordering SSOT drift warning」(non-blocking, exit 0)。
# Allowlist:NEW_CONTENT 含 `@select-all-canonical-allow` → 跳過。
# 本 SSOT 檔自身(multi-select-ordering.ts)不查。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_select_all_canonical.sh"

if [ ! -x "$HOOK" ]; then
  echo "FATAL: hook not executable: $HOOK"
  exit 1
fi

PASS=0
FAIL=0
FAILED_TESTS=""

run_hook() {
  local file_path="$1"
  local new_string="$2"
  local payload
  payload=$(jq -n --arg fp "$file_path" --arg ns "$new_string" \
    '{tool_name: "Edit", tool_input: {file_path: $fp, new_string: $ns}}')
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDOUT_TEXT=$(cat "$STDOUT")
  STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

expect_pass_silent() {
  local name="$1"
  if [ "$EXIT" = "0" ] && [ -z "$STDERR_TEXT" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (exit=$EXIT, stderr non-empty=$([ -n "$STDERR_TEXT" ] && echo yes))"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_warn() {
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "0" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected stderr warn '$needle', got exit $EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== check_select_all_canonical tests ==="

# 1. handleSelectAll handler without applySelectAll import → warn
run_hook "/repo/packages/design-system/src/components/DataTable/data-table.tsx" '
const handleSelectAll = () => {
  setSelected([...selected, ...options.map(o => o.value)]);
};
'
expect_warn "1. handleSelectAll without SSOT import → warn" "Select All ordering SSOT drift"

# 2. handleSelectAll WITH applySelectAll import → silent
run_hook "/repo/packages/design-system/src/components/DataTable/data-table.tsx" '
import { applySelectAll } from "@/design-system/lib/multi-select-ordering";
const handleSelectAll = () => {
  setSelected(applySelectAll(selected, allValues));
};
'
expect_pass_silent "2. handleSelectAll with applySelectAll → silent"

# 3. @select-all-canonical-allow comment → silent skip
run_hook "/repo/packages/design-system/src/components/DataTable/data-table.tsx" '
// @select-all-canonical-allow: cascading multi-tree case, custom ordering needed
const handleSelectAll = () => {
  setSelected([...selected, ...options.map(o => o.value)]);
};
'
expect_pass_silent "3. @select-all-canonical-allow → silent"

# 4. Edit outside design-system → silent skip
run_hook "/repo/src/explorations/foo.tsx" '
const handleSelectAll = () => setSelected(allValues);
'
expect_pass_silent "4. non-design-system path → silent skip"

# 5. The SSOT primitive file itself → silent skip
run_hook "/repo/packages/design-system/src/lib/multi-select-ordering.ts" '
export const applySelectAll = (selected, all) => {
  // canonical impl
};
const handleSelectAll = () => 1;
'
expect_pass_silent "5. multi-select-ordering.ts itself → silent skip"

# 6. 全選 chinese keyword without SSOT → warn
run_hook "/repo/packages/design-system/src/components/Sidebar/sidebar.tsx" '
<button onClick={() => setSelected(all)}>全選</button>
'
expect_warn "6. 全選 keyword without SSOT → warn" "Select All ordering SSOT drift"

# 7. onCheckAll prop without SSOT → warn
run_hook "/repo/packages/design-system/src/components/Filter/filter.tsx" '
<Checkbox onCheckAll={handler} />
'
expect_warn "7. onCheckAll without SSOT → warn" "Select All ordering SSOT drift"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
