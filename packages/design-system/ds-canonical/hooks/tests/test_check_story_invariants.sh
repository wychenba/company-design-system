#!/bin/bash
# Tests for check_story_invariants.sh(Cluster A merge dispatcher,2026-05-10)
#
# Hook 規則:Pre/PostToolUse + Edit|Write|MultiEdit + *.stories.tsx
# 內部 8 rule:
#   R1 anatomy(PreToolUse;raw hand-craft item/table/loading/overlay/dismiss → exit 2)
#   R2 slot_split(PreToolUse;WithStartIcon+WithEndIcon / Default+AllVariants 拆 → exit 2)
#   R3 category(PreToolUse;trait-based — 需 spec.md frontmatter,本 test 不 cover)
#   R4 title_canonical(PreToolUse;non-canonical English name: → P1 stderr warn only)
#   R5 name_jargon(PostToolUse;reads disk;L<n> layer / canonical / 中英夾雜 jargon)
#   R6 description_jargon(PostToolUse;TS generic in description: → stderr warn)
#   R7 story_baseline_reference(PreToolUse;wrap Sidebar/ChromeHeader/DataTable 無 baseline marker → stderr warn)
#   R8 story_archetype_registry(PreToolUse;讀 .claude/references/story-baseline-registry.json;
#      block-severity antiPattern → P0 record_worst 2,2026-06-02 升 P0)
#
# Test 重點:silent skip / 各 rule fire / allowlist marker escape。
# 不測 R3(需 spec.md frontmatter);R8 P0 block-severity 已測(#11 單行 / #12-14 多行回歸防護,2026-06-03)。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_story_invariants.sh"

if [ ! -x "$HOOK" ]; then
  echo "FATAL: hook not executable: $HOOK"
  exit 1
fi

PASS=0
FAIL=0
FAILED_TESTS=""

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

