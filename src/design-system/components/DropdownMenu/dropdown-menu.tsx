import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * DropdownMenu — Radix DropdownMenu + 設計系統 token
 *
 * 樣式遵循 item-layout 設計原則：
 * - padding: (field-height - 1lh) / 2
 * - prefix / suffix 對齊: h-[1lh]
 * - 浮層: elevation-200, bg-surface-raised, rounded-lg, sideOffset=8
 */

// ── Item size variants（共用 item-layout padding 公式）──
const menuItemVariants = cva(
  [
    'relative flex items-start gap-2 px-3 w-full',
    'cursor-pointer select-none',
    'outline-none transition-colors duration-150',
    'focus:bg-neutral-hover',
    'data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled data-[disabled]:cursor-default',
  ],
  {
    variants: {
      size: {
        sm: 'text-body leading-compact py-[calc((var(--field-height-sm)-1lh)/2)]',
        md: 'text-body leading-compact py-[calc((var(--field-height-md)-1lh)/2)]',
        lg: 'text-body-lg leading-compact py-[calc((var(--field-height-lg)-1lh)/2)]',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

// ── Floating layer 共用樣式 ──
const floatingLayerClass = [
  'z-50 overflow-hidden rounded-lg border border-border bg-surface-raised',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
  'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  'origin-[--radix-dropdown-menu-content-transform-origin]',
].join(' ')

// ── Size context ──
type SizeKey = 'sm' | 'md' | 'lg'
const SizeContext = React.createContext<SizeKey>('md')
const ICON_SIZE: Record<SizeKey, number> = { sm: 16, md: 16, lg: 20 }

// ── Root ──
const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={cn('outline-none', className)}
    {...props}
  />
))
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

// ── Content ──
interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  size?: SizeKey
  /** 最小寬度（px），預設跟隨觸發元件寬度 */
  minWidth?: number
  /** 最大高度（px），超過時捲動 */
  maxHeight?: number
}

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(({ className, size = 'md', sideOffset = 8, align = 'start', minWidth, maxHeight, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cn(floatingLayerClass, 'py-2', maxHeight && 'overflow-y-auto', className)}
      style={{
        boxShadow: 'var(--elevation-200)',
        minWidth: minWidth ?? 'max(180px, var(--radix-dropdown-menu-trigger-width))',
        maxHeight,
      }}
      {...props}
    >
      <SizeContext.Provider value={size}>
        {children}
      </SizeContext.Provider>
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

// ── SubContent ──
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const size = React.useContext(SizeContext)
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      sideOffset={8}
      className={cn(floatingLayerClass, 'py-2', className)}
      style={{ boxShadow: 'var(--elevation-200)', minWidth: 180 }}
      {...props}
    />
  )
})
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

// ── Item ──
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const size = React.useContext(SizeContext)
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(menuItemVariants({ size }), className)}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  )
})
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

// ── SubTrigger（子選單觸發器，自動附加 ChevronRight）──
interface DropdownMenuSubTriggerProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> {
  /** 子選單目前狀態值文字（如 "深色"），顯示在 ChevronRight 前方 */
  value?: string
  /** 子選單狀態 badge */
  badge?: React.ReactNode
}

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  DropdownMenuSubTriggerProps
>(({ className, children, value, badge, ...props }, ref) => {
  const size = React.useContext(SizeContext)
  const iconPx = ICON_SIZE[size]
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(menuItemVariants({ size }), 'data-[state=open]:bg-neutral-hover', className)}
      {...props}
    >
      {children}
      <div className="h-[1lh] flex items-center gap-1 ml-auto shrink-0">
        {value && <span className="text-fg-muted">{value}</span>}
        {badge}
        <ChevronRight size={iconPx} className="text-fg-muted" />
      </div>
    </DropdownMenuPrimitive.SubTrigger>
  )
})
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

// ── CheckboxItem ──
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
  const size = React.useContext(SizeContext)
  const iconPx = ICON_SIZE[size]
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(menuItemVariants({ size }), className)}
      checked={checked}
      onSelect={(e) => e.preventDefault()}
      {...props}
    >
      <div className="h-[1lh] flex items-center shrink-0">
        <div className={cn(
          'grid place-content-center shrink-0 rounded-md border border-border bg-surface',
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
          checked && 'bg-primary border-primary text-white',
          props.disabled && 'bg-disabled border-transparent',
          props.disabled && checked && 'text-fg-disabled',
        )}>
          <DropdownMenuPrimitive.ItemIndicator>
            <Check style={{ width: size === 'lg' ? 16 : 12, height: size === 'lg' ? 16 : 12 }} />
          </DropdownMenuPrimitive.ItemIndicator>
        </div>
      </div>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
})
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

// ── RadioItem ──
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
  const size = React.useContext(SizeContext)
  const dotSize = size === 'lg' ? 10 : 8
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(menuItemVariants({ size }), className)}
      {...props}
    >
      <div className="h-[1lh] flex items-center shrink-0">
        <div className={cn(
          'grid place-content-center shrink-0 rounded-full border border-border bg-surface',
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
        )}>
          <DropdownMenuPrimitive.ItemIndicator>
            <Circle style={{ width: dotSize, height: dotSize }} className="fill-primary text-primary" />
          </DropdownMenuPrimitive.ItemIndicator>
        </div>
      </div>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
})
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

// ── Label（群組標題）──
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => {
  const size = React.useContext(SizeContext)
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(menuItemVariants({ size }), 'font-medium text-fg-muted cursor-default', className)}
      {...props}
    />
  )
})
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

// ── Separator ──
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("my-2 h-px bg-divider", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

// ── Shortcut（鍵盤快捷鍵提示）──
const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("h-[1lh] flex items-center ml-auto text-caption text-fg-muted shrink-0", className)} {...props} />
)
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

// ── Suffix helper（後綴容器：badge + endIcon 或子選單指示）──
const DropdownMenuItemSuffix = ({ className, gap = 'gap-2', children }: { className?: string; gap?: 'gap-1' | 'gap-2'; children: React.ReactNode }) => (
  <div className={cn("h-[1lh] flex items-center ml-auto shrink-0", gap, className)}>
    {children}
  </div>
)
DropdownMenuItemSuffix.displayName = "DropdownMenuItemSuffix"

// ── Prefix helper（前綴容器）──
const DropdownMenuItemPrefix = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("h-[1lh] flex items-center shrink-0", className)}>
    {children}
  </div>
)
DropdownMenuItemPrefix.displayName = "DropdownMenuItemPrefix"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuItemSuffix,
  DropdownMenuItemPrefix,
  menuItemVariants,
  SizeContext,
}
