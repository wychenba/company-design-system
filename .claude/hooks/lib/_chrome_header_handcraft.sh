#!/bin/bash
set -uo pipefail
# Header canonical Layer 3 ChromeHeader consumption enforcement(per header-canonical.spec.md Layer 3):
#   Production chrome header 必消費 `<ChromeHeader>` primitive,
#   不可自寫 `h-[var(--chrome-header-height)] border-b border-divider px-loose` 那一套 className。
#
# PreToolUse(Edit / Write)hook —— 編輯 `packages/design-system/src/components/**/*.tsx`(非 stories)時掃:
#   檔內若有完整手刻 chrome header className signature → **P0 BLOCKER(exit 2)**。
#   2026-06-06 升 P0:migration 完成(header-canonical.spec.md L245「grep 全 repo 已無此手刻 signature
#   除 primitive 本身」)+ 0 殘留手刻 verified → 跟 item-anatomy C.4 row-handcraft P0 對稱。Escape 仍在。
#
# 當前期(2026-05-17 land Phase 2):Sidebar / FileViewer 已 migrate 完,其他元件若新加 chrome
# header 自刻 = drift,本 hook 攔。
#
# Allow escape:檔頭 `// @chrome-header-handcraft-allow: <reason>` 豁免(Tabs cva-on-pattern 等
# 不適合用 primitive 的 case);本 hook 本身與 ChromeHeader / SurfaceHeader / SidebarHeader.tsx
# 不攔(那些是 primitive 自己)。

source "$(dirname "$0")/../_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

case "$FILE_PATH" in
  */packages/design-system/src/components/**/*.tsx) ;;
  *) exit 0 ;;
esac

# Skip stories
case "$FILE_PATH" in
  *.stories.tsx|*.anatomy.stories.tsx|*.principles.stories.tsx) exit 0 ;;
esac

# Skip primitive home(SidebarHeader 內部消費 ChromeHeader,但仍有 className signature 引用)
case "$FILE_PATH" in
  */ChromeHeader/*|*/header-canonical/*|*/overlay-surface/*) exit 0 ;;
esac

NEW_CONTENT=$(echo "$INPUT" | jq -r '
  if .tool_input.new_string then .tool_input.new_string
  elif .tool_input.content then .tool_input.content
  else "" end
')

# Allow escape
if echo "$NEW_CONTENT" | grep -qE '@chrome-header-handcraft-allow:'; then
  exit 0
fi

# Detect handcraft signature: h-[var(--chrome-header-height)] paired with border-b border-divider
# 2026-06-03 修(同 R8 multiline bug class,對抗稽核抓到):tr 換行→空格 flatten。真實 JSX className
# 跨行(h-[...] 與 border-b 分行)+ [^"]* 跨屬性匹配 → 不 flatten 的話多行靜默漏(現 warn-only,但
# Phase 3 升 P0 後會 false-negative)。tr 後整段成單行,[^"]* 才能跨原換行匹配。
HANDCRAFT_HIT=$(echo "$NEW_CONTENT" | tr '\n' ' ' | grep -cE 'h-\[var\(--chrome-header-height\)\][^"]*border-b[^"]*border-divider' || true)

if [ "$HANDCRAFT_HIT" -gt "0" ]; then
  printf '❌ CHROME HEADER HANDCRAFT(P0 BLOCKER):\n' >&2
  printf '   File: %s\n' "$FILE_PATH" >&2
  printf '   偵測到自刻 `h-[var(--chrome-header-height)] ... border-b border-divider`\n' >&2
  printf '\n  SSOT: patterns/header-canonical/header-canonical.spec.md Layer 3\n' >&2
  printf '  修方向: import { ChromeHeader } from "@/design-system/patterns/header-canonical/chrome-header"\n' >&2
  printf '          替換 <div className="..."> → <ChromeHeader withTabs? leadingRail? lockDensity?>\n' >&2
  printf '  Escape: 檔頭加 // @chrome-header-handcraft-allow: <rationale>\n' >&2
  exit 2
fi

exit 0
