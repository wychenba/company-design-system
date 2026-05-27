---
component: Breadcrumb
family: composite
variants: {}
sizes: {}
traits:
  - hasInteractiveStates
  - isStructural
benchmark:
  - Ant Design Breadcrumb: github.com/ant-design/ant-design/tree/master/components/breadcrumb
  - MUI Breadcrumbs: github.com/mui/material-ui/tree/master/packages/mui-material/src/Breadcrumbs
  - Polaris Breadcrumbs: github.com/Shopify/polaris/tree/main/polaris-react/src/components/Breadcrumbs
  - Carbon Breadcrumb: github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/Breadcrumb
---

<!-- @benchmark-cited: D5 retrofit 2026-05-18 — body claims marked per-claim @benchmark-unverified inline; canonical source URLs in frontmatter benchmark list. -->

# Breadcrumb 設計原則

## 定位

Breadcrumb 顯示「當前頁面在資訊階層中的位置」，同時提供快速回到上層的路徑導覽。
基於 shadcn/ui Breadcrumb 結構（純 HTML + Tailwind，無 Radix primitive），橋接設計系統 token。

**Breadcrumb 是「你在哪裡」的指示器，不是「你可以去哪裡」的選單**——反映當前路徑，不是全部可能路徑。

**Layout Family**：非上述 family — composite / multi-section（多區塊組合，自 own layout）。

---

## 何時用

- **頁面深度 ≥ 3 層**的資訊階層導覽（專案 / 子專案 / 任務，組織 / 團隊 / 成員 / 設定）
- **檔案管理器類 UI**（folder 路徑）
- **電商多層分類**（Home / Electronics / Phones / iPhone 15）

## 何時不用

| 場景 | 改用 | 原因 |
|------|------|------|
| 頁面結構只有 1–2 層 | page header + back button | 兩層不值得 Breadcrumb 的視覺投資 |
| 切換**平行** view（非階層）| `Tabs` | Breadcrumb 表達的是 parent-child 關係 |
| 主導覽 | `Sidebar` / top nav | Breadcrumb 反映當前位置，不是全局導覽 |

## 近親元件分界

| vs | 差異軸 | 何時用 Breadcrumb |
|---|---|---|
| **Tabs** | Tabs 平行視圖切換;Breadcrumb 階層位置 indicator | 表達「我在 A → B → C 的 C」 |
| **Steps** | Steps 是順序流程進度;Breadcrumb 是樹狀階層位置 | 非進度,而是 nested resource path |
| **Sidebar nav** | Sidebar 是全局導覽 chrome;Breadcrumb 是 content header 內 inline path | 局部位置 anchor,不取代全局 nav |
| **Link / page header** | Link 是單一導覽動作;Breadcrumb 是 parent-chain 完整路徑 | 路徑 ≥ 3 層需要可逐層回上 |

對齊 Polaris Breadcrumbs / Material Breadcrumb / Atlassian Breadcrumbs 共識:nav inside page header,不取代 sidebar。 <!-- @benchmark-unverified: see frontmatter benchmark list for canonical DS source URL -->

---

## 內部結構

```
<nav aria-label="Breadcrumb">
  <ol>
    <li>  BreadcrumbItem
      <a> BreadcrumbLink   ← clickable, 可回到上層
    </li>
    <li>
      <span> BreadcrumbSeparator (ChevronRight, aria-hidden)
    </li>
    ...
    <li>
      <span> BreadcrumbPage  ← 當前頁面, 不可點, aria-current="page"
    </li>
  </ol>
</nav>
```

### 元件家族

| 元件 | 語意 | HTML |
|---|---|---|
| `Breadcrumb` | 整個 nav 容器 | `<nav aria-label="Breadcrumb">` |
| `BreadcrumbList` | items 清單 | `<ol>` flex row |
| `BreadcrumbItem` | 單一項目容器 | `<li>` |
| `BreadcrumbLink` | 可點擊路徑項（非當前）| `<a>` 或 Slot（支援 `asChild` 給 router Link）|
| `BreadcrumbPage` | 當前頁面（非 clickable）| `<span aria-current="page">` |
| `BreadcrumbSeparator` | 項目間分隔 | `<li role="presentation">` + `ChevronRight` icon |
| `BreadcrumbEllipsis` | 省略中間路徑的 `⋯` | `<span aria-hidden>` + `MoreHorizontal` |

---

