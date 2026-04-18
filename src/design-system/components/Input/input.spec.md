# Input 設計原則

## 定位

Input 是**純文字**的輸入與顯示元件。格式化邏輯為 identity（value → value）——使用者打什麼就存什麼、顯示什麼。

共用規則見 `../Field/field-controls.spec.md`。本文件只記錄 Input 特有的原則。

---

## 何時用

- **純文字資料**：姓名、標題、搜尋字串、slug、ID、隨意 label
- **email / URL / password** 等特殊但仍屬「文字」的資料（搭配 `type="email" / "url" / "password"` + 適合的 `startIcon`）
- **格式化邏輯是 identity** 的場景——value → value，不需要千分位、不需要 locale、不需要 picker
- **單行** 輸入（多行用 Textarea）

## 何時不用

| 場景 | 改用 | 原因 |
|------|------|------|
| 數字 / 金額 / 百分比 | `NumberInput` | 需要千分位、prefix/suffix、locale、precision |
| 日期 / 日期時間 | `DatePicker` | 需要原生 picker、`Intl.DateTimeFormat` 顯示 |
| URL + 預覽 / open in new tab | `LinkInput` | 需要 URL 解析、favicon、外開按鈕 |
| 多行文字（description、note、備註）| `Textarea` | Input 是單行 |
| 密碼且需複雜性檢查 | `Input` + 外掛驗證 | Input 本身只負責輸入，驗證是 form 層 |

---

## startIcon 的使用場景

startIcon 用於輔助使用者理解「這個 input 是做什麼的」，不是描述 value 的類型。

| 適合 | 範例 |
|------|------|
| 搜尋 | `Search` |
| Email | `Mail` |
| 密碼 | `Lock` |
| URL | `Globe` |

startIcon 不隨 value 變化——它描述的是 input 的用途，不是 value 的狀態。

---

## endAction 的常見模式

使用宣告式 API（`InlineActionConfig`），Field 自動根據 size 渲染：

```tsx
// 顯示/隱藏密碼
<Input
  endAction={{ icon: showPwd ? EyeOff : Eye, label: showPwd ? '隱藏密碼' : '顯示密碼', onClick: () => setShowPwd(!showPwd) }}
/>

// 清除內容（有值時才顯示）
<Input
  endAction={query ? { icon: X, label: '清除搜尋', onClick: () => setQuery('') } : undefined}
/>
```

| 模式 | Icon | 行為 |
|------|------|------|
| 顯示/隱藏密碼 | `Eye` / `EyeOff` | toggle `type="password"` ↔ `type="text"` |
| 清除內容 | `X` | 清空 value，有值時出現、清空後消失 |

清除按鈕消失後不佔位——input 自然擴展。

---

## Display

`InputDisplay` 是 identity 顯示：
- 有值：原樣輸出
- null / undefined / 空字串：`—`（em dash），`text-fg-muted`

---

## 禁止事項

- ❌ startIcon 不可隨 value 變化——它描述用途，不是狀態
- ❌ 不可用 Input 顯示需要格式化的資料（數字、日期、貨幣）——用對應的 Field 元件

---

## 相關

- `../NumberInput/number-input.spec.md` — 數值資料
- `../DatePicker/date-picker.spec.md` — 日期
- `../LinkInput/link-input.spec.md` — URL + 預覽 / 外開
- `../Textarea/textarea.spec.md` — 多行文字
- `../Field/field-controls.spec.md` — Field Control 共用規則（mode / size / endAction / error）
