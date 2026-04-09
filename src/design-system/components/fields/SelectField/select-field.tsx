import * as React from 'react'
import { X, ChevronDown, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Command as CommandPrimitive } from 'cmdk'
import { cn } from '@/lib/utils'
import type { FieldMode } from '@/design-system/components/fields/field-types'
import { fieldWrapperStyles, bareInputStyles, EMPTY_DISPLAY } from '@/design-system/components/fields/field-wrapper'
import { Tag } from '@/design-system/components/Tag/tag'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/design-system/components/Tooltip/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/design-system/components/Popover/popover'
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from '@/design-system/components/Command/command'
import { SelectMenuItem, SelectMenuGroup } from '@/design-system/components/SelectMenu/select-menu-item'
import { useIsMobile } from '@/design-system/hooks/use-is-mobile'

// ── Tag padding per size ────────────────────────────────────────────────────
const tagPadding: Record<string, string> = {
  sm: 'px-[calc((var(--field-height-sm)_-_1.25rem)_/_2)]',
  md: 'px-[calc((var(--field-height-md)_-_1.5rem)_/_2)]',
  lg: 'px-[calc((var(--field-height-lg)_-_1.5rem)_/_2)]',
}

// ── Display ─────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string
  label: string
}

function SelectFieldDisplay({ value, options, size }: { value?: string | null; options?: SelectOption[]; size?: 'sm' | 'md' | 'lg' }) {
  if (!value) return <span className="text-fg-muted">{EMPTY_DISPLAY}</span>
  const label = options?.find(o => o.value === value)?.label ?? value
  return <Tag size={size}>{label}</Tag>
}
SelectFieldDisplay.displayName = 'SelectFieldDisplay'

// ── Types ───────────────────────────────────────────────────────────────────

export interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'value' | 'onChange'> {
  mode?: FieldMode
  error?: boolean
  size?: 'sm' | 'md' | 'lg'
  options: SelectOption[]
  value?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  clearable?: boolean
  display?: 'text' | 'tag'
  startIcon?: LucideIcon
  /** 啟用搜尋（desktop 時 field 變 input，打字即篩選） */
  searchable?: boolean
}

// ── Icon / size helpers ─────────────────────────────────────────────────────
const getIconSize = (size: string) => size === 'lg' ? 20 : 16

// ── Shared readonly/disabled render ─────────────────────────────────────────
function ReadonlyDisplay({
  mode, size, options, value, display, startIcon: StartIcon, className,
}: Pick<SelectFieldProps, 'mode' | 'size' | 'options' | 'value' | 'display' | 'startIcon' | 'className'>) {
  const resolvedMode = mode ?? 'readonly'
  const sz = size ?? 'md'
  const iconSize = getIconSize(sz)
  const label = options?.find(o => o.value === value)?.label ?? value
  const iconColor = resolvedMode === 'disabled' ? 'text-fg-disabled' : 'text-fg-muted'
  const isTextDisplay = display !== 'tag'

  if (isTextDisplay) {
    return (
      <div className={cn(fieldWrapperStyles({ mode: resolvedMode, size: sz }), className)} data-field-mode={resolvedMode}>
        {StartIcon && <StartIcon size={iconSize} className={cn('shrink-0 pointer-events-none', iconColor)} aria-hidden />}
        <span className={cn('flex-1 min-w-0 truncate', resolvedMode === 'disabled' && 'text-fg-disabled')}>
          {value ? label : <span className="text-fg-muted">{EMPTY_DISPLAY}</span>}
        </span>
      </div>
    )
  }

  return (
    <div className={cn(fieldWrapperStyles({ mode: resolvedMode, size: sz }), value && tagPadding[sz], className)} data-field-mode={resolvedMode}>
      {value ? <Tag size={sz}>{label}</Tag> : <span className="text-fg-muted">{EMPTY_DISPLAY}</span>}
    </div>
  )
}

// ── Native SelectField (mobile) ─────────────────────────────────────────────

const NativeSelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ mode = 'edit', error = false, size = 'md', options, value, onChange, placeholder, className, disabled, clearable = false, display = 'text', startIcon: StartIcon, ...props }, ref) => {
    const resolvedMode = disabled ? 'disabled' : mode
    const iconSize = getIconSize(size)
    const showClear = clearable && value && resolvedMode === 'edit'
    const isTextDisplay = display === 'text'
    const selectRef = React.useRef<HTMLSelectElement>(null)
    const setSelectRef = React.useCallback((el: HTMLSelectElement | null) => {
      selectRef.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLSelectElement | null>).current = el
    }, [ref])
    const openSelect = () => { selectRef.current?.showPicker?.(); selectRef.current?.focus() }

    if (resolvedMode !== 'edit') {
      return <ReadonlyDisplay mode={resolvedMode} size={size} options={options} value={value} display={display} startIcon={StartIcon} className={className} />
    }

    const selectEl = (
      <select
        ref={setSelectRef}
        value={value ?? ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        aria-invalid={error || undefined}
        className={cn(bareInputStyles, 'cursor-pointer appearance-none', !value && 'text-fg-muted', !isTextDisplay && value && 'absolute inset-0 w-full h-full opacity-0 z-0')}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    )

    const clearEl = showClear ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => onChange?.('')}
            className="group/action relative grid place-content-center shrink-0 cursor-pointer text-fg-muted hover:text-foreground active:text-foreground transition-colors relative z-10"
            style={{ width: iconSize, height: iconSize }} aria-label="清除選取">
            <span className={cn('absolute rounded-sm pointer-events-none bg-transparent group-hover/action:bg-neutral-hover group-active/action:bg-neutral-active transition-colors', size === 'lg' && 'rounded-md')}
              style={{ width: iconSize + 2, height: iconSize + 2, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} aria-hidden />
            <X size={iconSize} className="relative" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent>清除選取</TooltipContent>
      </Tooltip>
    ) : null

    const chevronEl = <ChevronDown size={iconSize} className="shrink-0 text-fg-muted cursor-pointer relative z-10" onClick={openSelect} aria-hidden />
    const label = options?.find(o => o.value === value)?.label ?? value

    if (!isTextDisplay) {
      return (
        <div className={cn(fieldWrapperStyles({ mode: 'edit', size }), value && tagPadding[size], 'relative',
          error && ['border-error hover:border-error-hover', 'focus-within:border-error focus-within:hover:border-error'], className)}
          style={{ paddingRight: '0.75rem' }} data-field-mode="edit" data-error={error ? '' : undefined}>
          {value ? <Tag size={size} className="shrink-0 relative z-10 pointer-events-none">{label}</Tag> : <span className="text-fg-muted">{placeholder ?? '選擇...'}</span>}
          {selectEl}
          <span className="flex-1" />
          {clearEl}
          {chevronEl}
        </div>
      )
    }

    return (
      <div className={cn(fieldWrapperStyles({ mode: 'edit', size }),
        error && ['border-error hover:border-error-hover', 'focus-within:border-error focus-within:hover:border-error'], className)}
        data-field-mode="edit" data-error={error ? '' : undefined}>
        {StartIcon && <StartIcon size={iconSize} className="shrink-0 text-fg-muted pointer-events-none" aria-hidden />}
        {selectEl}
        {clearEl}
        {chevronEl}
      </div>
    )
  }
)
NativeSelectField.displayName = 'NativeSelectField'

// ── Custom SelectField (desktop — Popover + Command) ────────────────────────

