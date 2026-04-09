# Color Token Spec

## 架構流派定位

業界四大世界級色彩 token 流派各有取捨。我們選擇 **Atlassian 流派**（semantic state token），並有意識地拒絕其他三個。理解這個選擇對日後維護至關重要。

| 流派 | 代表系統 | 互動狀態怎麼處理 | 為何不選 |
|------|---------|---------------|---------|
| **Numbered Role Scale** | Radix Colors | 12 step scale，每個 step 號碼本身就是 role（step-9=solid bg、step-10=solid hover），light/dark scale 各自獨立定義值 | 工程量極大——需要重新設計每個色相 × 12 step × 2 mode = 192 個值，且全部 consumer 改 step 號 |
| **Semantic State Token**（**我們**） | Atlassian DS、GitHub Primer | 互動狀態用 semantic token (`--{hue}-hover` / `--{hue}-active`)，每個 mode 預先計算值 | ✓ 選這個 |
| **State Layer Overlay** | Material Design 3 | 互動狀態用透明 overlay（state layer），不改變底色 | 跟 Button 用 solid shade change 的視覺語言不一致——同設計系統內互動回饋會分裂成兩種風格 |
| **Consumer-side Mode Handling** | Tailwind CSS | 由 consumer 自己處理 dark mode 變體 (`hover:bg-blue-600 dark:hover:bg-blue-400`) | Token 系統的價值就是封裝 mode 知識，把它推給 consumer 等於放棄抽象化 |

### 為什麼選 Atlassian 流派

1. **跟 Button 視覺語言一致**——Button 用 solid shade change（從 step-6 到 step-5/-7），其他飽和色 bg 互動也應該用 solid shade，而不是 overlay
2. **務實的工程量**——不需要重構整套 primitives
3. **封裝 mode 知識**——把 dark mode 翻轉的 swap 邏輯關進 semantic 層，consumer 不需知道
4. **跟 `--primary-hover/active` 同模式**——`--blue-hover/active` 是同一個概念延伸到所有作為 bg 的色相

### Tag 為什麼是「primitive 靜態 + semantic 互動」混合存取

這**不是 code smell，是有意的職責分離**：

| 概念 | 是否需要 mode 知識 | 該住哪一層 |
|------|------------------|----------|
| **靜態色值**（subtle bg、text、solid bg） | ❌ Primitives 公式翻轉已自動處理 | **Primitive**——直接 `--color-blue-1`、`--color-blue-7`、`--color-blue-6` |
| **互動狀態**（hover、active） | ✅ 需要保證「hover 永遠較亮、active 永遠較暗」 | **Semantic**——`--blue-hover`、`--blue-active` 內含 dark mode swap |

兩個概念**本來就不該綁在同一層**。Tailwind 也這樣分離：`bg-blue-500`（靜態，scale step）vs `hover:bg-blue-600 dark:hover:bg-blue-400`（互動，需要 consumer 處理 mode）。差別只在於 Atlassian 流派把 mode swap 封裝進 token 裡，consumer 不需要寫 dark variant。

---

## 系統架構

色彩分兩層定義：

| 層 | 檔案 | 用途 | 範例 |
|---|---|---|---|
| **Primitive** | `primitives.css` | 原始色票，Tag / Avatar 直接消費 | `--color-blue-6`、`--color-blue-1` |
| **Semantic** | `semantic.css` | 語義 token，用於表達意圖（操作、狀態） | `--primary`、`--error`、`--info` |

```
Primitive              Semantic
──────────             ──────────
--color-blue-6      →  --primary（互動入口）
                    →  --info（資訊狀態）
--color-deep-orange-6 → --error（錯誤狀態）
--color-green-6     →  --success（成功狀態）
--color-yellow-6    →  --warning（警告狀態）
```

Semantic token 直接指向 primitive（無中間層）。

**消費規則**：

| 場景 | 使用層級 | 原因 |
|---|---|---|
| Tag、Avatar 的色彩 variant | **Primitive**（`--color-blue-1`、`--color-blue-6`、`--color-blue-7`） | 色名是顏色本身，不代表語義 |
| Tag、Avatar 的文字色（subtle 模式） | **Primitive step-7**（`--color-blue-7`、`--color-red-7`） | 小面積色塊文字需要更高對比，primitives 的相對色階公式在 dark mode 自動把 step-7 解析為高對比方向 |
| Button、Checkbox、Switch、Focus ring | **Semantic**（`--primary`） | 代表「使用者可以執行的操作」 |
| Badge 層級（high/medium） | **Semantic**（`--info`、`--info-subtle`、`--info-text`） | 代表「資訊狀態」，不是操作 |
| 錯誤訊息、驗證錯誤 | **Semantic**（`--error`） | 代表「系統出了問題」 |

