#!/bin/bash
# check_story_invariants.sh — Cluster A merge dispatcher(2026-05-10)
#
# Per codex review red-light + Q-9 (a) inline merge with rule functions:
#   Merges 5 stories.tsx hooks into 1 mega dispatcher with 5 internal rule fn:
#     R1 anatomy(原 lib/check_story_anatomy.sh,PreToolUse Edit|Write|MultiEdit)
#     R2 slot_split(原 lib/check_story_slot_split.sh,Pre)
#     R3 category(原 lib/check_story_category.sh,Pre)
#     R4 title_canonical(原 check_story_title_canonical.sh,Pre)
#     R5 name_jargon(原 lib/check_story_name_jargon.sh,Post — reads disk)
#
# Layer A own 撞 codex Q-9:codex 默認「6 → 1」忽略 event type 異質 —
# compile_drift 是 component tsx + spec.md scope,不適合 merge,留 standalone。
# 實際:5 stories.tsx hooks → 1 dispatcher(file count -4,34 → 30)。
#
# Event branching:
#   - PreToolUse:R1 + R2 + R3 + R4(check incoming new content)
#   - PostToolUse:R5(reads from disk after write)
# settings.json registers same script to both events on Edit|Write|MultiEdit matcher。
#
# Allowlist markers preserved 1-to-1:
#   R1: @anatomy-exempt: / @anatomy-exempt-next
#   R2: @story-split-rationale:
#   R3: @story-trait-rationale:
#   R4: @story-name-canonical-allow:
#   R5(no allowlist,reads disk;jargon catch is broad warning)

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

INPUT=$(cat 2>/dev/null || echo "{}")
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // ""' 2>/dev/null)

# Common filters
case "$TOOL" in Edit|Write|MultiEdit) ;; *) exit 0 ;; esac
case "$FILE_PATH" in *.stories.tsx) ;; *) exit 0 ;; esac

