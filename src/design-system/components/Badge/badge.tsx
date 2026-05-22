import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ── Badge（notification count indicator）────────────────────────────────────
// 通知計數指示器，用於未讀數量、待辦計數等。
//
// 兩種模式：
//   count — 16px 高，10px 字，font-medium。個位數正圓，多位數膠囊。
//   dot   — 6×6px 純色圓點，無文字。
//
// 四個層級（由 passive 到 urgent）：
//   low（預設） — 灰底灰字（neutral-3 + neutral-7），被動計數
//   medium      — 淺藍底藍字（bg-info-subtle + text-info-text），可延後看
//   high        — 藍底白字（bg-info），有感影響的待辦
//   critical    — 紅底白字（bg-notification），立即處理
//
// 規則：default low, escalate with reason。見 badge.spec.md「選 level 的流程」。

const badgeVariants = cva(
  // 2026-05-21 F1 fix(user verbatim「決策一改leading compact不會影響badge高度的話就改，反正要確保badge高度不變」+「都給我做到好」):
  // leading-none → leading-compact token(utility-registry.json block.leading_numeric)。
  // 高度不變保證:Badge container 顯式 `h-4 (16px)` + `flex items-center`,內部 text-[10px] × leading-compact(1.3) = 13px line-box
  // < 16px container → 不會撐高;dot variant `w-1.5 h-1.5` 無文字內容 leading 無關。
  'inline-flex items-center justify-center rounded-full leading-compact',
  {
    variants: {
      variant: {
        critical: 'bg-notification text-on-emphasis',
        high: 'bg-info text-on-emphasis',
        medium: 'bg-info-subtle text-info-text',
        low: 'bg-secondary text-fg-muted',
      },
      dot: {
        true: 'w-1.5 h-1.5',
        false: 'min-w-4 h-4 px-1 text-[10px] font-medium',
      },
    },
    defaultVariants: {
      variant: 'low',
      dot: false,
    },
  }
)

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>,
    Omit<VariantProps<typeof badgeVariants>, 'dot'> {
  /** dot 模式：6×6px 純色圓點，無文字 */
  dot?: boolean
  /** 顯示的數量（dot 模式下忽略） */
  count?: number
  /** 數量上限，超過時顯示 "max+"（例：max=99 → "99+"） */
  max?: number
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant, dot = false, count, max, className, role, ...props }, ref) => {
    const display = dot ? null : (
      max != null && count != null && count > max ? `${max}+` : `${count}`
    )

    // a11y(2026-04-25 axe aria-prohibited-attr fix):
    // span default 無 role → 不接 aria-label(WCAG 禁止)。Badge 是通知指示器,
    // `role="status"` 語意正確(live region 可播報計數變化)且允許 aria-label。
    // Consumer 可 override(傳 role="img" / role={undefined})。
    return (
      <span
        ref={ref}
        role={role ?? 'status'}
        className={cn(badgeVariants({ variant, dot }), className)}
        {...props}
      >
        {display}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

// Story auto-compile metadata — Phase 1 mechanical migration(2026-04-24)
// Phase 2 fill needed: purpose descriptions + when rationale + world-class refs
export const badgeMeta = {
  component: 'Badge',
  family: 3,
  variants: {
    critical: { purpose: '紅底白字（bg-notification）' },
    high: { purpose: '藍底白字（bg-info）' },
    medium: { purpose: '淺藍底藍字（bg-info-subtle）' },
    low: { purpose: '使用者切 tab 才看，不需搶注意力' },
  },
  sizes: {

  },
  states: ['default', 'hover', 'active', 'focus-visible', 'disabled'],
  tokens: {
    bg: ['bg-info', 'bg-info-subtle', 'bg-notification', 'bg-secondary'],
    fg: ['text-fg-muted', 'text-info-text'],
    ring: [],
  },
  defaultVariant: 'low',
} as const

export { Badge, badgeVariants }
