#!/bin/bash
# Tests for session_start_governance_check.sh
#
# Scenarios:
#   1. healthy project — silent (no reminders)
#   2. CLAUDE.md > 800 (soft) — REMINDERS fire
#   3. CLAUDE.md > 1000 (hard) — BLOCKERS fire
#   4. corrections > 40 (hard) — BLOCKERS fire
#   5. fire-weighted gap (G7) — surfaces hot hook without test

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../session_start_governance_check.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }

PASS=0; FAIL=0; FAILED=""

setup_proj() {
  TMP_PROJ=$(mktemp -d)
  # 2026-05-08 fix:test isolation — empty memory dir 強制 hook 走 PROJECT_DIR scope,
  # 不退回 $HOME harness SSOT(避免測試環境讀真實 user memory count 觸發 false blocker)
  mkdir -p "$TMP_PROJ/.claude/logs" "$TMP_PROJ/.claude/hooks/tests" "$TMP_PROJ/.claude/memory"
  # NOTE: deliberately NOT creating benchmarks dir(absent dir = no warning,
  # creating an empty one = "never fetched" warning fires)
  echo 'log_hook_fire() { :; }' > "$TMP_PROJ/.claude/hooks/_log-fire.sh"
  # codex stub:hook L270 env-smoke 檢查 node_modules/.bin/codex(cd 到 PROJECT_DIR 後相對)。
  # TMP_PROJ 無 node_modules → env-smoke「codex 缺」advisory 會 fire,污染 governance 斷言。
  # 放可執行 stub 讓 env-smoke deterministic 靜默,測試只驗 governance 邏輯(2026-05-30 加,
  # 修 env-smoke feature 加入後沒同步更 test 的 pre-existing 失敗)。
  mkdir -p "$TMP_PROJ/node_modules/.bin"
  printf '#!/bin/sh\n' > "$TMP_PROJ/node_modules/.bin/codex"
  chmod +x "$TMP_PROJ/node_modules/.bin/codex"
  # 5-line healthy CLAUDE.md
  printf '%s\n' a b c d e > "$TMP_PROJ/CLAUDE.md"
  # init git for last-prune check (no commits → -1)
  ( cd "$TMP_PROJ" && git init -q && git -c commit.gpgsign=false -c user.name=test -c user.email=t@t.com commit --allow-empty -m "init" -q ) 2>/dev/null
}

teardown_proj() { rm -rf "$TMP_PROJ"; }

run_hook() {
  STDOUT=$(mktemp)
  set +e; CLAUDE_PROJECT_DIR="$TMP_PROJ" bash "$HOOK" < /dev/null > "$STDOUT" 2>&1; EXIT=$?; set -e
  STDOUT_TEXT=$(cat "$STDOUT"); rm -f "$STDOUT"
}

# Test 1: healthy project → silent
echo "Test 1: healthy project silent"
setup_proj
run_hook
if [ "$EXIT" = "0" ] && [ -z "$STDOUT_TEXT" ]; then
  echo "  PASS  Test 1 healthy silent"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 1 (exit=$EXIT, output='$STDOUT_TEXT')"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 1"
fi
teardown_proj

# Test 2: CLAUDE.md > 600 (strong-warn) → REMINDERS only(2026-04-26 tightened)
echo "Test 2: CLAUDE.md strong-warn threshold (601)"
setup_proj
yes '.' | head -650 > "$TMP_PROJ/CLAUDE.md"
run_hook
if [ "$EXIT" = "0" ] && [ -z "$STDOUT_TEXT" ]; then
  echo "  PASS  Test 2 silent on soft (601 lines, noise reduction 2026-04-26)"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 2 (output: $STDOUT_TEXT)"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 2"
fi
teardown_proj

