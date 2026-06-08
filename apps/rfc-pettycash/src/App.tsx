import { useState, useEffect } from 'react'
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
  Field, FieldLabel, FieldError,
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
  Info, ChevronDown, Copy, Paperclip, Loader2,
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
const ACCT_NAME_MAPPING: Record<string, string> = {
  '613009': '外包勞務費',
  '613013': '零件材料費',
  '618010': '修繕費',
  '618002': '什項購置費',
  '618001': '辦公家俱費',
  '618007': '電腦軟體費',
  '618008': '雲端服務費',
  '660002': '書報雜誌費',
  '660001': '印刷費',
  '660000': '運費',
  '655540': '活動費用',
  '655530': '國內差旅費',
  '655520': '國內報名費',
  '655531': '海外差旅費',
  '655521': '海外報名費',
  '655541': '各部門訓練費',
  '655505': '學習平台費',
  '655502': '訓練交通費',
  '655509': '訓練活動費',
  '655501': '進修補助費',
  '654000': '招募費用',
  '654010': '海外招募費',
  '630120': '產學合作費',
  '654200': '技術研發費',
  '655551': '人才培育費',
  '655503': '專案訓練費',
  '654100': '員工福利費',
  '664900': '雜費',
  '641000': '廣告費',
  '641001': '國際廣告費',
  '216631': '律師費',
  '216635': '專利費',
  '312000': 'Patent License',
  '655900': '員工關懷費',
  '663200': '會計師費',
  '216632': '應計會計師費',
  '663001': '顧問費',
  '613000': '會議相關費用',
}
const TAX_RATES = [{ value: '5', label: '5%' }, { value: '0', label: '0%' }, { value: 'exempt', label: '免稅' }]
const CURRENCY_OPTIONS = [
  'TWD', 'USD', 'JPY', 'EUR', 'HKD', 'SGD', 'GBP', 'CHF', 'MYR', 'AUD', 'SEK', 'CAD', 'KRW', 'NOK', 'RMB',
].map(c => ({ value: c, label: c }))
const PAYEE_OPTIONS = [{ value: '員工', label: '員工' }, { value: '廠商', label: '廠商' }]

const VENDOR_OPTIONS = [
  { value: '富邦媒體科技股份有限公司', label: '富邦媒體科技股份有限公司' },
  { value: '中華軟協資訊服務股份有限公司', label: '中華軟協資訊服務股份有限公司' },
  { value: '精誠資訊股份有限公司', label: '精誠資訊股份有限公司' },
  { value: '宏碁股份有限公司', label: '宏碁股份有限公司' },
  { value: '聯詠科技股份有限公司', label: '聯詠科技股份有限公司' },
  { value: '瑞昱半導體股份有限公司', label: '瑞昱半導體股份有限公司' },
  { value: '廣達電腦股份有限公司', label: '廣達電腦股份有限公司' },
  { value: '仁寶電腦工業股份有限公司', label: '仁寶電腦工業股份有限公司' },
]

const EMPLOYEE_OPTIONS = [
  { value: '林間宜 (023156)', label: '林間宜 (023156)' },
  { value: '陳建宏 (031042)', label: '陳建宏 (031042)' },
  { value: '王雅婷 (028745)', label: '王雅婷 (028745)' },
  { value: '張志明 (019823)', label: '張志明 (019823)' },
  { value: '李美慧 (045678)', label: '李美慧 (045678)' },
  { value: '劉俊傑 (052341)', label: '劉俊傑 (052341)' },
  { value: '吳怡君 (038901)', label: '吳怡君 (038901)' },
  { value: '蔡明哲 (067234)', label: '蔡明哲 (067234)' },
]

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
  voucherType: string
}

interface Attachment {
  id: string
  type: 'invoice' | 'auxiliary'
  desc: string
  files: Array<{ id: string; name: string }>
}

