# DropdownMenu 設計原則

## 定位

DropdownMenu 是按鈕觸發的**動作選單**——使用者從中選擇一個動作並立即執行。

**與 SelectMenu 的區別**：SelectMenu 是**選值**（選完後值留在 field 裡），DropdownMenu 是**執行**（選完後觸發動作，選單關閉）。判斷標準：「選完之後，畫面上是否需要保留選中狀態？」需要 → SelectMenu；不需要 → DropdownMenu。

---

## 結構

```
DropdownMenu                    ← Radix Root，管理開關狀態
  DropdownMenuTrigger           ← 觸發按鈕（通常是 Button）
  DropdownMenuContent           ← 浮層容器，提供 size context
    DropdownMenuItem            ← 基本動作項目
    DropdownMenuCheckboxItem    ← 可勾選的切換項目（如顯示/隱藏欄位）
    DropdownMenuRadioGroup      ← 單選群組容器
      DropdownMenuRadioItem     ← 單選項目（如排序方式）
    DropdownMenuSub             ← 子選單容器
      DropdownMenuSubTrigger    ← 子選單觸發項目（自動附加 ChevronRight）
      DropdownMenuSubContent    ← 子選單浮層
    DropdownMenuLabel           ← 群組標題（不可互動）
    DropdownMenuSeparator       ← 分隔線
    DropdownMenuShortcut        ← 鍵盤快捷鍵提示（ml-auto 靠右）
```

---

## Item 類型

| 類型 | 用途 | 選中行為 |
|---|---|---|
| **Item** | 執行一次性動作（複製、刪除、開啟連結） | 執行後關閉選單 |
| **CheckboxItem** | 切換開關狀態（顯示/隱藏欄位） | 勾選/取消，選單保持開啟 |
| **RadioItem** | 從互斥選項中選一（排序方式） | 選中後關閉選單 |
| **SubTrigger** | 展開下一層選單 | 不執行動作，展開子選單 |
| **Label** | 群組標題，提供語義分類 | 不可互動 |
| **Separator** | 視覺分隔，劃分邏輯群組 | 不可互動 |

CheckboxItem 和 RadioItem 雖然涉及「選擇」，但它們控制的是**即時生效的設定**（toggle），不是「選一個值填回 field」。

---

## Item 佈局

遵循 item-layout 設計原則：

```
[prefix]  [label]  [suffix]
```

- prefix：`DropdownMenuItemPrefix`，包裹 startIcon，`h-[1lh]` 對齊第一行 label
- label：文字內容，`flex-1`
- suffix：`DropdownMenuItemSuffix` 或 `DropdownMenuShortcut`，`ml-auto` 靠右

padding 公式：`py = (field-height - 1lh) / 2`，單行時總高度等於同 size 的 Button / TextField。

---

## Suffix 模式

| Pattern | 內部 gap | 內容 | 用途 |
|---|---|---|---|
| **獨立後綴** | `gap-2` (8px) | `[badge?] [endIcon?]` | 狀態指示（未讀數）、導覽提示（ExternalLink） |
| **子選單指示** | `gap-1` (4px) | `[value?] [badge?] [ChevronRight]` | 展開下一層，value 顯示目前狀態（如 "深色"） |

SubTrigger 的 ChevronRight 由元件自動渲染，不需手動加。子選單指示中的 value 和 badge 是可選的——讓使用者不用展開就能看到下一層的目前狀態。

---

## 浮層規格

所有 elevation-200 浮層共用同一套視覺規格：

| 屬性 | Token |
|---|---|
| 背景 | `bg-surface-raised` |
| 陰影 | `--elevation-200` |
| 圓角 | `rounded-lg` (8px) |
| 邊框 | `border border-border` |
| 間距 | `sideOffset={8}` |
| 最小寬度 | 跟隨觸發元件寬度 |

SubContent 使用相同規格，包括 sideOffset。

---

## Size

透過 `DropdownMenuContent` 的 `size` prop 設定，經 SizeContext 向下傳遞，所有子項目自動套用。

| Size | Label | Icon | Checkbox/Radio 控件 |
|---|---|---|---|
| sm | `text-body leading-compact` (14px, 1.3) | 16px | 16px |
| md | `text-body leading-compact` (14px, 1.3) | 16px | 16px |
| lg | `text-body-lg leading-compact` (16px, 1.3) | 20px | 20px |

DropdownMenu 是掃描模式——使用者快速瀏覽選項，所有尺寸使用 `leading-compact`。

---

## 鍵盤操作

由 Radix DropdownMenu 提供：

| 按鍵 | 行為 |
|---|---|
| `↑` `↓` | 移動焦點 |
| `Enter` / `Space` | 執行目前焦點的動作 |
| `Escape` | 關閉選單（子選單先關子層） |
| `→` | 展開子選單 |
| `←` | 收合子選單，焦點回到 SubTrigger |

---

## 破壞性動作

刪除等不可逆動作的 **prefix icon 和 label 都使用 `text-error`**——prefix icon 是 label 的視覺延伸，與 label 同色。Suffix shortcut 維持 `fg-muted`。

---

## 禁止事項

- ❌ 不要用 DropdownMenu 做選值——「選一個值填回 field」用 SelectMenu
- ❌ 不要在 item 內放獨立互動元素（如 Button、Switch）——item 本身就是互動單位
- ❌ disabled item 不可有 hover 效果
- ❌ Label 不可被點擊或取得焦點
- ❌ 不要手動在 SubTrigger 內加 ChevronRight——元件自動渲染
- ❌ 不要混用 Shortcut 和 ItemSuffix——同一個 item 只用一種後綴
