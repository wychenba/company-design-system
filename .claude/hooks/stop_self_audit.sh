#!/bin/bash
# Stop hook: AI self-audit — detect 3 anti-patterns + inject corrective context.
#
# 1. Claim-verification gap:assistant claimed「verified / done / 全部 / pass / 完成」
#    in transcript but no verify cmd(tsc / hook test / compile / audit)ran this turn
# 2. Auto-prune trigger:CLAUDE.md > 500 OR foundational SSOT spec > cap → inject
#    /knowledge-prune chain reminder
# 3. Repeated-topic detector:user 問同 topic ≥ 3 turns within session → inject
#    /ensure-canonical reminder(M19 trigger phrase auto-pipeline)
#
# Why: M14 / M19 markdown rules rely on AI memory(unreliable). 本 hook 是 mechanical
# 落地 — AI 不需要記得自我審查,hook 強制 inject 反思 prompt to next turn。
#
# Triggers: every Stop event(low cost ~50ms per turn)。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

INPUT=$(cat 2>/dev/null || echo "{}")
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)

WARNINGS=""

# ── Mechanism 1: Claim-verification gap ─────────────────────────────────────
if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
  # Get last assistant turn text(approximate via tail JSON)
  LAST_ASSISTANT=$(tail -200 "$TRANSCRIPT_PATH" 2>/dev/null | \
    jq -r 'select(.message.role=="assistant") | .message.content[]?.text // empty' 2>/dev/null | \
    tail -50)

  # Detect claim keywords
  CLAIM_RE='(verified|all green|all pass|0 errors|完成|全部 done|全綠|沒問題|tsc 0|永遠合規|不留待辦|done\.|complete\.|✅)'
  # 撤回 escape:assistant 已明確撤回 / 認錯 → 不 trigger gap
  RETRACT_RE='(撤回 claim|false claim|沒修好|未驗證|撤回)'
  if echo "$LAST_ASSISTANT" | grep -qiE "$CLAIM_RE" && ! echo "$LAST_ASSISTANT" | grep -qiE "$RETRACT_RE"; then
    # Check if any verify-class tool_use happened recent turns
    # (look for npx tsc / bash test / compile-stories / npm run / audit invocations)
    VERIFY_RE='(npx tsc|bash .claude/hooks/tests|compile-stories|npm run build|npm run test|design-system-audit|visual-audit)'
    if ! tail -200 "$TRANSCRIPT_PATH" 2>/dev/null | grep -qE "$VERIFY_RE"; then
      WARNINGS="${WARNINGS}\n  • Claim-verify gap:你說 verified / done / 完成 等,但本 turn 無 tsc / test / audit 真執行。下輪實跑驗證或撤回 claim。"
      # 標記 CRITICAL — Mechanism 1 升 BLOCKER(2026-04-30 升級):AI claim done 但無驗證
      # = 100+ 次重複 failure mode。不再 silent log,exit `decision: block` 強制 turn 不結束。
      CRITICAL_CLAIM_VERIFY=1
    fi
  fi
fi

# ── Mechanism 2: Auto-prune trigger ─────────────────────────────────────────
if [ -f CLAUDE.md ]; then
  L=$(wc -l < CLAUDE.md | tr -d ' ')
  if [ "$L" -gt 500 ]; then
    WARNINGS="${WARNINGS}\n  • CLAUDE.md ${L} 行(over 500 — auto-prune trigger)。下輪 invoke /knowledge-prune scope=full,不 defer。"
  fi
fi

# Foundational SSOT spec over cap
for f in src/design-system/tokens/color/color.spec.md \
         src/design-system/patterns/element-anatomy/item-anatomy.spec.md \
         src/design-system/components/Sidebar/sidebar.spec.md \
         src/design-system/components/TreeView/tree-view.spec.md \
         src/design-system/components/Field/field.spec.md \
         src/design-system/components/Field/field-controls.spec.md \
         src/design-system/components/Button/button.spec.md \
         src/design-system/patterns/overlay-surface/overlay-surface.spec.md \
         src/design-system/patterns/action-bar/action-bar.spec.md \
         src/design-system/tokens/uiSize/uiSize.spec.md; do
  [ -f "$f" ] || continue
  L=$(wc -l < "$f" | tr -d ' ')
  case "$f" in
    */item-anatomy.spec.md) cap=1200 ;;
    *) cap=800 ;;
  esac
  if [ "$L" -gt "$cap" ]; then
    WARNINGS="${WARNINGS}\n  • $f ${L}/${cap} cap — auto-prune trigger,下輪 /knowledge-prune"
  fi
done

