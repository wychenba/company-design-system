# Feedback — Disabled state precedence + Overlay scroll chain

**Codified**: 2026-05-04（本 session 5+ 次糾正後 codify）

---

## Theme 1 — Disabled state 顯著性優於 muted（M24）

**User 多次糾正 root cause**：Claude 在 disabled 元件內 placeholder 仍用 `text-fg-muted`(neutral-7) 而非 `text-fg-disabled`(neutral-6)。User 第 5+ 次提才把這條升 SSOT codify。

**真實 violation 紀錄**(grep verified 2026-05-04):
- `field-wrapper.tsx:103` `bareInputStyles` 永遠 `placeholder:text-fg-muted`
- `select.tsx:89` plain mode empty 用 `text-fg-muted` 不分 mode
- `select.tsx:139` searchable !value 同
- `select.tsx:167` tag mode placeholder 同
- `textarea.tsx:34` 同 bareInputStyles
- `input.tsx:143` ✓ 唯一做對 — 有 `disabled:placeholder:text-fg-disabled`

**Why 我反覆出錯**:
- 把 `text-fg-muted` 當「弱化文字」通用 token，沒區分「state vs emphasis」
- placeholder 是 emphasis 載體 → 預設套 muted；但元件 disabled = state 載體（語意更強），state 應勝 emphasis
- 沒有 hook / spec canonical 提醒 → Claude 每次都 default 套 muted

**Codify**(本 session 完成):
- M24 in `.claude/rules/meta-patterns.md`
- `tokens/color/color.spec.md` 「Disabled state precedence canonical」段
- `field-wrapper.tsx` `bareInputStyles` 加 `group-data-[field-mode=disabled]/field:placeholder:text-fg-disabled`
- `field-wrapper.tsx` `fieldWrapperStyles` 加 `group/field` base class
- `select.tsx` `ReadonlyDisplay` 加 `emptyColorCls = mode === 'disabled' ? fg-disabled : fg-muted`
- `textarea.tsx` 加 `disabled:placeholder:text-fg-disabled`
- Hook `check_disabled_placeholder_color.sh` write-time 攔
- Audit dim 34 batch verify 既有 DS

**Self-improve**: 下次寫 placeholder 必先想「這是什麼 state context」。disabled / error / warning 都該 state-precedence over decoration。

---

## Theme 2 — Overlay scroll chain invariant（M25）

**User 糾正紀錄**：「filter 高度有 viewport 縮，但 body 內容過長根本無法捲動，這一定只是冰山一角...」User 第 1 次抓到 = NameCard 有同問題早期已修，這次 Filter / Sort panel 又重犯（M10 violation:沒掃 DS-wide）。

**真因**: PopoverContent 設了 `max-h + flex flex-col + overflow-hidden`,SurfaceBody 設了 `flex-1 min-h-0 overflow-y-auto`,但**中間任何 wrapper div 沒 forward `flex flex-col h-full` 就斷鏈**。
- Filter panel root div: `<div ref={ref} className="w-[640px]">` ← 斷鏈
- Sort manager root div: `<div className="w-[480px]">` ← 斷鏈
- NameCard ✓: 直接是 PopoverContent child + 自設 max-h flex-col,無中間 wrapper

**Why 我沒抓到**:
- 上 commit 改了 SurfaceBody + PopoverContent 但**沒驗 chain 整鏈**(只看 PopoverContent 的 className,沒走「root → SurfaceBody」DOM path)
- Visual snap 測時 viewport 沒縮夠小,沒觸發 overflow case → 假 verify

**Codify**(本 session 完成):
- M25 in meta-patterns.md
- `patterns/overlay-surface/overlay-surface.spec.md` 「Viewport-aware scroll chain invariant」段
- `data-table-filter-panel.tsx` root div 加 `flex flex-col h-full`
- `data-table-sort-manager.tsx` root div 加 `flex flex-col h-full`
- Hook `check_overlay_panel_scroll_chain.sh` write-time 攔
- Audit dim 35 batch verify 既有 panels

**Self-improve**: 下次驗 overlay 必走「root → leaf」整鏈 trace,不只看 leaf 屬性。Visual verify 必含 viewport-shrink case(縮到 250px 高試)。

---

## 共通 lesson — Stop hook claim-verify gap

兩 theme 都是「我 claim verified 但實際沒驗到」:
- M24:placeholder 改 fg-muted vs fg-disabled,我從沒驗過 disabled 場景的 placeholder visual diff
- M25:scroll chain,我從沒驗過 viewport-shrink 觸發 overflow case

下次:每次 claim 必含 verify scenario list（明確列出已驗的 case),user 才好驗 claim 真假。
