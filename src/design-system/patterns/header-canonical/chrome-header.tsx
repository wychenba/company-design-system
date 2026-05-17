import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * ChromeHeader — Fixed-height chrome header primitive(Layout Family B,header-canonical.spec.md)
 *
 * ── 定位 ──
 * Page chrome 級 header 共用 primitive。封裝重複 contract:
 *   flex items-center gap-2 shrink-0 h-[var(--chrome-header-height)] border-b border-divider px-[var(--layout-space-loose)]
 *
 * Consumers:Sidebar / FileViewer Toolbar / FileViewer InfoPanel / 未來 page top bar / Drawer
 * 跟 SurfaceHeader(overlay padding-based)是兩個並存家族(per header-canonical.spec.md L23-30)。
 *
 * ── 實作基礎 ──
 * 消費:--chrome-header-height(48/56 density-responsive)/ --layout-space-loose / border-divider
 * 對應 pattern:patterns/header-canonical
 *
 * ── 消費的 SSOT ──
 * - tokens: [--chrome-header-height, --layout-space-loose, --divider]
 * - patterns: [header-canonical(本 pattern), overlay-surface(姊妹 SurfaceHeader)]
 * - spec refs: patterns/header-canonical/header-canonical.spec.md(L23-30 家族區分 / W1 border / W3 tabs size / Layer 3 ChromeHeader API)
 *
 * ── API(per M31 codex 比稿 Step 5 — narrow API,避免 M21 prop variant 風險)──
 * withTabs?: boolean(預設 false)
 *   true → 移除自身 border-b,delegate paint 給 TabsList(per W1「Header semantic owner / TabsList paint owner in withTabs state」)
 * lockDensity?: 'inherit' | 'lg'(預設 'inherit')
 *   'inherit' → 跟 page density(html[data-density] 自動)
 *   'lg' → 強制 lg(viewer-fullscreen-chrome escape hatch,FileViewer 永遠 lg-equivalent design intent)
 *
 * 不開:density?: 'md' | 'lg' 自由 prop。M21 違反 — 任意 density 等於 cva-on-pattern。
 */
export interface ChromeHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 是否內含 Tabs。
   * true → 移除自身 border-b,讓 TabsList border 接管 paint
   * 對應 patterns/header-canonical/header-canonical.spec.md W1
   */
  withTabs?: boolean
  /**
   * 是否鎖死 lg density(viewer-fullscreen chrome 用)。
   * 'inherit'(預設)→ 跟 page density
   * 'lg' → 強制 chrome-header-height lg(56)
   * 對應 patterns/header-canonical/header-canonical.spec.md Layer 3 API
   */
  lockDensity?: 'inherit' | 'lg'
}

export const ChromeHeader = React.forwardRef<HTMLDivElement, ChromeHeaderProps>(
  (
    { className, withTabs = false, lockDensity = 'inherit', children, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      data-density={lockDensity === 'lg' ? 'lg' : undefined}
      className={cn(
        'flex items-center gap-2 shrink-0',
        'h-[var(--chrome-header-height)]',
        'px-[var(--layout-space-loose)]',
        // W1:withTabs false → 自畫 border;withTabs true → 退讓 paint(TabsList 接管)
        !withTabs && 'border-b border-divider',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)
ChromeHeader.displayName = 'ChromeHeader'
