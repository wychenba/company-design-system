# UI 開發規則 — 深度展開

`.claude/rules/ui-development.md` 的 detail 版本。主章留 meta 規則(必重用既有 / 用 token / 檢查 pattern / `cn()` / 清 imports 後 runtime 驗證 / 一句話 pointer),本檔放 4 個 sub-rule 的完整規格。

---

## 同 flex 列的互動 slot 幾何鐵律(避免 gap token 被破壞)

任何新 slot(status indicator / inline action / hover-swap button)放進既有 flex row 之前,**必須**執行 3 步 mechanical check:

1. **grep 該行既有 interactive slot 的 box 尺寸**:讀 row host spec(FileItem rich row=56 用 Button xs 24 / compact row=24 用 Inline Action,依 item-anatomy「≤24 cap」canonical);grep stories 看 consumer 傳什麼
2. **新 slot box 尺寸 = 既有 slot 尺寸**(嚴格相等):不同 → `gap-*` token 被 overflow 吃掉,實際 gap ≠ 宣告值;例外需明文 spec 註解
3. **Hover state 也要驗**:hover-bg / ring / focus outline 若超出 box 會吃進 gap 空間

**失敗案例**:2026-04-19 FileItem status-slot hover-swap 用 `ItemInlineActionButton` 16px(不符 rich 用 Button),hover-bg 24px overflow 吃掉 4px `gap-2` → status ↔ delete 實際 gap 變 ~4px 違反 8px。修法:rich row=56 用 Button xs 24 / compact row=24 用 Inline Action。

**世界級鐵律**:同 flex 列互動元素統一 box 尺寸,gap token 才能如實呈現 — 跨元件治理層不變量,非元件內部細節。

---

## 新增數值前必先查既有 pattern(舉一反三)

寫 gap / padding / font-size / line-height / icon size / border-radius 數值前,**必 grep 系統現值**。

- `gap` → `fieldWrapperStyles`(gap-2)/ MenuItem cva / SelectionItem cva
- `padding` → `--layout-space-loose/tight` / fieldWrapperStyles `px-3`
- `font-size` → `typography.css` + item-anatomy reading/scanning 規則
- `line-height` → scanning = leading-compact 1.3,reading = default 1.5
- `icon size` → `ICON_SIZE` 常數(sm/md=16, lg=20)
- `inline action` → item-anatomy「Inline Action 設計規格」(icon 16 / hover-bg=icon+2 / gap-2 / fg-muted → hover foreground)

**舉一反三**:Select inline action gap-2 → 所有元件 inline action gap-2。MenuItem description reading 14px → 所有 reading mode desc 14px。確實需要新值 → 先提理由讓 user 確認,不自決。

---

## Padding source 分層規則(三層各自 canonical)

| 層級 | 用途 | 來源 | 例 |
|------|------|------|---|
| **Chrome / Section / Card**(跨元件、密度切換)| page gutter / card padding / toolbar / dialog body | `p-[var(--layout-space-loose)]` / `p-[var(--layout-space-tight)]` | FileViewer toolbar / Dialog body |
| **元件內 slot**(結構性、不隨 density)| MenuItem row / Field wrapper / Dropdown item padding | Tailwind `p-N`(`p-3` / `px-2 py-1.5` 等) | item-anatomy row `px-2` / Field `px-3` |
| **精確幾何**(icon ↔ text 對齊、calc-based)| Button padding = `(field-height - icon-size)/2` | `p-[calc(...)]` / `p-[var(...)]` | Button `px-[calc((h-field-md-icon-md)/2)]` |

**判斷法**:padding 會隨 density/theme 變動嗎?是 → layout-space token;元件內部 layout 結構?是 → Tailwind `p-N`;跟 icon/text/token 算出來?是 → calc()/var。

**禁止**:Chrome padding 硬寫 `p-4`(density 切換會壞)/ 元件內 slot 用 `p-[var(--layout-space-tight)]`(密度切換讓 row 結構跑掉)。

---

## Icon size 來源分層規則

Icon 尺寸按 context 分三類:

| Context | 來源 | 例 |
|---------|------|---|
| **Row primitive 內**(MenuItem / TreeItem / SelectionItem / FileItem slot)| `ICON_SIZE[size]` 讀 `RowSizeContext`(自動 size-aware) | `<ItemIcon icon={User} />` 內部走 `ICON_SIZE[contextSize]` |
| **Button startIcon / endIcon** | Button 自己 mapping(固定 16/16/20 by size)| `<Button size="lg" startIcon={Save} />` 自動走 20px |
| **一次性 / 非 row / 非 Button**(chrome / decorative / toolbar)| inline `size={n}`,**n 必對齊 uiSize token**(16/20/24,不自創)| `<FileIcon size={16} />` |

**禁止**:Tailwind `w-4 h-4` / `size-4` 表達 icon size(是 dimension 非 semantic)/ Row 內手刻 `<Icon size={16} />` 繞過 Context(density 切換不聯動)/ 自創非 uiSize 值(`size={18}` / `size={22}`)。