**注意**：「red」語義色（`--error`）實際對應的 primitive 色相是 `deep-orange`。Tag / Avatar 的 `red` variant 使用 `--color-deep-orange-*` primitive。

Tailwind utility 透過 `@theme inline` 橋接 semantic token，元件寫 `bg-primary` 或 `bg-error` 即可。Tag / Avatar 使用 CSS 變數任意值（`bg-[var(--color-blue-6)]`）。


## Surface 分層（非常重要）

| Token / Utility     | 用途 | 說明 |
|---------------------|------|------|
| `bg-canvas`         | 頁面最底層背景 | HTML body 背景色 |
| `bg-surface`        | 非遮蓋型容器 | card、sidebar、table，dark mode 半透明 |
| `bg-surface-raised` | 遮蓋型浮層 | modal、popover、dropdown，必須不透明 |

`bg-surface-raised` 必須不透明，避免底層內容透出。


## 文字 / Icon 層級

| Utility            | 用途 |
|--------------------|------|
| `text-foreground`  | 主要文字（一般資訊）|
| `text-fg-secondary`| 次要資訊、helper text |
| `text-fg-muted`    | placeholder、caption、弱化 icon |
| `text-fg-disabled` | disabled 文字 |

文字色一律使用 neutral alpha token，疊加在任何背景都能維持對比。
弱化 icon hover 後變 `text-fg-secondary`。


## Disabled 狀態

disabled 元件內的所有子元素必須呈現 disabled 狀態：

| 元素類型 | Disabled 處理 |
|---|---|
| 文字 | `text-fg-disabled` |
| Icon（stroke） | `text-fg-disabled` |
| 圖片 / Avatar | `opacity-disabled`——圖片無法套用語義色，用透明度弱化 |
| Checkbox / Radio | 元件自身的 disabled 樣式 |
| 背景色 | `bg-disabled`（如適用） |

**判斷標準：disabled 元件內不應有任何元素看起來是可互動的。**


## Icon 色彩原則

一條統一規則，跨所有元件：

| 判斷 | 顏色 | 範例 |
|---|---|---|
| icon 代表內容或類別 | **與 label 同色**（foreground 或 text-error 等） | Mail「電子郵件」、Settings「設定」 |
| icon 純指示方向/展開/導覽 | `fg-muted`（neutral-7） | ChevronRight、ChevronDown、ExternalLink |
| disabled 時 | `fg-disabled` | 全部統一 |

**判斷標準：「這個 icon 是在描述旁邊文字的內容，還是在指示一個方向？」**

- 代表內容 → 跟文字同色（icon 是文字的視覺延伸）
- 指示方向 → `fg-muted`（icon 是輔助指引，退到背景）

詳細的元件套用表見 `item-layout.spec.md`。


## 語義色

### Action — Primary

`--primary` 只用於互動入口，代表「使用者可以執行的操作」。

| 用途 | 範例 |
|------|------|
| 主要按鈕 | `bg-primary` |
| 文字連結 | `text-primary` |
| Focus ring | `ring-ring` |

```tsx
<Button variant="primary">確認</Button>
<a className="text-primary hover:text-primary-hover">查看詳情</a>
```

### Status

狀態色表達系統回饋，代表「系統在告訴你什麼」，不用於互動操作。

| Token | 色相 | 用途 |
|-------|------|------|
| `--info` | blue | 資訊提示、進行中（in-progress）、active 指示、step indicator |
| `--error` | deep-orange | 錯誤 / 危險 |
| `--success` | green | 成功 |
| `--warning` | yellow | 警告 |

雖然 `--info` 與 `--primary` 目前同色（blue），**語義截然不同，不可混用**：

> 只要是「呈現狀態」就用 `--info`，只要是「互動入口」就用 `--primary`。
> 尤其在同一個 UI 脈絡中可能出現多種 status 色時（如任務列表、step indicator），一律使用 status 色系，絕不混入 `--primary`，否則使用者無法建立一致的色彩解讀框架。

