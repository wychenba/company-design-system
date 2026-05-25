#!/bin/bash
# Tests for check_audit_post_report_validator.sh
#
# Hook(PostToolUse Write/Edit/MultiEdit):驗 audit report quality:
#   A) NO-SAMPLE keyword 偵測
#   B) Dim ≥ 46 coverage
#   C) audit-prompts.md prompt count
#   D) @benchmark-unverified-blanket count drift
#   E) prune-chain-trigger → emit additionalContext JSON
#
# 只 fire 在 file_path matches `*/audit-report-*.json` 或 `*/project_audit_progress.md`,
# 且 file 必須真實存在於 disk(`[ -f "$FILE_PATH" ] || exit 0`)。
# 輸出至 stdout(JSON additionalContext)時是 trigger_prune=1 路徑;非 prune trigger 走 silent。
# 注意:hook 內 WARNINGS 累積但 stderr 不直接 print(只 stdout JSON);此測試 verify stdout JSON。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_audit_post_report_validator.sh"
TMPDIR_TEST=$(mktemp -d)
trap 'rm -rf "$TMPDIR_TEST"' EXIT

if [ ! -f "$HOOK" ]; then echo "FATAL: hook not found: $HOOK"; exit 1; fi

PASS=0
FAIL=0
FAILED_TESTS=""

run_hook() {
  local file_path="$1"; local tool="$2"
  local payload
  payload=$(jq -n --arg fp "$file_path" --arg tn "$tool" \
    '{tool_name: $tn, tool_input: {file_path: $fp}}')
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  export CLAUDE_PROJECT_DIR="$TMPDIR_TEST"
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDOUT_TEXT=$(cat "$STDOUT")
  STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

expect_silent() {
  local name="$1"
  if [ "$EXIT" = "0" ] && [ -z "$STDOUT_TEXT" ] && [ -z "$STDERR_TEXT" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (exit=$EXIT, stdout=[$STDOUT_TEXT], stderr non-empty=$([ -n "$STDERR_TEXT" ] && echo yes))"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_stdout_contains() {
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "0" ] && echo "$STDOUT_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected stdout contains '$needle', got exit $EXIT)"
    echo "  --- stdout ---"; echo "$STDOUT_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== check_audit_post_report_validator tests ==="

# 1. Non-audit file path → skip silently
run_hook "/tmp/random.txt" "Write"
expect_silent "1. non-audit path → skip"

# 2. Non-Write/Edit tool → skip silently
run_hook "$TMPDIR_TEST/.claude/logs/audit-report-foo.json" "Read"
expect_silent "2. Read tool → skip"

# 3. Audit-report path but file not on disk → skip
run_hook "$TMPDIR_TEST/.claude/logs/audit-report-missing.json" "Write"
expect_silent "3. missing file → skip"

# 4. project_audit_progress.md with NO-SAMPLE keyword but no audit-prompts.md → no prune trigger, silent stdout
mkdir -p "$TMPDIR_TEST/.claude/memory"
cat > "$TMPDIR_TEST/.claude/memory/project_audit_progress.md" <<'EOF'
# Audit progress
Dim 1: pass
Dim 2: pass
Dim 3: pass
EOF
run_hook "$TMPDIR_TEST/.claude/memory/project_audit_progress.md" "Write"
# B fires (DIM_COUNT < 46) but no TRIGGER_PRUNE since audit-prompts.md absent + no bench debt
# stdout should be silent (TRIGGER_PRUNE=0)
expect_silent "4. valid file no prune trigger → silent stdout"

# 5. audit-prompts.md present but only 2 prompts → TRIGGER_PRUNE=1, stdout JSON
mkdir -p "$TMPDIR_TEST/.claude/skills/design-system-audit/references"
cat > "$TMPDIR_TEST/.claude/skills/design-system-audit/references/audit-prompts.md" <<'EOF'
### Dim 1: foo
prompt

### Dim 2: bar
prompt
EOF
cat > "$TMPDIR_TEST/.claude/memory/project_audit_progress.md" <<'EOF'
# Audit progress
Dim 1: pass
EOF
run_hook "$TMPDIR_TEST/.claude/memory/project_audit_progress.md" "Edit"
expect_stdout_contains "5. audit-prompts coverage low → prune trigger JSON" "prune-chain-trigger"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
