import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X as XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/design-system/components/Button/button"
import { SurfaceHeader, SurfaceFooter } from "@/design-system/patterns/overlay-surface/overlay-surface"
import { ScrollArea } from "@/design-system/components/ScrollArea/scroll-area"

/**
 * Dialog (Modal) — Radix Dialog + 設計系統 token
 *
 * ── Layout ──
 * px = layout-space-loose, header/footer py = layout-space-tight。
 * Body pt = layout-space-tight, pb = layout-space-bottom。
 * Density:繼承 page `data-density`(v5 校準,跟 Sheet 對齊;header 自動對齊
 * `--chrome-header-height` 48/56)。詳 dialog.spec.md「Density」節。
 *
 * ── Viewport Inset ──
 * Modal 與 viewport 四邊保持 layout-space-bottom (48px) 最小間距。
 *
 * ── 高度行為 ──
 * 預設：height 填滿 viewport（扣除 inset），body 捲動。防止動態內容跳動。
 * height="auto"：高度隨內容，超過 viewport 時 max-height 安全帽。
 */

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

// Modal 與 viewport 四邊的最小間距 = layout-space-bottom (48px)
const DIALOG_INSET_VAR = 'var(--layout-space-bottom)'

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-overlay",
      "data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** 最大寬度。預設 512px。傳 number 視為 px。 */
  maxWidth?: string | number
  /**
   * 高度模式。
   * - 不傳（預設）：填滿 viewport（height = 100vh - inset*2），body 捲動。防止內容跳動。
   * - true：高度隨內容，超過 viewport 時捲動（max-height 安全帽）。
   */
  autoHeight?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, maxWidth = '512px', autoHeight, children, style, ...props }, ref) => {
  const insetCalc = `${DIALOG_INSET_VAR} * 2`
  const viewportH = `calc(100vh - ${insetCalc})`
  const maxWidthCss = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth

  const heightStyle: React.CSSProperties = autoHeight
    ? { maxHeight: viewportH }
    : { height: viewportH }

  // AutoFocus canonical(對齊 Material / Polaris / Atlassian)—
  // 開啟時 focus 落在 body 第一個有意義互動元素(input / button),不是 chrome close X。
  // 預設 Radix 會 focus first tabbable = close X → Button iconOnly 的 focus-triggered
  // tooltip 會立即顯示「關閉」,user-hostile。此 callback 攔截:先找 body 第一個
  // input/textarea/select/button(排除 data-dismiss)focus;找不到就 focus container(不 focus X)。
  const handleOpenAutoFocus = (e: Event) => {
    e.preventDefault()
    const content = e.currentTarget as HTMLElement
    const firstBodyTarget = content.querySelector<HTMLElement>(
      '[data-dialog-body] input:not([disabled]),[data-dialog-body] textarea:not([disabled]),[data-dialog-body] select:not([disabled]),[data-dialog-body] button:not([disabled]):not([data-dismiss])'
    )
    const firstFooterButton = content.querySelector<HTMLElement>(
      '[data-dialog-footer] button:not([disabled]):not([data-dismiss])'
    )
    ;(firstBodyTarget ?? firstFooterButton ?? content).focus({ preventScroll: true })
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        // Density canonical(2026-04-22 v5 校準):Dialog 繼承 page density(跟 Sheet 對齊
        // sheet.tsx line 111 canonical),不自設 data-layout-space="lg" 或 data-density。
        //
        // 先前曾設 `data-layout-space="lg"` 給 header/body 寬鬆呼吸,但跟 chrome-header-height
        // canonical 衝突(md page dialog header 期望 48,強設 lg 會變 56)。
        // 世界級對照:Polaris Modal horizontal padding 16 / Material M3 24 / Atlassian 24 — 16 是
        // 合理 lower bound;md page 用 16 loose body padding 可接受,lg page 自動 24。
        // 詳 overlay-surface.spec.md「Chrome dismiss size canonical」
        onOpenAutoFocus={handleOpenAutoFocus}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
          "flex flex-col bg-surface-raised rounded-lg border border-border",
          "data-[state=open]:animate-in data-[state=closed]:animate-out motion-reduce:animate-none",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className,
        )}
        style={{
          boxShadow: 'var(--elevation-200)',
          maxWidth: `min(${maxWidthCss}, calc(100vw - ${insetCalc}))`,
          ...heightStyle,
          ...style,
        }}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

// DialogHeader: SurfaceHeader + Close 按鈕(Dialog 特有)
// justify-between 讓 children 與 Close 分左右;Close 用 Radix DialogPrimitive.Close 包裝。
const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <SurfaceHeader
    ref={ref}
    className={cn("justify-between", className)}
    {...props}
  >
    <div className="flex-1 min-w-0">{children}</div>
    <DialogPrimitive.Close asChild>
      {/* Dismiss X(chrome-slot canonical,v5):Button 本身 native sm(28 md / 32 lg,touch target 亦同),
          但 `data-dismiss` attribute 讓 SurfaceHeader CSS rule 套負 my 讓 layout 佔位 = 24,
          header = 24 + 2×tight = 48 / 56 chrome-header-height ✓。
          詳 overlay-surface.spec.md「Chrome dismiss size canonical」*/}
      <Button data-dismiss iconOnly dismiss size="sm" startIcon={XIcon} aria-label="關閉" />
    </DialogPrimitive.Close>
  </SurfaceHeader>
))
DialogHeader.displayName = "DialogHeader"