```tsx
// ✅ 正確
<ProgressBar className="bg-info" value={60} />
<Tag className="bg-info-subtle text-info-text">進行中</Tag>
<p className="text-error">此操作無法復原</p>

// ❌ 錯誤——progress bar 不是互動操作
<ProgressBar className="bg-primary" value={60} />
```

每個語義色的 bridge 同時產出 `bg-xxx`、`text-xxx`、`border-xxx` 三組 utility，視場景選用。

- `bg-error` 為本系統命名，`bg-destructive` 僅供 shadcn 元件內部 compat
- warning 的文字色取決於底色：

  | 底色 | 文字色 | 原因 |
  |------|--------|------|
  | `bg-warning`（yellow-6，滿版） | `text-warning-foreground`（`black-a85`，深色） | 黃色亮度高，白字對比不足，必須用深色 |
  | `bg-warning-subtle`（淡黃） | `text-[yellow-7]`（step-7） | subtle 底色夠淺，深一階的黃色文字可辨識（見「文字色 Step 原則」） |

### Indicator — Notification

| Token | Utility | 色相 | 用途 |
|-------|---------|------|------|
| `--notification` | `bg-notification` | deep-orange | 未讀計數 badge、通知紅點 |

`--notification` 目前與 `--error` 使用同色（deep-orange-6），但語義獨立——`--error` 表示「系統出了問題」，`--notification` 表示「有待處理的項目」。兩者保持分離的 token，未來可單獨調整顏色。

```tsx
<span className="bg-notification text-white">3</span>   // badge 計數
```

### Identity — 品牌

| Token | 用途 |
|-------|------|
| `--brand` | 品牌色，固定色 #DF3232，兩主題相同 |


### Primitive 色票與 Tag / Avatar 的消費

Tag、Avatar 等需要多色區分的場景（專案標籤、團隊分類等）直接消費 primitive token。消費端自行決定色彩用途。

每個色相的 primitive 包含完整的 step 序列，Tag / Avatar 主要消費以下 step：

| Step | 用途 | 範例 |
|------|------|------|
| step-1 | subtle 背景（淡色填充） | `--color-blue-1` |
| step-5 | dismiss hover（solid 模式） | `--color-blue-5` |
| step-6 | solid 背景（全色填充） | `--color-blue-6` |
| step-7 | subtle 文字、dismiss active（solid 模式） | `--color-blue-7` |

可用色相：blue、deep-orange、green、yellow、turquoise、purple、magenta、indigo。

**注意**：Tag / Avatar 的 `red` variant 使用 primitive `deep-orange`（`--color-deep-orange-*`）。

**與 semantic 色的差別**：semantic 色（primary/info/error/success/warning）有固定語義，primitive 色沒有。Tag / Avatar 使用 primitive 是因為「blue」代表顏色本身，不代表「主要操作」或「資訊狀態」。

### `--inverse-*` namespace：inverse surface 上的內容色

`--inverse-*` 是一組 namespace，用來表達「繪製在 inverse surface（= solid `--color-neutral-9`，在 dark mode 自動反轉）上的內容」。Tag / Avatar 的 neutral solid variant 使用 neutral-9 作為底色，因此需要一組與 `--foreground` 家族對應、但方向相反的 token。

| Token | 對應的正常態 token | 用途 |
|-------|------------------|------|
| `--inverse-fg` | `--foreground` | inverse surface 上的文字色（Tag/Avatar neutral solid 的 label） |
| `--inverse-neutral-hover` | `--neutral-hover` | inverse surface 上的 hover overlay（如 dismiss hover） |
| `--inverse-neutral-active` | `--neutral-active` | inverse surface 上的 active overlay（如 dismiss active） |

**命名原則**：
- base 文字 token 命名為 `--inverse-fg`（對齊 `--foreground`），而不是 `--neutral-inverse`。原因是本 token 系統沒有 `--neutral` 這個 semantic base（只有 primitives `--color-neutral-1` ~ `--color-neutral-9`），若命名為 `--neutral-inverse-*` 會讓讀者誤以為存在 `--neutral` base，造成誤導。
- 互動 overlay token 命名為 `--inverse-neutral-hover` / `--inverse-neutral-active`，明確指出鏡射的是 `--neutral-hover` / `--neutral-active`。`fg` 自帶語意所以單獨用，但 `hover` / `active` 太籠統需要 `neutral-` 限定詞表明角色。
- 以 `--inverse-*` 為 namespace 則意義清晰：「inverse surface 上的 foreground / neutral-hover / neutral-active」。

