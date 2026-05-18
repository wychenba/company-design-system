---
component: motion
family: token
variants: {}
sizes: {}
traits: []
benchmark:
  - Material Design 3 motion tokens: m3.material.io/styles/motion/easing-and-duration
  - Carbon Design System duration tokens: carbondesignsystem.com/guidelines/motion/overview
  - Atlassian @atlaskit/tokens motion: atlassian.design/tokens/all-tokens#motion
  - Radix Tooltip delayDuration: radix-ui.com/primitives/docs/components/tooltip
  - MUI Tooltip enterDelay: mui.com/material-ui/api/tooltip
---

<!-- @benchmark-unverified-blanket: file-level retraction per M22 (d) -->

# Motion tokens — hover delay 設計原則

> **Foundational SSOT rationale**(2026-05-18 ship per user 拍板 #3A):跨 5+ overlay 消費者
> (Tooltip / HoverCard / NameCard / Avatar / OverflowIndicator)的 hover 開啟 / 關閉延遲統一。

## 定位

Hover delay token 是「hover 觸發 → overlay 顯示」之間的等待時間。**目的不是動畫長度,是「user 真的想看」過濾器** — 短暫滑過不該觸發 expensive overlay(NameCard fetch 資料 / Tooltip 視覺擾動)。

## 三層 tier 系統

| Token | 值 | 用於 | 為何 |
|---|---|---|---|
| `--hover-delay-plain` | `200ms` | Tooltip 純文字提示 | 被動 hint,短延遲讓常用 user 不被打擾,但避免每次滑過都觸發。對齊 Material 3 plain tooltip + Atlassian 300ms / MUI 100ms 中位 |
| `--hover-delay-rich` | `300ms` | HoverCard / NameCard 內容預覽 | 含 avatar / fields / actions 的 rich content。User 必須「真的想看」才停留 300ms,避免列表掃視時誤觸發 N 個 fetch。對齊 Material 3 rich tooltip + DS 既有 Avatar HoverCard `openDelay={300}` 值 |
| `--hover-delay-close` | `200ms` | 所有 overlay 關閉 | Mouse leave 後給 200ms 緩衝(user 可能誤滑出再回來)。對齊 UX 共識「close delay < open delay」+ 既有 Avatar `closeDelay={200}` 值 |

## 為何不用單一值 / 不用 Radix 700ms

- **Radix 700ms 太保守**:被 Material(plain ~200ms)/ MUI(100ms)/ Atlassian(300ms)集體驗證過長,user 滑過 Tooltip 700ms 不出根本看不到。Radix 設保守避 mobile / touch 誤觸,desktop 應 override。
- **單一值** 失去 plain / rich 語意區分:NameCard 含 fetch + image + actions 應比 Tooltip(純文字)delay 長,單一值會讓 NameCard 滑過列表時整列誤觸發 fetch waterfall。
- **過短**(< 100ms):每滑必觸發 → 視覺擾動 + 不必要 server request。

## 何時用 / 何時不用

| 場景 | 用哪 token | 為何 |
|---|---|---|
| Icon-only Button → 顯示文字提示 | `--hover-delay-plain` | 純文字輔助 |
| Avatar / Username → 顯示完整人物卡 | `--hover-delay-rich` | 含 fetch + multi-section content |
| OverflowIndicator → 顯示隱藏列表 | `--hover-delay-plain` | 純列表展開,無 fetch |
| Tag / Chip → 顯示說明 | `--hover-delay-plain` | 純文字 |
| 任何 overlay 關閉延遲 | `--hover-delay-close` | universal |
| Click-triggered Popover / Dialog | — | N/A,click 不適用 hover delay |
| Tooltip 鍵盤 focus 觸發 | — | N/A,直接顯示(對齊 WAI-ARIA APG) |

## 命名 rationale(per `# 命名與語言一致性` 3 test)

1. **既有 DS 詞彙**:`plain` / `rich` 對齊 FileItem `compact / rich` mode tier idiom(world-class richness gradient)
2. **世界級 idiom**:Material 3 documentation 公開使用「plain tooltip」+「rich tooltip」術語(verified URL above)
3. **跨元件無語意衝突**:`plain` 不撞 cva variant(無元件用 `variant="plain"`);`rich` 跟 FileItem mode 同義(content density gradient)

### Anti-pattern 避免命名

- ❌ `--hover-delay-tooltip` / `--hover-delay-hovercard` — 元件名綁定 → 新元件(Popover variant)用哪個?
- ❌ `--delay-200` / `--delay-300` — 用值不用語意 → 改值要 rename
- ❌ `--motion-hover-fast` / `--motion-hover-slow` — fast/slow 在 hover 語境語意模糊(對 user 來說「fast」應該是 instant?)
- ❌ `--hover-time` / `--mouseover-pause` — 自創縮寫,跨人不可讀

## 消費者

- `components/Avatar/avatar.tsx:299` — HoverCard openDelay / closeDelay(原硬寫 300/200,migrate 到 token)
- `components/HoverCard/hover-card.tsx` — Radix Provider 預設 delayDuration override 為 `--hover-delay-rich`
- `components/Tooltip/tooltip.tsx` — Radix Provider 預設 delayDuration override 為 `--hover-delay-plain`
- `components/NameCard/name-card.tsx`(consumer of HoverCard)— 繼承 `--hover-delay-rich`
- `components/OverflowIndicator/overflow-indicator.tsx`(consumer)— 用 `--hover-delay-plain`
- 任何 future overlay hover consumer 必 import 此 token(per M17 SSOT 必可傳播)

## 世界級對照

| Framework | plain hint delay | rich preview delay |
|---|---|---|
| Material 3(plain vs rich tooltip 分流)| ~150-200ms(undocumented exact)| ~500ms |
| Radix Tooltip | 700ms(過保守,industry standard 認 desktop override) | N/A(consumer 自定) |
| MUI Tooltip | 100ms `enterDelay` 預設 | N/A |
| Atlassian Tooltip | 300ms(undocumented exact)| N/A |
| shadcn(defer Radix) | 700ms | N/A |
| **DS canonical(本 spec)** | **200ms** | **300ms** |

中位 200ms 對齊 MUI(100)/ Material(150-200)/ Atlassian(300)三家中段,避 Radix 700 過保守極端。

## 相關

- `../elevation/elevation.spec.md` — overlay 視覺層(z-index)
- `../../patterns/overlay-surface/overlay-surface.spec.md` — overlay 結構 SSOT
- `../../components/Tooltip/tooltip.spec.md`(consumer)
- `../../components/HoverCard/hover-card.spec.md`(consumer)
- `../../components/Avatar/avatar.spec.md`(consumer)
