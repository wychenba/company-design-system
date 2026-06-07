import { useState } from 'react'
import {
  AppShell, SidebarProvider, Sidebar, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
  Avatar, ItemAvatar, Button,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle,
  Input, Select, Textarea, Checkbox, DatePicker,
  RadioGroup, RadioGroupItem,
  Field, FieldLabel,
  Tag, Alert,
  Toaster, toast,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Steps, StepItem, StepLabel,
  DescriptionList, DescriptionItem,
  FileUpload,
  type FileUploadStatus,
} from '@qijenchen/design-system'
import {
  Home, FileText, Upload, ClipboardList, Users, BookOpen,
  MessageSquare, Plus, Pencil, Trash2, Download,
  Info, ChevronDown, Copy, Paperclip,
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────

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

const CATEGORY_OPTIONS = Object.keys(CATEGORIES).map(k => ({ value: k, label: k }))

// Category → SubCategory → ACCT code (per Figma node 24:13865)
const ACCT_MAPPING: Record<string, Record<string, string>> = {
  '維修及購買零配件': {
    '純工/連工帶料(檢測、校正、加工...等)': '613009',
    '純料(螺絲、O-ring等)': '613013',
    '公共設施/辦公室/其他非Fab區域': '618010',
    '維修電腦及其週邊': '618010',
  },
  '小型工具/物品、電腦/手機週邊、辦公家具': {
    '小型工具/物品(把手/推車/護具/螺絲起子...等)': '618002',
    '電腦/手機週邊': '618002',
    '辦公家俱(台子/桌椅/隔板...等)': '618001',
  },
  '文具用品、印刷、書報雜誌/資料庫、軟體、郵快遞費': {
    '標準化軟體(非雲端服務/無雙方互動，如：adobe、字體、輸入法...等)': '618007',
    '客製化軟體、線上互動軟體(Kahoot/Canva...等)、雲端服務(AI、API...等)': '618008',
    '公用書籍、報章雜誌、電子報、線上資料庫': '660002',
    '郵快遞費(如:郵局、ups、快遞等)': '660002',
    '印刷(海報/獎狀/貼紙...等)': '660001',
    '複印': '660002',
    '文具用品(紙/筆/資料夾...等)': '660002',
  },
  '外部研討會/跨組織舉辦之研討會、宣導活動': {
    '跨組織舉辦之研討會、宣導活動-餐飲費用': '655540',
    '跨組織舉辦之研討會、宣導活動-贈送禮品禮券': '655540',
    '跨組織舉辦之研討會、宣導活動-聘請外部講師或是機構': '655540',
    '跨組織舉辦之研討會、宣導活動-用品及其他費用': '655540',
    '參與台灣境內研討會-旅費': '655530',
    '參與台灣境內研討會-報名費': '655520',
    '參與台灣境外研討會-旅費': '655531',
    '參與台灣境外研討會-報名費': '655521',
  },
  '訓練/招募/JDP/國內JOS': {
    '訓練費-各部門外部訓練費': '655541',
    '訓練費-人力資訓練費-人力資源舉辦-外部學習平台/工具資源舉辦-台積學習平台': '655505',
    '訓練費-人力資源舉辦-交通費': '655502',
    '訓練費-人力資源-餐飲費用': '655509',
    '訓練費-人力資源-禮品/禮券': '655509',
    '訓練費-人力資源-道具及其他用品': '655509',
    '訓練費-人力資源舉辦-報名費/語言及進修補助費': '655501',
    '國內招募_餐飲費用': '654000',
    '國內招募_禮品禮券': '654000',
    '國內招募_用品及其他': '654000',
    '國外招募_餐飲費用': '654000',
    '國外招募_禮品禮券': '654010',
    '國外招募_用品及其他': '654000',
    'JDP大專院校合作專案': '630120',
    'JDP-技術研發': '654200',
    '潛在未來人才培育': '655551',
    '專案訓練費': '655503',
    '考取證照費': '654100',
    'JOS子女就學補助': '654100',
    'JOS搬遷費': '654100',
  },
  '晶片光罩等運費/機儀器搬遷/辦公室搬遷': {
    '非機儀器之搬遷或重新裝潢': '660000',
    '運費(如:晶片車、handcarry車資等)': '660000',
    '機儀器遷移安裝': '660000',
  },
  '雜支/拜拜/辦公布置': {
    '雜支/拜拜(餐飲費用)/辦公布置等其他用品': '664900',
    '聘請外部個人與機關團體': '664900',
    '香油錢': '664900',
    '禮品禮券': '664900',
  },
  '廣告費': {
    '促銷廣告費': '641000',
    '形象廣告費-國內': '641000',
    '形象廣告費-國際': '641001',
  },
  'Legal專用': {
    '律師費(216631)-國外事務所且在境外執行業務': '216631',
    '律師費(216631)-國內事務所及其他': '216631',
    '專利費用-國外事務所且在境外執行業務': '216635',
    '專利費用-國內事務所及其他': '216635',
    'Patent License': '312000',
  },
  '健康中心/ERG@tsmc等員工關懷': {
    '醫療器材、救護車...等非勞務費用': '655900',
    '餐飲費用': '655900',
    '禮品禮物': '655900',
    '非醫療用品與其他': '655900',
  },
  '專業費用專區': {
    '會計師費': '663200',
    '應計會計師費': '216632',
    '顧問費-一般': '663001',
    '顧問費-學術合作': '663001',
  },
}
const TAX_RATES = [{ value: '5', label: '5%' }, { value: '0', label: '0%' }, { value: 'exempt', label: '免稅' }]
const CURRENCY_OPTIONS = [
  'TWD', 'USD', 'JPY', 'EUR', 'HKD', 'SGD', 'GBP', 'CHF', 'MYR', 'AUD', 'SEK', 'CAD', 'KRW', 'NOK', 'RMB',
].map(c => ({ value: c, label: c }))
const PAYEE_OPTIONS = [{ value: '員工', label: '員工' }, { value: '廠商', label: '廠商' }]

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

// ─── Types ───────────────────────────────────────────────────

interface DraftEntry {
  id: string
  number: string
  date: string
  company: string
  applicant: string
  payee: string
  total: number
  urgentDate: string
  reason: string
  status: StatusKey
}

interface Invoice {
  id: string
  number: string
  payee: string
  date: string
  invoiceNo: string
  currency: string
  subtotal: string
  tax: string
}

interface Attachment {
  id: string
  type: 'invoice' | 'auxiliary'
  desc: string
  files: Array<{ id: string; name: string }>
}

interface Step1State {
  payee: string
  voucherType: string
  date: string
  invoiceNo: string
  currency: string
  subtotal: string
  tax: string
  taxId: string
  incomeType: string
  exemptAmount: string
  withholdingAmount: string
  usePartialAmount: boolean
}

interface Step2State {
  category: string
  subCategory: string
  costCenter: string
  accountCode: string
  description: string
  total: string
  taxRate: string
  contractProvided: 'yes' | 'no' | 'not-required'
  noContractReason: string
}

interface Step3State {
  attachmentType: 'invoice' | 'auxiliary'
  attachmentDesc: string
}

// ─── Initial data ────────────────────────────────────────────

const INITIAL_ENTRIES: DraftEntry[] = [
  { id: '1', number: 'PAE20260525001', date: '2026/5/29', company: 'TA01', applicant: '林間宜 (023156)', payee: '員工', total: 1600, urgentDate: '-', reason: '-', status: 'reviewing' },
  { id: '2', number: 'PAE20260525002', date: '2026/5/28', company: 'TA01', applicant: '林間宜 (023156)', payee: '員工', total: 2400, urgentDate: '-', reason: '-', status: 'draft' },
  { id: '3', number: 'PAE20260525003', date: '2026/5/27', company: 'TA01', applicant: '林間宜 (023156)', payee: '員工', total: 3800, urgentDate: '-', reason: '-', status: 'draft' },
]

// ─── InfoTooltip ─────────────────────────────────────────────

function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="inline-flex items-center justify-center text-fg-tertiary hover:text-fg-secondary transition-colors"
          aria-label="說明"
        >
          <Info size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">{content}</TooltipContent>
    </Tooltip>
  )
}