**數值規則（嚴格對稱）**：`--inverse-neutral-*` 在某 mode 的值 = `--neutral-*` 在「另一 mode」的值。即 inverse 是 neutral 的 mode 鏡射。

| Token | Light | Dark |
|-------|-------|------|
| `--neutral-hover` | black @ 2% | white @ 4% |
| `--neutral-active` | black @ 4% | white @ 8% |
| `--inverse-neutral-hover` | white @ 4% (= dark neutral-1) | black @ 2% (= light neutral-1) |
| `--inverse-neutral-active` | white @ 8% (= dark neutral-2) | black @ 4% (= light neutral-2) |

好處：完全對稱、重用既有 tuned values、自動繼承感知補償（dark mode 4% 補償白色透明在深底較弱的視覺感受），未來改 neutral 強度時 inverse 自動同步。

**未來擴展**：當需要在 inverse surface 上表達文字層級時，可平行新增以下 token，對應 `--fg-*` 家族：

| 未來 token | 對應的正常態 token |
|-----------|------------------|
| `--inverse-fg-secondary` | `--fg-secondary` |
| `--inverse-fg-muted` | `--fg-muted` |
| `--inverse-fg-disabled` | `--fg-disabled` |

目前僅 `--inverse-fg` 有實際消費需求，其他層級在有明確使用情境時再加入，避免過度設計。

### 文字色 Step 原則

色彩用於文字時，step 的選擇取決於文字的**角色**——是「資訊呈現」還是「互動入口」？這兩種角色的視覺需求完全不同。

| 角色 | 例子 | Token | 為什麼這個 step |
|------|------|-------|---------------|
| **資訊呈現**（不強調互動，以表達資訊為主的有色文字） | Tag label、Avatar fallback、Badge medium 計數、status indicator | primitive step-7（`--color-{hue}-7`）<br>或 semantic `--{status}-text`（`--info-text`、`--error-text`） | **辨識度優先**——小面積色塊文字疊在 step-1 subtle 底色上，需要更高對比才能舒適閱讀。step-7 在 light mode 是「比 step-6 暗」，在 dark mode 透過 primitives 公式翻轉自動變成「比 step-6 亮」，**兩個 mode 都是離 step-1 subtle 背景最遠的高對比方向**。 |
| **互動入口**（吸引點擊，鼓勵操作） | Button label、Link、可點擊的 status text | semantic base（`--primary`、`--error`、`--info` 等）= step-6 | **鮮豔度優先**——step-6 是色相的飽和最高點，吸引注意力引導使用者操作。互動元素本身有 hover/active 回饋，不靠文字色階暗示。 |
| **互動 hover / active** | Button hover、Tag dismiss icon hover | semantic hover/active（`--primary-hover` 等）= step-5 / step-7 + dark mode swap | **回饋使用者操作**——hover lift / active press 方向跨 mode 一致 |

#### `--{hue}-text` 的角色

**`--{hue}-text` 專門用於「不強調互動、以表達資訊為主的有色相文字」**。它的存在是為了區分兩種完全不同的有色文字：

- **資訊呈現**用 `--{hue}-text` / `--color-{hue}-7` → 小面積色塊文字，最大對比，靜態閱讀
- **互動入口**用 `--primary` 等 semantic base = step-6 → 鮮豔，吸引點擊

**典型 `--{hue}-text` 消費者**：
| 元件 | 用法 | 為什麼是「資訊呈現」 |
|------|------|------------------|
| Tag subtle | label 文字 | Tag 是分類標籤，不可點擊（dismiss 是 inline action 不算 Tag 本體） |
| Avatar subtle | fallback 字 | 文字 fallback 是身份標識，不是按鈕 |
| Badge medium | 通知計數 | 計數是資訊指示器，本身不可點擊 |
| Status text | 「進行中」「已完成」等 | 狀態描述，不引導動作 |

**不該用 `--{hue}-text` 的場景**：
- ❌ Button label（用 `text-primary-foreground` = white）
- ❌ Link（用 `text-primary` = step-6，鮮豔度優先）
- ❌ 任何 hover/active 互動回饋

#### 為什麼 step-7 在兩個 mode 都對

