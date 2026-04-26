#!/bin/bash
# PreToolUse hook: block Edit/Write on *.stories.tsx when story code hand-crafts
# raw JSX that should consume a DS canonical (MenuItem / DataTable / Empty / Input /
# Popover / HoverCard / Dialog etc).
#
# Motivation (CLAUDE.md「Story」+「建立 UI 前必讀」):
#   stories = code. DS rules apply equally. Hand-craft in stories teaches consumers
#   wrong patterns and breaks the DS training signal. Prior audits caught:
#     - story's raw `<div className="flex items-center"><Icon/><span/><Button/>`
#       instead of `<MenuItem>` + slot components
#     - dismiss via `<Button>Close</Button>` instead of iconOnly X
#     - self-crafted `<div absolute inset-0 flex>` overlay instead of Popover/Dialog
#   Existing hooks gate component .tsx only; this fills that gap.
#
# Allowlist markers (first-line file-level or per-line):
#   // @anatomy-exempt: <reason>          → bypass entire file
#   // @anatomy-exempt-next                → bypass the single following line
#
# Exit codes (Claude Code hook protocol):
#   exit 0 — pass, no output
#   exit 2 + stderr — block, AI must fix before retry

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Only gate Edit / Write / MultiEdit
case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

# Only gate *.stories.tsx files
case "$FILE_PATH" in
  *.stories.tsx) ;;
  *) exit 0 ;;
esac

# Build the content to check:
#   - Write: tool_input.content
#   - Edit / MultiEdit: tool_input.new_string (single) or tool_input.edits[].new_string
# We check the incoming content rather than the existing file, so the hook sees
# what the AI is actively writing (pre-edit).
NEW_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

# If nothing to check, pass (defensive).
if [ -z "${NEW_CONTENT//[[:space:]]/}" ]; then
  exit 0
fi

# ── File-level allowlist: first non-empty line contains `// @anatomy-exempt:` ──
# Also accept it appearing on any of the first 3 lines (some files have a shebang
# or top-level comment pattern).
FIRST_LINES=$(printf '%s\n' "$NEW_CONTENT" | sed -n '1,3p')
if echo "$FIRST_LINES" | grep -qE '//[[:space:]]*@anatomy-exempt:'; then
  exit 0
fi
# Also honor existing-file marker (edit case): if the on-disk file carries the
# marker, bypass too — so adding content to a pre-exempted file still passes.
if [ -f "$FILE_PATH" ]; then
  ON_DISK_FIRST=$(sed -n '1,3p' "$FILE_PATH" 2>/dev/null || true)
  if echo "$ON_DISK_FIRST" | grep -qE '//[[:space:]]*@anatomy-exempt:'; then
    exit 0
  fi
fi

# ── Build line array, honoring // @anatomy-exempt-next (skip next line) ──────
# Write the new content to a tempfile for line-by-line scan with line numbers
# that reflect the logical position within the edit payload.
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
printf '%s\n' "$NEW_CONTENT" > "$TMP"

VIOLATIONS=""
SKIP_NEXT=0

add_violation() {
  local rule="$1"
  local lineno="$2"
  local snippet="$3"
  local fix="$4"
  VIOLATIONS="${VIOLATIONS}
────────────────────────────────
[${rule}] ${FILE_PATH}:${lineno}
  > ${snippet}
  修法: ${fix}"
}

