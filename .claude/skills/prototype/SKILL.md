---
name: prototype
description: Build UI prototypes / MVPs via a structured UX workflow — benchmark world-class, evaluate against DS + business, produce 2-3 shortlisted candidates as Storybook explorations, self-audit via product-ui-audit, let stakeholders decide. Invoke via /prototype ONLY when user explicitly uses the words「prototype」「MVP」「原型」 in their message (e.g.「做 prototype」「做 MVP」「做原型」「prototype 一個 X」). **DO NOT auto-invoke on casual phrases** like「怎麼做世界級」「給我幾個方案」「比版本」「比幾個版本」「還能怎麼做」「有哪些選項」— these are ambient conversation / thought-partnering, not explicit skill requests; instead ask「要走 prototype skill 正式流程嗎?還是只想先口頭討論?」to confirm before invoking.
---

# Prototype Workflow

Purpose: embody the UX designer's mental model for BUILDING PROTOTYPES — never design by gut; benchmark world-class, filter against DS + business, build multiple shortlisted proposals, self-audit, let stakeholders decide.

This skill is the **structured version** of CLAUDE.md Mindset #1「對標世界級」+ #4「真實業務場景」+ #5「猶豫就問」,and the orchestrator for `src/explorations/` folder usage.

## When to run

**明確觸發(直接 invoke)— 必含 prototype / MVP / 原型 明確字眼**:
- 「做 prototype」「做一個 prototype」「prototype 一個 X 功能」
- 「做 MVP」「這個做 MVP」
- 「做原型」「先做原型看看」
- 「做幾個 prototype 版本 compare」(明言 prototype + multiple)

**模糊觸發(**先 clarify** 再決定 invoke)**:
以下 user 日常高頻語句,**不自動 invoke,先問**:

- 「給我幾個方案」「比幾個版本」「比一下版本」
- 「這個怎麼做世界級」「還能怎麼做」「有哪些選項」
- 「給我看看有什麼做法」「哪家做得好可以參考」

這些短語經常只是 **thought-partnering / ambient conversation**,user 想口頭討論幾個 ideas 不代表要走完整 prototype workflow。

**Clarify 範本**:
```
要走 `/prototype` skill 正式流程嗎?(6 phases + 5 checkpoints + 建 2-3 個 exploration story)
還是先口頭討論幾個 pattern,你決定後再動手?

(a) 走正式 prototype skill
(b) 先口頭列幾個 pattern,user 判斷後直接實作某一個
(c) 其他: ...
```

**不觸發此 skill**:
- User 已確定要做某一個(無需多選)feature → 直接 implement
- 單純問「這個 pattern 怎麼做」(單一 pattern)→ 直接答
- 已 shortlist 完剩實作 → 直接進實作
- 產品確認要交付 → 走 `/delivery-handoff`
- 要檢查已存在 UI 用 DS 對不對 → 走 `/product-ui-audit`
- 稽核 DS 本身(spec / cva / SSOT)→ 走 `/design-system-audit`

**與 `/design-system-audit` 的關係**:若 Phase 3.0 Object Map 或 Phase 3 design 導出新 DS primitive 需求(Checkpoint 3)+ stakeholder 採用後,**該 primitive 加入 DS 時應跑 `/design-system-audit`** 確保 DS 內部健康(spec / stories / Layout Family 宣告 / SSOT reciprocal 等)。本 skill 不負責 DS-itself 稽核,兩 skill 正交。

## Skill 生態位(4-skill 全景)

