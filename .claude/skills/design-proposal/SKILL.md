---
name: design-proposal
description: UI/UX designer's structured workflow for proposing new features. Systematically benchmarks 5+ world-class references, evaluates against DS consistency and business fit, produces 2-3 shortlisted proposals as Storybook explorations for stakeholder decision. Invoke via /design-proposal when asked to「給我幾個方案」「設計 X feature」「這個 flow 怎麼做世界級」 or when a new UI/UX decision needs structured exploration.
---

# Design Proposal Workflow

Purpose: embody the UX designer's mental model — never design by gut; benchmark against world-class, filter against DS + business, build multiple shortlisted proposals, let stakeholders decide.

This skill is the **structured version** of CLAUDE.md Mindset #1「對標世界級」+ #4「真實業務場景」+ #5「猶豫就問」,and the orchestrator for `src/explorations/` folder usage.

## When to run

- User asks to design / propose a new feature or flow
- User says「給我幾個方案」「比幾個版本」「這個怎麼做世界級」
- User wants a new component but multiple patterns exist in world-class DS
- Ambiguous UX decision — picking one without exploration would be憑直覺
- Before committing to a new DS primitive or pattern that has multiple viable shapes

## Preconditions

- User has briefed a feature / problem / user need (will be clarified in Phase 0)
- Working directory is project root
- CLAUDE.md read fully(DS 既有 primitives / layout primitives 清單 / mindset)

---

## 6-Phase Workflow

### Phase 0 — Clarify

**Input**: user's initial request(可能模糊)

**Process**: AI asks user 3-5 targeted questions to lock down:
- 要做什麼(feature / flow / component)
- 給誰用(primary user persona)
- 解決什麼 jobs-to-be-done(具體使用情境,不是 "better UX")
- 量化指標(若有)(e.g., "減少 50% 流失率")
- Constraints(mobile-first? accessibility level? 時程?)

**Output**: 一段 1-liner summary 確認 alignment。

### ⚠️ Checkpoint 0 — User confirms framing

User approves the problem framing OR clarifies. Do NOT skip to benchmarking without a clean frame.

### Phase 1 — Benchmark research

**Input**: Phase 0 framing

**Process**: Scan 5+ world-class references. See `references/benchmark-sources.md` for the canonical list of DS + world-class SaaS + industry-specific references.

For each:
- How do they solve this problem?
- Screenshot(WebFetch or user provides)
- Key mechanics:layout / interaction pattern / states / a11y
- 1-2 line summary of approach

**Output**: Markdown scan table(component / UX pattern / visible screenshots OR link-only):

```
| Reference | Approach | Key mechanics | Screenshot |
|-----------|----------|---------------|------------|
| Linear    | ...      | ...           | link       |
| Stripe    | ...      | ...           | link       |
| ...       |          |               |            |
```

**Report format**: report back to user as the scan table. Do not advance to evaluation yet.

### ⚠️ Checkpoint 1 — Research scope confirmation

User reviews the scan. Options:
- `(a)` Research is sufficient → proceed to Phase 2
- `(b)` Add references X, Y → extend Phase 1
- `(c)` Scope changed → restart Phase 0

### Phase 2 — Evaluate candidates

**Input**: Phase 1 scan table

**Process**: for each candidate,score on 4 axes(see `references/evaluation-matrix.md`):

| Axis | Scale | Meaning |
|------|-------|---------|
| 優缺 | Pros / Cons bullets | 每個候選的獨立評估 |
| DS 一致性 | 1-5 | 能用多少既有元件 / primitives?新元件要不要造? |
| 業務 fit | 1-5 | 符合 Phase 0 jobs-to-be-done 多深? |
| 複雜度 | 1-5(低複雜度 = 5) | 開發成本 / 維護負擔 |

**Output**: 評分矩陣 + narrative summary per candidate。

Narrative 必含:
- 對齊 Mindset #1:「我們 vs 這家做法一樣 / 不同的理由」
- 對齊 Mindset #4:「搭我們的業務情境會不會水土不服」
- 對齊 Mindset #2:「這個 pattern 我們有對應 primitive 嗎?」

### ⚠️ Checkpoint 2 — Shortlist decision(MUST ASK)

這是最關鍵的 checkpoint。presenting 評分後,user 決定:
- 哪 2-3 個候選進 shortlist(要實際做原型)
- 哪些直接 drop(排除理由寫在 exploration notes)
- 是否需要混搭(A 的 interaction + B 的視覺 = 新候選 C)

**絕對不可**憑 AI 自己評分就挑 shortlist。這是設計決策,stakeholder 要參與。

### Phase 3 — Design each shortlisted candidate

**Input**: shortlist(2-3 items)

**Process**: 每個 candidate 建一個 exploration story。see `references/proposal-template.md` for structure。

目錄結構:
```
src/explorations/{topic-slug}/
├── notes.md                              # 本 topic 概述 + Phase 2 評估摘要 + 3 候選簡介
├── {CandidateA}.stories.tsx              # 候選 A 原型(Storybook)
├── {CandidateB}.stories.tsx              # 候選 B 原型
└── {CandidateC}.stories.tsx              # 候選 C 原型
```

