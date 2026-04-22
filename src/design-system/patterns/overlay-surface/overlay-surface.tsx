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
 * text variant button,xs 固定 24):header = 24 + 2×tight = 48 md / 56 lg ✓。
 *
 * 若 header 塞 **bounded 控件**(primary / tertiary with bg/border):header 自然長高
 * (sm 28 + 2×12 = 52 md),因 bounded 按鈕有視覺邊界,padding 不會顯得過大 — 這是預期的。
 *
 * ── Unbounded controls 在 header 必 xs canonical ──
 * Dismiss X(always unbounded)+ text variant header action → size="xs"。Rationale:
 * 沒有視覺邊界的 button,padding 外框顯得過大;xs (24 固定) + tight padding 是精確匹配
 * chrome-header-height 的 layout 佔位。世界級 Linear / Notion / Figma 的 modal close X
 * 皆遵循此幾何。
 *
 * ── Token 規則 ──
 * horizontal padding: `px-[var(--layout-space-loose)]`
 * vertical padding: `py-[var(--layout-space-tight)]`
 * 分隔線: `border-{b|t} border-divider`
 *
 * ── Body ──
 * Body 仍 padding-based(content area),`px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]`,
 * Dialog / Sheet body 有 variant="list" 時 py 由 consumer override(見 dialog.tsx)。
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

export const SurfaceHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
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
