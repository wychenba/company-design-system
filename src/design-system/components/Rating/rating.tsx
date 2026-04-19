import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Rating — 星星評分元件
 *
 * 世界級對照:Ant Design `<Rate>`、Material MUI `<Rating>`。
 * shadcn 核心沒有 Rating,本元件自建。
 *
 * ── 使用情境 ──
 * - review / feedback:商品評分 / 服務評分(可編輯 + 唯讀兩種)
 * - display:已提交評分的唯讀呈現(商品清單星等)
 *
 * ── 視覺 ──
 * 填色用 `var(--warning)`(yellow-6,世界級黃星 convention;與 warning 語意共用色相
 * 但語境不同,評分 = UX convention color 非 status)。
 * 空色用 `var(--color-neutral-4)`(灰色;與 disabled/empty 同級)。
 *
 * ── 互動 ──
 * interactive(預設):hover 預覽、click 設值、keyboard Left/Right 改值
 * readOnly:純顯示,不響應 hover / click
 *
 * ── 精度 ──
 * precision="full"(預設) — 整星(1, 2, 3, 4, 5)
 * precision="half" — 半星(0.5, 1, 1.5, 2, 2.5, ..., 5)
 */

const SIZE_PX = { sm: 16, md: 20, lg: 24 } as const

export interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 當前評分(0 ~ max) */
  value?: number
  /** 預設值(uncontrolled) */
  defaultValue?: number
  /** 評分改變 callback */
  onChange?: (value: number) => void
  /** 滿分(預設 5) */
  max?: number
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 精度:full = 整星,half = 半星 */
  precision?: 'full' | 'half'
  /** 唯讀(無 hover / click 響應) */
  readOnly?: boolean
  /** 完全停用 */
  disabled?: boolean
  /** 自訂 icon(預設 Star);傳 LucideIcon 或 ReactElement */
  icon?: React.ComponentType<{ size?: number; className?: string; fill?: string }>
  /** a11y label(readOnly 時必填,interactive 時建議填) */
  'aria-label'?: string
}

const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      value,
      defaultValue = 0,
      onChange,
      max = 5,
      size = 'md',
      precision = 'full',
      readOnly = false,
      disabled = false,
      icon: Icon = Star,
      className,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const [hoverValue, setHoverValue] = React.useState<number | null>(null)
    const isControlled = value !== undefined
    const currentValue = isControlled ? value : internalValue
    const displayValue = hoverValue ?? currentValue
    const iconPx = SIZE_PX[size]
    const isInteractive = !readOnly && !disabled

    const setValue = (v: number) => {
      if (!isControlled) setInternalValue(v)
      onChange?.(v)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isInteractive) return
      const step = precision === 'half' ? 0.5 : 1
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault()
        setValue(Math.min(max, currentValue + step))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault()
        setValue(Math.max(0, currentValue - step))
      }
    }

    return (
      <div
        ref={ref}
        role={isInteractive ? 'slider' : 'img'}
        aria-valuenow={isInteractive ? currentValue : undefined}
        aria-valuemin={isInteractive ? 0 : undefined}
        aria-valuemax={isInteractive ? max : undefined}
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setHoverValue(null)}
        className={cn(
          'inline-flex items-center gap-1',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md',
          disabled && 'opacity-disabled pointer-events-none',
          className,
        )}
        {...props}
      >
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1
          const fillRatio = Math.max(0, Math.min(1, displayValue - i)) // 0..1
          const isHalf = precision === 'half' && fillRatio > 0 && fillRatio < 1

          return (
            <StarIcon
              key={i}
              Icon={Icon}
              sizePx={iconPx}
              fillRatio={fillRatio}
              isHalf={isHalf}
              interactive={isInteractive}
              onHover={(halfFirst) => {
                if (!isInteractive) return
                const v = precision === 'half' && halfFirst ? starValue - 0.5 : starValue
                setHoverValue(v)
              }}
              onClick={(halfFirst) => {
                if (!isInteractive) return
                const v = precision === 'half' && halfFirst ? starValue - 0.5 : starValue
                setValue(v)
              }}
            />
          )
        })}
      </div>
    )
  },
)
Rating.displayName = 'Rating'

// ── StarIcon: 單顆星 + half-precision overlay ─────────────────────────────

interface StarIconProps {
  Icon: React.ComponentType<{ size?: number; className?: string; fill?: string }>
  sizePx: number
  fillRatio: number // 0..1
  isHalf: boolean
  interactive: boolean
  onHover: (halfFirst: boolean) => void
  onClick: (halfFirst: boolean) => void
}

const FILL_FILLED = 'var(--warning)' // yellow-6 — 黃星 convention
const FILL_EMPTY = 'var(--color-neutral-4)' // 灰色空星

function StarIcon({ Icon, sizePx, fillRatio, isHalf, interactive, onHover, onClick }: StarIconProps) {
  if (!isHalf) {
    // Full: 一整顆 fill(filled 或 empty)
    const fill = fillRatio >= 1 ? FILL_FILLED : FILL_EMPTY
    return (
      <button
        type="button"
        disabled={!interactive}
        onMouseEnter={() => onHover(false)}
        onClick={() => onClick(false)}
        className={cn(
          'inline-flex p-0 border-0 bg-transparent',
          interactive ? 'cursor-pointer' : 'cursor-default',
          interactive && 'hover:scale-110 transition-transform',
        )}
        style={{ color: fill }}
        tabIndex={-1}
        aria-hidden
      >
        <Icon size={sizePx} fill={fill} className="shrink-0" />
      </button>
    )
  }

  // Half: 兩個重疊 icon,左半 filled / 右半 empty + 兩個 hover zone 切半星
  return (
    <span className="relative inline-flex" style={{ width: sizePx, height: sizePx }}>
      <Icon size={sizePx} fill={FILL_EMPTY} className="absolute inset-0" style={{ color: FILL_EMPTY }} />
      <span className="absolute inset-0 overflow-hidden" style={{ width: sizePx * fillRatio }}>
        <Icon size={sizePx} fill={FILL_FILLED} style={{ color: FILL_FILLED }} />
      </span>
      {interactive && (
        <>
          <button
            type="button"
            onMouseEnter={() => onHover(true)}
            onClick={() => onClick(true)}
            className="absolute inset-y-0 left-0 w-1/2 cursor-pointer bg-transparent border-0 p-0"
            tabIndex={-1}
            aria-hidden
          />
          <button
            type="button"
            onMouseEnter={() => onHover(false)}
            onClick={() => onClick(false)}
            className="absolute inset-y-0 right-0 w-1/2 cursor-pointer bg-transparent border-0 p-0"
            tabIndex={-1}
            aria-hidden
          />
        </>
      )}
    </span>
  )
}

export { Rating }