Primitives 的相對色階公式在 dark mode 把 step-5 / step-7 公式互換：
- Light mode：step-7 = `l * 0.82`（較暗）→ 對白色 subtle 是暗色高對比 ✓
- Dark mode：step-7 = `l + (1-l) * 0.20`（較亮）→ 對深色 subtle 是亮色高對比 ✓

**step-7 永遠是「離 subtle 背景最遠的方向」**，與 mode 無關。這就是為什麼資訊文字可以直接用 primitive，不需要 semantic 層 swap。

Badge 使用語義色的 text token（`--info-text`、`--error-text`），不直接消費 primitive。

**step-7 vs semantic active 的區別**：兩者在 light mode 都指向 step-7，但 dark mode 行為不同。semantic active（如 `--primary-active`）在 dark mode 反轉為 step-5（壓暗模擬按壓感），而 primitive step-7 在 dark mode 仍維持高對比方向。簡言之：active 服務於互動回饋，step-7 服務於閱讀對比，兩者目的不同，dark mode 方向相反。

**例外：step-6 滿版底色（如 yellow solid）上的文字用 `--warning-foreground`（`black-a85`）**——黃色亮度極高，step-7 仍不足以提供對比，必須使用深色文字。此例外只在底色是 step-6 時觸發，step-1 subtle 底色上仍用 step-7。

### Subtle 背景（淡色填充）

所有語義色都有 `-subtle` 變體。Tag / Avatar 直接使用 primitive step-1（`--color-{hue}-1`）：

```tsx
// Semantic subtle
<div className="bg-primary-subtle" />
<div className="bg-error-subtle" />
<div className="bg-success-subtle" />
<div className="bg-warning-subtle" />

// Tag / Avatar 直接用 primitive step-1
<div style={{ backgroundColor: 'var(--color-blue-1)' }} />
<div style={{ backgroundColor: 'var(--color-purple-1)' }} />
```

#### Dark mode subtle

Light mode 的 step-1 使用不透明色票。Dark mode 的 step-1 在 primitives 中使用 alpha 公式自動計算：

```css
/* primitives.css dark mode */
--color-{hue}-1: oklch(from var(--color-{hue}-6) l c h / calc(0.12 / l));
```

`α = 0.12 / l`：亮度越高的色相 alpha 越低，在 dark canvas 上感知亮度自動統一。所有色相用同一套公式，無需在 semantic 層額外覆寫。


## 互動狀態推導（Hover / Active）

### 公式

Hover / active **直接引用色盤 step**，不使用獨立公式：

| | Hover（較亮） | Active（較暗） |
|---|---|---|
| Light | step **-5** | step **-7** |
| Dark | step **-7** | step **-5** |

相對色階公式保證 step -5 永遠比 base 亮、step -7 永遠比 base 暗，
所有色相適用同一規則，無例外。

高亮度色相（yellow 等）的 hover gap 較小（ΔL ≈ 0.03），
這是物理事實——亮色的淺色方向空間窄。
cursor 變化 + 細微色移疊加仍提供足夠互動回饋。

```tsx
<button className="bg-primary hover:bg-primary-hover active:bg-primary-active" />
```

### Semantic token 直接指向 primitive

| Token | 指向 primitive |
|-------|----------------|
| --primary / --primary-hover / --primary-active / --primary-subtle | → blue-6 / blue-5 / blue-7 / blue-1 |
| --info / --info-hover / --info-active / --info-subtle / --info-text | → blue-6 / blue-5 / blue-7 / blue-1 / blue-7 |
| --error / --error-hover / --error-active / --error-subtle / --error-text | → deep-orange-6 / deep-orange-5 / deep-orange-7 / deep-orange-1 / deep-orange-7 |
| --success / --success-hover / --success-active / --success-subtle / --success-text | → green-6 / green-5 / green-7 / green-1 / green-7 |
| --warning / --warning-hover / --warning-active / --warning-subtle / --warning-text | → yellow-6 / yellow-5 / yellow-7 / yellow-1 / yellow-7 |

每個色相使用色盤的 4 個 step：-1（subtle）、-5（hover）、-6（base）、-7（active / text）。

Dark mode 覆寫：hover/active 方向反轉（hover → step-7，active → step-5），subtle 使用 alpha 公式。text 不需覆寫——primitives 的相對色階公式已處理 dark mode 方向。

### `--{hue}-hover/active` — 非語意色相的互動 token