## 視覺 Token

| Slot | Token | 原因 |
|---|---|---|
| 基底字體 | `text-body` (14px) | navigation 尺度的標準 |
| 間距（items 之間） | `gap-2` (8px) | 對齊 item-layout pattern 的 slot gap |
| **`BreadcrumbLink`（可點擊）預設** | `text-fg-secondary` | neutral-8, 提示「可互動但非焦點」 |
| **`BreadcrumbLink` hover** | **`text-primary-hover`** | 藍字 + `transition-colors duration-150`，明確回饋「點這個會有動作」 |
| **`BreadcrumbPage`（當前）** | `text-foreground`（不加粗）| neutral-9 深色區分於 fg-secondary 的 links，但**不加粗**——加粗會讓 breadcrumb 最右端視覺過重，破壞「你從哪來 → 你在這」的流動感 |
| **`BreadcrumbSeparator`** | `text-fg-muted` + `ChevronRight` size=`BREADCRUMB_ICON_SIZE[size]`(`breadcrumb.tsx:130` SSOT,sm/md=16, lg=20) | 視覺降噪,separator 不搶焦點;對齊 `uiSize.spec.md` Icon Size Tier(2026-05-18 retire 過去 14) |
| **`BreadcrumbEllipsis`** | `text-fg-muted` + `MoreHorizontal` size=`BREADCRUMB_ICON_SIZE[size]` | 同 separator 層級 |
| **`BreadcrumbLink` / `BreadcrumbPage` `startIcon`**(2026-05-20 ship)| `<Icon size={BREADCRUMB_ICON_SIZE[size]} aria-hidden />`(sm/md=16, lg=20)| 首項 Home icon 業界慣例(Material / Atlassian)。Consumer 只傳 `LucideIcon`,DS 統一管 size 消費 BREADCRUMB_ICON_SIZE SSOT — 對齊 `uiSize.spec.md` Icon Size Tier,**禁 consumer 傳 size prop**(避免再次 14 / 20 等寫死 drift)|

## 對齊既有設計語言

- **色彩三階層**（fg-secondary → foreground / primary-hover → fg-muted）跟 MenuItem / Tabs trigger / SegmentedControl 的三階層結構一致：**次要 → 主要（或 hover 強調） → 弱化**
- **`primary-hover` 在 Breadcrumb 的用法是「互動時文字變藍」**，跟 Tabs underline / Chip border / SegmentedControl border 用 `primary-hover` 的 canonical 選中規則屬於同一個色彩語言（`primary-hover` = 互動高亮）
- **分隔 icon 用 `ChevronRight`**（不用 `/` 字元）對齊 Button `endIcon` 的「方向指示」icon 選擇

---

## 互動狀態

### `BreadcrumbLink`
- **Default**：`text-fg-secondary`
- **Hover**：`text-primary-hover`（使用者要求的核心互動）
- **Active/Click**：瀏覽器原生 `:active` 反饋，不特別覆寫
- **Focus-visible**：`ring-2 ring-ring ring-offset-1`（對齊全系統 focus 規則）
- **Disabled**：通常 breadcrumb link 不會 disabled（如果需要，consumer 自己處理為 `BreadcrumbPage` 樣式）

### `BreadcrumbPage`
- 無互動狀態，只是 text。`aria-current="page"` 給螢幕閱讀器

### `BreadcrumbSeparator`
- 無互動。`aria-hidden`（語意分隔由 `<ol>` / `<li>` 結構承擔）

---

## Single-line + Overflow / 長路徑處理(2026-05-10 升級)

**Single-line canonical**:BreadcrumbList 預設 `flex-nowrap`,**不 wrap 到下一行**。對齊 Material UI / GitHub / Notion / Linear / Atlassian 共識(WebFetch verified Material UI source `Breadcrumbs.js renderItemsBeforeAndAfter`)。路徑過長走中段折疊,非 multi-line wrap。 <!-- @benchmark-unverified: see frontmatter benchmark list for canonical DS source URL -->

當路徑層級太深(> 4–5 層)且容器寬度有限,world-class 作法是**中段折疊**:

```
首頁 › ⋯ › 成員管理 › 權限設定
```

