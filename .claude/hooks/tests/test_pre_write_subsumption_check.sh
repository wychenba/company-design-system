#!/bin/bash
# Tests for pre_write_subsumption_check.sh
#
# Scope A:new file detection / Scope B:M-row addition

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../pre_write_subsumption_check.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }

PASS=0; FAIL=0; FAILED=""

run_hook() {
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e; printf '%s' "$1" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"; EXIT=$?; set -e
  STDOUT_TEXT=$(cat "$STDOUT"); rm -f "$STDOUT" "$STDERR"
}

expect_fire_with() {
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "0" ] && echo "$STDOUT_TEXT" | grep -q "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (no '$needle' in output;exit=$EXIT)"
    FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - $name"
  fi
}

expect_silent() {
  local name="$1"
  if [ "$EXIT" = "0" ] && [ -z "$STDOUT_TEXT" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected silent, got exit=$EXIT, stdout='$STDOUT_TEXT')"
    FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - $name"
  fi
}

# Scope B: M-row addition → fire 3-Q context
echo "Test 1: M-row addition fires 3-Q"
P=$(jq -n --arg fp "/abs/CLAUDE.md" --arg os "old" --arg ns "| **M19** | new pattern |" '{tool_name:"Edit",tool_input:{file_path:$fp,old_string:$os,new_string:$ns}}')
run_hook "$P"; expect_fire_with "Test 1 M-row fires" "Meta-Pattern"

# Scope B: non-M-row CLAUDE.md edit → silent
echo "Test 2: non-M-row CLAUDE.md edit silent"
P=$(jq -n --arg fp "/abs/CLAUDE.md" --arg os "old" --arg ns "regular text without M pattern" '{tool_name:"Edit",tool_input:{file_path:$fp,old_string:$os,new_string:$ns}}')
run_hook "$P"; expect_silent "Test 2 regular CLAUDE.md edit silent"

# Scope B: Write CLAUDE.md with M-row(file might not exist)→ fire
echo "Test 3: Write CLAUDE.md with M-row in content"
P=$(jq -n --arg fp "/abs/CLAUDE.md" --arg c "| **M20** | test |" '{tool_name:"Write",tool_input:{file_path:$fp,content:$c}}')
run_hook "$P"; expect_fire_with "Test 3 Write M-row fires" "Meta-Pattern"

# Scope B: M-row pattern in non-CLAUDE.md → silent
echo "Test 4: M-row in random spec → silent (Scope B 限 CLAUDE.md)"
P=$(jq -n --arg fp "/abs/src/design-system/components/Foo/foo.spec.md" --arg os "o" --arg ns "| **M99** | not real |" '{tool_name:"Edit",tool_input:{file_path:$fp,old_string:$os,new_string:$ns}}')
run_hook "$P"; expect_silent "Test 4 spec.md not Scope B"

echo ""
echo "════ Results: $PASS PASS, $FAIL FAIL ════"
[ "$FAIL" -gt 0 ] && { printf "Failed:%b\n" "$FAILED"; exit 1; }
exit 0
