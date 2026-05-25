#!/bin/bash
HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../log_skill_invokes.sh"
[ -x "$HOOK" ] || { echo "FATAL"; exit 1; }
echo "Test 1: empty payload → no crash"
STDOUT=$(echo '{"tool_name":"Skill"}' | bash "$HOOK" 2>&1); EXIT=$?
[ "$EXIT" -le 1 ] && echo "  PASS" || { echo "  FAIL"; exit 1; }
echo "Results: 1 PASS, 0 FAIL"
