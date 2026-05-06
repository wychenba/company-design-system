#!/bin/bash
set -uo pipefail
# K4 PreToolUse hook(2026-05-04 / M25):
#   Overlay panel viewport-aware scroll chain invariant — Popover/HoverCard/Dialog/Sheet content 設
#   max-h + flex flex-col + overflow-hidden,讓 viewport 太小時 header/footer 永遠 in-viewport,body 壓縮 scroll。
#   Panel root 必 forward `flex flex-col h-full`,否則 SurfaceBody flex-1 失效 → body 不 scroll。
#
# 偵測:Edit/Write 動到 *.tsx,added 內含 `<SurfaceBody`(panel 用 surface chrome)而 panel root div
#   className 無 `flex flex-col h-full` → P1 warn。
#
# Allowlist:行尾 `// @scroll-chain-allow: <reason>`(已驗證 panel 不需 scroll,如固定高 widget)。

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

case "$FILE_PATH" in
  *.tsx) ;;
  *) exit 0 ;;
esac

NEW_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

[ -z "${NEW_CONTENT//[[:space:]]/}" ] && exit 0

# Allowlist
if echo "$NEW_CONTENT" | grep -q '@scroll-chain-allow'; then
  exit 0
fi

# Skip if SurfaceBody is not used in this batch
if ! echo "$NEW_CONTENT" | grep -q '<SurfaceBody'; then
  exit 0
fi

# Look for div with ref={ref} OR direct wrapper that contains SurfaceBody
# If wrapper className doesn't have `flex flex-col h-full` → warn
# Heuristic:檢查 wrapper className 區段(div ref / div className=) 緊接 SurfaceHeader 或 SurfaceBody
SUSPECT=$(printf '%s' "$NEW_CONTENT" | awk '
  BEGIN { suspect = 0 }
  # Look for opening <div with className containing w-[ but not flex flex-col h-full
  /^[[:space:]]*<div[[:space:]]/ {
    # Buffer current div tag(may span multiple lines until >)
    line = $0
    while (index(line, ">") == 0 && (getline next_line) > 0) {
      line = line " " next_line
    }
    # K11 v2:必同時含 flex flex-col + h-full + min-h-0(flex item default min-h:auto 阻 shrink)
    if (line ~ /w-\[/ && (line !~ /flex[^"]*flex-col/ || line !~ /h-full/ || line !~ /min-h-0/)) {
      # Check if next ~5 lines contain SurfaceBody
      nextlines = ""
      for (k = 0; k < 30 && (getline next_line) > 0; k++) {
        nextlines = nextlines "\n" next_line
        if (next_line ~ /<SurfaceBody/) {
          print "[panel root w-[...] 缺 flex flex-col h-full min-h-0(flex item shrink 失效),有 SurfaceBody]: " substr(line, 1, 100)
          break
        }
        if (next_line ~ /<\/div>/) break
      }
    }
  }
')

if [ -n "$SUSPECT" ]; then
  cat >&2 <<EOF

┄┄┄ check_overlay_panel_scroll_chain — M25 violation 警告 ┄┄┄

[P1 WARN] ${FILE_PATH}
偵測到 overlay panel root wrapper 無 \`flex flex-col h-full\` 但內含 \`<SurfaceBody>\`:
${SUSPECT}

⚠️  M25 canonical:Popover/HoverCard/Dialog/Sheet 的 viewport-aware scroll 機制要求
    root → SurfaceBody 之間所有中間 wrapper 都 forward \`flex flex-col h-full\`。
    斷鏈會讓 SurfaceBody flex-1 min-h-0 overflow-y-auto 失效 → body 不 scroll。

修法:wrapper className 加 \`flex flex-col h-full\`:
  <div ref={ref} className="flex flex-col h-full w-[640px]">  ✓
    <SurfaceHeader />
    <SurfaceBody />
  </div>

詳:patterns/overlay-surface/overlay-surface.spec.md「Viewport-aware scroll chain invariant」/ M25
若刻意豁免(rare,e.g. 固定高 widget 不需 scroll):加 \`// @scroll-chain-allow: <reason>\`。
EOF
fi

exit 0
