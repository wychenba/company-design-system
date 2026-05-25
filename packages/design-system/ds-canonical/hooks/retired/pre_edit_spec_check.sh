#!/bin/bash
# PreToolUse hook: before editing a design-system component .tsx,
# remind AI to read the spec first.
#
# Diff-aware: skip if the edit is purely import cleanup / type-only / typo —
# spec reading not required for those. Only fire if edit touches render body,
# cva, variants, tokens, or other design-meaningful regions.
# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only trigger for design-system component .tsx files (not stories, not specs)
if ! echo "$FILE_PATH" | grep -q 'packages/design-system/src/components/.*\.tsx$'; then
  exit 0
fi
echo "$FILE_PATH" | grep -q '\.stories\.tsx$' && exit 0

# Diff-aware: extract old+new content. Skip if it's purely import / export-list
# manipulation or type-alias tweaks (not design-meaningful).
DIFF_TEXT=$(echo "$INPUT" | jq -r '
  (.tool_input.old_string // "") + "\n---\n" +
  (.tool_input.new_string // "") + "\n---\n" +
  (.tool_input.content    // "") + "\n---\n" +
  ([.tool_input.edits[]? | (.old_string + "\n---\n" + .new_string + "\n---\n")] | join(""))
' 2>/dev/null || echo "")

# If diff is non-empty and consists ONLY of import lines / export lines /
# pure type annotations — skip.
if [ -n "$DIFF_TEXT" ]; then
  # Strip lines that are imports / exports / type declarations / whitespace.
  MEANINGFUL=$(echo "$DIFF_TEXT" | grep -vE '^[[:space:]]*(import |export (type )?\{|export type |type [A-Z]|interface [A-Z]|//|---|[[:space:]]*$|\}|\{)' | head -5)
  # If nothing substantive remains, skip the nag.
  [ -z "$MEANINGFUL" ] && exit 0
fi

COMP_DIR=$(echo "$FILE_PATH" | sed -n 's|.*packages/design-system/src/components/\([^/]*\)/.*|\1|p')
[ -z "$COMP_DIR" ] && exit 0

SPEC_BASENAME=$(echo "$COMP_DIR" | sed 's/\([a-z]\)\([A-Z]\)/\1-\2/g; s/\([A-Z]\)\([A-Z][a-z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]')
SPEC_PATH="${CLAUDE_PROJECT_DIR}/packages/design-system/src/components/${COMP_DIR}/${SPEC_BASENAME}.spec.md"

# Extract 禁止事項 section(如 spec 存在且有該 section)— inject 到 additionalContext
# 讓 AI 改 tsx 前機械上讀到 forbid list,不靠記憶。2026-04-24 FileUpload `files` prop
# 事件根因:spec 禁止事項寫「不在 FileUpload 自己畫 list」AI 未讀就加 prop。
FORBID_SECTION=""
if [ -f "$SPEC_PATH" ]; then
  # awk 抓從「## 禁止事項」到下個 H2 前的內容(最多 40 行 cap,避免爆量)
  FORBID_SECTION=$(awk '
    /^## (禁止事項|Forbidden|❌)/ { in_section=1; print; next }
    in_section && /^## / { exit }
    in_section { print }
  ' "$SPEC_PATH" 2>/dev/null | head -40)
fi

CONTEXT="⚠️ Editing ${COMP_DIR} (design-meaningful region). READ ${SPEC_BASENAME}.spec.md full 禁止事項 + Props 行為 sections before proceeding."
if [ -n "$FORBID_SECTION" ]; then
  # 用 jq 安全 escape multiline content into JSON string
  ESCAPED=$(printf '%s\n\n---\n\n%s' "$CONTEXT" "$FORBID_SECTION" | jq -Rs .)
  cat <<EOJSON
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":${ESCAPED}}}
EOJSON
else
  cat <<EOJSON
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"${CONTEXT}"}}
EOJSON
fi
