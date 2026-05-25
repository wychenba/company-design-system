#!/bin/bash
# Smoke test for check_file_size_budget.sh

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_file_size_budget.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }

PASS=0; FAIL=0

run_hook() {
  local content="$1"
  local file_path="$2"
  local payload
  payload=$(jq -n --arg fp "$file_path" --arg ct "$content" \
    '{tool_name:"Write", tool_input:{file_path:$fp, content:$ct}}')
  STDOUT=$(echo "$payload" | bash "$HOOK" 2>&1)
  EXIT=$?
}

# Test 1: small file → silent
echo "Test 1: small CLAUDE.md → silent pass"
run_hook "$(yes 'x' | head -100)" "/tmp/test-CLAUDE.md"
if [ "$EXIT" = "0" ]; then echo "  PASS"; PASS=$((PASS+1)); else echo "  FAIL ($EXIT, $STDOUT)"; FAIL=$((FAIL+1)); fi

# Test 2: irrelevant file → silent
echo "Test 2: non-governance file → silent skip"
run_hook "$(yes 'x' | head -2000)" "/tmp/test.tsx"
if [ "$EXIT" = "0" ] && [ -z "$STDOUT" ]; then echo "  PASS"; PASS=$((PASS+1)); else echo "  FAIL ($EXIT, $STDOUT)"; FAIL=$((FAIL+1)); fi

echo "Results: $PASS PASS, $FAIL FAIL"
[ "$FAIL" -eq 0 ] || exit 1
