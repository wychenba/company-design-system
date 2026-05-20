---
name: Nearest same-purpose canonical usage wins(M35)
description: 寫 stories wrap 既有 primitive 前必查 registry + 抄 baseline + 標 marker;cite 存在 ≠ consume 落實
type: feedback
originSessionId: a689a78e-f264-4c1f-b881-0859a7a12135
---
# Nearest same-purpose canonical usage wins(M35)

**Rule**:寫 stories(或任何 UI composition)wrap 既有 primitive 前必查 `.claude/references/story-baseline-registry.json`,Read baseline + helpers,抄該 production archetype 結構,**不准憑記憶寫 simplified mock**。

**Why(codex Layer B D4 2026-05-20 verdict)**:Claude 反覆偏移真 root cause = **「SSOT 消費被當成引用儀式,而不是同目的 canonical usage 的機械證明」**。Cite 存在(`@story-baseline:` marker)≠ consume 落實(實際抄 baseline 結構)。最相近同目的 canonical 用法**優於**泛用 spec wording。

**How to apply**:
1. 寫 stories 前必 Read `.claude/references/story-baseline-registry.json`
2. 該 primitive 有 entry → 抄 baseline + requiredHelpers + variantRules(逐 prop / 逐 className)
3. 該 primitive 無 entry → STOP,先 add registry entry 才寫
4. 檔頭標 `// @story-baseline: <path>#<StoryName>` cite
5. 違 antiPattern → P0 BLOCKER(`check_story_invariants.sh R8`)

**反覆違反錨例(2026-05-20 4 類)**:
- simplified mock(`<SidebarHeader><span>Acme</span>` 取代 `<WorkspaceBrand>`)
- dev jargon(anatomy「規則 1A/1B/1C 三派並存」designer 看不懂)
- wrong variant(toolbar filter/sort 用 tertiary,canonical 是 text)
- 結構不消費 primitive props(inline icon 取代 `startIcon` prop)

**Mechanical enforcement**(5-layer)+ **對齊 world-class**:Storybook portable stories + Polaris/Atlassian「prebuilt components first, composition with primitives, real component examples not simplified visual mocks」。
