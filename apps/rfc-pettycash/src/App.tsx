import { useState } from 'react'
import {
  AppShell, SidebarProvider, Sidebar, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger,
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
  Avatar, ItemAvatar, Button,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle,
  Steps, StepItem, StepLabel,
  Input, Select, Textarea, Checkbox,
  RadioGroup, RadioGroupItem,
  Field, FieldLabel,
  Tag, Notice, Separator,
  Toaster, toast,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage,
} from '@qijenchen/design-system'
import {
  Home, FileText, Upload, ClipboardList, Users, BookOpen,
  MessageSquare, Plus, Pencil, Copy, Trash2, Download,
  Info, ChevronDown, ChevronUp, Paperclip,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const VOUCHER_TYPES = [
  { value: 'e-invoice-25', label: '電子統一發票 (25)' },
  { value: 'paper-invoice', label: '紙本統一發票' },
  { value: 'receipt-26', label: '統一發票收據 (26)' },
  { value: 'receipt-backfill-26', label: '統一發票後補 (26)' },
  { value: 'received-26', label: '茲收到 (26)' },
  { value: 'domestic-receipt-26', label: '國內廠商收據 (26)' },
  { value: 'foreign-receipt-26', label: '國外廠商收據 (26)' },
  { value: 'agent-cert-26', label: '經手人證明 (26)' },
  { value: 'debit-note-23', label: '折讓單 (23)' },
]

const CATEGORIES: Record<string, string[]> = {
  '維修及購買零配件': ['純工/連工帶料(檢測、校正、加工...等)', '純料(螺絲、O-ring等)', '公共設施/辦公室/其他非Fab區域', '維修電腦及其週邊'],
  '小型工具/物品、電腦/手機週邊、辦公家具': ['小型工具/物品(把手/推車/護具/螺絲起子...等)', '電腦/手機週邊', '辦公家俱(檯子/桌椅/隔板...等)'],
  '文具用品、印刷、書報雜誌/資料庫、軟體、郵快遞費': [
    '標準化軟體(非雲端服務/無雙方互動，如：adobe、字體、輸入法...等)',
    '客製化軟體、線上互動軟體(Kahoot/Canva...等)、雲端服務(AI、API...等)',
    '公用書籍、報章雜誌、電子報、線上資料庫',
    '郵快遞費(如:郵局、ups、快遞等)', '印刷(海報/獎狀/貼紙...等)', '複印', '文具用品(紙/筆/資料夾...等)',
  ],
  '外部研討會/跨組織舉辦之研討會、宣導活動': [
    '跨組織舉辦之研討會、宣導活動-餐飲費用', '跨組織舉辦之研討會、宣導活動-贈送禮品禮券',
    '跨組織舉辦之研討會、宣導活動-聘請外部講師或是機構', '跨組織舉辦之研討會、宣導活動-用品及其他費用',
    '參與台灣境內研討會-旅費', '參與台灣境內研討會-報名費', '參與台灣境外研討會-旅費', '參與台灣境外研討會-報名費',
  ],
  '訓練/招募/JDP/國內JOS': [
    '訓練費-各部門外部訓練費', '訓練費-人力資訓練費-人力資源舉辦-外部學習平台/工具資源舉辦-台積學習平台',
    '訓練費-人力資源舉辦-交通費', '訓練費-人力資源-餐飲費用', '訓練費-人力資源-禮品/禮券',
    '訓練費-人力資源-道具及其他用品', '訓練費-人力資源舉辦-報名費/語言及進修補助費',
    '國內招募_餐飲費用', '國內招募_禮品禮券', '國內招募_用品及其他',
    '國外招募_餐飲費用', '國外招募_禮品禮券', '國外招募_用品及其他',
    'JDP大專院校合作專案', 'JDP-技術研發', '潛在未來人才培育', '專案訓練費', '考取證照費', 'JOS子女就學補助', 'JOS搬遷費',
  ],
  '晶片光罩等運費/機儀器搬遷/辦公室搬遷': ['非機儀器之搬遷或重新裝潢', '運費(如:晶片車、handcarry車資等)', '機儀器遷移安裝'],
  '雜支/拜拜/辦公布置': ['雜支/拜拜(餐飲費用)/辦公布置等其他用品', '聘請外部個人與機關團體', '香油錢', '禮品禮券'],
  '廣告費': ['促銷廣告費', '形象廣告費-國內', '形象廣告費-國際'],
  'Legal專用': ['律師費(216631)-國外事務所且在境外執行業務', '律師費(216631)-國內事務所及其他', '專利費用-國外事務所且在境外執行業務', '專利費用-國內事務所及其他', 'Patent License'],
  '健康中心/ERG@tsmc等員工關懷': ['醫療器材、救護車...等非勞務費用', '餐飲費用', '禮品禮物', '非醫療用品與其他'],
  '專業費用專區': ['會計師費', '應計會計師費', '顧問費-一般', '顧問費-學術合作'],
  '其他': ['其他', '折讓'],
  '系統用': ['Legal'],
}

const CATEGORY_OPTIONS = Object.keys(CATEGORIES).map((k) => ({ value: k, label: k }))
const TAX_RATES = [{ value: '5', label: '5%' }, { value: '0', label: '0%' }, { value: 'exempt', label: '免稅' }]
const CURRENCY_OPTIONS = [{ value: 'TWD', label: 'TWD' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'JPY', label: 'JPY' }]
const PAYEE_OPTIONS = [{ value: 'employee', label: '員工' }, { value: 'vendor', label: '廠商' }, { value: 'talent', label: '達人' }]

type StatusKey = 'draft' | 'reviewing' | 'manager-rejected' | 'acct-rejected' | 'approved' | 'finance-cleared' | 'acct-posted' | 'modifying' | 'abandoned' | 'advance-cleared'
const STATUS_META: Record<StatusKey, { label: string; color: 'neutral' | 'blue' | 'red' | 'green' | 'yellow' | 'turquoise' }> = {
  draft: { label: '草稿', color: 'neutral' },
  reviewing: { label: '審核中', color: 'blue' },
  'manager-rejected': { label: '主管退單', color: 'red' },
  'acct-rejected': { label: '會計退單', color: 'red' },
  approved: { label: '會計核准', color: 'green' },
  'finance-cleared': { label: '財務清單', color: 'turquoise' },
  'acct-posted': { label: '會計拋帳', color: 'blue' },
  modifying: { label: '修改中', color: 'yellow' },
  abandoned: { label: '取消申請', color: 'neutral' },
  'advance-cleared': { label: '預支款銷帳', color: 'blue' },
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface LineItem { id: string; category: string; subCategory: string; costCenter: string; accountCode: string; description: string; total: string; taxRate: string; contractNo: string }
interface InvoiceCard { id: string; number: string; status: StatusKey; payee: string; date: string; voucherType: string; voucherTypeLabel: string; invoiceNo: string; currency: string; subtotal: string; tax: string; total: number; lineItems: LineItem[]; expanded: boolean }
interface AttachmentItem { id: string; type: string; description: string; fileName: string }
interface DraftEntry { id: string; date: string; company: string; applicant: string; payee: string; total: number; urgentDate: string; reason: string; status: StatusKey }

// ─────────────────────────────────────────────────────────────
// InfoTooltip
// ─────────────────────────────────────────────────────────────

function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="inline-flex items-center justify-center text-fg-tertiary hover:text-fg-secondary transition-colors" aria-label="說明">
          <Info size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">{content}</TooltipContent>
    </Tooltip>
  )
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────

const WORK_NAV = [
  { id: 'drafts', label: '暫存申請單', icon: FileText },
  { id: 'bulk-import', label: '批次匯入紀錄', icon: Upload },
  { id: 'my-tasks', label: '我的工作清單', icon: ClipboardList },
] as const

const MGMT_NAV = [
  { id: 'view-requests', label: '查看申請單', icon: BookOpen },
  { id: 'review-tasks', label: '審核工作清單', icon: Users },
  { id: 'secretary-tasks', label: '秘書工作清單', icon: ClipboardList },
] as const

function AppSidebar({ activeId, onActiveChange }: { activeId: string; onActiveChange: (id: string) => void }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 min-w-0 group-data-[collapsible=icon]:justify-center">
          <Avatar alt="RFC/PettyCash" size={24} shape="square" color="blue" solid />
          <span className="text-body-lg font-medium truncate group-data-[collapsible=icon]:hidden">RFC/PettyCash</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton id="home" startIcon={Home} tooltip="首頁" onClick={() => onActiveChange('home')}>首頁</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>工作區</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {WORK_NAV.map(({ id, label, icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton id={id} startIcon={icon} tooltip={label} data-active={activeId === id ? true : undefined} onClick={() => onActiveChange(id)}>{label}</SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>管理</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MGMT_NAV.map(({ id, label, icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton id={id} startIcon={icon} tooltip={label} onClick={() => onActiveChange(id)}>{label}</SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton id="feedback" startIcon={MessageSquare} tooltip="使用者體驗調查" onClick={() => onActiveChange('feedback')}>使用者體驗調查</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div role="group" aria-label="林間宜">
                <ItemAvatar alt="林間宜" color="blue" />
                <span data-sidebar="menu-label" className="min-w-0 flex-1 truncate">林間宜 (023156)</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

// ─────────────────────────────────────────────────────────────
// Step1Form — 填寫請款資訊
// ─────────────────────────────────────────────────────────────

interface Step1State { voucherType: string; date: string; invoiceNo: string; currency: string; subtotal: string; tax: string }
const defaultStep1 = (): Step1State => ({ voucherType: '', date: '', invoiceNo: '', currency: 'TWD', subtotal: '', tax: '' })

function Step1Form({ invoiceNumber, state, onChange }: { invoiceNumber: string; state: Step1State; onChange: (s: Step1State) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-raised p-3 text-body">
        <div><div className="text-caption text-fg-secondary mb-1">請款單號</div><div className="font-medium">{invoiceNumber}</div></div>
        <div><div className="text-caption text-fg-secondary mb-1">狀態</div><Tag color="neutral" size="sm">草稿</Tag></div>
      </div>
      <Field><FieldLabel required>收款人/廠商</FieldLabel><Input value="林間宜 (023156)" readOnly /></Field>
      <Field>
        <FieldLabel required>憑證類型</FieldLabel>
        <Select placeholder="請選擇" options={VOUCHER_TYPES} value={state.voucherType} onChange={(v) => onChange({ ...state, voucherType: v as string })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel required>日期</FieldLabel>
          <Input placeholder="填寫日期" value={state.date} onChange={(e) => onChange({ ...state, date: e.target.value })} />
        </Field>
        <Field>
          <FieldLabel>發票號碼</FieldLabel>
          <Input placeholder="填寫發票號碼" value={state.invoiceNo} onChange={(e) => onChange({ ...state, invoiceNo: e.target.value })} />
        </Field>
      </div>
      <Field>
        <FieldLabel required>幣別</FieldLabel>
        <Select options={CURRENCY_OPTIONS} value={state.currency} onChange={(v) => onChange({ ...state, currency: v as string })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel required>合計金額（未稅）</FieldLabel>
          <Input value={state.subtotal} onChange={(e) => onChange({ ...state, subtotal: e.target.value })} />
        </Field>
        <Field>
          <FieldLabel>稅額 <InfoTooltip content="稅額 = 合計金額 × 稅率" /></FieldLabel>
          <Input value={state.tax} onChange={(e) => onChange({ ...state, tax: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-raised p-3 text-body">
        <div>
          <div className="text-caption text-fg-secondary">稅後金額</div>
          <div>{state.subtotal ? String(parseFloat(state.subtotal) + parseFloat(state.tax || '0')) : '-'}</div>
          <div className="text-caption text-fg-tertiary mt-0.5">當地稅後金額 <InfoTooltip content="以匯率換算為當地幣別" /> -</div>
        </div>
        <div>
          <div className="text-caption text-fg-secondary">匯率</div>
          <div>-</div>
          <div className="text-caption text-fg-tertiary mt-0.5">更新時間 -</div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Step2Form — 填寫付款細項
// ─────────────────────────────────────────────────────────────

interface Step2State { category: string; subCategory: string; costCenter: string; accountCode: string; description: string; total: string; taxRate: string; contractNo: string }
const defaultStep2 = (): Step2State => ({ category: '', subCategory: '', costCenter: '', accountCode: '', description: '', total: '', taxRate: '5', contractNo: 'none' })

function Step2Form({ invoiceNumber, invoiceNo, seqNo, state, onChange }: {
  invoiceNumber: string; invoiceNo: string; seqNo: number; state: Step2State; onChange: (s: Step2State) => void
}) {
  const subOpts = state.category ? (CATEGORIES[state.category] ?? []).map((v) => ({ value: v, label: v })) : []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 rounded-lg bg-surface-raised p-3 text-body">
        <div><div className="text-caption text-fg-secondary mb-1">請款單號</div><div className="font-medium">{invoiceNumber}</div></div>
        <div><div className="text-caption text-fg-secondary mb-1">發票號碼</div><div>{invoiceNo || '-'}</div></div>
        <div><div className="text-caption text-fg-secondary mb-1">序號</div><div>{seqNo}</div></div>
      </div>
      <Notice variant="info">
        自 2026/12/31 起「國內出差」、「現金獎金」、「QIF」、「銀行自動扣款」已移至首頁/專區，如有需求請前往
        <span className="text-primary cursor-pointer underline">專區</span>請款。
      </Notice>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel required>分類</FieldLabel>
          <Select placeholder="請選擇" options={CATEGORY_OPTIONS} value={state.category} onChange={(v) => onChange({ ...state, category: v as string, subCategory: '' })} />
        </Field>
        <Field>
          <FieldLabel required>子分類</FieldLabel>
          <Select placeholder="請選擇" options={subOpts} value={state.subCategory} onChange={(v) => onChange({ ...state, subCategory: v as string })} disabled={!state.category} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel required>成本中心 <InfoTooltip content="請填寫所屬部門成本中心代號，例如：00690" /></FieldLabel>
          <Input value={state.costCenter} onChange={(e) => onChange({ ...state, costCenter: e.target.value })} />
        </Field>
        <Field>
          <FieldLabel>會計科目 <InfoTooltip content="請填寫對應的會計科目代號，例如：613000" /></FieldLabel>
          <Input value={state.accountCode} onChange={(e) => onChange({ ...state, accountCode: e.target.value })} />
        </Field>
      </div>
      <Field><FieldLabel>描述</FieldLabel><Input value={state.description} onChange={(e) => onChange({ ...state, description: e.target.value })} /></Field>
      <div className="grid grid-cols-3 gap-4">
        <Field>
          <FieldLabel required>總額</FieldLabel>
          <Input placeholder="填寫總額" value={state.total} onChange={(e) => onChange({ ...state, total: e.target.value })} />
        </Field>
        <Field>
          <FieldLabel>稅率 <InfoTooltip content="預設 5% 加值稅，請依實際情況選擇" /></FieldLabel>
          <Select placeholder="請選擇" options={TAX_RATES} value={state.taxRate} onChange={(v) => onChange({ ...state, taxRate: v as string })} />
        </Field>
        <Field>
          <FieldLabel>稅額</FieldLabel>
          <Input readOnly value={state.total && state.taxRate === '5' ? String(Math.round(parseFloat(state.total) * 0.05)) : ''} />
        </Field>
      </div>
      <Field>
        <FieldLabel>是否提供合約編號</FieldLabel>
        <RadioGroup value={state.contractNo} onValueChange={(v) => onChange({ ...state, contractNo: v })} orientation="horizontal">
          <RadioGroupItem value="yes" label="是" />
          <RadioGroupItem value="no" label="否" />
          <RadioGroupItem value="none" label="無需提供" />
        </RadioGroup>
      </Field>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Add/Edit Invoice Modal (3-step)
// ─────────────────────────────────────────────────────────────

interface InvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceNumber: string
  initialData?: InvoiceCard
  onComplete: (card: Partial<InvoiceCard> & { id?: string }) => void
}

function InvoiceModal({ open, onOpenChange, invoiceNumber, initialData, onComplete }: InvoiceModalProps) {
  const isEdit = !!initialData
  const [step, setStep] = useState<'step1' | 'step2' | 'step3'>('step1')
  const [s1, setS1] = useState<Step1State>(() => initialData
    ? { voucherType: initialData.voucherType, date: initialData.date, invoiceNo: initialData.invoiceNo, currency: initialData.currency, subtotal: initialData.subtotal, tax: initialData.tax }
    : defaultStep1()
  )
  const [s2, setS2] = useState<Step2State>(() => initialData?.lineItems[0]
    ? { category: initialData.lineItems[0].category, subCategory: initialData.lineItems[0].subCategory, costCenter: initialData.lineItems[0].costCenter, accountCode: initialData.lineItems[0].accountCode, description: initialData.lineItems[0].description, total: initialData.lineItems[0].total, taxRate: initialData.lineItems[0].taxRate ?? '5', contractNo: initialData.lineItems[0].contractNo ?? 'none' }
    : defaultStep2()
  )
  const [s3, setS3] = useState({ attachType: 'invoice', description: '', fileName: '' })

  const stepOrder = ['step1', 'step2', 'step3'] as const
  const idx = stepOrder.indexOf(step)

  function reset() {
    setStep('step1')
    setS1(initialData ? { voucherType: initialData.voucherType, date: initialData.date, invoiceNo: initialData.invoiceNo, currency: initialData.currency, subtotal: initialData.subtotal, tax: initialData.tax } : defaultStep1())
    setS2(initialData?.lineItems[0] ? { category: initialData.lineItems[0].category, subCategory: initialData.lineItems[0].subCategory, costCenter: initialData.lineItems[0].costCenter, accountCode: initialData.lineItems[0].accountCode, description: initialData.lineItems[0].description, total: initialData.lineItems[0].total, taxRate: initialData.lineItems[0].taxRate ?? '5', contractNo: initialData.lineItems[0].contractNo ?? 'none' } : defaultStep2())
    setS3({ attachType: 'invoice', description: '', fileName: '' })
  }

  function handleClose() { onOpenChange(false); reset() }

  function handleSubmit() {
    const voucherTypeLabel = VOUCHER_TYPES.find((v) => v.value === s1.voucherType)?.label ?? s1.voucherType
    const lineItem: LineItem = { id: initialData?.lineItems[0]?.id ?? '1', category: s2.category, subCategory: s2.subCategory, costCenter: s2.costCenter, accountCode: s2.accountCode, description: s2.description, total: s2.total, taxRate: s2.taxRate, contractNo: s2.contractNo }
    onComplete({
      id: initialData?.id,
      number: invoiceNumber, status: 'draft', payee: '林間宜 (023156)',
      date: s1.date || '2026/05/25', voucherType: s1.voucherType, voucherTypeLabel,
      invoiceNo: s1.invoiceNo, currency: s1.currency, subtotal: s1.subtotal, tax: s1.tax,
      total: parseFloat(s1.subtotal || '0') + parseFloat(s1.tax || '0'),
      lineItems: s2.category ? [lineItem] : [],
      expanded: true,
    })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent maxWidth={720} autoHeight>
        <DialogHeader><DialogTitle>{isEdit ? '編輯發票' : '新增發票'}</DialogTitle></DialogHeader>
        <DialogBody>
          <div className="pb-5">
            <Steps value={step} onValueChange={(v) => setStep(v as typeof step)} completedValues={stepOrder.slice(0, idx) as string[]} orientation="horizontal" size="sm">
              <StepItem value="step1"><StepLabel>填寫請款資訊</StepLabel></StepItem>
              <StepItem value="step2"><StepLabel>填寫付款細項</StepLabel></StepItem>
              <StepItem value="step3"><StepLabel>檢附憑證/證明</StepLabel></StepItem>
            </Steps>
          </div>
          {step === 'step1' && <Step1Form invoiceNumber={invoiceNumber} state={s1} onChange={setS1} />}
          {step === 'step2' && <Step2Form invoiceNumber={invoiceNumber} invoiceNo={s1.invoiceNo} seqNo={1} state={s2} onChange={setS2} />}
          {step === 'step3' && (
            <div className="space-y-4">
              <Field>
                <FieldLabel required>附件類型</FieldLabel>
                <RadioGroup value={s3.attachType} onValueChange={(v) => setS3((p) => ({ ...p, attachType: v }))} orientation="horizontal">
                  <RadioGroupItem value="invoice" label="發票" />
                  <RadioGroupItem value="support" label="輔助文件" />
                </RadioGroup>
              </Field>
              <Field>
                <FieldLabel>附件說明</FieldLabel>
                <Input placeholder="填寫附件說明" value={s3.description} onChange={(e) => setS3((p) => ({ ...p, description: e.target.value }))} />
              </Field>
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-divider bg-surface-subtle p-10 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setS3((p) => ({ ...p, fileName: p.attachType === 'invoice' ? 'Computer-invoice.png' : 'Supportdoc.png' }))}
              >
                {s3.fileName ? (
                  <div className="flex items-center gap-2 text-primary"><Paperclip size={20} /><span className="text-body">{s3.fileName}</span></div>
                ) : (
                  <>
                    <div className="rounded-lg bg-surface-raised p-3"><Upload size={24} className="text-fg-secondary" /></div>
                    <span className="text-body-lg font-medium">點擊或拖曳到此上傳檔案</span>
                    <span className="text-caption text-fg-secondary">每個檔案大小不得超過 20 MB</span>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <div>{idx > 0 && <Button variant="ghost" size="md" onClick={() => setStep(stepOrder[idx - 1])}>上一步</Button>}</div>
            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={handleClose}>取消</Button>
              {idx < 2
                ? <Button variant="primary" size="md" onClick={() => setStep(stepOrder[idx + 1])}>下一步</Button>
                : <Button variant="primary" size="md" onClick={handleSubmit}>{isEdit ? '儲存' : '新增'}</Button>
              }
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
// Line Item Modal — 新增/編輯付款細項 (single step)
// ─────────────────────────────────────────────────────────────

interface LineItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceNumber: string
  invoiceNo: string
  seqNo: number
  initialData?: LineItem
  onComplete: (li: LineItem) => void
}

function LineItemModal({ open, onOpenChange, invoiceNumber, invoiceNo, seqNo, initialData, onComplete }: LineItemModalProps) {
  const isEdit = !!initialData
  const [state, setState] = useState<Step2State>(() => initialData
    ? { category: initialData.category, subCategory: initialData.subCategory, costCenter: initialData.costCenter, accountCode: initialData.accountCode, description: initialData.description, total: initialData.total, taxRate: initialData.taxRate ?? '5', contractNo: initialData.contractNo ?? 'none' }
    : defaultStep2()
  )

  function handleClose() { onOpenChange(false); if (!initialData) setState(defaultStep2()) }

  function handleSave() {
    onComplete({ id: initialData?.id ?? Date.now().toString(), category: state.category, subCategory: state.subCategory, costCenter: state.costCenter, accountCode: state.accountCode, description: state.description, total: state.total, taxRate: state.taxRate, contractNo: state.contractNo })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent maxWidth={720} autoHeight>
        <DialogHeader><DialogTitle>{isEdit ? '編輯付款細項' : '新增付款細項'}</DialogTitle></DialogHeader>
        <DialogBody>
          <Step2Form invoiceNumber={invoiceNumber} invoiceNo={invoiceNo} seqNo={seqNo} state={state} onChange={setState} />
        </DialogBody>
        <DialogFooter>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={handleClose}>取消</Button>
            <Button variant="primary" size="md" onClick={handleSave}>{isEdit ? '儲存' : '新增'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
// Add Standalone Attachment Modal
// ─────────────────────────────────────────────────────────────

function AddAttachmentModal({ open, onOpenChange, onComplete }: { open: boolean; onOpenChange: (v: boolean) => void; onComplete: (a: AttachmentItem) => void }) {
  const [attachType, setAttachType] = useState('invoice')
  const [description, setDescription] = useState('')
  const [fileName, setFileName] = useState('')

  function handleClose() { onOpenChange(false); setAttachType('invoice'); setDescription(''); setFileName('') }
  function handleAdd() {
    onComplete({ id: Date.now().toString(), type: attachType === 'invoice' ? '電腦發票' : '證明文件', description, fileName: fileName || 'Supportdoc.png' })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent maxWidth={720} autoHeight>
        <DialogHeader><DialogTitle>新增附件</DialogTitle></DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <Field>
              <FieldLabel required>附件類型</FieldLabel>
              <RadioGroup value={attachType} onValueChange={setAttachType} orientation="horizontal">
                <RadioGroupItem value="invoice" label="發票" />
                <RadioGroupItem value="support" label="輔助文件" />
              </RadioGroup>
            </Field>
            <Field>
              <FieldLabel>附件說明</FieldLabel>
              <Input placeholder="填寫附件說明" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-divider bg-surface-subtle p-10 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setFileName(attachType === 'invoice' ? 'Computer-invoice.png' : 'Supportdoc.png')}
            >
              {fileName ? (
                <div className="flex items-center gap-2 text-primary"><Paperclip size={20} /><span className="text-body">{fileName}</span></div>
              ) : (
                <>
                  <div className="rounded-lg bg-surface-raised p-3"><Upload size={24} className="text-fg-secondary" /></div>
                  <span className="text-body-lg font-medium">點擊或拖曳到此上傳檔案</span>
                  <span className="text-caption text-fg-secondary">每個檔案大小不得超過 20 MB</span>
                </>
              )}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={handleClose}>取消</Button>
            <Button variant="primary" size="md" onClick={handleAdd}>新增</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
// Preview Modal
// ─────────────────────────────────────────────────────────────

function PreviewModal({ open, onOpenChange, invoices, attachments, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; invoices: InvoiceCard[]; attachments: AttachmentItem[]; onSubmit: () => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ basic: false, invoices: false, attachments: false, approval: true })
  const [comment, setComment] = useState('')
  const total = invoices.reduce((sum, inv) => sum + inv.total, 0)
  function toggle(k: string) { setExpanded((s) => ({ ...s, [k]: !s[k] })) }

  const SectionHeader = ({ label, sectionKey }: { label: string; sectionKey: string }) => (
    <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => toggle(sectionKey)}>
      <span className="text-body-lg font-semibold">{label}</span>
      <div className="flex items-center gap-1.5 text-body text-fg-secondary">
        {expanded[sectionKey] ? <>收合資訊 <ChevronUp size={16} /></> : <>更多資訊 <ChevronDown size={16} /></>}
      </div>
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth={960} autoHeight>
        <DialogHeader><DialogTitle>申請單預覽</DialogTitle></DialogHeader>
        <DialogBody>
          <div className="space-y-3">
            <div className="rounded-lg border border-divider">
              <SectionHeader label="基本資訊" sectionKey="basic" />
              {expanded.basic && (
                <div className="border-t border-divider px-4 py-3">
                  <div className="grid grid-cols-3 gap-4 text-body">
                    <div><div className="text-caption text-fg-secondary">公司代號</div><div>TA01</div></div>
                    <div><div className="text-caption text-fg-secondary">申請人</div><div>林間宜 (023156)</div></div>
                    <div><div className="text-caption text-fg-secondary">收款對象</div><div>員工</div></div>
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-divider">
              <SectionHeader label="請款資訊" sectionKey="invoices" />
              {expanded.invoices && (
                <div className="border-t border-divider px-4 py-3 space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="rounded-lg border border-divider p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-body font-medium">{inv.number}</span>
                        <span className="text-body font-medium">{inv.currency} {inv.total.toLocaleString()}</span>
                      </div>
                      <div className="text-caption text-fg-secondary mt-1">{inv.voucherTypeLabel} | {inv.date}</div>
                    </div>
                  ))}
                  <div className="text-body-lg font-semibold text-right pt-1">合計：TWD {total.toLocaleString()}</div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-divider">
              <SectionHeader label="憑證附件資訊" sectionKey="attachments" />
              {expanded.attachments && (
                <div className="border-t border-divider px-4 py-3">
                  {attachments.length === 0 ? <span className="text-body text-fg-secondary">尚未上傳附件</span> : (
                    <div className="divide-y divide-divider">
                      {attachments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between py-2">
                          <span className="text-body">{a.type}</span>
                          <span className="text-body text-primary">{a.fileName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-divider">
              <div className="flex items-center justify-between px-4 py-3">
                <button className="flex flex-1 items-center justify-between text-left" onClick={() => toggle('approval')}>
                  <span className="text-body-lg font-semibold">審核流程</span>
                  <div className="flex items-center gap-1.5 text-body text-fg-secondary">
                    {expanded.approval ? <>收合資訊 <ChevronUp size={16} /></> : <>展開資訊 <ChevronDown size={16} /></>}
                  </div>
                </button>
              </div>
              {expanded.approval && (
                <div className="border-t border-divider px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-body text-fg-secondary">您可以依照需求新增審核人員。</p>
                    <Button variant="secondary" size="sm" startIcon={Plus}>新增審核人員</Button>
                  </div>
                  <table className="w-full text-body">
                    <thead>
                      <tr className="border-b border-divider text-caption text-fg-secondary">
                        {['流程角色', '任務擁有者', '指派', '執行人員', '動作', '評論', '更新日期', ''].map((h) => (
                          <th key={h} className="pb-2 text-left font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {[
                        { role: '申請人', owner: '150986 陳文憶', date: '2025/7/10', canDelete: false },
                        { role: '主管', owner: '109964 洪挺鈞', date: '2025/7/12', canDelete: true },
                        { role: '會計', owner: '060069 黃蓉芬', date: '2025/7/16', canDelete: false },
                      ].map((row) => (
                        <tr key={row.role}>
                          <td className="py-2">{row.role}</td><td className="py-2">{row.owner}</td>
                          <td className="py-2 text-fg-tertiary">-</td><td className="py-2 text-fg-tertiary">-</td>
                          <td className="py-2 text-fg-tertiary">-</td><td className="py-2 text-fg-tertiary">-</td>
                          <td className="py-2">{row.date}</td>
                          <td className="py-2">{row.canDelete && <Button variant="ghost" size="sm" startIcon={Trash2} iconOnly aria-label="刪除" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-divider p-4 space-y-2">
              <div className="text-body-lg font-semibold">簽核補充說明</div>
              <p className="text-body text-fg-secondary">您可以填寫簽核補充說明，協助下一階段簽核人員快速完成審核</p>
              <Textarea placeholder="請填寫補充說明" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" size="md" onClick={() => onOpenChange(false)}>上一步</Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={() => onOpenChange(false)}>取消</Button>
              <Button variant="primary" size="md" onClick={onSubmit}>送出</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
// Invoice Card Row
// ─────────────────────────────────────────────────────────────

interface InvoiceCardRowProps {
  card: InvoiceCard
  onToggle: () => void
  onDelete: () => void
  onEdit: () => void
  onAddLineItem: () => void
  onEditLineItem: (li: LineItem) => void
  onDeleteLineItem: (liId: string) => void
}

function InvoiceCardRow({ card, onToggle, onDelete, onEdit, onAddLineItem, onEditLineItem, onDeleteLineItem }: InvoiceCardRowProps) {
  const s = STATUS_META[card.status]
  return (
    <div className="rounded-lg border border-divider">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onToggle} className="text-fg-secondary hover:text-fg-primary transition-colors shrink-0">
            {card.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <span className="text-body font-medium">{card.number}</span>
          <Tag color={s.color} size="sm">{s.label}</Tag>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-body font-medium">{card.currency} {card.total.toLocaleString()}</span>
          <Button variant="ghost" size="sm" startIcon={Pencil} iconOnly aria-label="編輯" onClick={onEdit} />
          <Button variant="ghost" size="sm" startIcon={Copy} iconOnly aria-label="複製" />
          <Button variant="ghost" size="sm" startIcon={Trash2} iconOnly aria-label="刪除" onClick={onDelete} />
        </div>
      </div>
      <div className="text-caption text-fg-secondary px-4 pb-2">收款人：{card.payee} ｜ 日期：{card.date}</div>
      {card.expanded && (
        <div className="border-t border-divider px-4 py-3 space-y-3">
          <div className="grid grid-cols-4 gap-4 text-body">
            <div><div className="text-caption text-fg-secondary">憑證類型</div><div className="truncate">{card.voucherTypeLabel || '-'}</div></div>
            <div><div className="text-caption text-fg-secondary">發票號碼</div><div>{card.invoiceNo || '-'}</div></div>
            <div><div className="text-caption text-fg-secondary">合計金額（未稅）</div><div>{card.subtotal ? `${card.currency} ${card.subtotal}` : '-'}</div></div>
            <div><div className="text-caption text-fg-secondary">稅額</div><div>{card.tax || '0'}</div></div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-body font-medium">付款細項：{card.lineItems.length} 項</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" startIcon={Download}>批次匯入</Button>
              <Button variant="secondary" size="sm" startIcon={Plus} onClick={onAddLineItem}>新增細項</Button>
            </div>
          </div>
          {card.lineItems.length > 0 && (
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-divider text-caption text-fg-secondary">
                  {['序號', '分類', '子分類', '成本中心', '會計科目', '描述', ''].map((h) => (
                    <th key={h} className="pb-2 text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {card.lineItems.map((li, i) => (
                  <tr key={li.id}>
                    <td className="py-2">{i + 1}</td>
                    <td className="py-2 max-w-[130px]"><div className="truncate" title={li.category}>{li.category}</div></td>
                    <td className="py-2 max-w-[150px]"><div className="truncate" title={li.subCategory}>{li.subCategory}</div></td>
                    <td className="py-2">{li.costCenter || '-'}</td>
                    <td className="py-2">{li.accountCode || '-'}</td>
                    <td className="py-2">{li.description || '-'}</td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" startIcon={Pencil} iconOnly aria-label="編輯" onClick={() => onEditLineItem(li)} />
                        <Button variant="ghost" size="sm" startIcon={Trash2} iconOnly aria-label="刪除" onClick={() => onDeleteLineItem(li.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Create Form Page
// ─────────────────────────────────────────────────────────────

function CreateFormPage({ formId, onBack }: { formId: string; onBack: () => void }) {
  const [invoices, setInvoices] = useState<InvoiceCard[]>([])
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [reason, setReason] = useState('')
  const [urgentPayment, setUrgentPayment] = useState(false)
  const [urgentDate, setUrgentDate] = useState('')

  // Modal state
  const [invoiceModal, setInvoiceModal] = useState<{ open: boolean; editTarget?: InvoiceCard }>({ open: false })
  const [lineItemModal, setLineItemModal] = useState<{ open: boolean; invoiceId: string; editTarget?: LineItem }>({ open: false, invoiceId: '' })
  const [showAddAttachment, setShowAddAttachment] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const nextInvoiceNumber = `${formId}-${invoices.length + 1}`

  // Invoice CRUD
  function handleInvoiceComplete(data: Partial<InvoiceCard> & { id?: string }) {
    if (data.id) {
      setInvoices((prev) => prev.map((inv) => inv.id === data.id ? { ...inv, ...data } as InvoiceCard : inv))
    } else {
      setInvoices((prev) => [...prev, { ...data, id: Date.now().toString() } as InvoiceCard])
    }
  }

  // Line item CRUD within an invoice
  function handleLineItemComplete(invoiceId: string, li: LineItem) {
    setInvoices((prev) => prev.map((inv) => {
      if (inv.id !== invoiceId) return inv
      const exists = inv.lineItems.find((x) => x.id === li.id)
      return { ...inv, lineItems: exists ? inv.lineItems.map((x) => x.id === li.id ? li : x) : [...inv.lineItems, li] }
    }))
  }

  function handleSubmit() {
    setShowPreview(false)
    toast({ variant: 'success', title: `${formId} 送出成功` })
    onBack()
  }

  const isFilled = invoices.length > 0
  const editingInvoice = invoiceModal.editTarget
  const lineItemInvoice = invoices.find((inv) => inv.id === lineItemModal.invoiceId)

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Chrome header */}
        <div className="flex items-center justify-between h-[var(--chrome-header-height)] px-6 border-b border-divider bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={onBack} className="cursor-pointer hover:underline">暫存申請單</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem><BreadcrumbPage>一般項目申請單</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button variant="secondary" size="md" startIcon={Upload}>批次匯入申請</Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto bg-surface-subtle">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
            <h1 className="text-h4 font-semibold">一般項目申請單 {formId}</h1>

            {/* 基本資訊 */}
            <div className="rounded-xl border border-divider bg-surface p-6 space-y-4">
              <h2 className="text-body-lg font-semibold">基本資訊</h2>
              <Field>
                <FieldLabel>公司代號 <InfoTooltip content="請選擇您所屬的公司代號" /></FieldLabel>
                <Select options={[{ value: 'TA01', label: 'TA01' }]} value="TA01" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel required>申請人 <InfoTooltip content="申請人為目前登入的員工，無法修改" /></FieldLabel>
                  <Input value="林間宜 (023156)" readOnly />
                </Field>
                <Field>
                  <FieldLabel required>收款對象 <InfoTooltip content="請選擇本次請款的收款對象類型" /></FieldLabel>
                  <Select options={PAYEE_OPTIONS} defaultValue="employee" />
                </Field>
              </div>
            </div>

            {/* 請款資訊 */}
            <div className="rounded-xl border border-divider bg-surface p-6 space-y-4">
              <h2 className="text-body-lg font-semibold">請款資訊</h2>
              <Button variant="secondary" size="md" startIcon={Plus} onClick={() => setInvoiceModal({ open: true })}>新增請款</Button>
              {invoices.length === 0 ? (
                <div className="rounded-lg border border-dashed border-divider py-12 text-center text-body text-fg-tertiary">沒有任何資料</div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv) => (
                    <InvoiceCardRow
                      key={inv.id}
                      card={inv}
                      onToggle={() => setInvoices((prev) => prev.map((x) => x.id === inv.id ? { ...x, expanded: !x.expanded } : x))}
                      onDelete={() => setInvoices((prev) => prev.filter((x) => x.id !== inv.id))}
                      onEdit={() => setInvoiceModal({ open: true, editTarget: inv })}
                      onAddLineItem={() => setLineItemModal({ open: true, invoiceId: inv.id })}
                      onEditLineItem={(li) => setLineItemModal({ open: true, invoiceId: inv.id, editTarget: li })}
                      onDeleteLineItem={(liId) => setInvoices((prev) => prev.map((x) => x.id === inv.id ? { ...x, lineItems: x.lineItems.filter((l) => l.id !== liId) } : x))}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 檢附憑證 / 證明 */}
            <div className="rounded-xl border border-divider bg-surface p-6 space-y-4">
              <h2 className="text-body-lg font-semibold">檢附憑證 / 證明</h2>
              <Button variant="secondary" size="md" startIcon={Plus} onClick={() => setShowAddAttachment(true)}>新增附件</Button>
              {attachments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-divider py-12 text-center text-body text-fg-tertiary">沒有任何資料</div>
              ) : (
                <table className="w-full text-body">
                  <thead>
                    <tr className="border-b border-divider text-caption text-fg-secondary">
                      {['類型', '描述', '附件', ''].map((h) => <th key={h} className="pb-2 text-left font-normal">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {attachments.map((a) => (
                      <tr key={a.id}>
                        <td className="py-2">{a.type}</td>
                        <td className="py-2 text-fg-secondary">{a.description || '-'}</td>
                        <td className="py-2 text-primary">{a.fileName}</td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" startIcon={Pencil} iconOnly aria-label="編輯" />
                            <Button variant="ghost" size="sm" startIcon={Trash2} iconOnly aria-label="刪除" onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 補充資訊 */}
            <div className="rounded-xl border border-divider bg-surface p-6">
              <Field>
                <FieldLabel required>
                  申請原因
                  <InfoTooltip content="1. 跨組織舉辦之研討會宣導活動-贈送禮品禮券 / 聘請外部講師或是機構 / 用品及其他費用，請填寫參與單位，並於附件提供海報。&#10;2. 形象廣告費-國內 / 國際，請於附件提供企業公共關係處 (PR) 核准的信件" />
                </FieldLabel>
                <Textarea placeholder="填寫申請原因，最多 250 字" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={250} />
              </Field>
            </div>

            {/* 注意事項 */}
            <Notice variant="info">
              <div className="font-medium mb-1">注意事項</div>
              <div>預計付款日為申請單簽核完畢後的下個月一般付款日 (每月最後工作日)，若有緊急付款需求，請參考下列簽核層級：</div>
              <ul className="mt-1 space-y-0.5 list-disc pl-4">
                <li>一般付款日：100,000 TWD 以下簽核至處長，以上簽核至副總</li>
                <li>特殊付款日：一律簽核至副總</li>
              </ul>
            </Notice>

            {/* 緊急付款 */}
            <div className="rounded-xl border border-divider bg-surface p-6 space-y-3">
              <Checkbox checked={urgentPayment} onCheckedChange={(v) => setUrgentPayment(v === true)} label="使用緊急/指定付款" />
              {urgentPayment && (
                <Field>
                  <FieldLabel>緊急/指定付款日</FieldLabel>
                  <Input placeholder="請選擇" value={urgentDate} onChange={(e) => setUrgentDate(e.target.value)} className="max-w-xs" />
                </Field>
              )}
            </div>
            <div className="h-16" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-divider bg-surface">
          <Button variant="danger-outline" size="md" onClick={onBack}>取消申請</Button>
          <Button variant="secondary" size="md">存成草稿</Button>
          {isFilled
            ? <Button variant="primary" size="md" onClick={() => setShowPreview(true)}>送出預覽</Button>
            : <Button variant="primary" size="md">下一步</Button>
          }
        </div>
      </div>

      {/* Modals */}
      <InvoiceModal
        open={invoiceModal.open}
        onOpenChange={(o) => setInvoiceModal((s) => ({ ...s, open: o }))}
        invoiceNumber={editingInvoice ? editingInvoice.number : nextInvoiceNumber}
        initialData={editingInvoice}
        onComplete={handleInvoiceComplete}
      />
      <LineItemModal
        open={lineItemModal.open}
        onOpenChange={(o) => setLineItemModal((s) => ({ ...s, open: o }))}
        invoiceNumber={lineItemInvoice?.number ?? ''}
        invoiceNo={lineItemInvoice?.invoiceNo ?? ''}
        seqNo={(lineItemInvoice?.lineItems.length ?? 0) + (lineItemModal.editTarget ? 0 : 1)}
        initialData={lineItemModal.editTarget}
        onComplete={(li) => handleLineItemComplete(lineItemModal.invoiceId, li)}
      />
      <AddAttachmentModal
        open={showAddAttachment}
        onOpenChange={setShowAddAttachment}
        onComplete={(a) => setAttachments((prev) => [...prev, a])}
      />
      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        invoices={invoices}
        attachments={attachments}
        onSubmit={handleSubmit}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// Draft List Page
// ─────────────────────────────────────────────────────────────

const INITIAL_DRAFTS: DraftEntry[] = [
  { id: 'PAE20260525001', date: '2026/5/29', company: 'TA01', applicant: '林間宜 (023156)', payee: '員工', total: 1600, urgentDate: '-', reason: '-', status: 'reviewing' },
  { id: 'PAE20260525002', date: '2026/5/28', company: 'TA01', applicant: '林間宜 (023156)', payee: '員工', total: 2400, urgentDate: '-', reason: '-', status: 'draft' },
  { id: 'PAE20260525003', date: '2026/5/27', company: 'TA01', applicant: '林間宜 (023156)', payee: '員工', total: 3800, urgentDate: '-', reason: '-', status: 'draft' },
]

function DraftListPage({ onCreateNew, onOpenForm }: { onCreateNew: () => void; onOpenForm: (id: string) => void }) {
  const [drafts, setDrafts] = useState<DraftEntry[]>(INITIAL_DRAFTS)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-[var(--chrome-header-height)] px-6 border-b border-divider bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-body-lg font-medium">暫存申請單</h1>
        </div>
        <Button variant="secondary" size="md" startIcon={Upload}>批次匯入申請</Button>
      </div>
      <div className="flex-1 overflow-auto px-6 py-4 bg-surface-subtle">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">一般</TabsTrigger>
            <TabsTrigger value="bonus">現金獎金</TabsTrigger>
            <TabsTrigger value="travel">國內差旅</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-body-lg font-semibold">一般暫存申請</h2>
                <div className="flex gap-2">
                  <Button variant="primary" size="md" startIcon={Plus} onClick={onCreateNew}>新增</Button>
                  <Button variant="secondary" size="md" startIcon={Download}>下載 Excel 範本</Button>
                </div>
              </div>
              <div className="rounded-xl border border-divider bg-surface overflow-hidden">
                <table className="w-full text-body">
                  <thead>
                    <tr className="bg-surface-subtle text-caption text-fg-secondary border-b border-divider">
                      {['單號', '申請日期', '公司代號', '申請人', '收款對象', '總額', '緊急/指定付款日期', '申請原因', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {drafts.map((d) => {
                      const s = STATUS_META[d.status]
                      return (
                        <tr key={d.id} className="hover:bg-surface-subtle transition-colors">
                          <td className="px-4 py-3">
                            <button className="text-primary hover:underline font-medium block" onClick={() => onOpenForm(d.id)}>{d.id}</button>
                            <Tag color={s.color} size="sm">{s.label}</Tag>
                          </td>
                          <td className="px-4 py-3">{d.date}</td>
                          <td className="px-4 py-3">{d.company}</td>
                          <td className="px-4 py-3">{d.applicant}</td>
                          <td className="px-4 py-3">{d.payee}</td>
                          <td className="px-4 py-3">{d.total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-fg-tertiary">{d.urgentDate}</td>
                          <td className="px-4 py-3 text-fg-tertiary">{d.reason}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" startIcon={Info} iconOnly aria-label="詳情" />
                              <Button variant="ghost" size="sm" startIcon={Pencil} iconOnly aria-label="編輯" onClick={() => onOpenForm(d.id)} />
                              <Button variant="ghost" size="sm" startIcon={Trash2} iconOnly aria-label="刪除" onClick={() => setDrafts((prev) => prev.filter((x) => x.id !== d.id))} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="bonus">
            <div className="mt-4 rounded-xl border border-divider bg-surface py-16 text-center text-body text-fg-tertiary">現金獎金申請請至專區請款</div>
          </TabsContent>
          <TabsContent value="travel">
            <div className="mt-4 rounded-xl border border-divider bg-surface py-16 text-center text-body text-fg-tertiary">國內差旅申請請至差旅專區</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// App Root
// ─────────────────────────────────────────────────────────────

type AppView = { page: 'list' } | { page: 'form'; formId: string }

export default function App() {
  const [activeNav, setActiveNav] = useState('drafts')
  const [view, setView] = useState<AppView>({ page: 'list' })
  const nextId = `PAE2026052500${INITIAL_DRAFTS.length + 1}`

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <SidebarProvider activeId={activeNav} onActiveChange={setActiveNav}>
        <AppShell
          layout="primary-sidebar"
          sidebar={<AppSidebar activeId={activeNav} onActiveChange={setActiveNav} />}
        >
          {view.page === 'list' ? (
            <DraftListPage
              onCreateNew={() => setView({ page: 'form', formId: nextId })}
              onOpenForm={(id) => setView({ page: 'form', formId: id })}
            />
          ) : (
            <CreateFormPage formId={view.formId} onBack={() => setView({ page: 'list' })} />
          )}
        </AppShell>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  )
}
