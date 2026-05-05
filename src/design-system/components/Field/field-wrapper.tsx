import { cva } from 'class-variance-authority'

// ── Field Wrapper Styles ────────────────────────────────────────────────────
// 所有 Field 元件共用的 input wrapper 樣式。
//
// 4 種模式(2026-05-05 expand):
//   edit     — bg-surface, border, hover/focus 回饋(可編輯 input)
//   display  — 純展示(無 input chrome、無 affordance);語意「read-only 內容,展示給人看」。
//              對齊 Carbon read-only / PatternFly inline-edit hidden-input。
//   readonly — bg-disabled(neutral-2), 無邊框, 文字正常色(input chrome 但鎖定)
//   disabled — bg-disabled(neutral-2), 無邊框, 文字灰化
//
// 2 種視覺外殼(variant):
//   default — 完整 chrome(form input 場景)
//   bare    — 透明 chrome(cell-as-input substrate / Toolbar inline editing)
//
// 高度:固定 h = field-height token(rem),與 Button 共用同一組 token。

export const fieldWrapperStyles = cva(
  [
    // K10 fix(2026-05-04):`group/field` 讓 inner placeholder/text 可透過 `group-data-[field-mode=...]/field:` 變體
    //   各 Field 元件 wrapper 同時加 `data-field-mode={resolvedMode}` 屬性,bareInputStyles 即可
    //   依 mode 切 placeholder color。User canonical:disabled 顯著性優於 muted。
    'group/field',
    'inline-flex items-center w-full rounded-md',
    'text-foreground font-normal',
    'transition-colors duration-150',
  ],
  {
    variants: {
      mode: {
        edit: '',
        display: '',
        readonly: '',
        disabled: '',
      },
      variant: {
        // default — 完整 Field wrapper chrome(bg-surface、明顯 border、hover/focus 回饋)
        default: '',
        // bare — 透明 variant,hover / focus 才出現 border。適用 Toolbar inline editing
        // (FileViewer zoom input / chart config / rich text toolbar number input 等)。
        // 世界級對照:VS Code settings / Figma toolbar number / Notion prop input。
        bare: '',
        // naked — 完全無 variant,hover/focus 也不出 border。適用 cell-as-input
        // (host cell 自管 border + focus visual,內部 input 純文字承載)。
        // 世界級對照:Airtable / Notion / Excel / Google Sheets cell editing。
        naked: '',
      },
      size: {
        sm: 'text-body h-field-sm px-3 gap-2',
        md: 'text-body h-field-md px-3 gap-2',
        lg: 'text-body-lg h-field-lg px-3 gap-2',
      },
    },
    // mode x variant 交叉:visual chrome 由 compoundVariants 決定
    //
    // Overlay trigger active state(canonical 2026-05-02):當 Field 是 Popover/DropdownMenu/
    // Combobox trigger 用 asChild,Radix 自動 set `data-state="open"` on trigger root → trigger
    // 視覺維持 hover 樣式直到浮層關閉(對齊 inline-action.spec.md「狀態極簡派」)。
    compoundVariants: [
      // default variant chrome by mode
      {
        mode: 'edit',
        variant: 'default',
        className: [
          'bg-surface border border-border',
          'hover:border-border-hover',
          'focus-within:border-primary focus-within:hover:border-primary',
          'data-[state=open]:border-border-hover',
        ],
      },
      {
        mode: 'display',
        variant: 'default',
        // 純展示:無 input variant,無 hover/focus affordance(語意 = 純內容展示)
        className: 'bg-transparent border border-transparent',
      },
      {
        mode: 'readonly',
        variant: 'default',
        className: 'bg-disabled border border-transparent',
      },
      {
        mode: 'disabled',
        variant: 'default',
        className: 'bg-disabled border border-transparent cursor-not-allowed',
      },
      // bare variant chrome by mode
      {
        mode: 'edit',
        variant: 'bare',
        className: [
          'bg-transparent border border-transparent',
          'hover:border-border',
          'focus-within:border-primary focus-within:hover:border-primary',
          'data-[state=open]:border-border',
        ],
      },
      {
        mode: 'display',
        variant: 'bare',
        // bare + display:cell-as-input default state(無 variant,完全融入 cell;hover/focus 才有 affordance 等 user 點下去切 edit mode)
        className: 'bg-transparent border border-transparent',
      },
      {
        mode: 'readonly',
        variant: 'bare',
        className: 'bg-transparent border border-transparent',
      },
      {
        mode: 'disabled',
        variant: 'bare',
        className: 'bg-transparent border border-transparent cursor-not-allowed opacity-disabled',
      },
      // naked variant — cell-as-input substrate(Notion / Airtable / Excel canonical)
      //   - `!h-full`: Field 框框 = host cell box(frame 填 cell)
      //   - **state ring 用 outline + offset:[-1px] straddle**(2026-05-05 v4 user canonical):
      //     不用 `border` — border 吃 2px 高度 + corner gap。
      //     不用 `box-shadow inset` — 只畫內側,不蓋 adjacent grid 外側 borders(user 實測雙線重疊)。
      //     **`outline-2 outline-offset-[-1px]`** = 1px 內 + 1px 外,straddle cell edge,完全蓋過
      //     this row border-b(內 1px)+ adjacent cell border-r(外 1px)+ previous row border-b(外 1px)。
      //   - **token SSOT**:hover/open 用 `--border`(同 Field bare 共用,transparent → 浮現語意);
      //     focus-within 用 `--primary`(同 Field default + bare 共用,主強調)。**user 改任一 token
      //     value → Field default + bare + naked 三家全動**(token-level SSOT,無新 alias)。
      //   - **edit mode 反向接管 cell padding**(`!py-[var(--table-cell-py)] !px-[var(--table-cell-px)]`):
      //     host cell editing 時 padding=0,Field 內部加回 padding → 切 mode 文字 0 px shift。
      //   - display / readonly / disabled `!px-0 !py-0`:host cell 仍有 padding,Field 不重複加。
      //   - **內 alignment 從 host cell 取**(`nakedCellRowModeAlign` SSOT,M19 propagate)
      {
        mode: 'edit',
        variant: 'naked',
        className: [
          'bg-transparent !border-0 !rounded-none !gap-0 !h-full',
          '!px-[var(--table-cell-px)] !py-[var(--table-cell-py)]',
          'group-data-[row-mode=auto]/cell:!items-start',
          'hover:outline hover:outline-2 hover:outline-offset-[-1px] hover:outline-border',
          'focus-within:outline focus-within:outline-2 focus-within:outline-offset-[-1px] focus-within:outline-primary',
          'data-[state=open]:outline data-[state=open]:outline-2 data-[state=open]:outline-offset-[-1px] data-[state=open]:outline-primary',
        ],
      },
      {
        mode: 'display',
        variant: 'naked',
        className: [
          'bg-transparent !border-0 !rounded-none !px-0 !py-0 !gap-0 !h-full',
          'group-data-[row-mode=auto]/cell:!items-start',
        ],
      },
      {
        mode: 'readonly',
        variant: 'naked',
        className: [
          'bg-transparent !border-0 !rounded-none !px-0 !py-0 !gap-0 !h-full',
          'group-data-[row-mode=auto]/cell:!items-start',
        ],
      },
      {
        mode: 'disabled',
        variant: 'naked',
        className: [
          'bg-transparent !border-0 !rounded-none cursor-not-allowed opacity-disabled !px-0 !py-0 !gap-0 !h-full',
          'group-data-[row-mode=auto]/cell:!items-start',
        ],
      },
    ],
    defaultVariants: {
      mode: 'edit',
      variant: 'default',
      size: 'md',
    },
  }
)

