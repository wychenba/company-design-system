#!/bin/bash
# Tests for check_escape_marker_abuse.sh(P0 BLOCKER,user 2026-05-27 verbatim
# 「不亂加 escape markers — 加就跳 enforcement」)
#
# Hook 規則(PreToolUse,Edit / Write / MultiEdit):
#   Scope gate:
#     - tool_name ∈ {Edit, Write, MultiEdit} 才檢查(其他 tool → exit 0)
#     - file_path 必 match /(apps|consumer)/...(tsx|ts)$(consumer fork-user code)
#     - file_path 含 packages/design-system/src/ → 排除(DS 有 legit exception)
#     - content 取自 tool_input.new_string // tool_input.content;空 → exit 0
#   BLOCK(exit 2)condition:
#     - DISTINCT escape-marker types ≥ 3  OR
#     - TOTAL escape-marker occurrences ≥ 5
#   Override:CLAUDE_BYPASS_ESCAPE_MARKER_AUDIT=1 → exit 0(audit-logged)。
#
# Negative-case 斷言用「EXIT != 2(未 block)」為契約,不假設 stderr 全 silent:
#   hook clean-input path 有 cosmetic `0\n0: integer expression expected` stderr
#   noise(latent bug,見 hookBugFound),但 block 決策正確(exit 0)。測試斷言
#   正確 block 行為,不遷就 noise。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_escape_marker_abuse.sh"

if [ ! -x "$HOOK" ]; then
  echo "FATAL: hook not executable: $HOOK"
  exit 1
fi

PASS=0
FAIL=0
FAILED_TESTS=""

# TMP_DIR for any hook state(_log-fire.sh writes under CLAUDE_PROJECT_DIR)
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT
export CLAUDE_PROJECT_DIR="$TMP_DIR"
mkdir -p "$TMP_DIR/.claude/logs"

# run_hook: feed JSON payload to hook via stdin
#   $1 tool_name  $2 file_path  $3 content-field-name(content|new_string)  $4 content
run_hook() {
  local tool="$1"; local fp="$2"; local field="$3"; local content="$4"
  local payload
  payload=$(jq -n --arg t "$tool" --arg fp "$fp" --arg c "$content" --arg f "$field" \
    '{hook_event_name:"PreToolUse", tool_name:$t, tool_input:({file_path:$fp} + {($f):$c})}')
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDERR_TEXT=$(cat "$STDERR" 2>/dev/null)
  rm -f "$STDOUT" "$STDERR"
}

# run_hook_bypass: same but with CLAUDE_BYPASS_ESCAPE_MARKER_AUDIT=1
run_hook_bypass() {
  local tool="$1"; local fp="$2"; local field="$3"; local content="$4"
  local payload
  payload=$(jq -n --arg t "$tool" --arg fp "$fp" --arg c "$content" --arg f "$field" \
    '{hook_event_name:"PreToolUse", tool_name:$t, tool_input:({file_path:$fp} + {($f):$c})}')
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | CLAUDE_BYPASS_ESCAPE_MARKER_AUDIT=1 bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDERR_TEXT=$(cat "$STDERR" 2>/dev/null)
  rm -f "$STDOUT" "$STDERR"
}

