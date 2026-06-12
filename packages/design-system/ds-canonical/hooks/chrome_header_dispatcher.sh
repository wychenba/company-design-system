#!/bin/bash
# chrome_header_dispatcher.sh — orchestrate 4 ChromeHeader-canonical lib helpers
#
# 2026-05-26 fold per Track C hook retire(39 → 36):4 個 PreToolUse hook 都
# enforce header-canonical.spec.md sub-invariants(consumption / app-shell / tabs-border / token-equal)。
# fold pattern 對齊 post_edit_dispatcher.sh 已建立的 lib/_*.sh helper convention(_ prefix 不計 hook 數)。
#
# 2026-05-31(folded-hook-audit):block-vs-warn 分流 —— SSOT canonical deterministic 3 helper
# (app-shell / tabs-border / token-equal)exit 2 傳播(真 P0 block);_chrome_header_handcraft 維持
# warn(Phase 3 才升 P0,exit 吞)。原全部 `|| true` 吞掉 = 假 enforcement(違 ssot_mechanical_p0_not_p1)。
#
# 4 lib helpers:
#   _chrome_header_handcraft.sh        — Layer 3 consumption enforcement(自刻 chrome header className)
#   _app_shell_primary_header_consistency.sh — primary-header layout 必傳 globalHeader prop
#   _header_with_tabs_border.sh        — Header + Tabs 必標 withTabs prop(border auto-suppress)
#   _tab_lg_chrome_header_equal.sh     — `--tab-height-lg` 必等 `--chrome-header-height` token
#
# Each helper:reads stdin INPUT,jq-parses tool_input.file_path,scope-filters,
# 印 stderr soft warn,exit 0。本 dispatcher 把同一 stdin pipe 給 4 helpers 依序跑,
# 不 aggregate stdout(本系列 helper 不 emit additionalContext,純 stderr 給人讀)。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo "{}")
LIB_DIR="$(dirname "$0")/lib"

WORST=0

# 2026-05-31(folded-hook-audit):原 dispatcher 用 `|| true` 吞掉所有 helper exit code → 即使
# helper 內部 exit 2(SSOT canonical 違反)也不 block = 假 enforcement(違 feedback_ssot_mechanical_p0_not_p1)。
# 修法:SSOT-canonical deterministic helper 的 exit 2 傳播(WORST=2 → dispatcher exit 2 真 block);
# _chrome_header_handcraft 維持 warn(自承 Phase 3 才升 P0,migration 未完 → exit 吞掉)。

# ── Blocking helpers(SSOT canonical deterministic:primary-header / withTabs border / token pixel equal)──
for helper in \
  "$LIB_DIR/_app_shell_primary_header_consistency.sh" \
  "$LIB_DIR/_header_with_tabs_border.sh" \
  "$LIB_DIR/_tab_lg_chrome_header_equal.sh"; do
  [ -f "$helper" ] || continue
  # stderr 自然傳播到 dispatcher stderr(violation 訊息顯示);stdout 丟棄;捕捉 exit code。
  printf '%s' "$INPUT" | bash "$helper" 1>/dev/null
  rc=$?
  [ "$rc" -eq 2 ] && WORST=2
done

# ── _chrome_header_handcraft(2026-06-06 升 P0 BLOCKER,跟 item-anatomy C.4 row-handcraft 對稱;
#    migration 完成 per header-canonical.spec.md L245 + 0 殘留手刻 verified)──
if [ -f "$LIB_DIR/_chrome_header_handcraft.sh" ]; then
  printf '%s' "$INPUT" | bash "$LIB_DIR/_chrome_header_handcraft.sh" 1>/dev/null
  rc=$?
  [ "$rc" -eq 2 ] && WORST=2
fi

exit $WORST
