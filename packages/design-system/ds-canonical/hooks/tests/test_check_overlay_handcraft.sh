#!/bin/bash
# Tests for check_overlay_handcraft.sh
# Focus: Check 6(2026-05-01)— overlay body 重新引入 stripped-padding boolean variant 攔阻
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../lib/_overlay_handcraft.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable"; exit 1; }
PASS=0; FAIL=0

setup() { TMP=$(mktemp -d); mkdir -p "$TMP/.claude/hooks"; echo 'log_hook_fire(){ :; }' > "$TMP/.claude/hooks/_log-fire.sh"; }
teardown() { rm -rf "$TMP"; }

run() {
  local fp="$1"
  STDOUT=$(echo "{\"tool_input\":{\"file_path\":\"$fp\"}}" | bash "$HOOK" 2>&1)
  EXIT=$?
}

# Test 1: out-of-scope file(non-overlay path)→ silent
echo "Test 1: out-of-scope path → silent for Check 6"
setup
mkdir -p "$TMP/packages/design-system/src/components/Button"
cat > "$TMP/packages/design-system/src/components/Button/button.tsx" <<'EOF'
interface ButtonProps { flush?: boolean }
EOF
run "$TMP/packages/design-system/src/components/Button/button.tsx"
echo "$STDOUT" | grep -q "stripped-padding boolean variant" && { echo "  FAIL: false positive on Button"; FAIL=$((FAIL+1)); } || { echo "  PASS"; PASS=$((PASS+1)); }
teardown

# Test 2: DialogBody re-introducing flush?: boolean → flagged
echo "Test 2: DialogBody flush?: boolean → flagged"
setup
mkdir -p "$TMP/packages/design-system/src/components/Dialog"
cat > "$TMP/packages/design-system/src/components/Dialog/dialog.tsx" <<'EOF'
interface DialogBodyProps {
  flush?: boolean
}
EOF
run "$TMP/packages/design-system/src/components/Dialog/dialog.tsx"
echo "$STDOUT" | grep -q "stripped-padding boolean variant" && { echo "  PASS"; PASS=$((PASS+1)); } || { echo "  FAIL: $STDOUT"; FAIL=$((FAIL+1)); }
teardown

# Test 3: SheetBody flush = false destructure default → flagged
echo "Test 3: SheetBody flush = false destructure → flagged"
setup
mkdir -p "$TMP/packages/design-system/src/components/Sheet"
cat > "$TMP/packages/design-system/src/components/Sheet/sheet.tsx" <<'EOF'
const SheetBody = ({ flush = false }) => null
interface X { flush?: boolean }
EOF
run "$TMP/packages/design-system/src/components/Sheet/sheet.tsx"
echo "$STDOUT" | grep -q "stripped-padding boolean variant" && { echo "  PASS"; PASS=$((PASS+1)); } || { echo "  FAIL: $STDOUT"; FAIL=$((FAIL+1)); }
teardown

# Test 4: PopoverBody naked?: boolean(equivalent rename)→ flagged
echo "Test 4: PopoverBody naked?: boolean → flagged"
setup
mkdir -p "$TMP/packages/design-system/src/components/Popover"
cat > "$TMP/packages/design-system/src/components/Popover/popover.tsx" <<'EOF'
interface PopoverBodyProps { naked?: boolean }
EOF
run "$TMP/packages/design-system/src/components/Popover/popover.tsx"
echo "$STDOUT" | grep -q "stripped-padding boolean variant" && { echo "  PASS"; PASS=$((PASS+1)); } || { echo "  FAIL: $STDOUT"; FAIL=$((FAIL+1)); }
teardown

# Test 5: bare?: boolean(equivalent rename)→ flagged
echo "Test 5: DialogBody bare?: boolean → flagged"
setup
mkdir -p "$TMP/packages/design-system/src/components/Dialog"
cat > "$TMP/packages/design-system/src/components/Dialog/dialog.tsx" <<'EOF'
interface Y { bare?: boolean }
EOF
run "$TMP/packages/design-system/src/components/Dialog/dialog.tsx"
echo "$STDOUT" | grep -q "stripped-padding boolean variant" && { echo "  PASS"; PASS=$((PASS+1)); } || { echo "  FAIL: $STDOUT"; FAIL=$((FAIL+1)); }
teardown

# Test 6: noPadding?: boolean(equivalent rename)→ flagged
echo "Test 6: SheetBody noPadding?: boolean → flagged"
setup
mkdir -p "$TMP/packages/design-system/src/components/Sheet"
cat > "$TMP/packages/design-system/src/components/Sheet/sheet.tsx" <<'EOF'
interface Z { noPadding?: boolean }
EOF
run "$TMP/packages/design-system/src/components/Sheet/sheet.tsx"
echo "$STDOUT" | grep -q "stripped-padding boolean variant" && { echo "  PASS"; PASS=$((PASS+1)); } || { echo "  FAIL: $STDOUT"; FAIL=$((FAIL+1)); }
teardown

# Test 7: stories.tsx 內出現 flush?: boolean → silent(stories scope skip)
echo "Test 7: stories.tsx flush?: boolean → skipped(out-of-scope)"
setup
mkdir -p "$TMP/packages/design-system/src/components/Dialog"
cat > "$TMP/packages/design-system/src/components/Dialog/dialog.stories.tsx" <<'EOF'
interface ExampleProps { flush?: boolean }
EOF
run "$TMP/packages/design-system/src/components/Dialog/dialog.stories.tsx"
echo "$STDOUT" | grep -q "stripped-padding boolean variant" && { echo "  FAIL: false positive on stories"; FAIL=$((FAIL+1)); } || { echo "  PASS"; PASS=$((PASS+1)); }
teardown

# Test 8: allowlist comment escape hatch → silent
echo "Test 8: allowlist escape hatch → silent"
setup
mkdir -p "$TMP/packages/design-system/src/components/Dialog"
cat > "$TMP/packages/design-system/src/components/Dialog/dialog.tsx" <<'EOF'
// overlay-body-stripped-variant-allow: 已對照 Polaris/Material/X 三家,multi-row 已驗證 hold
interface DialogBodyProps { flush?: boolean }
EOF
run "$TMP/packages/design-system/src/components/Dialog/dialog.tsx"
echo "$STDOUT" | grep -q "stripped-padding boolean variant" && { echo "  FAIL: allowlist not honored"; FAIL=$((FAIL+1)); } || { echo "  PASS"; PASS=$((PASS+1)); }
teardown

# Test 9: clean DialogBody(post-2026-05-01 canonical)→ silent
echo "Test 9: clean DialogBody(no flush variant)→ silent"
setup
mkdir -p "$TMP/packages/design-system/src/components/Dialog"
cat > "$TMP/packages/design-system/src/components/Dialog/dialog.tsx" <<'EOF'
const DialogBody = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof ScrollArea>>(
  ({ className, children, ...props }, ref) => null
)
EOF
run "$TMP/packages/design-system/src/components/Dialog/dialog.tsx"
echo "$STDOUT" | grep -q "stripped-padding boolean variant" && { echo "  FAIL: false positive on clean canonical"; FAIL=$((FAIL+1)); } || { echo "  PASS"; PASS=$((PASS+1)); }
teardown

echo ""
echo "Summary: $PASS passed / $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
