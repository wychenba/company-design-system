#!/bin/bash
# Tests for check_main_branch_workbench.sh(M28 main-as-workbench BLOCKER)
#
# Hook 規則:PreToolUse Edit/Write/MultiEdit + 目標 file 為 production code
# (`packages/design-system/src/**/*.{tsx,ts,css}` OR `src/app/**` OR `src/explorations/**`)
# + current git branch == main/master + transcript 近 5 user msg 無 branch trigger keyword
# → exit 2 BLOCKER。
# Allow:`CLAUDE_BYPASS_MAIN_WORKBENCH=1` / branch != main / out-of-scope path /
#        trigger keyword(開 branch / 開 分支 / 新 branch / working branch / 在 branch 上做 / on branch)。
#
# 測試手法:`CLAUDE_PROJECT_DIR` 指向 fixture git repo(可控 current branch)。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_main_branch_workbench.sh"

if [ ! -x "$HOOK" ]; then
  echo "FATAL: hook not executable: $HOOK"
  exit 1
fi

TMP_ROOT=$(mktemp -d)
trap 'rm -rf "$TMP_ROOT"' EXIT

# Build fake git repos:one on main, one on feature branch
REPO_MAIN="$TMP_ROOT/repo-main"
REPO_FEAT="$TMP_ROOT/repo-feat"

setup_repo() {
  local dir="$1"; local branch="$2"
  mkdir -p "$dir"
  (
    cd "$dir"
    git init -q -b main 2>/dev/null || { git init -q && git checkout -q -b main; }
    git config user.email test@example.com
    git config user.name test
    echo seed > seed.txt
    git add seed.txt
    git commit -q -m "seed"
    if [ "$branch" != "main" ]; then
      git checkout -q -b "$branch"
    fi
  )
}

setup_repo "$REPO_MAIN" "main"
setup_repo "$REPO_FEAT" "feature-x"

PASS=0
FAIL=0
FAILED_TESTS=""

run_hook() {
  local file_path="$1"; local project_dir="$2"; local transcript="${3:-}"
  local payload
  payload=$(jq -n --arg fp "$file_path" \
    '{tool_name: "Edit", tool_input: {file_path: $fp, new_string: "x"}}')
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  CLAUDE_PROJECT_DIR="$project_dir" CLAUDE_TRANSCRIPT_PATH="$transcript" \
    printf '%s' "$payload" | CLAUDE_PROJECT_DIR="$project_dir" CLAUDE_TRANSCRIPT_PATH="$transcript" \
    bash "$HOOK" >"$STDOUT" 2>"$STDERR"
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

echo "=== check_main_branch_workbench tests ==="

# 1. Non Edit/Write tool → skip (use payload with different tool)
payload=$(jq -n '{tool_name: "Read", tool_input: {file_path: "/repo/packages/design-system/src/foo.tsx"}}')
STDOUT=$(mktemp); STDERR=$(mktemp)
set +e
CLAUDE_PROJECT_DIR="$REPO_MAIN" printf '%s' "$payload" | CLAUDE_PROJECT_DIR="$REPO_MAIN" bash "$HOOK" >"$STDOUT" 2>"$STDERR"
EXIT=$?
set -e
STDERR_TEXT=$(cat "$STDERR")
rm -f "$STDOUT" "$STDERR"
expect_pass_silent "1. non Edit/Write tool → skip"

# 2. Out-of-scope path (random file) → skip
run_hook "/repo/.claude/foo.md" "$REPO_MAIN"
expect_pass_silent "2. out-of-scope path (.claude/) → skip"

# 3. Production code path + branch=feature-x → skip
run_hook "/repo/packages/design-system/src/components/Foo/foo.tsx" "$REPO_FEAT"
expect_pass_silent "3. on feature branch → skip"

# 4. Production code path + branch=main + no trigger transcript → BLOCKER
run_hook "/repo/packages/design-system/src/components/Foo/foo.tsx" "$REPO_MAIN"
expect_blocker "4. main + production code + no trigger → BLOCKER" "MAIN-AS-WORKBENCH BLOCKER"

# 5. CLAUDE_BYPASS_MAIN_WORKBENCH=1 escape → skip
payload=$(jq -n '{tool_name: "Edit", tool_input: {file_path: "/repo/packages/design-system/src/components/Foo/foo.tsx", new_string: "x"}}')
STDOUT=$(mktemp); STDERR=$(mktemp)
set +e
printf '%s' "$payload" | CLAUDE_PROJECT_DIR="$REPO_MAIN" CLAUDE_BYPASS_MAIN_WORKBENCH=1 bash "$HOOK" >"$STDOUT" 2>"$STDERR"
EXIT=$?
set -e
STDERR_TEXT=$(cat "$STDERR")
rm -f "$STDOUT" "$STDERR"
expect_pass_silent "5. CLAUDE_BYPASS_MAIN_WORKBENCH=1 → skip"

# 6. Transcript with branch trigger keyword → skip
TRANSCRIPT="$TMP_ROOT/transcript.jsonl"
cat >"$TRANSCRIPT" <<'EOF'
{"role":"user","content":"我們開 working branch 來做這個 batch"}
{"role":"assistant","content":"OK"}
EOF
run_hook "/repo/packages/design-system/src/components/Foo/foo.tsx" "$REPO_MAIN" "$TRANSCRIPT"
expect_pass_silent "6. transcript has 'working branch' trigger → skip"

# 7. src/app/** also intercepted on main → BLOCKER
run_hook "/repo/src/app/page.tsx" "$REPO_MAIN"
expect_blocker "7. src/app/ on main → BLOCKER" "MAIN-AS-WORKBENCH BLOCKER"

echo ""
echo "=== Summary ==="
echo "Passed: $PASS / $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed:$FAILED_TESTS"
  exit 1
fi
