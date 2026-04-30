# LayoutSpace 設計原則

Layout Space 定義頁面與容器的巨觀間距 token,隨 density 自動縮放(透過 `data-density` 或 `data-layout-space`)。

## Token 表

| Token | md | lg | 語意 |
|-------|----|----|------|
| `--layout-space-loose` | 16px | 24px | 主間距:容器水平 padding、parallel 元素 gap、bounded region 呼吸空間 |
| `--layout-space-tight` | 12px | 16px | 緊湊間距:Header → element、functional 交互的元素之間 |
| `--layout-space-bottom` | 48px | 48px | 結論留白:內容到 action buttons / Dialog-class 大容器底部 |

**為什麼 bottom 不隨 density 變**:48px 是「結論前的留白」— content 到 action buttons 的視覺暫停。跟 density 無關(不論 compact 或 comfortable,使用者都需要「commitment 前」的節奏)。

---

## 元件角色:`region` / `element`(scope-relative)

**沒有元件級固定分類** — 角色是元件在「該層 layout」裡扮演的,不是元件本質。CSS `display` 跟此分類**無關**(避免撞名,2026-04 從 v1 `block` / `inline` 改為 `region` / `element`)。

| 角色 | 定義 |
|------|------|
| **region** | 寬高占主要空間(寬度撐滿、高度通常 flex-1 撐剩餘)/ 視覺畫布 / 該層展示主角 |
| **element** | 局部塊 / 控件感 / 寬高自然 |

### region 子分類

| 子類 | 條件 | 視覺邏輯 |
|-----|------|---------|
| **bounded** | 有視覺邊界:底色 / 邊框 / 明確上下分隔線(Card / Table with borders / Panel with chrome)| 邊界清楚,容器靠 outer padding 給 spacing |
| **unbounded** | 無視覺邊界:純 vertical collection,**靠 list 自帶 py + item 自帶高度**撐起視覺平衡(Cmd+K menu / Sidebar nav / unstyled list)| 邊界由 list 自帶 py 完成,outer padding = 0 才視覺對稱 |

### 判斷 3 題(scope-relative)

每進一層 layout container 重新判斷該層的子元件:

1. 該層占主要空間嗎?(寬+高占主導 → region;局部 → element)
2. 視覺重量是「畫布」還是「控件」?
3. 是該層展示主角,還是一塊區段?

任何元件(list / table / code block / image / form section / chart / sidebar)都套同邏輯。例:
- Page body 直接放 Table → Table = bounded region(該層展示主角 + 有 borders)
- Cmd+K menu list → list = unbounded region(主角 + 無 chrome,自帶 py)
- InfoPanel 內 DescriptionList → element(只是一塊,不主導)
- Field 內 Textarea → 不獨立分類(Field 整體才是該層的 element)

---

## 親疏 3 級(替代 v1 簡單 block-adjacent)

判斷兩元素的 spacing 規則前,先確定它們屬哪一級:

| 級別 | 條件 | layout rule? |
|------|------|------------|
| **同範疇 / bundled component family** | 元件 spec 寫成 bundle 並定 inter-component spacing(FileUpload+FileList、Pagination 內部、Toolbar+ButtonGroup) | 元件 spec own,layout rule **跳過** |
| **跨範疇 + 直接 functional 交互 / 依賴** | search → filter list / heading → labeled content / toolbar → table / form section heading → fields | 規則 3 = **tight** |
| **跨範疇 + parallel / independent** | form fields stack(parallel inputs)/ unrelated sections / 兩個獨立 functional groups | 規則 3 = **loose** |

「**Bundled component family**」客觀判斷:**有沒有 spec 文件把這些 components 寫成 bundle 並定義它們之間 spacing**(不是「同種類 component instance 多個」)。

「**Functional 交互 / 依賴**」具體:操作後在畫面上有交互(value 驅動 display)/ labeling(命名 / 描述 group identity)/ context dependency。

---

## 6 條 Layout 規則

### 規則 1:水平 padding(3 patterns 並存)

| Pattern | padding 寫哪 | 適用場景 |
|---------|------------|---------|
| **A. 元件自帶**(`px-loose` on root) | 元件 root | 有視覺邊界(border / bg / shadow / chrome):Sidebar / SurfaceHeader / Toolbar / Card / Panel |
| **B. 父層管**(consumer 或 wrapper) | 父層 div | 純 layout primitive 無邊界:Table / DescriptionList / DataTable(naked structure)|
| **C. Item 自帶**(each item `px-loose`,list naked)| 每個 item | List with hover row,hover bg 需 flush 容器邊界:Cmd+K menu / DropdownMenu items / Sidebar nav |