# expect_block: exit 2 + needle in stderr
expect_block() {
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "2" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected BLOCK exit=2 + '$needle', got exit=$EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

# expect_not_block: NOT blocked(exit != 2)。contract = 不擋;允許 cosmetic stderr。
expect_not_block() {
  local name="$1"
  if [ "$EXIT" != "2" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected NOT blocked, got exit=2 BLOCKER)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

CONSUMER="/repo/apps/template/src/App.tsx"
BLOCK_NEEDLE="ESCAPE-MARKER-ABUSE BLOCKER"

echo "=== check_escape_marker_abuse tests ==="

# ---------- POSITIVE cases(SHOULD block)----------

# P1. 3 distinct markers(DISTINCT>=3 path)→ BLOCK
C_3DISTINCT='// @ds-misuse-allow legacy grid
import { Button } from "@qijenchen/design-system";
// @story-baseline-allow snapshot drift
export const App = () => <Button />;
// @consumer-catalog-allow custom icon
export const Foo = 1;'
run_hook "Write" "$CONSUMER" "content" "$C_3DISTINCT"
expect_block "P1. 3 distinct markers → BLOCK (DISTINCT>=3)" "$BLOCK_NEEDLE"

# P2. 5 occurrences of SAME marker(TOTAL>=5 path, DISTINCT=1)→ BLOCK
#     guards against over-narrow regex that only triggers on distinct-count
C_5TOTAL='// @ds-misuse-allow case 1
// @ds-misuse-allow case 2
// @ds-misuse-allow case 3
// @ds-misuse-allow case 4
// @ds-misuse-allow case 5
export const X = 1;'
run_hook "Write" "$CONSUMER" "content" "$C_5TOTAL"
expect_block "P2. 5 same-marker occurrences → BLOCK (TOTAL>=5)" "$BLOCK_NEEDLE"

# P3. Edit tool reads new_string field(not content)→ BLOCK
#     guards the new_string // content field-resolution fallback
run_hook "Edit" "$CONSUMER" "new_string" "$C_3DISTINCT"
expect_block "P3. Edit tool new_string field → BLOCK" "$BLOCK_NEEDLE"

# P4. consumer/ path variant(not apps/)also in scope → BLOCK
run_hook "Write" "/repo/consumer/widgets/Card.tsx" "content" "$C_3DISTINCT"
expect_block "P4. /consumer/ path in scope → BLOCK" "$BLOCK_NEEDLE"

# ---------- NEGATIVE cases(should NOT block)----------

# N1. Clean consumer tsx, zero markers → NOT blocked
C_CLEAN='import { Button } from "@qijenchen/design-system";
export const App = () => <Button>Save</Button>;'
run_hook "Write" "$CONSUMER" "content" "$C_CLEAN"
expect_not_block "N1. clean consumer tsx, no markers → not blocked"

# N2. NEAR-MISS over-narrow guard: 2 distinct markers (< 3) and 2 total (< 5)
#     real near-miss to the DISTINCT threshold — must NOT block
C_2DISTINCT='// @ds-misuse-allow legacy grid only
// @benchmark-unverified pending source check
export const App = 1;'
run_hook "Write" "$CONSUMER" "content" "$C_2DISTINCT"
expect_not_block "N2. near-miss 2 distinct / 2 total (< threshold) → not blocked"

# N3. NEAR-MISS over-broad guard: marker-lookalikes that are NOT in the list.
#     5 non-listed @-annotations (would block if regex were over-broad) → not blocked
C_LOOKALIKE='// @eslint-disable-next-line
// @ts-ignore
// @deprecated use Bar instead
// @internal helper
// @todo refactor later
export const App = 1;'
run_hook "Write" "$CONSUMER" "content" "$C_LOOKALIKE"
expect_not_block "N3. over-broad guard: 5 non-listed @-annotations → not blocked"

# N4. Scope exclusion: DS source path(packages/design-system/src/)→ not blocked
#     even with 3 distinct markers(DS has legit per-spec exceptions)
run_hook "Write" "/repo/packages/design-system/src/components/Foo.tsx" "content" "$C_3DISTINCT"
expect_not_block "N4. DS source path excluded → not blocked (even 3 markers)"

# N5. Scope exclusion: non-consumer path(src/ root, not apps|consumer)→ skip
run_hook "Write" "/repo/src/utils/helper.tsx" "content" "$C_3DISTINCT"
expect_not_block "N5. non-consumer path (src/) → not blocked"

# N6. Scope exclusion: .css file(only .tsx/.ts in scope)→ skip
run_hook "Write" "/repo/apps/template/src/styles.css" "content" "$C_3DISTINCT"
expect_not_block "N6. .css file out of scope → not blocked"

# N7. Tool gate: Read tool → skip(only Edit/Write/MultiEdit)
run_hook "Read" "$CONSUMER" "content" "$C_3DISTINCT"
expect_not_block "N7. tool=Read → not blocked"

# N8. Empty content → exit 0(early return)
run_hook "Write" "$CONSUMER" "content" ""
expect_not_block "N8. empty content → not blocked"

# N9. Override env CLAUDE_BYPASS_ESCAPE_MARKER_AUDIT=1 → not blocked
run_hook_bypass "Write" "$CONSUMER" "content" "$C_3DISTINCT"
expect_not_block "N9. CLAUDE_BYPASS_ESCAPE_MARKER_AUDIT=1 override → not blocked"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  printf "Failed:%b\n" "$FAILED_TESTS"
  exit 1
fi
exit 0