// ── Bare Input Styles ───────────────────────────────────────────────────────

export const bareInputStyles = [
  'flex-1 min-w-0 bg-transparent',
  'outline-none border-none p-0',
  'text-[inherit] font-[inherit] leading-[inherit]',
  // A3 fix(2026-05-05):`<input>` UA stylesheet 強制 `text-align: start`,阻斷 parent 的
  //   `text-right`/`text-center` 繼承。顯式 `text-align: inherit` 復原(對齊 NumberCell /
  //   CurrencyCell right-align canonical:column meta.align='right' → cell text-right →
  //   input 跟著 right-align)。
  '[text-align:inherit]',
  'placeholder:text-fg-muted',
  // K10 fix(2026-05-04):wrapper data-field-mode=disabled 時,placeholder/text 都切 fg-disabled
  //   依賴 fieldWrapperStyles 的 `group/field` + 各 Field 元件 wrapper 加 `data-field-mode={resolvedMode}`
  //   User canonical:disabled state 顯著性優於 muted(neutral-6 > neutral-7)
  'group-data-[field-mode=disabled]/field:placeholder:text-fg-disabled',
  'group-data-[field-mode=disabled]/field:text-fg-disabled',
].join(' ')

// ── Naked Variant Cell Row-Mode Alignment Propagation ──────────────────────
// SSOT canonical(M19 / 2026-05-05):cell-as-input naked variant 元件**所有內部
// wrapper**(`<span>` 包 Avatar+name 等)必 import + apply 此 SSOT,host cell
// `data-row-mode` 屬性自動 propagate alignment(autoRow → items-start / fixed → items-center)。
//
// 不 propagate 的後果:autoRow 場景下 People / Select / Combobox 內部用
// `inline-flex items-center` hardcode → 視覺垂直置中於 wrapper 自身高度,**沒**頂對齊
// → 跟其他純文字 cell baseline 視覺漂移。
//
// 世界級對照:
//   - HTML <td> default `vertical-align: baseline`(瀏覽器自動 first-baseline align)
//   - AG Grid `cellStyle` + `cellRendererSelector`,row context 共享(closed source 部分)
//   - Material X-Grid `gridClasses.cell` wrapper 不允許 cell content override alignment
//   - Notion / Airtable cell content 從 host 繼承,不 hardcode self alignment
//
// Hook:`check_naked_row_mode_propagation.sh`(write-time BLOCKER)
// Audit:design-system-audit Group N M27(periodic batch verify)
export const nakedCellRowModeAlign = 'group-data-[row-mode=auto]/cell:items-start'

