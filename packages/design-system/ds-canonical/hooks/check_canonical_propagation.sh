#!/bin/bash
# Canonical propagation unified hook(2026-05-08 cluster E consolidation)
#
# Merges 3 PreToolUse hooks(原各檔已 retire,合併入此):
#   E.1 principles canonical(原 check_principles_canonical,P0 BLOCK new file / P1 warn existing)
#   E.2 L3 primitive import(原 check_l3_primitive_import,P0 BLOCK)
#   E.3 spec-impl default alignment(原 check_spec_impl_default_alignment,P1 stderr)
#
# Why merge:皆 canonical SSOT propagation invariant — principles structure / L3 layer 邊界 /
# spec→impl 一致性,共用 INPUT parsing 模式。散裝是 M17 + Anthropic ≤ 15 hook 偏離。
#
# File scope per rule:
#   E.1: *.principles.stories.tsx
#   E.2: *.ts / *.tsx outside packages/design-system/src/{components,patterns,tokens,hooks}
#   E.3: *.spec.md
#
# Allowlist tags:
#   E.1: `// @principles-rationale: <reason>`
#   E.2: 檔頭 5 行 `// @l3-import-allow: <reason>`
#   E.3: 檔頭 5 行 `// @spec-impl-allow: <reason>`

source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

