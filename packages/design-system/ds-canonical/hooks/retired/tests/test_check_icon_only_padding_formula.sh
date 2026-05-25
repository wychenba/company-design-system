#!/bin/bash
# Tests for check_icon_only_padding_formula.sh

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_icon_only_padding_formula.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }

PASS=0; FAIL=0; FAILED=""

run_hook() {
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e; printf '%s' "$1" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"; EXIT=$?; set -e
  STDOUT_TEXT=$(cat "$STDOUT"); rm -f "$STDOUT" "$STDERR"
}

expect_fire() {
  local name="$1"
  if [ "$EXIT" = "0" ] && echo "$STDOUT_TEXT" | grep -q "padding-free idiom"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (exit=$EXIT, stdout='$STDOUT_TEXT')"
    FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - $name"
  fi
}

expect_silent() {
  local name="$1"
  if [ "$EXIT" = "0" ] && [ -z "$STDOUT_TEXT" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (exit=$EXIT, stdout='$STDOUT_TEXT')"
    FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - $name"
  fi
}

# Test 1: iconOnly + 16px formula → fire
echo "Test 1: iconOnly host + padding-formula 16px"
C='const ICON_ONLY = {sm:"px-[calc((var(--field-height-sm)-16px)/2)]"}; const Foo = ({iconOnly}) => null;'
P=$(jq -nc --arg fp "/abs/packages/design-system/src/components/Foo/foo.tsx" --arg c "$C" '{tool_name:"Write",tool_input:{file_path:$fp,content:$c}}')
run_hook "$P"; expect_fire "Test 1 padding-formula fires"

# Test 2: vertical 1lh formula(label centering)— should NOT fire
echo "Test 2: vertical 1lh formula silent"
C='const PAD = "py-[calc((var(--field-height-sm)-1lh)/2)]"; export const Foo = ({iconOnly}) => null;'
P=$(jq -nc --arg fp "/abs/packages/design-system/src/components/Foo/foo.tsx" --arg c "$C" '{tool_name:"Write",tool_input:{file_path:$fp,content:$c}}')
run_hook "$P"; expect_silent "Test 2 1lh formula silent"

# Test 3: 16px formula but no iconOnly keyword → silent
echo "Test 3: formula without iconOnly keyword silent"
C='const PAD = "px-[calc((var(--field-height-sm)-16px)/2)]"; export const Foo = () => null;'
P=$(jq -nc --arg fp "/abs/packages/design-system/src/components/Foo/foo.tsx" --arg c "$C" '{tool_name:"Write",tool_input:{file_path:$fp,content:$c}}')
run_hook "$P"; expect_silent "Test 3 no iconOnly keyword silent"

# Test 4: allowlist comment → bypass
echo "Test 4: allowlist bypass"
C='// @icon-only-padding-allow: legacy
const ICON_ONLY = "px-[calc((var(--field-height-sm)-16px)/2)]";
const Foo = ({iconOnly}) => null;'
P=$(jq -nc --arg fp "/abs/packages/design-system/src/components/Foo/foo.tsx" --arg c "$C" '{tool_name:"Write",tool_input:{file_path:$fp,content:$c}}')
run_hook "$P"; expect_silent "Test 4 allowlist bypass"

# Test 5: stories.tsx scope skip
echo "Test 5: stories.tsx out of scope"
C='const ICON_ONLY = "px-[calc((var(--field-height-sm)-16px)/2)]"; const iconOnly = true;'
P=$(jq -nc --arg fp "/abs/packages/design-system/src/components/Foo/foo.stories.tsx" --arg c "$C" '{tool_name:"Write",tool_input:{file_path:$fp,content:$c}}')
run_hook "$P"; expect_silent "Test 5 stories.tsx skip"

# Test 6: non-DS path skip
echo "Test 6: non-DS path skip"
C='const ICON_ONLY = "px-[calc((var(--field-height-sm)-16px)/2)]"; const iconOnly = true;'
P=$(jq -nc --arg fp "/abs/src/app/MyPage.tsx" --arg c "$C" '{tool_name:"Write",tool_input:{file_path:$fp,content:$c}}')
run_hook "$P"; expect_silent "Test 6 non-DS skip"

echo ""
echo "════ Results: $PASS PASS, $FAIL FAIL ════"
[ "$FAIL" -gt 0 ] && { printf "Failed:%b\n" "$FAILED"; exit 1; }
exit 0
