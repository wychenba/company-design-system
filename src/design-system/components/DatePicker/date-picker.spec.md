# DatePicker 設計原則

## 定位

DatePicker 是**單一日期**的輸入與顯示元件。Edit 用原生 `<input type="date">`，Display 用 `Intl.DateTimeFormat`。

共用規則見 `../Field/field-controls.spec.md`。本文件只記錄 DatePicker 特有的原則。

---

## 何時用

- **單一日期選擇**：出生日、到期日、提醒日、發佈日
- **需要 locale-aware 顯示**（`Intl.DateTimeFormat` 自動處理年月日順序、月份語言）
- **需要 mobile 原生 picker UX**（行動裝置會彈出系統 date wheel）
- **DataTable 的日期欄位**（自動整合，meta.type='date'）

## 何時不用

| 場景 | 改用 | 原因 |
|------|------|------|
| 日期範圍（from → to） | ⚠️ 尚未提供（未來 Date Range Picker） | 目前暫用兩個獨立 DatePicker + 自己組範圍邏輯 |
| 日期 + 時間（含時分） | ⚠️ 尚未提供（未來 DateTime Picker） | 目前暫用 DatePicker + 另一個 Input for time，不理想 |
| 相對時間（「3 天前」「昨天」）| 自訂 Display 元件 | DatePicker 的 Display 是絕對日期；相對時間需要計算 + locale 格式化 |
| 純文字 YYYY-MM-DD（不需要 picker）| `Input` | 如 API debug 介面、不需互動的純記錄 |
| 生日等「只有月日、不需要年」的欄位 | 目前用 DatePicker 忍受年份 | 多數情境可接受；要極致可自訂 MonthDayPicker |

---

## 原生 date picker

使用瀏覽器原生的 date picker，不自建 calendar。理由：

- 原生 picker 自動處理 locale、無障礙、鍵盤操作
- 行動裝置上原生 picker 體驗遠優於自建
- 視覺由 Field wrapper 統一，原生 picker 的「外觀」被完全覆蓋

### Calendar icon

左側固定顯示 Calendar icon（`startIcon`），取代原生 date input 的預設指示器（原生指示器透過 CSS 隱藏）。

---

## 格式化

| 選項 | 說明 | 範例 |
|------|------|------|
| `formatOptions` | `Intl.DateTimeFormatOptions` | `{ year: 'numeric', month: 'short', day: 'numeric' }` |
| `locale` | BCP 47 locale | `'zh-TW'`、`'en-US'` |

Display 模式（readonly / disabled / DataTable cell）使用 `Intl.DateTimeFormat` 格式化。Edit 模式顯示原生 date input 的格式（瀏覽器 locale 決定）。

---

## Clearable

`clearable` prop 在有值時顯示 clear 按鈕（endAction）。

- 只在 edit 模式顯示
- 清除後 value 變為 `null`（Display 顯示 —）

---

## 禁止事項

- ❌ 不自建 calendar picker——使用原生 `<input type="date">`
- ❌ 不在 readonly / disabled 模式顯示 clear 按鈕

---

## 相關

- `../Input/input.spec.md` — 純文字 YYYY-MM-DD（不需 picker 互動的場景）
- `../NumberInput/number-input.spec.md` — 年齡、天數等數值
- `../Field/field-controls.spec.md` — Field Control 共用規則（mode / size / endAction / error）