// ── Cell-as-input State Ring SSOT(M19 / 2026-05-05 v4 token-level)──────────
// 三個 ring class 給 cell wrapper(editable display hover)+ Field naked(edit state)+
// 任何 cell-as-input substrate 共用。**SSOT 在 token 層**:hover 走 `--border`(同 Field
// bare hover token,transparent → 浮現語意),focus-within / open 走 `--primary`。
// User 改 `--border` 或 `--primary` 值 → Field default + bare + naked **三變體全跟動**。
// `outline-2 outline-offset-[-1px]` straddle cell edge:1px 內 + 1px 外,完整蓋過 4 邊
// adjacent grid divider(this row border-b 內 1px / previous row border-b + adjacent
// border-r 外 1px),**不留漏邊雙線**。
export const nakedCellHoverRing = 'hover:outline hover:outline-2 hover:outline-offset-[-1px] hover:outline-border'
export const nakedCellFocusRing = 'focus-within:outline focus-within:outline-2 focus-within:outline-offset-[-1px] focus-within:outline-primary'
export const nakedCellOpenRing = 'data-[state=open]:outline data-[state=open]:outline-2 data-[state=open]:outline-offset-[-1px] data-[state=open]:outline-primary'

// ── Cell-as-input Edge Slot SSOT(M19 / 2026-05-05 v4)──────────────────────
// prefix(startIcon / Avatar / category icon)+ suffix(chevron / clear / endIcon / calendar)
// 對齊 canonical 是**對稱的**:autoRow 場景 edge slot 中心 = value **第 1 行**垂直中心
// (不是 cell 頂、也不是全高中心)。對齊 Combobox wrap mode line 372-373(`self-start +
// height:tagHeight + flex items-center`)world-class pattern(Notion / Airtable / Linear
// select / Slack message composer 共識:icon align with first text line, not block center)。
//
// **Group-data conditional**:只在 host cell `data-row-mode=auto` 時切換 alignment;
// fixed row(default `items-center`)走 Field 自然 flex(edge slot 跟 value 一同垂直置中)。
// autoRow 才 `self-start + h-[1lh] + flex items-center` 把 edge slot 鎖在第 1 行高度範圍
// 內,中心對齊第 1 行。
//
// 命名:`Prefix` / `Suffix` 兩個 alias 共用同一 class — 幾何對稱(symmetric edge),但
// 消費端意圖不同(prefix = startIcon / category-icon;suffix = chevron / clear / calendar)。
// 兩個名比 `nakedCellEdgeSlot` 一個名 self-document 度高(consumer site 一眼讀出方向)。
//
// 用法:wrapper className 套對應 alias(無 inline style 需要)。
//   `<span className={nakedCellPrefixSlot}><StartIcon /></span>`
//   `<span className={nakedCellSuffixSlot}>{chevron}</span>`
const nakedCellEdgeSlotBase = 'shrink-0 flex items-center group-data-[row-mode=auto]/cell:self-start group-data-[row-mode=auto]/cell:h-[1lh]'
export const nakedCellPrefixSlot = nakedCellEdgeSlotBase
export const nakedCellSuffixSlot = nakedCellEdgeSlotBase

// ── Empty Value Display ─────────────────────────────────────────────────────

export const EMPTY_DISPLAY = '—'
