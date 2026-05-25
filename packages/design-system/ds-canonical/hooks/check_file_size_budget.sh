#!/bin/bash
set -uo pipefail
# PreToolUse Edit/Write: enforce per-file line budgets for governance files.
#
# Budgets — SSOT 是 CLAUDE.md `# 治理 canonical` 「行數預算」段。
# 本檔不再硬寫(避免 漂移 — 2026-05-15 Fix 4 per sub-agent a9e6d53c finding 6:
# 之前硬寫 400 vs CLAUDE.md「target 200 / transition 400 / hard cap 800」三 home 三 baseline)。
# 改 dynamic 從 CLAUDE.md grep,fallback 寫死值。SSOT 改一處全處跟動。
#
# Non-blocking: injects warning via hookSpecificOutput additionalContext; Claude
# decides whether to split or ack. Hard block would paralyse edits to legitimately
# large canonical specs (e.g. item-anatomy ~900 lines) — require explicit override.

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE_PATH" ] && exit 0
[ -f "$FILE_PATH" ] || exit 0

# Only check governance files
# CLAUDE.md L34 SSOT: target ≤ 200(Anthropic best-practice)/ transition ≤ 400 / hard cap 800
# 本 hook 在 transition 觸發 P1 warning,hard cap 觸發 P0 block
case "$FILE_PATH" in
  */CLAUDE.md)                          BUDGET=400;  TRANSITION=800; LABEL="CLAUDE.md" ;;  # warn at transition (400), block at hard cap (800); target 200
  */memory/*.md)                        BUDGET=100;  TRANSITION=100; LABEL="memory file" ;;
  # Super-foundational SSOT spec(item-anatomy = Family 1+2 跨 10+ 消費者 SSOT,唯一例外)
  */item-anatomy.spec.md)
    BUDGET=800;  TRANSITION=1200; LABEL="super-foundational SSOT spec.md(item-anatomy 例外)" ;;
  # Foundational SSOT specs(2026-04-24 升 cap 800 — spec 內部有 rationale section)
  # 2026-05-18 加 data-table:DS 最複雜 composite + 跨家族 anchor(L1-L4 完整 grid taxonomy,
  # 行對齊 item-anatomy / 浮層對齊 overlay-surface / state 對齊 field-controls)。
  # frontmatter 已標 `foundational_ssot: true`。
  # 2026-05-22 prune:color.spec.md 升 tier 2 cap 1000(per CLAUDE.md「foundational ≤ 800-1200」+ /knowledge-prune Lens 1+2 verdict — 218-line semantic 不可拆 + nested theme + Atlassian rationale 集中一處)。
  */color.spec.md)
    BUDGET=800;  TRANSITION=1000; LABEL="foundational SSOT spec.md(color tier 2 cap 1000)" ;;
  */sidebar.spec.md|*/tree-view.spec.md|*/data-table.spec.md)
    BUDGET=500;  TRANSITION=800; LABEL="foundational SSOT spec.md" ;;
  *.spec.md)                            BUDGET=300;  TRANSITION=500; LABEL="spec.md" ;;
  *.claude/skills/*/SKILL.md)           BUDGET=250;  TRANSITION=400; LABEL="SKILL.md" ;;
  *) exit 0 ;;
esac

LINES=$(wc -l < "$FILE_PATH" | tr -d ' ')
[ "$LINES" -le "$BUDGET" ] && exit 0

# Over budget — warn. Hard-block only if also over transition cap.
if [ "$LINES" -gt "$TRANSITION" ]; then
  MSG="⛔ ${LABEL} at ${FILE_PATH} is ${LINES} lines (hard cap ${TRANSITION}). Must reduce before adding. Run /knowledge-prune or identify which section to remove."
else
  MSG="⚠️ ${LABEL} at ${FILE_PATH} is ${LINES} lines (budget ${BUDGET}, transition cap ${TRANSITION}). Prefer consolidating over appending. What can you remove/merge to make room?"
fi

ESCAPED=$(printf '%s' "$MSG" | jq -Rs .)
printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":%s}}\n' "$ESCAPED"
exit 0
