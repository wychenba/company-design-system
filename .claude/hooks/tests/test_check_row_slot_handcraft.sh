#!/bin/bash
# Tests for check_row_slot_handcraft.sh
#
# 7 scenarios:
#   1. SSOT host item-anatomy.tsx → skip
#   2. SSOT host field-wrapper.tsx → skip
#   3. Story file → skip
#   4. self-coded h-[1lh] shrink-0 flex items-center → block
#   5. self-coded different order (shrink-0 first) → block
#   6. allowlist comment → pass
#   7. Using ItemPrefix/ItemSuffix → pass

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_row_slot_handcraft.sh"

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

echo "=== check_row_slot_handcraft tests ==="

# 1. SSOT host item-anatomy.tsx → skip
run_hook "/repo/src/design-system/patterns/element-anatomy/item-anatomy.tsx" '
const x = "h-[1lh] shrink-0 flex items-center"
'
expect_pass "1. SSOT host item-anatomy → skip"

# 2. SSOT host field-wrapper.tsx → skip
run_hook "/repo/src/design-system/components/Field/field-wrapper.tsx" '
const x = "h-[1lh] shrink-0 flex items-center"
'
expect_pass "2. SSOT host field-wrapper → skip"

# 3. Story file → skip
run_hook "/repo/src/design-system/components/Foo/foo.stories.tsx" '
<span className="h-[1lh] shrink-0 flex items-center">x</span>
'
expect_pass "3. Story file → skip"

# 4. self-coded order h-[1lh] first → block
run_hook "/repo/src/design-system/components/Bad/bad.tsx" '
function Foo() {
  return <span className="h-[1lh] shrink-0 flex items-center"><Icon /></span>
}
'
expect_block "4. self-coded h-[1lh] first → block" "M19 BLOCKER"

# 5. self-coded different order shrink-0 first + h-[1lh] later → block
run_hook "/repo/src/design-system/components/Bad2/bad2.tsx" '
function Foo() {
  return <span className="shrink-0 h-[1lh] flex items-center"><Icon /></span>
}
'
expect_block "5. self-coded shrink-0 first → block" "M19 BLOCKER"

# 6. allowlist comment → pass
run_hook "/repo/src/design-system/components/Edge/edge.tsx" '
// @row-slot-handcraft-allow: 3rd-party portal wrapper requires inline style for forced width
function Foo() {
  return <span className="h-[1lh] shrink-0 flex items-center" style={{ width: 24 }}><Icon /></span>
}
'
expect_pass "6. allowlist → pass"

# 7. Using ItemPrefix → pass(無 self-coded slot class)
run_hook "/repo/src/design-system/components/Good/good.tsx" '
import { ItemPrefix } from "@/design-system/patterns/element-anatomy/item-anatomy"
function Foo() {
  return <ItemPrefix><Icon /></ItemPrefix>
}
'
expect_pass "7. Using ItemPrefix → pass"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