const CustomSelectField = React.forwardRef<HTMLDivElement, SelectFieldProps>(
  ({ mode = 'edit', error = false, size = 'md', options, value, onChange, placeholder, className, disabled, clearable = false, display = 'text', startIcon: StartIcon, searchable = false, ...props }, ref) => {
    const resolvedMode = disabled ? 'disabled' : mode
    const iconSize = getIconSize(size)
    const showClear = clearable && value && resolvedMode === 'edit'
    const isTextDisplay = display === 'text'

    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const inputRef = React.useRef<HTMLInputElement>(null)

    // 關閉時清搜尋
    React.useEffect(() => { if (!open) setSearch('') }, [open])

    if (resolvedMode !== 'edit') {
      return <ReadonlyDisplay mode={resolvedMode} size={size} options={options} value={value} display={display} startIcon={StartIcon} className={className} />
    }

    const selectedLabel = options?.find(o => o.value === value)?.label ?? ''

    const handleSelect = (optValue: string) => {
      onChange?.(optValue)
      setOpen(false)
    }

    const clearEl = showClear ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onChange?.('') }}
            className="group/action relative grid place-content-center shrink-0 cursor-pointer text-fg-muted hover:text-foreground active:text-foreground transition-colors z-10"
            style={{ width: iconSize, height: iconSize }} aria-label="清除選取">
            <span className={cn('absolute rounded-sm pointer-events-none bg-transparent group-hover/action:bg-neutral-hover group-active/action:bg-neutral-active transition-colors', size === 'lg' && 'rounded-md')}
              style={{ width: iconSize + 2, height: iconSize + 2, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} aria-hidden />
            <X size={iconSize} className="relative" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent>清除選取</TooltipContent>
      </Tooltip>
    ) : null

    const chevronEl = <ChevronDown size={iconSize} className={cn('shrink-0 text-fg-muted transition-transform', open && 'rotate-180')} aria-hidden />

    // ── Trigger content ──
    const triggerContent = searchable && open ? (
      // Searchable + open: 顯示搜尋 input
      <>
        {StartIcon && <StartIcon size={iconSize} className="shrink-0 text-fg-muted pointer-events-none" aria-hidden />}
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={selectedLabel || placeholder || '搜尋…'}
          className={cn(bareInputStyles, 'cursor-text')}
          autoFocus
        />
      </>
    ) : isTextDisplay ? (
      // Text display: 純文字
      <>
        {StartIcon && <StartIcon size={iconSize} className="shrink-0 text-fg-muted pointer-events-none" aria-hidden />}
        <span className={cn('flex-1 min-w-0 truncate', !value && 'text-fg-muted')}>
          {value ? selectedLabel : (placeholder ?? '選擇…')}
        </span>
      </>
    ) : (
      // Tag display
      <>
        {value ? <Tag size={size} className="shrink-0 pointer-events-none">{selectedLabel}</Tag> : <span className="text-fg-muted">{placeholder ?? '選擇…'}</span>}
        <span className="flex-1" />
      </>
    )

    // ── 過濾選項 ──
    const filteredOptions = searchable && search
      ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
      : options

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            ref={ref}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            tabIndex={0}
            className={cn(
              fieldWrapperStyles({ mode: 'edit', size }),
              !isTextDisplay && value && !searchable && tagPadding[size],
              open && !error && 'border-primary',
              error && ['border-error hover:border-error-hover', 'focus-within:border-error focus-within:hover:border-error'],
              'cursor-pointer',
              className,
            )}
            style={!isTextDisplay ? { paddingRight: '0.75rem' } : undefined}
            data-field-mode="edit"
            data-error={error ? '' : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (!searchable) { e.preventDefault(); setOpen(true) }
              }
              if (e.key === 'Escape') setOpen(false)
            }}
          >
            {triggerContent}
            {clearEl}
            {chevronEl}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 rounded-lg border border-border bg-surface-raised overflow-hidden"
          style={{ boxShadow: 'var(--elevation-200)', minWidth: 'var(--radix-popover-trigger-width)' }}
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => { if (searchable) { e.preventDefault(); inputRef.current?.focus() } }}
        >
          <Command shouldFilter={false}>
            <CommandList>
              <CommandEmpty className="py-4 text-center text-caption text-fg-muted">
                沒有符合的選項
              </CommandEmpty>
              <CommandGroup className="p-0 py-2">
                {filteredOptions.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => handleSelect(opt.value)}
                    className="p-0 rounded-none data-[selected=true]:bg-transparent"
                  >
                    <SelectMenuItem
                      size={size}
                      selected={value === opt.value}
                    >
                      {opt.label}
                    </SelectMenuItem>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)
CustomSelectField.displayName = 'CustomSelectField'

// ── Public component（自動偵測 mobile / desktop）──────────────────────────────

const SelectField = React.forwardRef<HTMLSelectElement | HTMLDivElement, SelectFieldProps>(
  (props, ref) => {
    const isMobile = useIsMobile()

    if (isMobile) {
      return <NativeSelectField ref={ref as React.Ref<HTMLSelectElement>} {...props} />
    }

    return <CustomSelectField ref={ref as React.Ref<HTMLDivElement>} {...props} />
  }
)
SelectField.displayName = 'SelectField'

export { SelectField, SelectFieldDisplay }
