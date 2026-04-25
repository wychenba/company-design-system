#!/bin/bash
# Stop hook: capture governance metrics snapshot — enables trend detection.
#
# Purpose: metric-snapshots.jsonl previously only written when /knowledge-prune
# ran, giving 2 data points across months. Can't detect re-bloat without
# continuous baseline. This hook writes one snapshot per day max(guarded by
# 24h dedup), so after a few weeks there's enough data for trend analysis.
#
# Schema versions:
#   v1(2026-04-24 之前 manual /knowledge-prune writes)— 不 guarantee 有
#       untested_hooks / last_prune_days_ago / corrections_pending fields
#   v2(2026-04-25+ G6 auto writes)— full schema below
# Reader 必 check schema_version,v1 entries 缺欄位視為 unknown 不 fail。
#
# Fields(v2):
#   ts / schema_version / tag / claude_md_lines / memory_entries / hooks_total /
#   skills_total / untested_hooks / last_prune_days_ago / corrections_pending
#
# Non-blocking; silent on success; skips if last entry < 24h ago.

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

SNAPSHOT_FILE="$PROJECT_DIR/.claude/logs/metric-snapshots.jsonl"
mkdir -p "$(dirname "$SNAPSHOT_FILE")"

# 24h dedup:skip if last snapshot is < 24h old(prevent per-session spam)
if [ -f "$SNAPSHOT_FILE" ]; then
  LAST_TS=$(tail -1 "$SNAPSHOT_FILE" 2>/dev/null | jq -r '.ts // empty' 2>/dev/null || echo "")
  if [ -n "$LAST_TS" ]; then
    LAST_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$LAST_TS" +%s 2>/dev/null || echo 0)
    NOW_EPOCH=$(date -u +%s)
    DIFF=$(( NOW_EPOCH - LAST_EPOCH ))
    if [ "$DIFF" -lt 86400 ]; then
      exit 0
    fi
  fi
fi

# ── Capture metrics ──
CLAUDE_MD_LINES=0
[ -f CLAUDE.md ] && CLAUDE_MD_LINES=$(wc -l < CLAUDE.md | tr -d ' ')

MEMORY_DIR="$HOME/.claude/projects/-Users-chenqiren-Library-CloudStorage-GoogleDrive-qijenchen-gmail-com--------my-project/memory"
MEMORY_ENTRIES=0
if [ -d "$MEMORY_DIR" ]; then
  MEMORY_ENTRIES=$(find "$MEMORY_DIR" -maxdepth 1 -name '*.md' -not -name 'MEMORY.md' 2>/dev/null | wc -l | tr -d ' ' || echo 0)
fi

# Use `|| echo 0` after pipe to neutralize set -e/pipefail on missing dirs
HOOKS_TOTAL=0
if [ -d .claude/hooks ]; then
  HOOKS_TOTAL=$(find .claude/hooks -maxdepth 1 -type f \( -name '*.sh' -o -name '*.py' \) 2>/dev/null \
    | grep -vE '(_log-fire\.sh)' | wc -l | tr -d ' ' || echo 0)
fi

SKILLS_TOTAL=0
if [ -d .claude/skills ]; then
  SKILLS_TOTAL=$(find .claude/skills -maxdepth 1 -type d 2>/dev/null | tail -n +2 | wc -l | tr -d ' ' || echo 0)
fi

# Untested hook count(alignment with run-all.sh coverage report)
TESTED=0
if [ -d .claude/hooks/tests ]; then
  TESTED=$(find .claude/hooks/tests -maxdepth 1 -name 'test_*.sh' 2>/dev/null | wc -l | tr -d ' ' || echo 0)
fi
UNTESTED=$(( HOOKS_TOTAL - TESTED ))
[ "$UNTESTED" -lt 0 ] && UNTESTED=0

# Days since last /knowledge-prune commit
LAST_PRUNE_TS=$(git log --format='%ct' --grep='knowledge-prune\|prune:\|governance.*prune' -1 2>/dev/null || echo "")
LAST_PRUNE_DAYS=-1
if [ -n "$LAST_PRUNE_TS" ]; then
  NOW=$(date +%s)
  LAST_PRUNE_DAYS=$(( (NOW - LAST_PRUNE_TS) / 86400 ))
fi

# Corrections pending
CORRECTIONS_LOG="$PROJECT_DIR/.claude/logs/user-corrections.jsonl"
CORRECTIONS=0
[ -f "$CORRECTIONS_LOG" ] && CORRECTIONS=$(wc -l < "$CORRECTIONS_LOG" | tr -d ' ')

# ── Write snapshot ──
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
SNAPSHOT=$(jq -nc \
  --arg ts "$TIMESTAMP" \
  --arg tag "auto-daily" \
  --arg sv "v2" \
  --argjson cml "$CLAUDE_MD_LINES" \
  --argjson me "$MEMORY_ENTRIES" \
  --argjson ht "$HOOKS_TOTAL" \
  --argjson st "$SKILLS_TOTAL" \
  --argjson uh "$UNTESTED" \
  --argjson lpd "$LAST_PRUNE_DAYS" \
  --argjson c "$CORRECTIONS" \
  '{ts:$ts, schema_version:$sv, tag:$tag, claude_md_lines:$cml, memory_entries:$me, hooks_total:$ht, skills_total:$st, untested_hooks:$uh, last_prune_days_ago:$lpd, corrections_pending:$c}')

echo "$SNAPSHOT" >> "$SNAPSHOT_FILE"
exit 0
