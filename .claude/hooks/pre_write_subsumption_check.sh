#!/bin/bash
# PreToolUse Write / Edit: before adding NEW governance entry, check if existing
# homes already cover the topic. Prevents CLAUDE.md / Meta-Pattern / spec drift
# from append-only accumulation(CLAUDE.md 資訊治理 canonical「上游加 = 下游減」+
# mindset #6 + M10 exhaustive scan)。
#
# Scope A — New file(Write only):
#   - new memory_*.md      → grep MEMORY.md for similar topic
#   - new hook             → grep existing hooks for similar pattern
#   - new skill            → grep .claude/skills/ for similar purpose
#   - new spec.md          → grep existing specs for same component name
#
# Scope B — Meta-Pattern M-row addition(Edit CLAUDE.md,2026-04-25 G4):
#   當 Edit CLAUDE.md new_string 包含新增 M-row pattern(`| **M\d+** |`),prompt:
#     - 列出被吸收可刪的下游 M-row / specific bug / memory entry
#     - world-class benchmark(≥ 3 家,M8 強制)
#     - Rule-of-3 check:本 pattern 已在 3+ 處 → 需挑 SSOT owner
#
# Output: additionalContext warning — Claude 必 acknowledge + answer 3 題才能繼續。
# Non-blocking mechanical exit(0);enforcement 靠 Claude 讀 additionalContext 自律。

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

[ -z "$FILE_PATH" ] && exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" || exit 0

# ── Scope B: Meta-Pattern addition(Edit CLAUDE.md)── EARLY FIRE before new-file check
case "$FILE_PATH" in
  */CLAUDE.md)
    if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "MultiEdit" ] || [ "$TOOL_NAME" = "Write" ]; then
      # Pull new content(Write: tool_input.content / Edit: new_string / MultiEdit: edits[].new_string)
      NEW_CONTENT=$(echo "$INPUT" | jq -r '
        (.tool_input.content // "") + "\n" +
        (.tool_input.new_string // "") + "\n" +
        ([.tool_input.edits[]? | .new_string] | join("\n"))
      ' 2>/dev/null || echo "")

      # Detect new M-row pattern:CLAUDE.md Meta-Pattern 表格的 row 格式
      # `| **M\d+** |` 或 `| \*\*M\d+\*\* |`(markdown bold escape 不同呈現)
      if echo "$NEW_CONTENT" | grep -qE '\|\s*\*\*M[0-9]+\*\*\s*\|'; then
        M_ROW=$(echo "$NEW_CONTENT" | grep -oE '\*\*M[0-9]+\*\*' | head -1 | tr -d '*')
        MSG="🧭 Meta-Pattern 新增偵測(${M_ROW})— CLAUDE.md 資訊治理 canonical「上游加 = 下游減」+ M8(world-class benchmark)+ M10(exhaustive scan)觸發 3 題強制 self-check:\n\n"
        MSG="${MSG}1. **World-class benchmark**(M8 強制):≥ 3 家 world-class DS(Polaris / Material / Atlassian / Ant / Carbon / Apple HIG / VS Code / Figma / Slack / Notion)的對照?列具體實作名或 API。\n\n"
        MSG="${MSG}2. **上游加 = 下游減**(M10 + 資訊治理 retire pipeline):新 M-row 吸收了哪些既有內容?具體列:\n"
        MSG="${MSG}   - 被吸收的下游 M-row(如 M3 加新章後,M5 某條變冗餘 → 可刪)\n"
        MSG="${MSG}   - 被吸收的 specific bug(historical-bugs.md 內記的事件)\n"
        MSG="${MSG}   - 被吸收的 memory entry(feedback_*.md / project_*.md)\n"
        MSG="${MSG}   - 「無」也要明寫(空白不算回答)\n\n"
        MSG="${MSG}3. **Rule-of-3**(資訊治理 canonical):本 pattern 概念在幾處出現?若已 ≥ 3 → 選 SSOT owner,其他 pointer only。新 M-row 是 SSOT 本身還是 pointer?\n\n"
        MSG="${MSG}⚠️ 未在本輪對話明確回答 3 題前,禁止 commit 這個 edit。回答後繼續 OK。"
        ESCAPED=$(printf '%b' "$MSG" | jq -Rs .)
        printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":%s}}\n' "$ESCAPED"
        exit 0
      fi
    fi
    ;;
esac

# ── Scope A: New file detection ──
# Only fire for NEW files (Write creates; Edit modifies existing)
[ -f "$FILE_PATH" ] && exit 0

BASENAME=$(basename "$FILE_PATH" .md)
BASENAME=${BASENAME%.sh}
BASENAME=${BASENAME%.py}

MATCHES=""

case "$FILE_PATH" in
  */memory/*.md)
    # Extract keywords from filename (e.g. feedback_xxx_yyy → xxx yyy)
    KEYWORDS=$(echo "$BASENAME" | tr '_' ' ' | awk '{for(i=2;i<=NF;i++) printf "%s ",$i}')
    MEMORY_DIR=$(dirname "$FILE_PATH")
    [ -d "$MEMORY_DIR" ] && MATCHES=$(ls "$MEMORY_DIR" 2>/dev/null | grep -iE "$(echo "$KEYWORDS" | tr ' ' '|')" | head -3 || true)
    HOME_LABEL="memory"
    ;;
  */.claude/hooks/*)
    # New hook — check for similar name
    KEYWORDS=$(echo "$BASENAME" | tr '_' ' ' | awk '{for(i=2;i<=NF;i++) printf "%s ",$i}')
    [ -z "$KEYWORDS" ] && KEYWORDS="$BASENAME"
    MATCHES=$(ls .claude/hooks/ 2>/dev/null | grep -iE "$(echo "$KEYWORDS" | tr ' ' '|')" | head -3 || true)
    HOME_LABEL="hook"
    ;;
  */.claude/skills/*/SKILL.md)
    # New skill — grep existing skill names
    MATCHES=$(ls .claude/skills/ 2>/dev/null | grep -iE "$BASENAME" | head -3 || true)
    HOME_LABEL="skill"
    ;;
  *.spec.md)
    # New spec — grep existing specs for same component
    MATCHES=$(find src/design-system -name "${BASENAME}*" 2>/dev/null | head -3 || true)
    HOME_LABEL="spec"
    ;;
  *) exit 0 ;;
esac

[ -z "$MATCHES" ] && exit 0

MSG="📋 Creating new ${HOME_LABEL} file: ${FILE_PATH}\nPossibly-related existing files:\n$(echo "$MATCHES" | sed 's/^/  /')\nBefore writing, verify: (a) is this a duplicate? (b) can we extend an existing file instead? (c) CLAUDE.md Rule-of-3 SSOT — if concept exists in 3+ places, pick one owner, others point."

ESCAPED=$(printf '%s' "$MSG" | jq -Rs .)
printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":%s}}\n' "$ESCAPED"
exit 0
