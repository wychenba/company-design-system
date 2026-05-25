#!/bin/bash
# Tests for check_peoplepicker_ssot_drift.sh(2026-05-15)
#
# Hook 規則:PreToolUse Edit/Write on PeoplePicker/people-picker.tsx /
# PeoplePicker/person-display.tsx / Combobox/combobox.tsx — 若 NEW_CONTENT
# 含 SSOT-bearing keyword(tagRenderer/overflowShape/...)但無 cite
# `people-picker.spec.md §A-§F` → 經由 stdout 輸出 hookSpecificOutput JSON warn。
# 非目標檔案 / 無 SSOT keyword / 含 spec cite → silent。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_peoplepicker_ssot_drift.sh"

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
  if [ "$EXIT" = "0" ] && [ -z "$STDOUT_TEXT" ] && [ -z "$STDERR_TEXT" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected silent, exit=$EXIT, stdout-empty=$([ -z "$STDOUT_TEXT" ] && echo yes), stderr-empty=$([ -z "$STDERR_TEXT" ] && echo yes))"
    echo "  --- stdout ---"; echo "$STDOUT_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_warn() {
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "0" ] && echo "$STDOUT_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected warn '$needle', got exit $EXIT)"
    echo "  --- stdout ---"; echo "$STDOUT_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== check_peoplepicker_ssot_drift tests ==="

# 1. people-picker.tsx 動 tagRenderer 無 spec cite → warn
run_hook "/repo/packages/design-system/src/components/PeoplePicker/people-picker.tsx" '
const customTagRenderer = (item) => <PersonAvatarTag {...item} />;
'
expect_warn "1. tagRenderer change without spec cite → warn" "PeoplePicker SSOT-bearing edit"

# 2. people-picker.tsx 動 overflowShape 無 cite → warn
run_hook "/repo/packages/design-system/src/components/PeoplePicker/people-picker.tsx" '
overflowShape="round"
'
expect_warn "2. overflowShape change → warn" "people-picker.spec.md"

# 3. 含 spec cite §A → silent
run_hook "/repo/packages/design-system/src/components/PeoplePicker/people-picker.tsx" '
// per people-picker.spec.md §A 元件本質繼承表
const tagRenderer = (item) => <PersonAvatarTag {...item} />;
'
expect_pass_silent "3. tagRenderer with §A cite → silent"

# 4. 非 PeoplePicker 檔案 → silent skip
run_hook "/repo/packages/design-system/src/components/Button/button.tsx" '
const tagRenderer = (item) => <Tag {...item} />;
'
expect_pass_silent "4. non-target file → silent skip"

# 5. combobox.tsx 動 selectedItemRenderer 無 cite → warn
run_hook "/repo/packages/design-system/src/components/Combobox/combobox.tsx" '
selectedItemRenderer={renderPerson}
'
expect_warn "5. combobox selectedItemRenderer change → warn" "PeoplePicker SSOT-bearing"

# 6. person-display.tsx edit 不含 SSOT keyword → silent
run_hook "/repo/packages/design-system/src/components/PeoplePicker/person-display.tsx" '
const helperVar = "noop";
'
expect_pass_silent "6. person-display.tsx edit without SSOT keyword → silent"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