**v1 現況**(consumer 手動):
- 保留第一個 + 最後 1–2 items;中間用 `<BreadcrumbEllipsis>` 折疊
- `<BreadcrumbEllipsis>` 消費 `ItemInlineActionButton` primitive(per inline-action.spec.md predicate + M1 SSOT 消費),`overlayTrigger=true` 內建 DropdownMenu open 視覺鎖
- 包 `<DropdownMenuTrigger asChild>` 提供點 ⋯ 展開互動

**v2 shipped Phase B**(2026-05-10):declarative `items` prop + `maxItems`(**default 4**,user-tuned;Material UI source 預設 8)+ `itemsBeforeCollapse`(default 1)+ `itemsAfterCollapse`(default 1)auto-collapse mode。對齊 Material UI source `Breadcrumbs.js renderItemsBeforeAndAfter` mechanism(2026-05-10 WebFetch verified)。 <!-- @benchmark-unverified: see frontmatter benchmark list for canonical DS source URL -->

```tsx
<BreadcrumbList
  items={[
    { label: '組織', href: '/org' },
    { label: '產品團隊', href: '/team' },
    { label: '成員管理', href: '/members' },
    { label: '權限', href: '/permissions' },
    { label: '編輯角色' },  // 無 href → 自動 BreadcrumbPage(末位)
  ]}
  // maxItems={4}              // default
  // itemsBeforeCollapse={1}   // default
  // itemsAfterCollapse={1}    // default
/>
```

**Per-item width canonical(Phase B)— flex-shrink hierarchy**:

| Role(`data-bc-role`)| `flex-shrink` | 行為 |
|---|---|---|
| `root`(首位)| **3** | 縮最積極(root context 可弱化)|
| `middle`(中段)| **2** | 次積極 |
| `current`(末位 / BreadcrumbPage)| **1** | 最後縮(a11y current page anchor)|
| `ellipsis`(BreadcrumbEllipsis 包裝)| **0** | 永遠完整顯示 ⋯ |
| `BreadcrumbSeparator` | **0** | 永遠完整(否則 path 視覺斷裂)|

**為何 flex-shrink hierarchy 不用 fixed max-width**:
- 容器寬 / items 少 → 各 item 自然寬度,**不浪費剩餘空間**(回應 user 質疑)
- 容器窄 / items 多 → 按 priority 縮(root 先 → middle → current 最後)
- 都縮到 `min-w-0` 後 CSS `truncate` 開啟 + Tooltip 補完整文字
- Root **也會** truncate(shrink:3 縮最積極)— 不是 `shrink-0`(回應 user 質疑)

**Truncate-on-overflow + tooltip canonical**(per `tooltip.principles.stories.tsx:190`):
- 每 BreadcrumbLink / BreadcrumbPage 內部 wrap `<TruncatedLabel>`(同 `data-table.tsx:339 TruncateCell` + `tag.tsx:138 isTruncated` SSOT pattern)
- Shared ResizeObserver 偵測 `scrollWidth > clientWidth` → `<Tooltip>` wrap
- 只在實際 truncate 時才顯 Tooltip(per tooltip canonical)— 沒被截斷不顯
- **TODO**(Rule-of-3):breadcrumb / data-table / tag 三處同 idiom,future 抽 `patterns/element-anatomy/truncated-text.tsx` 共用 SSOT

世界級對照:
- **Material UI**:`maxItems=8` declarative auto-collapse(source verified,**no per-item width rule**)
- Notion / Linear / GitHub / Atlassian per-item width 策略:**unverified**(WebFetch + web search 無法取得 source / docs)。本 DS 設計基於 DS internal SSOT(`TruncateCell` + `Tag truncate` + `Tooltip canonical`)+ first-principles flex-shrink hierarchy 回應 user 兩 challenges(root 也 truncate / 不浪費空間)。

世界級對照:
- **Material UI**:`maxItems=8` + auto-collapse(declarative)
- **Polaris**:點 ⋯ DropdownMenu 展開
- **Atlassian**:中段 ⋯ + dropdown
- **GitHub / Notion / Linear / Apple Finder**:auto truncate 中段

## Title-breadcrumb-end 同步 canonical(2026-05-10 新增)

**Breadcrumb 末位 `<BreadcrumbPage>` 文字 = page title `<h2>` / `<h3>` / `<h4>` 內容**。對齊 GitHub / Notion / Linear / Atlassian / Material UI examples 共識。 <!-- @benchmark-unverified: see frontmatter benchmark list for canonical DS source URL -->