除了 semantic 色相（primary、info、error、success、warning）有完整 5 件套（base/hover/active/subtle/text）外，**作為 bg 使用的非語意色相**還有獨立的 hover/active 互動 token：

| Token | 指向 primitive | dark mode swap |
|-------|--------------|--------------|
| `--blue-hover` / `--blue-active` | blue-5 / blue-7 | blue-7 / blue-5 |
| `--red-hover` / `--red-active` | deep-orange-5 / deep-orange-7 | deep-orange-7 / deep-orange-5 |
| `--green-hover` / `--green-active` | green-5 / green-7 | green-7 / green-5 |
| `--yellow-hover` / `--yellow-active` | yellow-5 / yellow-7 | yellow-7 / yellow-5 |
| `--turquoise-hover` / `--turquoise-active` | turquoise-5 / turquoise-7 | turquoise-7 / turquoise-5 |
| `--purple-hover` / `--purple-active` | purple-5 / purple-7 | purple-7 / purple-5 |
| `--magenta-hover` / `--magenta-active` | magenta-5 / magenta-7 | magenta-7 / magenta-5 |
| `--indigo-hover` / `--indigo-active` | indigo-5 / indigo-7 | indigo-7 / indigo-5 |

#### 為什麼存在這組 token

**Tag/Avatar 的 solid 色相 dismiss 互動需要**：
- 跟 Button 同樣的 solid color shade change（hover 較亮、active 較暗）
- 跨 mode 一致的方向（dark mode 必須 swap step 號）
- 但 Tag 的「藍」≠ semantic primary（解耦：改 primary 不應影響 Tag）

直接用 primitive `--color-blue-5/-7` 不行——dark mode 公式互換會方向顛倒。所以擴展 semantic 互動 token 模式到所有 8 個非語意色相。

#### 嚴格限制

**只有 hover/active 兩個 token**——**沒有** `--blue` base、`--blue-subtle`、`--blue-text`：

| 用途 | 該用什麼 |
|------|---------|
| Tag/Avatar 的 base bg（solid） | primitive `--color-blue-6` |
| Tag/Avatar 的 subtle bg | primitive `--color-blue-1` |
| Tag/Avatar 的 text on subtle | primitive `--color-blue-7` |
| Tag/Avatar 的 dismiss hover bg | semantic `--blue-hover` |
| Tag/Avatar 的 dismiss active bg | semantic `--blue-active` |

**為什麼故意不加 base/subtle/text？** 那些不需要 mode 翻轉知識（primitives 已處理），加 semantic alias 只會污染命名空間、看起來像 categorical 復辟。只有 hover/active 真的需要 semantic 層處理 mode swap。

#### 新增非語意色相 hue 互動 token 的步驟

當需要在 Tag/Avatar 加入新色相 variant（例：lime）：

1. **確認 primitive 已存在**：`--color-lime-6` 等（primitives.css 應該已定義）
2. **在 semantic.css 加 hover/active**（light + dark）：
   ```css
   /* :root, [data-theme] */
   --lime-hover:  var(--color-lime-5);
   --lime-active: var(--color-lime-7);

   /* [data-theme="dark"] */
   --lime-hover:  var(--color-lime-7);
   --lime-active: var(--color-lime-5);
   ```
3. **更新 Tag/Avatar 元件**：variant cva 加 lime 條目，SOLID_DISMISS_HOVER 加 lime hover/active
4. **不要加** `--lime`、`--lime-subtle`、`--lime-text`（這些用 primitive 直接消費）

### 新增語意色相的標準流程

每次新增 semantic 色相（例：新增 `--accent` 指向 turquoise）必須**完整執行**這 4 步，不可省略——確保所有 semantic 色相結構一致。

#### Step 1: Primitive（如該色相不存在）

在 `primitives.css` 定義 base-6 值（只需指定 L、C、H），相對公式自動推導 1-10 階。如已存在則跳過。

```css
--color-turquoise-6: oklch(0.57 0.10 225);
/* 1-5 / 7-10 自動由公式推導 */
```

#### Step 2: Semantic 五件套（必填）

在 `semantic.css` 的 `:root, [data-theme]` 區塊新增 5 個 token，**不可缺任何一個**：

```css
--accent:        var(--color-turquoise-6);   /* base */
--accent-hover:  var(--color-turquoise-5);   /* hover */
--accent-active: var(--color-turquoise-7);   /* active */
--accent-subtle: var(--color-turquoise-1);   /* subtle bg */
--accent-text:   var(--color-turquoise-7);   /* text on subtle bg */
```

