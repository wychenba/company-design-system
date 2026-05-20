// @benchmark-cited: Sidebar full-layout baseline + DataTable toolbar pattern + Linear real-product 場景。
// @story-baseline: src/design-system/components/Sidebar/sidebar.stories.tsx#IconCollapse (Sidebar 完整佈局)
// @story-baseline: src/design-system/components/DataTable/data-table.stories.tsx#WithBulkActions (Toolbar + DataTable)
import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { Search, Filter, ArrowUpDown, PanelRightOpen, UserCheck, CheckCircle2 } from 'lucide-react'
import { AppShell, AppShellAside } from './app-shell'
import { AcmeSidebar, PageHeader, MAIN_NAV } from './_demo-helpers'
import { SidebarProvider } from '@/design-system/components/Sidebar/sidebar'
import { Button } from '@/design-system/components/Button/button'
import { Input } from '@/design-system/components/Input/input'
import { Tag } from '@/design-system/components/Tag/tag'
import { DataTable } from '@/design-system/components/DataTable/data-table'
import { DataTableFilterPanel, createEmptyFilterTree, isFilterTreeActive, type FilterTree } from '@/design-system/components/DataTable/data-table-filter-panel'
import { DataTableSortManager } from '@/design-system/components/DataTable/data-table-sort-manager'
import { Popover, PopoverContent, PopoverTrigger } from '@/design-system/components/Popover/popover'
import { DescriptionList, DescriptionItem } from '@/design-system/components/DescriptionList/description-list'
import { ItemContent } from '@/design-system/patterns/element-anatomy/item-anatomy'
import type { SortingState } from '@tanstack/react-table'

const meta: Meta<typeof AppShell> = {
  title: 'Design System/Components/AppShell/展示',
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

/**
 * Main content:Toolbar(search + filter + sort)+ DataTable + Row actions trigger Aside。
 * @usage-ref: data-table.stories.tsx#WithBulkActions
 * @usage-consumes: Popover + DataTableFilterPanel + DataTableSortManager + Button text iconOnly pressed + rowActions
 *
 * Per codex Layer B D3(2026-05-20):row-driven Aside trigger 才符合 Linear/Notion/Jira/Airtable
 * production 真實情境。row 右側 dedicated action button(`Button variant="text" size="xs" iconOnly`
 * per data-table.spec L193 canonical)→ click 開 Aside + 被選 issue active visual(pressed prop)。
 * AppShell header toggle 降級為 secondary show/hide 不是主入口。
 */
function IssuesView({ selectedId, onSelectIssue }: { selectedId?: string; onSelectIssue: (issue: Issue) => void }) {
  const [search, setSearch] = React.useState('')
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [filterTree, setFilterTree] = React.useState<FilterTree>(() => createEmptyFilterTree('flat'))
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [sortOpen, setSortOpen] = React.useState(false)

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
      {/* Toolbar:對齊 data-table.stories.tsx#WithBulkActions「左 search / 右 ops」idiom + action-bar canonical */}
      <div className="flex items-center justify-between gap-2 px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]">
        <div className="flex-1 max-w-sm">
          <Input
            size="sm"
            placeholder="搜尋 issue id / title…"
            startIcon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Filter:tertiary iconOnly + Popover wrap real DataTableFilterPanel + pressed prop active state */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="text"
                size="sm"
                iconOnly
                startIcon={Filter}
                aria-label="篩選"
                pressed={isFilterTreeActive(filterTree)}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <DataTableFilterPanel
                mode="flat"
                columns={ISSUE_COLUMNS as any}
                value={filterTree}
                onChange={setFilterTree}
                onClose={() => setFilterOpen(false)}
              />
            </PopoverContent>
          </Popover>
          {/* Sort:tertiary iconOnly + Popover wrap real DataTableSortManager + pressed active state */}
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="text"
                size="sm"
                iconOnly
                startIcon={ArrowUpDown}
                aria-label="排序"
                pressed={sorting.length > 0}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <DataTableSortManager
                columns={ISSUE_COLUMNS as any}
                sorting={sorting}
                onSortingChange={setSorting}
                onClose={() => setSortOpen(false)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* DataTable:naked structure,layoutSpace 規則 1B 父層 mx 對齊 chrome 內容左右邊界。
          rowActions:per data-table.spec L193 canonical(Button text xs iconOnly,固定 24px)+
          pressed={row.id === selectedId} 顯示當前選中(per codex D3 active visual)。 */}
      <div className="flex-1 min-h-0 mx-[var(--layout-space-loose)] mb-[var(--layout-space-loose)]">
        <DataTable
          columns={ISSUE_COLUMNS as any}
          data={filtered}
          height="100%"
          bordered
          rowActions={(row: Issue) => (
            <Button
              variant="text"
              size="xs"
              iconOnly
              startIcon={PanelRightOpen}
              aria-label={`開啟 ${row.id} 詳情`}
              pressed={row.id === selectedId}
              onClick={() => onSelectIssue(row)}
            />
          )}
        />
      </div>
    </div>
  )
}