NEW_CONTENT=""
if [ "$EVENT" != "PostToolUse" ]; then
  NEW_CONTENT=$(echo "$INPUT" | jq -r '
    (.tool_input.content // "") + "\n" +
    (.tool_input.new_string // "") + "\n" +
    ([.tool_input.edits[]? | .new_string] | join("\n"))
  ' 2>/dev/null || echo "")
fi

WORST=0
record_worst() { local lvl=$1; [ "$lvl" -gt "$WORST" ] && WORST=$lvl; }

# ─────────────────────────────────────────────────────────────────────────────
# R1 — anatomy(PreToolUse,block raw JSX should consume DS canonical)
# ─────────────────────────────────────────────────────────────────────────────
rule_anatomy() {
  [ "$EVENT" = "PostToolUse" ] && return 0
  [ -z "${NEW_CONTENT//[[:space:]]/}" ] && return 0

  # File-level allowlist
  FIRST_LINES=$(printf '%s\n' "$NEW_CONTENT" | sed -n '1,3p')
  echo "$FIRST_LINES" | grep -qE '//[[:space:]]*@anatomy-exempt:' && return 0
  if [ -f "$FILE_PATH" ]; then
    ON_DISK=$(sed -n '1,3p' "$FILE_PATH" 2>/dev/null || true)
    echo "$ON_DISK" | grep -qE '//[[:space:]]*@anatomy-exempt:' && return 0
  fi

  TMP=$(mktemp); trap "rm -f $TMP" RETURN
  printf '%s\n' "$NEW_CONTENT" > "$TMP"

  local violations=""
  local skip_next=0
  local row=0
  local line
  while IFS= read -r line || [ -n "$line" ]; do
    row=$((row+1))
    if [ "$skip_next" = "1" ]; then skip_next=0; continue; fi
    if echo "$line" | grep -qE '//[[:space:]]*@anatomy-exempt-next|\{/\*[[:space:]]*@anatomy-exempt-next'; then
      skip_next=1; continue
    fi
    # A.1 raw item-anatomy row
    if echo "$line" | grep -qE '<div[^>]*className="[^"]*\bflex\b[^"]*\bitems-center\b[^"]*"[^>]*>[[:space:]]*<[A-Z]'; then
      first_tag=$(echo "$line" | grep -oE '<div[^>]*className="[^"]*\bflex\b[^"]*\bitems-center\b[^"]*"[^>]*>[[:space:]]*<[A-Z][a-zA-Z]*' | grep -oE '<[A-Z][a-zA-Z]*$' | head -1)
      case "$first_tag" in
        "<MenuItem"|"<ItemIcon"|"<ItemAvatar"|"<ItemLabel"|"<ItemSuffix"|"<ItemInlineAction"|"<ItemPrefix"|"<ItemContent"|"<Field"|"<FieldWrapper"|"<Empty"|"<Card"|"<Coachmark"|"<Dialog"|"<Sheet"|"<Popover"|"<HoverCard"|"<DataTable"|"<FileItem") ;;
        *)
          violations="${violations}
[A.1 hand-craft item-anatomy] ${FILE_PATH}:${row}
  > $(echo "$line" | sed 's/^[[:space:]]*//' | cut -c1-120)
  改用 <MenuItem> + slot components" ;;
      esac
    fi
    # A.2 raw <table> outside DataTable dir
    if ! echo "$FILE_PATH" | grep -qE '/DataTable/'; then
      if echo "$line" | grep -qE '<table\b'; then
        violations="${violations}
[A.2 raw <table>] ${FILE_PATH}:${row}
  > $(echo "$line" | sed 's/^[[:space:]]*//' | cut -c1-120)
  改用 <DataTable columns={...} data={...} />"
      fi
    fi
    # A.3 hand-craft full-surface loading
    if echo "$line" | grep -qE '<div[^>]*className="[^"]*\babsolute\b[^"]*\binset-0\b[^"]*\bflex\b'; then
      lookahead=$(sed -n "$((row+1)),$((row+4))p" "$TMP" 2>/dev/null || true)
      if echo "$line $lookahead" | grep -qE '\bCircularProgress\b'; then
        violations="${violations}
[A.3 hand-craft loading] ${FILE_PATH}:${row}
  > $(echo "$line" | sed 's/^[[:space:]]*//' | cut -c1-120)
  改用 <Empty icon={<CircularProgress />} description=\"...\" />"
      fi
    fi
    # A.4 hand-craft field control
    if echo "$line" | grep -qE '<input\b[^>]*className="[^"]*\bh-field-'; then
      violations="${violations}
[A.4 hand-craft field] ${FILE_PATH}:${row}
  > $(echo "$line" | sed 's/^[[:space:]]*//' | cut -c1-120)
  改用 <Input> / <NumberInput> / <Select> / <Combobox>"
    fi
    # B dismiss via label Button
    if echo "$line" | grep -qE '<Button\b[^>]*>[[:space:]]*(關閉|Close|Dismiss|取消|Cancel)[[:space:]]*</Button>'; then
      start=$((row-4)); [ $start -lt 1 ] && start=1
      end=$((row+4))
      ctx=$(sed -n "${start},${end}p" "$TMP" 2>/dev/null || true)
      if echo "$ctx" | grep -qE 'onClose\b|onDismiss\b|<(Dialog|Sheet|Popover|Coachmark|Surface)Header\b|setOpen\(false\)|dismiss'; then
        violations="${violations}
[B dismiss via label] ${FILE_PATH}:${row}
  > $(echo "$line" | sed 's/^[[:space:]]*//' | cut -c1-120)
  改用 iconOnly X Button"
      fi
    fi
    # C hand-crafted overlay
    if echo "$line" | grep -qE '<div[^>]*className="[^"]*\babsolute\b[^"]*(bg-|shadow-|border)'; then
      end=$((row+6))
      lookahead=$(sed -n "${row},${end}p" "$TMP" 2>/dev/null || true)
      if echo "$lookahead" | grep -qE 'onClose\b|onDismiss\b|setOpen\(false\)'; then
        violations="${violations}
[C hand-craft overlay] ${FILE_PATH}:${row}
  > $(echo "$line" | sed 's/^[[:space:]]*//' | cut -c1-120)
  改用 <Popover> / <HoverCard> / <Tooltip> / <Dialog>"
      fi
    fi
  done < "$TMP"

  if [ -n "$violations" ]; then
    {
      echo ""
      echo "╔═══ R1 anatomy — stories hand-craft 違規 ═══"
      printf '%s\n' "$violations"
      echo "豁免:檔首 // @anatomy-exempt: <reason> 整檔 OR // @anatomy-exempt-next 單行"
    } >&2
    record_worst 2
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# R2 — slot_split(PreToolUse,manual story 拆分原則)
# ─────────────────────────────────────────────────────────────────────────────
rule_slot_split() {
  [ "$EVENT" = "PostToolUse" ] && return 0
  case "$FILE_PATH" in *anatomy.stories.tsx|*principles.stories.tsx) return 0 ;; esac

  # Allowlist
  FIRST_LINES=$(printf '%s\n' "$NEW_CONTENT" | sed -n '1,5p')
  echo "$FIRST_LINES" | grep -qE '//[[:space:]]*@story-split-rationale:' && return 0
  if [ -f "$FILE_PATH" ]; then
    DISK=$(sed -n '1,5p' "$FILE_PATH" 2>/dev/null || true)
    echo "$DISK" | grep -qE '//[[:space:]]*@story-split-rationale:' && return 0
  fi

  local violations=""
  local FULL="$NEW_CONTENT"
  HAS_START=$(echo "$FULL" | grep -cE 'export const WithStartIcon\b' || true)
  HAS_END=$(echo "$FULL" | grep -cE 'export const WithEndIcon\b' || true)
  if [ "${HAS_START:-0}" -gt 0 ] && [ "${HAS_END:-0}" -gt 0 ]; then
    violations="${violations}
[反 pattern] WithStartIcon + WithEndIcon 拆兩 story → 合併 WithIcon"
  fi
  HAS_DEFAULT=$(echo "$FULL" | grep -cE 'export const Default\b' || true)
  HAS_ALL_VAR=$(echo "$FULL" | grep -cE 'export const AllVariants\b' || true)
  if [ "${HAS_DEFAULT:-0}" -gt 0 ] && [ "${HAS_ALL_VAR:-0}" -gt 0 ]; then
    violations="${violations}
[反 pattern] Default + AllVariants 同檔 → AllVariants 已 cover default"
  fi
  PRIM=$(echo "$FULL" | grep -cE 'export const (Primary|Secondary|Tertiary)\b' || true)
  if [ "${PRIM:-0}" -ge 2 ]; then
    violations="${violations}
[反 pattern] 多 variant stories 拆細 → 合併 AllVariants 對照 grid"
  fi
  if echo "$FULL" | grep -qE '^export const Variants(\b|:|\s|=)'; then
    violations="${violations}
[命名漂移] Variants → AllVariants"
  fi
  if echo "$FULL" | grep -qE '^export const Basic(\b|:|\s|=)'; then
    violations="${violations}
[命名漂移] Basic → Default"
  fi
  if echo "$FULL" | grep -qE '^export const (DisabledState|DisabledGroup)(\b|:|\s|=)'; then
    violations="${violations}
[命名漂移] DisabledState/Group → Disabled"
  fi
  if echo "$FULL" | grep -qE '^export const SizeVariants(\b|:|\s|=)'; then
    violations="${violations}
[命名漂移] SizeVariants → AllSizes"
  fi
  if echo "$FULL" | grep -qE '^export const [^a-zA-Z_$]'; then
    violations="${violations}
[命名漂移] export const 中文名 → 用 PascalCase 英文,中文寫 \`name: '...'\`"
  fi

  if [ -n "$violations" ]; then
    {
      echo ""
      echo "╔═══ R2 slot_split — manual story 拆分違規 ═══"
      printf '%s\n' "$violations"
      echo "豁免:檔首 // @story-split-rationale: <reason>"
    } >&2
    record_worst 2
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# R3 — category(trait-based check from spec.md frontmatter)
# ─────────────────────────────────────────────────────────────────────────────
rule_category() {
  [ "$EVENT" = "PostToolUse" ] && return 0
  case "$FILE_PATH" in *anatomy.stories.tsx|*principles.stories.tsx) return 0 ;; esac

  # Allowlist — check new content AND disk (align with R4 behavior)
  echo "$NEW_CONTENT" | grep -q "@story-trait-rationale:" && return 0
  if [ -f "$FILE_PATH" ]; then
    DISK_HEAD=$(sed -n '1,5p' "$FILE_PATH" 2>/dev/null || true)
    echo "$DISK_HEAD" | grep -q '@story-trait-rationale:' && return 0
  fi

  COMP_DIR=$(dirname "$FILE_PATH")
  SPEC_FILE=""
  for c in "$COMP_DIR"/*.spec.md; do
    [ -f "$c" ] && SPEC_FILE="$c" && break
  done
  [ -z "$SPEC_FILE" ] && return 0

  TRAITS=""
  if head -30 "$SPEC_FILE" | grep -q "^traits:"; then
    TRAITS=$(awk '/^traits:/{i=1;next} i&&/^  - /{sub(/^  - /,"");print;next} i&&!/^  /{i=0}' "$SPEC_FILE" | tr '\n' ' ')
  fi
  [ -z "$TRAITS" ] && return 0

  EXISTING=""
  [ -f "$FILE_PATH" ] && EXISTING=$(cat "$FILE_PATH" 2>/dev/null || echo "")
  FULL="${EXISTING}
${NEW_CONTENT}"
  EXPORTS=$(echo "$FULL" | grep -oE "^export const [A-Z][a-zA-Z]+" | awk '{print $3}' | sort -u)

  has_present() { echo "$EXPORTS" | grep -qE "^${1}$"; }
  has_contains() { echo "$EXPORTS" | grep -qE "${1}"; }

  local violations=""
  if ! has_present "Default" && ! has_present "AllVariants"; then
    violations="${violations}
  • [P1 warn] missing Default/AllVariants story"
  fi
  for trait in $TRAITS; do
    case "$trait" in
      hasSizes)
        if ! has_present "AllSizes"; then
          if echo "$EXPORTS" | grep -qE "^(Small|Medium|Large|SizeSm|SizeMd|SizeLg)$"; then
            violations="${violations}
  • [P0] hasSizes → per-size split,merge AllSizes"
          else
            violations="${violations}
  • [P0] hasSizes → missing AllSizes"
          fi
        fi ;;
      hasInteractiveStates)
        has_contains "(Disabled|States|Modes)" || violations="${violations}
  • [P0] hasInteractiveStates → missing Disabled/States/Modes" ;;
      isOverlay)
        if ! has_present "OpenSnapshot" && ! echo "$FULL" | grep -qE "(defaultOpen|useState\(true\))"; then
          violations="${violations}
  • [P0] isOverlay → missing OpenSnapshot/defaultOpen"
        fi ;;
      isInputLike)
        has_present "WithError" || has_present "ErrorState" || violations="${violations}
  • [P0] isInputLike → missing WithError" ;;
      isSelectionMulti)
        has_present "VerticalGroup" || has_present "Group" || violations="${violations}
  • [P0] isSelectionMulti → missing VerticalGroup/Group" ;;
    esac
  done

  if [ -n "$violations" ]; then
    if echo "$violations" | grep -q "\[P0\]"; then
      {
        echo ""
        echo "╔═══ R3 category — trait compliance 違規 ═══"
        echo "  Component: $(basename "$COMP_DIR") / Traits: $TRAITS"
        printf '%s' "$violations"
        echo ""
        echo "豁免:檔首 // @story-trait-rationale: <reason>"
      } >&2
      record_worst 2
    else
      echo "⚠️ R3 trait warn:$violations" >&2
    fi
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# R4 — title_canonical(non-canonical English-only `name:` 字段)
# ─────────────────────────────────────────────────────────────────────────────
rule_title_canonical() {
  [ "$EVENT" = "PostToolUse" ] && return 0
  case "$FILE_PATH" in *anatomy.stories.tsx|*principles.stories.tsx) return 0 ;; esac

  # Allowlist
  FIRST_LINES=$(printf '%s\n' "$NEW_CONTENT" | sed -n '1,5p')
  echo "$FIRST_LINES" | grep -q '@story-name-canonical-allow:' && return 0
  if [ -f "$FILE_PATH" ]; then
    DISK=$(sed -n '1,5p' "$FILE_PATH" 2>/dev/null || true)
    echo "$DISK" | grep -q '@story-name-canonical-allow:' && return 0
  fi

  WHITELIST='^(Default|Display|Anatomy|Overview|Inspector|ColorMatrix|SizeMatrix|StateBehavior|Accessibility|All[A-Z][a-z]+|Loading|Empty|Disabled|Error|Hover|Focus|Active|Pressed|FocusVisible)$'
  VIOLATIONS=$(printf '%s' "$NEW_CONTENT" | grep -oE "name:[[:space:]]*['\"][^'\"]*['\"]" | sed -E "s/name:[[:space:]]*['\"]([^'\"]*)['\"]/\1/" | while IFS= read -r name; do
    [ -z "$name" ] && continue
    if echo "$name" | grep -qE '\([a-zA-Z]+\)|=[a-zA-Z]'; then
      echo "  - \"$name\"  [leak: prop/parameter syntax]"; continue
    fi
    if echo "$name" | LC_ALL=C grep -qE '[^\x00-\x7F]'; then continue; fi
    if echo "$name" | grep -qE "$WHITELIST"; then continue; fi
    echo "  - \"$name\"  [pure English]"
  done)

  if [ -n "$VIOLATIONS" ]; then
    {
      echo ""
      echo "╔═══ R4 title_canonical — non-canonical English `name:` ═══"
      echo "[P1 WARN] ${FILE_PATH}"
      printf '%s\n' "$VIOLATIONS"
      echo "豁免:檔首 // @story-name-canonical-allow: <reason>"
    } >&2
    # P1 warn:not block
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# R5 — name_jargon(PostToolUse,reads from disk)
# ─────────────────────────────────────────────────────────────────────────────
rule_name_jargon() {
  [ "$EVENT" != "PostToolUse" ] && return 0
  [ ! -f "$FILE_PATH" ] && return 0

  local violations=""
  LAYER_HITS=$(grep -nE "name:\s*['\"][^'\"]*\bL[0-9]\b" "$FILE_PATH" 2>/dev/null | head -5)
  [ -n "$LAYER_HITS" ] && violations="${violations}
⚠️ story name 含 L<n> layer 代號:
${LAYER_HITS}
  → 改人話描述"

  CANON_HITS=$(grep -nE "name:\s*['\"][^'\"]*\bcanonical\b" "$FILE_PATH" 2>/dev/null | head -5)
  [ -n "$CANON_HITS" ] && violations="${violations}
⚠️ story name 含 'canonical' spec 內部術語:
${CANON_HITS}
  → 移除 canonical 後綴"

  SPEC_HITS=$(grep -nE "name:\s*['\"][^'\"]*\(spec\b" "$FILE_PATH" 2>/dev/null | head -3)
  [ -n "$SPEC_HITS" ] && violations="${violations}
⚠️ story name 引用 spec:
${SPEC_HITS}"

  # R5.5(2026-05-17 升級補 gap):中英夾雜 detection — common-word 應中文化
  # 對齊 story-rules.md「name: 必中文人話」+ M10 proactive scan。
  # Exempt list:framework / brand / DS API value names(中英並列習慣保留英)
  # Python single-file 一次掃整檔(grep regex 對 unicode + word-boundary 在 macOS bash 不穩)
  MIXED_HITS=$(python3 -c "
import re, sys
EXEMPT = re.compile(r'\b(cva|Radix|Polaris|Material|Atlassian|Carbon|Ant|Apple|MUI|TanStack|shadcn|Recharts|cmdk|dnd-kit|TypeScript|JavaScript|API|UI|UX|Jira|Stripe|Notion|Figma|Linear|GitHub|Gmail|Dropbox|Slack|Spotify|Discord|VS Code|Sketch|Storybook|Tailwind|onChange|onClick|ARIA|WCAG|FAQ|HSL|CSS|HTML|DOM|DS|F[1-9]|FAB|RWD|MVP|Token|Mode|Variant|Slot|Size|Field|Input|Button|Avatar|Badge|Chip|Tag|Subtle|Solid|Range|Multiple|Single|primary|secondary|tertiary|hover|focus|active|disabled|invalid|readonly|drag|drop|inline|block|naked|bare|fixed|absolute|sticky|null|true|false)\b', re.I)
COMMON_JARGON = re.compile(r'\b(row|overlay|per-row|tree-table|chrome|offcanvas|flow|tag|tab|panel|sheet|popup)\b', re.I)
with open('$FILE_PATH') as f:
    for lineno, line in enumerate(f, 1):
        m = re.search(r\"name:\s*['\\\"]([^'\\\"]+)['\\\"]\", line)
        if not m: continue
        name = m.group(1)
        if not (re.search(r'[a-zA-Z]', name) and re.search(r'[\u4e00-\u9fff]', name)):
            continue
        stripped = EXEMPT.sub('', name)
        if COMMON_JARGON.search(stripped):
            print(f'{lineno}: {name}')
" 2>/dev/null | head -10)
  [ -n "$MIXED_HITS" ] && violations="${violations}
⚠️ story name 中英夾雜(common-word jargon 應中文化):
${MIXED_HITS}
  → row→列 / overlay→浮層 / per-row→逐列 / tree-table→樹狀表格 / chrome→框架 / offcanvas→抽屜收合 / flow→流程 / tag→標籤"

  if [ -n "$violations" ]; then
    CTX=$(printf 'R5 name jargon:%b' "$violations")
    jq -n --arg ctx "$CTX" '{
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: $ctx }
    }'
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# R6 — description_jargon(PostToolUse,reads disk — scans `description:` block)
# ─────────────────────────────────────────────────────────────────────────────
# 對齊 user 2026-05-11 糾正:CellErrors 描述出現 `Record<rowId:colId, string | string[]>`
# = 純 programmer jargon,不該在 stakeholder-facing story 描述。對齊 mindset #4「範例必
# 真實業務場景」。Scope:只看 `展示` 層的 stories(.stories.tsx),排除 anatomy /
# principles 因為那些是 dev-facing spec stories,props matrix 用 TS 簽名 OK。
rule_description_jargon() {
  [ "$EVENT" != "PostToolUse" ] && return 0
  [ ! -f "$FILE_PATH" ] && return 0
  # Skip anatomy / principles stories(dev-facing)
  case "$FILE_PATH" in
    *.anatomy.stories.tsx|*.principles.stories.tsx) return 0 ;;
  esac

  # Extract `description:` blocks(Storybook docs.description.{component,story})
  # Pattern conservative:catch backtick / quoted string lines after `description:` containing TS generics
  local violations=""

  # TS generic jargon in description string literals
  local TS_GENERIC_HITS=$(awk '
    /description[[:space:]]*:/ { in_desc=1; row=NR; next }
    in_desc && /^[[:space:]]*\}/ { in_desc=0 }
    in_desc && /Record[[:space:]]*</ { print NR": "$0; in_desc=2 }
    in_desc && /Partial[[:space:]]*</ { print NR": "$0; in_desc=2 }
    in_desc && /Promise[[:space:]]*</ { print NR": "$0; in_desc=2 }
    in_desc && /Awaited[[:space:]]*</ { print NR": "$0; in_desc=2 }
    in_desc && /Array[[:space:]]*</ { print NR": "$0; in_desc=2 }
    in_desc && /ReactNode/ { print NR": "$0; in_desc=2 }
    in_desc && /string[[:space:]]*\|[[:space:]]*string\[\]/ { print NR": "$0; in_desc=2 }
    in_desc && /string[[:space:]]*\|[[:space:]]*number/ { print NR": "$0; in_desc=2 }
  ' "$FILE_PATH" 2>/dev/null | head -5)

  [ -n "$TS_GENERIC_HITS" ] && violations="${violations}
⚠️ story description 含 TS generic / type-signature jargon(stakeholder-facing 應人話業務場景):
${TS_GENERIC_HITS}
  → 改寫成業務情境描述,避免 Record<...> / string | string[] / ReactNode 等 API 簽名"

  # Bare prop name in backticks inside description(e.g., \`onSelect\`, \`maxItems\`)
  # 這類 prop ref 在 anatomy story OK,展示 story 該描述「做什麼」不是「prop 叫什麼」
  local PROP_REF_HITS=$(awk '
    /description[[:space:]]*:/ { in_desc=1; next }
    in_desc && /^[[:space:]]*\}/ { in_desc=0 }
    in_desc && /`(on[A-Z]|enable[A-Z]|max[A-Z]|allow[A-Z]|use[A-Z]|set[A-Z])[a-zA-Z]+`/ { print NR": "$0 }
  ' "$FILE_PATH" 2>/dev/null | head -3)

  [ -n "$PROP_REF_HITS" ] && violations="${violations}
⚠️ story description 直接引用 prop 名(不該以 API 字典 思維寫描述):
${PROP_REF_HITS}
  → 改寫成「使用者看到什麼 / 業務情境是什麼」"

  if [ -n "$violations" ]; then
    CTX=$(printf 'R6 description jargon:%b\n豁免:檔首 // @description-jargon-allow: <reason>' "$violations")
    # Check allowlist marker
    if head -3 "$FILE_PATH" | grep -qE '//[[:space:]]*@description-jargon-allow:'; then
      return 0
    fi
    jq -n --arg ctx "$CTX" '{
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: $ctx }
    }'
  fi
}

# ─── Run rules ───
rule_anatomy
rule_slot_split
rule_category
rule_title_canonical
rule_name_jargon
rule_description_jargon

exit $WORST
