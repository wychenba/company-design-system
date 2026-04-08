# Item Layout 設計原則

## 定位

所有「prefix + content」結構的元件共用此佈局邏輯。這不是一個元件，是一組設計規則——每個元件獨立實作，但遵循同一套公式。

**目前套用的元件**：SelectionItem（Checkbox/Radio）、SelectMenuItem。
**新建同類元件時必須遵循此規則。**

---

## 結構

```
[prefix 對齊容器]  [content 區塊]
     ↑                  ↑
  h-[1lh] 或          label
  h-[calc(...)]       gap-0.5 (2px)
  flex items-center   description?
```

外層：`flex items-start`——多行時 prefix Y 不隨文字下移。

---

## Padding 公式

```
py = (field-height - 1lh) / 2
```

- 單行時 item 總高度 = field-height（與同 size 的 Button、TextField 等高）
- 多行時 padding 不變，item 高度自然撐開
- density 切換時 field-height 自動調整，padding 跟著算

Tailwind 寫法：
```
py-[calc((var(--field-height-sm)-1lh)/2)]
py-[calc((var(--field-height-md)-1lh)/2)]
py-[calc((var(--field-height-lg)-1lh)/2)]
```

---

## Prefix 對齊——24px 閾值

prefix 內所有元素共享同一個對齊容器，容器高度決定對齊行為：

| prefix 最大內容高度 | 容器 | 對齊目標 |
|---|---|---|
| ≤ 24px | `h-[1lh]` | 第一行 label 的垂直中心 |
| > 24px | `h-[calc(1lh + 2px + desc_1lh)]` | label + gap + description 文字塊的垂直中心 |

**24px 是物理限制**——16px icon 在 24px 圓內仍可辨識（stroke icon 下限 12px），更小則不行。

**無 description 時 prefix 上限 24px**——沒有文字塊可對齊，強制 inline。

### Block 容器高度

Block 對齊只用於**掃描模式**（浮層元件）。desc_1lh 取決於 size tier 和掃描模式的字體：

| Size | desc 字體 | desc_1lh | 容器高度 calc |
|---|---|---|---|
| sm | text-caption (12px × 1.3) | 15.6px | `calc(1lh + 2px + var(--font-caption-size) * 1.3)` |
| md | text-caption (12px × 1.3) | 15.6px | `calc(1lh + 2px + var(--font-caption-size) * 1.3)` |
| lg | text-body leading-compact (14px × 1.3) | 18.2px | `calc(1lh + 2px + var(--font-body-size) * 1.3)` |

閱讀模式（SelectionItem）的 prefix 永遠 ≤ 控件尺寸（16/20px），不需要 block 對齊。

---

## Typography——兩種閱讀模式

同一套佈局公式，typography 策略根據使用者的閱讀模式調整：

### 掃描模式（浮層 / overlay）

適用元件：SelectMenuItem、未來的 ComboboxItem、DropdownItem。

使用者一掃而過，需要快速辨識——**緊湊行高 + 字體降級 + gap 分隔**：

| Size | Label | Description | Label ↔ Desc |
|---|---|---|---|
| sm | `text-body leading-compact` (14px, 1.3) | `text-caption` (12px, 1.3) | `gap-0.5` (2px) |
| md | `text-body leading-compact` (14px, 1.3) | `text-caption` (12px, 1.3) | `gap-0.5` (2px) |
| lg | `text-body-lg leading-compact` (16px, 1.3) | `text-body leading-compact` (14px, 1.3) | `gap-0.5` (2px) |

description 降一級字體 + `text-fg-secondary` 顏色，用**尺寸差 + 顏色差 + gap** 建立層級。

### 閱讀模式（頁面 / 表單）

適用元件：SelectionItem（Checkbox/Radio label）。

使用者仔細閱讀，需要舒適行距——**正常行高 + 同字體 + 無 gap**：

| Size | Label | Description | Label ↔ Desc |
|---|---|---|---|
| sm | `text-body` (14px, 1.5) | `text-body` (14px, 1.5) | `mt-0.5` (2px) |
| md | `text-body` (14px, 1.5) | `text-body` (14px, 1.5) | `mt-0.5` (2px) |
| lg | `text-body-lg` (16px, 1.5) | `text-body-lg` (16px, 1.5) | `mt-0.5` (2px) |

description 僅以 `text-fg-secondary` 顏色弱化，字體、行高與 label 完全一致——同一段落的韻律，顏色自然區分主次。2px gap 提供最小的視覺分隔，避免 label 和 description 完全黏在一起。

### 判斷標準

「使用者會仔細讀，還是一掃而過？」

- 會停留閱讀 → 閱讀模式（1.5 lh，同字體，無 gap）
- 快速掃描選擇 → 掃描模式（1.3 lh，字體降級，2px gap）

---

## Icon / 控件 Tier

跟隨 uiSize.spec.md 的 icon tier 系統：

| Size | Icon | Checkbox/Radio |
|---|---|---|
| sm | 16px | 16px (sm) |
| md | 16px | 16px (md) |
| lg | 20px | 20px (lg) |

---

## Prefix / Suffix 對稱對齊

Prefix 和 suffix 使用**完全相同的對齊邏輯**——不管另一方是否存在。