```
  /design-system-audit    audit DS 本身(正交關注點,新 primitive 加入後跑)
  
  ┌─── 設計生命週期(本 skill 為起點)─────────────────────────┐
  │                                                              │
  │  /prototype(本 skill)                                        │
  │     ↓ Phase 3 建完 shortlist exploration                    │
  │  /product-ui-audit(Phase 3.5 強制 gate;也可獨立 invoke)    │
  │     ↓ audit 過關 → Checkpoint 4 stakeholder 決定採用          │
  │  產品正式上線                                                │
  │     ↓                                                         │
  │  /delivery-handoff(產品確認後 — 產 UI flow + handoff + inventory)│
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

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

For each reference,收集**兩類資訊**:

**A. 視覺 / 互動(表層)**:
- How do they solve this problem?
- Screenshot(WebFetch or user provides)
- Key mechanics:layout / interaction pattern / states / a11y
- 1-2 line summary of approach

**B. OOUX 層(資訊架構深度對標)**:
- **Core objects** identified(名詞清單 + attributes)
- **Relationships**(object 間如何連,NOM highlights)
- **CTAs per role**(key actions each role 對每 object 可做什麼)
- **UI shape observed**(同一 object 在 list / card / detail / inline 多種 shape 下 attributes 怎麼 progressive disclose)

**為什麼加 OOUX 欄**:視覺只看外型會抄到形式,object model 才是 IA 深度。做完 5 家 benchmark 後,你會發現哪些 object 是業界共識 / 哪些命名是該產品獨有 — 這是 Phase 3 自己建 Object Map 的原料。

詳細 OOUX 分析方法與範本見 [`references/ooux-template.md`](references/ooux-template.md)「Phase 1 用法」節(內含 Linear issue tracking 完整範例)。

**Output**: Markdown scan table(視覺 + OOUX 兩 section):

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

### Phase 3.0 — Build Object Map(ORCA,design 前強制)

**Input**: shortlist + Phase 1 benchmark 的 OOUX 分析

**Process**: 在寫任何 candidate story 之前,**先做 Object Map**(全體 candidate 共享同一個)。ORCA 4 步:

1. **O** Objects:feature 的核心名詞(2-7 個理想;命名三重 test)
2. **R** Relationships(NOM):object 間關聯(1:1 / 1:many / optional)
3. **C** CTAs per role:每角色對每 object 的動作清單
4. **A** Attributes per object:core / metadata / identifying

**Output**:`src/explorations/{topic-slug}/notes.md` 增補 OOUX section(見 `references/ooux-template.md`「Phase 3.0」範本 + Step 5 UI Shape → DS 元件映射表)。

**為什麼共享同一 Object Map**:3 個 candidate 差異應在 **UI shape + progressive disclosure + CTA ordering**,不在 object 定義本身。若 A candidate 把 Task 拆成 Task + Subtask、B candidate 只有 Task,stakeholder 比稿會變成「比 data model」失焦。除非該 feature 本質就是 data model 辯論,否則 object 定義應一致。

**何時跳過**:極小 feature(單一 button / 1-object 開關)可跳過 Phase 3.0,在 notes.md 明文標示「feature 範圍小,跳過 ORCA」。

---

### Phase 3 — Design each shortlisted candidate

**Input**: shortlist(2-3 items)+ Phase 3.0 產出的 Object Map

**Process**: 每個 candidate 建一個 exploration story,**各 candidate 共享 Object Map 但差異在 UI shape + CTAs 順序**。see `references/proposal-template.md` for structure。

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

### Phase 3.5 — Self-audit(stakeholder-gate,強制進階 6 維)

**Input**: Phase 3 完成 + Checkpoint 3 資源決策完畢的 exploration stories

**核心原則**:Phase 3 寫的 exploration code 不該直接進 Phase 4 給 stakeholder 看——先 AI 自己掃 6 維,世界級設計師本人也會自我 review 才對外 present。對齊 **CLAUDE.md `# 稽核 canonical` M6**(stakeholder-visible 產出 → 強制進階模式)。

**Process(6 維並行,對齊 6 維稽核 canonical)**:

| 維度 | Skill | Audit scope |
|------|-------|-------------|
| **D1 設計語言一致** | `/product-ui-audit` | 6 dim(token 紀律 / layout primitive / 元件使用 / mindset / 幾何 / a11y) |
| **D2 程式語言一致** | `tsc --noEmit` + lint | exploration 目錄 |
| **D3 元件效能** | `/performance-audit` | render / memo / bundle(per candidate) |
| **D4 UX 行為** | `/ux-audit` | keyboard / focus / ARIA / animation |
| **D5 視覺品質** | `/visual-audit` | Layer A mechanical + Layer B AI judgement |
| **D6 設計原則自檢(4 子維)** | chain `principle-audit-protocol.md` scope to exploration 對 DS canonical | 合理 / 一致 / 無矛盾 / 完整;auto vs STOP 判斷公式 |

#### 執行順序

0. **Flow snapshot coverage 前置檢查(M15,Phase 3.5 gate 前必過)**:exploration 必含 OpenSnapshot 類 stories
   涵蓋**所有 UI flow state**(initial / open / confirm / success / error / empty 等)。Pattern:
   `defaultOpen` / `useState(true)` / play() interaction 讓 Playwright 能截圖。未提供 = block audit
   (無法 visual proof 的 stakeholder artifact 屬 M6 違反)
1. `npm run visual-audit -- --scope=component:{topic-slug}` 先跑(D5 Layer A,產出 snapshots)
2. Chain `/product-ui-audit`(D1)scope 到 `src/explorations/{topic-slug}/`
3. Chain `/performance-audit`(D3)scope 到該 exploration
4. Chain `/ux-audit`(D4)scope 到該 exploration
5. Chain `/visual-audit`(D5 Layer B AI judgement)讀 `snapshots/*.png`
6. **D6 真 scan**:chain `.claude/skills/design-system-audit/references/principle-audit-protocol.md` 對 exploration code 是否牴觸 DS canonical 跑 4 子維(合理 / 一致 / 無矛盾 / 完整);依判斷公式 auto / STOP
7. **Self-improvement capture**(強制 Phase F step):見 CLAUDE.md `# 資訊治理 canonical` → Audit skill Phase F 節

**Output**:per candidate 的 6 維 report,彙整成一份 Phase 3.5 gate report

**Gate 規則(嚴格)**:
- **D1 / D2 P0** → 必修(token alias / 硬色 / 幾何違反 / tsc error)
- **D5 Layer A violation** → 必修(contrast AA 不過 / geometry assertion fail 視同 P0)
- **D3 / D4 高 impact finding** → 必修(render 爆 / keyboard 不通 / ARIA 缺)
- **D5 Layer B 明顯設計問題** → 必修或在 notes.md 明文 rationale
- **D6 canonical 疑點** → 不 block,列 STOP 區等 user sign-off
- Code P1 > 3 筆 → 建議修,user 可決定先 present 或先修
- 無 P0 + Layer A 乾淨 + D3/D4 無高 impact → 可進 Phase 4

**為什麼 mandatory**:比稿本質是「給 stakeholder 選視覺方向」,6 維任一沒 audit 好就 present = 讓 stakeholder 看了有 bug 的 candidate,比稿品質失準。對齊 Meta-Pattern M6。

詳情見 `.claude/skills/product-ui-audit/SKILL.md` + `/performance-audit` + `/ux-audit` + `/visual-audit` + `references/audit-checks.md`。

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

- [references/benchmark-sources.md](references/benchmark-sources.md) — 世界級對標清單 + 研究步驟(含 OOUX 深層分析)
- [references/ooux-template.md](references/ooux-template.md) — Object-Oriented UX(ORCA 流程 / Object Map / NOM / CTA Inventory / DS 元件映射)Sophia V. Prater 方法論
- [references/evaluation-matrix.md](references/evaluation-matrix.md) — 4 軸評分表範本 + 決策規則
- [references/proposal-template.md](references/proposal-template.md) — explorations/ folder + Storybook story 結構
- [references/checkpoints.md](references/checkpoints.md) — 5 個 MUST ASK 時機的範本 + 歷史 failure mode