NEW_CONTENT=$(echo "$INPUT" | jq -r '
  (.tool_input.content // "") + "\n" +
  (.tool_input.new_string // "") + "\n" +
  ([.tool_input.edits[]? | .new_string] | join("\n"))
' 2>/dev/null || echo "")

[ -z "${NEW_CONTENT//[[:space:]]/}" ] && exit 0

WORST=0
record_worst() { local lvl=$1; [ "$lvl" -gt "$WORST" ] && WORST=$lvl; }

# ── E.1 principles canonical(*.principles.stories.tsx)──────────────────────
case "$FILE_PATH" in
  *.principles.stories.tsx)
    if ! echo "$NEW_CONTENT" | grep -q "@principles-rationale:"; then
      EXISTING_CONTENT=""
      [ -f "$FILE_PATH" ] && EXISTING_CONTENT=$(cat "$FILE_PATH" 2>/dev/null || echo "")
      FULL_CONTENT="${EXISTING_CONTENT}
${NEW_CONTENT}"
      STORY_EXPORTS=$(echo "$FULL_CONTENT" | grep -oE "^export const [A-Z][a-zA-Z]+" | awk '{print $3}' | sort -u)

      VIOLATIONS_E1=""
      WARNINGS_E1=""

      DEPRECATED_NAMES=("Forbidden" "Donts" "Pitfalls" "Prohibitions" "NonGoals" "VisualDonts")
      for deprecated in "${DEPRECATED_NAMES[@]}"; do
        if echo "$STORY_EXPORTS" | grep -qE "^${deprecated}"; then
          if [ -z "$EXISTING_CONTENT" ]; then
            VIOLATIONS_E1="${VIOLATIONS_E1}\n  • [P0] Deprecated naming '${deprecated}*' — rename to 'WhenNotToUse'"
          else
            WARNINGS_E1="${WARNINGS_E1}\n  • [P1] Deprecated '${deprecated}*' — migrate to 'WhenNotToUse'"
          fi
        fi
      done

      HAS_WHEN_TO_USE=0; HAS_WHEN_NOT_TO_USE=0; HAS_VS_RULE=0; HAS_CONTENT_GUIDELINES=0; HAS_USAGE_GUIDANCE=0
      echo "$STORY_EXPORTS" | grep -qE "^WhenToUse$" && HAS_WHEN_TO_USE=1
      echo "$STORY_EXPORTS" | grep -qE "^WhenNotToUse$" && HAS_WHEN_NOT_TO_USE=1
      echo "$STORY_EXPORTS" | grep -qE "^Vs[A-Z].*Rule$|^.+Vs.+Rule$" && HAS_VS_RULE=1
      echo "$STORY_EXPORTS" | grep -qE "^ContentGuidelines$" && HAS_CONTENT_GUIDELINES=1
      echo "$STORY_EXPORTS" | grep -qE "^(UsageScenarioRule|WhatItIs)$" && HAS_WHEN_TO_USE=1
      for deprecated in "${DEPRECATED_NAMES[@]}"; do
        echo "$STORY_EXPORTS" | grep -qE "^${deprecated}" && HAS_WHEN_NOT_TO_USE=1
      done
      echo "$STORY_EXPORTS" | grep -qE "^UsageGuidance$" && HAS_USAGE_GUIDANCE=1

      CORE_COUNT=$((HAS_WHEN_TO_USE + HAS_WHEN_NOT_TO_USE + HAS_VS_RULE + HAS_CONTENT_GUIDELINES))
      [ "$HAS_USAGE_GUIDANCE" -eq 1 ] && CORE_COUNT=2

      if [ "$CORE_COUNT" -lt 2 ]; then
        if [ -z "$EXISTING_CONTENT" ]; then
          VIOLATIONS_E1="${VIOLATIONS_E1}\n  • [P0] Universal core ≥ 2 required: have ${CORE_COUNT} of {WhenToUse, WhenNotToUse, Vs*Rule, ContentGuidelines}"
        else
          WARNINGS_E1="${WARNINGS_E1}\n  • [P1] Universal core ${CORE_COUNT}/2 — add WhenToUse / WhenNotToUse / Vs*Rule / ContentGuidelines"
        fi
      fi

      if [ -n "$VIOLATIONS_E1" ]; then
        cat >&2 <<EOF

┄┄┄ E.1 check_canonical_propagation — principles canonical BLOCKER ┄┄┄

[P0] ${FILE_PATH}
Violations:$(echo -e "$VIOLATIONS_E1")

Per category-templates.md「Principles canonical」:
  ‣ Universal core ≥ 2 of {WhenToUse, WhenNotToUse, Vs*Rule, ContentGuidelines}
  ‣ Anti-pattern naming → WhenNotToUse(Forbidden/Donts/Pitfalls/Prohibitions/NonGoals/VisualDonts deprecated)
  ‣ 例外:加 \`// @principles-rationale: <reason>\`

EOF
        record_worst 2
      fi
      [ -n "$WARNINGS_E1" ] && echo "⚠️  E.1 principles canonical warning:$(echo -e "$WARNINGS_E1")" >&2
    fi
    ;;
esac

# ── E.2 L3 primitive import(*.ts/.tsx outside DS internal)───────────────────
case "$FILE_PATH" in
  *.ts|*.tsx)
    case "$FILE_PATH" in
      */packages/design-system/src/components/*|*/packages/design-system/src/patterns/*|*/packages/design-system/src/tokens/*|*/packages/design-system/src/hooks/*) ;; # DS internal skip
      *)
        # File-level allowlist:檔頭 5 行
        ALLOW_E2=0
        FIRST_LINES_E2=$(printf '%s\n' "$NEW_CONTENT" | sed -n '1,5p')
        echo "$FIRST_LINES_E2" | grep -qE '//[[:space:]]*@l3-import-allow:' && ALLOW_E2=1
        if [ -f "$FILE_PATH" ] && [ "$ALLOW_E2" = "0" ]; then
          ON_DISK_FIRST=$(sed -n '1,5p' "$FILE_PATH" 2>/dev/null || true)
          echo "$ON_DISK_FIRST" | grep -qE '//[[:space:]]*@l3-import-allow:' && ALLOW_E2=1
        fi
        if [ "$ALLOW_E2" = "0" ]; then
          L3_IMPORT_PATTERN='from\s+["'"'"'][^"'"'"']*patterns/element-anatomy/item-anatomy["'"'"']'
          if printf '%s\n' "$NEW_CONTENT" | grep -qE "$L3_IMPORT_PATTERN"; then
            MATCHED_LINE=$(printf '%s\n' "$NEW_CONTENT" | grep -nE "$L3_IMPORT_PATTERN" | head -1)
            cat >&2 <<EOF

┄┄┄ E.2 check_canonical_propagation — L3 primitive import BLOCKER ┄┄┄

[P0] ${FILE_PATH}
  > ${MATCHED_LINE}

L3 internal primitives(\`ItemInlineAction\` / \`ItemContent\` / \`RowSizeProvider\` 等)
是給 DS 作者建 host 元件用的 building block,不是 app code 用的。

修法(擇一):
  (a) host config API(90%):<Input endAction={...} /> / <TreeItem inlineActions={...} />
  (b) host slot escape(10%):<Input endSlot={<Custom/>} />
  (c) 獨立 button(非 inline):<Button iconOnly variant="text" />

刻意 import L3:檔首 5 行加 \`// @l3-import-allow: <reason + spec.md anchor>\`

EOF
            record_worst 2
          fi
        fi
        ;;
    esac
    ;;
esac

# ── E.3 spec-impl default alignment(*.spec.md)──────────────────────────────
case "$FILE_PATH" in
  *.spec.md)
    FIRST_LINES_E3=$(printf '%s\n' "$NEW_CONTENT" | sed -n '1,5p')
    if ! echo "$FIRST_LINES_E3" | grep -q '@spec-impl-allow'; then
      DEFAULT_LINES=$(printf '%s' "$NEW_CONTENT" | grep -nE '預設|預値|default[ \t]*[=:]|`default`|預設值' | head -3)
      if [ -n "$DEFAULT_LINES" ]; then
        cat >&2 <<EOF

┄┄┄ E.3 check_canonical_propagation — spec-impl default alignment WARN ┄┄┄

[P1] ${FILE_PATH}
偵測「default」/「預設」keyword:
${DEFAULT_LINES}

⚠️  spec 寫預設值 → 必對應 impl 驗證一致(M14 + 真實案例:SelectMenu spec 寫
   「width 預設 = trigger-width」但 PopoverContent w-72 hardcode override,canonical 失效)

Self-check:
  - 找對應 implementation file
  - grep 該 default value 是否 hardcode / 是否被外層 override
  - 不一致 → 修 impl OR 修 spec 對齊
  - 一致 → impl 加 inline comment 「Default per spec L<N>」回扣

整檔豁免:檔頭 5 行 \`// @spec-impl-allow: <reason>\`(soft warn 不擋 commit)

EOF
      fi
    fi
    ;;
esac

exit $WORST
