#!/bin/bash
# Tests for check_item_list_gap.sh
#
# Drives PreToolUse Edit/Write payloads on stdin and verifies P1 warn vs P2 block
# vs pass for FileItem list wrapper canonical(item-anatomy.spec.md「連續 item
# 貼邊合法性 v2」/ file-item.spec.md「List wrapper canonical」).
#
# Usage: bash test_check_item_list_gap.sh

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_item_list_gap.sh"

if [ ! -x "$HOOK" ]; then
  echo "FATAL: hook not executable: $HOOK"
  exit 1
fi

PASS=0
FAIL=0
FAILED_TESTS=""

run_hook() {
  local file_path="$1"
  local content="$2"
  local payload
  payload=$(jq -n \
    --arg fp "$file_path" \
    --arg c  "$content" \
    '{tool_name: "Write", tool_input: {file_path: $fp, content: $c}}')

  STDOUT=$(mktemp)
  STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDOUT_TEXT=$(cat "$STDOUT")
  STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

expect_pass_clean() {
  local name="$1"
  if [ "$EXIT" = "0" ] && ! echo "$STDERR_TEXT" | grep -q "P1\|P2"; then
    echo "  PASS  $name"
    PASS=$((PASS+1))
  else
    echo "  FAIL  $name (exit=$EXIT, stderr had warning?)"
    echo "$STDERR_TEXT" | sed 's/^/    /'
    FAIL=$((FAIL+1))
    FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_warn_p1() {
  local name="$1"
  if [ "$EXIT" = "0" ] && echo "$STDERR_TEXT" | grep -q "P1 list wrapper 可能缺 gap"; then
    echo "  PASS  $name"
    PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit 0 with P1 warn, got exit=$EXIT)"
    echo "$STDERR_TEXT" | sed 's/^/    /'
    FAIL=$((FAIL+1))
    FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_block_p2() {
  local name="$1"
  if [ "$EXIT" = "2" ] && echo "$STDERR_TEXT" | grep -q "P2 list wrapper 加外框"; then
    echo "  PASS  $name"
    PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit 2 + P2, got exit=$EXIT)"
    echo "$STDERR_TEXT" | sed 's/^/    /'
    FAIL=$((FAIL+1))
    FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

# ── Test 1: list wrapper with gap-2 + FileItem map → pass clean ──────────────
echo "Test 1: flex-col gap-2 + FileItem → pass clean"
read -r -d '' T1 <<'EOF' || true
export const Demo = () => (
  <div className="flex flex-col gap-2">
    {files.map(f => <FileItem key={f.id} file={f} />)}
  </div>
)
EOF
run_hook "/fake/file-item.stories.tsx" "$T1"
expect_pass_clean "Test 1 gap-2 wrapper clean"

# ── Test 2: list wrapper border + overflow-hidden + FileItem → P2 block ──────
echo ""
echo "Test 2: flex-col border overflow-hidden + FileItem → P2 block"
read -r -d '' T2 <<'EOF' || true
export const Demo = () => (
  <div className="flex flex-col border overflow-hidden rounded-lg">
    {files.map(f => <FileItem key={f.id} file={f} />)}
  </div>
)
EOF
run_hook "/fake/file-item.stories.tsx" "$T2"
expect_block_p2 "Test 2 outer-frame wrapper blocked"

# ── Test 3: list wrapper flex-col without gap + FileItem → P1 warn ───────────
echo ""
echo "Test 3: flex-col no gap + FileItem → P1 warn (exit 0)"
read -r -d '' T3 <<'EOF' || true
export const Demo = () => (
  <div className="flex flex-col">
    {files.map(f => <FileItem key={f.id} file={f} />)}
  </div>
)
EOF
run_hook "/fake/file-item.stories.tsx" "$T3"
expect_warn_p1 "Test 3 no-gap wrapper warns"

# ── Test 4: file-level allowlist marker → pass even with violation ───────────
echo ""
echo "Test 4: // @item-gap-exempt: → bypass"
read -r -d '' T4 <<'EOF' || true
// @item-gap-exempt: anatomy story showing flush variant
export const Demo = () => (
  <div className="flex flex-col border overflow-hidden rounded-lg">
    {files.map(f => <FileItem key={f.id} file={f} />)}
  </div>
)
EOF
run_hook "/fake/file-item.stories.tsx" "$T4"
expect_pass_clean "Test 4 allowlist bypasses"

# ── Test 5: non-tsx file → pass (out of scope) ───────────────────────────────
echo ""
echo "Test 5: .md file → pass (out of scope)"
run_hook "/fake/note.md" "<div className=\"flex flex-col border\">{files.map(f => <FileItem />)}</div>"
expect_pass_clean "Test 5 non-tsx out of scope"

# ── Test 6: flex-col gap-2 BUT no FileItem map → pass(其他元件 list 不在 scope)
echo ""
echo "Test 6: flex-col without FileItem → pass (only FileItem MVP scope)"
read -r -d '' T6 <<'EOF' || true
export const Demo = () => (
  <div className="flex flex-col">
    {items.map(i => <MenuItem key={i.id}>{i.label}</MenuItem>)}
  </div>
)
EOF
run_hook "/fake/menu.stories.tsx" "$T6"
expect_pass_clean "Test 6 non-FileItem out of scope"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  Results: $PASS PASS, $FAIL FAIL"
echo "════════════════════════════════════════"
if [ "$FAIL" -gt 0 ]; then
  printf "Failed tests:%b\n" "$FAILED_TESTS"
  exit 1
fi
exit 0
