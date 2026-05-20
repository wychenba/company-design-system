// @benchmark-cited: Sidebar full-layout baseline + DataTable toolbar pattern + Linear real-product 場景。
// @story-baseline: src/design-system/components/Sidebar/sidebar.stories.tsx#IconCollapse (Sidebar 完整佈局)
// @story-baseline: src/design-system/components/DataTable/data-table.stories.tsx#WithBulkActions (Toolbar + DataTable)
import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { Search, Filter, ArrowUpDown } from 'lucide-react'
import { AppShell, AppShellAside } from './app-shell'
import { AcmeSidebar, PageHeader, MAIN_NAV } from './_demo-helpers'
import { SidebarProvider } from '@/design-system/components/Sidebar/sidebar'
import { Button } from '@/design-system/components/Button/button'
import { Input } from '@/design-system/components/Input/input'
import { DataTable } from '@/design-system/components/DataTable/data-table'

const meta: Meta<typeof AppShell> = {
  title: 'Design System/Patterns/AppShell/展示',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof AppShell>

// Helpers(AcmeSidebar / PageHeader / WorkspaceBrand / UserFooter / MAIN_NAV)從 ./_demo-helpers
// import,跟 anatomy stories 共用 single baseline source(避免 anatomy 跟 showcase 自分歧)。

// ── Mock data — Linear-style issue tracker ────────────────────────────────

type Issue = {
  id: string
  title: string
  status: 'In Progress' | 'Backlog' | 'In Review' | 'Done'
  assignee: string
  priority: 'P0' | 'P1' | 'P2'
  due: string
}

const ISSUES: Issue[] = [
  { id: 'ENG-1042', title: '登入後 redirect 失敗',         status: 'In Progress', assignee: 'Alan Chen',   priority: 'P0', due: '2026-05-22' },
  { id: 'ENG-1041', title: 'Stripe webhook timeout > 10s', status: 'Backlog',     assignee: 'Jamie Lin',   priority: 'P0', due: '2026-05-25' },
  { id: 'ENG-1038', title: 'PeoplePicker multi-select bug', status: 'In Review',  assignee: 'Sophia Wang', priority: 'P1', due: '2026-05-24' },
  { id: 'ENG-1035', title: 'DataTable Safari scroll jitter', status: 'Done',      assignee: 'Marco Tsai',  priority: 'P1', due: '2026-05-20' },
  { id: 'ENG-1031', title: '匯出 CSV 漏特殊字元',           status: 'In Progress', assignee: 'Sophia Wang', priority: 'P2', due: '2026-05-28' },
  { id: 'ENG-1028', title: 'Onboarding 第 3 步無 a11y',     status: 'Backlog',     assignee: 'Jamie Lin',   priority: 'P2', due: '2026-06-02' },
]

const ch = createColumnHelper<Issue>()
const ISSUE_COLUMNS = [
  ch.accessor('id',       { header: 'ID',       meta: { width: 100 } }),
  ch.accessor('title',    { header: 'Issue',    meta: { width: 280, minWidth: 160 } }),
  ch.accessor('status',   { header: 'Status',   meta: { width: 120 } }),
  ch.accessor('assignee', { header: 'Assignee', meta: { width: 140 } }),
  ch.accessor('priority', { header: 'Priority', meta: { width: 90 } }),
  ch.accessor('due',      { header: 'Due',      meta: { width: 110 } }),
]

/** Main content:Toolbar(search + filter + sort)+ DataTable(per data-table.stories WithBulkActions canonical)。 */
function IssuesView({ onSelectIssue: _onSelectIssue }: { onSelectIssue: (issue: Issue) => void }) {
  const [search, setSearch] = React.useState('')
  const filtered = React.useMemo(
    () =>
      search
        ? ISSUES.filter(
            (i) =>
              i.title.toLowerCase().includes(search.toLowerCase()) ||
              i.id.toLowerCase().includes(search.toLowerCase()),
          )
        : ISSUES,
    [search],
  )

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      {/* Toolbar:對齊 data-table.stories WithBulkActions「左 search / 右 ops」idiom + layoutSpace 規則 1B 父層 padding */}
      <div className="flex items-center gap-2 px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]">
        <Input
          size="md"
          placeholder="搜尋 issue id / title…"
          startIcon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="flex-1" />
        <Button size="md" variant="secondary" startIcon={Filter}>
          篩選
        </Button>
        <Button size="md" variant="secondary" startIcon={ArrowUpDown}>
          排序
        </Button>
      </div>
      {/* DataTable:naked structure,規則 1B 父層 mx 對齊 chrome 內容左右邊界 */}
      <div className="flex-1 min-h-0 mx-[var(--layout-space-loose)] mb-[var(--layout-space-loose)]">
        <DataTable
          columns={ISSUE_COLUMNS as any}
          data={filtered}
          height="100%"
          bordered
        />
      </div>
    </div>
  )
}

