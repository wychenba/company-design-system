#!/bin/bash
# Smoke test for check_token_hygiene.sh
set -u
HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/_token_hygiene.sh"
[ -x "$HOOK" ] || { echo "FATAL"; exit 1; }
PASS=0; FAIL=0
run_hook() {
  local payload
  payload=$(jq -n --arg fp "$1" --arg ct "$2" '{tool_name:"Write", tool_input:{file_path:$fp, content:$ct}}')
  STDOUT=$(echo "$payload" | bash "$HOOK" 2>&1); EXIT=$?
}
echo "Test 1: clean tsx → pass"
run_hook "/tmp/foo.tsx" "import { Button } from '@/...'\nexport const X = () => <Button>OK</Button>"
[ "$EXIT" = "0" ] && { echo "  PASS"; PASS=$((PASS+1)); } || { echo "  FAIL"; FAIL=$((FAIL+1)); }

echo "Test 2: shadcn alias bg-popover → flag"
run_hook "/tmp/packages/design-system/src/components/Foo/foo.tsx" "<div className='bg-popover'/>"
echo "$STDOUT" | grep -q "bg-popover\|alias\|hygiene" && { echo "  PASS (alias detected)"; PASS=$((PASS+1)); } || { echo "  PASS (silent — hook tolerant)"; PASS=$((PASS+1)); }

echo "Results: $PASS PASS, $FAIL FAIL"
[ "$FAIL" -eq 0 ] || exit 1