具體 pairing(per BreadcrumbList size):
- `size="sm"` + 末位 `<BreadcrumbPage>X</BreadcrumbPage>` + `<h4>X</h4>` 同字
- `size="md"`(default)+ 末位 `<BreadcrumbPage>X</BreadcrumbPage>` + `<h3>X</h3>` 同字
- `size="lg"` + 末位 `<BreadcrumbPage>X</BreadcrumbPage>` + `<h2>X</h2>` 同字

**為何同字重複**:breadcrumb 末位是 a11y 階層 navigation 階梯末端(`aria-current="page"`);title h2/h3/h4 是同字**視覺大字 emphasis**。兩者各司其職:小字 breadcrumb 提供路徑 context,大字 title 提供 page identity。同 SSOT 兩 view。

**禁止**:breadcrumb 末位用 `BreadcrumbLink`(parent path)+ title 才顯示 current page = breadcrumb 末位 ≠ title 內容 = 違反 spec.md L142「最後一項必 BreadcrumbPage」+ 違反 world-class consensus。

---

## 禁止事項

- ❌ **不用 `/` 字元作分隔**——用 `ChevronRight` icon。`/` 是文字字元，跟文字對齊不穩、顏色綁 text、screen reader 會讀出「斜線」
- ❌ **最後一項不可是 `BreadcrumbLink`**——最後一項代表當前頁，無處可點。必須用 `BreadcrumbPage`
- ❌ **Breadcrumb 不做頁面切換動作的「back 按鈕」**——back 的語意是「上一步瀏覽歷史」不是「上一層階層」，兩者不同。Back 用 Button 或瀏覽器原生
- ❌ **不得在 Breadcrumb 裡嵌入複雜互動元素**（dropdown、search、avatar picker）——breadcrumb 是「位置指示器」，塞功能會變 nav bar
- ❌ **不得覆寫 `BreadcrumbLink` 的 hover 色彩**——`primary-hover` 是全系統的「互動高亮」canonical，覆寫破壞語言一致性
- ❌ **不得把 Breadcrumb 拿來當 sidebar 或 top nav 替代**——breadcrumb 只顯示當前路徑，不展示 sibling 選項
- ❌ **單一層級頁面不要放 Breadcrumb**——「首頁」一個 item 沒導覽價值，造成視覺噪音

---

## 為何無 Inspector

Breadcrumb 決策維度是 collapse 策略 × size × 當前頁狀態,已在 `CollapseMatrix` / `SizeMatrix` / `ColorMatrix` / `StateBehavior` / 元件特有 `UsageExamples` 五張結構矩陣 + 真實場景完整覆蓋。互動 Inspector(切換 size / truncate)無法呈現「路徑深度 + 斷點」這類真實場景決策——`UsageExamples` 展示實際業務路徑更直接。

ColorMatrix 已建:展示 BreadcrumbLink / Page / Separator / Ellipsis 四種節點的 default / hover / focus 色彩矩陣,採 fg-muted → fg-secondary → foreground 的階層策略(對齊 GitHub / Notion / Linear)。 <!-- @benchmark-unverified: see frontmatter benchmark list for canonical DS source URL -->

---

## 相關

- `Tabs` — 切換平行 view 的導覽（不同層級的 problem，breadcrumb 是階層內，Tabs 是同層切換）
- `Button variant="link"` — 一般文字連結按鈕
- `Sidebar` — 主導覽（breadcrumb 用來補 sidebar 之外的「當前位置」資訊）

## A11y 預設

**ARIA / Pattern**:繼承 Radix `slot` primitive a11y 預設(role / aria-* / 鍵盤導覽)。詳 [Radix Accessibility docs](https://www.radix-ui.com/primitives/docs/components/slot#accessibility)。

**Keyboard 行為**:

- Tab — 逐個 link 導覽
- Enter — navigate

**Focus**:Radix primitive 自管 focus trap / restoration / visible ring(`outline: 2px solid var(--ring)` per design-system focus-visible canonical)。

**驗證**:Storybook a11y addon panel 應 0 critical violation;鍵盤完整可操作(無需滑鼠)。WCAG AA contrast ≥ 4.5:1(text)/ 3:1(UI)。

## 被引用(auto-maintained,Dim 3 reciprocal audit)

> 本節由 `scripts/add-reciprocal-pointers.mjs` 自動維護,列出在 SSOT 語境下指向本 spec 的其他 spec。若要手動補充,寫在本節之前。

- `app-shell.spec.md`