**對應規則**（不可亂改）：
| Semantic role | Primitive step | 為什麼 |
|---|---|---|
| base | -6 | 主色 |
| hover | -5 | 輕微變亮 |
| active | -7 | 輕微變暗（pressed feel） |
| subtle | -1 | 弱化背景（dark mode 自動 alpha） |
| text | -7 | 高對比文字（dark mode 自動反轉方向） |

#### Step 3: Dark mode 反轉（必填）

在 `[data-theme="dark"]` 區塊新增 hover/active 方向反轉：

```css
[data-theme="dark"] {
  --accent-hover:  var(--color-turquoise-7);   /* dark: 仍是較亮 */
  --accent-active: var(--color-turquoise-5);   /* dark: 仍是較暗 */
  /* subtle、text 不需覆寫 — primitives 已處理 */
}
```

**為什麼只反轉 hover/active？** Primitives 在 dark mode 已經：
- 把 step-1 改為 alpha 公式（subtle 自動正確）
- 把 step-5/-7 公式互換（step-7 在 dark mode 仍是高對比方向，所以 text 自動正確）

但 semantic token 直接 reference step number，所以 hover→step-5 在 dark mode 會變成 darker（錯方向）。必須在 semantic 層手動 swap。

#### Step 4: Tailwind Bridge（必填）

在 `semantic.css` 的 `@theme inline` 區塊加入：

```css
--color-accent:        var(--accent);
--color-accent-hover:  var(--accent-hover);
--color-accent-active: var(--accent-active);
--color-accent-subtle: var(--accent-subtle);
--color-accent-text:   var(--accent-text);
```

讓 `bg-accent`、`text-accent-text`、`hover:bg-accent-hover` 等 Tailwind utility 可用。

---

### 檢查清單

新增完一個語意色相，逐項對照：

- [ ] Primitive base-6 已定義（或已存在）
- [ ] Semantic 五件套全部寫齊（base / hover / active / subtle / text）
- [ ] Dark mode `hover` / `active` 方向反轉已加
- [ ] Dark mode `subtle` / `text` 沒亂加（primitives 已處理）
- [ ] Tailwind bridge 五件套全部加齊
- [ ] 命名遵循 `--{name}` / `--{name}-{role}` 模式（不混色相名）
- [ ] 用 `npx tsc --noEmit` 檢查零錯誤


## Neutral Interaction

中性互動背景按深度遞進：

| Utility | 用途 |
|---------|------|
| `bg-neutral-hover` | hover |
| `bg-neutral-active` | active（按下）、selected（選中） |

文字一律用 `text-foreground`。

```tsx
<div className="hover:bg-neutral-hover active:bg-neutral-active">list row</div>
<div className="bg-neutral-active">selected row</div>
```


## Static Subtle Background

| Utility | Token | 用途 |
|---------|-------|------|
| `bg-muted` | neutral-2 | 靜態裝飾性低調背景（Tag neutral、table header、skeleton） |
| `bg-secondary` | neutral-3 | 比 muted 深一階的弱化背景（Badge low） |

`bg-muted`（neutral-2）適用於 table header、tab 容器、code block、skeleton loading 等需要與主內容區做出微弱層級區分但不具備互動意義的區域。

`bg-secondary`（neutral-3）比 muted 更明顯，適用於需要在小面積元素上可見的底色（如 16px 的 Badge）。

與 `bg-neutral-hover` / `bg-neutral-active` 的區別：neutral 系列表達互動狀態（hover / 選中），muted / secondary 表達結構性的靜態層級——即使沒有互動，它永遠是這個顏色。

```tsx
<div className="bg-muted">table header / tab bar</div>
<Badge variant="low" /> {/* bg-secondary — 小元素需要更明顯的底色 */}
```


## 邊框 / 分隔

| Utility | Token | 用途 |
|---------|-------|------|
| `border-border` | neutral-5 | 元件標準邊框 |
| `border-border-hover` | neutral-6 | input、checkbox、radio 的 hover 邊框 |
| `border-divider` | neutral-4 | 分隔線（比 border 更淡）|

`border-input` 為 shadcn 內部使用，自己寫的元件改用 `border-border`。

選中狀態的邊框或文字使用 hover token：

```tsx
<div className="border-primary-hover text-primary-hover" />
```


## Utility Tokens

