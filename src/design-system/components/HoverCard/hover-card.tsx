import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

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
>(({ className, align = "center", sideOffset = 8, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 outline-none",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      "origin-[--radix-hover-card-content-transform-origin]",
      className,
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
