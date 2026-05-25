#!/bin/bash
# Tests for enforce_home_charter.sh
#
# Hook gate:Write 新檔到 8-home classification dirs(.claude/hooks /
# skills / agents / commands / rules + packages/design-system/src/{components,
# patterns, tokens})時,verify charter README 存在 + file-name pattern
# 對齊 dir convention。
#
# Scenarios:
#   1. Non-Write tool → silent pass
#   2. Write to existing file → silent pass(only NEW files gate)
#   3. Write outside classification dirs → silent pass
#   4. Write new file inside classification dir → pass(charter exists)

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../enforce_home_charter.sh"

[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }

PASS=0; FAIL=0; FAILED=""

run_hook() {
  local payload="$1"
  STDOUT=$(echo "$payload" | bash "$HOOK" 2>&1); EXIT=$?
}

# Test 1: Read tool(non-Write)→ silent pass
echo "Test 1: non-Write tool → silent pass"
run_hook '{"tool_name":"Read","tool_input":{"file_path":"/tmp/x"}}'
if [ "$EXIT" = "0" ] && [ -z "$STDOUT" ]; then
  echo "  PASS  Test 1 silent pass on Read"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 1 (exit=$EXIT, output=$STDOUT)"; FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 1"
fi

# Test 2: Write to existing file → silent pass(only NEW files gate)
echo "Test 2: Write to existing file → silent pass"
TMP=$(mktemp)
run_hook "{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$TMP\"}}"
if [ "$EXIT" = "0" ]; then
  echo "  PASS  Test 2 silent pass on existing file"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 2 (exit=$EXIT, output=$STDOUT)"; FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 2"
fi
rm -f "$TMP"

# Test 3: Write new file outside classification dirs → silent pass
echo "Test 3: Write new file outside classification dirs → silent pass"
run_hook '{"tool_name":"Write","tool_input":{"file_path":"/tmp/random/new-file.tsx"}}'
if [ "$EXIT" = "0" ]; then
  echo "  PASS  Test 3 silent pass on non-classified path"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 3 (exit=$EXIT, output=$STDOUT)"; FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 3"
fi

# Test 4: Write new file inside classification dir(charter exists)→ pass
echo "Test 4: Write new file in classified dir(charter exists)→ pass"
TMP_PROJ=$(mktemp -d)
mkdir -p "$TMP_PROJ/.claude/skills"
echo "# Skills charter" > "$TMP_PROJ/.claude/skills/README.md"
CLAUDE_PROJECT_DIR="$TMP_PROJ" run_hook "{\"tool_name\":\"Write\",\"tool_input\":{\"file_path\":\"$TMP_PROJ/.claude/skills/new-skill/SKILL.md\"}}"
if [ "$EXIT" = "0" ]; then
  echo "  PASS  Test 4 pass on charter-present dir"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 4 (exit=$EXIT, output=$STDOUT)"; FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 4"
fi
rm -rf "$TMP_PROJ"

echo ""
echo "════ Results: $PASS PASS, $FAIL FAIL ════"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:"
  printf "%b\n" "$FAILED"
  exit 1
fi
exit 0
