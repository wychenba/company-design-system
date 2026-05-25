#!/bin/bash
set -u
HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../check_sync_update.sh"
[ -x "$HOOK" ] || { echo "FATAL"; exit 1; }
PASS=0; FAIL=0
run_hook() {
  local payload=$(jq -n --arg fp "$1" --arg ct "$2" '{tool_name:"Edit", tool_input:{file_path:$fp, new_string:$ct, old_string:""}}')
  STDOUT=$(echo "$payload" | bash "$HOOK" 2>&1); EXIT=$?
}
echo "Test 1: non-DS file → silent skip"
run_hook "/tmp/random.txt" "x"
[ "$EXIT" = "0" ] && { echo "  PASS"; PASS=$((PASS+1)); } || { echo "  FAIL"; FAIL=$((FAIL+1)); }
echo "Results: $PASS PASS, $FAIL FAIL"
[ "$FAIL" -eq 0 ] || exit 1
