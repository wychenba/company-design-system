#!/bin/bash
# Tests for check_datatable_invariants.sh — merged 3 sub-rules
#
# 全 sub-rules 都是 P2 stderr-only(exit 0),不阻擋。verify stderr 內容對。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../check_datatable_invariants.sh"
[ -x "$HOOK" ] || { echo "FATAL: hook not executable: $HOOK"; exit 1; }

PASS=0; FAIL=0; FAILED_TESTS=""

run_hook() {
  local file_path="$1" content="$2"
  STDOUT=$(mktemp); STDERR=$(mktemp)
  set +e
  jq -n --arg fp "$file_path" --arg c "$content" \
    '{tool_name:"Write", tool_input:{file_path:$fp, content:$c}}' \
    | bash "$HOOK" >"$STDOUT" 2>"$STDERR"
  EXIT=$?
  set -e
  STDERR_TEXT=$(cat "$STDERR"); rm -f "$STDOUT" "$STDERR"
}

expect_stderr() {
  local name="$1" needle="$2"
  if [ "$EXIT" = "0" ] && echo "$STDERR_TEXT" | grep -qF "$needle"; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected stderr '$needle', exit $EXIT)"
    echo "  --- stderr ---"; echo "$STDERR_TEXT" | sed 's/^/    /'; echo "  --- end ---"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

expect_silent() {
  local name="$1"
  if [ "$EXIT" = "0" ] && [ -z "$STDERR_TEXT" ]; then
    echo "  PASS  $name"; PASS=$((PASS+1))
  else
    echo "  FAIL  $name (expected silent exit 0, exit $EXIT, stderr: ${STDERR_TEXT:0:80})"
    FAIL=$((FAIL+1)); FAILED_TESTS="${FAILED_TESTS}\n  - $name"
  fi
}

echo "=== B.1 row drag getRowId ==="

# 1. enableRowDrag without getRowId → warn
run_hook "/r/src/app/products.tsx" '
<DataTable enableRowDrag onReorder={fn} />
'
expect_stderr "B.1.1 enableRowDrag without getRowId → WARN" "row drag getRowId"

# 2. enableRowDrag + getRowId → silent
run_hook "/r/src/app/products.tsx" '
<DataTable enableRowDrag getRowId={(r) => r.id} onReorder={fn} />
'
expect_silent "B.1.2 enableRowDrag + getRowId → silent"

# 3. DataTable internal — skip
run_hook "/r/packages/design-system/src/components/DataTable/data-table.tsx" '
const x = "enableRowDrag"
'
expect_silent "B.1.3 DataTable internal skip → silent"

echo ""
echo "=== B.2 column size NUMBER → meta.width ==="

# 4. column with root size: NUMBER → warn
run_hook "/r/src/app/orders.tsx" '
const cols = [
  { accessorKey: "name", size: 240 },
]
'
expect_stderr "B.2.1 root size NUMBER → WARN" "column size NUMBER"

# 5. column with meta.width → silent
run_hook "/r/src/app/orders.tsx" '
const cols = [
  { accessorKey: "name", meta: { width: 240, type: "string" } },
]
'
expect_silent "B.2.2 meta.width → silent"

# 6. column with size 'md' (string density) → silent (not NUMBER)
run_hook "/r/src/app/orders.tsx" "
const cols = [
  { accessorKey: 'name', size: 'md' },
]
"
expect_silent "B.2.3 size 'md' string → silent"

# 7. cell-registry skip → silent
run_hook "/r/packages/design-system/src/components/DataTable/cell-registry.tsx" '
const cols = [{ accessorKey: "x", size: 240 }]
'
expect_silent "B.2.4 cell-registry skip → silent"

echo ""
echo "=== B.3 filter↔sort sibling sync ==="

# 8. edit filter panel → reminder
run_hook "/r/packages/design-system/src/components/DataTable/data-table-filter-panel.tsx" '
const x = 1
'
expect_stderr "B.3.1 edit filter → reminder" "data-table-sort-manager"

# 9. edit sort manager → reminder
run_hook "/r/packages/design-system/src/components/DataTable/data-table-sort-manager.tsx" '
const x = 1
'
expect_stderr "B.3.2 edit sort → reminder" "data-table-filter-panel"

# 10. unrelated tsx → silent
run_hook "/r/src/app/foo.tsx" 'const x = 1'
expect_silent "B.3.3 unrelated tsx → silent"

echo ""
echo "═══ Results: $PASS PASS, $FAIL FAIL ═══"
[ "$FAIL" -gt 0 ] && { printf "Failed:%b\n" "$FAILED_TESTS"; exit 1; }
exit 0
