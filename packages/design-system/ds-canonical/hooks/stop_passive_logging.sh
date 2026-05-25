#!/bin/bash
# stop_passive_logging.sh — Cluster B partial merge(2026-05-10,extended 2026-05-13)
#
# Per codex mega review Q-16 + Layer A own scope decision:
#   Merges 5 stop hooks into 1 mega dispatcher with 5 internal functions:
#     R1 tsc_sanity(原 lib/stop_tsc_sanity.sh) — tsc -b error count log
#     R2 harvest_corrections(原 lib/stop_harvest_corrections.sh) — user 糾正 keyword 偵測
#     R3 capture_metrics(原 lib/stop_capture_metrics.sh) — 24h dedup metric snapshot
#     R4 governance_drift(原 lib/stop_governance_drift_check.sh) — gov file edit + size check
#     R5 infra_best_practice_score(原 stop_meta_self_audit.sh,2026-05-13 fold)
#        — score-infra-best-practice.mjs regression / dim < 80 log
#        rationale:silent log only(per stop_meta L66 comment),不 inject blocker,
#        與 R1-R4 同質(passive log)→ 同 dispatcher 合理。Hook count 25 → 24。
#
# Layer A own 撞 codex Q-16:
#   Codex 推「Cluster B not same commit as Cluster A」cautious due to Stop event exit precedence。
#   我撞:Cluster A pattern 已 verified work。BUT root stop_self_audit + stop_meta_self_audit
#   留 standalone(those 含 BLOCKER detection 邏輯,exit 2 影響 turn)。
#   本 dispatcher 只 merge 4 lib non-blocking hooks(全 silent / log-only)。
#
# All 4 functions are exit 0(non-blocking),safe to chain in single dispatcher。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo "{}")
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

