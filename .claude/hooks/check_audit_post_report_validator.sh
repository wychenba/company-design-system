#!/bin/bash
# PostToolUse hook: validate `/design-system-audit` final report quality.
# 2026-05-17 ship — codex Q4 verdict「post-audit stop hook / final report validator」最合理 trigger 位置。
#
# Triggers: 任何 Write/Edit 到 `.claude/logs/audit-report-*.json` OR `.claude/memory/project_audit_progress.md`
#
# 驗證:
#   (a) NO-SAMPLE invariant — report 不含「sample top N / subset / pick top X」keyword
#   (b) 46-dim full dispatch — report 應列 ≥ 46 dim coverage 紀錄(或明示 N/A 跳過理由)
#   (c) audit-prompts.md coverage — 若 missing dim prompt → flag prune-chain-trigger
#   (d) `@benchmark-unverified-blanket` count drift — vs last audit baseline
#   (e) prune-chain-trigger signal → emit additionalContext 進下一 turn,inject_pending_self_audit 吸
#
# 對應 SKILL.md `/design-system-audit` Phase 4.5 機械化 trigger(2026-05-17 加)。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo "{}")
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null)

# Only fire on audit report writes
case "$FILE_PATH" in
  */audit-report-*.json) ;;
  */project_audit_progress.md) ;;
  *) exit 0 ;;
esac

case "$TOOL" in Write|Edit|MultiEdit) ;; *) exit 0 ;; esac

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
[ -f "$FILE_PATH" ] || exit 0

WARNINGS=""
TRIGGER_PRUNE=0

# ─ Validator A: NO-SAMPLE ─────────────────────────────────────────────────
if grep -qE 'sample top [0-9]+|sampled top|subset|pick top [0-9]+|top hot|sampled components' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n  ❌ [A] NO-SAMPLE violation:report 含 sample subset keyword,違反 audit-full-sweep canonical(memory/feedback_audit_full_sweep_not_sample.md)"
fi

# ─ Validator B: dim coverage(2026-05-30 M2/M3 fix per laziness-hunt:原 regex `5[01]` 只到 dim 51,
#   52-88 完全不計（含 PURE-JUDGMENT dim 62/66/68/72）+ 寫死 46。改動態讀 dispatch total + count UNIQUE dim 號）─
DIM_TOTAL=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$PROJECT_DIR/.claude/logs/audit-dims-dispatch.json','utf8')).total)}catch{console.log(88)}" 2>/dev/null || echo 88)
DIM_COUNT=$(grep -oiE '\bdim[[:space:]]+[0-9]{1,2}\b' "$FILE_PATH" 2>/dev/null | grep -oE '[0-9]+' | sort -un | wc -l | tr -d ' ')
DIM_COUNT=${DIM_COUNT:-0}
if [ "$DIM_COUNT" -lt "$DIM_TOTAL" ]; then
  WARNINGS="${WARNINGS}\n  ⚠️ [B] Dim coverage:report 提到 ${DIM_COUNT} unique dim,< ${DIM_TOTAL} 期望。確認全 dim NO-SAMPLE（PURE-JUDGMENT/requiresAgent dim 必有 per-dim agent-output 非散文提號）"
fi

# ─ Validator C: audit-prompts.md coverage ─────────────────────────────────
AUDIT_PROMPTS="$PROJECT_DIR/.claude/skills/design-system-audit/references/audit-prompts.md"
if [ -f "$AUDIT_PROMPTS" ]; then
  # 2026-05-30 M3 fix:原 regex `^### Dim N` 對不上實際格式 `## N. Title`（grep 0 → 永遠誤觸 prune）;
  # 寫死 46 也錯。改成數真實 `## N.` heading + 動態判「PURE-JUDGMENT dim 數」（只有 judgment dim 需 prompt
  # 才能派 agent;deterministic/hook dim 不需）。prompts < judgment dim = 有 judgment dim 派不出 agent。
  PROMPT_DIM_COUNT=$(grep -cE '^##[[:space:]]+[0-9]+\.' "$AUDIT_PROMPTS" 2>/dev/null || echo 0)
  PROMPT_DIM_COUNT=${PROMPT_DIM_COUNT:-0}
  JUDGMENT_DIMS=$(node -e "try{const m=JSON.parse(require('fs').readFileSync('$PROJECT_DIR/.claude/logs/audit-coverage-matrix.json','utf8'));console.log(Object.values(m.coverage_by_dim).filter(v=>v.tier==='PURE-JUDGMENT').length)}catch{console.log(24)}" 2>/dev/null || echo 24)
  if [ "$PROMPT_DIM_COUNT" -lt "$JUDGMENT_DIMS" ]; then
    WARNINGS="${WARNINGS}\n  🔴 [C] audit-prompts.md prompt coverage:${PROMPT_DIM_COUNT} prompt < ${JUDGMENT_DIMS} PURE-JUDGMENT dim — 有 judgment dim 無 prompt → sub-agent 派不動 → 必被跳過。補 prompt 進 audit-prompts.md"
    TRIGGER_PRUNE=1
  fi
fi

# ─ Validator D: @benchmark-unverified-blanket count drift ─────────────────
BENCH_DEBT=$(grep -rc '@benchmark-unverified-blanket' "$PROJECT_DIR/packages/design-system/src/" 2>/dev/null | awk -F: '{s+=$2} END{print s+0}')
BENCH_DEBT=${BENCH_DEBT:-0}
if [ "$BENCH_DEBT" -gt 0 ]; then
  WARNINGS="${WARNINGS}\n  ⚠️ [D] Benchmark cite debt:${BENCH_DEBT} 處 `@benchmark-unverified-blanket` marker — 對應 prune D9(M22 cite debt)"
  TRIGGER_PRUNE=1
fi

# ─ Validator E: prune-chain-trigger emit ──────────────────────────────────
if [ "$TRIGGER_PRUNE" -eq 1 ] || [ -n "$WARNINGS" ]; then
  mkdir -p "$PROJECT_DIR/.claude/logs" 2>/dev/null
  printf '{"ts":"%s","file":"%s","trigger_prune":%d,"warnings":%s}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    "$FILE_PATH" \
    "$TRIGGER_PRUNE" \
    "$(printf '%b' "$WARNINGS" | jq -Rs .)" \
    >> "$PROJECT_DIR/.claude/logs/audit-post-report-validator.jsonl" 2>/dev/null || true

  if [ "$TRIGGER_PRUNE" -eq 1 ]; then
    CTX=$(printf '🚨 audit post-report validator: prune-chain-trigger fire。下輪 invoke /knowledge-prune scope=full(triggers: audit-prompts coverage < 100%% / @benchmark-unverified-blanket count > 0)。\n%b' "$WARNINGS")
    jq -n --arg ctx "$CTX" '{
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: $ctx }
    }'
  fi
fi

exit 0
