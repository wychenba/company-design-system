#!/bin/bash
# Smoke + behavior test for stop_self_audit.sh
# 2026-04-30:升 BLOCKER 行為(Mechanism 1 claim-verify gap)後加 case 2-4
set -u
HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../stop_self_audit.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

PASS=0; FAIL=0
run_test() {
  local name="$1"; local expect_block="$2"; local transcript_content="$3"
  local transcript="$TMPDIR/transcript-$$.jsonl"
  printf '%s\n' "$transcript_content" > "$transcript"
  local input
  input=$(printf '{"transcript_path":"%s","session_id":"test"}' "$transcript")
  # Reset state to avoid block-once dedup interference(all mechanisms' .last-blocked-*)
  rm -f "$PROJECT_DIR"/.claude/logs/.last-blocked-*.txt 2>/dev/null
  local stdout; stdout=$(echo "$input" | bash "$HOOK" 2>/dev/null)
  if [ "$expect_block" = "1" ]; then
    if echo "$stdout" | grep -q '"decision":"block"'; then
      echo "  PASS  $name (blocked as expected)"; PASS=$((PASS+1))
    else
      echo "  FAIL  $name (expected block, got: ${stdout:0:120})"; FAIL=$((FAIL+1))
    fi
  else
    if echo "$stdout" | grep -q '"decision":"block"'; then
      echo "  FAIL  $name (unexpected block: ${stdout:0:120})"; FAIL=$((FAIL+1))
    else
      echo "  PASS  $name (no block)"; PASS=$((PASS+1))
    fi
  fi
}

echo "Test 1: minimal payload → no crash"
out=$(echo '{}' | bash "$HOOK" 2>&1); exit_code=$?
[ "$exit_code" -le 2 ] && echo "  PASS exit=$exit_code" && PASS=$((PASS+1)) || { echo "  FAIL exit=$exit_code"; FAIL=$((FAIL+1)); }

# Test 2: claim「verified」+ no tsc → BLOCK
# NOTE(2026-05-01): hook find last 真 user prompt(role=user 且 content
# 非 tool_result),fixtures 必有 user msg 在 assistant 之前反映真實
# transcript 結構。
USER_MSG='{"message":{"role":"user","content":[{"type":"text","text":"幫我修 bug"}]}}'

T2="$USER_MSG
"'{"message":{"role":"assistant","content":[{"type":"text","text":"已修完,verified ✓ 全部 done"}]}}'
run_test "Test 2: claim+no-verify → block" 1 "$T2"

# Test 3: claim「verified」+ tsc 跑過 → no block
T3="$USER_MSG
"'{"message":{"role":"assistant","content":[{"type":"text","text":"已修完,verified"}]}}
{"message":{"role":"assistant","content":[{"type":"tool_use","name":"Bash","input":{"command":"npx tsc -b"}}]}}'
run_test "Test 3: claim+tsc → no block" 0 "$T3"

# Test 4: claim「verified」+「撤回 claim」escape → no block
T4="$USER_MSG
"'{"message":{"role":"assistant","content":[{"type":"text","text":"先前 verified 說錯,撤回 claim,實際未修好"}]}}'
run_test "Test 4: claim+retract escape → no block" 0 "$T4"

# Test 5: 純對話無 claim → no block
T5="$USER_MSG
"'{"message":{"role":"assistant","content":[{"type":"text","text":"我來看看這個 bug 是怎麼回事"}]}}'
run_test "Test 5: no claim → no block" 0 "$T5"

# Test 6: claim-denial「明確不 claim verified」preemptive denial → no block
T6="$USER_MSG
"'{"message":{"role":"assistant","content":[{"type":"text","text":"我這次明確不 claim verified,只 tsc 過,實際 browser 行為要 user 驗"}]}}'
run_test "Test 6: preemptive claim denial → no block" 0 "$T6"

# Test 7: Mechanism 7 完整性宣告閘 — 宣告「全部做完」+ 2 edits + 無全庫掃描 → BLOCK
T7="$USER_MSG
"'{"message":{"role":"assistant","content":[{"type":"tool_use","name":"Edit","input":{}}]}}
{"message":{"role":"assistant","content":[{"type":"tool_use","name":"Write","input":{}}]}}
{"message":{"role":"assistant","content":[{"type":"text","text":"全部做完了,beta 已上架,tree 乾淨。"}]}}'
run_test "Test 7: M7 完整性宣告+多改+無掃描 → block" 1 "$T7"

# Test 8: 同上但本 turn 有 grep -rn 全庫掃描 → no block(掃描證據被認列)
T8="$USER_MSG
"'{"message":{"role":"assistant","content":[{"type":"tool_use","name":"Edit","input":{}}]}}
{"message":{"role":"assistant","content":[{"type":"tool_use","name":"Bash","input":{"command":"grep -rn foo .claude packages"}}]}}
{"message":{"role":"assistant","content":[{"type":"tool_use","name":"Write","input":{}}]}}
{"message":{"role":"assistant","content":[{"type":"text","text":"全部做完了,已全庫掃描確認無 loose end。"}]}}'
run_test "Test 8: M7 完整性宣告+多改+有全庫掃描 → no block" 0 "$T8"

# Test 9: M7 negation 排除 — 含「全做完」字串但是 disclaimer(還沒說全做完)+ 多改 + 無掃描 → NO block
T9="$USER_MSG
"'{"message":{"role":"assistant","content":[{"type":"tool_use","name":"Edit","input":{}}]}}
{"message":{"role":"assistant","content":[{"type":"tool_use","name":"Write","input":{}}]}}
{"message":{"role":"assistant","content":[{"type":"text","text":"還沒說「全做完」——等 beta.51 落地 + 最後掃過才有資格。核心做完,完整性掃描待跑。"}]}}'
run_test "Test 9: M7 negation disclaimer(還沒說全做完)→ no block" 0 "$T9"

# Cleanup state file
rm -f "$PROJECT_DIR"/.claude/logs/.last-blocked-*.txt 2>/dev/null

echo "Results: $PASS PASS, $FAIL FAIL"
[ "$FAIL" -eq 0 ] || exit 1
