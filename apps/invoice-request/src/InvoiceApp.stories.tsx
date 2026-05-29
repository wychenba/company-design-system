// @anatomy-exempt: prototype — status Tag custom color; line-items layout table not data table
// @story-baseline: @qijenchen/design-system/components/Sidebar/sidebar.stories.tsx#IconCollapse
// @composition-fidelity-mode: shell-only
// @composition-fidelity-mask: main, [data-mask="content"]
//
// ── 請款管理系統 prototype — 消費 @qijenchen/design-system ──
// 靜態畫面:請款列表 + 新增請款單

import type { Meta, StoryObj } from '@storybook/react'
import {
  AppShell,
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  TooltipProvider,
  Avatar,
  ItemAvatar,
  Button,
  Tag,
  Field,
  FieldLabel,
  Input,
  Select,
  DatePicker,
  Textarea,
  Steps,
  StepItem,
  StepLabel,
} from '@qijenchen/design-system'
import {
  LayoutDashboard,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Plus,
  Download,
  Search,
  Eye,
  MoreHorizontal,
  ArrowLeft,
} from 'lucide-react'

// ── Shared helpers ────────────────────────────────────────────────────────────

type NavId = 'dashboard' | 'invoices' | 'clients' | 'reports' | 'settings'

// button-group bundled gap — bypasses layoutSpace rules per spec "bundled → 元件 spec own"
function ActionGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{/* @layout-space-magic-ok: gap-2 bundled button group — DS canonical button-group spacing, bypasses layoutSpace per spec rule bundled own */}
    {children}
  </div>
}

function InvoiceSidebar({ activeId }: { activeId: NavId }) {
  const NAV: { id: NavId; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: '總覽',     icon: LayoutDashboard },
    { id: 'invoices',  label: '請款列表', icon: Receipt },
    { id: 'clients',   label: '客戶管理', icon: Users },
    { id: 'reports',   label: '報表',     icon: BarChart3 },
    { id: 'settings',  label: '設定',     icon: Settings },
  ]
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 min-w-0 group-data-[collapsible=icon]:justify-center">{/* @layout-space-magic-ok: gap-2 sidebar icon+label pair — micro chrome gap, same as DS template App.tsx canonical */}
          <Avatar alt="請款系統" size={24} shape="square" color="blue" solid />
          <span className="text-body-lg font-medium truncate group-data-[collapsible=icon]:hidden">請款管理</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ id, label, icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton id={id} startIcon={icon} tooltip={label} data-active={activeId === id ? 'true' : undefined}>
                    {label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div role="group" aria-label="當前使用者">
                <ItemAvatar alt="陳雅婷" color="indigo" />
                <span data-sidebar="menu-label" className="min-w-0 flex-1 truncate">陳雅婷</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-center h-[var(--chrome-header-height)] px-[var(--layout-space-loose)] bg-surface border-b border-divider">
      <SidebarTrigger />
      <h1 className="text-body-lg font-medium flex-1 truncate px-[var(--layout-space-tight)]">{title}</h1>
      {children}
    </header>
  )
}

