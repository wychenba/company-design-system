#!/bin/bash
set -u
HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/_hardcoded_strings.sh"
[ -x "$HOOK" ] || { echo "FATAL"; exit 1; }
PASS=0; FAIL=0
run_hook() {
  local payload=$(jq -n --arg fp "$1" --arg ct "$2" '{tool_name:"Write", tool_input:{file_path:$fp, content:$ct}}')
  STDOUT=$(echo "$payload" | bash "$HOOK" 2>&1); EXIT=$?
}
echo "Test 1: non-DS file → silent skip"
run_hook "/tmp/test.tsx" "<div>長字串確認被略過</div>"
[ "$EXIT" = "0" ] && { echo "  PASS"; PASS=$((PASS+1)); } || { echo "  FAIL ($STDOUT)"; FAIL=$((FAIL+1)); }
echo "Results: $PASS PASS, $FAIL FAIL"
[ "$FAIL" -eq 0 ] || exit 1