# Read file line by line preserving blanks.
# NOTE: we name our counter ROW (not LINENO) — bash's $LINENO is a special
# read-only counter for the current script position and cannot be assigned.
ROW=0
while IFS= read -r LINE || [ -n "$LINE" ]; do
  ROW=$((ROW+1))

  # Per-line bypass: previous line had @anatomy-exempt-next
  if [ "$SKIP_NEXT" = "1" ]; then
    SKIP_NEXT=0
    continue
  fi
  # Detect bypass-next marker (applies to the NEXT line, not this one)
  if echo "$LINE" | grep -qE '//[[:space:]]*@anatomy-exempt-next|\{/\*[[:space:]]*@anatomy-exempt-next'; then
    SKIP_NEXT=1
    continue
  fi

  # ── Rule A.1: raw item-anatomy row (prefix icon + content) ─────────────────
  # Match `<div ... flex ... items-center ...>` followed by a capitalized JSX
  # child opener that is plausibly an icon/avatar (not a compound component).
  # Conservative: require `<div ... flex ... items-center ...>` + immediately
  # followed (same line) by `<Capitalized`, where `Capitalized` is NOT one of
  # the known DS primitives we explicitly allow inside such a row (MenuItem,
  # ItemIcon, ItemAvatar, ItemLabel, ItemSuffix, etc).
  if echo "$LINE" | grep -qE '<div[^>]*className="[^"]*\bflex\b[^"]*\bitems-center\b[^"]*"[^>]*>[[:space:]]*<[A-Z]'; then
    # Exclusion: if the first child tag is a DS primitive we explicitly endorse
    # for this slot layout, skip. Extract the first `<Capitalized` token.
    FIRST_TAG=$(echo "$LINE" | grep -oE '<div[^>]*className="[^"]*\bflex\b[^"]*\bitems-center\b[^"]*"[^>]*>[[:space:]]*<[A-Z][a-zA-Z]*' | grep -oE '<[A-Z][a-zA-Z]*$' | head -1)
    case "$FIRST_TAG" in
      "<MenuItem"|"<ItemIcon"|"<ItemAvatar"|"<ItemLabel"|"<ItemSuffix"|"<ItemInlineAction"|"<ItemPrefix"|"<ItemContent"|"<Field"|"<FieldWrapper"|"<Empty"|"<Card"|"<Coachmark"|"<Dialog"|"<Sheet"|"<Popover"|"<HoverCard"|"<DataTable"|"<FileItem")
        : # ok — the row is hosted by a DS primitive
        ;;
      *)
        add_violation "A.1 hand-craft item-anatomy row" "$ROW" \
          "$(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)" \
          "改用 <MenuItem> + slot components (<ItemIcon> / <ItemAvatar> / <ItemLabel> / <ItemSuffix> / <ItemInlineAction>)。SSOT: src/design-system/patterns/element-anatomy/item-anatomy.spec.md"
        ;;
    esac
  fi

  # ── Rule A.2: raw <table> (DataTable territory) ─────────────────────────────
  # Storybook 範例有時會真的教 <table> 用法,但 DS stories 本體不該自刻。
  # 例外 heuristic:該檔是 DataTable 本身的 story(含 DataTable) → 豁免(靠檔名)
  if ! echo "$FILE_PATH" | grep -qE '/DataTable/'; then
    if echo "$LINE" | grep -qE '<table\b'; then
      add_violation "A.2 raw <table>" "$ROW" \
        "$(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)" \
        "改用 <DataTable columns={...} data={...} />。SSOT: src/design-system/components/DataTable/data-table.spec.md"
    fi
  fi

  # ── Rule A.3: full-surface loading 手刻 ─────────────────────────────────────
  # Pattern: <div className="... absolute ... inset-0 ... flex ..."> ... CircularProgress
  # CircularProgress 可能跨行,往後看 4 行
  if echo "$LINE" | grep -qE '<div[^>]*className="[^"]*\babsolute\b[^"]*\binset-0\b[^"]*\bflex\b'; then
    LOOKAHEAD=$(sed -n "$((ROW+1)),$((ROW+4))p" "$TMP" 2>/dev/null || true)
    if echo "$LINE $LOOKAHEAD" | grep -qE '\bCircularProgress\b'; then
      add_violation "A.3 hand-craft full-surface loading" "$ROW" \
        "$(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)" \
        "改用 <Empty icon={<CircularProgress />} description=\"...\" />。SSOT: src/design-system/components/Empty/empty.spec.md"
    fi
  fi

  # ── Rule A.4: hand-crafted field control ────────────────────────────────────
  # Pattern: <input ... className="... h-field-...">  (繞過 Input / NumberInput etc)
  if echo "$LINE" | grep -qE '<input\b[^>]*className="[^"]*\bh-field-'; then
    add_violation "A.4 hand-craft field control" "$ROW" \
      "$(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)" \
      "改用 <Input> / <NumberInput> / <Select> / <Combobox> (視資料型別)。SSOT: src/design-system/components/Field/field-controls.spec.md"
  fi

  # ── Rule B: dismiss via label Button ────────────────────────────────────────
  # Match <Button ...>關閉</Button> / <Button>Close</Button> etc, when the
  # surrounding context implies dismiss role.
  if echo "$LINE" | grep -qE '<Button\b[^>]*>[[:space:]]*(關閉|Close|Dismiss|取消|Cancel)[[:space:]]*</Button>'; then
    START=$((ROW-4)); [ $START -lt 1 ] && START=1
    END=$((ROW+4))
    CONTEXT=$(sed -n "${START},${END}p" "$TMP" 2>/dev/null || true)
    if echo "$CONTEXT" | grep -qE 'onClose\b|onDismiss\b|<(Dialog|Sheet|Popover|Coachmark|Surface)Header\b|setOpen\(false\)|dismiss'; then
      add_violation "B dismiss via label Button" "$ROW" \
        "$(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)" \
        "dismiss(關閉 overlay)應用 iconOnly X Button(<Button variant=\"ghost\" iconOnly icon={X} onClick={onClose} aria-label=\"關閉\" />),不用文字 label。action cancel(取消一次動作)才用文字 Button,若此處確是 action cancel,加 // @anatomy-exempt-next 到此行上一行。SSOT: CLAUDE.md 常用 icon canonical + overlay-surface pattern"
    fi
  fi

  # ── Rule C: hand-crafted overlay structure ──────────────────────────────────
  # Pattern: <div className="... absolute ... (bg-|shadow-|border)..."> with a
  # nearby onClose handler (dismiss behavior = overlay territory).
  if echo "$LINE" | grep -qE '<div[^>]*className="[^"]*\babsolute\b[^"]*(bg-|shadow-|border)'; then
    END=$((ROW+6))
    LOOKAHEAD=$(sed -n "${ROW},${END}p" "$TMP" 2>/dev/null || true)
    if echo "$LOOKAHEAD" | grep -qE 'onClose\b|onDismiss\b|setOpen\(false\)'; then
      add_violation "C hand-craft overlay" "$ROW" \
        "$(echo "$LINE" | sed 's/^[[:space:]]*//' | cut -c1-120)" \
        "改用 <Popover> / <HoverCard> / <Tooltip> / <Dialog> (視語義)。SSOT: src/design-system/patterns/overlay-surface/overlay-surface.spec.md"
    fi
  fi

done < "$TMP"

# ── Emit block if any violation ──────────────────────────────────────────────
if [ -n "$VIOLATIONS" ]; then
  {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════"
    echo "║ check_story_anatomy — stories 裡 hand-craft 違規"
    echo "╚════════════════════════════════════════════════════════════════"
    echo ""
    echo "stories = code (CLAUDE.md #Story)。hand-craft 繞過 DS canonical 會"
    echo "教壞 consumer,也污染 DS 的訓練資料。偵測到以下違規:"
    printf '%s\n' "$VIOLATIONS"
    echo ""
    echo "────────────────────────────────"
    echo "修法 3 擇 1:"
    echo "  1. 改用上方指示的 DS 元件 (首選)"
    echo "  2. 若本 story 刻意教「raw primitive」用法(例:Internal 元件的 anatomy"
    echo "     教學),檔首加 // @anatomy-exempt: <reason>"
    echo "  3. 若僅某一行屬合理例外,加 // @anatomy-exempt-next 到該行前"
    echo ""
    echo "參考:.claude/rules/ui-development.md「建立 UI 前必讀」自我檢查腳本段"
    echo "      src/design-system/patterns/element-anatomy/item-anatomy.spec.md"
  } >&2
  exit 2
fi

exit 0
