#!/bin/bash
# Tests for stop_capture_metrics.sh
#
# Scenarios:
#   1. fresh project(no prior snapshot)→ writes entry
#   2. recent snapshot(< 24h)→ skips
#   3. old snapshot(> 24h)→ writes new entry

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Cluster B merge(2026-05-10):stop_capture_metrics.sh fold 進
# stop_passive_logging.sh dispatcher R3。Test 走 dispatcher。
HOOK="$SCRIPT_DIR/../stop_passive_logging.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }

PASS=0; FAIL=0; FAILED=""

# Use isolated temp project dir per test to avoid touching real metric file
setup_temp_proj() {
  TMP_PROJ=$(mktemp -d)
  mkdir -p "$TMP_PROJ/.claude/logs" "$TMP_PROJ/.claude/hooks" "$TMP_PROJ/.claude/skills"
  # CLAUDE.md fixture
  printf '%s\n' line1 line2 line3 > "$TMP_PROJ/CLAUDE.md"
  # 2 dummy hooks(non-test)
  touch "$TMP_PROJ/.claude/hooks/foo.sh" "$TMP_PROJ/.claude/hooks/bar.sh"
  # 1 skill
  mkdir "$TMP_PROJ/.claude/skills/baz"
  # Need _log-fire.sh stub(hook sources it)
  echo 'log_hook_fire() { :; }' > "$TMP_PROJ/.claude/hooks/_log-fire.sh"
}

teardown_temp_proj() {
  rm -rf "$TMP_PROJ"
}

# Test 1: fresh project → writes entry
echo "Test 1: fresh project(no prior snapshot)"
setup_temp_proj
CLAUDE_PROJECT_DIR="$TMP_PROJ" bash "$HOOK"
EXIT=$?
LINES=$(wc -l < "$TMP_PROJ/.claude/logs/metric-snapshots.jsonl" 2>/dev/null | tr -d ' ' || echo 0)
if [ "$EXIT" = "0" ] && [ "$LINES" = "1" ]; then
  echo "  PASS  Test 1 fresh project writes entry"
  PASS=$((PASS+1))
else
  echo "  FAIL  Test 1 (exit=$EXIT, lines=$LINES, expected exit=0, lines=1)"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 1"
fi
teardown_temp_proj

# Test 2: recent snapshot(< 24h)→ skip
echo "Test 2: recent snapshot skip"
setup_temp_proj
NOW_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "{\"ts\":\"$NOW_ISO\",\"tag\":\"prior\",\"claude_md_lines\":1}" > "$TMP_PROJ/.claude/logs/metric-snapshots.jsonl"
CLAUDE_PROJECT_DIR="$TMP_PROJ" bash "$HOOK"
EXIT=$?
LINES=$(wc -l < "$TMP_PROJ/.claude/logs/metric-snapshots.jsonl" | tr -d ' ')
if [ "$EXIT" = "0" ] && [ "$LINES" = "1" ]; then
  echo "  PASS  Test 2 recent snapshot dedup skip"
  PASS=$((PASS+1))
else
  echo "  FAIL  Test 2 (exit=$EXIT, lines=$LINES, expected dedup keep 1 line)"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 2"
fi
teardown_temp_proj

# Test 3: old snapshot(> 24h)→ append
echo "Test 3: old snapshot triggers new entry"
setup_temp_proj
echo '{"ts":"2026-04-20T00:00:00Z","tag":"prior","claude_md_lines":1}' > "$TMP_PROJ/.claude/logs/metric-snapshots.jsonl"
CLAUDE_PROJECT_DIR="$TMP_PROJ" bash "$HOOK"
EXIT=$?
LINES=$(wc -l < "$TMP_PROJ/.claude/logs/metric-snapshots.jsonl" | tr -d ' ')
if [ "$EXIT" = "0" ] && [ "$LINES" = "2" ]; then
  # Verify new entry has expected fields
  LATEST=$(tail -1 "$TMP_PROJ/.claude/logs/metric-snapshots.jsonl")
  if echo "$LATEST" | jq -e '.untested_hooks != null and .corrections_pending != null and .claude_md_lines == 3' > /dev/null 2>&1; then
    echo "  PASS  Test 3 old snapshot triggers new(schema correct)"
    PASS=$((PASS+1))
  else
    echo "  FAIL  Test 3 schema check (latest=$LATEST)"
    FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 3 schema"
  fi
else
  echo "  FAIL  Test 3 (exit=$EXIT, lines=$LINES, expected exit=0, lines=2)"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 3"
fi
teardown_temp_proj

echo ""
echo "════ Results: $PASS PASS, $FAIL FAIL ════"
[ "$FAIL" -gt 0 ] && { printf "Failed:%b\n" "$FAILED"; exit 1; }
exit 0
