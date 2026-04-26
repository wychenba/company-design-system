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
- 若跨元件 → `.claude/rules/ui-development.md` / `.claude/rules/spec-rules.md` / `.claude/rules/story-rules.md`
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

---

## Checkpoint 7 — 「先不管」vs tech debt 語意區分（user directive）

User 不同用語表達「現在不做」,語意差別明顯,處理方式不同。**本 checkpoint 是 Skill 層 SSOT**(對話 protocol 屬 skill,非 CLAUDE.md 層):

### 語意對照表

| User phrasing | 語意 | 處理 |
|--------------|-----|------|
| 「先不管」/「這個先跳過」/「不要追蹤」/「算了」 | **完全忽略,不進任何 tracking** | 不寫進 memory、不加進 失敗索引、不在下次 audit 提及。就當沒這件事。 |
| 「之後再處理」/「先記下來」/「下次做」 | **Park 為 tech debt** | 寫進 `memory/project_audit_progress.md` 「仍待未來處理」區,下次 audit 會 surface |
| 「做完」/「繼續」/「執行」/「馬不停蹄」 | **立刻處理** | 進 TaskList,執行完 mark completed |

### 判斷法

看 user 語氣傾向:
- **明確否決這件事不重要** → 完全移除 tracking
- **表達現在沒時間但該做** → tech debt
- **表達立刻做** → execute

### 禁止混用

將 user 的「先不管」當作 tech debt 記下來,下次 audit 又提 —— 違反 user 意圖,製造雜訊。

### 範本

當 user 在 Checkpoint 1 triage 或討論 P2 時表達「先不管」:

```
✓ 了解,先不管「{item}」。
   完全不寫進 memory tech debt / 失敗索引 / 下次 audit。
   當沒這件事。
```

### 歷史

2026-04-18 session:user 對 icon micro tier(Tag dismiss X ratio)+ checkbox checkmark
 自繪說「先不管」。AI 最初差點寫進 memory tech debt,經 user 再次提醒「先不管就是完全不用理他」才移除。