// DialogBody: flex-1 ScrollArea + inner padding(對齊 overlay-surface SSOT + ScrollArea canonical)
// 捲軸必用 ScrollArea(跨 OS 一致、不吃寬度)— 不自寫 overflow-y-auto。
// padding 搬進 viewport inner div:px-loose / pt-tight / pb-bottom(Dialog 「大容器」底部多一拍呼吸)。
// data-dialog-body:讓 DialogContent onOpenAutoFocus 找得到 body 第一個有意義互動元素(避免 focus 到 close X)
//
// **`variant="list"`**(2026-04-22 canonical,對齊 Material / Polaris / Linear list-in-dialog):
// body 只放 list 時 **移除 vertical padding** 但**保留 horizontal padding**(list item 左右
// 邊距仍對齊 header title 與 footer button 的 left),list item 自己的 py 是節奏來源。
// 這樣 list item content 跟 header title 垂直對齊 — 世界級 Material M3 / Polaris
// ResourceList / Atlassian OptionList 都是這個 pattern(body horizontal gutter 保留,vertical 移除)。
interface DialogBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Body 佈局模式。
   * - `default`(預設):body 有 px-loose / pt-tight / pb-bottom,適合 form 或一般內容
   * - `list`:body **`py-2`**(無 horizontal padding),item 自己 **`px-[var(--layout-space-loose)] rounded-md`**
   *   → hover bg 外邊 **flush chrome 邊**(貼齊 dialog 外殼內邊)、**content(avatar / text)在 hover bg
   *   內有 loose breathing**(對齊 header title 位置)
   *
   * ── 兩個 invariant(2026-04-22 v4 user Image #26 校準)──
   * 1. **Content 對齊 header/footer**:content left = body px (0) + item px (loose) = **loose** from chrome
   *    → 跟 `SurfaceHeader` 的 `px-loose` 同位,視覺一致
   * 2. **Content 在 hover bg 內有 breathing**:item px-loose 讓 content 離 hover bg 邊 loose,不觸邊
   *
   * ── Hover bg 邊位置 = 設計選擇(不是 invariant)──
   * 本 DS 當前選 **flush chrome**(Linear / Cmd+K idiom)— body 無水平 padding,hover bg 貼 chrome 內邊。
   * 另一個合法選擇是 **inset with chrome gutter**(Material M3 / Polaris idiom)— body 有 px,
   * hover bg 離 chrome 邊若干 px;兩者皆世界級,擇一即可。**不是 violation 判斷點**。
   *
   * List item 本身應遵循 **item-anatomy** 原則:
   * - 純文字 / 簡單 list → MenuItem(Family 1 scanning)或 Family 2 手刻(reading)
   * - key-value pair → DescriptionList(horizontal / vertical 模式)
   * 見 `patterns/element-anatomy/item-anatomy.spec.md`「Row primitives 共用結構規格」。
   */
  variant?: "default" | "list"
}
// `className` forward 到 **inner content div**(非外層 ScrollArea wrapper)——
// consumer `<DialogBody className="flex flex-col gap-X">` 期望作用於 children 排列;
// 套在 ScrollArea 上會 0 效果(children 住 inner div),曾造成 modal form field 完全貼邊。
const DialogBody = React.forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className, children, variant = "default", ...props }, ref) => (
    <ScrollArea ref={ref} data-dialog-body className="flex-1 min-h-0" {...props}>
      <div
        className={cn(
          variant === "list"
            ? // list mode 2026-04-22 v4(user Image #26 校準,flush chrome canonical):
              // - body 無水平 padding → hover bg flush chrome 邊(Linear idiom)
              // - py-2:menu group 節奏
              // - item 負責 px-loose rounded-md → content 對齊 header title + content 在 hover bg 內有 loose breathing
              "py-2"
            : "px-[var(--layout-space-loose)] pt-[var(--layout-space-tight)] pb-[var(--layout-space-bottom)]",
          className,
        )}
      >
        {children}
      </div>
    </ScrollArea>
  ),
)
DialogBody.displayName = "DialogBody"

// DialogFooter: SurfaceFooter wrap 加 data-dialog-footer(autoFocus fallback target)
const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => <SurfaceFooter ref={ref} data-dialog-footer {...props} />)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-body-lg font-medium truncate", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    // title → description 的 2px 間距 canonical(item-anatomy Family 2)
    className={cn("mt-[var(--item-gap-label-desc)] text-body text-fg-secondary", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
