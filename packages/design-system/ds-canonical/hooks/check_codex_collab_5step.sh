#!/bin/bash
set -uo pipefail
# M31 機械強制:Adversarial dual-track 5-step canonical — claude / codex 每次 collab 必走完整
# 5-step(各自熟讀 / 各自驗證 / 各自視覺稽核 / cite-based propose / 整合完美版本)。
#
# PreToolUse(Bash git commit)hook — 攔截 commit message 含 codex / Layer A / Layer B keyword
# 但**未同時**含以下 3 必備 marker:
#   (a) spec.md cite — regex `spec.md:L\d+` OR `spec.md` + 引文 OR `canonical`
#   (b) verify run — regex `tsc|audit|invariant|visual|playwright|grep verify`
#   (c) verdict — regex `agree|disagree-with-cite|synthesize|approve|cite battle|counter-cite`
#
# Bug 史(2026-05-10):
#   Issue 8 cell border:codex propose「Field edit border 透明」,Claude pass-through ship,
#   無 spec cite + 無 verify + 直接 commit → user 強烈糾正「被 codex 牽著走」。M31 universal
#   mindset 應每題啟動,不只 disagree。Hook 機械強制 commit message 含 3 必備 marker,逼
#   Claude 跑完整 5-step 才能 commit codex-collab work。
#
# Allow escape:
#   commit message 含 `@codex-collab-allow: <reason>` 整 commit 豁免(緊急 hotfix etc)
#
# Soft warning(P1):exit 0 但 stderr 印警告 — 不 block commit(因 commit message 自由 draft,
# false-positive 太高 hard-block 會困住)。但 stop hook + session start hook 會撈 fire log
# 後續 raise 為 BLOCKER。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Only Bash tool with git commit
case "$TOOL" in
  Bash) ;;
  *) exit 0 ;;
esac

# Match git commit -m with HEREDOC or inline message
if ! echo "$COMMAND" | grep -qE 'git commit'; then
  exit 0
fi

# Extract commit message text(rough — supports HEREDOC `<<'EOF' ... EOF` + inline -m '...')
# HEREDOC pattern:`cat <<'EOF'` ... `EOF`
MSG=$(echo "$COMMAND" | sed -nE "s/.*-m \"(.*)\"$/\\1/p; /cat <<'?EOF'?/,/^EOF$/p" 2>/dev/null || true)
# Fallback:整個 command string(若 HEREDOC parse 失敗)
if [ -z "$MSG" ]; then
  MSG="$COMMAND"
fi

# Allow escape
if echo "$MSG" | grep -qE '@codex-collab-allow:'; then
  exit 0
fi

# Trigger check:does message mention codex collab?
TRIGGER_REGEX='codex|Layer A own|Layer B codex|dual-track|據理力爭|据理力爭|cite battle'
if ! echo "$MSG" | grep -qE "$TRIGGER_REGEX"; then
  # Not a codex-collab commit — skip
  exit 0
fi

# Required markers
MISSING=()

# (a) spec cite
SPEC_CITE_REGEX='spec\.md[:L0-9]|spec\.md.*L[0-9]|canonical[ 的引文]|RFC.*L[0-9]'
if ! echo "$MSG" | grep -qE "$SPEC_CITE_REGEX"; then
  MISSING+=("spec.md cite(規格 path:line / 引文)")
fi

# (b) verify
VERIFY_REGEX='tsc|audit|invariant|visual|playwright|grep verify|grep .*confirm'
if ! echo "$MSG" | grep -qiE "$VERIFY_REGEX"; then
  MISSING+=("verify run(tsc / audit / invariant / visual / playwright)")
fi

# (c) verdict keyword
VERDICT_REGEX='agree|disagree-with-cite|disagree.*cite|approve|synthesize|cite battle|counter-cite|verdict'
if ! echo "$MSG" | grep -qiE "$VERDICT_REGEX"; then
  MISSING+=("verdict keyword(agree / disagree-with-cite / synthesize)")
fi

if [ ${#MISSING[@]} -eq 0 ]; then
  exit 0
fi

# Soft warning(stderr only,exit 0 — 不 block 因 false-positive 風險)
echo "⚠️  M31 codex-collab 5-step canonical 違反(P1 soft warn):" >&2
echo "   Commit 含 codex collab keyword 但缺以下 marker:" >&2
for m in "${MISSING[@]}"; do
  echo "   ✗ $m" >&2
done
echo "" >&2
echo "   M31 universal mindset:每次 codex collab 都該完整 5-step:" >&2
echo "     (1) 各自熟讀 spec.md / canonical" >&2
echo "     (2) 各自驗證 tsc / audit / playwright" >&2
echo "     (3) 各自視覺稽核 screenshot / DOM" >&2
echo "     (4) 各自 cite-based propose" >&2
echo "     (5) 整合完美版本(not pass-through)" >&2
echo "" >&2
echo "   Commit message 補 cite + verify + verdict marker 再 commit。" >&2
echo "   或加 \`@codex-collab-allow: <reason>\` 緊急豁免。" >&2
echo "   詳 .claude/rules/meta-patterns.md M31 + .claude/skills/codex-collab/SKILL.md" >&2

# Soft warning — exit 0,不 block(per M31 hook design note)
exit 0
