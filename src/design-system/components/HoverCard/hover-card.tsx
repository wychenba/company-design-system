import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"
import { OVERLAY_SIDE_OFFSET } from "@/design-system/tokens/elevation/overlay-geometry"

/**
 * HoverCard — hover 顯示可互動內容的浮層（行為 primitive）
 *
 * 跟 Tooltip 的差異：內容可互動（按鈕、連結、hover 子元素）。
 *
 * **不含視覺樣式**——bg、border、shadow、padding 由 consumer 決定：
 * - OverflowIndicator：深色 Tooltip 樣式（bg-tooltip + data-theme="dark"）
 * - NameCard：亮色 Card 樣式（bg-surface-raised + elevation-200）
 *
 * 只提供：z-index、動畫、sideOffset。
 */

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = OVERLAY_SIDE_OFFSET, collisionPadding = 12, ...props }, ref) => (
  // HoverCardPrimitive.Portal(2026-04-23):把 Content 搬到 `document.body`。
  // 不 Portal 時 Content 會 DOM-nested 在 trigger subtree,如 trigger 位於 OverflowIndicator
  // `data-theme="dark"` tooltip 內部 → Avatar 自帶 HoverCard 的 Content 也卡在 dark subtree,
  // CSS var(--foreground) 繼承 dark 值 → NameCard 內部文字變 white 看不見(user 抓的 bug)。
  // Portal 到 body 讓 CSS 繼承 chain 從 app root data-theme 起算,不受 trigger subtree 污染。
  //
  // collisionPadding=12:Radix / browser 內部 1-2px rounding 讓 visual padding 比 prop 值少 1-2px。
  // 提高到 12 保證使用者實際看到 ≥ 8px viewport edge gap(overlay-surface「靠邊 8px」canonical)。
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        "z-50 outline-none",
        // 2026-05-04 viewport-aware max-h SSOT(對齊 Popover):header/footer 永遠 in-viewport,body 壓縮 scroll
        // 2026-05-05 audit dim 35 fix:加 `min-h-0` 完成 M25 chain invariant
        "max-h-[var(--radix-hover-card-content-available-height,100vh)] flex flex-col overflow-hidden min-h-0",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "origin-[var(--radix-hover-card-content-transform-origin)]",
        className,
      )}
      {...props}
    />
  </HoverCardPrimitive.Portal>
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

// Story auto-compile metadata — Phase 1 mechanical migration(2026-04-24)
// Phase 2 fill needed: purpose descriptions + when rationale + world-class refs
export const hoverCardMeta = {
  component: 'HoverCard',
  family: null, // non-family composite / overlay / layout
  variants: {

  },
  sizes: {

  },
  states: ['default', 'hover', 'active', 'focus-visible', 'disabled'],
  tokens: {
    bg: ['bg-surface-raised'],
    fg: ['--foreground'],
    ring: [],
  },
} as const

export { HoverCard, HoverCardTrigger, HoverCardContent }
