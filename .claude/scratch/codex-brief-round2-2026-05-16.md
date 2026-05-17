# Codex Round 2 — PeoplePicker stack saw transition + Select All ordering(M31 fresh discussion)

## User verbatim 2026-05-16 (third strike after my ship)

> 「這個還是錯的啊,你們他媽根本沒有發現root cause 也根本沒有找對重現方式和判斷何謂正確何謂錯誤,你們再給我去討論辯論」

> 「然後 select all 那個問題我不買單,你自己去研究看看 ant design 到底是不是你說的那樣,然後這題也跟 codex 討論辯論」

## Round 1 我承認的錯誤

1. **Ref drop fix shipped 但不是 user 抓的 root cause**:Combobox forwardRef `_ref` 漏接是 real bug,但 user 截圖顯示的「同寬不同 visible」**不**是 dual-algorithm drift(那個 deterministic 後 fixed),而是 **formula saw transition** — full-fit 跟 need-chip 狀態之間視覺跳變(length=4→4 → length=5→2+3 at same width X≈90px,delta=2)。
2. **判斷標準錯**:Round 1 reproduce 在 X=130px 跑(length=4 和 length=5 都 full fit,saw 不觸發)。我 claim「formula deterministic ✓ PASS」但 user 截圖實機看到的是 saw 視覺問題,reproduce 沒涵蓋。
3. **Select All 排序**:Round 1 我說 Ant Design 用 source order「實機觀察都是這 pattern,可惜 docs 沒明文」— 沒實機驗證、沒 source code 證據。

## User 提的新 success criteria(我推斷)

「同 cell width → 同 overflow 判斷」應該不只指 deterministic,而是:
**Smooth transition** — length=N 跟 length=N+1 at same width 視覺差 ≤ 1 個 avatar(不該跳 2)。

## Formula saw 物理分析

`avatar-stack-overflow.ts` formula:
```ts
// 全 fit 路徑(無 chip):
const fullStackWidth = avatar + (total-1) * (avatar - overlap)
if (fullStackWidth <= availablePx) return total  // 早退,無 chip

// 不全 fit → 需 chip:
const remainder = availablePx - avatar - overflowChipPx
const visible = 1 + Math.floor(remainder / step)
return Math.min(visible, total - 1)  // 至少 1 個 overflow
```

At X=90px, avatar=24, overlap=2, chip=24:
- length=4:fullStack=24+3*22=90 ≤ 90 → return 4(全 fit no chip)
- length=5:fullStack=112 > 90 → 走 chip path。remainder=90-24-24=42。visible=1+floor(42/22)=2。min(2, 4)=2。 → 2 visible + +3
- **saw delta = 2(4→2)**

Saw 來自 3 個物理 cost 同時觸發:
1. 多 1 個 avatar(-22px)
2. 多 chip 預留(-24px)
3. 強制 ≥ 1 overflow(`min(visible, total-1)` cap)

## Codex Round 2 任務

### Q1 真 root cause(refresh)

User 抓的「同寬不同 visible」**真 root cause** 是 ref drop(我前 round claim)還是 formula saw?
請獨立判斷 + 提出證據(grep formula + 比稿 user 截圖物理對應)。

### Q2 判斷標準

「正確」應該是哪種?
- **(a) deterministic only**:同 width 同 length 同 visible。saw 接受。Round 1 我的 reproduce 標準。
- **(b) smooth transition**:length+1 視覺差 ≤ 1 avatar。要求改 formula 或 visual idiom。
- **(c) world-class match**:對齊 Material AvatarGroup / Atlassian AvatarStack / GitHub avatar-stack 真實 source code 行為。

請 cite 三家 world-class avatar stack source code(non-docs,真 GitHub source):
- `@mui/material/AvatarGroup/AvatarGroup.js`
- `@atlaskit/avatar-group` source
- GitHub Primer `AvatarStack` source
- 或 Polaris / Carbon equivalent

判斷他們的 saw 行為:有 saw 嗎?如何處理?

### Q3 Reproduce 改造

Round 1 reproduce 在 X=130px 沒抓到 saw。請建議:
- 確切重現 user 截圖的 reproduce setup(column width 範圍 / state 序列 / Storybook story)
- 加 saw delta assertion:對相鄰 length(N, N+1)at 同 width 量 visible 差,assert ≤ 1

### Q4 Fix proposal

如 saw 是真 bug,fix 方向?(reject / approve / counter-propose):
- **(α) 撤掉 `min(visible, total-1)` 強制 overflow**:full fit threshold 之上才需 chip
- **(β) chip 永遠 reserve**:length≥3 都假設需 chip space(犧牲 length=3 一個 visible)
- **(γ) overflow 視覺改 last-avatar-overlay**(GitHub idiom):chip 疊在最後 avatar 上不佔額外空間
- **(δ) 不修 formula,改 column width**:接受 saw 是物理事實,document 為 expected behavior

### Q5 Select All 排序 — Ant Design 真實源碼

我 Round 1 claim「Ant Design Select multiple = source order」但無 source code 證據。
請用 codex `exec --sandbox read-only` grep `node_modules/antd/es/select`(已 installed)或 WebFetch:
- `react-component/select/src/OptionList.tsx`
- `react-component/select/src/hooks/useCache.ts`
- `react-component/select/src/Select.tsx`

實際看 multiple 模式 value 陣列 ordering 機制:click order append?source order filter?
+ multiple + checkAll(若有)的 value 重置順序。

完整 cite line + 引文。

## 限制

- **不 ship code** Round 2(我前 round false claim 太多)
- 提 verdict 3-column 表(hypothesis / cite / reasoning)
- Layer A 整合後再 propose user 拍板,**不**自動 implement
- 若 sandbox 跑不了 Playwright,明示「Layer C visual missing」

## Output

Markdown:
1. **Q1 verdict**:saw 是 root cause 嗎?
2. **Q2 判斷標準** + 三家 world-class cite
3. **Q3 reproduce 改造** code snippet
4. **Q4 fix proposal** 4 路徑投票
5. **Q5 Ant Design source code 引文** + verdict
