#!/bin/bash
# Solo-work canonical 補丁(2026-05-17 user-mandated):
#   既有 check_solo_workflow.sh R1-R3 抓「2nd branch / PR creation / push main 無 trigger」,
#   但**不抓「整 session 在 main 上 edit production code」**(M28 sub-rule)。
#
# 本 hook 補:PreToolUse Edit/Write 偵測「current branch == main + edit production code
# + 近 5 條 user msg 無「開 branch / 在 branch 上做」trigger keyword」→ BLOCKER。
#
# 對應 CLAUDE.md `# Git solo-work canonical` Step 1 「1 chat = 1 working branch」
# + memory/feedback_solo_dev_workflow.md SSOT。
#
# 起因 2026-05-17:本 session AI 整個 deep audit + 補修 + a11y batch 全直接在 main edit,
# user 抓「不是只有我說 push 到 main 才真的會 push 到 main 嗎」。R1 只抓 `claude/*` prefix
# branch 數,沒抓「在 main edit」這個 root cause。
#
# Allow escape:
#   - doc-only / governance-only edit(`.claude/**` / `*.spec.md`)豁免 — 不需 Netlify preview
#   - `CLAUDE_BYPASS_MAIN_WORKBENCH=1` env var(audit-logged)

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "${TOOL:-}" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

# Only intercept production code edits (packages/design-system/src / src/app / src/explorations)
case "${FILE_PATH:-}" in
  */packages/design-system/src/**/*.tsx|*/packages/design-system/src/**/*.ts|*/packages/design-system/src/**/*.css) ;;
  */src/app/**|*/src/explorations/**) ;;
  *) exit 0 ;;
esac

# Skip if env override
if [ "${CLAUDE_BYPASS_MAIN_WORKBENCH:-0}" = "1" ]; then
  exit 0
fi

# Detect current branch
CURRENT_BRANCH=$(cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" && git branch --show-current 2>/dev/null || echo "")

if [ "${CURRENT_BRANCH:-}" != "main" ] && [ "${CURRENT_BRANCH:-}" != "master" ]; then
  # Not on main — already on working branch, allow
  exit 0
fi

# On main + edit production code → check recent user msg for branch trigger
TRANSCRIPT="${CLAUDE_TRANSCRIPT_PATH:-}"
TRIGGER_FOUND=0
if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  RECENT_USER=$(tail -200 "$TRANSCRIPT" 2>/dev/null | \
    jq -r 'select(.role == "user") | .content' 2>/dev/null | tail -5 | tr '\n' ' ')
  if echo "${RECENT_USER:-}" | grep -qE '(開.*branch|開.*分支|新.*branch|新.*分支|working branch|在.*branch.*做|在 branch|branch 上|on branch)'; then
    TRIGGER_FOUND=1
  fi
fi

if [ "$TRIGGER_FOUND" = "1" ]; then
  # User explicitly approved branch work, allow
  exit 0
fi

# BLOCKER: editing production code on main without explicit branch trigger
cat >&2 <<EOF
🚨 MAIN-AS-WORKBENCH BLOCKER(check_main_branch_workbench,2026-05-17 P0 codify)
  - 目標: ${FILE_PATH}
  - 範圍: packages/design-system/src / src/app / src/explorations(production code)
  - 當前 branch: ${CURRENT_BRANCH}(= main / master)
  - 近 5 條 user msg branch-trigger keyword: 0 次

→ Solo-work canonical(CLAUDE.md \`# Git solo-work canonical\`+ memory/feedback_solo_dev_workflow.md SSOT):
  1 chat = 1 working branch;production code edit **必先**:
    git checkout -b <working-branch-name>
  然後 commit + push working branch(觸發 Netlify preview),user trigger「push / 合 main」才 merge main。

修法 — 2 選 1:
  (a) 立刻開 working branch:
       git checkout -b $(date +%Y-%m-%d)-<topic>
      然後重試 Edit。
  (b) Cite recent user verbatim 含「開 branch / working branch / 在 branch 上」trigger keyword
      OR 設 CLAUDE_BYPASS_MAIN_WORKBENCH=1 跑(audit-logged)。

歷史錨例(2026-05-17 起因):本 session 整個 deep audit + 56-element a11y batch + retire batch 全
在 main 直接 edit,user 抓「不是只有我說 push 到 main 才真的會 push 到 main 嗎」。R1-R3 沒抓
「main-as-workbench」這個 root cause,故升新 hook 攔。
EOF
exit 2
