#!/bin/bash
# Runner: executes all test_*.sh in this directory, aggregates results.
#
# Usage: bash .claude/hooks/tests/run-all.sh
#        npm run hooks:test(via package.json wrapper)
#
# Exit: 0 if all pass, 1 if any test suite fails.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Export CLAUDE_PROJECT_DIR so _log-fire.sh doesn't create stray .claude/ dirs
# when hooks are invoked from the test runner(different cwd than real runtime)
export CLAUDE_PROJECT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$SCRIPT_DIR" || exit 1

TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=""

echo "════════════════════════════════════════"
echo "  Hook test runner"
echo "════════════════════════════════════════"

for test_file in test_*.sh; do
  [ -f "$test_file" ] || continue
  TOTAL_SUITES=$((TOTAL_SUITES+1))
  echo ""
  echo "▶ Running: $test_file"
  echo "────────────────────────────────────────"
  if bash "$test_file"; then
    PASSED_SUITES=$((PASSED_SUITES+1))
  else
    FAILED_SUITES="${FAILED_SUITES}\n  - $test_file"
  fi
done

echo ""
echo "════════════════════════════════════════"
echo "  Suites: $PASSED_SUITES / $TOTAL_SUITES passed"
echo "════════════════════════════════════════"

# Coverage report:hooks with / without tests
HOOKS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ALL_HOOKS=$(find "$HOOKS_DIR" -maxdepth 1 -type f \( -name '*.sh' -o -name '*.py' \) \
  | grep -vE '(_log-fire\.sh|log_.*\.sh)' \
  | xargs -n1 basename \
  | sed 's/\.sh$//;s/\.py$//' \
  | sort -u)
TESTED_HOOKS=$(find "$SCRIPT_DIR" -maxdepth 1 -type f -name 'test_*.sh' \
  | xargs -n1 basename \
  | sed 's/^test_//;s/\.sh$//' \
  | sort -u)
UNTESTED=$(comm -23 <(printf '%s\n' "$ALL_HOOKS") <(printf '%s\n' "$TESTED_HOOKS"))
TOTAL_COUNT=$(printf '%s\n' "$ALL_HOOKS" | grep -c . 2>/dev/null || true)
TESTED_COUNT=$(printf '%s\n' "$TESTED_HOOKS" | grep -c . 2>/dev/null || true)
UNTESTED_COUNT=$(printf '%s\n' "$UNTESTED" | grep -c . 2>/dev/null || true)
TOTAL_COUNT="${TOTAL_COUNT:-0}"
TESTED_COUNT="${TESTED_COUNT:-0}"
UNTESTED_COUNT="${UNTESTED_COUNT:-0}"

echo ""
echo "📊 Coverage:"
echo "  Total hooks:  ${TOTAL_COUNT}"
echo "  With tests:   ${TESTED_COUNT}"
echo "  Without:      ${UNTESTED_COUNT}"
if [ "${UNTESTED_COUNT}" -gt 0 ] 2>/dev/null; then
  echo "  (未覆蓋 list — 漸進式補齊,不 block)"
  printf '%s\n' "$UNTESTED" | sed 's/^/    - /' | head -20
fi

if [ -n "$FAILED_SUITES" ]; then
  printf "\nFailed suites:%b\n" "$FAILED_SUITES"
  exit 1
fi
exit 0
