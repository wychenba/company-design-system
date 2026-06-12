#!/bin/bash
# check_layout_space_magic_numbers.sh — P0 BLOCKER
#
# 偵測 consumer / DS app code 用 Tailwind spacing magic numbers
# (`p-4` / `px-6` / `py-2` / `gap-3` 等)而非 layoutSpace token
# (`p-[var(--layout-space-N) N∈{loose,tight}]` / `gap-[var(--layout-space-N) N∈{loose,tight}]`)。
# 2026-05-27 user verbatim「機械無強制就不會做?那為何不全部 ssot 都要強制吻合?」
# 永久 codify — SSOT canonical 必 P0 BLOCKER,不分級。
#
# Anchor:user 質疑「content 自動繼承 layoutSpace SSOT 嗎?」
# - app-shell.spec.md:205 明文 `<main>` landmark padding=0 (intentional)
# - app-shell.spec.md:207-212 consumer 必遵循 layoutSpace.spec.md 6 條規則 + 親疏 3 級
#
# PostToolUse Edit/Write detect magic Tailwind spacing → P0 BLOCKER exit 2
# 強制改 token OR 加 `// @layout-space-magic-ok: <rationale>` escape comment(per-line)。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo "{}")
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null)

case "${TOOL:-}" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.notebook_path // ""' 2>/dev/null)

# Only check .tsx / .ts in app code
if ! echo "$FILE" | grep -qE '\.(tsx|ts)$'; then exit 0; fi
# Skip DS source (DS components have their own spacing logic via cva)
if echo "$FILE" | grep -qE 'packages/design-system/src/|node_modules/'; then exit 0; fi

# Get new content
NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // ""' 2>/dev/null)
[ -z "$NEW_CONTENT" ] && exit 0

# Escape clause:single line escape comment per line of magic number usage
# `// @layout-space-magic-ok: <rationale>` immediately above the line OR on same line
ESCAPE_MARKER='@layout-space-magic-ok:'

# Detect magic spacing classes (Tailwind class strings only — NOT JSX props like size={24})
# Match per line so we can check per-line escape comments
MAGIC_LINES=$(echo "$NEW_CONTENT" | grep -nE '\b(p|px|py|pt|pb|pl|pr|gap|space-x|space-y|m|mx|my|mt|mb|ml|mr)-(0\.5|[1-9][0-9]?(\.[0-9])?)\b')

if [ -z "$MAGIC_LINES" ]; then
  exit 0
fi

# Filter out lines with escape marker on same line OR immediately preceding line
# 2026-06-03 修(doc-vs-code bug,M32):L41 文件宣稱支援「preceding line OR same line」,
# 但原 code 只檢查同行 → JSX className 行無法放同行 `//` comment(會破壞 JSX)→ escape 對 JSX
# 實質失效。補實作前一行檢查(grep -n 行號 → sed 取前一行),對齊文件 + 解 JSX 必需。
UNJUSTIFIED=""
while IFS= read -r line; do
  # same-line marker
  if echo "$line" | grep -qF "$ESCAPE_MARKER"; then continue; fi
  # preceding-line marker(JSX `{/* @layout-space-magic-ok: ... */}` 在上一行)。
  # 對齊 ESLint disable-next-line 慣例:前一行 marker 僅在該行是「註解專用行」(trimmed 開頭
  # //、{/*、/*、*)時生效 — 否則上一行 code 的「同行 escape」會誤串到下一行(P8 conflict)。
  lineno="${line%%:*}"
  if [ "$lineno" -gt 1 ] 2>/dev/null; then
    prev=$(echo "$NEW_CONTENT" | sed -n "$((lineno-1))p")
    if echo "$prev" | grep -qF "$ESCAPE_MARKER" && echo "$prev" | grep -qE '^[[:space:]]*(//|\{?/\*|\*)'; then continue; fi
  fi
  UNJUSTIFIED="${UNJUSTIFIED}${line}\n"
done <<< "$MAGIC_LINES"

if [ -z "$UNJUSTIFIED" ]; then
  exit 0
fi

cat >&2 << EOF
🚨 LAYOUT-SPACE-MAGIC-NUMBER BLOCKER(P0,2026-05-27 user verbatim「機械無強制就不會做?
為何不全部 ssot 都要強制吻合?」永久 codify)

  Detected Tailwind spacing magic numbers in $FILE without escape:
$(echo -e "$UNJUSTIFIED" | sed 's/^/    /' | head -10)

  per app-shell.spec.md L205-219 + layoutSpace.spec.md SSOT:consumer content 必遵循
  layoutSpace 6 條規則 + 親疏 3 級,**禁** 硬寫 Tailwind magic numbers。改用:
    p-[var(--layout-space-loose)]      /* 16px 規則 1A/1B chrome / wrap */
    p-[var(--layout-space-tight)]      /* 12px 規則 3 親 gap */
    gap-[var(--layout-space-distant)]  /* 24px 規則 3 疏 gap */
    space-y-[var(--layout-space-distant)]

  修法 2 選 1:
    (a) 改 token:換成 var(--layout-space-N) N∈{loose,tight} family per 6 規則 + 親疏 3 級
    (b) Escape:在該 line 加 \`// @layout-space-magic-ok: <rationale>\` 顯式 documented
        (eg.「\`gap-1\` 是 4px stack icon — non-spacing context,not consumer layout」)

  完整 6 條規則 → packages/design-system/src/tokens/layoutSpace/layoutSpace.spec.md
EOF
exit 2
