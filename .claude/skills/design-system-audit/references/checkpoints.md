# Checkpoints — 什麼時候 MUST 停下來問

這些是 skill 執行過程中**不可略過**的 user 決策點。past 執行失敗都因為我自行決定了該問的事。

---

## Checkpoint 1 — 稽核完畢後的 Triage（每次 run 都會觸發）

稽核結果出來後，**先不修**，先把findings 分類呈現：

**格式範本**：
```
🔍 稽核結果彙整

P0（自動修，無 scope 爭議）: N 項
- cva 三方漂移: X 處
- SSOT dead link: Y 處
- Tailwind v4 grep 違規: Z 處
- 硬寫 color 值: W 處

P1（批次修 + review）: M 項
- Rule A 文字品質違規: A 處
- Story 人話範例違規: B 處
- shadcn passthrough 缺失: C 處
- Anatomy 缺 section: D 處
- a11y aria-label 缺失: E 處

P2（MUST ASK）: K 項
1. [findings 1 scope 爭議] — 選項 A / B / C
2. [findings 2]

建議順序:
1. 先修 P0（獨立 commit）
2. 再修 P1（每類一個 commit）
3. P2 逐項討論再決定

要從哪一項開始?
```

**絕對不可**：
- ❌ 跳過 triage 直接開始修 P1/P2
- ❌ 把 P2 當 P1 mechanical 執行
- ❌ 僅報總數不提供 file:line 讓 user 掃

---

## Checkpoint 2 — 稽核發現 CLAUDE.md 沒覆蓋的 pattern

若某個 audit 找到的違規不符合現有 CLAUDE.md 任何規則（= 新 pattern，非現有規則下的違反），必須 pause：

**觸發情境**：
- a11y audit 發現 7 個元件無 focus-visible，但 CLAUDE.md 沒明訂 focus ring 規則
- Token audit 發現一個新 color 硬寫模式反覆出現
- shadcn passthrough 發現 `displayName` 以外另一種 anti-pattern

**格式範本**：
```
🔔 Audit 發現 CLAUDE.md 未覆蓋的 pattern:

Pattern: [描述]
頻率: 出現在 X 個元件
Root cause (推測): [判斷 why 發生]

建議新增到 CLAUDE.md 的規則:
「[draft]」

放哪一節 (按「規則分層」判斷):
- 若跨元件 → # UI 開發規則 / # Spec 規則 / # Story
- 若技術陷阱 → # 失敗記憶索引 + 根原位置 section
- 若純風格 → # 命名與語言一致性

你決定:
(a) 採用此 draft，我同步寫進 CLAUDE.md
(b) 修改措辭: ...
(c) 不新增,遇到再 case-by-case 處理
```

**絕對不可**：
- ❌ 直接寫新規則進 CLAUDE.md
- ❌ 忽視 pattern 只修個別違規
- ❌ 半途改 mindset 條目（最高層級規則不可未經討論就加）

---

## Checkpoint 3 — 分類模糊（Internal vs Components / SSOT ownership）

稽核可能發現邊界元件，classification 不明：

**觸發情境**：
- 新元件的 Storybook title 應該放 `Components/` 還是 `Internal/`？
- 兩個元件互相比較，誰 own 完整對照、誰寫 pointer？
- 某 token 該歸類為 primitive 還是 semantic？

**格式範本**：
```
🤔 Classification 需要決定:

問題: [element / rule / token 是 A 還是 B?]

判斷依據:
- CLAUDE.md「{判斷 test 的位置}」第 X 題: [...]
- 相似 precedent: [已分類的類似案例]

兩個選項的 trade-off:
選 A (...) → 優: [...] 缺: [...]
選 B (...) → 優: [...] 缺: [...]

我傾向 B 因為 [...], 但需要你確認。
```

**絕對不可**：
- ❌ 憑感覺分類
- ❌ 用元件名稱 (HoverCard「看起來」公開) 分類
- ❌ 未查既有 precedent

---

## Checkpoint 4 — Cross-cutting refactor（影響 > 10 檔）

若修復涉及大量檔案的 mechanical 改動：

**觸發情境**：
- Helper function extraction 影響 41 個 anatomy files
- Token rename 影響 71 個 utility 使用
- Spec schema 改動影響所有 spec file 結構

**格式範本**：
```
⚠️ 大範圍 refactor 提議:

異動: [描述]
影響範圍: X 個檔案
風險:
- [風險 1]
- [風險 2]
回復難度: [rebase 難度]

執行方式:
(a) 一次 commit 全改（快但難 review）
(b) 分 N 個 commit 依 feature cluster 分批（慢但可 cherry-pick）
(c) 不做,留 tech debt,下次針對性處理

我傾向 (b) / 分 [clusters] 執行。你同意嗎?
```

**絕對不可**：
- ❌ 直接跑 mechanical find-replace 不 preview
- ❌ 一個 commit 塞 41 個 file
- ❌ 改完才告訴 user

---

## Checkpoint 5 — 環境 / 建置問題

稽核過程若遇環境問題（node_modules 壞、storybook 啟動失敗、tsc 報不相關錯），**不要嘗試修環境**：

**格式範本**：
```
⚠️ 環境 / 建置問題（非本 audit 引入）:

現象: [描述]
影響: 我無法 [verify X]
是否本 audit 引入的?  確認不是 (理由: git log / file touch 證實)
建議:
- 現在不碰環境，稽核照常進行
- 環境問題交給你 / 下個 session 處理
- 本 audit 的 tsc --noEmit 可以跑，用它當 correctness guard
```

**絕對不可**：
- ❌ 重 install node_modules
- ❌ 改 vite / storybook 設定試圖修
- ❌ 編輯無關檔案「順便修」

---

## Checkpoint 6 — 發現 spec 與 code 衝突

稽核若發現 spec.md 與 .tsx 描述的行為不同：

**格式範本**：
```
⚠️ Spec 與 Code 衝突:

元件: X
Spec 說: [句子 + line N]
Code 實際: [行為 + line M]

誰對?
- 若 Code 是 "後來 fix 的對的版本"：Spec 過時，需要更新
- 若 Code 是 "bug 未修"：Code 要改
- 若 Code 和 Spec 都錯：需討論正確做法

我的判斷: [分析]
等你確認哪個是 canonical 再動手。
```

**絕對不可**：
- ❌ 默默選一個修
- ❌ 改 code 前未讀 git log 看是否刻意改動
