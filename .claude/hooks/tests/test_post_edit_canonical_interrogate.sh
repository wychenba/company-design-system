#!/bin/bash
# Tests for post_edit_canonical_interrogate.sh
#
# Scope gate(4)+ trigger heuristic(3)+ skip(M-row)= 7 scenarios

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../post_edit_canonical_interrogate.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }

PASS=0; FAIL=0; FAILED=""

run_hook() {
  local payload="$1"
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e; printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"; EXIT=$?; set -e
  STDOUT_TEXT=$(cat "$STDOUT"); rm -f "$STDOUT" "$STDERR"
}

expect_fire() {
  local name="$1"
  if [ "$EXIT" = "0" ] && [ -n "$STDOUT_TEXT" ] && echo "$STDOUT_TEXT" | grep -q "Canonical interrogation"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected fire context, exit=$EXIT, stdout='$STDOUT_TEXT')"
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

# Helper: build payload (300-char content for "+200 chars" trigger)
BIG=$(printf 'x%.0s' {1..400})

# Test 1: CLAUDE.md edit +400 chars → fire
echo "Test 1: CLAUDE.md big edit"
P=$(jq -n --arg fp "/abs/CLAUDE.md" --arg os "old" --arg ns "$BIG" '{tool_name:"Edit",tool_input:{file_path:$fp,old_string:$os,new_string:$ns}}')
run_hook "$P"; expect_fire "Test 1 CLAUDE.md +400 fires"

# Test 2: CLAUDE.md small edit → silent
echo "Test 2: CLAUDE.md small edit"
P=$(jq -n --arg fp "/abs/CLAUDE.md" --arg os "old" --arg ns "tiny new" '{tool_name:"Edit",tool_input:{file_path:$fp,old_string:$os,new_string:$ns}}')
run_hook "$P"; expect_silent "Test 2 CLAUDE.md small edit silent"

# Test 3: M-row addition → silent (G4 covers)
echo "Test 3: M-row addition skip"
P=$(jq -n --arg fp "/abs/CLAUDE.md" --arg os "old" --arg ns "| **M18** | new pattern |" '{tool_name:"Edit",tool_input:{file_path:$fp,old_string:$os,new_string:$ns}}')
run_hook "$P"; expect_silent "Test 3 M-row skipped"

# Test 4: spec.md big edit → fire
echo "Test 4: spec.md big edit"
P=$(jq -n --arg fp "/abs/src/design-system/components/Foo/foo.spec.md" --arg os "old" --arg ns "$BIG" '{tool_name:"Edit",tool_input:{file_path:$fp,old_string:$os,new_string:$ns}}')
run_hook "$P"; expect_fire "Test 4 spec.md fires"

# Test 5: SKILL.md big edit → fire
echo "Test 5: SKILL.md big edit"
P=$(jq -n --arg fp "/abs/.claude/skills/foo/SKILL.md" --arg os "old" --arg ns "$BIG" '{tool_name:"Edit",tool_input:{file_path:$fp,old_string:$os,new_string:$ns}}')
run_hook "$P"; expect_fire "Test 5 SKILL.md fires"

# Test 6: tsx file → silent (out of scope)
echo "Test 6: tsx out of scope"
P=$(jq -n --arg fp "/abs/src/design-system/components/Input/input.tsx" --arg os "old" --arg ns "$BIG" '{tool_name:"Edit",tool_input:{file_path:$fp,old_string:$os,new_string:$ns}}')
run_hook "$P"; expect_silent "Test 6 tsx out of scope"

# Test 7: Write new file → fire (Write always triggers)
echo "Test 7: Write new spec.md"
P=$(jq -n --arg fp "/abs/src/design-system/patterns/foo/foo.spec.md" --arg c "small" '{tool_name:"Write",tool_input:{file_path:$fp,content:$c}}')
run_hook "$P"; expect_fire "Test 7 Write new spec.md always fires"

echo ""
echo "════ Results: $PASS PASS, $FAIL FAIL ════"
[ "$FAIL" -gt 0 ] && { printf "Failed:%b\n" "$FAILED"; exit 1; }
exit 0
