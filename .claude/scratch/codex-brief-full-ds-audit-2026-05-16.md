# Codex 全 DS 深度稽核 brief(M31 dual-track Layer C)

## User verbatim 2026-05-16 directive

> 「你請 codex 根據我們的標準做一次完整的 ds 深度完整稽核,然後列一份稽核報告給你參考...
>  以確保程式碼或設計原則夠言簡意賅、夠有效率、效能夠好、夠能夠維護 SSOT、夠易懂、
>  夠好維護、夠好管理、夠好擴充、夠符合世界級的設計、夠符合我們一致的設計語言為目標」

## 任務 — DS-wide full audit(NO-SAMPLE per audit-must-be-full-sweep canonical)

Scope:`src/design-system/**/*.{tsx,ts,css,md}` — 全 61 components / patterns / tokens / lib。
**不抽樣**(context 不夠拆 batch 但不縮 scope)。

## 10 個 audit axis(per user verbatim)

### 1. 言簡意簡
- spec.md / SKILL.md / rules / memory 有沒有冗長 / 重複話?
- code comments 有沒有 over-documented(已 obvious 還寫)?
- 同 idea 在 N 處重複描述(Rule-of-3 違反)?

### 2. 效率(efficiency)
- React render 路徑有沒有可以縮 prop drilling?
- useEffect / useLayoutEffect 有沒有可合併?
- 重複 helper 散在多檔 vs 抽 lib/?

### 3. 效能(performance)
- 過量 re-render(missing useMemo/useCallback,但只在 hot path)?
- ResizeObserver / MutationObserver 沒 cleanup?
- rAF / setTimeout 沒 cancel?

### 4. SSOT 維護
- Token / primitive / pattern 是否被 hard-code 重複(missing SSOT propagation)?
- Cross-element-type prop value 衝突(text 在 Button 是 variant / 在 FileItem 是 mode)?
- Spec 跟 code 不一致(三方 drift)?

### 5. 易懂(readable)
- 變數命名清楚?(`a` / `tmp` / `x` 不該存在)
- 函式名表達 intent?
- 註解講「為什麼」非「什麼」?

### 6. 好維護(maintainable)
- 改一個 token 需要改 N 處(SSOT 鏈斷)?
- 改 component prop 需要動 5+ consumer file(API 設計過細)?
- Magic number 沒 cite source?

### 7. 好管理(manageable)
- File size 過大難 navigate(> 500 lines 軟 / > 800 hard)?
- Long function > 80 行?
- Circular dependency?
- Dead exports?

### 8. 好擴充(extensible)
- 新增 type / variant 需要動 N 處 dispatch table(分散 instead of registry)?
- Hook / utility 寫死 use case 不容 future composition?

### 9. 世界級(world-class)
- 對齊 Polaris / Material / Atlassian / Ant / Carbon / Apple HIG / Radix idiom 嗎?
- 視覺 / behavior 決策是否有 ≥3 家 benchmark cite(per M8 + M22 + M26)?

### 10. 一致設計語言(consistent)
- DS-internal canonical 優先 external benchmark(M23)?
- Layout family 一致(Family 1-4)?
- Token consumption 對齊(無 shadcn alias 回流)?
- Naming idiom 跨 component 一致(per CLAUDE.md 命名 3 重 test)?

## 已修但 codex 該 cross-verify

最近 ship(commit `261781e9` + `433544bf`):
- 2 DataTable stories retired(AlignmentRule + ColumnTypes)
- Internal vs Components 三 test 加 compound-component exception clause
- Round 2-5 fix:Combobox forwardRef ref-drop / saw formula / race / rAF leaks / Select All SSOT

請 codex independent verify 這些是否 sound,或抓出 silent regression。

## 限制 / Output 格式

- **不 ship code** — codex 純 audit + report
- File:line + 引文 for every finding
- Severity per finding:P0 / P1 / P2
- 區分 **mechanical** finding(grep-catchable)vs **AI judgement** finding(semantic)
- 對 SSOT-affecting UI/UX finding(需 user 拍板)明示「user decision required」
- 對 mechanical clean(code quality / refactor / 標 marker)明示「autonomous-fix candidate」

## 限制(reasonable scope)

如 context 不夠 → 拆 stage 分 batches **不縮 scope**:
- Stage 1:Group A (Correctness) + Group B (Spec hygiene) + Group K (Code quality)
- Stage 2:Group C (Code conformance) + Group D (Story layer)
- Stage 3:Group E + F + G + H (System / Architecture / Home / Consumer)
- Stage 4:Group I (Auto-compile) + Group J (Form state) + Group L (Story splitting)
- Stage 5:Group M (Overlay) + Group N (State chain) + Group O (Storybook content)

每 stage 報 progress + findings。最後總報告 consolidate。

## 已有 audit infrastructure(供 codex 參考)

- `node scripts/code-quality-audit.mjs --scope=all` — `any` / dead-export / file-size / long-function 機械化
- `node scripts/compile-stories.mjs --all --check` — story canonical drift
- `node scripts/audit-content-quality.mjs --check` — content drift
- `node scripts/extract-canonical-rules.mjs` — canonical rule keyword coverage
- `node scripts/audit-preflight.mjs` — preflight 全盤查
- `.claude/skills/design-system-audit/SKILL.md` — 46 audit dimensions
- `.claude/rules/meta-patterns.md` — 32 M-rules
- `.claude/references/principle-dim-map.json` — M-rule → audit dim mapping

Codex 可呼叫上述 + 自跑 grep + read source。

## Output sections

1. **Stage progress**(per stage)
2. **Findings table**:Severity / Type / file:line / 引文 / Suggested fix / Decision class(autonomous vs user-decision)
3. **Final consolidated report**:
   - Total findings count by severity
   - SSOT-UI/UX user-decision items list(各列 中文 propose:發生什麼 / 影響範圍 / 選項 outcome)
   - Mechanical autonomous-fix items list
   - 跨 axis pattern(e.g. 多個 component 同 anti-pattern)
4. **Final summary**:DS 整體達 10 axis 標準到什麼程度?哪 axis 最弱?

## 限制再強調

- NO SKIP keyword per `--deep` mode invariant
- NO SAMPLE keyword per audit-must-be-full-sweep canonical
- 每 finding 必 file:line cite
- 不 silent pass over 既有 hook / audit dim 已 cover 的 area(明示「already covered by X」)
