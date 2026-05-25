#!/bin/bash
# Tests for check_solo_workflow.sh(M28,2026-05-08 codified)
#
# Hook 規則(PreToolUse,Bash + mcp__github__create_pull_request + mcp__github__merge_pull_request):
#   R1. `git checkout -b claude/X` 第 2 次 in same session → BLOCK exit 2
#       (1st creation OK,record to TRACK_FILE)
#   R2. `gh pr create` / `gh api -X POST .../pulls` / mcp__github__create_pull_request → BLOCK exit 2
#       (read-only `gh api .../pulls/N/comments` 不 block)
#   R3. `git push ... main` / mcp__github__merge_pull_request 無 user "push" trigger → BLOCK exit 2
#       (transcript 含 push/OK/合 main keyword → silent pass)
# Override:CLAUDE_BYPASS_SOLO_WORKFLOW=1 → silent (audit-logged)。
# Non-Bash non-MCP / 非觸發 command → silent。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_solo_workflow.sh"

if [ ! -x "$HOOK" ]; then
  echo "FATAL: hook not executable: $HOOK"
  exit 1
fi

PASS=0
FAIL=0
FAILED_TESTS=""

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# Override CLAUDE_PROJECT_DIR so TRACK_FILE / BYPASS_LOG land in TMP_DIR
# (避免污染 repo .claude/logs/)
export CLAUDE_PROJECT_DIR="$TMP_DIR"
mkdir -p "$TMP_DIR/.claude/logs"
TRACK_FILE="$TMP_DIR/.claude/logs/session-branch-track.jsonl"

build_transcript() {
  local path="$1"; shift
  : > "$path"
  for msg in "$@"; do
    jq -n --arg t "$msg" \
      '{type:"user", message:{role:"user", content:$t}}' >> "$path"
  done
}

run_hook_bash() {
  local cmd="$1"; local session="${2:-sess-1}"; local transcript="${3:-}"
  local payload
  if [ -n "$transcript" ]; then
    payload=$(jq -n \
      --arg c "$cmd" --arg s "$session" --arg tp "$transcript" \
      '{tool_name:"Bash", session_id:$s, transcript_path:$tp, tool_input:{command:$c}}')
  else
    payload=$(jq -n \
      --arg c "$cmd" --arg s "$session" \
      '{tool_name:"Bash", session_id:$s, tool_input:{command:$c}}')
  fi
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

run_hook_mcp() {
  local tool="$1"; local transcript="${2:-}"
  local payload
  if [ -n "$transcript" ]; then
    payload=$(jq -n --arg t "$tool" --arg tp "$transcript" \
      '{tool_name:$t, transcript_path:$tp, tool_input:{}}')
  else
    payload=$(jq -n --arg t "$tool" \
      '{tool_name:$t, tool_input:{}}')
  fi
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

expect_pass_silent() {
  local name="$1"
  if [ "$EXIT" = "0" ] && [ -z "$STDERR_TEXT" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected silent, exit=$EXIT, stderr=$([ -n "$STDERR_TEXT" ] && echo non-empty || echo empty))"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_block() {
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "2" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected BLOCK exit=2 + '$needle', got exit=$EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== check_solo_workflow tests ==="

TX_NO_TRIGGER="$TMP_DIR/tx_no_trigger.jsonl"
build_transcript "$TX_NO_TRIGGER" \
  "請幫我看一下" \
  "改個 padding" \
  "audit 一下" \
  "謝謝" \
  "再 review"

TX_PUSH_TRIGGER="$TMP_DIR/tx_push_trigger.jsonl"
build_transcript "$TX_PUSH_TRIGGER" \
  "請改" \
  "OK 看起來不錯" \
  "可以 push 了" \
  "合進去" \
  "謝謝"

# 1. Non-Bash / Non-MCP tool → silent
payload_other=$(jq -n '{tool_name:"Read", tool_input:{file_path:"/a"}}')
STDOUT=$(mktemp); STDERR=$(mktemp)
set +e
printf '%s' "$payload_other" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
EXIT=$?
set -e
STDERR_TEXT=$(cat "$STDERR")
rm -f "$STDOUT" "$STDERR"
expect_pass_silent "1. tool=Read → skip"

# 2. Non-trigger Bash command → silent
run_hook_bash "ls -la"
expect_pass_silent "2. innocuous bash → silent"

# 3. R1: First `git checkout -b claude/foo` for session → silent + record
rm -f "$TRACK_FILE"
run_hook_bash "git checkout -b claude/foo" "sess-A"
expect_pass_silent "3. R1 first claude/foo branch → silent (recorded)"

# 4. R1: Second different branch in SAME session → BLOCK
# (TRACK_FILE has sess-A → claude/foo from test 3)
run_hook_bash "git checkout -b claude/bar" "sess-A"
expect_block "4. R1 second branch same session → BLOCK" "R1 BLOCKER"

# 5. R1: Same branch name reuse in same session → silent (EXISTING == NEW_BRANCH)
# Hook 邏輯:已存在 + 同 branch 名 → 不 block (跳 if 條件)。
run_hook_bash "git checkout -b claude/foo" "sess-A"
expect_pass_silent "5. R1 same branch reuse same session → silent"

# 6. R2: gh pr create → BLOCK
run_hook_bash "gh pr create --title 'x' --body 'y'"
expect_block "6. R2 gh pr create → BLOCK" "R2 BLOCKER"

# 7. R2: read-only gh api pulls/N/comments → silent (allow read collab)
run_hook_bash "gh api repos/foo/bar/pulls/123/comments"
expect_pass_silent "7. R2 read-only gh api .../comments → silent"

# 8. R2: gh api -X POST pulls → BLOCK (write method)
run_hook_bash "gh api -X POST repos/foo/bar/pulls -f title=x"
expect_block "8. R2 gh api -X POST pulls → BLOCK" "R2 BLOCKER"

# 9. R3: git push origin main + no trigger transcript → BLOCK
run_hook_bash "git push origin main" "sess-B" "$TX_NO_TRIGGER"
expect_block "9. R3 push main no trigger → BLOCK" "R3 BLOCKER"

# 10. R3: git push origin main + trigger transcript → silent
run_hook_bash "git push origin main" "sess-C" "$TX_PUSH_TRIGGER"
expect_pass_silent "10. R3 push main + push trigger → silent"

# 11. MCP create_pull_request → BLOCK
run_hook_mcp "mcp__github__create_pull_request"
expect_block "11. MCP create_pull_request → BLOCK" "R2 BLOCKER"

# 12. MCP merge_pull_request + no trigger → BLOCK
run_hook_mcp "mcp__github__merge_pull_request" "$TX_NO_TRIGGER"
expect_block "12. MCP merge no trigger → BLOCK" "R3 BLOCKER"

# 13. CLAUDE_BYPASS_SOLO_WORKFLOW=1 override → silent
payload_bypass=$(jq -n '{tool_name:"Bash", session_id:"sess-X", tool_input:{command:"gh pr create"}}')
STDOUT=$(mktemp); STDERR=$(mktemp)
set +e
printf '%s' "$payload_bypass" | CLAUDE_BYPASS_SOLO_WORKFLOW=1 bash "$HOOK" >"$STDOUT" 2>"$STDERR"
EXIT=$?
set -e
STDERR_TEXT=$(cat "$STDERR")
rm -f "$STDOUT" "$STDERR"
expect_pass_silent "13. CLAUDE_BYPASS_SOLO_WORKFLOW=1 override → silent"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
