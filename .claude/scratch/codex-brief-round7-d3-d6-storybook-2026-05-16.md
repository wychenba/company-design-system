# Codex Round 7 — D3 效能 + D4 UX + D5 視覺 + D6 原則 + 全 190 storybook exhaustive(M31 真 dual-track)

## User verbatim 2026-05-16(抓 Round 6 不完整)

> 「你確定你有驗證過這些修正都沒問題就修,codex 有針對所有 storybook 稽核嗎?
>  以及針對所有程式碼稽核?包括效能?這些應該都有包含在 ds 深層稽核裡面吧?」

## Round 6 gap 承認

| Axis | Round 6 cover | Round 7 必補 |
|---|---|---|
| D1 設計語言 | ✓ 跑 46 dims + 9 findings | already done |
| D2 程式語言 | ✓ tsc / code-quality / compile-stories | already done |
| **D3 效能** | ✗ **只 rAF lifecycle,缺真 perf** | 本 round |
| **D4 UX** | ✗ skip | 本 round |
| **D5 視覺** | ✗ skip | 本 round |
| **D6 原則自檢** | ✗ skip | 本 round |
| Storybook 190 files exhaustive | 部分(9 findings),非 semantic full sweep | 本 round 深掃 |

## Round 7 任務(NO-SKIP / NO-SAMPLE 仍 apply)

### Q1 — D3 效能稽核 DS-wide

逐 component 跑 D3 7 子維(per `/performance-audit` skill spec):
1. **過量 re-render**:hot path component(Avatar / Button / Tag / DataTable cell / PeoplePicker stack)有沒有 missing `React.memo` / `useMemo` / `useCallback`?
2. **Context thrashing**:Context provider value 是 inline object?(每 render 新 ref → child 全 re-render)
3. **Effect dependency 過多 / 缺失**:導致過度 fire 或 stale closure
4. **rAF / Observer leak**:Round 6 cover 大部分,verify completeness
5. **Bundle size**:any over-200KB chunk un-optimized?
6. **Virtualized list**:有 long list 沒 virtualize?(已知 DataTable 有 react-virtual,別處?)
7. **Layout thrash**:read DOM 後立刻 write 是否在 rAF batch?

Per `node scripts/check-perf-story.mjs` + grep + ToolSearch。

### Q2 — D4 UX 稽核 DS-wide

逐 component 跑 D4 7 子維(per `/ux-audit` skill spec):
1. **Keyboard navigation**:Tab / Shift+Tab / Arrow / Enter / Esc / Space 全 handler 覆蓋?
2. **Focus management**:open/close overlay 後 focus 還原?
3. **ARIA correctness**:role / aria-* 對應 component intent(non-button onClick 必有 role)?
4. **Animation timing**:transition duration 對齊 token(150ms / 250ms 等)?無 jarring jumps?
5. **Interaction canonical**:hover / click / drag / zoom 對齊 world-class idiom?
6. **Error/loading states**:dual-mode coherence(Round 4 Dim 26 已 cover 部分)
7. **Empty states**:0-state component-level handling(per spec rule B)

### Q3 — D5 視覺 mechanical(Layer A)+ AI(Layer B)

Layer A:用 `npm run visual-audit` 跑 mechanical pixel/baseline check
Layer B:Codex semantic 比稿 Layer A finding + 補 AI judgement(色彩 contrast / spacing rhythm / typography hierarchy)

如 sandbox 不能跑 visual-audit,明示「Layer A pixel verify deferred to user 跑」+ codex 仍可 spec.md cross-check 視覺 token consumption discipline。

### Q4 — D6 原則自檢

Per `.claude/skills/design-system-audit/references/principle-audit-protocol.md` 4 子維:
- **合理性**:CLAUDE.md rule 是否 self-consistent?有沒有規則互相矛盾?
- **一致性**:cross-spec naming / token / pattern 用詞一致?
- **無矛盾**:M-rule / spec / hook / skill 跨 home 衝突?
- **完整性**:是否有 user 抓過的 bug pattern 未 codify?

### Q5 — 全 190 stories.tsx exhaustive semantic deep dive

DS-wide ALL 190 stories.tsx files。每 file:
1. 是否 earn existence(per `references/example-selection.md` 2-test)?
2. 是否 real business scenario(per story-rules.md「真實業務情境」)?
3. Title canonical?Story name 人話?Rule note 品質?
4. Title 用 `Design System/{Tokens|Patterns|Components|Internal}/{Name}/{展示|設計規格|設計原則}`?

Round 6 只跑 sample;本 round **全 190 必過,不抽樣**。

### Q6 — 我前 commit 修的 8 fixes verify

對 commit `0bcfed5e` 8 edits 反查:
- FieldControlGroup spec「Layout Family」 first paragraph 對齊 frontmatter ✓?
- Carousel real photo URL 沒 break runtime(picsum.photos 可訪問?)?
- 3 story names cleanup 對齊 canonical ✓?
- 5 rAF/setTimeout cleanup 對嗎?
- 還有沒有我修了但 silent regression 的 site?

## 限制

- NO SKIP / NO SAMPLE invariant
- 每 finding file:line + 引文
- 區分 Absolute / Consistency / AI judgement
- 對 SSOT-UI/UX 改動明示「user decision required」
- 對 mechanical clean 明示「autonomous-fix candidate」

## Output 6 sections(per Q1-Q6)

Stage progress + per-stage findings table + final consolidated summary。