```
完整結構:
[prefix h-ref]  [content flex-1 min-w-0]  [suffix h-ref ml-auto]

只有 prefix:
[prefix h-ref]  [content flex-1]

只有 suffix:
                [content flex-1]          [suffix h-ref ml-auto]

兩者都沒有:
                [content]
```

**對齊參考高度（h-ref）** 的規則 prefix 和 suffix 共用：
- 內容物 ≤ 24px → `h-[1lh]`，對齊第一行 label
- 內容物 > 24px → `h-[calc(1lh+2px+desc_1lh)]`，對齊文字塊
- 外層 `items-start`，多行時 prefix/suffix Y 不動

Suffix 通常 ≤ 24px（icon + badge），所以幾乎總是 `h-[1lh]` 對齊。

### 兩種 suffix pattern

| Pattern | 內部 gap | 內容 | 用途 |
|---|---|---|---|
| **獨立後綴** | `gap-2` (8px) | `[badge?] [endIcon?]` | 狀態指示、導覽 |
| **子選單指示** | `gap-1` (4px) | `[value?] [badge?] [ChevronRight]` | 展開下一層選單 |

子選單指示中的 `value` 和 `badge` 是可選的——用來反映下一層選單的目前狀態（如 "Dark"、Badge count），讓使用者不用展開就能看到。

### Icon 色彩原則

Menu item 和 Field 的 icon 色彩規則不同：

#### Menu Item（SelectMenuItem、DropdownMenuItem）

| Icon 角色 | 顏色 | 範例 |
|---|---|---|
| 內容描述 icon（prefix） | **foreground**（跟 label 同色） | Mail, Settings, Trash2 |
| 危險操作 icon（prefix） | **text-error**（跟 label 同色） | Trash2（紅色刪除） |
| 指示方向 icon（suffix） | `fg-muted` | ChevronRight, ExternalLink |
| 狀態值文字（suffix value） | `fg-muted` | "深色", "已啟用" |
| disabled 時 | `fg-disabled` | 全部統一 |

**判斷標準：prefix icon 是 label 的一部分，跟 label 同色。Suffix icon 是方向指示，退到背景。**

#### Field（TextField、SelectField 等）

| Icon 角色 | 顏色 | 範例 |
|---|---|---|
| 用途提示 icon（startIcon） | `fg-muted` | Search, Calendar |
| 方向指示（ChevronDown） | `fg-muted` | ChevronDown |
| 代表 value 的 icon | **foreground**（跟 value 同色） | 狀態 icon |
| disabled 時 | `fg-disabled` | 全部統一 |

**差異原因：** Field 的 startIcon 是「描述 field 用途的提示」（像 placeholder），所以弱化。Menu item 的 prefix icon 是「描述 item 內容」，本身就是內容的一部分，應與 label 等重。

---

## Gap 慣例

| 位置 | Gap | Token |
|---|---|---|
| prefix 內部元素之間 | 8px | `gap-2` |
| prefix ↔ content | 8px | `gap-2` |
| content ↔ suffix | auto | `ml-auto`（推到右邊） |
| label ↔ description | 2px | `mt-0.5`（兩種模式統一） |
| suffix 獨立後綴內部 | 8px | `gap-2` |
| suffix 子選單指示內部 | 4px | `gap-1` |

---

## 套用範例

### SelectionItem（Checkbox/Radio）— 閱讀模式

```
prefix = [control]
content = [label + description?]
typography = 閱讀模式（1.5 lh，description 同字體，2px gap）
padding-x = 無（由外層容器決定）
prefix-content gap = gap-2
prefix align = h-[1lh]（control 永遠 ≤ 24px）
```

### SelectMenuItem — 掃描模式

```
prefix = [checkbox?] + [startIcon? | avatar?]
content = [label + description?]
typography = 掃描模式（1.3 lh，description 降一級，2px gap）
padding-x = px-3 (12px)
prefix-content gap = gap-2
prefix align = avatar > 24px ? block : inline
互動 = hover:bg-neutral-hover, selected:bg-neutral-active
```

### DropdownMenuItem — 掃描模式（含 suffix）

```
prefix = [startIcon?]
content = [label + description?]
suffix = [badge? + endIcon?]（gap-2）
       或 [value? + badge? + ChevronRight]（gap-1，子選單指示）
typography = 掃描模式
padding-x = px-3 (12px)
prefix-content gap = gap-2
suffix align = 與 prefix 共用 h-ref，ml-auto 靠右
互動 = hover:bg-neutral-hover
子選單 = Radix DropdownMenuSub，ChevronRight 自動
```

---

## 新元件 checklist

建立新的「prefix + content + suffix?」元件時：

1. ✅ padding 使用 `(field-height - 1lh) / 2` 公式
2. ✅ prefix 容器使用 `h-[1lh]` 或 block calc（依 24px 閾值）
3. ✅ suffix 容器使用與 prefix 相同的 h-ref（對齊）
4. ✅ 外層 `flex items-start`（多行釘住 prefix/suffix）
5. ✅ 字體使用 `leading-compact`（掃描模式）或預設 lh（閱讀模式）
5. ✅ description 字體降一級
6. ✅ icon/控件尺寸跟隨 tier 系統
7. ✅ gap 使用 `gap-2`（prefix ↔ content）、`gap-0.5`（label ↔ desc）