interface PaymentItem {
  id: string
  seq: number
  category: string
  subCategory: string
  costCenter: string
  accountCode: string
  accountName: string
  description: string
  total: string
  taxRate: string
  taxAmount: string
  contractProvided: string
  contractInfo: string
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
  { id: '4', number: 'PAE20260525004', date: '2026/5/26', company: 'TA01', applicant: '林間宜 (023156)', payee: '廠商', total: 5200, urgentDate: '-', reason: '-', status: 'reviewing' },
  { id: '5', number: 'PAE20260525005', date: '2026/5/25', company: 'TA01', applicant: '林間宜 (023156)', payee: '員工', total: 1800, urgentDate: '-', reason: '-', status: 'modifying' },
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
  tax: '0',
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
  onUpdate,
  payee: parentPayee = '員工',
  editInvoice,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (invoice: Invoice) => void
  onUpdate?: (invoice: Invoice) => void
  payee?: string
  editInvoice?: Invoice
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [s1, setS1] = useState<Step1State>(() => editInvoice ? {
    ...defaultStep1(),
    payee: editInvoice.payee,
    voucherType: editInvoice.voucherType,
    date: editInvoice.date,
    invoiceNo: editInvoice.invoiceNo,
    currency: editInvoice.currency,
    subtotal: editInvoice.subtotal,
    tax: editInvoice.tax,
  } : parentPayee === '廠商' ? { ...defaultStep1(), payee: '' } : defaultStep1())
  const [s2, setS2] = useState<Step2State>(defaultStep2)
  const [autoFilled, setAutoFilled] = useState(false)
  const [rateUpdateTime, setRateUpdateTime] = useState('')
  const [contractNums, setContractNums] = useState<string[]>([''])
  const [uploadFiles, setUploadFiles] = useState<FileUploadStatus[]>([])
  const [step1Submitted, setStep1Submitted] = useState(false)

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
    setS1(p => ({ ...p, voucherType: v, invoiceNo: '', currency: 'TWD', subtotal: '', tax: '0' }))
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
        setS1(p => ({ ...p, invoiceNo: value, currency: 'TWD', subtotal: '', tax: '0' }))
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
    setStep1Submitted(false)
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
      voucherType: s1.voucherType,
    })
    reset()
    onClose()
  }

  const subCategoryOptions = s2.category
    ? (CATEGORIES[s2.category] ?? []).map(s => ({ value: s, label: s }))
    : []

  const computedTax = s2.total && s2.taxRate && s2.taxRate !== 'exempt'
    ? String(Math.round(Number(s2.total) * Number(s2.taxRate) / 100))
    : '0'

  const isEditing = !!editInvoice
  const MODAL_TITLES = {
    1: isEditing ? '編輯請款' : '新增請款',
    2: '新增付款細項',
    3: '新增憑證/證明',
  } as const

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent maxWidth={754}>
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

              <Field>
                <FieldLabel required>收款人/廠商&nbsp;<InfoTooltip content="Vendor/Payee" /></FieldLabel>
                <Select
                  searchable
                  placeholder={parentPayee === '廠商' ? '搜尋廠商名稱' : '搜尋員工姓名'}
                  options={parentPayee === '廠商' ? VENDOR_OPTIONS : EMPLOYEE_OPTIONS}
                  value={s1.payee}
                  onChange={v => setS1(p => ({ ...p, payee: v as string }))}
                />
              </Field>

              <Field invalid={step1Submitted && !s1.voucherType}>
                <FieldLabel required>憑證類型&nbsp;<InfoTooltip content="Invoice Type" /></FieldLabel>
                <Select placeholder="請選擇" options={VOUCHER_TYPES} value={s1.voucherType} onChange={v => handleVoucherTypeChange(v as string)} />
                {step1Submitted && !s1.voucherType && <FieldError>請選擇憑證類型</FieldError>}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field invalid={step1Submitted && !s1.date}>
                  <FieldLabel required>日期&nbsp;<InfoTooltip content="Invoice Date" /></FieldLabel>
                  <DatePicker value={s1.date || null} onChange={v => setS1(p => ({ ...p, date: v }))} clearable placeholder="YYYY/MM/DD" />
                  {step1Submitted && !s1.date && <FieldError>請填寫日期</FieldError>}
                </Field>
                <Field>
                  <FieldLabel required={isEInvoice}>發票號碼&nbsp;<InfoTooltip content="Invoice No." /></FieldLabel>
                  <Input
                    value={s1.invoiceNo}
                    onChange={e => handleInvoiceNoChange(e.target.value)}
                    placeholder={isEInvoice ? '例：AB12345678' : '填寫發票號碼'}
                  />
                </Field>
              </div>

              <Field disabled={autoFilled}>
                <FieldLabel required>幣別&nbsp;<InfoTooltip content="Currency" /></FieldLabel>
                <Select options={CURRENCY_OPTIONS} value={s1.currency} onChange={v => {
                    const cur = v as string
                    setS1(p => ({ ...p, currency: cur }))
                    setRateUpdateTime(cur === 'TWD' ? '' : RATE_UPDATE_DATE)
                  }} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field disabled={autoFilled} invalid={step1Submitted && !autoFilled && !s1.subtotal}>
                  <FieldLabel required>合計金額（未稅）</FieldLabel>
                  <Input type="number" value={s1.subtotal} onChange={e => setS1(p => ({ ...p, subtotal: e.target.value }))} />
                  {step1Submitted && !autoFilled && !s1.subtotal && <FieldError>請填寫金額</FieldError>}
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
                  <InfoTooltip content="實際支付金額，已包含當地稅費" />
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
                    <FieldLabel>稅號&nbsp;<InfoTooltip content="Tax ID" /></FieldLabel>
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
                      <FieldLabel>收入類型&nbsp;<InfoTooltip content="Income type" /></FieldLabel>
                      <Input value={s1.incomeType} onChange={e => setS1(p => ({ ...p, incomeType: e.target.value }))} />
                    </Field>
                    <Field>
                      <FieldLabel>免稅額&nbsp;<InfoTooltip content="Tax Exempt" /></FieldLabel>
                      <Select placeholder="請選擇" options={[{ value: '0', label: '無' }, { value: 'partial', label: '部分免稅' }, { value: 'full', label: '全額免稅' }]} value={s1.exemptAmount} onChange={v => setS1(p => ({ ...p, exemptAmount: v as string }))} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>預扣金額&nbsp;<InfoTooltip content="Withholding Amount" /></FieldLabel>
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
                <Field>
                  <FieldLabel required>成本中心&nbsp;<InfoTooltip content="Cost Center" /></FieldLabel>
                  <Input value={s2.costCenter} onChange={e => setS2(p => ({ ...p, costCenter: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel>會計科目&nbsp;<InfoTooltip content="依分類/子分類自動帶入" /></FieldLabel>
                  <Input value={s2.accountCode ? `${s2.accountCode}（${ACCT_NAME_MAPPING[s2.accountCode] ?? ''}）` : ''} placeholder="依分類自動帶入" onChange={e => setS2(p => ({ ...p, accountCode: e.target.value }))} />
                </Field>
              </div>

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
              {isEditing && step === 1 ? (
                <Button onClick={() => {
                  onUpdate?.({
                    id: editInvoice!.id,
                    number: editInvoice!.number,
                    payee: s1.payee,
                    date: s1.date || editInvoice!.date,
                    invoiceNo: s1.invoiceNo,
                    currency: s1.currency,
                    subtotal: s1.subtotal || '0',
                    tax: s1.tax || '0',
                    voucherType: s1.voucherType,
                  })
                  handleClose()
                }}>更新</Button>
              ) : step < 3 ? (
                <Button onClick={() => {
                  if (step === 1) {
                    setStep1Submitted(true)
                    const needVendor = parentPayee === '廠商' && !s1.payee
                    if (!s1.voucherType || !s1.date || !s1.subtotal || needVendor) return
                  }
                  setStep(s => (s + 1) as 1 | 2 | 3)
                }}>下一步</Button>
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
      <DialogContent maxWidth={480} autoHeight>
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


// ─── EditAttachmentModal ──────────────────────────────────────

function EditAttachmentModal({
  open,
  onClose,
  attachment,
  onUpdate,
}: {
  open: boolean
  onClose: () => void
  attachment: Attachment | null
  onUpdate: (updated: Omit<Attachment, 'id'>) => void
}) {
  const [attType, setAttType] = useState<'invoice' | 'auxiliary'>(attachment?.type ?? 'invoice')
  const [desc, setDesc] = useState(attachment?.desc ?? '')
  const [attFiles, setAttFiles] = useState<FileUploadStatus[]>(
    (attachment?.files ?? []).map(f => ({ id: f.id, name: f.name, size: 0, status: 'completed' as const }))
  )

  function handleClose() { onClose() }

  function handleSave() {
    onUpdate({ type: attType, desc, files: attFiles.map(f => ({ id: f.id, name: f.name })) })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent maxWidth={480} autoHeight>
        <DialogHeader>
          <DialogTitle>編輯附件</DialogTitle>
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
              title="編輯附件"
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
            <Button onClick={handleSave}>儲存</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── PreviewDialog ───────────────────────────────────────────

function PreviewCard({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-surface border border-[var(--color-neutral-4)] rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 min-h-[52px] hover:bg-surface-raised transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xl font-semibold text-fg-primary">{title}</span>
        <span className="flex items-center gap-1 text-base text-fg-primary font-medium">
          {open ? '收合資訊' : '更多資訊'}
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function PreviewDialog({
  open,
  onClose,
  onSubmit,
  formNumber,
  payee,
  invoices,
  attachments,
  useUrgentDate,
  urgentDate,
  reason,
  onReasonChange,
}: {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  formNumber: string
  payee: string
  invoices: Invoice[]
  attachments: Attachment[]
  useUrgentDate: boolean
  urgentDate: string
  reason: string
  onReasonChange: (v: string) => void
}) {
  const ATT_TYPE_LABEL: Record<Attachment['type'], string> = {
    invoice: '電腦發票',
    auxiliary: '證明文件',
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent maxWidth={760}>
        <DialogHeader>
          <DialogTitle>申請單預覽</DialogTitle>
        </DialogHeader>
        <DialogBody className="bg-surface-raised">
          <div className="space-y-3 p-1">

            <PreviewCard title="基本資訊">
              <div className="grid grid-cols-3 gap-y-3 text-sm pt-1">
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
            </PreviewCard>

            <PreviewCard title="請款資訊">
              {invoices.length === 0 ? (
                <p className="text-sm text-fg-tertiary pt-1">無請款資訊</p>
              ) : (
                <div className="rounded-lg border border-divider overflow-hidden mt-1">
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
            </PreviewCard>

            <PreviewCard title="憑證附件資訊">
              {attachments.length === 0 ? (
                <p className="text-sm text-fg-tertiary pt-1">無附件資訊</p>
              ) : (
                <div className="rounded-lg border border-divider overflow-hidden mt-1">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-raised border-b border-divider">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-fg-secondary">類型</th>
                        <th className="text-left px-4 py-2 font-medium text-fg-secondary">描述</th>
                        <th className="text-left px-4 py-2 font-medium text-fg-secondary">附件</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {attachments.map(att => (
                        <tr key={att.id}>
                          <td className="px-4 py-2 text-fg-secondary">{ATT_TYPE_LABEL[att.type]}</td>
                          <td className="px-4 py-2 text-fg-secondary">{att.desc || '-'}</td>
                          <td className="px-4 py-2">
                            {att.files.length === 0 ? (
                              <span className="text-fg-tertiary">-</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {att.files.map(f => (
                                  <div key={f.id} className="flex items-center gap-1.5">
                                    <Paperclip size={13} className="text-fg-tertiary shrink-0" />
                                    <span className="text-[var(--color-blue-6)] text-sm truncate">{f.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PreviewCard>

            <PreviewCard title="審核流程" defaultOpen>
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-fg-secondary">您可以依照需求新增審核人員。</p>
                  <Button variant="outline" size="sm" startIcon={Plus}>新增審核人員</Button>
                </div>
                <div className="rounded-lg border border-divider overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-raised border-b border-divider">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-fg-secondary">流程角色</th>
                        <th className="text-left px-3 py-2 font-medium text-fg-secondary">任務擁有者</th>
                        <th className="text-left px-3 py-2 font-medium text-fg-secondary">指派</th>
                        <th className="text-left px-3 py-2 font-medium text-fg-secondary">執行人員</th>
                        <th className="text-left px-3 py-2 font-medium text-fg-secondary">動作</th>
                        <th className="text-left px-3 py-2 font-medium text-fg-secondary">評論</th>
                        <th className="text-left px-3 py-2 font-medium text-fg-secondary">更新日期</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {[
                        { role: '申請人', owner: '林間宜 (023156)', canDelete: false },
                        { role: '主管', owner: '109964 洪挺鈞', canDelete: true },
                        { role: '會計', owner: '060069 黃蓉芬', canDelete: false },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-surface-raised transition-colors">
                          <td className="px-3 py-2 text-fg-secondary">{row.role}</td>
                          <td className="px-3 py-2 text-fg-primary">{row.owner}</td>
                          <td className="px-3 py-2 text-fg-tertiary">-</td>
                          <td className="px-3 py-2 text-fg-tertiary">-</td>
                          <td className="px-3 py-2 text-fg-tertiary">-</td>
                          <td className="px-3 py-2 text-fg-tertiary">-</td>
                          <td className="px-3 py-2 text-fg-tertiary">-</td>
                          <td className="px-3 py-2">
                            {row.canDelete && (
                              <Button variant="ghost" size="sm" iconOnly startIcon={Trash2} aria-label="刪除" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </PreviewCard>

            <div className="bg-surface border border-[var(--color-neutral-4)] rounded-lg p-4 space-y-4">
              <h3 className="text-xl font-semibold text-fg-primary">簽核補充說明</h3>
              <div className="space-y-2">
                <p className="text-sm text-fg-secondary">您可以填寫簽核補充說明，協助下一階段簽核人員快速完成審核</p>
                <Textarea
                  value={reason}
                  onChange={e => onReasonChange(e.target.value)}
                  rows={3}
                  placeholder="請填寫補充說明"
                />
              </div>
            </div>

          </div>
        </DialogBody>
        <DialogFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={onClose}>上一步</Button>
            <Button onClick={onSubmit}>送出</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── BatchImportModal ────────────────────────────────────────

function BatchImportModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'loading'>('idle')

  function handleClose() {
    setFileName(null)
    setPhase('idle')
    onClose()
  }

  useEffect(() => {
    if (phase !== 'loading') return
    const timer = setTimeout(() => {
      handleClose()
      toast({ variant: 'success', title: '匯入成功' })
    }, 2000)
    return () => clearTimeout(timer)
  }, [phase])

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent maxWidth={600} autoHeight>
        <DialogHeader>
          <DialogTitle>批次匯入 Excel 付款細項</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {phase === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 size={40} className="text-[var(--color-blue-6)] animate-spin" />
              <p className="text-base font-semibold text-fg-primary">檔案匯入中</p>
              <p className="text-sm text-fg-secondary">檔案正在匯入中，請稍候。</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-fg-secondary">
                請先下載{' '}
                <span className="text-[var(--color-blue-6)] underline cursor-pointer">Excel 付款細項範本</span>
                ，填寫完成後到此匯入檔案。
              </p>
              {/* Upload zone */}
              <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--color-neutral-4)] rounded-lg py-10 cursor-pointer hover:border-[var(--color-blue-5)] transition-colors bg-surface-raised">
                <Upload size={32} className="text-fg-tertiary" />
                <div className="text-center">
                  <p className="text-base font-semibold text-fg-primary">點擊或拖曳到此上傳檔案</p>
                  <p className="text-sm text-fg-tertiary mt-0.5">Excel 檔案筆數不得超過 5000 筆。</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setFileName(file.name)
                      setPhase('loading')
                    }
                    e.target.value = ''
                  }}
                />
              </label>
              {/* Selected file */}
              {fileName && (
                <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-[var(--color-blue-6)]">
                  <Paperclip size={14} className="text-fg-tertiary shrink-0" />
                  <span className="text-sm text-[var(--color-blue-6)] flex-1 truncate underline">{fileName}</span>
                  <button
                    onClick={() => setFileName(null)}
                    className="p-1 rounded text-fg-tertiary hover:text-error-default transition-colors"
                    aria-label="移除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogBody>
        {phase === 'loading' && (
          <DialogFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={handleClose}>取消</Button>
              <Button disabled>新增</Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── AddItemModal ─────────────────────────────────────────────

function AddItemModal({
  open,
  onClose,
  onSubmit,
  invoiceNumber,
  invoiceNo,
  seqNum,
  initialTotal = '',
}: {
  open: boolean
  onClose: () => void
  onSubmit: (item: PaymentItem) => void
  invoiceNumber: string
  invoiceNo: string
  seqNum: number
  initialTotal?: string
}) {
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [costCenter, setCostCenter] = useState('')
  const [accountCode, setAccountCode] = useState('')
  const [description, setDescription] = useState('')
  const [total, setTotal] = useState(initialTotal)
  const [taxRate, setTaxRate] = useState('')
  const [taxAmount, setTaxAmount] = useState('0')
  const [contractProvided, setContractProvided] = useState<'yes' | 'no' | 'not-required'>('not-required')
  const [submitted, setSubmitted] = useState(false)

  const subCategoryOptions = category
    ? (CATEGORIES[category] ?? []).map(s => ({ value: s, label: s }))
    : []

  function handleClose() {
    setCategory('')
    setSubCategory('')
    setCostCenter('')
    setAccountCode('')
    setDescription('')
    setTotal(initialTotal)
    setTaxRate('')
    setTaxAmount('0')
    setContractProvided('not-required')
    setSubmitted(false)
    onClose()
  }

  function handleSubmit() {
    setSubmitted(true)
    if (!category || !subCategory || !costCenter || !total) return
    const contractLabel = contractProvided === 'yes' ? '是' : contractProvided === 'no' ? '否' : '無須提供'
    onSubmit({
      id: String(Date.now()), seq: seqNum, category, subCategory, costCenter, accountCode,
      accountName: ACCT_NAME_MAPPING[accountCode] ?? '',
      description, total, taxRate, taxAmount,
      contractProvided: contractLabel,
      contractInfo: contractProvided === 'not-required' ? '-' : '',
    })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent maxWidth={600} autoHeight>
        <DialogHeader>
          <DialogTitle>新增付款細項</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            {/* Info bar */}
            <div className="grid grid-cols-3 gap-4 bg-surface-raised border border-divider rounded-lg px-4 py-3 text-sm">
              <div>
                <p className="text-fg-tertiary text-xs mb-0.5">請款單號</p>
                <p className="text-fg-primary font-medium">{invoiceNumber}</p>
              </div>
              <div>
                <p className="text-fg-tertiary text-xs mb-0.5">發票號碼</p>
                <p className="text-fg-primary font-medium">{invoiceNo || '-'}</p>
              </div>
              <div>
                <p className="text-fg-tertiary text-xs mb-0.5">序號</p>
                <p className="text-fg-primary font-medium">{seqNum}</p>
              </div>
            </div>
            {/* 注意事項 */}
            <Alert
              variant="info"
              title="注意事項"
              description={
                <>
                  自 2026/12/31 起「國內出差」、「現金獎金」、「QIF」、「銀行自動扣款」已移至首頁/專區，如有需求請前往
                  <span className="text-[var(--color-blue-6)] underline cursor-pointer">專區</span>
                  請款。
                </>
              }
            />
            {/* 分類 / 子分類 */}
            <div className="grid grid-cols-2 gap-4">
              <Field invalid={submitted && !category}>
                <FieldLabel required>分類</FieldLabel>
                <Select
                  placeholder="請選擇"
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={v => { setCategory(v as string); setSubCategory(''); setAccountCode('') }}
                />
                {submitted && !category && <FieldError>請選擇分類</FieldError>}
              </Field>
              <Field invalid={submitted && !!category && !subCategory}>
                <FieldLabel required>子分類</FieldLabel>
                <Select
                  placeholder="請選擇"
                  options={subCategoryOptions}
                  value={subCategory}
                  disabled={!category}
                  onChange={v => {
                    setSubCategory(v as string)
                    setAccountCode(ACCT_MAPPING[category]?.[v as string] ?? '')
                  }}
                />
                {submitted && !!category && !subCategory && <FieldError>請選擇子分類</FieldError>}
              </Field>
            </div>
            {/* 成本中心 / 會計科目 */}
            <div className="grid grid-cols-2 gap-4">
              <Field invalid={submitted && !costCenter}>
                <FieldLabel required>
                  成本中心 <InfoTooltip content="請填寫您的成本中心編號" />
                </FieldLabel>
                <Input value={costCenter} onChange={e => setCostCenter(e.target.value)} placeholder="填寫成本中心" />
                {submitted && !costCenter && <FieldError>請填寫成本中心</FieldError>}
              </Field>
              <Field disabled={!!(category && subCategory && ACCT_MAPPING[category]?.[subCategory])}>
                <FieldLabel>
                  會計科目 <InfoTooltip content="依子分類自動帶入" />
                </FieldLabel>
                <Input value={accountCode ? `${accountCode}（${ACCT_NAME_MAPPING[accountCode] ?? ''}）` : ''} readOnly placeholder="依子分類自動帶入" />
              </Field>
            </div>
            {/* 總額 / 稅率 / 稅額 */}
            <div className="grid grid-cols-3 gap-4">
              <Field invalid={submitted && !total}>
                <FieldLabel required>總額</FieldLabel>
                <Input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="填寫總額" />
                {submitted && !total && <FieldError>請填寫總額</FieldError>}
              </Field>
              <Field>
                <FieldLabel>
                  稅率 <InfoTooltip content="依憑證類型選擇稅率" />
                </FieldLabel>
                <Select placeholder="請選擇" options={TAX_RATES} value={taxRate} onChange={v => setTaxRate(v as string)} />
              </Field>
              <Field>
                <FieldLabel>稅額</FieldLabel>
                <Input type="number" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} placeholder="" />
              </Field>
            </div>
            {/* 合約編號 */}
            <div>
              <p className="text-sm text-fg-secondary mb-2">是否提供合約編號</p>
              <RadioGroup
                value={contractProvided}
                onValueChange={v => setContractProvided(v as 'yes' | 'no' | 'not-required')}
                className="flex items-center gap-4"
              >
                <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <RadioGroupItem value="yes" />是
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <RadioGroupItem value="no" />否
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <RadioGroupItem value="not-required" />無需提供
                </label>
              </RadioGroup>
            </div>
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

// ─── AddInvoiceBModal (Scenario B) ───────────────────────────

function AddInvoiceBModal({
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
  const [vendorValue, setVendorValue] = useState('')
  const [voucherType, setVoucherType] = useState('')
  const [date, setDate] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [currency, setCurrency] = useState('TWD')
  const [subtotal, setSubtotal] = useState('')
  const [tax, setTax] = useState('0')
  const [taxId, setTaxId] = useState('')
  const [incomeType, setIncomeType] = useState('')
  const [exemptAmount, setExemptAmount] = useState('')
  const [usePartialAmount, setUsePartialAmount] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)
  const [rateUpdateTime, setRateUpdateTime] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const invoiceNumber = `PAGE${today.getFullYear()}${mm}${dd}001-1`
  const RATE_UPDATE_DATE = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`
  const EXCHANGE_RATES: Record<string, number> = {
    TWD: 1, USD: 32.51, JPY: 0.2198, EUR: 35.47, HKD: 4.17, SGD: 24.23,
    GBP: 41.38, CHF: 36.82, MYR: 7.31, AUD: 20.48, SEK: 3.12,
    CAD: 23.76, KRW: 0.0234, NOK: 2.98, RMB: 4.49,
  }
  const isEInvoice = voucherType === 'e-invoice-25'
  const taxAfterNum = subtotal !== '' && tax !== '' ? Number(subtotal) + Number(tax) : null
  const taxAfterDisplay = taxAfterNum !== null ? taxAfterNum.toLocaleString() : '-'
  const rate = EXCHANGE_RATES[currency] ?? 1
  const localTaxAfterDisplay = taxAfterNum !== null
    ? (currency === 'TWD' ? taxAfterNum.toLocaleString() : Math.round(taxAfterNum * rate).toLocaleString())
    : '-'
  const rateDisplay = currency === 'TWD' ? '-' : rate.toFixed(4)

  function handleInvoiceNoChange(value: string) {
    const normalized = value.replace(/-/g, '').toUpperCase()
    setInvoiceNo(value)
    if (isEInvoice && /^[A-Z]{2}\d{8}$/.test(normalized)) {
      const seed = parseInt(normalized.slice(-4), 10)
      const mockSubtotal = String(Math.round((seed % 9 + 1) * 1000))
      const mockTax = String(Math.round(Number(mockSubtotal) * 0.05))
      setSubtotal(mockSubtotal); setTax(mockTax); setAutoFilled(true)
      const now = new Date()
      setRateUpdateTime(`${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
    } else if (autoFilled) {
      setAutoFilled(false); setRateUpdateTime(''); setSubtotal(''); setTax('')
    }
  }

  function handleClose() {
    setVendorValue(''); setVoucherType(''); setDate('')
    setInvoiceNo(''); setCurrency('TWD'); setSubtotal(''); setTax('')
    setTaxId(''); setIncomeType(''); setExemptAmount(''); setUsePartialAmount(false)
    setAutoFilled(false); setRateUpdateTime(''); setSubmitted(false); onClose()
  }

  function handleNext() {
    setSubmitted(true)
    const needVendor = parentPayee === '廠商' && !vendorValue
    if (!voucherType || !date || !subtotal || needVendor) return
    const payeeName = parentPayee === '員工' ? '林間宜 (023156)' : vendorValue
    onSubmit({
      id: String(Date.now()), number: invoiceNumber, payee: payeeName,
      date: date || `${today.getFullYear()}/${mm}/${dd}`,
      invoiceNo, currency, subtotal: subtotal || '0', tax: tax || '0', voucherType,
    })
    handleClose()
    toast({ variant: 'success', title: '新增成功' })
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent maxWidth={754}>
        <DialogHeader><DialogTitle>新增發票</DialogTitle></DialogHeader>
        <DialogBody>
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

            <Field mode={parentPayee === '廠商' ? undefined : 'readonly'} invalid={submitted && parentPayee === '廠商' && !vendorValue}>
              <FieldLabel required={parentPayee === '廠商'}>收款人/廠商</FieldLabel>
              {parentPayee === '廠商' ? (
                <Select searchable placeholder="搜尋廠商名稱" options={VENDOR_OPTIONS} value={vendorValue} onChange={v => setVendorValue(v as string)} />
              ) : (
                <Input value="林間宜 (023156)" readOnly />
              )}
              {submitted && parentPayee === '廠商' && !vendorValue && <FieldError>請選擇收款廠商</FieldError>}
            </Field>

            <Field invalid={submitted && !voucherType}>
              <FieldLabel required>憑證類型</FieldLabel>
              <Select placeholder="請選擇" options={VOUCHER_TYPES} value={voucherType} onChange={v => {
                setAutoFilled(false); setRateUpdateTime('')
                setVoucherType(v as string); setInvoiceNo(''); setCurrency('TWD'); setSubtotal(''); setTax('')
              }} />
              {submitted && !voucherType && <FieldError>請選擇憑證類型</FieldError>}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field invalid={submitted && !date}>
                <FieldLabel required>日期</FieldLabel>
                <DatePicker value={date || null} onChange={v => setDate(v)} clearable placeholder="YYYY/MM/DD" />
                {submitted && !date && <FieldError>請填寫日期</FieldError>}
              </Field>
              <Field>
                <FieldLabel required={isEInvoice}>發票號碼</FieldLabel>
                <Input value={invoiceNo} onChange={e => handleInvoiceNoChange(e.target.value)} placeholder={isEInvoice ? '例：AB12345678' : '填寫發票號碼'} />
              </Field>
            </div>

            <Field disabled={autoFilled}>
              <FieldLabel required>幣別</FieldLabel>
              <Select options={CURRENCY_OPTIONS} value={currency} onChange={v => {
                const cur = v as string; setCurrency(cur)
                setRateUpdateTime(cur === 'TWD' ? '' : RATE_UPDATE_DATE)
              }} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field disabled={autoFilled} invalid={submitted && !autoFilled && !subtotal}>
                <FieldLabel required>合計金額（未稅）</FieldLabel>
                <Input type="number" value={subtotal} onChange={e => setSubtotal(e.target.value)} />
                {submitted && !autoFilled && !subtotal && <FieldError>請填寫金額</FieldError>}
              </Field>
              <Field disabled={autoFilled}>
                <FieldLabel>稅額</FieldLabel>
                <Input type="number" value={tax} onChange={e => setTax(e.target.value)} />
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
                <span className="text-fg-primary font-medium ml-1">{localTaxAfterDisplay}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-fg-tertiary">更新時間</span>
                <span className="font-medium">{rateUpdateTime || '-'}</span>
              </div>
            </div>

            {parentPayee === '員工' ? (
              <div className="grid grid-cols-2 gap-4">
                <Field><FieldLabel>稅號</FieldLabel><Input value={taxId} onChange={e => setTaxId(e.target.value)} /></Field>
                <Field><FieldLabel>二代健保</FieldLabel><Input value="-" readOnly /></Field>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field><FieldLabel>收入類型</FieldLabel><Input value={incomeType} onChange={e => setIncomeType(e.target.value)} /></Field>
                  <Field>
                    <FieldLabel>免稅額</FieldLabel>
                    <Select placeholder="請選擇" options={[{ value: '0', label: '無' }, { value: 'partial', label: '部分免稅' }, { value: 'full', label: '全額免稅' }]} value={exemptAmount} onChange={v => setExemptAmount(v as string)} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field><FieldLabel>預扣金額</FieldLabel><Input disabled value="" /></Field>
                  <Field><FieldLabel>二代健保</FieldLabel><Input value="-" readOnly /></Field>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Checkbox id="partial-b" checked={usePartialAmount} onCheckedChange={v => setUsePartialAmount(!!v)} />
              <label htmlFor="partial-b" className="text-sm cursor-pointer select-none">使用不足額請款</label>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleClose}>取消</Button>
            <Button onClick={handleNext}>下一步</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── AddItemBModal (Scenario B) ───────────────────────────────

function AddItemBModal({
  open, onClose, onSubmit, invoiceNumber, invoiceNo, seqNum,
}: {
  open: boolean; onClose: () => void; onSubmit: (item: PaymentItem) => void
  invoiceNumber: string; invoiceNo: string; seqNum: number
}) {
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [costCenter, setCostCenter] = useState('')
  const [accountCode, setAccountCode] = useState('')
  const [description, setDescription] = useState('')
  const [total, setTotal] = useState('')
  const [taxRate, setTaxRate] = useState('')
  const [contractProvided, setContractProvided] = useState<'yes' | 'no' | 'not-required'>('not-required')
  const subCategoryOptions = category ? (CATEGORIES[category] ?? []).map(s => ({ value: s, label: s })) : []
  const [submitted, setSubmitted] = useState(false)

  function handleClose() {
    setCategory(''); setSubCategory(''); setCostCenter(''); setAccountCode('')
    setDescription(''); setTotal(''); setTaxRate(''); setContractProvided('not-required')
    setSubmitted(false)
    onClose()
  }

  function handleSave() {
    setSubmitted(true)
    if (!category || !subCategory || !costCenter || !total) return
    const contractLabel = contractProvided === 'yes' ? '是' : contractProvided === 'no' ? '否' : '無須提供'
    const computedTaxAmount = taxRate && total && taxRate !== 'exempt'
      ? String(Math.round(Number(total) * Number(taxRate) / 100))
      : '0'
    onSubmit({
      id: String(Date.now()), seq: seqNum, category, subCategory, costCenter, accountCode,
      accountName: ACCT_NAME_MAPPING[accountCode] ?? '',
      description, total, taxRate: taxRate || '0', taxAmount: computedTaxAmount,
      contractProvided: contractLabel,
      contractInfo: contractProvided === 'not-required' ? '-' : '',
    })
    handleClose()
    toast({ variant: 'success', title: '新增成功' })
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent maxWidth={600} autoHeight>
        <DialogHeader><DialogTitle>新增細項</DialogTitle></DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 bg-surface-raised border border-divider rounded-lg px-4 py-3 text-sm">
              <div><p className="text-fg-tertiary text-xs mb-0.5">請款單號</p><p className="text-fg-primary font-medium">{invoiceNumber}</p></div>
              <div><p className="text-fg-tertiary text-xs mb-0.5">發票號碼</p><p className="text-fg-primary font-medium">{invoiceNo || '-'}</p></div>
              <div><p className="text-fg-tertiary text-xs mb-0.5">序號</p><p className="text-fg-primary font-medium">{seqNum}</p></div>
            </div>
            <Alert variant="info" title="注意事項" description={<>自 2026/12/31 起「國內出差」、「現金獎金」、「QIF」、「銀行自動扣款」已移至首頁/專區，如有需求請前往<span className="text-[var(--color-blue-6)] underline cursor-pointer">專區</span>請款。</>} />
            <div className="grid grid-cols-2 gap-4">
              <Field invalid={submitted && !category}>
                <FieldLabel required>分類</FieldLabel>
                <Select placeholder="請選擇" options={CATEGORY_OPTIONS} value={category} onChange={v => { setCategory(v as string); setSubCategory(''); setAccountCode('') }} />
                {submitted && !category && <FieldError>請選擇分類</FieldError>}
              </Field>
              <Field invalid={submitted && !!category && !subCategory}>
                <FieldLabel required>子分類</FieldLabel>
                <Select placeholder="請選擇" options={subCategoryOptions} value={subCategory} disabled={!category} onChange={v => { setSubCategory(v as string); setAccountCode(ACCT_MAPPING[category]?.[v as string] ?? '') }} />
                {submitted && !!category && !subCategory && <FieldError>請選擇子分類</FieldError>}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field invalid={submitted && !costCenter}>
                <FieldLabel required>成本中心 <InfoTooltip content="請填寫您的成本中心編號" /></FieldLabel>
                <Input value={costCenter} onChange={e => setCostCenter(e.target.value)} placeholder="填寫成本中心" />
                {submitted && !costCenter && <FieldError>請填寫成本中心</FieldError>}
              </Field>
              <Field disabled={!!(category && subCategory && ACCT_MAPPING[category]?.[subCategory])}>
                <FieldLabel>會計科目 <InfoTooltip content="依子分類自動帶入" /></FieldLabel>
                <Input value={accountCode ? `${accountCode}（${ACCT_NAME_MAPPING[accountCode] ?? ''}）` : ''} readOnly placeholder="依子分類自動帶入" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field invalid={submitted && !total}><FieldLabel required>總額</FieldLabel><Input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="填寫總額" />{submitted && !total && <FieldError>請填寫總額</FieldError>}</Field>
              <Field>
                <FieldLabel>稅率 <InfoTooltip content="依憑證類型選擇稅率" /></FieldLabel>
                <Select placeholder="請選擇" options={TAX_RATES} value={taxRate} onChange={v => setTaxRate(v as string)} />
              </Field>
              <Field>
                <FieldLabel>稅額</FieldLabel>
                <Input disabled value={taxRate && total && taxRate !== 'exempt' ? String(Math.round(Number(total) * Number(taxRate) / 100)) : '0'} placeholder="" />
              </Field>
            </div>
            <div>
              <p className="text-sm text-fg-secondary mb-2">是否提供合約編號</p>
              <RadioGroup value={contractProvided} onValueChange={v => setContractProvided(v as 'yes' | 'no' | 'not-required')} className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-sm"><RadioGroupItem value="yes" />是</label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm"><RadioGroupItem value="no" />否</label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm"><RadioGroupItem value="not-required" />無需提供</label>
              </RadioGroup>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleClose}>取消</Button>
            <Button onClick={handleSave}>儲存並關閉</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── EditItemModal ────────────────────────────────────────────

function EditItemModal({
  open,
  onClose,
  invoiceNumber,
  invoiceNo,
  seqNum,
}: {
  open: boolean
  onClose: () => void
  invoiceNumber: string
  invoiceNo: string
  seqNum: number
}) {
  const MOCK_CATEGORY = '小型工具/物品、電腦/手機週邊、辦公家具'
  const MOCK_SUB = '電子標準化軟體(非雲端服務/無雙方互動，如：adobe、字體、輸入法..等)'
  const [category, setCategory] = useState(MOCK_CATEGORY)
  const [subCategory, setSubCategory] = useState(MOCK_SUB)
  const [costCenter, setCostCenter] = useState('00690')
  const [accountCode, setAccountCode] = useState('613000')
  const [description, setDescription] = useState('')
  const [total, setTotal] = useState('100')
  const [taxRate, setTaxRate] = useState('0')
  const [taxAmount, setTaxAmount] = useState('0')
  const [contractProvided, setContractProvided] = useState<'yes' | 'no' | 'not-required'>('not-required')

  const subCategoryOptions = category
    ? (CATEGORIES[category] ?? []).map(s => ({ value: s, label: s }))
    : []

  function handleClose() { onClose() }

  return (
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent maxWidth={600} autoHeight>
        <DialogHeader>
          <DialogTitle>編輯付款細項</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 bg-surface-raised border border-divider rounded-lg px-4 py-3 text-sm">
              <div>
                <p className="text-fg-tertiary text-xs mb-0.5">請款單號</p>
                <p className="text-fg-primary font-medium">{invoiceNumber}</p>
              </div>
              <div>
                <p className="text-fg-tertiary text-xs mb-0.5">發票號碼</p>
                <p className="text-fg-primary font-medium">{invoiceNo || '-'}</p>
              </div>
              <div>
                <p className="text-fg-tertiary text-xs mb-0.5">序號</p>
                <p className="text-fg-primary font-medium">{seqNum}</p>
              </div>
            </div>
            <Alert
              variant="info"
              title="注意事項"
              description={
                <>
                  自 2026/12/31 起「國內出差」、「現金獎金」、「QIF」、「銀行自動扣款」已移至首頁/專區，如有需求請前往
                  <span className="text-[var(--color-blue-6)] underline cursor-pointer">專區</span>
                  請款。
                </>
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel required>分類</FieldLabel>
                <Select
                  placeholder="請選擇"
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={v => { setCategory(v as string); setSubCategory(''); setAccountCode('') }}
                />
              </Field>
              <Field>
                <FieldLabel required>子分類</FieldLabel>
                <Select
                  placeholder="請選擇"
                  options={subCategoryOptions}
                  value={subCategory}
                  disabled={!category}
                  onChange={v => {
                    setSubCategory(v as string)
                    setAccountCode(ACCT_MAPPING[category]?.[v as string] ?? '')
                  }}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel required>
                  成本中心 <InfoTooltip content="請填寫您的成本中心編號" />
                </FieldLabel>
                <Input value={costCenter} onChange={e => setCostCenter(e.target.value)} />
              </Field>
              <Field disabled={!!(category && subCategory && ACCT_MAPPING[category]?.[subCategory])}>
                <FieldLabel>
                  會計科目 <InfoTooltip content="依子分類自動帶入" />
                </FieldLabel>
                <Input value={accountCode} onChange={e => setAccountCode(e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel>描述</FieldLabel>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="填寫描述" />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel required>總額</FieldLabel>
                <Input type="number" value={total} onChange={e => setTotal(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>
                  稅率 <InfoTooltip content="依憑證類型選擇稅率" />
                </FieldLabel>
                <Select placeholder="請選擇" options={TAX_RATES} value={taxRate} onChange={v => setTaxRate(v as string)} />
              </Field>
              <Field>
                <FieldLabel>稅額</FieldLabel>
                <Input type="number" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} />
              </Field>
            </div>
            <div>
              <p className="text-sm text-fg-secondary mb-2">是否提供合約編號</p>
              <RadioGroup
                value={contractProvided}
                onValueChange={v => setContractProvided(v as 'yes' | 'no' | 'not-required')}
                className="flex items-center gap-4"
              >
                <label className="flex items-center gap-1.5 cursor-pointer text-sm"><RadioGroupItem value="yes" />是</label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm"><RadioGroupItem value="no" />否</label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm"><RadioGroupItem value="not-required" />無需提供</label>
              </RadioGroup>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={handleClose}>取消</Button>
            <Button onClick={handleClose}>更新</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── DeleteItemModal ──────────────────────────────────────────

function DeleteItemModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent maxWidth={480} autoHeight>
        <DialogHeader>
          <DialogTitle>是否刪除付款細項</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-fg-secondary">
            刪除後此筆付款細項資料將無法保留，是否仍要刪除？
          </p>
        </DialogBody>
        <DialogFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button variant="primary" danger onClick={onConfirm}>刪除細項</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


// ─── EditInvoiceModal ────────────────────────────────────────

function EditInvoiceModal({
  open,
  onClose,
  invoice,
  onUpdate,
  isModifying = false,
}: {
  open: boolean
  onClose: () => void
  invoice: Invoice
  onUpdate: (inv: Invoice) => void
  isModifying?: boolean
}) {
  const [voucherType, setVoucherType] = useState(invoice.voucherType)
  const [date, setDate] = useState(invoice.date)
  const [invoiceNo, setInvoiceNo] = useState(invoice.invoiceNo)
  const [subtotal, setSubtotal] = useState(invoice.subtotal)
  const [tax, setTax] = useState(invoice.tax || '0')

  const taxAfterNum = subtotal && tax ? Number(subtotal) + Number(tax) : null
  const rate = invoice.currency === 'TWD' ? 1 : 32.51

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <DialogTitle>編輯發票</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {/* Info row: 請款單號 + 狀態 */}
          <div className="flex gap-2 bg-surface-raised border border-divider rounded-md px-4 py-2 text-sm">
            <div className="flex-1 space-y-0.5">
              <p className="text-fg-tertiary">請款單號</p>
              <p className="text-fg-primary font-medium">{invoice.number}</p>
            </div>
            <div className="w-px bg-divider shrink-0" />
            <div className="flex-1 space-y-0.5">
              <p className="text-fg-tertiary">狀態</p>
              {isModifying ? (
                <Tag color="yellow" size="sm">修改中</Tag>
              ) : (
                <Tag color="neutral" size="sm">Draft</Tag>
              )}
            </div>
          </div>

          {/* 收款人/廠商 readonly */}
          <div className="grid grid-cols-2 gap-3">
            <Field mode="readonly">
              <FieldLabel required>收款人/廠商</FieldLabel>
              <Input value={invoice.payee} readOnly />
            </Field>
          </div>

          {/* 憑證類型 */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel required>憑證類型</FieldLabel>
              <Select options={VOUCHER_TYPES} value={voucherType} onChange={v => setVoucherType(v as string)} />
            </Field>
          </div>

          {/* 日期 + 發票號碼 */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel required>日期</FieldLabel>
              <DatePicker value={date || null} onChange={v => setDate(v)} placeholder="請選擇日期" />
            </Field>
            <Field>
              <FieldLabel>發票號碼</FieldLabel>
              <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="填寫發票號碼" />
            </Field>
          </div>

          {/* 幣別 readonly */}
          <div className="grid grid-cols-2 gap-3">
            <Field mode="readonly">
              <FieldLabel required>幣別</FieldLabel>
              <Select mode="readonly" options={CURRENCY_OPTIONS} value={invoice.currency} onChange={() => {}} />
            </Field>
          </div>

          {/* 合計金額 + 稅額 */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel required>合計金額（未稅）</FieldLabel>
              <Input type="number" value={subtotal} onChange={e => setSubtotal(e.target.value)} placeholder="0" />
            </Field>
            <Field>
              <FieldLabel>稅額&nbsp;<InfoTooltip content="稅額依憑證類型計算" /></FieldLabel>
              <Input type="number" value={tax} onChange={e => setTax(e.target.value)} placeholder="0" />
            </Field>
          </div>

          {/* 稅後金額 summary */}
          <div className="flex gap-2 bg-surface-raised border border-divider rounded-md px-4 py-2 text-sm">
            <div className="flex-1 space-y-0.5">
              <p className="text-fg-secondary">稅後金額</p>
              <p className="text-fg-primary font-medium">{invoice.currency} {taxAfterNum !== null ? taxAfterNum.toLocaleString() : '-'}</p>
              <p className="text-fg-tertiary text-xs">實發金額&nbsp;<InfoTooltip content="實發金額 = 稅後金額 × 匯率" />&nbsp;{invoice.currency} {taxAfterNum !== null ? taxAfterNum.toLocaleString() : '-'}</p>
            </div>
            <div className="w-px bg-divider shrink-0" />
            <div className="flex-1 space-y-0.5">
              <p className="text-fg-secondary">匯率</p>
              <p className="text-fg-primary font-medium">{rate}</p>
              <p className="text-fg-tertiary text-xs">更新時間 {new Date().getFullYear()}/5/26 9:00</p>
            </div>
          </div>

          {/* 稅號 + 二代健保 */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>稅號&nbsp;<InfoTooltip content="統一編號" /></FieldLabel>
              <Input placeholder="" />
            </Field>
            <Field mode="readonly">
              <FieldLabel>二代健保</FieldLabel>
              <Input value="0" readOnly />
            </Field>
          </div>

          {/* 使用不足額請款 */}
          <div className="flex items-center gap-2">
            <Checkbox id="edit-insufficient" />
            <label htmlFor="edit-insufficient" className="text-sm cursor-pointer select-none">使用不足額請款</label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>關閉</Button>
          <Button onClick={() => {
            onUpdate({ ...invoice, voucherType, date, invoiceNo, subtotal, tax })
          }}>更新</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── CreateFormPage ─────────────────────────────────────────────


function CreateFormPage({
  onBack,
  onSubmit,
  mode = 'create',
  editEntry,
}: {
  onBack: () => void
  onSubmit: (newNumber: string) => void
  mode?: 'create' | 'edit'
  editEntry?: DraftEntry
}) {
  const MOCK_EDIT_INVOICES: Invoice[] = [
    { id: 'e1', number: `${editEntry?.number ?? 'PAE20260525001'}-1`, payee: editEntry?.applicant ?? '林間宜 (023156)', date: '2026/05/25', invoiceNo: 'BD28114045', currency: 'TWD', subtotal: '600', tax: '0', voucherType: 'e-invoice-25' },
    { id: 'e2', number: `${editEntry?.number ?? 'PAE20260525001'}-2`, payee: editEntry?.applicant ?? '林間宜 (023156)', date: '2026/05/25', invoiceNo: 'BD28114045', currency: 'TWD', subtotal: '4000', tax: '0', voucherType: 'e-invoice-25' },
  ]
  const MOCK_EDIT_ATTACHMENTS: Attachment[] = [
    { id: 'ea1', type: 'invoice', desc: '-', files: [{ id: 'f1', name: 'Computer-invoice.Png' }] },
    { id: 'ea2', type: 'auxiliary', desc: '-', files: [{ id: 'f2', name: 'Supportdoc.Png' }] },
  ]
  const isEdit = mode === 'edit'
  const isModifying = editEntry?.status === 'modifying'
  const [payee, setPayee] = useState(editEntry?.payee ?? '員工')
  const [reason, setReason] = useState(editEntry?.reason !== '-' ? (editEntry?.reason ?? '') : '')
  const [useUrgentDate, setUseUrgentDate] = useState(editEntry?.urgentDate !== '-' && !!editEntry?.urgentDate)
  const [urgentDate, setUrgentDate] = useState(editEntry?.urgentDate !== '-' ? (editEntry?.urgentDate ?? '') : '')
  const [invoices, setInvoices] = useState<Invoice[]>(isEdit ? MOCK_EDIT_INVOICES : [])
  const [attachments, setAttachments] = useState<Attachment[]>(isEdit ? MOCK_EDIT_ATTACHMENTS : [])
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false)
  const [editAttachmentTarget, setEditAttachmentTarget] = useState<Attachment | null>(null)
  const [deleteAttachmentTarget, setDeleteAttachmentTarget] = useState<string | null>(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [batchImportInvoiceId, setBatchImportInvoiceId] = useState<string | null>(null)
  const [addItemInvoiceId, setAddItemInvoiceId] = useState<string | null>(null)
  const [editItemTarget, setEditItemTarget] = useState<{ invoiceId: string; seq: number } | null>(null)
  const [deleteItemTarget, setDeleteItemTarget] = useState<{ invoiceId: string; seq: number } | null>(null)
  const [editInvoiceTarget, setEditInvoiceTarget] = useState<Invoice | null>(null)
  const [deleteInvoiceTarget, setDeleteInvoiceTarget] = useState<string | null>(null)
  const [scenarioBMode, setScenarioBMode] = useState(false)
  const [bInvoices, setBInvoices] = useState<Invoice[]>([])
  const [bItemsMap, setBItemsMap] = useState<Record<string, PaymentItem[]>>({})
  const [bEditItemTarget, setBEditItemTarget] = useState<{ invoiceId: string; seq: number } | null>(null)
  const [addInvoiceBOpen, setAddInvoiceBOpen] = useState(false)
  const [addItemBInvoiceId, setAddItemBInvoiceId] = useState<string | null>(null)
  const MOCK_PAYMENT_ITEMS: PaymentItem[] = [
    { id: 'pi1', seq: 1, category: '小型工具/物品、電腦/手機週邊、辦公家具', subCategory: '電子標準化軟體(非雲端服務/無雙方互動，如：adobe、字體、輸入法..等)', costCenter: '00690', accountCode: '613000', accountName: '會議相關費用', description: '-', total: '100', taxRate: '0', taxAmount: '0', contractProvided: '無須提供', contractInfo: '-' },
    { id: 'pi2', seq: 2, category: '小型工具/物品、電腦/手機週邊、辦公家具', subCategory: '電子標準化軟體(非雲端服務/無雙方互動，如：adobe、字體、輸入法..等)', costCenter: '00690', accountCode: '613000', accountName: '會議相關費用', description: '-', total: '100', taxRate: '0', taxAmount: '0', contractProvided: '無須提供', contractInfo: '-' },
    { id: 'pi3', seq: 3, category: '小型工具/物品、電腦/手機週邊、辦公家具', subCategory: '電子標準化軟體(非雲端服務/無雙方互動，如：adobe、字體、輸入法..等)', costCenter: '00690', accountCode: '613000', accountName: '會議相關費用', description: '-', total: '200', taxRate: '0', taxAmount: '0', contractProvided: '無須提供', contractInfo: '-' },
  ]
  const [paymentItemsMap, setPaymentItemsMap] = useState<Record<string, PaymentItem[]>>(
    isEdit ? { e1: MOCK_PAYMENT_ITEMS.map(i => ({ ...i })), e2: MOCK_PAYMENT_ITEMS.map(i => ({ ...i })) } : {}
  )
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<Set<string>>(isEdit ? new Set(['e2']) : new Set())

  function toggleInvoiceExpand(id: string) {
    setExpandedInvoiceIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  function handleUpdateInvoice(id: string, updated: Invoice) {
    setInvoices(prev => prev.map(i => i.id === id ? { ...updated, id } : i))
  }

  function handleAddAttachment(att: Omit<Attachment, 'id'>) {
    setAttachments(prev => [...prev, { ...att, id: String(Date.now()) }])
  }

  function handleRemoveAttachment(id: string) {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  function handleUpdateAttachment(id: string, updated: Omit<Attachment, 'id'>) {
    setAttachments(prev => prev.map(a => a.id === id ? { ...updated, id } : a))
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
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-divider overflow-hidden text-sm font-medium">
            <button
              onClick={() => setScenarioBMode(false)}
              className={`px-3 py-1.5 transition-colors ${!scenarioBMode ? 'bg-[var(--color-blue-6)] text-white' : 'text-fg-secondary hover:bg-surface-raised'}`}
            >
              流程 A
            </button>
            <button
              onClick={() => setScenarioBMode(true)}
              className={`px-3 py-1.5 transition-colors ${scenarioBMode ? 'bg-[var(--color-blue-6)] text-white' : 'text-fg-secondary hover:bg-surface-raised'}`}
            >
              流程 B
            </button>
          </div>
          <Button variant="tertiary" startIcon={Upload} disabled>批次匯入申請</Button>
        </div>
      </div>

      {/* Form sections */}
      <div className="space-y-4 max-w-[860px]">

        {/* 基本資訊 */}
        <section className="bg-surface border border-divider rounded-lg p-6">
          <h2 className="text-base font-semibold mb-4">付款資訊</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field mode="readonly">
                <FieldLabel>
                  公司代號&nbsp;<InfoTooltip content="Company Code" />
                </FieldLabel>
                <Select
                  mode="readonly"
                  value="TA01"
                  options={[{ value: 'TA01', label: 'TA01' }]}
                  onChange={() => {}}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field mode="readonly">
                <FieldLabel>
                  申請人 <InfoTooltip content="自動帶入登入者" />
                </FieldLabel>
                <Input value="林間宜 (023156)" readOnly />
              </Field>
              <Field mode={isModifying ? 'readonly' : undefined}>
                <FieldLabel required>
                  收款對象&nbsp;<InfoTooltip content="請選擇本次請款的收款對象" />
                </FieldLabel>
                <Select
                  mode={isModifying ? 'readonly' : undefined}
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
          {!scenarioBMode ? (
            <>
              <Button variant="tertiary" startIcon={Plus} onClick={() => setInvoiceModalOpen(true)}>
                新增請款
              </Button>
              {invoices.length === 0 ? (
                <div className="mt-4 rounded-lg border border-divider py-12 text-center text-sm text-fg-tertiary">
                  沒有任何資料
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {invoices.map(inv => {
                    const isExpanded = expandedInvoiceIds.has(inv.id)
                    const VOUCHER_LABEL: Record<string, string> = {
                      'e-invoice-25': '電子統一發票 (25)',
                      'paper-invoice': '紙本統一發票',
                    }
                    const voucherLabel = VOUCHER_LABEL[inv.voucherType] ?? inv.voucherType
                    return (
                      <div key={inv.id} className="border border-divider rounded-lg overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3">
                          <button onClick={() => toggleInvoiceExpand(inv.id)} className="p-0.5 rounded text-fg-tertiary hover:text-fg-secondary transition-colors shrink-0" aria-label={isExpanded ? '收合' : '展開'}>
                            <ChevronDown size={16} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                          </button>
                          <span className="font-medium text-fg-primary shrink-0">{inv.number}</span>
                          <Tag color="neutral" size="sm">Draft</Tag>
                          <div className="flex-1" />
                          <span className="text-fg-secondary text-sm shrink-0">{inv.currency} {Number(inv.subtotal).toLocaleString()}</span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button className="p-1.5 rounded text-fg-tertiary hover:text-fg-secondary hover:bg-[var(--color-neutral-2)] transition-colors" aria-label="編輯" onClick={() => setEditInvoiceTarget(inv)}><Pencil size={14} /></button>
                            <button className="p-1.5 rounded text-fg-tertiary hover:text-fg-secondary hover:bg-[var(--color-neutral-2)] transition-colors disabled:opacity-40 disabled:pointer-events-none" aria-label="複製" onClick={() => setInvoiceModalOpen(true)} disabled={isModifying}><Copy size={14} /></button>
                            <button className="p-1.5 rounded text-fg-tertiary hover:text-error-default hover:bg-[var(--color-red-1)] transition-colors disabled:opacity-40 disabled:pointer-events-none" aria-label="刪除" onClick={() => setDeleteInvoiceTarget(inv.id)} disabled={isModifying}><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-sm text-fg-tertiary px-4 pb-3">收款人：{inv.payee}&nbsp;|&nbsp;日期：{inv.date}</p>
                        {isExpanded && (
                          <div className="border-t border-divider">
                            <div className="grid grid-cols-4 gap-4 px-4 py-4 bg-surface-raised">
                              <div><p className="text-xs text-fg-tertiary mb-1">憑證類型</p><p className="text-sm text-fg-primary">{voucherLabel}</p></div>
                              <div><p className="text-xs text-fg-tertiary mb-1">發票號碼</p><p className="text-sm text-fg-primary">{inv.invoiceNo || '-'}</p></div>
                              <div><p className="text-xs text-fg-tertiary mb-1">合計金額（未稅）</p><p className="text-sm text-fg-primary">{inv.currency} {Number(inv.subtotal).toLocaleString()}</p></div>
                              <div><p className="text-xs text-fg-tertiary mb-1">稅額</p><p className="text-sm text-fg-primary">{inv.tax || '0'}</p></div>
                            </div>
                            <div className="px-4 py-3">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-fg-primary">
                                  <ClipboardList size={16} className="text-fg-secondary" />
                                  付款細項：{(paymentItemsMap[inv.id] ?? []).length} 項
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="tertiary" size="sm" startIcon={Download} onClick={() => setBatchImportInvoiceId(inv.id)} disabled={isModifying}>批次匯入</Button>
                                  <Button variant="tertiary" size="sm" startIcon={Plus} onClick={() => setAddItemInvoiceId(inv.id)} disabled={isModifying}>新增細項</Button>
                                </div>
                              </div>
                              {(paymentItemsMap[inv.id] ?? []).length === 0 ? (
                                <div className="rounded-lg border border-divider py-8 text-center text-sm text-fg-tertiary">沒有任何資料</div>
                              ) : (
                                <div className="rounded-lg border border-divider overflow-x-auto">
                                  <table className="text-sm" style={{ minWidth: '1100px' }}>
                                    <thead className="bg-surface-raised border-b border-divider">
                                      <tr>
                                        <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 44 }}>序號</th>
                                        <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 240 }}>分類/子分類</th>
                                        <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 96 }}>成本中心</th>
                                        <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 144 }}>會計科目</th>
                                        <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 96 }}>總額</th>
                                        <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 96 }}>稅率</th>
                                        <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 96 }}>稅額</th>
                                        <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 144 }}>是否提供合約編號</th>
                                        <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 160 }}>合約編號/無合約原因</th>
                                        <th className="sticky right-0 bg-surface-raised border-l border-divider px-3 py-2" style={{ width: 88 }}></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-divider">
                                      {(paymentItemsMap[inv.id] ?? []).map(item => (
                                        <tr key={item.id} className="hover:bg-surface-raised transition-colors">
                                          <td className="px-3 py-2 text-fg-secondary">{item.seq}</td>
                                          <td className="px-3 py-2">
                                            <p className="text-fg-primary text-sm truncate">{item.category}</p>
                                            <p className="text-fg-tertiary text-xs truncate mt-0.5">{item.subCategory}</p>
                                          </td>
                                          <td className="px-3 py-2 text-fg-secondary">{item.costCenter}</td>
                                          <td className="px-3 py-2">
                                            <p className="text-fg-primary text-sm">{item.accountCode}</p>
                                            <p className="text-fg-tertiary text-xs mt-0.5">{item.accountName || '-'}</p>
                                          </td>
                                          <td className="px-3 py-2 text-fg-secondary">{item.total}</td>
                                          <td className="px-3 py-2 text-fg-secondary">{item.taxRate}</td>
                                          <td className="px-3 py-2 text-fg-secondary">{item.taxAmount}</td>
                                          <td className="px-3 py-2 text-fg-secondary">{item.contractProvided}</td>
                                          <td className="px-3 py-2 text-fg-secondary">{item.contractInfo}</td>
                                          <td className="sticky right-0 bg-surface border-l border-divider px-3 py-2">
                                            <div className="flex items-center gap-0.5">
                                              <button className="p-1 rounded text-fg-tertiary hover:text-fg-secondary hover:bg-[var(--color-neutral-2)] transition-colors" aria-label="編輯" onClick={() => setEditItemTarget({ invoiceId: inv.id, seq: item.seq })}><Pencil size={13} /></button>
                                              <button className="p-1 rounded text-fg-tertiary hover:text-error-default hover:bg-[var(--color-red-1)] transition-colors disabled:opacity-40 disabled:pointer-events-none" aria-label="刪除" onClick={() => setDeleteItemTarget({ invoiceId: inv.id, seq: item.seq })} disabled={isModifying}><Trash2 size={13} /></button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            /* Scenario B */
            <>
              <Button variant="tertiary" startIcon={Plus} onClick={() => setAddInvoiceBOpen(true)}>
                新增發票
              </Button>
              {bInvoices.length === 0 ? (
                <div className="mt-4 rounded-lg border border-divider py-12 text-center text-sm text-fg-tertiary">
                  沒有任何資料
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {bInvoices.map(inv => {
                    const bItems = bItemsMap[inv.id] ?? []
                    const VOUCHER_LABEL: Record<string, string> = {
                      'e-invoice-25': '電子統一發票 (25)',
                      'paper-invoice': '紙本統一發票',
                    }
                    const voucherLabel = VOUCHER_LABEL[inv.voucherType] ?? inv.voucherType
                    return (
                      <div key={inv.id} className="border border-divider rounded-lg overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3">
                          <span className="font-medium text-fg-primary shrink-0">{inv.number}</span>
                          <Tag color="neutral" size="sm">Draft</Tag>
                          <div className="flex-1" />
                          <span className="text-fg-secondary text-sm shrink-0">{inv.currency} {Number(inv.subtotal).toLocaleString()}</span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button className="p-1.5 rounded text-fg-tertiary hover:text-fg-secondary hover:bg-[var(--color-neutral-2)] transition-colors" aria-label="編輯"><Pencil size={14} /></button>
                            <button className="p-1.5 rounded text-fg-tertiary hover:text-error-default hover:bg-[var(--color-red-1)] transition-colors" aria-label="刪除" onClick={() => setBInvoices(prev => prev.filter(i => i.id !== inv.id))}><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-sm text-fg-tertiary px-4 pb-3">收款人：{inv.payee}&nbsp;|&nbsp;日期：{inv.date}</p>
                        <div className="border-t border-divider grid grid-cols-4 gap-4 px-4 py-4 bg-surface-raised">
                          <div><p className="text-xs text-fg-tertiary mb-1">憑證類型</p><p className="text-sm text-fg-primary">{voucherLabel}</p></div>
                          <div><p className="text-xs text-fg-tertiary mb-1">發票號碼</p><p className="text-sm text-fg-primary">{inv.invoiceNo || '-'}</p></div>
                          <div><p className="text-xs text-fg-tertiary mb-1">合計金額（未稅）</p><p className="text-sm text-fg-primary">{inv.currency} {Number(inv.subtotal).toLocaleString()}</p></div>
                          <div><p className="text-xs text-fg-tertiary mb-1">稅額</p><p className="text-sm text-fg-primary">{inv.tax || '0'}</p></div>
                        </div>
                        <div className="border-t border-divider px-4 py-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-fg-primary">
                              <ClipboardList size={16} className="text-fg-secondary" />
                              付款細項：{bItems.length} 項
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="tertiary" size="sm" startIcon={Download} onClick={() => setBatchImportInvoiceId(inv.id)}>批次匯入</Button>
                              <Button variant="tertiary" size="sm" startIcon={Plus} onClick={() => setAddItemBInvoiceId(inv.id)}>新增細項</Button>
                            </div>
                          </div>
                          {bItems.length === 0 ? (
                            <div className="rounded-lg border border-divider py-8 text-center text-sm text-fg-tertiary">沒有任何資料</div>
                          ) : (
                            <div className="rounded-lg border border-divider overflow-x-auto">
                              <table className="text-sm" style={{ minWidth: '1100px' }}>
                                <thead className="bg-surface-raised border-b border-divider">
                                  <tr>
                                    <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 44 }}>序號</th>
                                    <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 240 }}>分類/子分類</th>
                                    <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 96 }}>成本中心</th>
                                    <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 144 }}>會計科目</th>
                                    <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 96 }}>總額</th>
                                    <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 96 }}>稅率</th>
                                    <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 96 }}>稅額</th>
                                    <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 144 }}>是否提供合約編號</th>
                                    <th className="text-left px-3 py-2 font-medium text-fg-secondary" style={{ width: 160 }}>合約編號/無合約原因</th>
                                    <th className="sticky right-0 bg-surface-raised border-l border-divider px-3 py-2" style={{ width: 88 }}></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-divider">
                                  {bItems.map(item => (
                                    <tr key={item.id} className="hover:bg-surface-raised transition-colors">
                                      <td className="px-3 py-2 text-fg-secondary">{item.seq}</td>
                                      <td className="px-3 py-2">
                                        <p className="text-fg-primary text-sm truncate">{item.category}</p>
                                        <p className="text-fg-tertiary text-xs truncate mt-0.5">{item.subCategory}</p>
                                      </td>
                                      <td className="px-3 py-2 text-fg-secondary">{item.costCenter}</td>
                                      <td className="px-3 py-2">
                                        <p className="text-fg-primary text-sm">{item.accountCode}</p>
                                        <p className="text-fg-tertiary text-xs mt-0.5">{item.accountName || '-'}</p>
                                      </td>
                                      <td className="px-3 py-2 text-fg-secondary">{item.total}</td>
                                      <td className="px-3 py-2 text-fg-secondary">{item.taxRate}</td>
                                      <td className="px-3 py-2 text-fg-secondary">{item.taxAmount}</td>
                                      <td className="px-3 py-2 text-fg-secondary">{item.contractProvided}</td>
                                      <td className="px-3 py-2 text-fg-secondary">{item.contractInfo}</td>
                                      <td className="sticky right-0 bg-surface border-l border-divider px-3 py-2">
                                        <div className="flex items-center gap-0.5">
                                          <button className="p-1 rounded text-fg-tertiary hover:text-fg-secondary hover:bg-[var(--color-neutral-2)] transition-colors" aria-label="編輯" onClick={() => setBEditItemTarget({ invoiceId: inv.id, seq: item.seq })}><Pencil size={13} /></button>
                                          <button className="p-1 rounded text-fg-tertiary hover:text-error-default hover:bg-[var(--color-red-1)] transition-colors" aria-label="刪除" onClick={() => setBItemsMap(prev => ({ ...prev, [inv.id]: (prev[inv.id] ?? []).filter(i => i.id !== item.id).map((i, idx) => ({ ...i, seq: idx + 1 })) }))}><Trash2 size={13} /></button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
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
                          <button className="p-1.5 rounded text-fg-tertiary hover:text-fg-secondary hover:bg-[var(--color-neutral-2)] transition-colors" aria-label="編輯" onClick={() => setEditAttachmentTarget(att)}>
                            <Pencil size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded text-fg-tertiary hover:text-error-default hover:bg-[var(--color-red-1)] transition-colors"
                            aria-label="刪除"
                            onClick={() => setDeleteAttachmentTarget(att.id)}
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
                disabled={isModifying}
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
          {isEdit && !isModifying ? (
            <>
              <Button variant="outline" onClick={onBack}>取消</Button>
              <Button onClick={() => { onBack(); toast({ variant: 'success', title: '申請單已更新' }) }}>更新</Button>
            </>
          ) : (
            <>
              <Button variant="primary" danger onClick={() => setCancelConfirmOpen(true)}>取消申請</Button>
              <Button variant="tertiary" onClick={() => { onBack(); toast({ variant: 'success', title: '儲存成功' }) }}>存成草稿</Button>
              <Button onClick={() => setPreviewOpen(true)}>送出預覽</Button>
            </>
          )}
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
      <EditAttachmentModal
        key={editAttachmentTarget?.id ?? 'none'}
        open={editAttachmentTarget !== null}
        onClose={() => setEditAttachmentTarget(null)}
        attachment={editAttachmentTarget}
        onUpdate={(updated) => {
          handleUpdateAttachment(editAttachmentTarget!.id, updated)
          setEditAttachmentTarget(null)
          toast({ variant: 'success', title: '附件更新成功' })
        }}
      />
      {/* 刪除附件確認 */}
      <Dialog open={deleteAttachmentTarget !== null} onOpenChange={o => !o && setDeleteAttachmentTarget(null)}>
        <DialogContent maxWidth={480} autoHeight>
          <DialogHeader>
            <DialogTitle>是否刪除附件</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-fg-secondary">
              刪除後此筆附件資料將無法保留，是否仍要刪除？
            </p>
          </DialogBody>
          <DialogFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setDeleteAttachmentTarget(null)}>取消</Button>
              <Button variant="primary" danger onClick={() => {
                if (deleteAttachmentTarget) handleRemoveAttachment(deleteAttachmentTarget)
                setDeleteAttachmentTarget(null)
                toast({ variant: 'success', title: '附件已刪除' })
              }}>刪除附件</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 取消申請確認 */}
      <BatchImportModal
        open={batchImportInvoiceId !== null}
        onClose={() => setBatchImportInvoiceId(null)}
      />
      {(() => {
        const inv = invoices.find(i => i.id === addItemInvoiceId)
        return (
          <AddItemModal
            open={addItemInvoiceId !== null}
            onClose={() => setAddItemInvoiceId(null)}
            onSubmit={item => {
              if (!addItemInvoiceId) return
              setPaymentItemsMap(prev => {
                const existing = prev[addItemInvoiceId] ?? []
                return { ...prev, [addItemInvoiceId]: [...existing, { ...item, seq: existing.length + 1 }] }
              })
              setAddItemInvoiceId(null)
              toast({ variant: 'success', title: '新增成功' })
            }}
            invoiceNumber={inv?.number ?? ''}
            invoiceNo={inv?.invoiceNo ?? ''}
            seqNum={(paymentItemsMap[addItemInvoiceId ?? ''] ?? []).length + 1}
            initialTotal={inv ? String(Number(inv.subtotal || 0) + Number(inv.tax || 0)) : ''}
          />
        )
      })()}
      {(() => {
        const inv2 = invoices.find(i => i.id === editItemTarget?.invoiceId)
        return (
          <EditItemModal
            open={editItemTarget !== null}
            onClose={() => setEditItemTarget(null)}
            invoiceNumber={inv2?.number ?? ''}
            invoiceNo={inv2?.invoiceNo ?? ''}
            seqNum={editItemTarget?.seq ?? 1}
          />
        )
      })()}
      <DeleteItemModal
        open={deleteItemTarget !== null}
        onClose={() => setDeleteItemTarget(null)}
        onConfirm={() => {
          if (deleteItemTarget) {
            setPaymentItemsMap(prev => {
              const items = (prev[deleteItemTarget.invoiceId] ?? [])
                .filter(item => item.seq !== deleteItemTarget.seq)
                .map((item, i) => ({ ...item, seq: i + 1 }))
              return { ...prev, [deleteItemTarget.invoiceId]: items }
            })
          }
          setDeleteItemTarget(null)
          toast({ variant: 'success', title: '付款細項已刪除' })
        }}
      />
      {/* 編輯發票 */}
      {editInvoiceTarget && (
        <EditInvoiceModal
          open={editInvoiceTarget !== null}
          onClose={() => setEditInvoiceTarget(null)}
          invoice={editInvoiceTarget}
          isModifying={isModifying}
          onUpdate={(updated) => {
            handleUpdateInvoice(editInvoiceTarget.id, updated)
            setEditInvoiceTarget(null)
            toast({ variant: 'success', title: '發票已更新' })
          }}
        />
      )}
      {/* 刪除發票確認 */}
      {(() => {
        const invDel = invoices.find(i => i.id === deleteInvoiceTarget)
        return (
          <Dialog open={deleteInvoiceTarget !== null} onOpenChange={o => !o && setDeleteInvoiceTarget(null)}>
            <DialogContent maxWidth={480} autoHeight>
              <DialogHeader>
                <DialogTitle>是否刪除 {invDel?.number ?? ''}</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <p className="text-sm text-fg-secondary">
                  刪除後將無法復原。若此發票已綁定請款單，相關請款資料可能受到影響，確定要刪除嗎？
                </p>
              </DialogBody>
              <DialogFooter>
                <div className="flex justify-end gap-2 w-full">
                  <Button variant="outline" onClick={() => setDeleteInvoiceTarget(null)}>保留資料</Button>
                  <Button variant="primary" danger onClick={() => {
                    if (deleteInvoiceTarget) handleRemoveInvoice(deleteInvoiceTarget)
                    setDeleteInvoiceTarget(null)
                    toast({ variant: 'success', title: '發票已刪除' })
                  }}>刪除發票</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      })()}
      <Dialog open={cancelConfirmOpen} onOpenChange={o => !o && setCancelConfirmOpen(false)}>
        <DialogContent maxWidth={480} autoHeight>
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

      {/* Scenario B modals */}
      <AddInvoiceBModal
        open={addInvoiceBOpen}
        onClose={() => setAddInvoiceBOpen(false)}
        onSubmit={inv => setBInvoices(prev => [...prev, inv])}
        payee={payee}
      />
      {(() => {
        const bInv = bInvoices.find(i => i.id === addItemBInvoiceId)
        return (
          <AddItemBModal
            open={addItemBInvoiceId !== null}
            onClose={() => setAddItemBInvoiceId(null)}
            onSubmit={item => {
              if (addItemBInvoiceId) {
                setBItemsMap(prev => ({
                  ...prev,
                  [addItemBInvoiceId]: [...(prev[addItemBInvoiceId] ?? []), { ...item, seq: (prev[addItemBInvoiceId] ?? []).length + 1 }],
                }))
              }
              setAddItemBInvoiceId(null)
            }}
            invoiceNumber={bInv?.number ?? ''}
            invoiceNo={bInv?.invoiceNo ?? ''}
            seqNum={(bItemsMap[addItemBInvoiceId ?? ''] ?? []).length + 1}
          />
        )
      })()}
      {(() => {
        const bInv2 = bInvoices.find(i => i.id === bEditItemTarget?.invoiceId)
        return (
          <EditItemModal
            open={bEditItemTarget !== null}
            onClose={() => setBEditItemTarget(null)}
            invoiceNumber={bInv2?.number ?? ''}
            invoiceNo={bInv2?.invoiceNo ?? ''}
            seqNum={bEditItemTarget?.seq ?? 1}
          />
        )
      })()}
            {/* 申請單預覽 */}
      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onSubmit={() => { setPreviewOpen(false); onSubmit(formNumber) }}
        formNumber={formNumber}
        payee={payee}
        invoices={invoices}
        attachments={attachments}
        useUrgentDate={useUrgentDate}
        urgentDate={urgentDate}
        reason={reason}
        onReasonChange={setReason}
      />
    </div>
  )
}

// ─── DraftListPage ───────────────────────────────────────────

function DraftListPage({
  entries,
  onAddSingle,
  onAddExcel,
  onEdit,
  onDelete,
}: {
  entries: DraftEntry[]
  onAddSingle: () => void
  onAddExcel: () => void
  onEdit: (entry: DraftEntry) => void
  onDelete: (id: string) => void
}) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [infoTarget, setInfoTarget] = useState<DraftEntry | null>(null)

  const MOCK_DRAFT_INVOICES: Record<string, { number: string; invoiceNo: string; voucherType: string; subtotal: string; tax: string; payee: string; date: string }[]> = {
    '1': [
      { number: 'PAE20260525001-1', payee: '林間宜 (023156)', date: '2026/05/25', invoiceNo: 'BD28114045', voucherType: '電子統一發票 (25)', subtotal: '1,000', tax: '0' },
      { number: 'PAE20260525001-2', payee: '林間宜 (023156)', date: '2026/05/25', invoiceNo: 'BD28114046', voucherType: '電子統一發票 (25)', subtotal: '600', tax: '0' },
    ],
    '4': [
      { number: 'PAE20260525004-1', payee: 'ACME Corp', date: '2026/05/26', invoiceNo: 'ZZ99887766', voucherType: '紙本統一發票', subtotal: '5,000', tax: '200' },
    ],
    '5': [
      { number: 'PAE20260525005-1', payee: '林間宜 (023156)', date: '2026/05/25', invoiceNo: 'AB12345678', voucherType: '電子統一發票 (25)', subtotal: '1,800', tax: '0' },
    ],
  }

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

          <div className="flex gap-0">
          <div className={`flex-1 min-w-0 rounded-lg border border-divider overflow-x-auto transition-[margin] duration-300 ease-in-out ${infoTarget ? 'mr-4' : ''}`}>
            <table className="w-full text-sm min-w-[720px]">
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
                          <Button variant="ghost" size="sm" iconOnly startIcon={Info} aria-label="查看" onClick={() => setInfoTarget(infoTarget?.id === entry.id ? null : entry)} />
                          <Button variant="ghost" size="sm" iconOnly startIcon={Pencil} aria-label="編輯" onClick={() => onEdit(entry)} disabled={entry.status === 'reviewing'} />
                          <Button variant="ghost" size="sm" iconOnly startIcon={Trash2} aria-label="刪除" onClick={() => setDeleteTargetId(entry.id)} disabled={entry.status === 'reviewing'} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Right info panel — always rendered, slides via width transition (offcanvas pattern) */}
          {(() => {
            const entry = infoTarget
            const meta = entry ? STATUS_META[entry.status] : null
            const invList = entry ? (MOCK_DRAFT_INVOICES[entry.id] ?? []) : []
            return (
              <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${infoTarget ? 'w-[320px]' : 'w-0'}`}>
                <div className="w-[320px] h-full border border-divider bg-surface rounded-lg flex flex-col overflow-hidden">
                  {entry && meta && (
                    <>
                      {/* Panel header */}
                      <div className="px-4 py-3 border-b border-divider flex items-start justify-between gap-2 flex-shrink-0">
                        <div className="min-w-0">
                          <p className="text-xs text-fg-tertiary mb-1">一般申請單</p>
                          <p className="text-sm font-medium text-fg-primary leading-snug">{entry.number}</p>
                          <div className="mt-1"><Tag color={meta.color} size="sm">{meta.label}</Tag></div>
                        </div>
                        <button
                          className="text-fg-tertiary hover:text-fg-secondary transition-colors mt-0.5 flex-shrink-0"
                          onClick={() => setInfoTarget(null)}
                          aria-label="關閉"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                      {/* Scrollable body */}
                      <div className="overflow-y-auto flex-1 divide-y divide-divider">
                        {/* 基本資訊 */}
                        <div className="px-4 py-3">
                          <p className="text-xs font-medium text-fg-secondary uppercase tracking-wide mb-3">基本資訊</p>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between gap-2">
                              <dt className="text-fg-tertiary flex-shrink-0">收款人</dt>
                              <dd className="text-fg-primary text-right">{entry.applicant}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-fg-tertiary flex-shrink-0">公司代號</dt>
                              <dd className="text-fg-primary text-right">{entry.company}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-fg-tertiary flex-shrink-0">收款對象</dt>
                              <dd className="text-fg-primary text-right">{entry.payee}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-fg-tertiary flex-shrink-0">緊急/指定付款日期</dt>
                              <dd className="text-fg-primary text-right">{entry.urgentDate}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-fg-tertiary flex-shrink-0">申請原因</dt>
                              <dd className="text-fg-primary text-right">{entry.reason}</dd>
                            </div>
                          </dl>
                        </div>
                        {/* 請款資訊 */}
                        <div className="px-4 py-3">
                          <p className="text-xs font-medium text-fg-secondary uppercase tracking-wide mb-3">請款資訊</p>
                          {invList.length === 0 ? (
                            <p className="text-sm text-fg-tertiary">無請款資訊</p>
                          ) : (
                            <div className="space-y-4">
                              {invList.map((inv, idx) => (
                                <div key={idx} className="space-y-2 text-sm">
                                  <p className="text-xs font-medium text-fg-secondary">{inv.number}</p>
                                  <dl className="space-y-1.5">
                                    <div className="flex justify-between gap-2">
                                      <dt className="text-fg-tertiary flex-shrink-0">收款人</dt>
                                      <dd className="text-fg-primary text-right">{inv.payee}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                      <dt className="text-fg-tertiary flex-shrink-0">申請日期</dt>
                                      <dd className="text-fg-primary text-right">{inv.date}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                      <dt className="text-fg-tertiary flex-shrink-0">憑證類型</dt>
                                      <dd className="text-fg-primary text-right">{inv.voucherType}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                      <dt className="text-fg-tertiary flex-shrink-0">發票號碼</dt>
                                      <dd className="text-fg-primary text-right">{inv.invoiceNo}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                      <dt className="text-fg-tertiary flex-shrink-0">合計金額(未稅)</dt>
                                      <dd className="text-fg-primary text-right">{inv.subtotal}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                      <dt className="text-fg-tertiary flex-shrink-0">稅額</dt>
                                      <dd className="text-fg-primary text-right">{inv.tax}</dd>
                                    </div>
                                  </dl>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* 檢附憑證/證明 */}
                        <div className="px-4 py-3">
                          <p className="text-xs font-medium text-fg-secondary uppercase tracking-wide mb-3">檢附憑證/證明</p>
                          {invList.length === 0 ? (
                            <p className="text-sm text-fg-tertiary">無附件</p>
                          ) : (
                            <ul className="space-y-2">
                              {invList.map((inv, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-fg-secondary">
                                  <Paperclip size={13} className="text-fg-tertiary flex-shrink-0" />
                                  <span className="truncate">{inv.invoiceNo}_receipt.pdf</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })()}
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
      {/* 刪除確認 */}
      <Dialog open={deleteTargetId !== null} onOpenChange={o => !o && setDeleteTargetId(null)}>
        <DialogContent maxWidth={480} autoHeight>
          <DialogHeader>
            <DialogTitle>是否刪除申請單</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-fg-secondary">
              您尚未儲存目前填寫的內容。若刪除申請，已填寫的資料將無法保留，是否仍要刪除？
            </p>
          </DialogBody>
          <DialogFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setDeleteTargetId(null)}>繼續編輯</Button>
              <Button
                variant="primary"
                danger
                onClick={() => {
                  if (deleteTargetId) onDelete(deleteTargetId)
                  setDeleteTargetId(null)
                }}
              >
                刪除申請單
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── App Root ────────────────────────────────────────────────

export default function App() {
  const [activeNav, setActiveNav] = useState('drafts')
  const [entries, setEntries] = useState<DraftEntry[]>(INITIAL_ENTRIES)
  const [editEntry, setEditEntry] = useState<DraftEntry | null>(null)
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

  function handleNavChange(id: string) {
    setActiveNav(id)
    setPage('list')
    setEditEntry(null)
  }

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <SidebarProvider activeId={activeNav} onActiveChange={handleNavChange}>
        <AppShell
          layout="primary-sidebar"
          sidebar={<AppSidebar activeId={activeNav} onActiveChange={handleNavChange} />}
        >
          {page === 'list' ? (
            <DraftListPage
              entries={entries}
              onAddSingle={() => setPage('createform')}
              onAddExcel={() => toast({ variant: 'info', title: 'Excel 申請', description: '請下載範本填寫後上傳' })}
              onEdit={entry => { setEditEntry(entry); setPage('createform') }}
              onDelete={id => {
                const entry = entries.find(e => e.id === id)
                setEntries(prev => prev.filter(e => e.id !== id))
                if (entry) toast({ variant: 'success', title: `${entry.number}申請單已刪除` })
              }}
            />
          ) : (
            <CreateFormPage
              key={editEntry?.id ?? 'new'}
              onBack={() => { setEditEntry(null); setPage('list') }}
              onSubmit={handleSubmit}
              mode={editEntry ? 'edit' : 'create'}
              editEntry={editEntry ?? undefined}
            />
          )}
        </AppShell>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  )
}