run_hook() {
  local event="$1"; local tool="$2"; local file_path="$3"; local content="$4"
  local payload
  if [ "$tool" = "Edit" ]; then
    payload=$(jq -n \
      --arg ev "$event" --arg tn "$tool" --arg fp "$file_path" --arg c "$content" \
      '{hook_event_name:$ev, tool_name:$tn, tool_input:{file_path:$fp, new_string:$c}}')
  else
    payload=$(jq -n \
      --arg ev "$event" --arg tn "$tool" --arg fp "$file_path" --arg c "$content" \
      '{hook_event_name:$ev, tool_name:$tn, tool_input:{file_path:$fp, content:$c}}')
  fi
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
    echo "  FAIL  $name (expected silent, exit=$EXIT, stderr=$([ -n "$STDERR_TEXT" ] && echo non-empty || echo empty))"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

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

expect_warn() {
  local name="$1"; local needle="$2"
  if [ "$EXIT" = "0" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected stderr warn '$needle', exit=$EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== check_story_invariants tests ==="

# 1. Non-stories file → skip
run_hook "PreToolUse" "Edit" "/foo/button.tsx" "<table>"
expect_pass_silent "1. non-stories.tsx → skip"

# 2. Wrong tool → skip
run_hook "PreToolUse" "Read" "/foo/button.stories.tsx" "<table>"
expect_pass_silent "2. tool=Read → skip"

# 3. R2 slot_split: WithStartIcon + WithEndIcon both → BLOCK exit 2
STORIES_BTN="/foo/my-project/packages/design-system/src/components/Button/button.stories.tsx"
run_hook "PreToolUse" "Write" "$STORIES_BTN" '
export const Default = { args: {} };
export const WithStartIcon = { args: { startIcon: <Icon /> } };
export const WithEndIcon = { args: { endIcon: <Icon /> } };
'
expect_block "3. R2 WithStartIcon + WithEndIcon → BLOCK" "WithStartIcon + WithEndIcon"

# 4. R2 slot_split: allow marker → silent
run_hook "PreToolUse" "Write" "$STORIES_BTN" '// @story-split-rationale: legacy showcase
export const Default = { args: {} };
export const WithStartIcon = { args: { startIcon: <Icon /> } };
export const WithEndIcon = { args: { endIcon: <Icon /> } };
'
expect_pass_silent "4. R2 with @story-split-rationale marker → silent"

# 5. R1 anatomy: raw <table> outside DataTable → BLOCK exit 2
run_hook "PreToolUse" "Write" "$STORIES_BTN" '
export const Default = () => (
  <div>
    <table>
      <tr><td>x</td></tr>
    </table>
  </div>
);
'
expect_block "5. R1 raw <table> outside DataTable → BLOCK" "raw <table>"

# 6. R1 anatomy: allowlist @anatomy-exempt: → silent
run_hook "PreToolUse" "Write" "$STORIES_BTN" '// @anatomy-exempt: legacy demo with raw table
export const Default = () => (
  <div>
    <table>
      <tr><td>x</td></tr>
    </table>
  </div>
);
'
expect_pass_silent "6. R1 @anatomy-exempt marker → silent"

# 7. Clean story (no violations) → silent
# Note: AllVariants alone(no Default)since hook flags `Default + AllVariants` as redundant
STORIES_CLEAN="/foo/my-project/packages/design-system/src/components/Foo/foo.stories.tsx"
run_hook "PreToolUse" "Write" "$STORIES_CLEAN" '
export const AllVariants = { args: {} };
export const Disabled = { args: { disabled: true } };
'
expect_pass_silent "7. clean story (AllVariants + Disabled, no anti-patterns) → silent"

# 8. R5 name_jargon (PostToolUse, reads disk): L<n> layer name → stderr warn
STORIES_DISK="$TMP_DIR/datatable.stories.tsx"
cat > "$STORIES_DISK" <<'EOF'
export const Default = {
  name: 'L1 基本展示',
};
EOF
run_hook "PostToolUse" "Edit" "$STORIES_DISK" "(any update marker)"
# R5 emits 'L<n> layer 代號' warning via stderr-injected context;但實際 hook emit
# 是 jq stdout JSON,我們檢 STDERR 是否含 violation 或 stdout — 兩種任一即算 hit。
# 觀察 source:rule_name_jargon 用 jq -n stdout(不是 stderr)。改檢 STDOUT。
# 重跑 — 拿 stdout
payload=$(jq -n --arg ev "PostToolUse" --arg fp "$STORIES_DISK" \
  '{hook_event_name:$ev, tool_name:"Edit", tool_input:{file_path:$fp, new_string:""}}')
STDOUT_PATH=$(mktemp); STDERR_PATH=$(mktemp)
set +e
printf '%s' "$payload" | bash "$HOOK" >"$STDOUT_PATH" 2>"$STDERR_PATH"
EXIT=$?
set -e
STDOUT_TEXT=$(cat "$STDOUT_PATH")
STDERR_TEXT=$(cat "$STDERR_PATH")
rm -f "$STDOUT_PATH" "$STDERR_PATH"
if [ "$EXIT" = "0" ] && echo "$STDOUT_TEXT" | grep -q "L<n>"; then
  echo "  PASS  8. R5 PostToolUse L<n> layer name → stdout JSON warn"
  PASS=$((PASS+1))
else
  echo "  FAIL  8. R5 PostToolUse L<n> layer name → expected stdout 'L<n>'"
  echo "  --- stdout ---"; echo "$STDOUT_TEXT" | sed 's/^/    /'
  echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'
  FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - 8. R5"
fi

# 9. R4 title_canonical: prop-leak syntax in name → P1 stderr warn (exit 0)
# Use prop/parameter leak pattern `(prop)` which matches `\([a-zA-Z]+\)` branch — robust on macOS BSD grep
# (pure English non-whitelisted depends on `[^\x00-\x7F]` regex semantics which vary)
run_hook "PreToolUse" "Write" "$STORIES_CLEAN" "
export const Default = {
  name: 'Default (size=md)',
};
"
expect_warn "9. R4 prop-leak syntax in name → P1 warn" "R4 title_canonical"

# 10. R7 baseline reference: wrap <Sidebar> without baseline marker → stderr warn
# Use a path NOT in skip list (Sidebar/, DataTable/, etc are skipped self-family)
STORIES_APP="/foo/my-project/packages/design-system/src/components/AppShell/app-shell.stories.tsx"
run_hook "PreToolUse" "Write" "$STORIES_APP" '
export const Default = () => (
  <Sidebar>
    <SidebarHeader><WorkspaceBrand /></SidebarHeader>
  </Sidebar>
);
'
expect_warn "10. R7 wrap <Sidebar> no @story-baseline → stderr warn" "R7 story_baseline_reference"

# 11. R8 archetype registry P0(2026-06-02 升 P0;DS+consumer 零違規確認後升級):
#     wrap <Sidebar> + simplified <SidebarHeader><span> mock(registry block-severity antiPattern)→ BLOCK
#     有 @story-baseline marker(R7 missing-marker 不 fire)→ exit 2 純由 R8 record_worst 2 造成
STORIES_R8="/foo/my-project/packages/design-system/src/components/AppShell/app-shell-r8.stories.tsx"
run_hook "PreToolUse" "Write" "$STORIES_R8" '
// @story-baseline: @qijenchen/design-system/components/Sidebar/sidebar.stories.tsx#IconCollapse
export const Default = () => (
  <Sidebar>
    <SidebarHeader><span>Acme</span></SidebarHeader>
  </Sidebar>
);
'
expect_block "11. R8 simplified-mock <SidebarHeader><span> → P0 BLOCK" "R8 story_archetype_registry"

# 12. R8 MULTI-LINE Sidebar drift(2026-06-03 回歸防護;修前 grep -E line-oriented + \s 當字面 's' → 多行靜默漏 = 假 P0):
#     <SidebarHeader> 與 <span> 分行(真實 JSX 縮排格式)→ 修後(hook tr 換行→空格 + regex [[:space:]])應 BLOCK
run_hook "PreToolUse" "Write" "$STORIES_R8" '
// @story-baseline: @qijenchen/design-system/components/Sidebar/sidebar.stories.tsx#IconCollapse
export const Default = () => (
  <Sidebar>
    <SidebarHeader>
      <span>Acme</span>
    </SidebarHeader>
  </Sidebar>
);
'
expect_block "12. R8 多行 <SidebarHeader> 換行 <span> → P0 BLOCK(回歸防護)" "R8 story_archetype_registry"

# 13. R8 MULTI-LINE ChromeHeader drift:<ChromeHeader> 與 <span flex-1> 分行 → 修後應 BLOCK
#     (修前 [\s\S]*? 在 BSD grep -E 是字元類非「任意字元」+ line-oriented → 雙重漏)
STORIES_CH="/foo/my-project/packages/design-system/src/components/AppShell/app-shell-ch.stories.tsx"
run_hook "PreToolUse" "Write" "$STORIES_CH" '
// @story-baseline: @qijenchen/design-system/components/Sidebar/sidebar.stories.tsx#IconCollapse
export const Default = () => (
  <ChromeHeader>
    <SidebarTrigger />
    <span className="flex-1 text-body-lg">儀表板</span>
  </ChromeHeader>
);
'
expect_block "13. R8 多行 <ChromeHeader> 換行 <span flex-1> → P0 BLOCK" "R8 story_archetype_registry"

# 14. R8 false-positive 防護:正確多行 ChromeHeader(h1 緊鄰、無 flex-1 span)+ 另一 story 遠處(距 >160 字)
#     有無關 flex-1 span → .{0,160} 長度界擋住跨 story 誤匹配(greedy .* boolean 等同 lazy,故必設界)→ NO block
run_hook "PreToolUse" "Write" "$STORIES_CH" '
// @story-baseline: @qijenchen/design-system/components/Sidebar/sidebar.stories.tsx#IconCollapse
export const Correct = () => (
  <ChromeHeader>
    <SidebarTrigger />
    <h1 className="text-body-lg font-medium">儀表板</h1>
  </ChromeHeader>
);
export const Unrelated = () => (
  <div className="grid grid-cols-3 gap-4 rounded-lg border border-border bg-surface p-6 mt-4">
    <div className="text-body-sm text-muted">統計面板區塊內容說明文字</div>
    <span className="flex-1">無關的彈性間距元素</span>
  </div>
);
'
expect_pass_silent "14. R8 正確多行 ChromeHeader + 遠處無關 flex-1(>160 字)→ 不誤判"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
