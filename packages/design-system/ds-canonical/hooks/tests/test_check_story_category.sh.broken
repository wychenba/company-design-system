#!/bin/bash
# Tests for check_story_category.sh
# Verifies trait-based compliance enforcement

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Cluster A merge(2026-05-10):check_story_category.sh fold 進
# check_story_invariants.sh dispatcher R3。Test 走 dispatcher。
HOOK="$SCRIPT_DIR/../check_story_invariants.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }

PASS=0; FAIL=0; FAILED=""

setup_proj() {
  TMP_PROJ=$(mktemp -d)
  mkdir -p "$TMP_PROJ/src/design-system/components/Foo" "$TMP_PROJ/.claude/hooks"
  echo 'log_hook_fire() { :; }' > "$TMP_PROJ/.claude/hooks/_log-fire.sh"
}
teardown_proj() { rm -rf "$TMP_PROJ"; }

run_hook() {
  local content="$1"
  local file_path="$2"
  local payload
  payload=$(jq -n \
    --arg fp "$file_path" \
    --arg ct "$content" \
    '{tool_name:"Write", tool_input:{file_path:$fp, content:$ct}}')
  STDOUT=$(echo "$payload" | bash "$HOOK" 2>&1)
  EXIT=$?
}

# ── Test 1: no spec.md → silent pass ─────────────────────────────────────────
echo "Test 1: no spec.md → silent pass"
setup_proj
run_hook "export const Default = {};" "$TMP_PROJ/src/design-system/components/Foo/foo.stories.tsx"
if [ "$EXIT" = "0" ] && [ -z "$STDOUT" ]; then
  echo "  PASS  Test 1"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 1 (exit=$EXIT, output=${STDOUT:0:100})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 1"
fi
teardown_proj

# ── Test 2: spec without traits frontmatter → silent pass ────────────────────
echo "Test 2: spec without traits → silent pass"
setup_proj
cat > "$TMP_PROJ/src/design-system/components/Foo/foo.spec.md" <<EOF
# Foo
Some content.
EOF
run_hook "export const Default = {};" "$TMP_PROJ/src/design-system/components/Foo/foo.stories.tsx"
if [ "$EXIT" = "0" ] && [ -z "$STDOUT" ]; then
  echo "  PASS  Test 2"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 2 (exit=$EXIT, output=${STDOUT:0:100})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 2"
fi
teardown_proj

# ── Test 3: hasSizes trait + AllSizes present → pass ─────────────────────────
echo "Test 3: hasSizes + AllSizes present → pass"
setup_proj
cat > "$TMP_PROJ/src/design-system/components/Foo/foo.spec.md" <<EOF
---
component: Foo
traits:
  - hasSizes
  - hasInteractiveStates
---
# Foo
EOF
run_hook "export const Default = {};
export const AllSizes = {};
export const Disabled = {};" "$TMP_PROJ/src/design-system/components/Foo/foo.stories.tsx"
if [ "$EXIT" = "0" ] && [ -z "$STDOUT" ]; then
  echo "  PASS  Test 3"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 3 (exit=$EXIT, output=${STDOUT:0:200})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 3"
fi
teardown_proj

# ── Test 4: hasSizes trait + per-size split → BLOCK ──────────────────────────
echo "Test 4: hasSizes + Small/Medium/Large split → block P0"
setup_proj
cat > "$TMP_PROJ/src/design-system/components/Foo/foo.spec.md" <<EOF
---
traits:
  - hasSizes
---
EOF
run_hook "export const Default = {};
export const Small = {};
export const Medium = {};
export const Large = {};" "$TMP_PROJ/src/design-system/components/Foo/foo.stories.tsx"
if [ "$EXIT" = "2" ] && echo "$STDOUT" | grep -q "per-size split detected"; then
  echo "  PASS  Test 4 per-size split blocked"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 4 (exit=$EXIT, output=${STDOUT:0:200})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 4"
fi
teardown_proj

# ── Test 5: isOverlay trait + no OpenSnapshot → BLOCK ────────────────────────
echo "Test 5: isOverlay + no OpenSnapshot → block P0"
setup_proj
cat > "$TMP_PROJ/src/design-system/components/Foo/foo.spec.md" <<EOF
---
traits:
  - isOverlay
---
EOF
run_hook "export const Default = {};" "$TMP_PROJ/src/design-system/components/Foo/foo.stories.tsx"
if [ "$EXIT" = "2" ] && echo "$STDOUT" | grep -q "isOverlay"; then
  echo "  PASS  Test 5 overlay missing OpenSnapshot blocked"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 5 (exit=$EXIT, output=${STDOUT:0:200})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 5"
fi
teardown_proj

# ── Test 6: isOverlay + defaultOpen present → pass ───────────────────────────
echo "Test 6: isOverlay + defaultOpen=true present → pass"
setup_proj
cat > "$TMP_PROJ/src/design-system/components/Foo/foo.spec.md" <<EOF
---
traits:
  - isOverlay
---
EOF
run_hook "export const Default = { args: { defaultOpen: true } };" "$TMP_PROJ/src/design-system/components/Foo/foo.stories.tsx"
if [ "$EXIT" = "0" ] && [ -z "$STDOUT" ]; then
  echo "  PASS  Test 6 defaultOpen ✓ pass"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 6 (exit=$EXIT, output=${STDOUT:0:200})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 6"
fi
teardown_proj

# ── Test 7: rationale escape allowlist ──────────────────────────────────────
echo "Test 7: @story-trait-rationale escape → pass"
setup_proj
cat > "$TMP_PROJ/src/design-system/components/Foo/foo.spec.md" <<EOF
---
traits:
  - hasSizes
---
EOF
run_hook "// @story-trait-rationale: experimental design exploration
export const Small = {};" "$TMP_PROJ/src/design-system/components/Foo/foo.stories.tsx"
if [ "$EXIT" = "0" ] && [ -z "$STDOUT" ]; then
  echo "  PASS  Test 7 rationale escape works"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 7 (exit=$EXIT, output=${STDOUT:0:200})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 7"
fi
teardown_proj

# ── Test 8: anatomy/principles stories skipped ──────────────────────────────
echo "Test 8: .anatomy.stories.tsx skipped(not subject to trait typology)"
setup_proj
cat > "$TMP_PROJ/src/design-system/components/Foo/foo.spec.md" <<EOF
---
traits:
  - hasSizes
---
EOF
run_hook "export const Small = {};" "$TMP_PROJ/src/design-system/components/Foo/foo.anatomy.stories.tsx"
if [ "$EXIT" = "0" ] && [ -z "$STDOUT" ]; then
  echo "  PASS  Test 8 anatomy stories exempted"; PASS=$((PASS+1))
else
  echo "  FAIL  Test 8 (exit=$EXIT, output=${STDOUT:0:200})"
  FAIL=$((FAIL+1)); FAILED="${FAILED}\n  - Test 8"
fi
teardown_proj

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  Results: $PASS PASS, $FAIL FAIL"
echo "════════════════════════════════════════"
if [ "$FAIL" -gt 0 ]; then
  printf "Failed:%b\n" "$FAILED"; exit 1
fi
exit 0
