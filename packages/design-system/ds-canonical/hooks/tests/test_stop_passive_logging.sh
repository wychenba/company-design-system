#!/bin/bash
# Tests for stop_passive_logging.sh — Stop hook orchestrator(5 internal rules:tsc_sanity / harvest_corrections / capture_metrics / governance_drift / infra_best_practice_score)
#
# Orchestrator smoke test only — all 5 internal rules are passive(silent log to .claude/logs/*.jsonl,no stderr / no exit non-zero)。
# Detailed rule tests are within their original lib hooks(now folded into this dispatcher,unit tests at lib level historically)。
#
# 2026-05-23 ship per Phase D4 sub-threshold cleanup(15+1 hook tests batch)。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../stop_passive_logging.sh"

if [ ! -x "$HOOK" ]; then
  echo "FATAL: hook not executable: $HOOK"
  exit 1
fi

PASS=0
FAIL=0
FAILED_TESTS=""

run_hook() {
  local payload="$1"
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDOUT_TEXT=$(cat "$STDOUT")
  STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

expect_pass_silent() {
  local name="$1"
  if [ "$EXIT" = "0" ] && [ -z "$STDOUT_TEXT" ] && [ -z "$STDERR_TEXT" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (exit=$EXIT, stdout='$STDOUT_TEXT', stderr='$STDERR_TEXT')"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_exit_0() {
  local name="$1"
  if [ "$EXIT" = "0" ]; then
    echo "  PASS  $name (exit 0)"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit 0, got $EXIT)"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== stop_passive_logging tests(orchestrator smoke)==="

# 1. bash -n syntax check
bash -n "$HOOK"
if [ $? = 0 ]; then echo "  PASS  1. syntax OK"; PASS=$((PASS+1)); else echo "  FAIL  1. syntax broke"; FAIL=$((FAIL+1)); fi

# 2. empty JSON input → exit 0 silent
run_hook '{}'
expect_exit_0 "2. empty JSON input → exit 0"

# 3. session_id only → exit 0
run_hook '{"session_id":"test-session-abc"}'
expect_exit_0 "3. session_id input → exit 0"

# 4. transcript_path nonexistent → exit 0(graceful)
run_hook '{"transcript_path":"/tmp/nonexistent-test-transcript.jsonl","session_id":"test"}'
expect_exit_0 "4. nonexistent transcript → exit 0 graceful"

# 5. invalid JSON → exit 0(jq fail handled)
run_hook 'not-valid-json'
expect_exit_0 "5. malformed JSON input → exit 0"

# 6. valid empty transcript → exit 0
TMP_TRANSCRIPT=$(mktemp)
echo '' > "$TMP_TRANSCRIPT"
run_hook "{\"transcript_path\":\"$TMP_TRANSCRIPT\",\"session_id\":\"test\"}"
rm -f "$TMP_TRANSCRIPT"
expect_exit_0 "6. empty transcript file → exit 0"

# 7. realistic Stop event payload → exit 0(R3 capture_metrics may write log file,but exit 0 invariant)
TMP_TRANSCRIPT=$(mktemp)
cat > "$TMP_TRANSCRIPT" << 'EOF'
{"type":"user","message":{"role":"user","content":"test"}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"reply"}]}}
EOF
run_hook "{\"transcript_path\":\"$TMP_TRANSCRIPT\",\"session_id\":\"test-smoke\"}"
rm -f "$TMP_TRANSCRIPT"
expect_exit_0 "7. realistic Stop event payload → exit 0"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS+FAIL))"
if [ $FAIL -gt 0 ]; then
  echo -e "Failed:$FAILED_TESTS"
  exit 1
fi
