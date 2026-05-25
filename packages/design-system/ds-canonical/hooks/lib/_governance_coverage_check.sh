#!/bin/bash
# _governance_coverage_check.sh — PostToolUse helper:
# 偵測 governance file edit(meta-patterns / spec.md frontmatter / hook / SKILL / rules)
# → 跑 audit-preflight.mjs --check 比 baseline 是否新增 coverage gap
# → 有 gap → stderr inject 警告:user 必補 audit dim or 撤原則
#
# 對應 SSOT:
# - memory/feedback_audit_preflight_全盤查.md(2026-05-15 codified)
# - design-system-audit/SKILL.md Phase 0.5 invariant
# - user 原話「確保現在和未來都會自動涵蓋,當有新的準則就務必更新設計系統進階稽核的內容」
#
# 由 post_edit_dispatcher.sh orchestrate,non-standalone hook(不算 hook count)

source "$(dirname "$0")/../_log-fire.sh" 2>/dev/null && log_hook_fire

FILE_PATH=$(jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] && exit 0

# Governance file scope:M-rule / spec.md frontmatter / hook check / SKILL / rules
GOV_RE='(meta-patterns\.md|/spec\.md$|check_.*\.sh$|/SKILL\.md$|\.claude/rules/.*\.md$|CLAUDE\.md$)'
echo "$FILE_PATH" | grep -qE "$GOV_RE" || exit 0

# Pre-check audit-preflight 存在
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PREFLIGHT="$PROJECT_DIR/scripts/audit-preflight.mjs"
[ -f "$PREFLIGHT" ] || exit 0

# 跑 preflight check mode(silent;exit 1 if gap)
PREFLIGHT_OUT=$(cd "$PROJECT_DIR" && node scripts/audit-preflight.mjs --check 2>&1)
PREFLIGHT_EXIT=$?

if [ "$PREFLIGHT_EXIT" -eq 1 ]; then
  TODAY=$(date +%Y-%m-%d)
  LOG_FILE="$PROJECT_DIR/.claude/logs/audit-preflight-${TODAY}.json"
  GAP_COUNT=0
  GAP_SAMPLE=""
  if [ -f "$LOG_FILE" ]; then
    GAP_COUNT=$(jq -r '.coverageGaps // 0' "$LOG_FILE" 2>/dev/null || echo 0)
    GAP_SAMPLE=$(jq -r '.gaps[:3] | .[]' "$LOG_FILE" 2>/dev/null | head -3 | tr '\n' ',' | sed 's/,$//')
  fi

  ADDITIONAL_CONTEXT="⚠️ Governance coverage gap(audit-preflight): ${FILE_PATH##*/} edit 後 ${GAP_COUNT} 原則無 audit dim cover(包含: ${GAP_SAMPLE})。若新加入的原則 → 必補 audit dim 進 design-system-audit/SKILL.md。若既有 false-positive(heuristic 不準)→ sub-agent semantic verify。SSOT: memory/feedback_audit_preflight_全盤查.md"

  jq -n --arg ctx "$ADDITIONAL_CONTEXT" '{
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: $ctx }
  }'
fi

exit 0