Storybook title 慣例(不與 Components/ 衝突):
`Explorations/{Topic}/{CandidateName}`

每個 candidate story 必含:
- 標題說明(candidate 名 + 一句話 positioning)
- 實際可互動 prototype(用 src/design-system/ 既有元件!)
- 若需新元件,在 notes.md 標示「此 candidate 需新增 X 元件(若選用此版)」
- 3 種以上使用場景示範(對齊 Mindset #4 真實業務場景)

**DS 一致性鐵律**:
- 優先用既有 `src/design-system/components/` 元件
- 若需新元件 / primitive,**notes.md 明文標示**(不偷偷 add 到 components/)
- 所有 token / layout primitive 按 CLAUDE.md「既有 layout primitives 清單」消費

### ⚠️ Checkpoint 3 — 新元件 / primitive 需求

若任一 candidate 需要新 DS 元件,**必須 ASK**:
- 此新元件是本 candidate 獨有?還是跨 candidate 共用?
- 若被選中,值得升級到 Components/ 嗎?
- 三重命名 test 過嗎?(見 CLAUDE.md)

**絕對不可**在 explorations/ 階段就偷偷 add 到 Components/,會污染 DS。

### Phase 4 — Present & stakeholder decision

**Input**: 3 個 exploration stories

**Process**: 撰寫 summary(放在 `notes.md`):
- 每 candidate 一句話重述 positioning
- 每 candidate 3 個適合場景 / 3 個不適合場景
- 推薦(AI 可 recommend 一個,但表明 user 決定)
- Link 到各自 Storybook route

**Output**: summary markdown + Storybook URL list → 丟給 stakeholder 評估。

### ⚠️ Checkpoint 4 — Final decision & graduation

User / stakeholder 決定採用某 candidate 後:
- `(a)` 採用 A,promote 到 `src/design-system/` 正式(若需新元件)或消費既有元件建正式 UI
- `(b)` 採用 A 但修改(進第二輪 proposal)
- `(c)` 混搭 A+B 新 hybrid(新 exploration)
- `(d)` 全部不採用(保留 explorations/ 作紀錄,也是有價值的 ruled-out)

**Graduation 流程**:若升級到正式,在 `explorations/_archive/` 備份 exploration(CLAUDE.md line 633:「不再使用但需保留的內容移至 _archive/」),正式 code 進 design-system/。

### Phase 5 — Cleanup

刪除 drop 的 exploration 或移 `_archive/`。更新 `src/explorations/` 索引。

---

## Checkpoint 總表(MUST ASK 節點)

| # | 時機 | 決策內容 |
|---|------|---------|
| 0 | Phase 0 後 | Problem framing 正確? |
| 1 | Phase 1 後 | Research scope 足夠? |
| 2 | Phase 2 後 | Shortlist 哪幾個進 Phase 3? |
| 3 | Phase 3 中 | 新元件要進 Components/ 嗎?(若有) |
| 4 | Phase 4 後 | 最終採用哪個 candidate? |

**Checkpoint 不可略過**。Past failure mode:AI 自行 shortlist 後 user 發現方向錯要從頭開始 — 時間白花。

---

## Non-goals

- 不在 explorations/ 階段做 detail pixel polish(focus 在 pattern 可行性 + 使用者反應)
- 不自動 promote exploration 到 Components/
- 不代替 stakeholder 決策(AI 可 recommend,但 flag「需 user / stakeholder 決定」)
- 不跳過 benchmark 憑直覺造 pattern(違反 Mindset #1 / #2)
- 不在單個 exploration 塞多個 pattern(一個 story = 一個明確 candidate)

## Common failure modes

- **Phase 1 太淺**:只看 shadcn / Material 就收工。世界級 SaaS(Linear / Stripe / Notion / Figma)的在地解法才是精華
- **Phase 2 評分偏誤**:對 DS 一致性加權過低,結果 shortlist 全是「要造 5 個新元件」 — 違反 DRY
- **Phase 3 太快**:candidate 只做 1 個 story 沒展示多場景 — stakeholder 看不出 robustness
- **Checkpoint 2 skip**:AI 自己挑 2 個 shortlist 用戶沒過目 → 建完才發現方向全錯
- **Phase 4 recommend 太強勢**:summary 幫 user「決定」,違反 skill 精神(exploration 就是讓 stakeholder 評估)

---

## References

- [references/benchmark-sources.md](references/benchmark-sources.md) — 世界級對標清單 + 研究步驟
- [references/evaluation-matrix.md](references/evaluation-matrix.md) — 4 軸評分表範本 + 決策規則
- [references/proposal-template.md](references/proposal-template.md) — explorations/ folder + Storybook story 結構
- [references/checkpoints.md](references/checkpoints.md) — 5 個 MUST ASK 時機的範本 + 歷史 failure mode
