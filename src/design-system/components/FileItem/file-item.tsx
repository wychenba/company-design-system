import * as React from 'react'
import { Paperclip, CircleCheck, XCircle, Download, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/design-system/components/Avatar/avatar'
import { ItemInlineActionButton } from '@/design-system/patterns/item-layout/item-layout'

/**
 * FileItem — 檔案顯示 / 上傳進度
 *
 * Typography: 閱讀模式 — text-body (14px) 預設行高 (1.5)
 *
 * 兩種 mode（精簡 vs 完整內容呈現）:
 *
 * compact（★ default）: Paperclip 16px 在左。右側 content + bar。
 *   py = gap = 4px (gap-1)，對稱。
 *   description 只有 error 才顯示。
 *   bar 跟文字左邊對齊（在 icon 右邊的 column 內）。
 *
 * rich: Avatar 56px square 在左（顯示檔案內容縮圖）。右側 content + bar。
 *   多行 description（size / status message）。
 *   有 bar → justify-between（bar 底部對齊 avatar）
 *   無 bar → justify-center（文字垂直置中對齊 avatar）
 *
 * status 可選。不傳 = 已上傳檔案（無 bar，可點擊下載）。
 * onClick → hover:bg-neutral-hover + cursor-pointer。
 */

const PROGRESS_COLOR = {
  uploading: 'bg-primary',
  completed: 'bg-success',
  error: 'bg-error',
} as const

const STATUS_ICON = {
  completed: { icon: CircleCheck, color: 'text-success' },
  error: { icon: XCircle, color: 'text-error' },
} as const

const AVATAR_SIZE = 56
const ICON_PX = 16

const BAR_H = 4          // progress bar 高度，跟 Slider track 對齊
const COMPACT_BAR_H = 2  // compact bar 高度（absolute 裝飾，比 rich 更細）

export interface FileItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  name: string
  /**
   * 兩種呈現 mode（精簡 vs 完整）：
   * - `compact`（預設）：paperclip + filename 單行 inline
   * - `rich`：縮圖 + 檔名 + size + status + progress 的完整 card 呈現
   */
  mode?: 'compact' | 'rich'
  status?: 'uploading' | 'completed' | 'error'
  progress?: number
  /** rich mode: 檔案大小、狀態訊息。compact: 只有 error 才顯示。 */
  description?: string
  thumbnailSrc?: string
  actions?: React.ReactNode
  onClick?: () => void
  /**
   * Hover 動作(passive 狀態 icon 變互動 button 的 UX):
   * - `onDownload`:有值時,`status="completed"` 的綠 ✓ icon 在 row hover 時
   *   換成 Download ↓ button;click 觸發 onDownload。無值保持 passive 綠 ✓。
   * - `onRetry`:有值時,`status="error"` 的紅 ✗ icon 在 row hover 時換成 RotateCw ⟲
   *   button;click 觸發 onRetry。無值保持 passive 紅 ✗。
   *
   * 世界級對照:Gmail / Slack / Dropbox 附件的 passive 狀態 → hover 變 action
   * 的 UX,使用者知道檔案狀態且能立即行動。
   */
  onDownload?: () => void
  onRetry?: () => void
}

