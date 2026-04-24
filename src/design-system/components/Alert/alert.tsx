import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Notice, useInverseTheme, SUBTLE_ICON_COLOR, type NoticeVariant } from '@/design-system/components/Notice/notice'

/**
 * Alert — inline / fixed 通知
 *
 * ── data-theme 必須搭配 text-foreground ──
 * CSS color 從 body 繼承已解析值,data-theme 只改 --foreground 不改 color。
 * 在 theme boundary 設 text-foreground 強制 re-resolve。
 *
 * ── Appearance ──
 * subtle: 淺底色 + 四邊 1px border(色相 hover 色)。不設 data-theme,跟隨頁面。
 * solid: 跟 Toast 對齊:
 *   neutral → data-theme={inverse} + bg-surface-raised（同層翻轉）
 *   info/success/error → bg on outer, data-theme="dark" on inner
 *   warning → bg on outer, data-theme="light" on inner
 *
 * ── Placement ──
 * inline: rounded-md(card-level 圓角,非 overlay — 因 Alert 在頁面流內,非 floating)
 * fixed: 無圓角,full-width,無 border
 */

const SUBTLE_CONTAINER: Record<NoticeVariant, string> = {
  neutral: 'bg-muted border border-border',
  info: 'bg-info-subtle border border-[var(--info-hover)]',
  success: 'bg-success-subtle border border-[var(--success-hover)]',
  warning: 'bg-warning-subtle border border-[var(--warning-hover)]',
  error: 'bg-error-subtle border border-[var(--error-hover)]',
}

const SOLID_HUE_BG: Record<string, string> = {
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
}

const SOLID_HUE_THEME: Record<string, string> = {
  info: 'dark',
  success: 'dark',
  warning: 'light',
  error: 'dark',
}

const alertVariants = cva('w-full overflow-hidden', {
  variants: {
    placement: {
      inline: 'rounded-md',
      fixed: 'rounded-none border-none',
    },
  },
  defaultVariants: { placement: 'inline' },
})

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof alertVariants> {
  variant?: NoticeVariant
  appearance?: 'subtle' | 'solid'
  title: string
  description?: string
  endContent?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

// code-quality-allow: long-function — foundational composite main body — 拆 sub-fn 會複雜化 local state / ref / context binding
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'neutral',
      appearance = 'subtle',
      placement,
      title,
      description,
      endContent,
      dismissible = true,
      onDismiss,
      className,
      ...props
    },
    ref,
  ) => {
    const inverseTheme = useInverseTheme()
    const isSolid = appearance === 'solid'
    const iconClassName = !isSolid ? SUBTLE_ICON_COLOR[variant] : undefined

    const noticeEl = (
      <Notice
        variant={variant}
        title={title}
        description={description}
        endContent={endContent}
        dismissible={dismissible}
        onDismiss={onDismiss}
        iconClassName={iconClassName}
      />
    )

    // ── Subtle ──
    if (!isSolid) {
      return (
        <div
          ref={ref}
          role="alert"
          className={cn(alertVariants({ placement }), SUBTLE_CONTAINER[variant], className)}
          {...props}
        >
          {noticeEl}
        </div>
      )
    }

    // ── Solid neutral (inverse: bg + theme 同層) ──
    if (variant === 'neutral') {
      return (
        <div
          ref={ref}
          role="alert"
          data-theme={inverseTheme}
          className={cn(alertVariants({ placement }), 'bg-surface-raised text-foreground', className)}
          {...props}
        >
          {noticeEl}
        </div>
      )
    }

    // ── Solid 有色相: bg outer + data-theme inner ──
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ placement }), SOLID_HUE_BG[variant], className)}
        {...props}
      >
        <div data-theme={SOLID_HUE_THEME[variant]} className="text-foreground">
          {noticeEl}
        </div>
      </div>
    )
  },
)
Alert.displayName = 'Alert'

// Story auto-compile metadata — Phase 1 mechanical migration(2026-04-24)
// Phase 2 fill needed: purpose descriptions + when rationale + world-class refs
export const alertMeta = {
  component: 'Alert',
  family: null, // non-family composite / overlay / layout
  variants: {

  },
  sizes: {

  },
  states: ['default', 'hover', 'active', 'focus-visible', 'disabled'],
  tokens: {
    bg: [], // TODO: grep tsx for bg-* tokens
    fg: [],
    ring: [],
  },
} as const

export { Alert, alertVariants }