| Token | 用途 |
|-------|------|
| `--overlay` | dialog backdrop 遮罩 |
| `--tooltip` | tooltip 深色底（不透明）|
| `opacity-disabled` | disabled 元件整體透明度（0.45），用於無法改寫內部色彩的第三方元件 |

`opacity-disabled` 適用場景：包裝第三方元件（如圖表、地圖）的 disabled 狀態，無法逐一替換內部顏色時，直接對容器套用透明度：

```tsx
<div className={disabled ? 'opacity-disabled pointer-events-none' : undefined}>
  <ThirdPartyChart />
</div>
```

自己寫的元件優先用具體的 disabled 色彩（如 `text-fg-disabled`、`bg-[var(--bg-disabled)]`）。`opacity-disabled` 僅作為逃生艙，適用於無法逐一替換內部顏色的場景（第三方元件、複雜多層結構如 Switch）。


## shadcn Compat Aliases（僅供 shadcn 元件內部使用）

**自己寫的元件不要使用**，改用語義 token：

| shadcn alias   | 對應語義 token  |
|----------------|-----------------|
| `bg-background`| → `bg-canvas`   |
| `bg-card`      | → `bg-surface`  |
| `bg-popover`   | → `bg-surface-raised` |
| `bg-destructive`| → `bg-error`   |
| `bg-accent`    | → `bg-neutral-hover` |
| `border-input` | → `border-border` |
| `ring-ring`    | focus ring（= primary）|

> **`bg-secondary`** 已升級為正式語義 token（見 Static Subtle 段落），不再只是 shadcn compat。


## Nested Theme

任何容器都可以透過 `data-theme="dark"` 或 `data-theme="light"` 切換子元素的色彩語境。最常見的場景是 **Tooltip**——底色是深色，子元素需要 dark token 才可讀。

### 運作原理

CSS 變數在定義元素上解析。`:root` 的 `--foreground: var(--color-neutral-9)` 在 `:root` 就解析成 light 值，子孫繼承的是結果，不是 `var()` 表達式。

為了讓 nested theme 正確重新解析，`semantic.css` 的所有語義 token 定義在 `:root, [data-theme]`。任何帶 `data-theme` 的元素都會重新解析所有語義 token，子元素自動跟隨。

### CSS 結構

```
① :root               — 固定值（--brand，不隨 theme 變）
② :root, [data-theme] — 所有語義 token（default = light 值）
③ [data-theme="dark"] — 只覆寫跟 light 不同的值
```

判斷標準：「這個 token 在 dark 要不要變？」要 → ③ 覆寫。不要 → 只寫在 ②。

### 使用方式

```tsx
// Tooltip：子元素永遠 dark token
<TooltipContent>
  <div data-theme="dark" className="contents">{children}</div>
</TooltipContent>

// 任何容器都可以局部切換 theme
<div data-theme="dark">
  <Tag>dark mode tag</Tag>
</div>
```

容器自身的樣式（如 tooltip 的 `bg-tooltip`）不受子 div 的 `data-theme` 影響——`data-theme` 在子 div 上，只影響子元素。


## 禁止事項

```tsx
// ❌ 不要使用 Tailwind 原始色
<div className="bg-blue-500 text-gray-700" />

// ❌ 不要硬寫色碼
<div className="bg-[#1677FF]" />

// ❌ 不要在語義場景直接使用 primitive token
<div className="bg-[var(--color-blue-6)]" />  // 語義場景改用 bg-primary（semantic）
// ✅ Tag / Avatar 可以直接使用 primitive（它們的色彩不代表語義）

// ❌ 自己寫的元件不要用 shadcn alias
<div className="bg-background" />  // 改用 bg-canvas
<div className="bg-destructive" /> // 改用 bg-error

// ❌ 不要在深色容器上硬寫 text-white 給子元件——用 data-theme="dark"
<TooltipContent>
  <Tag className="text-white" />  // 改用 data-theme="dark" wrapper
</TooltipContent>
```

```tsx
// ✅ 正確
<div className="bg-canvas" />
<div className="bg-primary hover:bg-primary-hover" />
<div className="bg-primary-subtle text-primary" />
<div className="bg-error" />
<span className="bg-notification text-white">3</span>
// ✅ Tag / Avatar 直接用 primitive
<Tag style={{ backgroundColor: 'var(--color-blue-1)', color: 'var(--color-blue-7)' }} />
```