任何內容左右 padding 最終 = `loose`(對齊 inline 元件邊緣);**寫哪看元件本質**,不是 either-or。

Pattern C 的視覺邏輯見 `overlay-surface.spec.md`「Hover bg 貼邊 chrome」(hover bg 0 gutter 貼邊 + content 由 item-px 推進)。

### 規則 2:頂部(Header → 第一個元素)

| 第一個元素 | Header → 該元素 |
|-----------|--------------|
| **bounded region**(table / card / panel)| `loose` |
| **unbounded region**(自帶 py 的 list / nav stack)| **0**(讓 list 自帶 py 撐 spacing) |
| **element**(input / button / alert) | `tight` |

### 規則 3:元素間 gap(**只看親疏,role 無關**)

| 親疏 | gap |
|------|-----|
| **同範疇 / bundled** | 元件 spec own(跳此 rule)|
| **跨範疇 + functional 交互** | `tight` |
| **跨範疇 + parallel** | `loose` |

**核心**:gap 只看親疏不看 role(原 v1「block-adjacent 一律 tight」過機械,違 Gestalt proximity)。

世界級對齊:Material 3 / Polaris / Apple HIG / Atlassian 都按「relationship not type」決定 spacing。

### 規則 4:底部

| 情境 | gap |
|------|-----|
| **任何最後內容 → action buttons**(role 無關)| `bottom`(48)|
| **bounded region → 容器底 / 底部 chrome band**(無 action buttons)| `loose` |
| **unbounded region → 容器底** | **0**(list 自帶 py 撐)|
| **element → 容器底**(generic fallback)| `tight` |

**Dialog-class 大容器**:元件 spec 自帶 `pb-*` 規則(如 Dialog body `pb-bottom`)→ 元件 spec own,layout rule 跳過。

「Dialog-class」客觀判斷:**該元件 spec 自帶 `pb-*` canonical 即是**(eg `dialog.spec.md:70` 寫 `pb-bottom`)。

「**底部 chrome band**」定義:Alert / BulkActionBar / Status bar / Footer 等附著於容器底部的 chrome elements。

### 規則 5:橫排 Input Gap(固定不隨 density)

橫排並列的 input fields **固定 gap,不走 layout-space token**:

| 關聯性 | Gap | 範例 |
|---|---|---|
| 緊密相關(同一組值的起迄)| `gap-2`(8) | Sleep start ↔ Sleep end |
| 非緊密(不同組值並列)| `gap-4`(16) | Sleep 時段 ↔ Work 時段 |

**為什麼固定**:這是 field 級 micro-spacing,跟容器級 macro-spacing 是不同維度。Field gap 由**內容語意**決定(緊密 vs 獨立),不由 density 決定。

### 規則 6:Chrome 水平左右 padding(規則 1 specialization)

**所有 chrome 表面**(SurfaceHeader / SurfaceFooter / SurfaceBody / Sidebar header / FileViewer toolbar+filmstrip+InfoPanel header / app top bar / page header)**水平左右** padding 統一 `px-[var(--layout-space-loose)]`(md=16 / lg=24,density-aware)。

**為何 loose 而非 tight**:Chrome 是 surface 視覺邊界 + 內容呼吸區;`tight` 足夠 inline list item,chrome 需更穩定 anchor 讓 title / dismiss / actions 不貼邊。

**M8 8 家世界級對照**(default density 共識 16px):Material 3 Top App Bar 16dp / Carbon UI Shell 16px / Polaris Page Header 16px / Atlassian Page Header 16px / Apple HIG macOS Toolbar 16-20pt / Linear / Notion / GitHub Primer / Figma 全 16px。

**禁止**:硬寫 `px-4` / 自創值(`px-5`)/ 用 tight 當 chrome inline / 同 surface header/body/footer inline padding 不一致(三層左邊界必對齊)。

---

## 心智模型(三步推理)

1. **判角色**:region(bounded / unbounded)/ element
2. **判範疇**:
   - 同範疇 / bundled → 元件 spec 管,跳過 layout rule
   - 跨範疇 → 看 functional 交互 → 相關(tight)/ 不相關(loose)
3. **套規則**:
   - 規則 2/4 看 role + bounded/unbounded + 方位 + 是否 action button
   - 規則 3 只看親疏(同範疇跳過 / 相關 tight / 不相關 loose)

---

## 典型容器範例

