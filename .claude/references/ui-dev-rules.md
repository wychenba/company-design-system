# UI 開發規則 — 細節

CLAUDE.md `# UI 開發規則` 的詳細展開。主章只留 signal / pointer,詳例 / 判斷表 / 反例放本檔。

## 同 flex 列的互動 slot 幾何鐵律(避免 gap token 被破壞)

**規則**:任何新 slot(status indicator / inline action / hover-swap button)放進既有 flex row 之前,**必須**執行以下 3 步 mechanical check,不可憑直覺:

1. **grep 該行既有 interactive slot 的 box 尺寸**:
   - 先讀 row host 元件的 spec(例:FileItem rich row=56 用 Button xs 24 固定 / compact row=24 用 Inline Action — 依 item-anatomy「≤24 cap」canonical)
   - grep 該 row 的 stories 看 consumer 實際傳什麼 Button/action
2. **新 slot 的 box 尺寸 = 既有 slot 尺寸**(嚴格相等,不是「差不多」):
   - 不同:`gap-*` token 會被 overflow / overshoot 吃掉,實際視覺 gap 不等於宣告值
   - 例外:需明文在 spec 註解(「xs 小刻意縮小因為 ...」)
3. **Hover state 也要驗**:
   - hover-bg / ring / focus outline 若超出 box,會吃進 gap token 空間
   - 例:`ItemInlineActionButton` 的 16 px box + 24 px hover-bg overflow → hover 時視覺變寬,`gap-2`(8 px) 實際剩 ~4 px

**失敗案例**:2026-04-19 FileItem status-slot hover-swap:原本用 `ItemInlineActionButton` 16 px(不符 spec「rich 用 Button」),hover-bg 24 px overflow 吃掉 4 px `gap-2`,造成 status ↔ delete 實際 gap 變 ~4 px 違反 8 px 規格。修法 2026-04-22 後對齊 ≤24 cap canonical:rich row=56 用 Button xs 24 / compact row=24 用 Inline Action。

**世界級 DS 的幾何鐵律**:同 flex 列的互動元素統一 box 尺寸,gap token 才能如實呈現——這是跨元件治理層的不變量,不是元件內部細節。

## 新增數值前必須先查既有 pattern(舉一反三)

寫任何 gap / padding / font-size / line-height / icon size / border-radius 等數值之前,**必先 grep 系統內同類型的值**,確認是否有既有 pattern(延伸 mindset #2「不憑直覺發明」)。

**檢查清單**:
- `gap` → 查 `fieldWrapperStyles`(gap-2)、MenuItem cva、SelectionItem cva
- `padding` → 查 `--layout-space-loose/tight`、fieldWrapperStyles `px-3`
- `font-size` → 查 `typography.css` utilities + `item-anatomy.spec.md` reading/scanning 模式規則
- `line-height` → 查 `typography.css`(scanning = leading-compact 1.3,reading = default 1.5)
- `icon size` → 查 `ICON_SIZE` 常數(sm/md=16, lg=20)
- `inline action` → 查 `item-anatomy.spec.md`「Inline Action 設計規格」節(icon size、hover bg size=icon+2、gap-2 between actions、fg-muted → hover foreground)

**舉一反三**:Select inline action gap-2 → 所有元件 inline action gap-2;MenuItem description reading 14px → 所有 reading mode consumer description 14px。**如果確實需要新值**,先提出理由讓使用者確認,不要自己決定後寫進去。

## Padding source 分層規則(三層各自 canonical)

不同語境的 padding 有不同 source,寫 code 前先判斷屬哪層:

| 層級 | 用途 | 來源 | 例 |
|------|------|------|---|
| **Chrome / Section / Card**(跨元件、密度切換) | page gutter / card inner padding / toolbar 外框 / dialog header-body-footer | `p-[var(--layout-space-loose)]` / `p-[var(--layout-space-tight)]` | FileViewer toolbar / Dialog body padding |
| **元件內 slot**(結構性、不隨 density) | MenuItem row padding / Field wrapper padding / Dropdown item padding | Tailwind `p-N`(`p-3` / `px-2 py-1.5` 等) | item-anatomy row `px-2`(固定) / Field `px-3` |
| **精確幾何**(icon ↔ text 對齊、calc-based) | Button padding = `(field-height - icon-size)/2` / Inline action box = icon + 2px | `p-[calc(...)]` / `p-[var(--...)]` / 特殊 `p-Npx` | Button `px-[calc((h-field-md-icon-md)/2)]` |

**判斷法**:
1. 「這個 padding **會隨 density / theme 變動嗎**?」→ 是 → layout-space token
2. 「這個 padding 是**元件內部 layout 結構**?」→ 是 → Tailwind `p-N`
3. 「這個 padding 是**跟 icon / text / 其他 token 算出來的**?」→ 是 → `calc()` / var 任意值

**禁止**:
- ❌ Chrome padding 用硬寫 `p-4`(應該用 layout-space token,density 切換會壞)
- ❌ 元件內 slot 用 `p-[var(--layout-space-tight)]`(密度切換會讓 row 結構跑掉,應用固定 Tailwind `p-N`)

## Icon size 來源分層規則

Icon 尺寸按 context 分三類,寫 code 前判斷屬哪類:

| Context | 來源 | 例 |
|---------|------|---|
| **Row primitive 內**(MenuItem / TreeItem / SelectionItem / FileItem slot) | `ICON_SIZE[size]` 讀 `RowSizeContext`(自動 size-aware) | `<ItemIcon icon={User} />` 內部走 `ICON_SIZE[contextSize]` |
| **Button startIcon / endIcon** | Button 自己的 mapping(固定 16 / 16 / 20 by size) | `<Button size="lg" startIcon={Save} />` 自動走 20px |
| **一次性 / 非 row / 非 Button**(chrome icon / decorative / toolbar 圖示) | inline `size={n}`,但 **n 必對齊 uiSize token**(16/20/24 等,不自創) | `<FileIcon size={16} />` in Toolbar |

**禁止**:
- ❌ 用 Tailwind `w-4 h-4` / `size-4` 表達 icon size(這是 dimension 不是 semantic)
- ❌ Row 內 hand-craft `<Icon size={16} />` 繞過 `RowSizeContext`(density 切換不會聯動)
- ❌ 自創非 uiSize token 數值(如 `size={18}`、`size={22}`)(違反 mindset #2)

## 清 unused imports 後必須跑 runtime 驗證

`tsc -b` 必要但不充分(曾漏抓 JSX 內 identifier 和未宣告 export)。任何 import/export 異動後:

1. `npx tsc -b`(**禁用 `--noEmit`**,root tsconfig `files: []` 會 silent pass)
2. grep `export { }` 確認每個 identifier 都有定義
3. `npm run storybook` 實際載入動到的 story
4. 互動操作確認動態 path