# Test 3: CLAUDE.md > 800 (transition cap breach) → BLOCKERS(2026-04-26 tightened)
echo "Test 3: CLAUDE.md transition cap breach (801)"
setup_proj
yes '.' | head -850 > "$TMP_PROJ/CLAUDE.md"
run_hook
if [ "$EXIT" = "0" ] && echo "$STDOUT_TEXT" | grep -q "BLOCKER" && echo "$STDOUT_TEXT" | grep -qE "(hard|transition) cap 800 (breached|exceeded)"; then
  echo "  PASS  Test 3 hard-cap 800 BLOCKER"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 3 (output: $STDOUT_TEXT)"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 3"
fi
teardown_proj

# Test 4: corrections > 40 (hard) → BLOCKERS
echo "Test 4: corrections hard threshold"
setup_proj
yes '{}' | head -45 > "$TMP_PROJ/.claude/logs/user-corrections.jsonl"
run_hook
if [ "$EXIT" = "0" ] && echo "$STDOUT_TEXT" | grep -q "BLOCKER" && echo "$STDOUT_TEXT" | grep -q "HARD THRESHOLD 40"; then
  echo "  PASS  Test 4 corrections hard BLOCKER"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 4 (output: $STDOUT_TEXT)"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 4"
fi
teardown_proj

# Test 5: fire-weighted gap (G7)
echo "Test 5: fire-weighted gap"
setup_proj
# Generate 150 fire entries for hook 'foo'
for i in $(seq 1 150); do
  echo '{"hook":"foo.sh"}'
done > "$TMP_PROJ/.claude/logs/hook-fires-per-hook.jsonl"
# foo has no test (tests dir is empty)
run_hook
if [ "$EXIT" = "0" ] && [ -z "$STDOUT_TEXT" ]; then
  echo "  PASS  Test 5 silent on soft fire-weighted gap (noise reduction)"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 5 (output: $STDOUT_TEXT)"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 5"
fi
teardown_proj

# Test 6: Hook count > 26 (soft prune trigger) — auto-prune fires
echo "Test 6: hook count 27 → soft prune trigger"
setup_proj
# Create 27 fake hooks(超過 soft 26)
for i in $(seq 1 27); do
  : > "$TMP_PROJ/.claude/hooks/check_fake_${i}.sh"
done
run_hook
if [ "$EXIT" = "0" ] && echo "$STDOUT_TEXT" | grep -qE "(Auto-prune triggers|Hook count)"; then
  echo "  PASS  Test 6 hook count soft trigger"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 6 (output: ${STDOUT_TEXT:0:200})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 6"
fi
teardown_proj

# Test 7: Hook count > hard cap → BLOCKER
# Cap 從 SSOT(session_start_governance_check.sh `HOOK_COUNT" -gt N`)動態讀,避免 cap 升級後測試 re-drift。
# Anchor:2026-05-29 cap 已升 45→60 但本測試寫死 46/「hard 45」→ CI hook-test 失敗 → 連帶 storybook
# build + GitHub Pages deploy 全卡(deploy-storybook job gated 在 Verify pass)。改動態讀後永不 drift。
HARD_CAP=$(grep -oE 'HOOK_COUNT" -gt [0-9]+' "$HOOK" | grep -oE '[0-9]+' | head -1)
echo "Test 7: hook count > hard cap ${HARD_CAP} → BLOCKER (cap 從 SSOT 讀)"
setup_proj
for i in $(seq 1 $((HARD_CAP + 5))); do
  : > "$TMP_PROJ/.claude/hooks/check_fake_${i}.sh"
done
run_hook
if [ "$EXIT" = "0" ] && echo "$STDOUT_TEXT" | grep -q "BLOCKER" && echo "$STDOUT_TEXT" | grep -qE "hard ${HARD_CAP}"; then
  echo "  PASS  Test 7 hook count hard BLOCKER (cap ${HARD_CAP})"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 7 (output: ${STDOUT_TEXT:0:200})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 7"
fi
teardown_proj

echo ""
echo "════ Results: $PASS PASS, $FAIL FAIL ════"
[ "$FAIL" -gt 0 ] && { printf "Failed:%b\n" "$FAILED"; exit 1; }
exit 0
