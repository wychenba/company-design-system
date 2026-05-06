#!/bin/bash
# Tests for check_naked_row_mode_propagation.sh
#
# 6 scenarios:
#   1. naked + items-center + nakedCellRowModeAlign import → pass
#   2. naked + items-center + nakedCellRowModeAlign apply (className) → pass
#   3. naked + items-center hardcode + NO SSOT import → block
#   4. naked + no items-center hardcode → pass(SSOT not needed)
#   5. non-naked + items-center → pass(not a naked consumer)
#   6. allowlist comment → pass

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_naked_row_mode_propagation.sh"

if [ ! -x "$HOOK" ]; then
  echo "FATAL: hook not executable: $HOOK"
  exit 1
fi

PASS=0
FAIL=0
FAILED_TESTS=""

run_hook() {
  local file_path="$1"
  local content="$2"
  local tool="${3:-Write}"
  local payload
  payload=$(jq -n --arg tool "$tool" --arg fp "$file_path" --arg c "$content" \
    '{tool_name: $tool, tool_input: {file_path: $fp, content: $c}}')
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDOUT_TEXT=$(cat "$STDOUT"); STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

expect_pass() {
  local name="$1"
  if [ "$EXIT" = "0" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit 0, got $EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_block() {
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "2" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit 2 + stderr '$needle', got exit $EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== check_naked_row_mode_propagation tests ==="

# 1. naked + items-center + nakedCellRowModeAlign import → pass
run_hook "/repo/src/design-system/components/PeoplePicker/people-picker.tsx" '
import { nakedCellRowModeAlign } from "@/design-system/components/Field/field-wrapper"
function Foo() {
  return <div variant="naked" className="inline-flex items-center" />
}
'
expect_pass "1. naked + items-center + import → pass"

# 2. naked + items-center + apply via cn(...nakedCellRowModeAlign...) → pass
run_hook "/repo/src/design-system/components/Combobox/combobox.tsx" '
import { nakedCellRowModeAlign } from "@/design-system/components/Field/field-wrapper"
function Foo() {
  return <span className={cn("flex items-center", nakedCellRowModeAlign)} />
}
'
expect_pass "2. naked + items-center + apply → pass"

# 3. naked + items-center hardcode + NO SSOT → block
run_hook "/repo/src/design-system/components/Bad/bad.tsx" '
function Foo() {
  return <span variant="naked" className="inline-flex items-center" />
}
'
expect_block "3. naked + items-center + no SSOT → block" "M19 BLOCKER"

# 4. naked + no items-center hardcode → pass
run_hook "/repo/src/design-system/components/Clean/clean.tsx" '
function Foo() {
  return <span variant="naked" className="flex-1 min-w-0 truncate" />
}
'
expect_pass "4. naked + no items-center → pass"

# 5. non-naked + items-center → pass
run_hook "/repo/src/design-system/components/Other/other.tsx" '
function Foo() {
  return <span className="inline-flex items-center" />
}
'
expect_pass "5. non-naked + items-center → pass"

# 6. allowlist comment → pass
run_hook "/repo/src/design-system/components/Edge/edge.tsx" '
// @naked-row-mode-allow: this wrapper is in popover content, not in cell context
function Foo() {
  return <span variant="naked" className="inline-flex items-center" />
}
'
expect_pass "6. allowlist comment → pass"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
