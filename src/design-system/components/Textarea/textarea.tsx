import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { FieldMode, FieldVariant } from '@/design-system/components/Field/field-types'
import { useFieldContext } from '@/design-system/components/Field/field-context'
import { EMPTY_DISPLAY } from '@/design-system/components/Field/field-wrapper'

/**
 * Textarea — 多行文字輸入
 *
 * ── 定位 ────────────────────────────────────────────────────────────────
 * 多行版本的 Input，edit / display / readonly / disabled 四態與 Input 邏輯一致(Phase B1 2026-05-05)。
 * 不同於 Input：
 *   - 沒有固定 field-height（高度由 rows 或 min-h 決定）
 *   - 沒有 startIcon / endAction（textarea 慣例不放 icon）
 *   - readonly 呈現保留邊框與 padding，只改底色，讓多行文字有合理閱讀區
 *   - display 渲染 <div> + white-space:pre-wrap 保留多行文本
 *
 * ── Padding 規則 ───────────────────────────────────────────────────────
 * 多行內容必須有上下內距才能閱讀舒適。不沿用 Input 的 items-center，
 * 改用 py-2（8px）固定上下內距 + px-3 左右內距（與 Input 一致）。
 *
 * ── Size ────────────────────────────────────────────────────────────────
 * sm / md → text-body（14px）
 * lg      → text-body-lg（16px）
 *
 * ── rows / min-h ───────────────────────────────────────────────────────
 * 預設 rows={3}。消費者可透過 rows prop 調整，或透過 min-h-* className 覆寫。
 */

