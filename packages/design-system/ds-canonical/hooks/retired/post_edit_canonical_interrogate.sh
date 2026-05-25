#!/bin/bash
# PostToolUse Edit|Write|MultiEdit: 對 canonical 文件的「新增 rule/section」
# 注入 3 題短 interrogation,補 M8 benchmark / Rule-of-3 / M10 下游吸收的
# runtime adherence(不是 infra,是 model 自律)。
#
# Scope(極窄,避免噪音):
#   - CLAUDE.md Edit/Write
#   - packages/design-system/src/**/*.spec.md Edit/Write
#   - .claude/skills/*/SKILL.md Edit/Write
#
# 觸發條件(只在真正「加新 rule」時 fire):
#   - Write(新檔)- 一律 fire
#   - Edit:new_string 淨增 > 200 chars OR 含新 `##` heading OR 含「**M\d+**」
#     (M-row 由 pre_write_subsumption_check 處理,本 hook skip 以免 double fire)
#
# Non-blocking(PostToolUse 僅注 context,AI 讀到 3 題自律回答)。
#
# Per-hook fire logging
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

# Scope gate
IN_SCOPE=0
case "$FILE_PATH" in
  */CLAUDE.md) IN_SCOPE=1 ;;
  */packages/design-system/src/*/*.spec.md) IN_SCOPE=1 ;;
  */.claude/skills/*/SKILL.md) IN_SCOPE=1 ;;
esac
[ "$IN_SCOPE" = "0" ] && exit 0

# Extract new content
NEW_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")
OLD_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.old_string // "") + "\n" +
  ([.tool_input.edits[]? | .old_string] | join("\n"))
' 2>/dev/null || echo "")

# Skip if M-row addition(pre_write_subsumption_check 已處理)
if echo "$NEW_CONTENT" | grep -qE '\|\s*\*\*M[0-9]+\*\*\s*\|'; then
  exit 0
fi

# Trigger heuristics
TRIGGER=0
TRIGGER_REASON=""

# (a) Write(新檔)
if [ "$TOOL" = "Write" ]; then
  TRIGGER=1
  TRIGGER_REASON="new file"
else
  # (b) Edit 淨增 > 200 chars
  NEW_LEN=$(printf '%s' "$NEW_CONTENT" | wc -c | tr -d ' ')
  OLD_LEN=$(printf '%s' "$OLD_CONTENT" | wc -c | tr -d ' ')
  NET_ADD=$(( NEW_LEN - OLD_LEN ))
  if [ "$NET_ADD" -gt 200 ]; then
    TRIGGER=1
    TRIGGER_REASON="net +${NET_ADD} chars"
  fi
  # (c) new_string 含新 `##` heading 而 old_string 不含
  if echo "$NEW_CONTENT" | grep -qE '^## '; then
    if ! echo "$OLD_CONTENT" | grep -qE '^## '; then
      TRIGGER=1
      TRIGGER_REASON="new ## section"
    fi
  fi
fi

[ "$TRIGGER" = "0" ] && exit 0

# Tailor prompt by file type
case "$FILE_PATH" in
  */CLAUDE.md)
    HOME_LABEL="CLAUDE.md"
    SCOPE_NOTE="canonical 最高層;任何新規則必 benchmark + 下游吸收"
    ;;
  */packages/design-system/src/*/*.spec.md)
    HOME_LABEL="spec.md"
    SCOPE_NOTE="spec SSOT;新規則必對齊 7 維 + 近親 spec cross-check"
    ;;
  */.claude/skills/*/SKILL.md)
    HOME_LABEL="SKILL.md"
    SCOPE_NOTE="skill workflow;新步驟 / checkpoint 必 world-class 對照 + skill 重複 check"
    ;;
esac

MSG="🧭 Canonical interrogation(${HOME_LABEL} ${TRIGGER_REASON})— ${SCOPE_NOTE}。3 題短 self-check:\n\n"
MSG="${MSG}1. **World-class benchmark**(M8):新 rule / pattern 有 ≥ 3 家 DS 對照嗎?列具體實作名或「無」(無 = rule 未成熟,考慮 ship 前先調研)。\n\n"
MSG="${MSG}2. **Rule-of-3**(資訊治理):本概念已在別處出現?若 ≥ 3 處 → 選 SSOT owner,其他 pointer only。確認是 SSOT 新寫還是應該 pointer?\n\n"
MSG="${MSG}3. **M10 下游吸收**:新 rule 是否讓既有某條 rule / memory / bug case 變冗餘?明寫「可刪 X」或「無下游變動」。空白不算。\n\n"
MSG="${MSG}⚠️ 回答上述 3 題(even 簡短)再繼續,避免 silent append-only 膨脹。"

ESCAPED=$(printf '%b' "$MSG" | jq -Rs .)
printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":%s}}\n' "$ESCAPED"
exit 0
