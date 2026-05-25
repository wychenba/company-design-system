#!/bin/bash
# Tests for inject_pending_self_audit.sh

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../inject_pending_self_audit.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }

PASS=0; FAIL=0; FAILED=""

setup_proj() {
  TMP_PROJ=$(mktemp -d)
  mkdir -p "$TMP_PROJ/.claude/hooks" "$TMP_PROJ/.claude/logs"
  echo 'log_hook_fire() { :; }' > "$TMP_PROJ/.claude/hooks/_log-fire.sh"
  export CLAUDE_PROJECT_DIR="$TMP_PROJ"
}
teardown_proj() {
  rm -rf "$TMP_PROJ"
  unset CLAUDE_PROJECT_DIR
}

run_hook() {
  STDOUT=$(echo '{}' | bash "$HOOK" 2>&1)
  EXIT=$?
}

# ── Test 1: 無 log file → silent ──
echo "Test 1: no log files → silent exit 0"
setup_proj
run_hook
if [ "$EXIT" = "0" ] && [ -z "$STDOUT" ]; then
  echo "  PASS  Test 1"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 1 (exit=$EXIT, output=${STDOUT:0:200})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 1"
fi
teardown_proj

# ── Test 2: 有 warnings → inject additionalContext ──
echo "Test 2: warning log present → inject"
setup_proj
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
printf '{"ts":"%s","warnings":"\\n  • Test warning A\\n  • Test warning B"}\n' "$NOW" \
  > "$TMP_PROJ/.claude/logs/self-audit-warnings.jsonl"
run_hook
if [ "$EXIT" = "0" ] && echo "$STDOUT" | grep -q "Test warning A" && echo "$STDOUT" | grep -q "additionalContext"; then
  echo "  PASS  Test 2"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 2 (exit=$EXIT)"
  echo "         output=${STDOUT:0:200}"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 2"
fi
teardown_proj

# ── Test 3: dedup 同 warning → 顯示 [×N] ──
echo "Test 3: duplicate warnings → dedup count"
setup_proj
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
for i in 1 2 3; do
  printf '{"ts":"%s","warnings":"\\n  • Same warning"}\n' "$NOW" \
    >> "$TMP_PROJ/.claude/logs/self-audit-warnings.jsonl"
done
run_hook
if echo "$STDOUT" | grep -q '\[×3\]'; then
  echo "  PASS  Test 3"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 3 — dedup [×3] missing"
  echo "         output=${STDOUT:0:300}"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 3"
fi
teardown_proj

# ── Test 4: LAST_TS 過濾舊條目 ──
echo "Test 4: LAST_TS filter — old entry skipped"
setup_proj
OLD=$(date -u -v-48H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '48 hours ago' +%Y-%m-%dT%H:%M:%SZ)
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
RECENT=$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)
echo "$NOW" > "$TMP_PROJ/.claude/logs/last-inject-ts.txt"
printf '{"ts":"%s","warnings":"\\n  • Old warning(should skip)"}\n' "$OLD" \
  > "$TMP_PROJ/.claude/logs/self-audit-warnings.jsonl"
printf '{"ts":"%s","warnings":"\\n  • Recent warning(also skip,因 < NOW)"}\n' "$RECENT" \
  >> "$TMP_PROJ/.claude/logs/self-audit-warnings.jsonl"
run_hook
if [ "$EXIT" = "0" ] && [ -z "$STDOUT" ]; then
  echo "  PASS  Test 4"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 4 — should be silent (LAST_TS=NOW)"
  echo "         output=${STDOUT:0:200}"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 4"
fi
teardown_proj

# ── Test 5: size cap — 超過 3KB truncate ──
echo "Test 5: large input → truncate ≤ 3.5KB"
setup_proj
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
# 產 50 條不同 warning
for i in $(seq 1 50); do
  printf '{"ts":"%s","warnings":"\\n  • Warning number %d with some padding text to fill space and exceed cap eventually"}\n' "$NOW" "$i" \
    >> "$TMP_PROJ/.claude/logs/self-audit-warnings.jsonl"
done
run_hook
LEN=${#STDOUT}
if [ "$LEN" -lt 3800 ] && echo "$STDOUT" | grep -q "additionalContext"; then
  echo "  PASS  Test 5 (size=$LEN bytes,有 truncate 提示)"
  PASS=$((PASS+1))
else
  echo "  FAIL  Test 5 — size=$LEN bytes(預期 < 3800)"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 5"
fi
teardown_proj

# ── Summary ──
echo ""
echo "── Summary ──"
echo "PASS: $PASS / $(($PASS+$FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "FAIL: $FAIL"
  printf "$FAILED\n"
  exit 1
fi
echo "✅ All passed"
exit 0
