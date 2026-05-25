# Spec.md 兩段式 chapter template(2026-05-17 codify,codex Q8 verdict (c) 兩段式)

**對齊**:Polaris 7-section component spec + Carbon Component Spec template + Material 3 component anatomy。比全寫死更適合複雜元件,比完全自由更能 audit。

## 必填 7 維(順序固定,hook 攔缺失或嚴重漂移)

```markdown
# <ComponentName> 設計原則

## 1. Layout Family / scope
- Layout Family: 1 / 2 / 3 / 4(或明示「self-contained / composite」+ rationale)
- Implementation base: 基於 Radix X / 基於 cmdk / native / 自建 + 理由
- Token / pattern 消費清單(SSOT 消費 canonical)

## 2. 何時用
- 真實業務情境(Jira / Stripe / Notion 可辨識)
- 預設使用案例(非邊緣 case)

## 3. 何時不用
- 近親元件分界(vs SiblingX / SiblingY)
- 反向 trigger:這些情境改用 Z

## 4. 近親分界(decision tree if multiple sibling)
- vs A:differentiate by axis-1
- vs B:differentiate by axis-2

## 5. 尺寸 / variant / state canonical
- Size:xs / sm / md / lg(field-height / table-row 等 token 對應)
- Variant:列 cva 預設值 + 為什麼
- State:default / hover / focus / active / disabled / loading / error 各自視覺定義 + state machine 疊加組合(M5)

## 6. 邊界案例 + a11y
- Empty / loading / error / dark mode / density / icon-only 各自處理
- ARIA roles + keyboard map(互動元件強制;純視覺 indicator 豁免明寫)
- Scope defaults 豁免清單(若適用,cite `spec-rules.md`)

## 7. 相關 SSOT links / reciprocal pointers
- 上游 pattern / token / primitive 引用(`xxx.spec.md「HEADING」`)
- 下游 consumer 元件 list
- Reciprocal check:被本 spec link 的對方有沒回連?
```

## 自由 rationale(後段)— 不限格式

每 component spec 可在 7 維後加任意「為什麼」/ historical anchor / world-class benchmark cite / RFC link / 邊界討論 — hook **不**攔此段。

範例:
- Button.spec.md 加「Pill Layout 為什麼自建非 Family 3」rationale
- Field.spec.md 加「為什麼 block primitive 不自己變高」decision tree
- DataTable.spec.md 加 Phase 7 RFC archive

## Hook 機械強制

**Hook**:`check_spec_chapter_canonical.sh`(待 ship)— PreToolUse Write/Edit `*.spec.md` 檢:
- 必填 7 維 heading 全在(`## 1. Layout Family` 等)
- 順序對(1 < 2 < 3 ... < 7)
- 缺任一 heading → P0 BLOCKER(可 escape:檔頭 `// @spec-template-exempt: <reason>` 例外,用 ≥ 3 家 world-class DS 對照證該 component 不適用標準 template)

**Soft warn**:7 維外的 chapter 結構不限。但若 audit Dim 15 偵測跨 spec 命名漂移(如「為什麼 block」vs「為什麼不變高」相同概念兩寫法)→ flag 統一。

## 歷史錨點

- 2026-05-17 codex Q8 verdict:Button vs Field 章節 order 不一(Button 有「何時不用」/ Field 有「為什麼 block」rationale-heavy)→ 該兩段式
- Polaris template:https://github.com/Shopify/polaris/blob/main/polaris-react/.template/component.mdx
- Carbon Component Spec:https://carbondesignsystem.com/contributing/component-checklist/
- Material 3 anatomy:https://m3.material.io/components/<component>/specs