### Form 情境(Field stack 在 Dialog 內)

```
┌────────────────────────────────────┐
│  Title                        [X]  │  ← SurfaceHeader (chrome, py-tight)
├────────────────────────────────────┤
│← tight ─────────────────────────→ │  ← Header → element (規則 2)
│  ← loose → [Name input]   ← loose →│
│← loose gap ─────────────────────→ │  ← 跨範疇 parallel form fields (規則 3 不相關)
│  ← loose → [Description]  ← loose →│
│← loose ─────────────────────────→ │
│  ← loose → [Other field]  ← loose →│
│← bottom 48 ────────────────────→  │  ← Dialog body pb-bottom (元件 spec own)
├────────────────────────────────────┤  ← SurfaceFooter border-t
│  ← loose → [Cancel] [Save] ← loose →│  ← Footer (chrome, py-tight)
└────────────────────────────────────┘
```

### Page 情境(全頁 list / dashboard)

```
┌────────────────────────────────────┐
│ ← loose → [Toolbar items] ← loose →│  ← Toolbar(自帶 py-tight,跨範疇 functional → table 規則 3 tight)
│╔══════════════════════════════════╗│
│║← loose → DataTable       ← loose →║│  ← bounded region(規則 1 內 px = loose)
│╚══════════════════════════════════╝│
│← loose ─────────────────────────→  │  ← bounded region → 底部 chrome band(規則 4)
│ ← loose → [Alert hint]    ← loose →│  ← 底部 chrome band
│ ← loose → [BulkActionBar] ← loose →│
└────────────────────────────────────┘
```

### Unbounded list-as-region(Cmd+K menu / Sidebar nav)

```
┌─────────────────┐
│  ← Header chrome │
├─────────────────┤  ← border-b
│ ← list py-2 ──→ │  ← list 自帶 py (上)
│ ← item py-1.5 → │  ← item 自帶 py
│ ← item py-1.5 → │
│ ← item py-1.5 → │
│ ← list py-2 ──→ │  ← list 自帶 py (下)
└─────────────────┘  ← unbounded region → 容器底 = 0(list 自帶 py 撐)
```

### 橫排 Input Gap(規則 5)

```
[*Sleep start][8px][*Sleep end]  [16px]  [*Work start][8px][*Work end]
 └── 緊密相關 ──┘                └── 非緊密 ──┘ └── 緊密相關 ──┘
```

---

## 模式切換

```html
<html data-density="md">
```

```ts
document.documentElement.setAttribute('data-density', 'lg')
```

單獨控制版面間距而不影響元件尺寸:

```ts
document.documentElement.setAttribute('data-layout-space', 'lg')
```

---

## 為什麼不建 FormLayout primitive

之前曾考慮 `<FormLayout>` 自動套規則 1-4。確認**不建**:

- 規則 1-6 是 universal — Form / Page / Dashboard / Dialog / Card 全部吃同樣,不該為「form」單獨封裝
- 角色判斷是 scope-relative 業務情境,自動偵測會把固定假設寫死(eg 假設 Textarea 一律 element 是錯的)
- Consumer 直接套 className 反而透明、易 debug

**真正獨特、值得封裝的只有 action-button footer chrome**(border-t + px-loose + py-tight + 內部 button group canonical),已在 `overlay-surface.spec.md`(SurfaceFooter)+ `action-bar.spec.md` 處理。Footer 上方那 48px(`--layout-space-bottom`)是 body 自己的 `pb-bottom`,不屬 footer chrome。

## v1 → v6 演化

- v1(2026-03):block / inline 二分,規則 3「block-adjacent 一律 tight」機械
- v6(2026-04-30):
  - 命名換 region / element(避 CSS display 撞名)
  - region 加 bounded / unbounded 子分類
  - 規則 3 改「親疏 3 級」(同範疇 / 跨範疇相關 / 跨範疇不相關),元件 role 無關
  - 加「同範疇 / bundled component family → 元件 spec own」分權層
  - 規則 1 加 padding 3 patterns(元件自帶 / 父層管 / item 自帶)
  - 規則 4 加「Dialog-class 大容器元件 spec own」例外處理
  - 規則 2/4 加 unbounded region = 0(list 自帶 py 撐)

---

## 被引用(auto-maintained,Dim 3 reciprocal audit)

> 本節由 `scripts/add-reciprocal-pointers.mjs` 自動維護。

- `description-list.spec.md`
- `empty.spec.md`
- `overlay-surface.spec.md`
- `dialog.spec.md`
- `file-viewer.spec.md`
