#!/bin/bash
# Audit NO-SAMPLE strict enforcement(2026-05-17 P0 user-mandated):
#   /design-system-audit --deep dispatch sub-agent prompt 禁含 sample escape clause。
#   違 = BLOCKER 不允 dispatch。
#
# 背景:audit Dim 24/25/40-43/45/46/48 sub-agent 多次 sampled 不全掃 → user 抓「你他媽是不是又再搞抽樣」。
# 加 mechanical hook 攔截 dispatch prompt 含 sample escape keyword。
#
# PreToolUse(Agent)hook:讀 tool_input.prompt,grep escape keyword 命中 → exit 2 BLOCKER。
#
# Allow escape:dispatch prompt 加 `// @audit-sample-allow: <rationale>` 整 prompt 豁免(極罕見場景)。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')

case "${TOOL:-}" in
  Agent) ;;
  *) exit 0 ;;
esac

# Read dispatch prompt
PROMPT=$(echo "$INPUT" | jq -r '.tool_input.prompt // ""')

# Allow escape(極罕見)
if echo "$PROMPT" | grep -qE '@audit-sample-allow:'; then
  exit 0
fi

# Only enforce on audit-related dispatch(detect by prompt keyword)
if ! echo "$PROMPT" | grep -qE 'audit|Dim [0-9]+|DS-wide|sub-agent|sweep'; then
  exit 0
fi

# Detect sample escape clause keyword
ESCAPE_HITS=$(echo "$PROMPT" | grep -oE 'sample evidence allowed|sample-N|sample-only|sample top [0-9]+|pick top [0-9]+|top hot|sampled (components|elements|files)|heavy agent needed|full sweep deferred|defer.*heavy|cite.*heavy agent' | sort -u)

if [ -n "$ESCAPE_HITS" ]; then
  printf '🚨 AUDIT NO-SAMPLE ESCAPE CLAUSE BLOCKER(audit canonical 2026-05-17 user-mandated):\n' >&2
  printf '   Dispatch prompt 含 sample escape clause:\n' >&2
  echo "$ESCAPE_HITS" | while IFS= read -r hit; do
    printf '   • "%s"\n' "$hit" >&2
  done
  printf '\n  Per CLAUDE.md `# 稽核 canonical` + design-system-audit/SKILL.md Phase 1 NO-SAMPLE invariant:\n' >&2
  printf '  禁含「sample / top N / heavy agent needed / full sweep deferred」escape clause。\n' >&2
  printf '  每 dim 必 DS-wide ALL components 全掃,context 不夠拆 stage 分批,**不 sample**。\n' >&2
  printf '\n  修方向:從 prompt 移除 escape clause,改寫「拆 N-stage(每 stage 10-15 元件)所有 stages 必跑完」。\n' >&2
  printf '  Escape(極罕見): prompt 加 // @audit-sample-allow: <rationale>\n' >&2
  exit 2
fi

exit 0
