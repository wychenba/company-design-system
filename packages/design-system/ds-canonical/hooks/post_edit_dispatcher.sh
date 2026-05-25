#!/bin/bash
# post_edit_dispatcher.sh — orchestrate 8 lib helper rules (PostToolUse Write|Edit|MultiEdit)
#
# 2026-05-13 /knowledge-prune consolidation:
#   Per CLAUDE.md governance hook count budget (25 soft / 30 hard,Anthropic ~15 guideline)
#   Pre-consolidation: 32 hooks → BLOCKER 30 cap breached
#   This dispatcher folds 8 lib/_*.sh helpers into one hook registration
#   Lib helpers remain as standalone testable files (renamed `_*` per Unix internal-helper convention)
#   Net hook count: 32 - 8 lib + 1 dispatcher = 25 ✅
#
# Pattern: read stdin INPUT once,pipe to each helper sequentially,collect their JSON outputs
# Each helper:
#   - Reads file_path from stdin via jq
#   - Filters by scope (skips if out-of-scope)
#   - Emits {hookSpecificOutput: {additionalContext: "..."}} OR exits 0 silent
# Dispatcher: concatenate non-empty additionalContext blocks into ONE JSON output

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo "{}")
HOOKS_DIR="$(dirname "$0")"
LIB_DIR="$HOOKS_DIR/lib"

# Aggregate additionalContext fragments from each helper
COMBINED=""

run_helper() {
  local helper="$1"
  [ -f "$helper" ] || return 0
  local out
  out=$(printf '%s' "$INPUT" | bash "$helper" 2>/dev/null)
  [ -z "$out" ] && return 0
  # Extract additionalContext via jq (each helper emits valid JSON)
  local ctx
  ctx=$(printf '%s' "$out" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)
  [ -z "$ctx" ] && return 0
  if [ -z "$COMBINED" ]; then
    COMBINED="$ctx"
  else
    COMBINED="${COMBINED}"$'\n\n────────\n\n'"$ctx"
  fi
}

# Run 8 helpers sequentially (all silent-fail / exit 0 / additive warnings)
run_helper "$LIB_DIR/_token_hygiene.sh"
run_helper "$LIB_DIR/_hardcoded_strings.sh"
run_helper "$LIB_DIR/_code_quality.sh"
run_helper "$LIB_DIR/_layout_space_canonical.sh"
run_helper "$LIB_DIR/_person_data_richness.sh"
run_helper "$LIB_DIR/_overlay_handcraft.sh"
run_helper "$LIB_DIR/_cva_default_sync.sh"
run_helper "$LIB_DIR/_story_compile_drift.sh"
run_helper "$LIB_DIR/_governance_coverage_check.sh"

if [ -n "$COMBINED" ]; then
  ESCAPED=$(printf '%s' "$COMBINED" | jq -Rs .)
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":%s}}\n' "$ESCAPED"
fi

exit 0
