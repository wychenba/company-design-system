#!/bin/bash
# Tests for check_chrome_header_handcraft.sh
#
# Hook(PreToolUse Edit/Write/MultiEdit):packages/design-system/src/components/**/*.tsx
# 偵測自刻 `h-[var(--chrome-header-height)] ... border-b ... border-divider` signature
# → P1 soft warning stderr,exit 0(不 block)。
# Skip:*.stories.tsx / ChromeHeader / header-canonical / overlay-surface 內部 / `@chrome-header-handcraft-allow:` escape。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../lib/_chrome_header_handcraft.sh"

if [ ! -f "$HOOK" ]; then echo "FATAL: hook not found: $HOOK"; exit 1; fi

PASS=0
FAIL=0
FAILED_TESTS=""

run_hook_write() {
  local file_path="$1"; local content="$2"
  local payload
  payload=$(jq -n --arg fp "$file_path" --arg c "$content" \
    '{tool_name: "Write", tool_input: {file_path: $fp, content: $c}}')
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

run_hook_edit() {
  local file_path="$1"; local new_string="$2"
  local payload
  payload=$(jq -n --arg fp "$file_path" --arg ns "$new_string" \
    '{tool_name: "Edit", tool_input: {file_path: $fp, new_string: $ns}}')
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

expect_pass_silent() {
  local name="$1"
  if [ "$EXIT" = "0" ] && [ -z "$STDERR_TEXT" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected silent, exit=$EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_warn() {
  local name="$1"; local needle="$2"
  # exit 0 + stderr contains needle (P1 soft warn)
  if [ "$EXIT" = "0" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit=0 + stderr needle '$needle', got exit $EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_block() {
  local name="$1"; local needle="$2"
  # exit 2 + stderr contains needle (P0 BLOCKER,2026-06-06 升,跟 item C.4 對稱)
  if [ "$EXIT" = "2" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit=2 + stderr needle '$needle', got exit $EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== check_chrome_header_handcraft tests ==="

# 1. Non-DS path → skip
run_hook_write "/tmp/random.tsx" '<div className="h-[var(--chrome-header-height)] border-b border-divider" />'
expect_pass_silent "1. non-DS path → skip"

# 2. Stories file → skip
run_hook_write "/repo/packages/design-system/src/components/Foo/foo.stories.tsx" '
<div className="h-[var(--chrome-header-height)] border-b border-divider" />
'
expect_pass_silent "2. .stories.tsx → skip"

# 3. ChromeHeader primitive internal → skip
run_hook_write "/repo/packages/design-system/src/components/ChromeHeader/chrome-header.tsx" '
<div className="h-[var(--chrome-header-height)] border-b border-divider" />
'
expect_pass_silent "3. ChromeHeader/ primitive home → skip"

# 4. DS component, no chrome-header signature → silent
run_hook_write "/repo/packages/design-system/src/components/Foo/foo.tsx" '
import { Button } from "./button"
export const Foo = () => <Button>x</Button>
'
expect_pass_silent "4. no handcraft signature → silent"

# 5. DS component with full handcraft signature → warn
run_hook_write "/repo/packages/design-system/src/components/Bar/bar.tsx" '
export const Bar = () => (
  <div className="h-[var(--chrome-header-height)] px-loose border-b border-divider" />
)
'
expect_block "5. handcraft signature → BLOCK" "CHROME HEADER HANDCRAFT"

# 5b. 2026-06-03 回歸防護(同 R8 multiline bug class,對抗稽核抓到):h-[chrome-header-height] 與
#     border-divider 跨多行 className(真實 JSX 格式)→ warn。修前 grep 逐行 + [^"]* 跨屬性 → 多行靜默漏。
run_hook_write "/repo/packages/design-system/src/components/Baz/baz.tsx" '
export const Baz = () => (
  <div className="h-[var(--chrome-header-height)]
    flex items-center px-loose
    border-b border-divider" />
)
'
expect_block "5b. handcraft 多行 className → BLOCK(回歸防護)" "CHROME HEADER HANDCRAFT"

# 6. Escape allowlist → silent
run_hook_write "/repo/packages/design-system/src/components/Bar/bar.tsx" '// @chrome-header-handcraft-allow: tabs cva pattern
export const Bar = () => (
  <div className="h-[var(--chrome-header-height)] px-loose border-b border-divider" />
)
'
expect_pass_silent "6. @chrome-header-handcraft-allow escape → silent"

# 7. Edit (new_string) with handcraft → warn
run_hook_edit "/repo/packages/design-system/src/components/Baz/baz.tsx" \
  '<div className="h-[var(--chrome-header-height)] flex items-center border-b border-divider">'
expect_block "7. Edit new_string with handcraft → BLOCK" "CHROME HEADER HANDCRAFT"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
