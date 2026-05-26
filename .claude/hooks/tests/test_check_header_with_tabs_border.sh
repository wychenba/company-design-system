#!/bin/bash
# Tests for check_header_with_tabs_border.sh(header-canonical W1 BLOCKER)
#
# Hook 規則:PreToolUse Edit/Write/MultiEdit + file 為 `packages/design-system/src/**/*.tsx`(非 stories)→
#   讀 disk content + tool_input.new_string/content 合 FULL_CONTENT;
#   含 `<XxxHeader>` + `<Tabs|TabsList|TabsTrigger>` JSX 但 `withTabs` 出現 0 次 → exit 2 BLOCKER。
#   header > withTabs(但 ≥ 1)→ soft warn exit 0。
# Allow:FULL_CONTENT 含 `@header-withtabs-allow:` → 整檔豁免。
# Skip:stories.tsx / anatomy.stories.tsx / principles.stories.tsx。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../lib/_header_with_tabs_border.sh"

if [ ! -x "$HOOK" ]; then
  echo "FATAL: hook not executable: $HOOK"
  exit 1
fi

PASS=0
FAIL=0
FAILED_TESTS=""

run_hook() {
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

expect_blocker() {
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "2" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit 2 + '$needle', got exit $EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_warn_silent_exit0() {
  # exit 0 but stderr contains needle (soft warn)
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "0" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit 0 + warn '$needle', got exit $EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== check_header_with_tabs_border tests ==="

# 1. Out-of-scope path (random tsx) → skip
run_hook "/repo/src/foo.tsx" '<ChromeHeader/><Tabs/>'
expect_pass_silent "1. out-of-scope path → skip"

# 2. Story file → skip
run_hook "/repo/packages/design-system/src/components/Foo/foo.stories.tsx" '<ChromeHeader/><Tabs/>'
expect_pass_silent "2. .stories.tsx → skip"

# 3. In-scope but no header → skip
run_hook "/repo/packages/design-system/src/components/Foo/foo.tsx" '<button/>'
expect_pass_silent "3. no header JSX → skip"

# 4. In-scope header but no Tabs → skip
run_hook "/repo/packages/design-system/src/components/Foo/foo.tsx" '<ChromeHeader/>'
expect_pass_silent "4. header but no Tabs → skip"

# 5. In-scope header + Tabs + withTabs prop → silent
run_hook "/repo/packages/design-system/src/components/Foo/foo.tsx" '<ChromeHeader withTabs><TabsList ></TabsList></ChromeHeader>'
expect_pass_silent "5. header + Tabs + withTabs → silent"

# 6. In-scope header + Tabs WITHOUT withTabs → BLOCKER exit 2
run_hook "/repo/packages/design-system/src/components/Foo/foo.tsx" '<ChromeHeader><TabsList ></TabsList></ChromeHeader>'
expect_blocker "6. header + Tabs missing withTabs → BLOCKER" "HEADER + TABS WITHTABS BLOCKER"

# 7. With allow escape → silent
run_hook "/repo/packages/design-system/src/components/Foo/foo.tsx" '// @header-withtabs-allow: special case
<ChromeHeader><TabsList ></TabsList></ChromeHeader>'
expect_pass_silent "7. @header-withtabs-allow → silent"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