# ─────────────────────────────────────────────────────────────────────────────
# R1 — tsc sanity(原 lib/stop_tsc_sanity.sh):若 turn 動 .ts/.tsx → tsc -b log
# ─────────────────────────────────────────────────────────────────────────────
rule_tsc_sanity() {
  [ -z "$TRANSCRIPT_PATH" ] && return 0
  [ -f "$TRANSCRIPT_PATH" ] || return 0

  local touched
  touched=$(tail -200 "$TRANSCRIPT_PATH" 2>/dev/null \
    | jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | select(.name=="Edit" or .name=="Write" or .name=="MultiEdit") | .input.file_path // empty' 2>/dev/null \
    | grep -E '\.(ts|tsx)$' \
    | head -1 || echo "")

  [ -z "$touched" ] && return 0

  local tsc_output error_lines error_count sample
  tsc_output=$(timeout 60 npx tsc -b 2>&1 || true)
  error_lines=$(echo "$tsc_output" | grep "error TS" || true)
  error_count=$(echo "$error_lines" | grep -c "error TS" || true)
  error_count=${error_count:-0}

  if [ "$error_count" -gt 0 ]; then
    sample=$(echo "$error_lines" | head -3)
    mkdir -p .claude/logs 2>/dev/null
    printf '{"ts":"%s","tsc_errors":%s,"sample":%s}\n' \
      "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$error_count" \
      "$(echo "$sample" | jq -Rs .)" \
      >> .claude/logs/tsc-errors.jsonl 2>/dev/null || true
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# R2 — harvest user corrections(原 lib/stop_harvest_corrections.sh)
# ─────────────────────────────────────────────────────────────────────────────
rule_harvest_corrections() {
  [ -z "$TRANSCRIPT_PATH" ] && return 0
  [ -f "$TRANSCRIPT_PATH" ] || return 0

  local log_dir log_file
  log_dir="$PROJECT_DIR/.claude/logs"
  log_file="$log_dir/user-corrections.jsonl"
  mkdir -p "$log_dir"

  # Rotate if > 1 MB
  if [ -f "$log_file" ]; then
    local size
    size=$(wc -c < "$log_file" | tr -d ' ')
    if [ "$size" -gt 1048576 ]; then
      mv "$log_file" "${log_file}.$(date +%Y%m)"
    fi
  fi

  local timestamp corrections count escaped
  timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  corrections=$(tail -500 "$TRANSCRIPT_PATH" 2>/dev/null \
    | jq -r 'select(.type=="user") | .message.content? // empty | if type=="string" then . else (.[]? | select(.type=="text") | .text) end' 2>/dev/null \
    | grep -E '不是|不對|錯了|應該|糾正|為什麼沒|先不管|之後再|別再|不要' \
    | head -5 || true)

  [ -z "$corrections" ] && return 0

  # Dedup by session
  if [ -f "$log_file" ]; then
    grep -v "\"session\":\"$SESSION_ID\"" "$log_file" > "$log_file.tmp" 2>/dev/null || true
    [ -f "$log_file.tmp" ] && mv -f "$log_file.tmp" "$log_file"
  fi

  count=$(echo "$corrections" | wc -l | tr -d ' ')
  escaped=$(echo "$corrections" | head -2 | jq -Rs .)
  printf '{"ts":"%s","session":"%s","count":%s,"sample":%s}\n' \
    "$timestamp" "$SESSION_ID" "$count" "$escaped" >> "$log_file"
}

# ─────────────────────────────────────────────────────────────────────────────
# R3 — capture metrics 24h dedup(原 lib/stop_capture_metrics.sh)
# ─────────────────────────────────────────────────────────────────────────────
rule_capture_metrics() {
  local snapshot_file
  snapshot_file="$PROJECT_DIR/.claude/logs/metric-snapshots.jsonl"
  mkdir -p "$(dirname "$snapshot_file")"

  # 24h dedup
  if [ -f "$snapshot_file" ]; then
    local last_ts last_epoch now_epoch diff
    last_ts=$(tail -1 "$snapshot_file" 2>/dev/null | jq -r '.ts // empty' 2>/dev/null || echo "")
    if [ -n "$last_ts" ]; then
      last_epoch=$(date -u -d "$last_ts" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$last_ts" +%s 2>/dev/null || echo 0)
      now_epoch=$(date -u +%s)
      diff=$(( now_epoch - last_epoch ))
      [ "$diff" -lt 86400 ] && return 0
    fi
  fi

  # Capture metrics
  local claude_md_lines=0
  [ -f CLAUDE.md ] && claude_md_lines=$(wc -l < CLAUDE.md | tr -d ' ')

  local harness_memory_dir repo_memory_dir memory_dir memory_entries=0
  harness_memory_dir="$HOME/.claude/projects/-Users-chenqiren-Library-CloudStorage-GoogleDrive-qijenchen-gmail-com--------my-project/memory"
  repo_memory_dir=".claude/memory"
  if [ -d "$harness_memory_dir" ]; then
    memory_dir="$harness_memory_dir"
  elif [ -d "$repo_memory_dir" ]; then
    memory_dir="$repo_memory_dir"
  else
    memory_dir=""
  fi
  if [ -n "$memory_dir" ] && [ -d "$memory_dir" ]; then
    memory_entries=$(find "$memory_dir" -maxdepth 1 -name '*.md' -not -name 'MEMORY.md' -not -name 'README.md' 2>/dev/null | wc -l | tr -d ' ' || echo 0)
  fi

  local hooks_total=0
  if [ -d .claude/hooks ]; then
    hooks_total=$(find .claude/hooks -maxdepth 1 -type f \( -name '*.sh' -o -name '*.py' \) 2>/dev/null \
      | grep -vE '(_log-fire\.sh)' | wc -l | tr -d ' ' || echo 0)
  fi

  local skills_total=0
  if [ -d .claude/skills ]; then
    skills_total=$(find .claude/skills -maxdepth 1 -type d 2>/dev/null | tail -n +2 | wc -l | tr -d ' ' || echo 0)
  fi

  local tested=0
  if [ -d .claude/hooks/tests ]; then
    tested=$(find .claude/hooks/tests -maxdepth 1 -name 'test_*.sh' 2>/dev/null | wc -l | tr -d ' ' || echo 0)
  fi
  # Defensive: strip non-digit chars (multiline / fallback "0\n0" from pipefail edge case)
  hooks_total="${hooks_total//[^0-9]/}"
  hooks_total=${hooks_total:-0}
  tested="${tested//[^0-9]/}"
  tested=${tested:-0}
  local untested=$(( hooks_total - tested ))
  [ "$untested" -lt 0 ] && untested=0

  local last_prune_ts last_prune_days=-1 now
  last_prune_ts=$(git log --format='%ct' --grep='knowledge-prune\|prune:\|governance.*prune' -1 2>/dev/null || echo "")
  if [ -n "$last_prune_ts" ]; then
    now=$(date +%s)
    last_prune_days=$(( (now - last_prune_ts) / 86400 ))
  fi

  local corrections_log corrections=0
  corrections_log="$PROJECT_DIR/.claude/logs/user-corrections.jsonl"
  [ -f "$corrections_log" ] && corrections=$(wc -l < "$corrections_log" | tr -d ' ')

  local timestamp snapshot
  timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  snapshot=$(jq -nc \
    --arg ts "$timestamp" --arg tag "auto-daily" --arg sv "v2" \
    --argjson cml "$claude_md_lines" --argjson me "$memory_entries" \
    --argjson ht "$hooks_total" --argjson st "$skills_total" \
    --argjson uh "$untested" --argjson lpd "$last_prune_days" \
    --argjson c "$corrections" \
    '{ts:$ts, schema_version:$sv, tag:$tag, claude_md_lines:$cml, memory_entries:$me, hooks_total:$ht, skills_total:$st, untested_hooks:$uh, last_prune_days_ago:$lpd, corrections_pending:$c}')

  echo "$snapshot" >> "$snapshot_file"
}

# ─────────────────────────────────────────────────────────────────────────────
# R4 — governance drift check(原 lib/stop_governance_drift_check.sh)
# ─────────────────────────────────────────────────────────────────────────────
rule_governance_drift() {
  local head_now head_prev_file head_prev commits_made gov_edited
  head_now=$(git rev-parse HEAD 2>/dev/null || echo "")
  head_prev_file="$PROJECT_DIR/.claude/logs/.stop-drift-last-head"
  head_prev=""
  [ -f "$head_prev_file" ] && head_prev=$(cat "$head_prev_file" 2>/dev/null || echo "")

  commits_made="false"
  if [ -n "$head_now" ] && [ -n "$head_prev" ] && [ "$head_now" != "$head_prev" ]; then
    commits_made="true"
  fi

  gov_edited="false"
  if git diff --name-only HEAD 2>/dev/null | grep -qE '^(CLAUDE\.md|.*\.spec\.md|.*\.skill\.md|.*SKILL\.md|.claude/.*\.sh|.claude/.*\.py)$'; then
    gov_edited="true"
  fi

  echo "$head_now" > "$head_prev_file" 2>/dev/null || true

  if [ "$commits_made" = "false" ] && [ "$gov_edited" = "false" ]; then
    return 0
  fi

  local warnings="" L
  if [ -f CLAUDE.md ]; then
    L=$(wc -l < CLAUDE.md | tr -d ' ')
    if [ "$L" -gt 800 ]; then
      warnings="${warnings}\n  • CLAUDE.md ${L} lines(over 800 cap → /knowledge-prune REQUIRED)"
    elif [ "$L" -gt 600 ]; then
      warnings="${warnings}\n  • CLAUDE.md ${L} lines(over 600 strong-warn)"
    elif [ "$L" -gt 500 ]; then
      warnings="${warnings}\n  • CLAUDE.md ${L} lines(approaching 600)"
    fi
  fi

  for f in packages/design-system/src/tokens/color/color.spec.md \
           packages/design-system/src/patterns/element-anatomy/item-anatomy.spec.md \
           packages/design-system/src/components/Sidebar/sidebar.spec.md \
           packages/design-system/src/components/TreeView/tree-view.spec.md; do
    [ -f "$f" ] || continue
    L=$(wc -l < "$f" | tr -d ' ')
    local cap
    case "$f" in
      */item-anatomy.spec.md) cap=1200 ;;
      # 2026-05-22 prune codify per CLAUDE.md「foundational SSOT 例外 ≤ 800-1200」range(SSOT sync with stop_self_audit.sh:99-102)
      */color/color.spec.md) cap=1000 ;;
      *) cap=800 ;;
    esac
    if [ "$L" -gt "$cap" ]; then
      warnings="${warnings}\n  • $f ${L} lines(over ${cap} cap)"
    fi
  done

  if [ "$gov_edited" = "true" ]; then
    local tsc_errors
    tsc_errors=$(npx tsc -b 2>&1 | grep -c "error TS" 2>/dev/null | head -1 | tr -d '[:space:]' || echo 0)
    tsc_errors=${tsc_errors:-0}
    if [ "$tsc_errors" -gt 0 ] 2>/dev/null; then
      warnings="${warnings}\n  • tsc -b reports ${tsc_errors} errors(governance edit broke types)"
    fi
  fi

  [ -z "$warnings" ] && return 0

  mkdir -p "$PROJECT_DIR/.claude/logs" 2>/dev/null
  printf '{"ts":"%s","warnings":%s}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    "$(printf '%b' "$warnings" | jq -Rs .)" \
    >> "$PROJECT_DIR/.claude/logs/governance-drift.jsonl" 2>/dev/null || true
}

