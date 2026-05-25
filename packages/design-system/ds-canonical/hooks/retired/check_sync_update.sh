#!/bin/bash
# PostToolUse hook: remind to check sync when editing design-system files
# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

FILE_PATH=$(jq -r '.tool_input.file_path // empty')

# Component .tsx edited → check spec + stories
if echo "$FILE_PATH" | grep -q 'packages/design-system/src/components/.*\.tsx$' && \
   ! echo "$FILE_PATH" | grep -q '\.stories\.tsx$'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"Sync check: you just edited a design-system component .tsx file. Check if the corresponding .spec.md and .stories.tsx need updates (see CLAUDE.md sync rules)."}}'

# Spec .md edited → check stories
elif echo "$FILE_PATH" | grep -q 'packages/design-system/src/.*\.spec\.md$'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"Sync check: you just edited a spec.md. Check if the corresponding .principles.stories.tsx and .anatomy.stories.tsx need updates to reflect the new rules."}}'

# Pattern spec/code edited → check all consumers
elif echo "$FILE_PATH" | grep -q 'packages/design-system/src/patterns/.*\.\(tsx\|md\)$'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"Sync check: you just edited a pattern file. Check ALL consumer components listed in the pattern spec to ensure they still comply."}}'
fi
