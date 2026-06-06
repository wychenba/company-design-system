// @anatomy-exempt: Header Anatomy pattern story — demos ChromeHeader primitive 各型(single-row / withTabs / leadingRail)。
// 內部 title 用 flex 排列是 header content 結構,非 list row,不走 item-anatomy MenuItem。
//
// 公開 Pattern anatomy 參照(對標 patterns/element-anatomy/item-anatomy.stories.tsx)。
// 目的:做 header 相關元件時,人 / AI 看這支 story + header-canonical.spec.md 就知道 header 該怎麼結構,
// 並直接消費 <ChromeHeader> primitive(或在 AppShell header slot 傳它)滿足需求。
import type { Meta } from '@storybook/react'
import type { ReactNode } from 'react'
import {
  FileText,
  ZoomIn,
  Download,
  X,
  Search,
  Bell,
  LayoutGrid,
} from 'lucide-react'
import { ChromeHeader } from '@/design-system/patterns/header-canonical/chrome-header'
import { Button } from '@/design-system/components/Button/button'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/design-system/components/Tabs/tabs'

const meta: Meta = {
  title: 'Design System/Patterns/Header Anatomy',
  parameters: { layout: 'padded' },
}
export default meta

/* ═══════════════════════════════════════════════════════════════════════════
   Header Anatomy — 跨元件 chrome header 的結構契約(header-canonical.spec.md SSOT)

   ChromeHeader 封裝的共同契約(所有型共享):
   • 高度 = var(--chrome-header-height)(md 48 / lg 56),items-center 垂直置中
   • 左右 padding = var(--layout-space-loose)(md 16 / lg 24),所有 slot 統一靠齊
   • border-b border-divider(有 tabs 時自動移除,改由 TabsList 畫線)
   • dismiss(close X)永遠 <Button iconOnly dismiss size="sm">,不論 density

   consumer:Sidebar header / FileViewer Toolbar+InfoPanel / AppShell header slot / 未來 Drawer
   ═══════════════════════════════════════════════════════════════════════════ */

/** 容器:把 header 放進一個有邊界的面板裡看(模擬實際 chrome 嵌在 surface 上)*/
function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-divider bg-surface">
      {children}
    </div>
  )
}

/** 1. Single-row — 最常見:標題 + 動作列(對標 FileViewer Toolbar / Sidebar header)*/
export const SingleRow = () => (
  <Panel>
    <ChromeHeader>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <FileText size={16} className="shrink-0 text-foreground" aria-hidden />
        <span className="truncate text-body-lg text-foreground" title="2026 Q1 財務報告.pdf">
          2026 Q1 財務報告.pdf
        </span>
      </div>
      <Button iconOnly size="sm" startIcon={ZoomIn} aria-label="放大" />
      <Button iconOnly size="sm" startIcon={Download} aria-label="下載" />
      <Button iconOnly dismiss size="sm" startIcon={X} aria-label="關閉" />
    </ChromeHeader>
    <div className="p-6 text-body text-fg-muted">文件預覽內容區…</div>
  </Panel>
)

/** 2. withTabs — header 含分頁列(對標 FileViewer InfoPanel / 設定頁 header)。
 *  傳 tabsSlot 自動進 column 結構:row1 = 標題列、row2 = TabsList 全寬畫線。 */
export const WithTabs = () => (
  <Panel>
    <Tabs defaultValue="overview">
      <ChromeHeader
        tabsSlot={
          <TabsList>
            <TabsTrigger value="overview">概覽</TabsTrigger>
            <TabsTrigger value="activity">活動</TabsTrigger>
            <TabsTrigger value="files">檔案</TabsTrigger>
          </TabsList>
        }
      >
        <h2 className="flex-1 truncate text-body-lg font-medium text-foreground">
          Acme 品牌改版專案
        </h2>
        <Button iconOnly dismiss size="sm" startIcon={X} aria-label="關閉" />
      </ChromeHeader>
      <TabsContent value="overview">
        <div className="p-6 text-body text-fg-muted">「概覽」分頁內容…</div>
      </TabsContent>
      <TabsContent value="activity">
        <div className="p-6 text-body text-fg-muted">「活動」分頁內容…</div>
      </TabsContent>
      <TabsContent value="files">
        <div className="p-6 text-body text-fg-muted">「檔案」分頁內容…</div>
      </TabsContent>
    </Tabs>
  </Panel>
)

/** 3. leadingRail — 左側固定寬 rail(對標 AppShell primary-header globalHeader,
 *  rail 寬 = sidebar 收合寬,內容置中,跟 sidebar 收合 icon 完美對齊)。*/
export const WithLeadingRail = () => (
  <Panel>
    <ChromeHeader
      leadingRail={<LayoutGrid size={20} className="text-foreground" aria-hidden />}
    >
      <h2 className="flex-1 truncate text-body-lg font-medium text-foreground">
        Acme 工作區
      </h2>
      <Button iconOnly size="sm" startIcon={Search} aria-label="搜尋" />
      <Button iconOnly size="sm" startIcon={Bell} aria-label="通知" />
    </ChromeHeader>
    <div className="p-6 text-body text-fg-muted">工作區內容區…</div>
  </Panel>
)

/** Overview — 三型疊起來一次看完,每型上方標清「何時用 + 對標既有元件」。 */
export const Overview = () => (
  <div className="flex flex-col gap-8">
    <section className="flex flex-col gap-2">
      <div className="text-body font-medium text-foreground">Single-row(標題 + 動作列)</div>
      <div className="text-body-sm text-fg-muted">
        最常見的 chrome header。對標 FileViewer Toolbar / Sidebar header。border-b 自畫、px-loose、dismiss size=sm。
      </div>
      <SingleRow />
    </section>
    <section className="flex flex-col gap-2">
      <div className="text-body font-medium text-foreground">withTabs(標題列 + 分頁列)</div>
      <div className="text-body-sm text-fg-muted">
        header 內含分頁。對標 FileViewer InfoPanel。傳 tabsSlot,border 改由 TabsList 全寬畫一條線。
      </div>
      <WithTabs />
    </section>
    <section className="flex flex-col gap-2">
      <div className="text-body font-medium text-foreground">leadingRail(左側固定寬 rail)</div>
      <div className="text-body-sm text-fg-muted">
        全域頂部 bar。對標 AppShell primary-header globalHeader。rail 寬 = sidebar 收合寬,跟收合 icon 對齊。
      </div>
      <WithLeadingRail />
    </section>
  </div>
)
