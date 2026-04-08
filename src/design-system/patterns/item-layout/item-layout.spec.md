# Item Layout 設計原則

## 定位

Item Layout 定義**結構和對齊系統**，不定義具體間距值。每個消費元件根據自身場景設定間距，但遵循相同的結構和對齊規則。

**這不是一個元件，是一套佈局原則。**

---

## 結構

所有「prefix + content + suffix」元件共用三區域結構：

```
[prefix]  [content]  [suffix]
  ↑          ↑          ↑
 對齊       flex-1     對齊
 容器      min-w-0    容器
                      ml-auto
```

- **外層**：`flex items-start`——多行時 prefix / suffix 的 Y 不隨文字下移
- **prefix / suffix**：對齊容器，垂直置中內容物
- **content**：label + 可選 description，佔滿剩餘空間

---

## 對齊容器——24px 閾值

prefix 和 suffix **共用相同的對齊容器高度**，由 prefix 內容物決定：

| prefix 內容物高度 | 對齊容器 | 對齊目標 |
|---|---|---|
| ≤ 24px | `h-[1lh]` | 第一行 label 的垂直中心 |
| > 24px | `h-[calc(1lh + 2px + desc_1lh)]` | label + gap + description 文字塊的中心 |

**suffix 永遠跟 prefix 使用相同的容器高度。** prefix 用 `h-[1lh]` → suffix 也用 `h-[1lh]`。prefix 用 calc → suffix 也用 calc。

**24px 是物理限制**——16px icon 在 24px 圓內仍可辨識（stroke icon 下限 12px），更小則不行。無 description 時 prefix 上限 24px。

---

## 兩種閱讀模式

| | 掃描模式 | 閱讀模式 |
|---|---|---|
| **場景** | 浮層 / overlay（一掃而過） | 頁面 / 表單（仔細閱讀） |
| **Label 行高** | `leading-compact` (1.3) | 預設 (1.5) |
| **Description 字體** | 降一級（14→12px, 16→14px） | 同 label |
| **Description 顏色** | `fg-secondary` | `fg-secondary` |
| **Label ↔ Desc 間距** | 2px (`mt-0.5`) | 2px (`mt-0.5`) |
| **判斷標準** | 使用者快速掃描選擇 | 使用者停留閱讀 |

---

## Icon 色彩原則

一條統一規則，跨所有元件（詳見 `color.spec.md`）：

| 判斷 | 顏色 | 範例 |
|---|---|---|
| icon 代表內容或類別 | **與 label 同色** | Mail「電子郵件」、Settings「設定」 |
| icon 代表危險操作 | **與 label 同色**（text-error） | Trash2「刪除」 |
| icon 純指示方向/展開 | `fg-muted`（neutral-7） | ChevronRight、ChevronDown、ExternalLink |
| suffix value 文字 | `fg-muted`，**字體大小與 label 相同** | "深色"、"已啟用" |
| disabled 時 | `fg-disabled` | 全部統一 |

---

## 消費元件預設

每個消費元件根據場景自訂間距，但結構和對齊規則不變：

### SelectMenuItem / DropdownMenuItem（浮層選單）

| 屬性 | 值 | 原因 |
|---|---|---|
| padding-y | `calc((field-height - 1lh) / 2)` | 單行高度 = field-height，對齊 Button / TextField |
| padding-x | 12px (`px-3`) | 選單項目的標準水平間距 |
| prefix ↔ content gap | 8px (`gap-2`) | 緊湊但可辨識 |
| suffix 獨立後綴 gap | 8px (`gap-2`) | tag / badge / endIcon 間距 |
| suffix 子選單指示 gap | 4px (`gap-1`) | value / badge / ChevronRight 更緊湊 |
| 閱讀模式 | 掃描模式 | 浮層內一掃而過 |

### SelectionItem（表單 Checkbox / Radio）

| 屬性 | 值 | 原因 |
|---|---|---|
| padding-y | `calc((field-height - 1lh) / 2)` | 單行高度 = field-height，對齊同 size 的 TextField |
| padding-x | 無（由外層容器決定） | 表單佈局各異 |
| prefix ↔ content gap | 8px (`gap-2`) | 控件與 label 的標準間距 |
| 閱讀模式 | 閱讀模式 | 表單內仔細閱讀 |

### ListItem（頁面列表，未來元件）

| 屬性 | 值 | 原因 |
|---|---|---|
| padding-y | 12px (`py-3`) | 舒適的列表行高，觸控友好 |
| padding-x | 16px (`px-4`) | 頁面內容的標準水平間距 |
| prefix ↔ content gap | 12px (`gap-3`) | 較寬鬆，適合較大的 avatar / thumbnail |
| 閱讀模式 | 閱讀模式 | 頁面內停留閱讀 |

---

## 新元件 checklist

建立新的「prefix + content + suffix」元件時：

1. ✅ 確定閱讀模式（掃描 or 閱讀）→ 決定 typography 策略
2. ✅ 確定 padding-y（field-height 公式 or 固定值）
3. ✅ 確定 padding-x 和 gap
4. ✅ prefix / suffix 對齊容器遵循 24px 閾值
5. ✅ suffix 跟 prefix 共用同一個容器高度
6. ✅ 外層 `flex items-start`（多行釘住 prefix/suffix）
7. ✅ icon 色彩遵循「代表內容 = label 同色，指示方向 = fg-muted」
8. ✅ description 字體遵循閱讀模式規則
