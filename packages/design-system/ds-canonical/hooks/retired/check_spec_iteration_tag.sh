#!/bin/bash
# PostToolUse hook: when editing a *.spec.md, detect iteration residue tags that
# indicate incomplete consolidation — 「2026-XX-XX 第 N 次 refine」, v2/v3 markers,
# date-tagged canonical headings, or「final」labels stacking up.
#
# Why: canonical specs iterate multiple times during a session. Each iteration
# leaves tag residue (「第 3 次 refine」/「v2」/「2026-04-22 final」) that accumulates
# and muddies the spec. Clean canonical should read as **the** answer, not a
# history log. CLAUDE.md Meta-Pattern M8 pairs with this: benchmark before
# writing to reduce iteration count.
#
# Action: warn (exit 0, not block) — user / AI decides whether consolidation is
# needed. If genuinely final, the tag can be kept; if residue, clean it.
#
# Trigger: PostToolUse on Edit/Write/MultiEdit where file_path ends in `.spec.md`.

# Per-hook fire logging(enables /knowledge-prune D2 dead-hook detection)
source "$(dirname "$0")/_log-fire.sh" 2>/dev/null && log_hook_fire

set -uo pipefail

FILE_PATH="${CLAUDE_TOOL_INPUT_FILE_PATH:-}"

case "$FILE_PATH" in
  *.spec.md) ;;
  *) exit 0 ;;
esac

[ -f "$FILE_PATH" ] || exit 0

# Detect iteration residue patterns. Each pattern emits a line if matched.
RESIDUE=""

# Pattern 1: 「第 N 次 refine」or「refine 第 N」
if grep -qE "第[[:space:]]*[0-9]+[[:space:]]*次[[:space:]]*(refine|修訂|revision)" "$FILE_PATH" 2>/dev/null; then
  COUNT=$(grep -cE --no-messages "第[[:space:]]*[0-9]+[[:space:]]*次[[:space:]]*(refine|修訂|revision)" "$FILE_PATH" || echo 0)
  RESIDUE="${RESIDUE}  • 「第 N 次 refine」tag × ${COUNT}\n"
fi

# Pattern 2: 「v2」/「v3」version markers in headings or body
if grep -qE "\b[vV][0-9]+\b.*(canonical|final|rule|規則|預設)" "$FILE_PATH" 2>/dev/null; then
  COUNT=$(grep -cE --no-messages "\b[vV][0-9]+\b.*(canonical|final|rule|規則|預設)" "$FILE_PATH" || echo 0)
  RESIDUE="${RESIDUE}  • 「v2/v3」version marker × ${COUNT}\n"
fi

# Pattern 3: Date-tagged canonical headings (「2026-04-22 final canonical」)
if grep -qE "20[0-9]{2}-[0-9]{2}-[0-9]{2}.*(final|canonical|revision|refine|revised|重訂|新增)" "$FILE_PATH" 2>/dev/null; then
  COUNT=$(grep -cE --no-messages "20[0-9]{2}-[0-9]{2}-[0-9]{2}.*(final|canonical|revision|refine|revised|重訂|新增)" "$FILE_PATH" || echo 0)
  RESIDUE="${RESIDUE}  • Date-tagged canonical heading × ${COUNT}\n"
fi

# Pattern 4: Stacked 「final」labels (more than one 「final」 is suspicious)
FINAL_COUNT=$(grep -cE --no-messages "\b(final|最終|定案)\b" "$FILE_PATH" 2>/dev/null | head -1)
FINAL_COUNT="${FINAL_COUNT:-0}"
if [ "$FINAL_COUNT" -gt 2 ] 2>/dev/null; then
  RESIDUE="${RESIDUE}  • 「final/最終」label × ${FINAL_COUNT}(>2 suspicious — 可能 iterate 殘留)\n"
fi

# Pattern 5: 「(舊) / (新) / (deprecated) 」 label pairs without cleanup
if grep -qE "(舊|legacy|deprecated|舊版)" "$FILE_PATH" 2>/dev/null; then
  COUNT=$(grep -cE --no-messages "(舊|legacy|deprecated|舊版)" "$FILE_PATH" || echo 0)
  RESIDUE="${RESIDUE}  • 「舊/legacy/deprecated」label × ${COUNT}(考慮 consolidate)\n"
fi

# No residue? exit quietly.
if [ -z "$RESIDUE" ]; then
  exit 0
fi

cat <<EOF
⚠️  Spec iteration residue — ${FILE_PATH}

發現 spec.md 有 iterate 疊代殘留標記:
$(printf "%b" "$RESIDUE")
Suggestion:
  1. 若 canonical 已穩定 → clean 掉 tag(「第 N 次 refine」/「v2」/ date-tagged
     / 多個「final」/「舊 vs 新」對比)讓 spec 讀起來是**這個就是答案**,
     而不是 history log
  2. 若仍在 iterate → 先完成 consolidate 再 commit

對齊 CLAUDE.md Meta-Pattern M8(訂 canonical 前先 world-class benchmark,
降低 iterate 次數)。

(warning only, no block)
EOF

exit 0
