import * as React from 'react'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { FieldMode, FieldVariant } from '@/design-system/components/Field/field-types'
import type { InlineActionConfig } from '@/design-system/patterns/element-anatomy/item-anatomy'
import { fieldWrapperStyles, bareInputStyles, EMPTY_DISPLAY } from '@/design-system/components/Field/field-wrapper'
import { useFieldContext, useResolvedFieldSize } from '@/design-system/components/Field/field-context'
import { ItemInlineAction } from '@/design-system/patterns/element-anatomy/item-anatomy'

// ── Format ──────────────────────────────────────────────────────────────────

export interface NumberFormatOptions {
  /** 小數位數 */
  precision?: number
  /** 前綴（如 '$'、'NT$'） */
  prefix?: string
  /** 後綴（如 '%'、'元'） */
  suffix?: string
  /** locale（預設 'en-US'） */
  locale?: string
}

function formatNumber(
  value: number | null | undefined,
  options: NumberFormatOptions = {},
): string {
  if (value == null) return ''
  const { precision, prefix = '', suffix = '', locale = 'en-US' } = options
  const formatted = precision != null
    ? value.toLocaleString(locale, { minimumFractionDigits: precision, maximumFractionDigits: precision })
    : value.toLocaleString(locale)
  return `${prefix}${formatted}${suffix}`
}

// Phase B1(2026-05-05):NumberInputDisplay 退場。
// 改用 `<NumberInput mode="display" value={...} prefix={...} ... />`,format 邏輯在 mode='display' 分支重用。

// ── Types ───────────────────────────────────────────────────────────────────

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange' | 'type'>,
    Omit<VariantProps<typeof fieldWrapperStyles>, 'mode' | 'variant'>,
    NumberFormatOptions {
  /** Field display mode */
  mode?: FieldMode
  /**
   * Visual chrome(正交於 mode);Phase B1(2026-05-05)新增。
   * - `'default'`(預設)— 完整 Field wrapper chrome。
   * - `'bare'` — 透明 variant,hover/focus 才 reveal(Toolbar inline / DataTable cell)。
   *
   * 透傳:在 `<Field variant="bare">` 內自動繼承 context.variant;per-prop override context。
   */
  variant?: FieldVariant
  /** Error 狀態（正交於 mode）。 */
  error?: boolean
  /** 數值 */
  value?: number | null
  /** 數值變更 */
  onChange?: (value: number | null) => void
  /** 右側 inline action — 宣告式 API，Field 根據 size 自動渲染。 */
  endAction?: InlineActionConfig
  /**
   * 右側 slot(ReactNode)— escape hatch 供 consumer 放自訂元素(如 stepper button group / 自訂 popover trigger)。
   * 跟 `endAction` 互斥(同時傳 endSlot 會優先,endAction 被忽略)。
   * 規則對齊 Input.endSlot:90% case 用 endAction 宣告式 API,10% config 表達不出時走 endSlot。
   */
  endSlot?: React.ReactNode
}

// ── Component ───────────────────────────────────────────────────────────────

// code-quality-allow: long-function — foundational composite main body — 拆 sub-fn 會複雜化 local state / ref / context binding
const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      mode: modeProp,
      variant: variantProp,
      error: errorProp = false,
      size: sizeProp,
      value,
      onChange,
      precision,
      prefix,
      suffix,
      locale,
      endAction,
      endSlot,
      className,
      disabled: disabledProp,
      readOnly,
      id: idProp,
      'aria-describedby': ariaDescribedByProp,
      'aria-errormessage': ariaErrorMessageProp,
      ...props
    },
    ref
  ) => {
    const fieldCtx = useFieldContext()
    const error = errorProp || (fieldCtx?.invalid ?? false)
    const size = useResolvedFieldSize(sizeProp)
    const disabled = disabledProp ?? fieldCtx?.disabled
    // chrome 透傳:per-prop override context;context 沒值則 'default'
    const variant: FieldVariant = variantProp ?? fieldCtx?.variant ?? 'default'
    // mode resolve order(Phase B1 2026-05-05):prop > fieldCtx > readOnly/disabled fallback
    const resolvedMode: FieldMode = modeProp
      ?? fieldCtx?.mode
      ?? (readOnly ? 'readonly' : disabled ? 'disabled' : 'edit')

    // display / readonly / disabled 都顯示格式化值(span 取代 input)
    if (resolvedMode !== 'edit') {
      return (
        <div
          className={cn(fieldWrapperStyles({ mode: resolvedMode, variant: variant, size }), className)}
          data-field-mode={resolvedMode}
        >
          <span
            className={cn(
              'flex-1 min-w-0',
              resolvedMode === 'disabled' && 'text-fg-disabled cursor-not-allowed',
              // 2026-05-31 M24:disabled > muted。disabled 時不可再套 muted(否則 neutral-7 蓋過 disabled neutral-6)
              value == null && resolvedMode !== 'disabled' && 'text-fg-muted',
            )}
          >
            {value == null ? EMPTY_DISPLAY : formatNumber(value, { precision, prefix, suffix, locale })}
          </span>
        </div>
      )
    }

    // edit 模式：raw 數值輸入
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return
      const raw = e.target.value
      if (raw === '' || raw === '-') {
        onChange(null)
        return
      }
      const parsed = Number(raw)
      if (!Number.isNaN(parsed)) {
        onChange(parsed)
      }
    }

    return (
      <div
        className={cn(
          fieldWrapperStyles({ mode: 'edit', variant: variant, size }),
          error && [
            'border-error hover:border-error-hover',
            'focus-within:border-error focus-within:hover:border-error',
          ],
          className,
        )}
        data-field-mode="edit"
        data-error={error ? '' : undefined}
      >
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          id={idProp ?? fieldCtx?.id}
          value={value ?? ''}
          onChange={handleChange}
          aria-invalid={error || undefined}
          aria-required={fieldCtx?.required || undefined}
          aria-describedby={ariaDescribedByProp ?? fieldCtx?.descriptionId}
          aria-errormessage={ariaErrorMessageProp ?? (error ? fieldCtx?.errorId : undefined)}
          className={bareInputStyles}
          {...props}
        />
        {endSlot ? (
          // endSlot escape hatch:consumer 自控右側 slot(對齊 Input.endSlot canonical)
          endSlot
        ) : endAction ? (
          <ItemInlineAction action={endAction} size={size ?? 'md'} />
        ) : null}
      </div>
    )
  }
)
NumberInput.displayName = 'NumberInput'

// code-quality-allow: dead-export — public API surface — consumer-exposed for future use
// Story auto-compile metadata — Phase 1 mechanical migration(2026-04-24)
// Phase 2 fill needed: purpose descriptions + when rationale + world-class refs
export const numberInputMeta = {
  component: 'NumberInput',
  family: 4,
  variants: {

  },
  sizes: {

  },
  states: ['default', 'hover', 'active', 'focus-visible', 'disabled'],
  tokens: {
    bg: [],
    fg: ['text-fg-disabled', 'text-fg-muted'],
    ring: [],
  },
} as const

// code-quality-allow: dead-export — public API surface — consumer-exposed for future use
export { NumberInput, formatNumber }
