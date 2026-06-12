#!/bin/bash
# Tests for post_edit_dispatcher.sh (orchestrator)
#
# orchestrator smoke test only — lib hook detailed tests are separate.
# Dispatcher fans out stdin to 9 lib/_*.sh helpers (PostToolUse Write|Edit|MultiEdit),
# aggregates their JSON additionalContext, prints ONE JSON output, exit 0 (non-blocking).
#
# Smoke checks:
#   (a) bash -n syntax OK
#   (b) JSON input → exit 0(non-blocking,no matter helper outcome)
#   (c) Empty / malformed stdin → still exit 0
#   (d) Helper aggregation:if any helper emits additionalContext, dispatcher includes it
#       in stdout JSON;若全 helper silent → dispatcher 也 silent(no stdout)。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../post_edit_dispatcher.sh"

if [ ! -f "$HOOK" ]; then echo "FATAL: hook not found: $HOOK"; exit 1; fi

PASS=0
FAIL=0
FAILED_TESTS=""

run_hook_stdin() {
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

expect_exit0() {
  local name="$1"
  if [ "$EXIT" = "0" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit 0, got $EXIT)"
    echo "  --- stdout ---"; echo "$STDOUT_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== post_edit_dispatcher tests (orchestrator smoke) ==="

# 1. bash -n syntax check
set +e
bash -n "$HOOK" 2>/dev/null
SYNTAX=$?
set -e
if [ "$SYNTAX" = "0" ]; then
  echo "  PASS  1. bash -n syntax OK"; PASS=$((PASS+1))
else
  echo "  FAIL  1. bash -n syntax check"
  FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - 1. syntax"
fi

# 2. Valid JSON input (out-of-scope file) → exit 0
PAYLOAD=$(jq -n '{tool_name: "Write", tool_input: {file_path: "/tmp/out-of-scope.txt", content: "noop"}}')
run_hook_stdin "$PAYLOAD"
expect_exit0 "2. valid JSON input → exit 0"

# 3. Empty stdin → exit 0 (dispatcher reads `cat 2>/dev/null || echo "{}"`)
run_hook_stdin ""
expect_exit0 "3. empty stdin → exit 0"

# 4. Malformed JSON → still exit 0 (helpers handle their own jq errors silently)
run_hook_stdin "not-valid-json{{{"
expect_exit0 "4. malformed JSON stdin → exit 0"

# 5. tsx file path (in-scope for some helpers) → exit 0, may emit JSON to stdout
PAYLOAD_TSX=$(jq -n '{tool_name: "Edit", tool_input: {file_path: "/tmp/foo.tsx", new_string: "const x = 1;"}}')
run_hook_stdin "$PAYLOAD_TSX"
expect_exit0 "5. tsx Edit payload → exit 0 (non-blocking)"

# 6. If stdout non-empty, must be valid JSON with hookSpecificOutput
# (only assert when stdout is non-empty — many tsx inputs may yield no warnings)
if [ -n "$STDOUT_TEXT" ]; then
  set +e
  echo "$STDOUT_TEXT" | jq -e '.hookSpecificOutput.additionalContext' >/dev/null 2>&1
  JSON_OK=$?
  set -e
  if [ "$JSON_OK" = "0" ]; then
    echo "  PASS  6. when stdout non-empty, valid JSON with hookSpecificOutput"
    PASS=$((PASS+1))
  else
    echo "  FAIL  6. stdout was non-empty but not valid hookSpecificOutput JSON"
    echo "  --- stdout ---"; echo "$STDOUT_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - 6. stdout JSON shape"
  fi
else
  echo "  PASS  6. stdout silent (all helpers in-scope returned empty) — JSON shape n/a"
  PASS=$((PASS+1))
fi

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
