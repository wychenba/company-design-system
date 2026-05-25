#!/bin/bash
# Smoke test for pre_edit_spec_check.sh
set -u
HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../pre_edit_spec_check.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not exec"; exit 1; }
PASS=0; FAIL=0
run_hook() {
  local payload=$(jq -n --arg fp "$1" --arg ct "$2" '{tool_name:"Write", tool_input:{file_path:$fp, content:$ct}}')
  STDOUT=$(echo "$payload" | bash "$HOOK" 2>&1); EXIT=$?
}
echo "Test 1: non-matching file → silent skip"
run_hook "/tmp/random.txt" "x"
[ "$EXIT" = "0" ] && [ -z "$STDOUT" ] && { echo "  PASS"; PASS=$((PASS+1)); } || { echo "  FAIL exit=$EXIT out=${STDOUT:0:80}"; FAIL=$((FAIL+1)); }
echo "Results: $PASS PASS, $FAIL FAIL"
[ "$FAIL" -eq 0 ] || exit 1
