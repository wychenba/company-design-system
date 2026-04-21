import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/design-system/components/Avatar/avatar'
import { useRowSize } from '@/design-system/patterns/element-anatomy/item-anatomy'

/**
 * Empty — 空狀態視覺元件
 *
 * 居中垂直堆疊:icon(Avatar) → title → description → action。
 * 所有 slot 皆可選,預設只需 description。
 *
 * 間距固定,不隨 density 變（Empty 是展示性元件,不是工作區域元件）:
 *   icon → text = mb-4（16px）
 *   desc → action = mt-6（24px）
 *   title → desc = mt-0.5（2px,item-layout canonical）
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
    // 字體 tier:讀 RowSizeContext(menu 內自動對齊 menu items 的字體）
    // 沒有 context(standalone）→ fallback 'md' → text-body (14px)
    const rowSize = useRowSize('md')
    const descFont = rowSize === 'lg' ? 'text-body-lg' : 'text-body'

    // Icon rendering: ReactElement → as-is;LucideIcon(component,包括 forwardRef 物件)→ 包 Avatar
    // 注意:Lucide v0.577+ icons 是 forwardRef 物件(`typeof === 'object'`),不是 function。
    // 必用 React.isValidElement 判斷 element vs component(typeof 會把 forwardRef 物件誤歸 object)。
    let iconElement: React.ReactNode = null
    if (icon) {
      if (React.isValidElement(icon)) {
        iconElement = icon
      } else {
        const Icon = icon as LucideIcon
        iconElement = <Avatar icon={Icon} size={48} color="neutral" />
      }
    }

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center text-center', className)}
        {...props}
      >
        {iconElement && (
          <div className="mb-4">{iconElement}</div>
        )}
        {title && (
          <span className="text-body-lg font-medium text-foreground">
            {title}
          </span>
        )}
        {description && (
          <span
            className={cn(
              // 字體跟 RowSizeContext 對齊:sm/md = text-body (14px),lg = text-body-lg (16px)
              // 在 menu 內自動對齊 menu items;standalone 時 fallback text-body
              descFont,
              (title || action) ? 'text-fg-secondary' : 'text-fg-muted',
              title && 'mt-0.5',
            )}
          >
            {description}
          </span>
        )}
        {action && (
          <div className="mt-6">{action}</div>
        )}
      </div>
    )
  },
)
Empty.displayName = 'Empty'

export { Empty }
