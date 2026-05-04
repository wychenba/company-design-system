import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Overlay Surface primitives — Dialog / Popover / Sheet 共用結構化 sub-components。
 *
 * 抽象這層避免各自硬寫 padding / border 導致漂移。有特殊行為(Dialog Close 按鈕 /
 * viewport-fill 高度)由 consumer 額外包裝,不污染 primitive。
 *
 * ── Header / Footer 高度 canonical(2026-04-22 v3 校準,user intent 精確實作)──
 * **Padding-based sizing**:`py-[var(--layout-space-tight)]`,高度 = max(child) + 2×tight
 * 不用 fixed `min-h`(先前誤用 min-h-chrome-header-height 會讓 bounded button 被鎖死在 48
 * slot 失去自然高度,違反 user 意圖)。
 *
 * 對齊 `--chrome-header-height`(48/56)的**條件**:header 只放 unbounded 控件(close X /
 * text variant button,**native sm + v5 unbounded trick layout 佔位 24**):
 *   header = 24 + 2×tight = 48 md / 56 lg ✓。
 *
 * 若 header 塞 **bounded 控件**(primary / tertiary with bg/border):header 自然長高
 * (sm 28 + 2×12 = 52 md),因 bounded 按鈕有視覺邊界,padding 不會顯得過大 — 這是預期的。
 *
 * ── Unbounded controls 在 header canonical(v5 trick,2026-04-22)──
 * Dismiss X(always unbounded)+ text variant header action → **`size="sm"` native**
 * + SurfaceHeader CSS 自動套負 my trick(對 `[data-unbounded]`),layout 佔位縮回 24
 * (xs 等同)。Rationale:button native size 跟 touch target 保留 sm(a11y 最小 24+ hit
 * target,視覺 render 仍 28/32),layout 佔位精確匹配 chrome-header-height 幾何。詳
 * `overlay-surface.spec.md`「Chrome dismiss size canonical」。
 *
 * **Notification banner family**(Notice / Alert / Toast,fixed `px-4 py-3` chrome,
 * 無 padding-based header)→ dismiss 用 `size="xs"` explicit(24 固定,無 trick)。
 *
 * ── Token 規則 ──
 * horizontal padding: `px-[var(--layout-space-loose)]`
 * vertical padding: `py-[var(--layout-space-tight)]`
 * 分隔線: `border-{b|t} border-divider`
 *
 * ── Body ──
 * Body padding-based(content area),`px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]`。
 * Dialog / Sheet body 走 ScrollArea + chrome padding(`px-loose pt-tight pb-bottom`)。
 * List-as-region 場景(menu / Cmd+K)由 consumer 用 className override 撤 chrome padding +
 * 自管 list outer wrapper(詳 overlay-surface.spec.md「List-as-region in overlay body」)。
 */

// Chrome-slot layout trick(2026-04-22 v5,user intent 精確實作):
// **所有 unbounded control**(Button with `data-unbounded="true"` — Button 自動在 variant="text" 或 dismiss
// 時標記)的 **native size 不變**(sm: 28 md / 32 lg),但 **layout 佔位** via 負 `my` 縮回 24。效果:
// - Button render + touch target = native sm(視覺 / a11y 不受影響)
// - Layout 佔位 = 24(與 SurfaceHeader py-tight 組合 = 48/56 chrome-header-height ✓)
// - Header 若塞 bounded button(primary/tertiary 有 bg/border,無 data-unbounded)→ 不套負 my,自然長高
// 負 my 公式:(field-height-xs - field-height-sm) / 2,density-aware:
//   md: (24 - 28) / 2 = -2px
//   lg: (24 - 32) / 2 = -4px
const CHROME_UNBOUNDED_SLOT = '[&_[data-unbounded]]:my-[calc((var(--field-height-xs)-var(--field-height-sm))/2)]'

/**
 * Lightweight chrome canonical(2026-05-04 Q10 重思):
 *   Popover 派輕量 chrome = `min-h-10` (40px) + `!py-2` (8×2=16) → inner 24 匹配 unbounded slot trick
 *   比 Dialog/Sheet (48 chrome-header-height) 輕一級,對齊 Linear/Notion/Figma popover header idiom
 *   Title text-body 14 (line-height 20) 在 24 inner slot 內垂直置中 + button slot 24 也剛好
 *   消費者 = `<SurfaceHeader className={LIGHTWEIGHT_CHROME_HEADER}>`(任何 popover 內 panel)
 */
export const LIGHTWEIGHT_CHROME_HEADER = 'min-h-10 !py-2'
export const LIGHTWEIGHT_CHROME_FOOTER = 'min-h-10 !py-2'

export const SurfaceHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // Padding-based(預設) — Dialog/Sheet 用 body-lg title (16/24)，自然撐 max(24 title, 24 button slot) = 24
  // → header = 24 + py-tight 12×2 = 48 chrome-header-height ✓ 穩定無需 min-h
  // Popover 等輕量 chrome 走 PopoverHeader override(min-h-10 + py-2 = 40,內 24 匹配 button slot)
  <div
    ref={ref}
    className={cn(
      'flex items-center gap-2 shrink-0 border-b border-divider',
      'px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]',
      CHROME_UNBOUNDED_SLOT,
      className,
    )}
    {...props}
  />
))
SurfaceHeader.displayName = 'SurfaceHeader'

export const SurfaceBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]',
      className,
    )}
    {...props}
  />
))
SurfaceBody.displayName = 'SurfaceBody'

export const SurfaceFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-2 shrink-0 border-t border-divider',
      'px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]',
      className,
    )}
    {...props}
  />
))
SurfaceFooter.displayName = 'SurfaceFooter'