const FileItem = React.forwardRef<HTMLDivElement, FileItemProps>(
  (
    {
      name,
      mode = 'compact',
      status,
      progress = 0,
      description,
      thumbnailSrc,
      actions,
      onClick,
      onDownload,
      onRetry,
      className,
      ...props
    },
    ref,
  ) => {
    const isRich = mode === 'rich'
    const hasStatus = !!status
    const statusConfig = status && status !== 'uploading' ? STATUS_ICON[status] : null
    const progressWidth = status === 'completed' ? 100 : progress

    // compact 只有 error 才顯示 description
    const showDesc = isRich ? !!description : (status === 'error' && !!description)

    const hoverClass = onClick ? 'cursor-pointer hover:bg-neutral-hover' : ''

    const barH = isRich ? BAR_H : COMPACT_BAR_H
    const progressBar = hasStatus ? (
      <div className="rounded-full bg-secondary" style={{ height: barH }}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', PROGRESS_COLOR[status!])}
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    ) : null

    // suffix
    const suffixAlign = isRich && showDesc
      ? 'h-[calc(1lh+2px+var(--font-body-size)*1.5)]'
      : 'h-[1lh]'

    // Status slot:completed + onDownload / error + onRetry 時 row-hover 換成 action button。
    // 幾何(ICON_PX × ICON_PX)與 ItemInlineActionButton 相同,視覺中心與右側 actions 自然對齊。
    const hoverAction =
      status === 'completed' && onDownload ? { icon: Download, onClick: onDownload, label: '下載' } :
      status === 'error' && onRetry        ? { icon: RotateCw, onClick: onRetry,    label: '重試' } :
      null

    const statusSlot = statusConfig ? (
      hoverAction ? (
        <span className="relative inline-flex shrink-0" style={{ width: ICON_PX, height: ICON_PX }}>
          <statusConfig.icon
            size={ICON_PX}
            className={cn(
              'absolute inset-0 shrink-0 transition-opacity',
              statusConfig.color,
              'group-hover/row:opacity-0',
            )}
            aria-hidden
          />
          <ItemInlineActionButton
            icon={hoverAction.icon}
            aria-label={hoverAction.label}
            onClick={(e) => { e.stopPropagation(); hoverAction.onClick() }}
            size="md"
            className="absolute inset-0 opacity-0 group-hover/row:opacity-100 transition-opacity"
          />
        </span>
      ) : (
        <statusConfig.icon size={ICON_PX} className={cn('shrink-0', statusConfig.color)} aria-hidden />
      )
    ) : null

    const suffix = (
      <div className={cn('flex items-center gap-2 shrink-0', suffixAlign)}>
        {status === 'uploading' && isRich && (
          <span className="text-fg-secondary tabular-nums">{progress}%</span>
        )}
        {statusSlot}
        {actions}
      </div>
    )

    // content row
    const contentRow = (
      <div className="flex items-start gap-2">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate">{name}</span>
          {showDesc && (
            <span className={cn(status === 'error' ? 'text-error-text' : 'text-fg-secondary')}>
              {description}
            </span>
          )}
        </div>
        {suffix}
      </div>
    )

    // ── rich（含縮圖完整呈現）──
    if (isRich) {
      return (
        <div
          ref={ref}
          className={cn('group/row flex items-start gap-3 px-3 py-2 w-full text-body transition-colors', hoverClass, className)}
          onClick={onClick}
          {...props}
        >
          <Avatar src={thumbnailSrc} alt={name} size={AVATAR_SIZE} shape="square" className="shrink-0" />
          <div
            className={cn('flex flex-col flex-1 min-w-0', progressBar ? 'justify-between' : 'justify-center')}
            style={{ minHeight: AVATAR_SIZE }}
          >
            {contentRow}
            {progressBar}
          </div>
        </div>
      )
    }

    // ── compact: py-2 對稱, bar absolute 底部 ──
    return (
      <div
        ref={ref}
        className={cn('group/row relative flex items-start gap-2 px-3 py-2 w-full text-body transition-colors', hoverClass, className)}
        onClick={onClick}
        {...props}
      >
        <span className="h-[1lh] shrink-0 flex items-center">
          <Paperclip size={ICON_PX} className="shrink-0 text-fg-muted" aria-hidden />
        </span>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate">{name}</span>
              {showDesc && (
                <span className="text-error-text">
                  {description}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 h-[1lh]">
              {statusSlot}
              {actions}
            </div>
          </div>
        </div>

        {/* Progress bar: absolute 底部, left 對齊 label（跳過 icon + gap） */}
        {progressBar && (
          <div className="absolute bottom-0 right-3" style={{ left: `calc(0.75rem + ${ICON_PX}px + 0.5rem)` }}>
            {progressBar}
          </div>
        )}
      </div>
    )
  },
)
FileItem.displayName = 'FileItem'

export { FileItem }