function InvoiceAppShell({
  activePage, headerTitle, headerActions, children,
}: {
  activePage: NavId; headerTitle: string; headerActions?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={300}>
      <SidebarProvider activeId={activePage}>
        <AppShell
          layout="primary-sidebar"
          sidebar={<InvoiceSidebar activeId={activePage} />}
          header={<PageHeader title={headerTitle}>{headerActions}</PageHeader>}
        >
          {children}
        </AppShell>
      </SidebarProvider>
    </TooltipProvider>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

type InvoiceStatus = 'pending_review' | 'reviewing' | 'approved' | 'paid' | 'overdue' | 'rejected'

const STATUS_MAP: Record<InvoiceStatus, { label: string; color: 'yellow' | 'blue' | 'green' | 'turquoise' | 'red' | 'neutral' }> = {
  pending_review: { label: '待審核', color: 'yellow' },
  reviewing:      { label: '審核中', color: 'blue' },
  approved:       { label: '已核准', color: 'green' },
  paid:           { label: '已付款', color: 'turquoise' },
  overdue:        { label: '已逾期', color: 'red' },
  rejected:       { label: '已退回', color: 'neutral' },
}

interface InvoiceRow { id: string; date: string; client: string; amount: number; totalAmount: number; status: InvoiceStatus }

const INVOICES: InvoiceRow[] = [
  { id: 'INV-2025-0042', date: '2025/05/28', client: '裕民科技股份有限公司',   amount: 125000, totalAmount: 131250, status: 'pending_review' },
  { id: 'INV-2025-0041', date: '2025/05/21', client: 'Stripe Taiwan LLC',     amount: 80000,  totalAmount: 84000,  status: 'pending_review' },
  { id: 'INV-2025-0040', date: '2025/05/15', client: 'Notion Japan K.K.',     amount: 45000,  totalAmount: 47250,  status: 'paid' },
  { id: 'INV-2025-0039', date: '2025/05/10', client: '遠傳電信股份有限公司',   amount: 68000,  totalAmount: 71400,  status: 'reviewing' },
  { id: 'INV-2025-0038', date: '2025/04/30', client: '台灣大車隊股份有限公司', amount: 92000,  totalAmount: 96600,  status: 'overdue' },
  { id: 'INV-2025-0037', date: '2025/04/25', client: '寬宏藝術有限公司',       amount: 35000,  totalAmount: 36750,  status: 'paid' },
  { id: 'INV-2025-0036', date: '2025/04/18', client: 'Atlassian Taiwan',      amount: 150000, totalAmount: 157500, status: 'paid' },
  { id: 'INV-2025-0035', date: '2025/04/12', client: '中信房屋股份有限公司',   amount: 28500,  totalAmount: 29925,  status: 'rejected' },
]

function fmt(n: number) { return `NT$ ${n.toLocaleString('zh-TW')}` }

// ── Story 1: 請款列表 ─────────────────────────────────────────────────────────

const STATS: { label: string; count: string; amount: string; color: 'yellow' | 'blue' | 'green' | 'red' }[] = [
  { label: '本月待審核', count: '2 件', amount: 'NT$ 205,000', color: 'yellow' },
  { label: '審核中',     count: '1 件', amount: 'NT$ 68,000',  color: 'blue' },
  { label: '本月已付款', count: '3 件', amount: 'NT$ 230,000', color: 'green' },
  { label: '逾期未付',   count: '1 件', amount: 'NT$ 92,000',  color: 'red' },
]

function InvoiceListPage() {
  return (
    <div className="px-[var(--layout-space-loose)] py-[var(--layout-space-loose)] space-y-[var(--layout-space-loose)]">
      {/* 統計指標 */}
      <div className="grid grid-cols-4 gap-[var(--layout-space-loose)]">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-lg border border-divider bg-surface p-[var(--layout-space-loose)] space-y-1.5">{/* @layout-space-magic-ok: space-y-1.5 stat card internal label→count→badge micro-gap (6px), not representable as layout-space token */}
            <div className="text-caption text-fg-muted">{s.label}</div>
            <div className="text-h4 font-semibold text-foreground">{s.count}</div>
            <Tag color={s.color} size="sm">{s.amount}</Tag>
          </div>
        ))}
      </div>

      {/* 搜尋工具列 */}
      <div className="flex items-center gap-[var(--layout-space-tight)]">
        <Input
          placeholder="搜尋請款編號、客戶名稱…"
          startIcon={Search}
          className="flex-1 max-w-xs"
        />
        <Button variant="tertiary" size="md">篩選</Button>
        <Button variant="tertiary" size="md" startIcon={Download}>匯出</Button>
      </div>

      {/* 請款列表表格 */}
      <div className="rounded-lg border border-divider bg-surface overflow-hidden">
        <table className="w-full text-body">
          <thead>
            <tr className="border-b border-divider bg-secondary/40">
              {['請款編號', '請款日期', '客戶名稱', '請款金額', '含稅金額', '狀態', '操作'].map((h) => (
                <th key={h} className="px-[var(--layout-space-loose)] py-[var(--layout-space-tight)] text-left text-caption font-medium text-fg-muted whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv) => {
              const st = STATUS_MAP[inv.status]
              return (
                <tr key={inv.id} className="border-b border-divider last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-[var(--layout-space-loose)] py-[var(--layout-space-tight)] font-mono text-[13px] text-primary whitespace-nowrap">{inv.id}</td>
                  <td className="px-[var(--layout-space-loose)] py-[var(--layout-space-tight)] text-fg-secondary whitespace-nowrap">{inv.date}</td>
                  <td className="px-[var(--layout-space-loose)] py-[var(--layout-space-tight)] text-foreground">{inv.client}</td>
                  <td className="px-[var(--layout-space-loose)] py-[var(--layout-space-tight)] tabular-nums text-right whitespace-nowrap">{fmt(inv.amount)}</td>
                  <td className="px-[var(--layout-space-loose)] py-[var(--layout-space-tight)] tabular-nums text-right whitespace-nowrap">{fmt(inv.totalAmount)}</td>
                  <td className="px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]">
                    <Tag color={st.color} size="sm">{st.label}</Tag>
                  </td>
                  <td className="px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]">
                    <ActionGroup>
                      <Button variant="text" size="sm" iconOnly startIcon={Eye} aria-label="查看" />
                      <Button variant="text" size="sm" iconOnly startIcon={MoreHorizontal} aria-label="更多" />
                    </ActionGroup>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-[var(--layout-space-loose)] py-[var(--layout-space-tight)] border-t border-divider flex items-center justify-between">
          <span className="text-caption text-fg-muted">共 {INVOICES.length} 筆</span>
          <ActionGroup>
            <Button variant="tertiary" size="sm" disabled>上一頁</Button>
            <span className="text-caption text-fg-muted px-[var(--layout-space-tight)]">1 / 1</span>
            <Button variant="tertiary" size="sm" disabled>下一頁</Button>
          </ActionGroup>
        </div>
      </div>
    </div>
  )
}

// ── Story 2: 新增請款單 ───────────────────────────────────────────────────────

const CLIENT_OPTIONS = [
  { value: 'yumin',     label: '裕民科技股份有限公司' },
  { value: 'stripe',    label: 'Stripe Taiwan LLC' },
  { value: 'notion',    label: 'Notion Japan K.K.' },
  { value: 'fetnet',    label: '遠傳電信股份有限公司' },
  { value: 'atlassian', label: 'Atlassian Taiwan' },
]

const PAYMENT_OPTIONS = [
  { value: 'bank',  label: '銀行轉帳' },
  { value: 'check', label: '支票' },
  { value: 'lc',    label: '信用狀' },
]

const LINE_ITEMS = [
  { desc: '年度軟體授權費 — Professional Plan', qty: 1,  unit: 80000, subtotal: 80000 },
  { desc: '技術諮詢服務（2025/04–05）',          qty: 30, unit: 1500,  subtotal: 45000 },
]

function NewInvoicePage() {
  return (
    <div className="px-[var(--layout-space-loose)] py-[var(--layout-space-loose)] space-y-[var(--layout-space-loose)] max-w-3xl">

      {/* Steps 進度 */}
      <div className="rounded-lg border border-divider bg-surface px-[var(--layout-space-loose)] py-[var(--layout-space-loose)]">
        <Steps value="step1" completedValues={[]} orientation="horizontal" size="md">
          <StepItem value="step1"><StepLabel>基本資訊</StepLabel></StepItem>
          <StepItem value="step2"><StepLabel>請款項目</StepLabel></StepItem>
          <StepItem value="step3"><StepLabel>確認送出</StepLabel></StepItem>
        </Steps>
      </div>

      {/* 客戶與合約資訊 */}
      <div className="rounded-lg border border-divider bg-surface px-[var(--layout-space-loose)] py-[var(--layout-space-loose)] space-y-[var(--layout-space-loose)]">
        <h2 className="text-body-lg font-semibold text-foreground">客戶與合約資訊</h2>
        <div className="grid grid-cols-2 gap-x-[var(--layout-space-loose)] gap-y-[var(--layout-space-loose)]">
          <Field required orientation="vertical">
            <FieldLabel>客戶名稱</FieldLabel>
            <Select options={CLIENT_OPTIONS} defaultValue="yumin" searchable />
          </Field>
          <Field orientation="vertical">
            <FieldLabel>統一編號</FieldLabel>
            <Input defaultValue="27680958" placeholder="8 位數字" />
          </Field>
          <Field orientation="vertical">
            <FieldLabel>聯絡人</FieldLabel>
            <Input defaultValue="林佳慧 業務主任" placeholder="姓名與職稱" />
          </Field>
          <Field orientation="vertical">
            <FieldLabel>合約 / 採購單編號</FieldLabel>
            <Input defaultValue="PO-2025-05-0089" placeholder="PO-YYYY-MM-XXXX" />
          </Field>
          <Field required orientation="vertical">
            <FieldLabel>請款日期</FieldLabel>
            <DatePicker defaultValue="2025-05-29" />
          </Field>
          <Field required orientation="vertical">
            <FieldLabel>付款期限（Net 30）</FieldLabel>
            <DatePicker defaultValue="2025-06-28" />
          </Field>
          <Field orientation="vertical">
            <FieldLabel>付款方式</FieldLabel>
            <Select options={PAYMENT_OPTIONS} defaultValue="bank" />
          </Field>
        </div>
      </div>

      {/* 請款項目 */}
      <div className="rounded-lg border border-divider bg-surface px-[var(--layout-space-loose)] py-[var(--layout-space-loose)] space-y-[var(--layout-space-loose)]">
        <div className="flex items-center justify-between">
          <h2 className="text-body-lg font-semibold text-foreground">請款項目</h2>
          <Button variant="secondary" size="sm" startIcon={Plus}>新增項目</Button>
        </div>
        <table className="w-full text-body">
          <thead>
            <tr className="border-b border-divider">
              {['項目描述', '數量', '單價（NT$）', '小計（NT$）'].map((h) => (
                <th key={h} className="pb-[var(--layout-space-tight)] text-left text-caption font-medium text-fg-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LINE_ITEMS.map((item, i) => (
              <tr key={i} className="border-b border-divider last:border-0">
                <td className="py-[var(--layout-space-tight)] pr-[var(--layout-space-loose)] text-foreground">{item.desc}</td>
                <td className="py-[var(--layout-space-tight)] pr-[var(--layout-space-loose)] text-fg-secondary tabular-nums">{item.qty}</td>
                <td className="py-[var(--layout-space-tight)] pr-[var(--layout-space-loose)] text-fg-secondary tabular-nums text-right">{item.unit.toLocaleString()}</td>
                <td className="py-[var(--layout-space-tight)] text-foreground tabular-nums text-right font-medium">{item.subtotal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end">
          <div className="w-60 space-y-[var(--layout-space-tight)] text-body">
            <div className="flex justify-between text-fg-secondary">
              <span>小計</span><span className="tabular-nums">NT$ 125,000</span>
            </div>
            <div className="flex justify-between text-fg-secondary">
              <span>營業稅（5%）</span><span className="tabular-nums">NT$ 6,250</span>
            </div>
            <div className="h-px bg-divider" />
            <div className="flex justify-between text-body-lg font-semibold text-foreground">
              <span>含稅總計</span><span className="tabular-nums">NT$ 131,250</span>
            </div>
          </div>
        </div>
      </div>

      {/* 備註 */}
      <div className="rounded-lg border border-divider bg-surface px-[var(--layout-space-loose)] py-[var(--layout-space-loose)] space-y-[var(--layout-space-tight)]">
        <h2 className="text-body-lg font-semibold text-foreground">請款備註</h2>
        <Field orientation="vertical">
          <FieldLabel>備註說明</FieldLabel>
          <Textarea
            rows={3}
            defaultValue="依合約 PO-2025-05-0089 第三條款，本期帳款含年度授權費及技術諮詢費用，請款期限為 2025/06/28。匯款帳號請見附件。"
          />
        </Field>
      </div>

      {/* 操作按鈕 */}
      <div className="flex items-center justify-between pb-[var(--layout-space-bottom)]">
        <Button variant="tertiary" startIcon={ArrowLeft}>返回列表</Button>
        <ActionGroup>
          <Button variant="secondary">存為草稿</Button>
          <Button variant="primary">下一步：請款項目</Button>
        </ActionGroup>
      </div>
    </div>
  )
}

// ── Storybook Meta ────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Apps/invoice-request/請款管理',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**請款管理系統 prototype** — B2B 業務人員，消費 `@qijenchen/design-system`。\n\n' +
          '- **請款列表**：統計指標 + 資料表 + 狀態標籤\n' +
          '- **新增請款單**：Steps 流程 + 表單 + 項目明細',
      },
    },
  },
}

export default meta
type Story = StoryObj

export const InvoiceList: Story = {
  name: '請款列表',
  render: () => (
    <InvoiceAppShell
      activePage="invoices"
      headerTitle="請款管理"
      headerActions={
        <ActionGroup>
          <Button variant="tertiary" size="md" startIcon={Download}>匯出</Button>
          <Button variant="primary" size="md" startIcon={Plus}>新增請款單</Button>
        </ActionGroup>
      }
    >
      <InvoiceListPage />
    </InvoiceAppShell>
  ),
}

export const NewInvoice: Story = {
  name: '新增請款單',
  render: () => (
    <InvoiceAppShell activePage="invoices" headerTitle="新增請款單">
      <NewInvoicePage />
    </InvoiceAppShell>
  ),
}