// Phase B1(2026-05-05):新增 chrome variant(default / bare),mode×chrome 的 chrome 規則由
// compoundVariants 決定,鏡射 fieldWrapperStyles 對齊 canonical(Phase D 將整併進 fieldWrapperStyles)。
const textareaVariants = cva(
  [
    'w-full rounded-md',
    'text-foreground font-normal',
    'outline-none resize-y',
    'placeholder:text-fg-muted',
    // K10 fix(2026-05-04):disabled 時 placeholder + text 切 fg-disabled(parallel 到 bareInputStyles)
    //   Textarea 自身 `<textarea disabled>` 帶 disabled HTML attribute,用 `disabled:` variant 直接命中
    'disabled:placeholder:text-fg-disabled disabled:text-fg-disabled',
    'px-3 py-2',
    'transition-colors duration-150',
  ],
  {
    variants: {
      mode: {
        edit: '',
        display: '',
        readonly: '',
        disabled: '',
      },
      // chrome 對齊 fieldWrapperStyles.variant(default / bare / naked)。
      variant: {
        default: '',
        bare: '',
        naked: '',
      },
      size: {
        sm: 'text-body',
        md: 'text-body',
        lg: 'text-body-lg',
      },
    },
    compoundVariants: [
      // default chrome × mode
      {
        mode: 'edit',
        variant: 'default',
        className: [
          'bg-surface border border-border',
          'hover:border-border-hover',
          'focus-visible:border-primary focus-visible:hover:border-primary',
        ],
      },
      {
        mode: 'display',
        variant: 'default',
        className: 'bg-transparent border border-transparent',
      },
      {
        mode: 'readonly',
        variant: 'default',
        className: 'bg-disabled border border-transparent',
      },
      {
        mode: 'disabled',
        variant: 'default',
        className: 'bg-disabled border border-transparent cursor-not-allowed text-fg-disabled',
      },
      // bare chrome × mode(對齊 fieldWrapperStyles bare 規則)
      {
        mode: 'edit',
        variant: 'bare',
        className: [
          'bg-transparent border border-transparent',
          'hover:border-border',
          'focus-visible:border-primary focus-visible:hover:border-primary',
        ],
      },
      {
        mode: 'display',
        variant: 'bare',
        className: 'bg-transparent border border-transparent',
      },
      {
        mode: 'readonly',
        variant: 'bare',
        className: 'bg-transparent border border-transparent',
      },
      {
        mode: 'disabled',
        variant: 'bare',
        className: 'bg-transparent border border-transparent cursor-not-allowed opacity-disabled text-fg-disabled',
      },
      // naked chrome × mode — cell-as-input substrate(2026-05-06 v10 outline state machine)。
      //   v9 用 border state machine,但 token `--border` ≠ grid `--divider` → user 報「邊框跟 grid
      //   不無縫接軌(只右邊 OK,其他 3 邊 seam)」。v10 統一改 outline state machine,跟 Field
      //   naked compoundVariant v10 同步(同 token 同 precedence)— rest=outline-divider 跟 grid
      //   同色 + offset:[-1px] 完美 overlap adjacent grid line。
      //   focus-visible 用 textarea 自身 selector(其為 focusable element,語意同 Field default
      //   `focus-within`,DOM 層級不同寫法不同)。
      {
        mode: 'edit',
        variant: 'naked',
        className: [
          'bg-transparent !rounded-none !h-full !resize-none border border-transparent',
          '!px-[var(--table-cell-px)] !py-[var(--table-cell-py)]',
          'outline outline-1 outline-offset-[-1px] outline-divider',
          'hover:outline-[var(--border-hover)]',
          'focus-visible:outline-primary focus-visible:hover:outline-primary',
          // textarea UA stylesheet 預設 line-height: normal(1.2-1.5 不定),會跟 display
          // `<div>` text-body line-height: 1.5(21px @ 14px)不一致 → cell 進 edit 後 height
          // shift。顯式 leading 對齊 div 行為。
          '!leading-[1.5]',
        ],
      },
      { mode: 'display', variant: 'naked', className: 'bg-transparent !rounded-none !h-full !resize-none !px-0 !py-0 border border-transparent !leading-[1.5]' },
      { mode: 'readonly', variant: 'naked', className: 'bg-transparent !rounded-none !h-full !resize-none !px-0 !py-0 border border-transparent !leading-[1.5]' },
      { mode: 'disabled', variant: 'naked', className: 'bg-transparent !rounded-none cursor-not-allowed opacity-disabled text-fg-disabled !h-full !resize-none !px-0 !py-0 border border-transparent !leading-[1.5]' },
    ],
    defaultVariants: {
      mode: 'edit',
      variant: 'default',
      size: 'md',
    },
  }
)

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Omit<VariantProps<typeof textareaVariants>, 'mode' | 'variant'> {
  /** Field display mode */
  mode?: FieldMode
  /**
   * Visual chrome(正交於 mode);Phase B1(2026-05-05)新增。透傳自 FieldContext.variant,per-prop override。
   * - `'default'` — 完整 chrome(form 場景)
   * - `'bare'` — 透明 variant,hover/focus reveal(toolbar / cell-as-input)
   */
  variant?: FieldVariant
  /** Error 狀態（正交於 mode）。border-error + aria-invalid。 */
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      mode: modeProp,
      variant: variantProp,
      error: errorProp = false,
      size: sizeProp,
      className,
      disabled,
      readOnly,
      rows = 3,
      value,
      id: idProp,
      'aria-describedby': ariaDescribedByProp,
      'aria-errormessage': ariaErrorMessageProp,
      ...props
    },
    ref
  ) => {
    // Field context 整合：disabled / mode / chrome / invalid / size / id 都能從 context 繼承
    const fieldCtx = useFieldContext()
    // chrome 透傳:per-prop override context
    const variant: FieldVariant = variantProp ?? fieldCtx?.variant ?? 'default'
    const error = errorProp || (fieldCtx?.invalid ?? false)
    const size = sizeProp ?? fieldCtx?.size ?? 'md'
    // mode resolve order(Phase B1 2026-05-05):prop > fieldCtx > readOnly/disabled fallback > 'edit'
    const resolvedMode: FieldMode = modeProp
      ?? fieldCtx?.mode
      ?? (readOnly ? 'readonly' : (disabled ?? fieldCtx?.disabled) ? 'disabled' : 'edit')
    const isEditable = resolvedMode === 'edit'
    const isDisplay = resolvedMode === 'display'
    const inputId = idProp ?? fieldCtx?.id
    const ariaDescribedBy = ariaDescribedByProp ?? fieldCtx?.descriptionId
    const ariaErrorMessage = ariaErrorMessageProp ?? (error ? fieldCtx?.errorId : undefined)

    // ── display mode:純展示,渲染 <div> 取代 <textarea>(white-space:pre-wrap 保留多行) ──
    // 對齊 Carbon read-only / Cloudscape display-mode
    if (isDisplay) {
      const displayValue = value != null && value !== '' ? String(value) : null
      return (
        <div
          id={inputId}
          data-field-mode="display"
          aria-describedby={ariaDescribedBy}
          className={cn(
            textareaVariants({ mode: 'display', variant: variant, size }),
            'whitespace-pre-wrap break-words',
            displayValue == null && 'text-fg-muted',
            className,
          )}
        >
          {displayValue ?? EMPTY_DISPLAY}
        </div>
      )
    }

    return (
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        value={value as string | number | readonly string[] | undefined}
        disabled={resolvedMode === 'disabled'}
        readOnly={resolvedMode === 'readonly'}
        aria-invalid={error || undefined}
        aria-required={fieldCtx?.required || undefined}
        aria-describedby={ariaDescribedBy}
        aria-errormessage={ariaErrorMessage}
        data-field-mode={resolvedMode}
        data-error={isEditable && error ? '' : undefined}
        className={cn(
          textareaVariants({ mode: resolvedMode, variant: variant, size }),
          isEditable && error && [
            'border-error hover:border-error-hover',
            'focus-visible:border-error focus-visible:hover:border-error',
          ],
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

// Story auto-compile metadata — Phase 1 mechanical migration(2026-04-24)
// Phase 2 fill needed: purpose descriptions + when rationale + world-class refs
export const textareaMeta = {
  component: 'Textarea',
  family: 4,
  variants: {

  },
  sizes: {
    sm: { fieldHeight: 28, iconSize: 16, typography: 'body' },
    md: { fieldHeight: 32, iconSize: 16, typography: 'body' },
    lg: { fieldHeight: 40, iconSize: 20, typography: 'body' },
  },
  states: ['default', 'hover', 'active', 'focus-visible', 'disabled'],
  tokens: {
    bg: ['bg-disabled', 'bg-surface'],
    fg: ['text-fg-disabled', 'text-fg-muted', 'text-foreground'],
    ring: [],
  },
  defaultSize: 'md',
} as const

export { Textarea, textareaVariants }
