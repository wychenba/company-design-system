#!/bin/bash
# Tests for check_substantive_edit_approval_preflight.sh(2026-05-15 P0 升級)
#
# Hook 規則:PreToolUse + Edit|Write|MultiEdit + file in packages/design-system/src/**.{tsx,ts,css}
# 掃 transcript_path 最後 5 條 user msg → 無 approval keyword → BLOCK exit 2 stderr。
# 有 approval keyword → silent pass。
# Allowlist:.stories.tsx / .test.ts / .spec.ts → skip。
# Override:CLAUDE_BYPASS_DESIGN_APPROVAL=1 → silent (audit-logged)。
# 非 PreToolUse event / non-DS path / 無 transcript file → silent。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_substantive_edit_approval_preflight.sh"

if [ ! -x "$HOOK" ]; then
  echo "FATAL: hook not executable: $HOOK"
  exit 1
fi

PASS=0
FAIL=0
FAILED_TESTS=""

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# Build a transcript JSONL with N user messages (assistant lines in between).
# Schema: 每 line 一 JSON record。Hook 用 jq `.message.role=="user"` filter + text extract。
build_transcript() {
  local path="$1"; shift
  : > "$path"
  for msg in "$@"; do
    jq -n --arg t "$msg" \
      '{message: {role: "user", content: [{type: "text", text: $t}]}}' >> "$path"
  done
}

run_hook() {
  local tool="$1"
  local file_path="$2"
  local transcript="$3"
  local payload
  payload=$(jq -n \
    --arg tn "$tool" --arg fp "$file_path" --arg tp "$transcript" \
    '{
       hook_event_name: "PreToolUse",
       tool_name: $tn,
       tool_input: {file_path: $fp, content: "// fake edit"},
       transcript_path: $tp
     }')
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

# Same as run_hook but with custom event (for non-PreToolUse test)
run_hook_event() {
  local event="$1"; local tool="$2"; local file_path="$3"; local transcript="$4"
  local payload
  payload=$(jq -n \
    --arg ev "$event" --arg tn "$tool" --arg fp "$file_path" --arg tp "$transcript" \
    '{
       hook_event_name: $ev,
       tool_name: $tn,
       tool_input: {file_path: $fp, content: "// fake edit"},
       transcript_path: $tp
     }')
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

echo "=== check_substantive_edit_approval_preflight tests ==="

# Common transcripts
TX_NEUTRAL="$TMP_DIR/tx_neutral.jsonl"
build_transcript "$TX_NEUTRAL" \
  "請幫我看一下這個 component" \
  "再 review 一次" \
  "我覺得需要 refactor" \
  "幫我跑 audit" \
  "謝謝"

TX_APPROVAL="$TMP_DIR/tx_approval.jsonl"
build_transcript "$TX_APPROVAL" \
  "請幫我看一下" \
  "OK 同意這個方向" \
  "可以 implement 了" \
  "拍板,做吧" \
  "go ahead"

PROD_TSX="/foo/my-project/packages/design-system/src/components/Button/button.tsx"

# 1. Non-PreToolUse event → silent
run_hook_event "PostToolUse" "Edit" "$PROD_TSX" "$TX_NEUTRAL"
expect_pass_silent "1. event=PostToolUse → skip"

# 2. Non-Edit tool → silent
run_hook "Read" "$PROD_TSX" "$TX_NEUTRAL"
expect_pass_silent "2. tool=Read → skip"

# 3. Non-DS production path → silent
run_hook "Edit" "/foo/my-project/src/app.tsx" "$TX_NEUTRAL"
expect_pass_silent "3. non-DS production path → skip"

# 4. Stories file in DS → silent (allowlist)
run_hook "Edit" "/foo/my-project/packages/design-system/src/components/Button/button.stories.tsx" "$TX_NEUTRAL"
expect_pass_silent "4. .stories.tsx in DS → skip (allowlist)"

# 5. DS production tsx + no transcript file → silent
run_hook "Edit" "$PROD_TSX" "/nonexistent/path.jsonl"
expect_pass_silent "5. transcript file missing → skip"

# 6. DS production tsx + neutral transcript (no approval) → BLOCK
run_hook "Edit" "$PROD_TSX" "$TX_NEUTRAL"
expect_block "6. DS tsx + no approval → BLOCK exit 2" "BLOCKER"

# 7. DS production tsx + approval keyword in recent user msg → silent pass
run_hook "Edit" "$PROD_TSX" "$TX_APPROVAL"
expect_pass_silent "7. DS tsx + approval keyword → silent"

# 8. CLAUDE_BYPASS_DESIGN_APPROVAL=1 override → silent
STDOUT=$(mktemp); STDERR=$(mktemp)
set +e
CLAUDE_BYPASS_DESIGN_APPROVAL=1 printf '%s' "$(jq -n \
  --arg fp "$PROD_TSX" --arg tp "$TX_NEUTRAL" \
  '{
     hook_event_name: "PreToolUse",
     tool_name: "Edit",
     tool_input: {file_path: $fp, content: "// fake"},
     transcript_path: $tp
   }')" | CLAUDE_BYPASS_DESIGN_APPROVAL=1 bash "$HOOK" >"$STDOUT" 2>"$STDERR"
EXIT=$?
set -e
STDERR_TEXT=$(cat "$STDERR")
rm -f "$STDOUT" "$STDERR"
expect_pass_silent "8. CLAUDE_BYPASS_DESIGN_APPROVAL=1 override → silent"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
