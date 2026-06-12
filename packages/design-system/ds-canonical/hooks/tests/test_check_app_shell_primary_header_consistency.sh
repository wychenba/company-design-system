#!/bin/bash
# Tests for check_app_shell_primary_header_consistency.sh
#
# Hook(PreToolUse Edit/Write):偵測 AppShell consumer 2 violations:
#   V1 layout="primary-header" 缺 globalHeader prop
#   V2 layout="primary-header" + 同 file 含 <SidebarHeader>
#
# Hook 透過 stdin 讀 tool_input(INPUT=$(cat) + jq;2026-05-31 改 env→stdin 對齊 sibling helper + 讓 dispatcher 能呼叫)
# 且需 TARGET file 真實存在於 disk(`[[ ! -f "$TARGET" ]] && exit 0`)。
# 排除:.spec.md / *test* / app-shell.tsx 自身 / `@app-shell-primary-header-allow:` escape。
# Violation 時 stderr「🚨 AppShell primary-header consistency violation」+ exit 2。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../lib/_app_shell_primary_header_consistency.sh"
TMPDIR_TEST=$(mktemp -d)
trap 'rm -rf "$TMPDIR_TEST"' EXIT

if [ ! -x "$HOOK" ]; then chmod +x "$HOOK" 2>/dev/null || true; fi
if [ ! -f "$HOOK" ]; then echo "FATAL: hook not found: $HOOK"; exit 1; fi

PASS=0
FAIL=0
FAILED_TESTS=""

# Helper: write file to test temp dir, run hook with that path
run_hook_on_file() {
  local rel="$1"; local content="$2"
  local fp="$TMPDIR_TEST/$rel"
  mkdir -p "$(dirname "$fp")"
  printf '%s' "$content" > "$fp"
  local payload
  payload=$(jq -n --arg fp "$fp" --arg tn "Edit" \
    '{tool_name: $tn, tool_input: {file_path: $fp, new_string: ""}}')
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  printf '%s' "$payload" | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDERR_TEXT=$(cat "$STDERR")
  rm -f "$STDOUT" "$STDERR"
}

# Helper: run with arbitrary path (non-existent) for skip tests
run_hook_no_file() {
  local fp="$1"; local tool="${2:-Edit}"
  local payload
  payload=$(jq -n --arg fp "$fp" --arg tn "$tool" \
    '{tool_name: $tn, tool_input: {file_path: $fp, new_string: ""}}')
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
    echo "  FAIL  $name (expected silent, exit=$EXIT, stderr non-empty=$([ -n "$STDERR_TEXT" ] && echo yes))"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_block() {
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "2" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected exit=2 + needle '$needle', got exit $EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== check_app_shell_primary_header_consistency tests ==="

# 1. Non-tsx file → skip
run_hook_no_file "$TMPDIR_TEST/foo.md" "Edit"
expect_pass_silent "1. non-tsx file → skip"

# 2. Non-Edit/Write tool → skip
run_hook_no_file "$TMPDIR_TEST/foo.tsx" "Read"
expect_pass_silent "2. Read tool → skip"

# 3. layout="primary-header" with globalHeader + no SidebarHeader → silent (compliant)
run_hook_on_file "src/app.tsx" '
<AppShell layout="primary-header" globalHeader={<GlobalHeader />}>
  <Sidebar />
</AppShell>
'
expect_pass_silent "3. primary-header + globalHeader + no SidebarHeader → silent"

# 4. layout="primary-header" missing globalHeader → block (V1)
run_hook_on_file "src/missing-gh.tsx" '
<AppShell layout="primary-header">
  <Sidebar />
</AppShell>
'
expect_block "4. V1 missing globalHeader → block" "V1 缺 globalHeader prop"

# 5. layout="primary-header" + <SidebarHeader> with globalHeader → V2 only block
run_hook_on_file "src/dup-header.tsx" '
<AppShell layout="primary-header" globalHeader={<GH />}>
  <Sidebar>
    <SidebarHeader>brand</SidebarHeader>
  </Sidebar>
</AppShell>
'
expect_block "5. V2 SidebarHeader duplicate → block" "V2 Sidebar 內含 SidebarHeader"

# 6. Escape allowlist → silent
run_hook_on_file "src/escape.tsx" '// @app-shell-primary-header-allow: legacy migration in progress
<AppShell layout="primary-header">
  <SidebarHeader>brand</SidebarHeader>
</AppShell>
'
expect_pass_silent "6. escape allowlist → silent"

# 7. No primary-header layout at all → skip
run_hook_on_file "src/other.tsx" '
<AppShell layout="primary-sidebar">
  <Sidebar />
</AppShell>
'
expect_pass_silent "7. layout != primary-header → skip"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
