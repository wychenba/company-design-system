#!/bin/bash
# Stop hook: when this turn produced commits OR edited governance files,
# auto-verify governance state + inject drift warning to next-turn context.
#
# Why: even with SessionStart soft/hard reminders + per-edit budget warns,
# AI can drift mid-session(本 conv 證明 inline-edit prune 不走 /knowledge-prune
# skill,silent skip workflow)。本 hook 在 turn 結束前 quick check,讓 user
# 看到 drift 摘要,不靠 user 多次同題 verify。
#
# Triggers:
#   • commits made this turn
#   • CLAUDE.md / *.spec.md / *.SKILL.md edited this turn
# Otherwise: silent exit 0(不每 turn 跑,只 commit / canonical-edit turns 跑)
#
# Output: stdout JSON additionalContext(non-blocking inject)。AI 看得到,
#         自然帶進下一輪回應。

# Per-hook fire logging
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

# Gate:本 turn 沒 commit / 沒動 governance 就跳過(避免每 turn 跑)
HEAD_NOW=$(git rev-parse HEAD 2>/dev/null || echo "")
HEAD_PREV_FILE="$PROJECT_DIR/.claude/logs/.stop-drift-last-head"
HEAD_PREV=""
[ -f "$HEAD_PREV_FILE" ] && HEAD_PREV=$(cat "$HEAD_PREV_FILE" 2>/dev/null || echo "")

# 條件 A:HEAD 有變(commits made)
COMMITS_MADE="false"
if [ -n "$HEAD_NOW" ] && [ -n "$HEAD_PREV" ] && [ "$HEAD_NOW" != "$HEAD_PREV" ]; then
  COMMITS_MADE="true"
fi

# 條件 B:本 turn 有 governance file 動過(via git diff HEAD..unstaged)
GOV_EDITED="false"
if git diff --name-only HEAD 2>/dev/null | grep -qE '^(CLAUDE\.md|.*\.spec\.md|.*\.skill\.md|.*SKILL\.md|.claude/.*\.sh|.claude/.*\.py)$'; then
  GOV_EDITED="true"
fi

# Update last-head pointer for next turn
echo "$HEAD_NOW" > "$HEAD_PREV_FILE" 2>/dev/null || true

# 沒任一條件 → 跳過(per-turn cost 接近 0)
if [ "$COMMITS_MADE" = "false" ] && [ "$GOV_EDITED" = "false" ]; then
  exit 0
fi

# Quick gov check
WARNINGS=""

# CLAUDE.md size
if [ -f CLAUDE.md ]; then
  L=$(wc -l < CLAUDE.md | tr -d ' ')
  if [ "$L" -gt 800 ]; then
    WARNINGS="${WARNINGS}\n  • CLAUDE.md ${L} lines(over 800 transition cap → /knowledge-prune REQUIRED)"
  elif [ "$L" -gt 600 ]; then
    WARNINGS="${WARNINGS}\n  • CLAUDE.md ${L} lines(over 600 strong-warn → /knowledge-prune recommended)"
  elif [ "$L" -gt 500 ]; then
    WARNINGS="${WARNINGS}\n  • CLAUDE.md ${L} lines(approaching 600 strong-warn)"
  fi
fi

# Foundational SSOT specs over cap
for f in src/design-system/tokens/color/color.spec.md \
         src/design-system/patterns/element-anatomy/item-anatomy.spec.md \
         src/design-system/components/Sidebar/sidebar.spec.md \
         src/design-system/components/TreeView/tree-view.spec.md; do
  [ -f "$f" ] || continue
  L=$(wc -l < "$f" | tr -d ' ')
  case "$f" in
    */item-anatomy.spec.md) cap=1200 ;;
    *) cap=800 ;;
  esac
  if [ "$L" -gt "$cap" ]; then
    WARNINGS="${WARNINGS}\n  • $f ${L} lines(over ${cap} cap)"
  fi
done

# Outstanding tsc errors(若有 governance edit,build 可能 break)
if [ "$GOV_EDITED" = "true" ]; then
  TSC_ERRORS=$(npx tsc -b 2>&1 | grep -c "error TS" 2>/dev/null || echo 0)
  if [ "$TSC_ERRORS" -gt 0 ]; then
    WARNINGS="${WARNINGS}\n  • tsc -b reports ${TSC_ERRORS} errors(governance edit broke types)"
  fi
fi

# 沒 warning → silent exit
[ -z "$WARNINGS" ] && exit 0

# Stop hooks 的 JSON schema 不接受 hookSpecificOutput.additionalContext
# (只 SessionStart/PostToolUse/UserPromptSubmit 接受)→ silent log-to-file
mkdir -p "$PROJECT_DIR/.claude/logs" 2>/dev/null
printf '{"ts":"%s","warnings":%s}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "$(printf '%b' "$WARNINGS" | jq -Rs .)" \
  >> "$PROJECT_DIR/.claude/logs/governance-drift.jsonl" 2>/dev/null || true

exit 0
