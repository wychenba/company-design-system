#!/bin/bash
# Audit Dim 53 — Code-to-spec reverse drift check(2026-05-17 ship per M31 codex 共識)。
#
# 背景:Phase 1 我把 FileViewer spec.md L103 寫成「h-14 硬寫 known drift」,
# 實際 code 已是 `h-[var(--chrome-header-height)]` — 反向 drift。本 hook 補。
#
# Allow escape:檔頭 `// @spec-class-drift-allow: <reason>` 整檔豁免。
#
# 2026-05-17 Round 3 修(per M31 codex Round 2 catch + 自跑 smoke test catch):
#   set -u 在 zsh 下 PHRASE UTF-8 變數 unbound — 完全不用 set -u,只用 default-empty。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

# 不用 set -e / set -u(grep find-nothing 返回 1 + zsh UTF-8 變數 unbound issue)
# 全部 defensive `|| true` + ${VAR:-default} 處理

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "${TOOL:-}" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

case "${FILE_PATH:-}" in
  */packages/design-system/src/components/*/[a-z-]*.spec.md) ;;
  *) exit 0 ;;
esac

NEW_CONTENT=$(echo "$INPUT" | jq -r '
  if .tool_input.new_string then .tool_input.new_string
  elif .tool_input.content then .tool_input.content
  else "" end
')

if echo "${NEW_CONTENT:-}" | grep -qE '@spec-class-drift-allow:'; then
  exit 0
fi

TSX_PATH="${FILE_PATH%.spec.md}.tsx"
if [ ! -f "$TSX_PATH" ]; then
  exit 0
fi

TSX_CONTENT=$(cat "$TSX_PATH" 2>/dev/null)
TSX_CONTENT="${TSX_CONTENT:-}"

WARNINGS=""

# Pattern 1: spec 寫「固定 h-NN」/「h-NN 寫死」/「h-NN 硬寫」keyword
# Extract phrase + check tsx
PHRASES=$(echo "${NEW_CONTENT:-}" | grep -oE '(固定|寫死|硬寫|hardcode)[[:space:]]+h-[0-9]+' || true)
if [ -n "$PHRASES" ]; then
  while IFS= read -r phrase; do
    [ -z "$phrase" ] && continue
    class=$(echo "$phrase" | grep -oE 'h-[0-9]+' | head -1)
    [ -z "$class" ] && continue
    if ! echo "$TSX_CONTENT" | grep -qE "[\"' ]$class[\"' \]]"; then
      WARNINGS="${WARNINGS}   • spec 寫「$phrase」但 tsx 不含 $class(可能已 migrate to token)
"
    fi
  done <<EOF
$PHRASES
EOF
fi

# Pattern 2: tsx 已消費 --chrome-header-height,spec 仍寫「固定 h-NN」
HAS_TOKEN_TSX=$(echo "$TSX_CONTENT" | grep -c 'chrome-header-height' 2>/dev/null | head -1)
HAS_TOKEN_TSX="${HAS_TOKEN_TSX:-0}"
HAS_DRIFT_SPEC=$(echo "${NEW_CONTENT:-}" | grep -cE '(固定|寫死|硬寫)[[:space:]]+h-(12|14|16)' 2>/dev/null | head -1)
HAS_DRIFT_SPEC="${HAS_DRIFT_SPEC:-0}"
if [ "$HAS_TOKEN_TSX" -gt 0 ] 2>/dev/null && [ "$HAS_DRIFT_SPEC" -gt 0 ] 2>/dev/null; then
  WARNINGS="${WARNINGS}   • tsx 已消費 --chrome-header-height token,但 spec 仍寫「固定 h-NN」— 反向 drift
"
fi

if [ -n "$WARNINGS" ]; then
  printf '⚠️ SPEC-CODE REVERSE DRIFT(audit Dim 53,soft P1):\n' >&2
  printf '   Spec: %s\n' "$FILE_PATH" >&2
  printf '   Code: %s\n' "$TSX_PATH" >&2
  printf '%s' "$WARNINGS" >&2
  printf '  SSOT: .claude/skills/design-system-audit/SKILL.md Group P Dim 53\n' >&2
  printf '  修方向: 改 spec.md wording 對齊 code 實況\n' >&2
  printf '  Escape: spec 頭加 // @spec-class-drift-allow: <rationale>\n' >&2
fi

exit 0