# ── Mechanism 3: Repeated-topic detector(session-scope, M13/M19 trigger)──
if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
  # Extract user message texts from transcript
  USER_MSGS=$(tail -500 "$TRANSCRIPT_PATH" 2>/dev/null | \
    jq -r 'select(.message.role=="user") | .message.content // empty | if type=="string" then . else (.[]? | .text // empty) end' 2>/dev/null)

  # Detect M13/M19-style trigger phrases repeated across turns
  TRIGGER_RE='(確保|永遠|不留待辦|不能漂移|沒例外|ensure|always|never|world-class|世界級)'
  TRIGGER_COUNT=$(echo "$USER_MSGS" | grep -ciE "$TRIGGER_RE" 2>/dev/null || echo 0)

  if [ "$TRIGGER_COUNT" -ge 3 ]; then
    WARNINGS="${WARNINGS}\n  • User trigger-phrase 累計 ${TRIGGER_COUNT} 次(M19 strong signal)。確認 /ensure-canonical 5-layer 全做完;若有任一 layer skip = 違反 M19。"
  fi

  # Same-topic repetition(quick keyword overlap heuristic)
  TOPIC_KEYWORDS=$(echo "$USER_MSGS" | tr -s '[:space:]' '\n' | \
    grep -iE '^(audit|prune|principles|trait|canonical|hook|skill|world-class|infra)$' | \
    sort | uniq -c | sort -rn | head -3)
  TOP_COUNT=$(echo "$TOPIC_KEYWORDS" | head -1 | awk '{print $1}')

  if [ -n "$TOP_COUNT" ] && [ "$TOP_COUNT" -gt 5 ]; then
    TOP_TOPIC=$(echo "$TOPIC_KEYWORDS" | head -1 | awk '{print $2}')
    WARNINGS="${WARNINGS}\n  • Topic「${TOP_TOPIC}」repeated ${TOP_COUNT}x — likely user 第 N 次提示同主題,可能 prior turns 落地不徹底。"
  fi
fi

# Silent if nothing
[ -z "$WARNINGS" ] && exit 0

# 永遠 log warnings(下 turn 透過 inject_pending_self_audit 看到)
mkdir -p "$PROJECT_DIR/.claude/logs" 2>/dev/null
printf '{"ts":"%s","warnings":%s}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "$(printf '%b' "$WARNINGS" | jq -Rs .)" \
  >> "$PROJECT_DIR/.claude/logs/self-audit-warnings.jsonl" 2>/dev/null || true

# ── BLOCKER upgrade(2026-04-30):Mechanism 1 claim-verify gap 升 block ──
# Anthropic Stop hook 接受 stdout JSON `{"decision":"block","reason":...}` 強制 turn
# 不結束,AI 必先處理 reason 再能完成。這修補 100+ 次重複 failure:AI claim done →
# 下 turn user 才發現未修 → 我重發現 → 補修。
#
# 防 infinite loop:同一 claim hash 已 block 過 1 次 → 該 turn 不再 block(降 warn)。
# 假設同一 claim hash:assistant text 末 200 char 的 sha256 prefix。
if [ "${CRITICAL_CLAIM_VERIFY:-0}" = "1" ] && [ -n "$LAST_ASSISTANT" ]; then
  CLAIM_HASH=$(echo "$LAST_ASSISTANT" | tail -c 200 | shasum -a 256 | cut -c1-16)
  LAST_BLOCKED_FILE="$PROJECT_DIR/.claude/logs/.last-blocked-claim.txt"
  LAST_BLOCKED=""
  [ -f "$LAST_BLOCKED_FILE" ] && LAST_BLOCKED=$(cat "$LAST_BLOCKED_FILE" 2>/dev/null || echo "")

  if [ "$CLAIM_HASH" != "$LAST_BLOCKED" ]; then
    # 第一次 block,記 hash 防 loop
    echo "$CLAIM_HASH" > "$LAST_BLOCKED_FILE" 2>/dev/null || true
    REASON=$(printf '%s' \
      "🚨 CLAIM-VERIFY GAP BLOCKER:你 claim「verified / done / 完成」但本 turn 沒跑 tsc / test / audit / visual 真驗證。立刻 (a) 跑 npx tsc -b + 對應驗證指令,OR (b) 在本 turn 明確撤回 claim(打「撤回 claim」/「未驗證」)。否則 turn 不結束。" \
      "本機制 = M20 100+ 次 failure mode 升 BLOCKER(原 silent inject → block)。")
    # Anthropic Stop hook decision:block 格式
    printf '{"decision":"block","reason":%s}\n' "$(printf '%s' "$REASON" | jq -Rs .)"
    exit 0
  fi
fi

exit 0
