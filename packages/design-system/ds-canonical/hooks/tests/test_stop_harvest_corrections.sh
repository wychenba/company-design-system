#!/bin/bash
# Smoke test for stop_harvest_corrections.sh
set -u
# Cluster B merge(2026-05-10):stop_harvest_corrections.sh fold 進 stop_passive_logging.sh dispatcher R2。
HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../stop_passive_logging.sh"
[ -x "$HOOK" ] || { echo "FATAL"; exit 1; }
echo "Test 1: minimal payload → no crash"
STDOUT=$(echo '{}' | bash "$HOOK" 2>&1); EXIT=$?
[ "$EXIT" -le 2 ] && echo "  PASS exit=$EXIT" || { echo "  FAIL exit=$EXIT out=${STDOUT:0:100}"; exit 1; }
echo "Results: 1 PASS, 0 FAIL"