// Status / Priority → Tag color mapping(per Tag spec status marker canonical)
const STATUS_COLOR = {
  'In Progress': 'blue',
  'Backlog': 'neutral',
  'In Review': 'yellow',
  'Done': 'green',
} as const

const PRIORITY_COLOR = {
  P0: 'red',
  P1: 'yellow',
  P2: 'neutral',
} as const

/**
 * Aside content:Issue detail panel。
 * @usage-ref: src/design-system/components/DescriptionList/description-list.stories.tsx
 * @usage-consumes: ItemContent(entity identity)+ Tag(status/priority)+ DescriptionList(metadata)+ Button(actions)
 *
 * Per codex Layer B D1+D2(2026-05-20):
 * - Entity identity(title + id 副標)→ ItemContent(item-anatomy Family 2 subtitle pattern,非 NameCard 因 scope 是 people only)
 * - Status / Priority marker → Tag color-coded(per tag.spec.md status use case)
 * - Metadata fields → DescriptionList + DescriptionItem(per description-list.spec.md「detail panel 屬性列表」use case)
 * - Actions → Button(已對齊)
 *
 * Layout per layoutSpace.spec 規則 2 + 規則 4(內容 → action button → bottom 48)。
 */
function IssueDetail({ issue }: { issue: Issue | null }) {
  if (!issue) {
    return (
      <div className="px-[var(--layout-space-loose)] py-[var(--layout-space-tight)] text-fg-muted">
        選一個 issue 看詳情
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-[var(--layout-space-loose)] px-[var(--layout-space-loose)] pt-[var(--layout-space-tight)] pb-[var(--layout-space-bottom)]">
      <div className="flex flex-col gap-[var(--layout-space-tight)]">
        <ItemContent
          size="lg"
          label={issue.title}
          description={issue.id}
          descriptionTone="muted"
          labelTruncate={false}
          labelClassName="font-medium text-foreground"
        />
        <div className="flex flex-wrap gap-2">
          <Tag size="sm" color={STATUS_COLOR[issue.status]}>{issue.status}</Tag>
          <Tag size="sm" color={PRIORITY_COLOR[issue.priority]}>{issue.priority}</Tag>
        </div>
      </div>
      <DescriptionList direction="horizontal" divided>
        <DescriptionItem label="Assignee">{issue.assignee}</DescriptionItem>
        <DescriptionItem label="Due">{issue.due}</DescriptionItem>
      </DescriptionList>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" startIcon={UserCheck}>分派給我</Button>
        <Button size="sm" variant="secondary" startIcon={CheckCircle2}>標記完成</Button>
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
            selectedId={selected?.id}
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

// AsideModalOnMobile story retired 2026-05-20 per user directive「不要這個範例」
// Mobile responsive behavior 已在 anatomy StateBehavior story + spec.md「Aside 2-mode」段 documented。