/** Aside content:Issue detail panel,內容自管 padding 遵循 layoutSpace 規則 1B。 */
function IssueDetail({ issue }: { issue: Issue | null }) {
  if (!issue) {
    return (
      <div className="px-[var(--layout-space-loose)] py-[var(--layout-space-loose)] text-fg-muted">
        選一個 issue 看詳情
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-[var(--layout-space-loose)] px-[var(--layout-space-loose)] py-[var(--layout-space-loose)]">
      <p className="text-caption text-fg-muted">
        {issue.id} • {issue.status} • {issue.priority}
      </p>
      <h2 className="text-h5 font-medium">{issue.title}</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-[var(--layout-space-loose)] gap-y-[var(--layout-space-tight)] text-body">
        <dt className="text-fg-muted">Assignee</dt>
        <dd>{issue.assignee}</dd>
        <dt className="text-fg-muted">Due</dt>
        <dd>{issue.due}</dd>
      </dl>
      <div className="flex gap-2">
        <Button size="sm" variant="primary">分派給我</Button>
        <Button size="sm" variant="secondary">標記完成</Button>
      </div>
    </div>
  )
}

// ── Stories ──────────────────────────────────────────────────────────────────

/**
 * primary-sidebar mode(Linear / Notion / Figma 派)— Linear-style issue tracker:
 * - Sidebar 完整佈局(WorkspaceBrand + SidebarFooter avatar HoverCard,對齊 sidebar.stories baseline)
 * - Header SidebarTrigger + 當前頁 title 緊鄰 + 右 toggle Aside button
 * - Main:Toolbar(search + filter + sort)+ DataTable(對齊 data-table.stories WithBulkActions)
 * - Aside:always-on header + close X + issue detail content
 */
export const PrimarySidebar: Story = {
  name: 'primary-sidebar(Linear-style issue tracker)',
  render: () => {
    const [activeId, setActiveId] = React.useState<string>('inbox')
    const [asideOpen, setAsideOpen] = React.useState(true)
    const [selected, setSelected] = React.useState<Issue | null>(ISSUES[0])

    return (
      <SidebarProvider activeId={activeId} onActiveChange={setActiveId}>
        <AppShell
          layout="primary-sidebar"
          sidebar={<AcmeSidebar />}
          header={
            <PageHeader
              title={MAIN_NAV.find((n) => n.id === activeId)?.label ?? 'Inbox'}
              onToggleAside={() => setAsideOpen(!asideOpen)}
              asideOpen={asideOpen}
            />
          }
          aside={
            <AppShellAside title={selected ? selected.id : '詳情'} width={360}>
              <IssueDetail issue={selected} />
            </AppShellAside>
          }
          asideOpen={asideOpen}
          onAsideOpenChange={setAsideOpen}
        >
          <IssuesView
            onSelectIssue={(issue) => {
              setSelected(issue)
              setAsideOpen(true)
            }}
          />
        </AppShell>
      </SidebarProvider>
    )
  },
}

/**
 * primary-header mode pending Sidebar SSOT viewport-inset extension(2026-05-19 codex Layer B
 * D1 verdict)。Sidebar 既有 `fixed inset-y-0 h-svh` 會蓋住 global header → broken UI。
 * 待 Sidebar 升級 `viewportInsetTop` 能力後 ship。本 story 暫 removed,避免 broken demo。
 */
// export const PrimaryHeader: Story = { ... }  // future tier, pending Sidebar SSOT

/**
 * Aside modal mode demo — viewport < 768px Aside 自動切 Sheet,從右滑出 + 蓋 mask。
 * 對齊 Material 3 modal drawer canonical。Content 同 desktop inline 模式(panel role 不變,host 換)。
 * asideOpen 預設 true 確保 visual probe 真實看到 modal Sheet。
 */
export const AsideModalOnMobile: Story = {
  name: 'Aside modal mode(< 768px Sheet fallback)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => {
    const [activeId, setActiveId] = React.useState<string>('inbox')
    const [asideOpen, setAsideOpen] = React.useState(true)
    const [selected] = React.useState<Issue | null>(ISSUES[0])

    return (
      <SidebarProvider activeId={activeId} onActiveChange={setActiveId}>
        <AppShell
          layout="primary-sidebar"
          sidebar={<AcmeSidebar />}
          header={
            <PageHeader
              title="Inbox"
              onToggleAside={() => setAsideOpen(!asideOpen)}
              asideOpen={asideOpen}
            />
          }
          aside={
            <AppShellAside title={selected ? selected.id : '詳情'} width={360}>
              <IssueDetail issue={selected} />
            </AppShellAside>
          }
          asideOpen={asideOpen}
          onAsideOpenChange={setAsideOpen}
        >
          <IssuesView onSelectIssue={() => setAsideOpen(true)} />
        </AppShell>
      </SidebarProvider>
    )
  },
}
