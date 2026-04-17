import * as React from 'react'
import { cn } from '@/lib/utils'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/design-system/components/HoverCard/hover-card'
import { tagVariants } from '@/design-system/components/Tag/tag'

/**
 * OverflowIndicator — +N 觸發器 + HoverCard 顯示溢出內容
 *
 * 統一用 HoverCard（不用 Tooltip）——溢出內容可能需要互動：
 * - 人員 +N：tag dismiss + hover name card
 * - 一般 +N：穩定顯示溢出項目
 *
 * trigger 不用 Tag 元件（Tag 有內建 truncation Tooltip 會跟 HoverCard 衝突），
 * 改用 tagVariants 直接套樣式。
 */

const triggerSize: Record<string, string> = {
  sm: 'h-5 min-w-5',
  md: 'h-6 min-w-6',
  lg: 'h-6 min-w-6',
}

const triggerText: Record<string, string> = {
  sm: 'text-[10px]',
  md: 'text-caption',
  lg: 'text-caption',
}

export interface OverflowIndicatorProps {
  count: number
  shape?: 'circle' | 'tag'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}

function ShrinkWrapList({ children }: { children: React.ReactNode }) {
  const ref = React.useCallback((container: HTMLDivElement | null) => {
    if (!container) return

    requestAnimationFrame(() => {
      const cs = getComputedStyle(container)
      const padL = parseFloat(cs.paddingLeft) || 0
      const padR = parseFloat(cs.paddingRight) || 0
      const gap = parseFloat(cs.gap) || parseFloat(cs.columnGap) || 0
      const available = container.offsetWidth - padL - padR

      const items = Array.from(container.children) as HTMLElement[]
      if (items.length === 0) return

      let currentRow = 0
      let maxRow = 0

      items.forEach(item => {
        const w = item.offsetWidth
        const needed = currentRow > 0 ? currentRow + gap + w : w

        if (needed > available && currentRow > 0) {
          maxRow = Math.max(maxRow, currentRow)
          currentRow = w
        } else {
          currentRow = needed
        }
      })
      maxRow = Math.max(maxRow, currentRow)

      container.style.maxWidth = `${Math.ceil(maxRow) + padL + padR + 1}px`
    })
  }, [children])

  return (
    <div ref={ref} className="flex flex-wrap gap-1 p-2 max-w-[280px]">
      {children}
    </div>
  )
}

function OverflowIndicator({ count, shape = 'circle', size = 'md', children, className }: OverflowIndicatorProps) {
  if (count <= 0) return null

  const trigger = shape === 'tag' ? (
    <span className={cn(tagVariants({ variant: 'neutral', size }), 'cursor-default', className)}>
      <span className="px-1">+{count}</span>
    </span>
  ) : (
    <span
      className={cn(
        'shrink-0 rounded-full inline-grid place-content-center',
        'bg-muted text-foreground font-medium leading-none cursor-default',
        triggerSize[size],
        triggerText[size],
        className,
      )}
    >
      +{count}
    </span>
  )

  return (
    <HoverCard openDelay={200} closeDelay={300}>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent className="bg-tooltip rounded-lg" data-theme="dark">
        <ShrinkWrapList>{children}</ShrinkWrapList>
      </HoverCardContent>
    </HoverCard>
  )
}
OverflowIndicator.displayName = 'OverflowIndicator'

export { OverflowIndicator }