# ─────────────────────────────────────────────────────────────────────────────
# R5 — infra best-practice score(原 stop_meta_self_audit.sh,2026-05-13 fold)
#   per-Stop scripts/score-infra-best-practice.mjs(8 dim,0-100)
#   regression / dim < 80 → log warning to .claude/logs/score-history.jsonl
#   silent log only(Stop hooks JSON schema 不接受 additionalContext)
# ─────────────────────────────────────────────────────────────────────────────
rule_infra_best_practice_score() {
  local log_file="$PROJECT_DIR/.claude/logs/infra-best-practice-score.jsonl"
  local score_output current_score prev_score=0 warnings="" drop low_dims

  score_output=$(node scripts/score-infra-best-practice.mjs --json 2>/dev/null)
  [ -z "$score_output" ] && return 0

  current_score=$(echo "$score_output" | jq -r '.finalScore // 0' 2>/dev/null || echo 0)
  [ "$current_score" = "0" ] && return 0

  if [ -f "$log_file" ]; then
    prev_score=$(tail -2 "$log_file" | head -1 | jq -r '.finalScore // 0' 2>/dev/null || echo 0)
  fi

  # Trigger 1: regression(score dropped ≥ 5)
  if [ "$prev_score" -gt 0 ] && [ "$current_score" -lt "$prev_score" ]; then
    drop=$((prev_score - current_score))
    if [ "$drop" -ge 5 ]; then
      warnings="${warnings}\n  🚨 SCORE REGRESSION: ${prev_score} → ${current_score}(drop ${drop})"
    fi
  fi

  # Trigger 2: any dim < 80
  low_dims=$(echo "$score_output" | jq -r '.dimensions[] | select(.score < 80) | "\(.dim): \(.score)/100 (\(.value))"' 2>/dev/null)
  if [ -n "$low_dims" ]; then
    warnings="${warnings}\n  ⚠️  Sub-threshold dimensions:\n$(echo "$low_dims" | sed 's/^/    • /')"
  fi

  # Trigger 3: overall < 80
  if [ "$current_score" -lt 80 ]; then
    warnings="${warnings}\n  ❌ Overall score ${current_score}/100 below threshold 80"
  fi

  [ -z "$warnings" ] && return 0

  mkdir -p "$PROJECT_DIR/.claude/logs" 2>/dev/null
  printf '{"ts":"%s","score":%s,"prev":%s,"warnings":%s}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    "$current_score" "$prev_score" \
    "$(printf '%b' "$warnings" | jq -Rs .)" \
    >> "$PROJECT_DIR/.claude/logs/score-history.jsonl" 2>/dev/null || true
}

# ─── Run rules sequentially(all non-blocking,exit 0)──
rule_tsc_sanity
rule_harvest_corrections
rule_capture_metrics
rule_governance_drift
rule_infra_best_practice_score

exit 0
