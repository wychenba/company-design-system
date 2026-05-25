#!/bin/bash
# Smoke test for log_governance_fires.sh
set -u
HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../log_governance_fires.sh"
[ -x "$HOOK" ] || { echo "FATAL"; exit 1; }
PASS=0
echo "Test 1: empty payload → no crash"
STDOUT=$(echo '{}' | bash "$HOOK" 2>&1); EXIT=$?
[ "$EXIT" -le 1 ] && { echo "  PASS exit=$EXIT"; PASS=1; } || { echo "  FAIL exit=$EXIT"; exit 1; }
echo "Results: $PASS PASS, 0 FAIL"
