#!/usr/bin/env bash
# check_ssot_consultation.sh
#
# Purpose: When writing a NEW .tsx file to src/design-system/components/ or
# src/explorations/, warn if the file lacks the canonical SSOT Consultation
# comment block. This enforces CLAUDE.md `# SSOT 消費 canonical` — the
# mechanical guardrail for Mindset #2 ("不憑直覺發明 / 優先消費既有").
#
# Input: $CLAUDE_TOOL_INPUT contains JSON with file_path + content for Write tool.
# Output: stderr warning if missing; exit 0 (non-blocking by design — AI decides
# whether to re-edit and add the block).

set -euo pipefail

# Read stdin JSON payload (Claude Code hook input)
INPUT=$(cat)

# Only fire on Write tool, not Edit (Edit implies existing file, checklist should already be there)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('tool_name', ''))" 2>/dev/null || echo "")
if [[ "$TOOL_NAME" != "Write" ]]; then
  exit 0
fi

# Extract file_path + content
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('tool_input', {}).get('file_path', ''))" 2>/dev/null || echo "")
CONTENT=$(echo "$INPUT" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d.get('tool_input', {}).get('content', ''))" 2>/dev/null || echo "")

# Only .tsx files in design-system components or explorations
case "$FILE_PATH" in
  */src/design-system/components/*/*.tsx) ;;
  */src/explorations/*/*.tsx) ;;
  *) exit 0 ;;
esac

# Skip .stories.tsx, .anatomy.stories.tsx, .principles.stories.tsx (stories have own anatomy checks)
case "$FILE_PATH" in
  *.stories.tsx) exit 0 ;;
  *.test.tsx) exit 0 ;;
esac

# Check if content contains the SSOT Consultation marker.
# Canonical markers (any of):
#   - `── 消費的 SSOT ──`  (zh canonical block)
#   - `── 實作基礎 ──`      (loose form, existing elements in code)
#   - `## Consumes SSOT`   (future English form)
if echo "$CONTENT" | grep -qE "(消費的 SSOT|實作基礎|Consumes SSOT)"; then
  exit 0
fi

# Missing — emit warning to stderr (non-blocking)
cat >&2 <<EOF
⚠️  SSOT Consultation 檢查:新 tsx 檔缺少消費宣告

路徑: $FILE_PATH

CLAUDE.md \`# SSOT 消費 canonical\` 要求新元件 / 新 feature 的 tsx 開頭必含
消費宣告 comment block。這是 Mindset #2「不憑直覺發明」+ Meta-Pattern M1 的
機械化 guardrail。

建議模板(加到 file top 的 JSDoc):

/**
 * {Component} — {定位一句話}
 *
 * ── 定位 ──
 * {one-liner purpose}
 *
 * ── 實作基礎 ──
 * 消費: [Button, Input, ItemInlineAction, ...]  // DS components used
 * 對應 pattern: [item-anatomy, action-bar]
 *
 * ── 消費的 SSOT ──
 * - components: [...]
 * - patterns: [patterns/xxx/spec.md]
 * - tokens: [--layout-space-loose, --chrome-header-height]
 * - spec refs: {nearest kin specs}
 */

若檔案不是新增元件(例:test / helper / type-only),可忽略本警告。
若是新元件或重大 feature,請補齊再 commit。

(本 hook 非 blocking,只是提醒。)
EOF

exit 0
