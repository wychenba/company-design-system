import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/design-system/components/Avatar/avatar'

/**
 * Empty — 空狀態視覺元件
 *
 * 居中垂直堆疊:icon(Avatar) → title → description → action。
 * 所有 slot 皆可選,預設只需 description。
 *
 * 間距走 layout-space token(density-aware):
 *   icon → text = --layout-space-tight
 *   desc → action = --layout-space-loose
 *   title → desc = mt-0.5(item-layout canonical,固定 2px）
 *
 * Outer padding 由 consumer 容器決定(py-12 / py-6 / py-16 等）。
 */

export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** LucideIcon → 自動包 Avatar 48px neutral;ReactElement → 原樣渲染 */
  icon?: LucideIcon | React.ReactElement
  /** 標題(可選,font-medium,適用於首次引導) */
  title?: string
  /** 說明文字 */
  description?: string
  /** 行動按鈕(可選) */
  action?: React.ReactNode
}

const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  ({ icon, title, description, action, className, ...props }, ref) => {
    // Icon rendering: LucideIcon (function) → Avatar; ReactElement → as-is
    let iconElement: React.ReactNode = null
    if (icon) {
      if (typeof icon === 'function') {
        const Icon = icon as LucideIcon
        iconElement = <Avatar icon={Icon} size={48} color="neutral" />
      } else {
        iconElement = icon
      }
    }

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center text-center', className)}
        {...props}
      >
        {iconElement && (
          <div className="mb-[var(--layout-space-tight)]">{iconElement}</div>
        )}
        {title && (
          <span className="text-body-lg font-medium text-foreground">
            {title}
          </span>
        )}
        {description && (
          <span
            className={cn(
              // 有 title 或 action = content mode(fg-secondary,有資訊要讀)
              // 都沒有 = placeholder mode(fg-muted,純佔位提示)
              'text-body',
              (title || action) ? 'text-fg-secondary' : 'text-fg-muted',
              title && 'mt-0.5',
            )}
          >
            {description}
          </span>
        )}
        {action && (
          <div className="mt-[var(--layout-space-loose)]">{action}</div>
        )}
      </div>
    )
  },
)
Empty.displayName = 'Empty'

export { Empty }