// ─── Sidebar nav ──────────────────────────────────────────────

const WORK_NAV = [
  { id: 'drafts', label: '暫存申請單', icon: FileText },
  { id: 'bulk', label: '批次匯入紀錄', icon: Upload },
  { id: 'tasks', label: '我的工作清單', icon: ClipboardList },
] as const

const MGMT_NAV = [
  { id: 'view', label: '查看申請單', icon: BookOpen },
  { id: 'review', label: '審核工作清單', icon: Users },
  { id: 'secretary', label: '秘書工作清單', icon: ClipboardList },
  { id: 'survey', label: '使用者體驗調查', icon: MessageSquare },
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
                  <SidebarMenuButton id={id} startIcon={icon} tooltip={label} data-active={activeId === id ? true : undefined} onClick={() => onActiveChange(id)}>{label}</SidebarMenuButton>
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

// ─── Step labels ─────────────────────────────────────────────

const STEP_LABELS = ['填寫請款資訊', '填寫付款細項', '檢附憑證/證明'] as const

// ─── Default form state ──────────────────────────────────────

const defaultStep1 = (): Step1State => ({
  payee: '林間宜 (023156)',
  voucherType: '',
  date: '',
  invoiceNo: '',
  currency: 'TWD',
  subtotal: '',
  tax: '',
  taxId: '',
  incomeType: '',
  exemptAmount: '',
  withholdingAmount: '',
  usePartialAmount: false,
})

const defaultStep2 = (): Step2State => ({
  category: '',
  subCategory: '',
  costCenter: '25B00',
  accountCode: '',
  description: '',
  total: '',
  taxRate: '',
  contractProvided: 'not-required',
  noContractReason: '',
})

// ─── AddInvoiceModal (3-step) ─────────────────────────────────

function AddInvoiceModal({
  open,
  onClose,
  onSubmit,
  payee: parentPayee = '員工',
}: {
  open: boolean
  onClose: () => void
  onSubmit: (invoice: Invoice) => void
  payee?: string
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [s1, setS1] = useState<Step1State>(defaultStep1)
  const [s2, setS2] = useState<Step2State>(defaultStep2)
  const [autoFilled, setAutoFilled] = useState(false)
  const [rateUpdateTime, setRateUpdateTime] = useState('')
  const [contractNums, setContractNums] = useState<string[]>([''])
  const [uploadFiles, setUploadFiles] = useState<FileUploadStatus[]>([])

  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const invoiceNumber = `PAGE${today.getFullYear()}${mm}${dd}001-1`

  const today2 = new Date()
  const RATE_UPDATE_DATE = `${today2.getFullYear()}/${String(today2.getMonth()+1).padStart(2,'0')}/${String(today2.getDate()).padStart(2,'0')}`
  const EXCHANGE_RATES: Record<string, number> = {
    TWD: 1, USD: 32.51, JPY: 0.2198, EUR: 35.47, HKD: 4.17, SGD: 24.23,
    GBP: 41.38, CHF: 36.82, MYR: 7.31, AUD: 20.48, SEK: 3.12,
    CAD: 23.76, KRW: 0.0234, NOK: 2.98, RMB: 4.49,
  }
  const isEInvoice = s1.voucherType === 'e-invoice-25'
  // Taiwan e-invoice: 2 uppercase letters + 8 digits
  const isValidInvoiceNo = /^[A-Z]{2}\d{8}$/.test(s1.invoiceNo.replace(/-/g, '').toUpperCase())

  const taxAfterNum = s1.subtotal !== '' && s1.tax !== ''
    ? Number(s1.subtotal) + Number(s1.tax)
    : null
  const taxAfterDisplay = taxAfterNum !== null ? taxAfterNum.toLocaleString() : '-'

  const rate = EXCHANGE_RATES[s1.currency] ?? 1
  const localTaxAfterDisplay = taxAfterNum !== null
    ? (s1.currency === 'TWD' ? taxAfterNum.toLocaleString() : Math.round(taxAfterNum * rate).toLocaleString())
    : '-'
  const rateDisplay = s1.currency === 'TWD' ? '-' : rate.toFixed(4)

  function handleVoucherTypeChange(v: string) {
    setAutoFilled(false)
    setRateUpdateTime('')
    setS1(p => ({ ...p, voucherType: v, invoiceNo: '', currency: 'TWD', subtotal: '', tax: '' }))
  }

  function handleInvoiceNoChange(value: string) {
    const normalized = value.replace(/-/g, '').toUpperCase()
    setS1(p => ({ ...p, invoiceNo: value }))
    if (isEInvoice && /^[A-Z]{2}\d{8}$/.test(normalized)) {
      // Simulate e-invoice lookup: deterministic mock from last 4 digits
      const seed = parseInt(normalized.slice(-4), 10)
      const mockSubtotal = String(Math.round((seed % 9 + 1) * 1000))
      const mockTax = String(Math.round(Number(mockSubtotal) * 0.05))
      setS1(p => ({ ...p, invoiceNo: value, currency: 'TWD', subtotal: mockSubtotal, tax: mockTax }))
      setAutoFilled(true)
      const now = new Date()
      setRateUpdateTime(`${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
    } else if (!isEInvoice || !/^[A-Z]{2}\d{8}$/.test(normalized)) {
      if (autoFilled) {
        setAutoFilled(false)
        setRateUpdateTime('')
        setS1(p => ({ ...p, invoiceNo: value, currency: 'TWD', subtotal: '', tax: '' }))
      }
    }
  }

  function reset() {
    setStep(1)
    setS1(defaultStep1())
    setS2(defaultStep2())
    setAutoFilled(false)
    setRateUpdateTime('')
    setContractNums([''])
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit() {
    onSubmit({
      id: String(Date.now()),
      number: invoiceNumber,
      payee: s1.payee,
      date: s1.date || `${today.getFullYear()}/${mm}/${dd}`,
      invoiceNo: s1.invoiceNo,
      currency: s1.currency,
      subtotal: s1.subtotal || '0',
      tax: s1.tax || '0',
    })
    reset()
    onClose()
  }

  const subCategoryOptions = s2.category
    ? (CATEGORIES[s2.category] ?? []).map(s => ({ value: s, label: s }))
    : []

  const computedTax = s2.total && s2.taxRate && s2.taxRate !== 'exempt'
    ? String(Math.round(Number(s2.total) * Number(s2.taxRate) / 100))
    : ''

  const MODAL_TITLES = { 1: '新增請款', 2: '新增付款細項', 3: '新增憑證/證明' } as const

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-[754px] w-full">
        <DialogHeader>
          <DialogTitle>{MODAL_TITLES[step]}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Steps
            orientation="horizontal"
            value={String(step)}
            completedValues={Array.from({ length: step - 1 }, (_, i) => String(i + 1))}
            linear
            className="mb-[var(--layout-space-loose)]"
          >
            {STEP_LABELS.map((label, idx) => (
              <StepItem key={idx + 1} value={String(idx + 1)}>
                <StepLabel>{label}</StepLabel>
              </StepItem>
            ))}
          </Steps>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6 p-3 rounded-lg bg-surface-raised border border-divider">
                <div>
                  <p className="text-caption text-fg-tertiary mb-0.5">請款單號</p>
                  <p className="text-sm font-medium">{invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-caption text-fg-tertiary mb-0.5">狀態</p>
                  <Tag color="neutral" size="sm">Draft</Tag>
                </div>
              </div>

              <Field disabled={parentPayee === '員工'}>
                <FieldLabel required>收款人/廠商</FieldLabel>
                <Input value={s1.payee} onChange={e => setS1(p => ({ ...p, payee: e.target.value }))} />
              </Field>

              <Field>
                <FieldLabel required>憑證類型</FieldLabel>
                <Select placeholder="請選擇" options={VOUCHER_TYPES} value={s1.voucherType} onChange={v => handleVoucherTypeChange(v as string)} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel required>日期</FieldLabel>
                  <Input type="date" value={s1.date} onChange={e => setS1(p => ({ ...p, date: e.target.value }))} placeholder="填寫日期" />
                </Field>
                <Field>
                  <FieldLabel required={isEInvoice}>發票號碼</FieldLabel>
                  <Input
                    value={s1.invoiceNo}
                    onChange={e => handleInvoiceNoChange(e.target.value)}
                    placeholder={isEInvoice ? '例：AB12345678' : '填寫發票號碼'}
                  />
                </Field>
              </div>

              <Field disabled={autoFilled}>
                <FieldLabel required>幣別</FieldLabel>
                <Select options={CURRENCY_OPTIONS} value={s1.currency} onChange={v => {
                    const cur = v as string
                    setS1(p => ({ ...p, currency: cur }))
                    setRateUpdateTime(cur === 'TWD' ? '' : RATE_UPDATE_DATE)
                  }} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field disabled={autoFilled}>
                  <FieldLabel required>合計金額（未稅）</FieldLabel>
                  <Input type="number" value={s1.subtotal} onChange={e => setS1(p => ({ ...p, subtotal: e.target.value }))} />
                </Field>
                <Field disabled={autoFilled}>
                  <FieldLabel>稅額&nbsp;<InfoTooltip content="稅額依憑證類型計算" /></FieldLabel>
                  <Input type="number" value={s1.tax} onChange={e => setS1(p => ({ ...p, tax: e.target.value }))} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-surface-raised border border-divider text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="text-fg-tertiary whitespace-nowrap">稅後金額</span>
                  <span className="font-medium">{taxAfterDisplay}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-fg-tertiary">匯率</span>
                  <span className="font-medium">{rateDisplay}</span>
                </div>
                <div className="flex items-center gap-1 text-fg-tertiary">
                  <span>當地稅後金額</span>
                  <InfoTooltip content="以當前匯率換算後的當地金額" />
                  <span className="text-fg-primary font-medium ml-1">{localTaxAfterDisplay}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-fg-tertiary">更新時間</span>
                  <span className="font-medium">{rateUpdateTime || '-'}</span>
                </div>
              </div>

              {parentPayee === '員工' ? (
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>稅號&nbsp;<InfoTooltip content="統一編號（選填）" /></FieldLabel>
                    <Input value={s1.taxId} onChange={e => setS1(p => ({ ...p, taxId: e.target.value }))} />
                  </Field>
                  <Field>
                    <FieldLabel>二代健保</FieldLabel>
                    <Input value="-" readOnly />
                  </Field>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>收入類型&nbsp;<InfoTooltip content="請選擇收入類型" /></FieldLabel>
                      <Input value={s1.incomeType} onChange={e => setS1(p => ({ ...p, incomeType: e.target.value }))} />
                    </Field>
                    <Field>
                      <FieldLabel>免稅額</FieldLabel>
                      <Select placeholder="請選擇" options={[{ value: '0', label: '無' }, { value: 'partial', label: '部分免稅' }, { value: 'full', label: '全額免稅' }]} value={s1.exemptAmount} onChange={v => setS1(p => ({ ...p, exemptAmount: v as string }))} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>預扣金額&nbsp;<InfoTooltip content="依法規計算之預扣金額" /></FieldLabel>
                      <Input disabled value={s1.withholdingAmount} />
                    </Field>
                    <Field>
                      <FieldLabel>二代健保</FieldLabel>
                      <Input value="-" readOnly />
                    </Field>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <Checkbox id="partial" checked={s1.usePartialAmount} onCheckedChange={v => setS1(p => ({ ...p, usePartialAmount: !!v }))} />
                <label htmlFor="partial" className="text-sm cursor-pointer select-none">使用不足額請款</label>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-surface-raised border border-divider">
                <div>
                  <p className="text-caption text-fg-tertiary mb-0.5">請款單號</p>
                  <p className="text-sm font-medium">{invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-caption text-fg-tertiary mb-0.5">發票號碼</p>
                  <p className="text-sm font-medium">{s1.invoiceNo || '-'}</p>
                </div>
                <div>
                  <p className="text-caption text-fg-tertiary mb-0.5">序號</p>
                  <p className="text-sm font-medium">1</p>
                </div>
              </div>

              <Alert
                variant="info"
                title="注意事項"
                description={
                  <>
                    自 2026/12/31 起「國內出差」、「現金獎金」、「QIF」、「銀行自動扣款」已移至首頁/專區，如有需求請前往
                    <span className="underline cursor-pointer text-[var(--color-blue-9)]">專區</span>請款。
                  </>
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel required>分類</FieldLabel>
                  <Select placeholder="請選擇" options={CATEGORY_OPTIONS} value={s2.category} onChange={v => setS2(p => ({ ...p, category: v as string, subCategory: '', accountCode: '' }))} />
                </Field>
                <Field>
                  <FieldLabel required>子分類</FieldLabel>
                  <Select placeholder="請選擇" options={subCategoryOptions} value={s2.subCategory} onChange={v => {
                    const acct = ACCT_MAPPING[s2.category]?.[v as string] ?? ''
                    setS2(p => ({ ...p, subCategory: v as string, accountCode: acct }))
                  }} disabled={!s2.category} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field disabled>
                  <FieldLabel required>成本中心&nbsp;<InfoTooltip content="填寫您的成本中心代碼" /></FieldLabel>
                  <Input value={s2.costCenter} onChange={e => setS2(p => ({ ...p, costCenter: e.target.value }))} />
                </Field>
                <Field disabled={!!(s2.category && s2.subCategory && ACCT_MAPPING[s2.category]?.[s2.subCategory])}>
                  <FieldLabel>會計科目&nbsp;<InfoTooltip content="依分類/子分類自動帶入" /></FieldLabel>
                  <Input value={s2.accountCode} onChange={e => setS2(p => ({ ...p, accountCode: e.target.value }))} placeholder="依分類自動帶入" />
                </Field>
              </div>

              <Field>
                <FieldLabel>描述</FieldLabel>
                <Textarea value={s2.description} onChange={e => setS2(p => ({ ...p, description: e.target.value }))} rows={2} />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel required>總額</FieldLabel>
                  <Input type="number" placeholder="填寫總額" value={s2.total} onChange={e => setS2(p => ({ ...p, total: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel>稅率&nbsp;<InfoTooltip content="請選擇適用的稅率" /></FieldLabel>
                  <Select placeholder="請選擇" options={TAX_RATES} value={s2.taxRate} onChange={v => setS2(p => ({ ...p, taxRate: v as string }))} />
                </Field>
                <Field>
                  <FieldLabel>稅額</FieldLabel>
                  <Input disabled value={computedTax} placeholder="-" />
                </Field>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">是否提供合約編號</p>
                  <RadioGroup value={s2.contractProvided} onValueChange={v => {
                    setS2(p => ({ ...p, contractProvided: v as Step2State['contractProvided'], noContractReason: '' }))
                    if (v !== 'yes') setContractNums([''])
                  }}>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm"><RadioGroupItem value="yes" />是</label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm"><RadioGroupItem value="no" />否</label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm"><RadioGroupItem value="not-required" />無需提供</label>
                    </div>
                  </RadioGroup>
                </div>

                {s2.contractProvided === 'yes' && (
                  <div className="space-y-2">
                    <Field>
                      <FieldLabel required>合約編號</FieldLabel>
                      <Input
                        placeholder="請填寫合約編號"
                        value={contractNums[0]}
                        onChange={e => {
                          const next = [...contractNums]
                          next[0] = e.target.value
                          setContractNums(next)
                        }}
                      />
                    </Field>
                    {contractNums.slice(1).map((num, idx) => (
                      <div key={idx + 1} className="flex items-center gap-2">
                        <Input
                          className="flex-1"
                          placeholder="填寫合約編號"
                          value={num}
                          onChange={e => {
                            const next = [...contractNums]
                            next[idx + 1] = e.target.value
                            setContractNums(next)
                          }}
                        />
                        <button
                          type="button"
                          className="p-1.5 rounded text-fg-tertiary hover:text-error-default hover:bg-[var(--color-red-1)] transition-colors shrink-0"
                          aria-label="刪除合約編號"
                          onClick={() => setContractNums(prev => prev.filter((_, i) => i !== idx + 1))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="tertiary"
                      startIcon={Plus}
                      onClick={() => setContractNums(prev => [...prev, ''])}
                    >
                      新增合約編號
                    </Button>
                  </div>
                )}

                {s2.contractProvided === 'no' && (
                  <Field>
                    <FieldLabel required>填寫無合約原因</FieldLabel>
                    <Input
                      placeholder="填寫無合約原因"
                      value={s2.noContractReason}
                      onChange={e => setS2(p => ({ ...p, noContractReason: e.target.value }))}
                    />
                  </Field>
                )}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <FileUpload
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              title="新增附件"
              description="支援圖片、PDF、Word、Excel 等格式，單檔最大 20 MB"
              maxSize={20_000_000}
              files={uploadFiles}
              fileListMode="compact"
              onRemove={id => setUploadFiles(prev => prev.filter(f => f.id !== id))}
              onUpload={accepted =>
                setUploadFiles(prev => [
                  ...prev,
                  ...accepted.map((f, i) => ({
                    id: `upload-${Date.now()}-${i}`,
                    name: f.name,
                    size: f.size,
                    status: 'completed' as const,
                  })),
                ])
              }
            />
          )}
        </DialogBody>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div>
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}>上一步</Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>取消</Button>
              {step < 3 ? (
                <Button onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}>下一步</Button>
              ) : (
                <Button onClick={handleSubmit}>新增</Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── AddAttachmentModal ───────────────────────────────────────

function AddAttachmentModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (att: Omit<Attachment, 'id'>) => void
}) {
  const [attType, setAttType] = useState<'invoice' | 'auxiliary'>('invoice')
  const [desc, setDesc] = useState('')
  const [attFiles, setAttFiles] = useState<FileUploadStatus[]>([])

  function handleClose() {
    setAttType('invoice')
    setDesc('')
    setAttFiles([])
    onClose()
  }

  function handleSubmit() {
    onSubmit({
      type: attType,
      desc,
      files: attFiles.map(f => ({ id: f.id, name: f.name })),
    })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-[480px] w-full">
        <DialogHeader>
          <DialogTitle>新增附件</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <Field>
              <FieldLabel required>附件類型</FieldLabel>
              <RadioGroup value={attType} onValueChange={v => setAttType(v as 'invoice' | 'auxiliary')}>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm"><RadioGroupItem value="invoice" />發票</label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm"><RadioGroupItem value="auxiliary" />輔助文件</label>
                </div>
              </RadioGroup>
            </Field>
            <Field>
              <FieldLabel>附件說明</FieldLabel>
              <Input placeholder="填寫附件說明" value={desc} onChange={e => setDesc(e.target.value)} />
            </Field>
            <FileUpload
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              title="新增附件"
              description="支援圖片、PDF、Word、Excel 等格式，單檔最大 20 MB"
              maxSize={20_000_000}
              files={attFiles}
              fileListMode="compact"
              onRemove={id => setAttFiles(prev => prev.filter(f => f.id !== id))}
              onUpload={accepted =>
                setAttFiles(prev => [
                  ...prev,
                  ...accepted.map((f, i) => ({
                    id: `att-${Date.now()}-${i}`,
                    name: f.name,
                    size: f.size,
                    status: 'completed' as const,
                  })),
                ])
              }
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleClose}>取消</Button>
            <Button onClick={handleSubmit}>新增</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── CreateFormPage ───────────────────────────────────────────

function CreateFormPage({
  onBack,
  onSubmit,
}: {
  onBack: () => void
  onSubmit: (newNumber: string) => void
}) {
  const [payee, setPayee] = useState('員工')
  const [reason, setReason] = useState('')
  const [useUrgentDate, setUseUrgentDate] = useState(false)
  const [urgentDate, setUrgentDate] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const formNumber = `PAE${today.getFullYear()}${mm}${dd}001`

  function handleAddInvoice(invoice: Invoice) {
    setInvoices(prev => [...prev, invoice])
  }

  function handleRemoveInvoice(id: string) {
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  function handleAddAttachment(att: Omit<Attachment, 'id'>) {
    setAttachments(prev => [...prev, { ...att, id: String(Date.now()) }])
  }

  function handleRemoveAttachment(id: string) {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  function handleSubmit() {
    onSubmit(formNumber)
  }

  const ATT_TYPE_LABEL: Record<Attachment['type'], string> = {
    invoice: '電腦發票',
    auxiliary: '證明文件',
  }

  return (
    <div className="p-6 w-full">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1 text-sm text-fg-tertiary mb-1">
            <button
              onClick={onBack}
              className="hover:text-fg-secondary transition-colors"
            >
              暫存申請單
            </button>
            <span>/</span>
          </div>
          <h1 className="text-2xl font-semibold">一般項目申請單 {formNumber}</h1>
        </div>
        <Button variant="tertiary" startIcon={Upload} disabled>批次匯入申請</Button>
      </div>

      {/* Form sections */}
      <div className="space-y-4 max-w-[860px]">

        {/* 基本資訊 */}
        <section className="bg-surface border border-divider rounded-lg p-6">
          <h2 className="text-base font-semibold mb-4">付款資訊</h2>
          <div className="space-y-4">
            <Field disabled>
              <FieldLabel>
                公司代號&nbsp;<InfoTooltip content="請選擇您所屬的公司代號" />
              </FieldLabel>
              <Select
                value="TA01"
                options={[{ value: 'TA01', label: 'TA01' }]}
                onChange={() => {}}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel required>
                  申請人 <InfoTooltip content="自動帶入登入者" />
                </FieldLabel>
                <Input value="林間宜 (023156)" readOnly />
              </Field>
              <Field>
                <FieldLabel required>
                  收款對象&nbsp;<InfoTooltip content="請選擇本次請款的收款對象" />
                </FieldLabel>
                <Select
                  options={PAYEE_OPTIONS}
                  value={payee}
                  onChange={v => setPayee(v as string)}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* 請款資訊 */}
        <section className="bg-surface border border-divider rounded-lg p-6">
          <h2 className="text-base font-semibold mb-4">請款資訊</h2>
          <Button variant="tertiary" startIcon={Plus} onClick={() => setInvoiceModalOpen(true)}>
            新增請款
          </Button>

          {invoices.length === 0 ? (
            <div className="mt-4 rounded-lg border border-divider py-12 text-center text-sm text-fg-tertiary">
              沒有任何資料
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {invoices.map(invoice => (
                <div key={invoice.id} className="border border-divider rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-fg-primary shrink-0">{invoice.number}</span>
                      <Tag color="neutral" size="sm">Draft</Tag>
                      <span className="text-fg-secondary shrink-0">
                        {invoice.currency} {Number(invoice.subtotal).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 ml-2">
                      <button className="p-1.5 rounded text-fg-tertiary hover:text-fg-secondary hover:bg-[var(--color-neutral-2)] transition-colors" aria-label="編輯">
                        <Pencil size={14} />
                      </button>
                      <button className="p-1.5 rounded text-fg-tertiary hover:text-fg-secondary hover:bg-[var(--color-neutral-2)] transition-colors" aria-label="複製">
                        <Copy size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded text-fg-tertiary hover:text-error-default hover:bg-[var(--color-red-1)] transition-colors"
                        aria-label="刪除"
                        onClick={() => handleRemoveInvoice(invoice.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-fg-tertiary mt-1">
                    收款人：{invoice.payee}&nbsp;|&nbsp;日期：{invoice.date}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 檢附憑證 / 證明 */}
        <section className="bg-surface border border-divider rounded-lg p-6">
          <h2 className="text-base font-semibold mb-4">檢附憑證 / 證明</h2>
          <Button variant="tertiary" startIcon={Plus} onClick={() => setAttachmentModalOpen(true)}>
            新增附件
          </Button>

          {attachments.length === 0 ? (
            <div className="mt-4 rounded-lg border border-divider py-12 text-center text-sm text-fg-tertiary">
              沒有任何資料
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-divider overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-raised border-b border-divider">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-fg-secondary">類型</th>
                    <th className="text-left px-4 py-2 font-medium text-fg-secondary">描述</th>
                    <th className="text-left px-4 py-2 font-medium text-fg-secondary">附件</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {attachments.map(att => (
                    <tr key={att.id} className="hover:bg-surface-raised transition-colors">
                      <td className="px-4 py-3 text-fg-secondary">{ATT_TYPE_LABEL[att.type]}</td>
                      <td className="px-4 py-3 text-fg-secondary">{att.desc || '-'}</td>
                      <td className="px-4 py-3">
                        {att.files.length === 0 ? (
                          <span className="text-fg-tertiary">-</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {att.files.map(f => (
                              <div key={f.id} className="flex items-center gap-1.5">
                                <Paperclip size={14} className="text-fg-tertiary shrink-0" />
                                <span className="text-[var(--color-blue-6)] text-sm truncate">{f.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <button className="p-1.5 rounded text-fg-tertiary hover:text-fg-secondary hover:bg-[var(--color-neutral-2)] transition-colors" aria-label="編輯">
                            <Pencil size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded text-fg-tertiary hover:text-error-default hover:bg-[var(--color-red-1)] transition-colors"
                            aria-label="刪除"
                            onClick={() => handleRemoveAttachment(att.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 補充資訊 */}
        <section className="bg-surface border border-divider rounded-lg p-6">
          <Field>
            <FieldLabel required>
              申請原因&nbsp;<InfoTooltip content="說明本次請款的用途，最多 250 字" />
            </FieldLabel>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="填寫申請原因，最多 250 字"
            />
          </Field>

          <div className="mt-4">
            <Alert
              variant="info"
              title="注意事項"
              description={
                <>
                  預計付款日為申請單簽核完畢後的下個月一般付款日（每月最後工作日），若有緊急付款需求，請參考下列簽核層級：
                  <ul className="list-disc ml-4 mt-1 space-y-0.5">
                    <li>一般付款日：100,000 TWD 以下簽核至處長，以上簽核至副總</li>
                    <li>特殊付款日：一律簽核至副總</li>
                  </ul>
                </>
              }
            />
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="urgent"
                checked={useUrgentDate}
                onCheckedChange={v => setUseUrgentDate(!!v)}
              />
              <label htmlFor="urgent" className="text-sm cursor-pointer select-none">
                使用緊急/指定付款
              </label>
            </div>
            <Field disabled={!useUrgentDate}>
              <FieldLabel>緊急/指定付款日</FieldLabel>
              <DatePicker
                value={urgentDate || null}
                onChange={v => setUrgentDate(v)}
                placeholder="請選擇日期"
              />
            </Field>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end mt-6 pt-4 border-t border-divider max-w-[860px]">
        <div className="flex gap-2">
          <Button variant="primary" danger onClick={() => setCancelConfirmOpen(true)}>取消申請</Button>
          <Button variant="tertiary" onClick={() => { onBack(); toast({ variant: 'success', title: '儲存成功' }) }}>存成草稿</Button>
          <Button onClick={() => setPreviewOpen(true)}>下一步</Button>
        </div>
      </div>

      {/* Modals */}
      <AddInvoiceModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        onSubmit={handleAddInvoice}
        payee={payee}
      />
      <AddAttachmentModal
        open={attachmentModalOpen}
        onClose={() => setAttachmentModalOpen(false)}
        onSubmit={handleAddAttachment}
      />

      {/* 取消申請確認 */}
      <Dialog open={cancelConfirmOpen} onOpenChange={o => !o && setCancelConfirmOpen(false)}>
        <DialogContent className="max-w-[480px] w-full">
          <DialogHeader>
            <DialogTitle>是否取消申請</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-fg-secondary">
              您尚未儲存目前填寫的內容。若取消申請，已填寫的資料將無法保留，是否仍要取消？
            </p>
          </DialogBody>
          <DialogFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button variant="tertiary" onClick={() => setCancelConfirmOpen(false)}>繼續編輯</Button>
              <Button variant="primary" danger onClick={onBack}>取消申請</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 申請單預覽 */}
      <Dialog open={previewOpen} onOpenChange={o => !o && setPreviewOpen(false)}>
        <DialogContent className="max-w-[760px] w-full">
          <DialogHeader>
            <DialogTitle>申請單預覽</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-6">
              {/* 基本資訊 */}
              <section>
                <h3 className="text-sm font-semibold text-fg-secondary mb-3 pb-2 border-b border-divider">基本資訊</h3>
                <div className="grid grid-cols-3 gap-y-3 text-sm">
                  <div>
                    <p className="text-fg-tertiary mb-0.5">公司代號</p>
                    <p className="text-fg-primary">TA01</p>
                  </div>
                  <div>
                    <p className="text-fg-tertiary mb-0.5">申請人</p>
                    <p className="text-fg-primary">林間宜 (023156)</p>
                  </div>
                  <div>
                    <p className="text-fg-tertiary mb-0.5">收款對象</p>
                    <p className="text-fg-primary">{payee}</p>
                  </div>
                  <div>
                    <p className="text-fg-tertiary mb-0.5">申請單號</p>
                    <p className="text-fg-primary">{formNumber}</p>
                  </div>
                  <div>
                    <p className="text-fg-tertiary mb-0.5">緊急/指定付款日</p>
                    <p className="text-fg-primary">{useUrgentDate && urgentDate ? urgentDate : '-'}</p>
                  </div>
                </div>
              </section>

              {/* 請款資訊 */}
              <section>
                <h3 className="text-sm font-semibold text-fg-secondary mb-3 pb-2 border-b border-divider">請款資訊</h3>
                {invoices.length === 0 ? (
                  <p className="text-sm text-fg-tertiary">無請款資訊</p>
                ) : (
                  <div className="rounded-lg border border-divider overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-raised border-b border-divider">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-fg-secondary">請款單號</th>
                          <th className="text-left px-4 py-2 font-medium text-fg-secondary">收款人</th>
                          <th className="text-left px-4 py-2 font-medium text-fg-secondary">日期</th>
                          <th className="text-right px-4 py-2 font-medium text-fg-secondary">金額</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-divider">
                        {invoices.map(inv => (
                          <tr key={inv.id}>
                            <td className="px-4 py-2 text-fg-primary">{inv.number}</td>
                            <td className="px-4 py-2 text-fg-secondary">{inv.payee}</td>
                            <td className="px-4 py-2 text-fg-secondary">{inv.date}</td>
                            <td className="px-4 py-2 text-fg-secondary text-right">{inv.currency} {Number(inv.subtotal).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* 憑證附件資訊 */}
              <section>
                <h3 className="text-sm font-semibold text-fg-secondary mb-3 pb-2 border-b border-divider">憑證附件資訊</h3>
                {attachments.length === 0 ? (
                  <p className="text-sm text-fg-tertiary">無附件資訊</p>
                ) : (
                  <div className="rounded-lg border border-divider overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-raised border-b border-divider">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-fg-secondary">類型</th>
                          <th className="text-left px-4 py-2 font-medium text-fg-secondary">描述</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-divider">
                        {attachments.map(att => (
                          <tr key={att.id}>
                            <td className="px-4 py-2 text-fg-secondary">{att.type === 'invoice' ? '電腦發票' : '證明文件'}</td>
                            <td className="px-4 py-2 text-fg-secondary">{att.desc || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* 審核流程 */}
              <section>
                <h3 className="text-sm font-semibold text-fg-secondary mb-3 pb-2 border-b border-divider">審核流程</h3>
                <div className="rounded-lg border border-divider overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-raised border-b border-divider">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-fg-secondary">角色</th>
                        <th className="text-left px-4 py-2 font-medium text-fg-secondary">審核人</th>
                        <th className="text-left px-4 py-2 font-medium text-fg-secondary">狀態</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      <tr>
                        <td className="px-4 py-2 text-fg-secondary">申請人</td>
                        <td className="px-4 py-2 text-fg-primary">林間宜 (023156)</td>
                        <td className="px-4 py-2"><Tag color="blue" size="sm">已申請</Tag></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-fg-secondary">主管</td>
                        <td className="px-4 py-2 text-fg-secondary">-</td>
                        <td className="px-4 py-2"><Tag color="neutral" size="sm">待審核</Tag></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-fg-secondary">會計</td>
                        <td className="px-4 py-2 text-fg-secondary">財務部</td>
                        <td className="px-4 py-2"><Tag color="neutral" size="sm">待審核</Tag></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 簽核補充說明 */}
              <section>
                <h3 className="text-sm font-semibold text-fg-secondary mb-3 pb-2 border-b border-divider">簽核補充說明</h3>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  placeholder="可填寫補充說明（選填）"
                />
              </section>
            </div>
          </DialogBody>
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <Button variant="ghost" onClick={() => setPreviewOpen(false)}>上一步</Button>
              <Button onClick={() => { setPreviewOpen(false); onSubmit(formNumber) }}>送出</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── DraftListPage ───────────────────────────────────────────

function DraftListPage({
  entries,
  onAddSingle,
  onAddExcel,
}: {
  entries: DraftEntry[]
  onAddSingle: () => void
  onAddExcel: () => void
}) {
  return (
    <div className="p-6 w-full">
      <h1 className="text-xl font-semibold mb-6">暫存申請單</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">一般</TabsTrigger>
          <TabsTrigger value="bonus">現金獎金</TabsTrigger>
          <TabsTrigger value="domestic">國內差旅</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-4">
            <h2 className="font-medium text-fg-primary">一般暫存申請</h2>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button startIcon={Plus} endIcon={ChevronDown}>新增</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onAddSingle}>單筆申請</DropdownMenuItem>
                  <DropdownMenuItem onClick={onAddExcel} disabled>Excel 申請</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="tertiary" startIcon={Download} disabled>下載 Excel 範本</Button>
            </div>
          </div>

          <div className="rounded-lg border border-divider overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-surface-raised border-b border-divider">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-fg-secondary whitespace-nowrap">單號</th>
                  <th className="text-left px-4 py-3 font-medium text-fg-secondary whitespace-nowrap">申請日期</th>
                  <th className="text-left px-4 py-3 font-medium text-fg-secondary whitespace-nowrap">公司代號</th>
                  <th className="text-left px-4 py-3 font-medium text-fg-secondary whitespace-nowrap">申請人</th>
                  <th className="text-left px-4 py-3 font-medium text-fg-secondary whitespace-nowrap">收款對象</th>
                  <th className="text-right px-4 py-3 font-medium text-fg-secondary whitespace-nowrap">總額</th>
                  <th className="text-left px-4 py-3 font-medium text-fg-secondary whitespace-nowrap">緊急/指定付款日期</th>
                  <th className="text-left px-4 py-3 font-medium text-fg-secondary whitespace-nowrap">申請原因</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {entries.map(entry => {
                  const meta = STATUS_META[entry.status]
                  return (
                    <tr key={entry.id} className="hover:bg-surface-raised transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-fg-primary">{entry.number}</p>
                        <div className="mt-1">
                          <Tag color={meta.color} size="sm">{meta.label}</Tag>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-secondary">{entry.date}</td>
                      <td className="px-4 py-3 text-fg-secondary">{entry.company}</td>
                      <td className="px-4 py-3 text-fg-secondary">{entry.applicant}</td>
                      <td className="px-4 py-3 text-fg-secondary">{entry.payee}</td>
                      <td className="px-4 py-3 text-fg-secondary text-right">{entry.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-fg-secondary">{entry.urgentDate}</td>
                      <td className="px-4 py-3 text-fg-secondary">{entry.reason}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="sm" iconOnly startIcon={Info} aria-label="查看" disabled />
                          <button className="p-1.5 rounded text-fg-tertiary hover:text-fg-secondary hover:bg-[var(--color-neutral-2)] transition-colors" aria-label="編輯">
                            <Pencil size={14} />
                          </button>
                          <button className="p-1.5 rounded text-fg-tertiary hover:text-error-default hover:bg-[var(--color-red-1)] transition-colors" aria-label="刪除">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="bonus" className="mt-6">
          <div className="rounded-xl border border-divider bg-surface py-16 text-center text-body text-fg-tertiary">
            現金獎金申請請至專區請款
          </div>
        </TabsContent>

        <TabsContent value="domestic" className="mt-6">
          <div className="rounded-xl border border-divider bg-surface py-16 text-center text-body text-fg-tertiary">
            國內差旅申請請至差旅專區
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── App Root ────────────────────────────────────────────────

export default function App() {
  const [activeNav, setActiveNav] = useState('drafts')
  const [entries, setEntries] = useState<DraftEntry[]>(INITIAL_ENTRIES)
  const [page, setPage] = useState<'list' | 'createform'>('list')

  function handleSubmit(newNumber: string) {
    const today = new Date()
    const newEntry: DraftEntry = {
      id: String(Date.now()),
      number: newNumber,
      date: `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`,
      company: 'TA01',
      applicant: '林間宜 (023156)',
      payee: '員工',
      total: 0,
      urgentDate: '-',
      reason: '-',
      status: 'draft',
    }
    setEntries(prev => [newEntry, ...prev])
    setPage('list')
    toast({ variant: 'success', title: `${newNumber}送出成功` })
  }

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <SidebarProvider activeId={activeNav} onActiveChange={setActiveNav}>
        <AppShell
          layout="primary-sidebar"
          sidebar={<AppSidebar activeId={activeNav} onActiveChange={setActiveNav} />}
        >
          {page === 'list' ? (
            <DraftListPage
              entries={entries}
              onAddSingle={() => setPage('createform')}
              onAddExcel={() => toast({ variant: 'info', title: 'Excel 申請', description: '請下載範本填寫後上傳' })}
            />
          ) : (
            <CreateFormPage
              onBack={() => setPage('list')}
              onSubmit={handleSubmit}
            />
          )}
        </AppShell>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  )
}
