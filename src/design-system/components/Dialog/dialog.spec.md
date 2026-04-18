# Dialog 設計原則

## 定位

Modal 對話框，基於 Radix Dialog。用於**需要使用者注意力、阻斷背景互動**的操作流程（建立、編輯、確認）。

---

## 何時用

- **需要專注的操作流程**：建立 / 編輯複雜表單、多步驟精靈、付款結帳
- **破壞性動作確認**：刪除、離開不儲存、登出多個裝置
- **短暫但重要的資訊**：首次引導、重要公告必須被看到才能繼續
- **需要阻斷背景互動的脈絡**：使用者必須完成或取消此流程才能回到頁面

## 何時不用

| 場景 | 改用 | 原因 |
|------|------|------|
| 短暫的操作回饋（成功 / 失敗訊息）| `Toast` | Dialog 會阻斷流程，Toast 非阻斷 |
| 持久的頁面內通知 | `Alert` | Alert 是 inline 嵌入，不浮起 |
| 側邊操作面板（不需完全阻斷）| `Sheet` | Sheet 從側邊滑入，視覺更輕、常搭配列表 detail |
| 浮動的精簡選單 | `DropdownMenu` / `Popover` | Dialog 是 modal,DropdownMenu/Popover 是輕量浮層 |
| Hover 才出現的輔助資訊 | `Tooltip` / `HoverCard` | Dialog 需要明確觸發,hover 不該是 modal 觸發 |
| 手機全屏編輯 | `Sheet` (bottom / fullscreen) | Dialog 預設 viewport inset,行動裝置用 Sheet 更自然 |

---

## 結構

```
DialogContent (fixed, centered)
├── DialogHeader (border-b)
│   ├── DialogTitle
│   └── Close button (ItemInlineActionButton)
├── DialogBody (flex-1, overflow-y-auto)
└── DialogFooter (border-t)
    └── Action buttons
```

## Density

`DialogContent` 強制 `data-density="lg"`——dialog 內所有子元件的 token 解析為 lg 模式。Dialog 是獨立上下文，不繼承頁面密度。

## Layout

- **水平 padding**：`px-[var(--layout-space-loose)]`（header / body / footer 統一）
- **Header / Footer 垂直 padding**：`py-[var(--layout-space-tight)]`
- **Body 垂直 padding**：`pt-[var(--layout-space-tight)]` + `pb-[var(--layout-space-bottom)]`——底部留較大空間，視覺上不壓迫

## Viewport Inset

Modal 與 viewport 四邊保持 `--layout-space-bottom`（48px）最小間距。maxWidth 也受此限制：`min(maxWidth, 100vw - inset*2)`。

## 高度行為

| 模式 | 條件 | 行為 |
|---|---|---|
| **預設（填滿）** | 不傳 `autoHeight` | `height = 100vh - inset*2`，body 捲動。防止動態內容（載入資料、展開 section）造成 dialog 跳動 |
| **autoHeight** | `autoHeight={true}` | 高度隨內容，超過 viewport 時 `max-height` 安全帽。適合內容量已知且穩定的 dialog（確認框、短表單） |

## maxWidth

預設 512px，consumer 可透過 `maxWidth` prop 調整。

## 關閉按鈕

永遠存在於 DialogHeader 右側。使用 `ItemInlineActionButton`（Inline Action pattern），icon 為 `X`，size `md`。不可移除——使用者永遠需要明確的關閉手段。

## Title

`text-body-lg font-medium truncate`——單行截斷，不換行。

## Footer 按鈕

預設 size `md`，與 Field 系統表單元件尺寸一致。按鈕靠右對齊（`justify-end`），間距 `gap-2`。

## 視覺

- **Overlay**：`bg-overlay`
- **Shadow**：`elevation-200`（浮層級）
- **圓角**：`rounded-lg`
- **背景**：`bg-surface-raised`
- **邊框**：`border-border`
- **分隔線**（header / footer）：`border-divider`

## 動畫

- 進場：fade-in + zoom-in-95 + slide-in-from-center
- 離場：fade-out + zoom-out-95 + slide-out-to-center

## 狀態處理的職責邊界

Dialog 是容器，無整體 disabled / loading / empty 狀態——這些屬於內容層的責任：

| 狀態 | 處理方式 |
|------|---------|
| **Loading**（內容載入中）| Consumer 在 `DialogContent` 內渲染 Skeleton / Spinner，不是讓 Dialog 本身等待開啟 |
| **Empty**（如步驟 dialog 還沒資料）| Consumer 在 content 區用 `Empty` primitive |
| **Error**（操作失敗）| Consumer 在 content 區用 `Alert` |
| **Disabled**（整個 dialog）| N/A——dialog 要麼開著（可互動）要麼關著（不存在）。要鎖操作請 disable 內部個別 Button / Field |

**Dark mode**：由 semantic token（`bg-surface-raised` / `border-border`）自動切換，無自訂 palette。

**Density**：Dialog 強制 `data-density="lg"`（見上「Density」段），不繼承頁面 density。

---

## 相關

- `../Sheet/sheet.spec.md` — 側邊滑入的輕量替代（共用 Radix Dialog base）
- `../Toast/toast.spec.md` — 非阻斷的短暫回饋
- `../Alert/alert.spec.md` — 頁面內持久通知
- `../Popover/popover.spec.md` — 輕量浮層（non-modal）
- `../DropdownMenu/dropdown-menu.spec.md` — 浮動選單
- `../Tooltip/tooltip.spec.md` — hover 輔助資訊
