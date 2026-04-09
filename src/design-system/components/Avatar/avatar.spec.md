# Avatar 設計原則

## 定位

Avatar 是視覺身份標識——代表一個人、一個實體（專案、組織、App）。不是裝飾。

---

## 三種內容模式

按優先順序：

| 模式 | 觸發條件 | 內容 | 用途 |
|---|---|---|---|
| **Image** | 有 `src` | 圖片填滿 | 照片、上傳頭像 |
| **Icon** | 有 `icon` 或 src 載入失敗且無 alt | LucideIcon 在底色背景 | 類別標識、預設頭像 |
| **Text** | 有 `alt` 且無 src/icon | 首字大寫 | 無照片時的 fallback |

圖片載入失敗自動降級為 Icon 或 Text fallback。

---

## 尺寸

`size` 接受 **數字（px）** 或字串 **`'fill'`**。**不提供預設尺寸名稱**——尺寸由消費元件（item-layout 系統）決定。

### 兩種模式

| `size` 值 | 行為 | 何時用 |
|----------|------|------|
| `number`（預設 32） | Avatar 寫死為固定 px 尺寸 | 獨立使用、需要明確尺寸時 |
| `'fill'` | Avatar 填滿父容器（`width:100% height:100%`），icon 用 60% 寬高、文字用 `50cqi`（container query inline-size） | 父容器（如 SelectMenuItem 的 prefix slot）已決定尺寸時 |

**為什麼有 `'fill'` 模式**：當 Avatar 放在 item-layout 的 prefix slot，prefix 的尺寸由消費元件（SelectMenuItem、ListItem 等）依照 size variant 決定。Avatar 不該知道也不該寫死自己的尺寸——應該被動填滿父容器。`'fill'` 模式透過 CSS container query 讓內部 icon/text 自動隨父容器縮放。

### 內部元素比例

不論哪個模式，內部 icon 和 text 都按相同比例：

| 元素 | 公式 | 範例（size=32） |
|---|---|---|
| Icon | `round_even(size × 0.6)`（fill 模式用 `width:60% height:60%`） | 20px |
| Text fallback 字體 | `round(size × 0.5)`（fill 模式用 `font-size:50cqi`） | 16px |

- Icon 60%：業界標準（Material Design、Apple HIG）
- Text 50%：業界標準（Material Design、GitHub），且自動對齊我們的字體 scale（10→12→16→20px）

### 常用尺寸參考

由 item-layout 消費元件決定：

| 場景 | Avatar 用法 |
|---|---|
| Menu item / List item inside prefix slot | `<Avatar size="fill" />`（讓父 prefix 控制尺寸） |
| 獨立使用（page header user avatar 等） | `<Avatar size={40} />`（顯式指定 px） |

---

## 形狀

| Shape | 圓角 | 用途 |
|---|---|---|
| `circle`（預設） | `rounded-full` | 人物（照片、姓名） |
| `square` | `rounded-md` (4px) | 實體（專案、組織、App、品牌） |

**判斷標準：「這個 avatar 代表一個人，還是一個東西？」**

---

## 背景色

Icon 和 Text 模式使用 primitive step-1 subtle 背景 + 對應 step-7 前景色。`solid` boolean prop 可切換為 step-6 全色背景 + 白色前景。

與 Tag 元件完全對齊——所有有色 variant 直接使用 primitive token（`--color-blue-*`、`--color-deep-orange-*` 等），不使用 semantic token（`--primary`、`--error`）。Avatar 的「blue」代表藍色本身，不代表「主要操作」語義。neutral 用 `foreground`，有色用 primitive step-7（`--color-{hue}-7`）優先辨識度。

**注意**：`red` variant 使用 primitive `deep-orange`（`--color-deep-orange-*`）。

### Subtle（預設，`solid=false`）

| Color | 背景 | 前景 |
|---|---|---|
| neutral（預設） | `--muted` | **`--foreground`** |
| blue | `--color-blue-1` | `--color-blue-7` |
| red | `--color-deep-orange-1` | `--color-deep-orange-7` |
| green | `--color-green-1` | `--color-green-7` |
| yellow | `--color-yellow-1` | `--color-yellow-7` |
| turquoise | `--color-turquoise-1` | `--color-turquoise-7` |
| purple | `--color-purple-1` | `--color-purple-7` |
| magenta | `--color-magenta-1` | `--color-magenta-7` |
| indigo | `--color-indigo-1` | `--color-indigo-7` |

### Solid（`solid=true`）

step-6 全色背景 + 白色前景，適合需要更強視覺權重的場景。

| Color | 背景 | 前景 |
|---|---|---|
| neutral | `--color-neutral-9` | `--inverse-fg` |
| blue | `--color-blue-6` | white |
| red | `--color-deep-orange-6` | white |
| green | `--color-green-6` | white |
| yellow | `--color-yellow-6` | **`--warning-foreground`** |
| turquoise | `--color-turquoise-6` | white |
| purple | `--color-purple-6` | white |
| magenta | `--color-magenta-6` | white |
| indigo | `--color-indigo-6` | white |

**yellow 例外**：yellow solid 背景亮度高，白字對比不足，改用 `--warning-foreground`（深色文字）。

Image 模式不顯示背景色（圖片填滿），`solid` prop 無效果。

---

## Disabled

Avatar 在 disabled 元件內使用 `opacity-disabled`（由宿主元件控制，非 Avatar 自身 prop）。詳見 `color.spec.md` 的 Disabled 狀態。

---

## 禁止事項

- ❌ 不要用 Avatar 當裝飾——每個 Avatar 必須代表一個明確的身份
- ❌ 不要手動指定 icon 尺寸——60% 自動計算
- ❌ 不要用 square 給人物——人用 circle，東西用 square
- ❌ 不要省略 `alt`——即使有 `src`，`alt` 是圖片失敗時的 fallback 來源
