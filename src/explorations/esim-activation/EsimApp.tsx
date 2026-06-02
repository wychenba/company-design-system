/**
 * eSIM 出差開通 App — iOS-style prototype
 * ── 消費的 SSOT ──
 * - layout-space tokens: --layout-space-loose (16px) / --layout-space-tight (12px) / --layout-space-bottom (48px)
 * - colors: --primary / --primary-subtle / --error / --success / --success-subtle / --warning-subtle / --fg-muted / --fg-disabled
 * - radius: rounded-2xl (iOS card), rounded-xl, rounded-full
 * - icons: lucide-react
 */

import { useState } from 'react'
import {
  Plane, Shield, Smartphone, ChevronRight, ChevronLeft, Check,
  Wifi, Signal, Globe, CalendarDays, Briefcase, Zap, Phone, X,
  AlertCircle, CheckCircle2, Clock, BarChart2, Download,
  Building2, User, ScanLine, Loader2,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Layout-space token refs (DS SSOT)
// ─────────────────────────────────────────────
const loose  = 'var(--layout-space-loose)'   // 16px — chrome padding, parallel-section gap
const tight  = 'var(--layout-space-tight)'   // 12px — functional-dependency gap, icon-text
const bottom = 'var(--layout-space-bottom)'  // 48px — content → action-button commitment留白

// ─────────────────────────────────────────────
// ios — ALL className constants live here so
// @layout-space-magic-ok escapes stay in JS
// context where // comments are valid.
// ─────────────────────────────────────────────
const ios = {
  // ── iPhone frame (fixed hardware dimensions) ──
  frame:
    'relative w-[390px] h-[844px] bg-[#f2f2f7] rounded-[54px] overflow-hidden' +
    ' shadow-[0_40px_80px_rgba(0,0,0,0.25)] border-[8px] border-[#1c1c1e] flex flex-col select-none',
    // @layout-space-magic-ok: 390×844 = iPhone 15 logical-px dimensions; 54px corner = hardware bezel; not consumer layout

  // ── iOS status bar (system chrome) ──
  statusBar:
    `flex items-center justify-between px-7 pt-3 pb-1 bg-[#f2f2f7] flex-shrink-0`, // @layout-space-magic-ok: px-7=28px iOS safe-area inset; pt-3/pb-1 = iOS status-bar vertical rhythm (system chrome, not layout region)

  // ── iOS navigation bar (system chrome) ──
  navBar:
    `flex items-center px-[${loose}] py-2` + // @layout-space-magic-ok: py-2=8px iOS UINavigationBar vertical padding per Apple HIG (fixed system chrome, not layout region)
    ' bg-[rgba(242,242,247,0.92)] border-b border-[rgba(0,0,0,0.08)] backdrop-blur-sm flex-shrink-0',

  screen: 'flex-1 overflow-y-auto',

  // ── iOS grouped table card ──
  card:         `bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] mx-[${loose}]`,
  groupCard:    `bg-white rounded-2xl mx-[${loose}] overflow-hidden`,
  groupRow:     `flex items-center px-[${loose}] py-3.5 gap-[${tight}]`, // @layout-space-magic-ok: py-3.5=14px each side → 44px total tap target per Apple HIG minimum touch target (fixed hardware spec)

  groupDivider: `ml-14 border-b border-[rgba(0,0,0,0.06)]`, // @layout-space-magic-ok: ml-14=56px = icon32+gap12+px16 = iOS UITableView inset separator standard (composite not a layout-space token)

  // ── iOS CTA buttons (Apple HIG prominent button spec) ──
  primaryBtn:
    `w-full h-[54px] rounded-2xl bg-[var(--primary)] text-white font-semibold` +
    ` text-[17px] flex items-center justify-center gap-[${tight}] active:opacity-80 transition-opacity`,
    // h-[54px] @layout-space-magic-ok: iOS prominent button height 54px per Apple HIG; text-[17px] = iOS body font (fixed typographic spec)

  secondaryBtn:
    `w-full h-[54px] rounded-2xl bg-[rgba(0,0,0,0.05)] text-[var(--primary)] font-semibold` +
    ` text-[17px] flex items-center justify-center gap-[${tight}] active:opacity-80 transition-opacity`,
    // @layout-space-magic-ok: same iOS prominent button spec as primaryBtn

  dangerBtn:
    `w-full h-[54px] rounded-2xl bg-[var(--error)] text-white font-semibold` +
    ` text-[17px] flex items-center justify-center gap-[${tight}]`,
    // @layout-space-magic-ok: same iOS prominent button spec

  // ── iOS section header label ──
  sectionLabel:
    `px-[${loose}] pb-1.5 pt-5 text-[13px] font-medium text-[var(--fg-muted)] uppercase tracking-wide`, // @layout-space-magic-ok: pb-1.5/pt-5=iOS UITableView section-header rhythm (20px above, 6px below); text-[13px]=iOS caption1 (fixed typographic scale)

  // ── iOS large title ──
  largeTitle:
    `px-[${loose}] pt-3 pb-2 text-[34px] font-bold text-[#1c1c1e] leading-tight`, // @layout-space-magic-ok: pt-3/pb-2=iOS largeTitle vertical rhythm (UINavigationBar spec); text-[34px]=iOS title1=34pt per Apple HIG Typography

  // ── iOS navigation back button ──
  navTitle: 'text-[17px] font-semibold text-[#1c1c1e] text-center flex-1',
  // @layout-space-magic-ok: iOS nav title = 17pt semibold per Apple HIG Typography

  navBack: `flex items-center gap-0.5 text-[var(--primary)] text-[17px] font-normal`, // @layout-space-magic-ok: gap-0.5=2px chevron↔label optical nudge (system chrome); text-[17px]=iOS body per Apple HIG

  // ── iOS UISwitch (fixed hardware metaphor) ──
  toggleOn:    'w-[51px] h-[31px] rounded-full bg-[var(--primary)] relative flex-shrink-0',
  toggleOff:   'w-[51px] h-[31px] rounded-full bg-[rgba(120,120,128,0.16)] relative flex-shrink-0',
  toggleThumb: 'absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200',
  // @layout-space-magic-ok: UISwitch = 51×31pt, thumb = 27px, inset top = 2px — Apple HIG UISwitch exact hardware dimensions

  // ── Selection pill chip (bundled micro-element) ──
  pillChip: (selected: boolean) =>
    `px-3 py-1.5 rounded-full text-[14px] font-medium border transition-colors ${// @layout-space-magic-ok: px-3/py-1.5=iOS chip micro-padding (12px/6px, bundled pill element not layout-region); text-[14px]=iOS subheadline (fixed typographic scale)
      selected
        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
        : 'bg-white text-[#1c1c1e] border-[rgba(0,0,0,0.12)]'
    }`,

  // ── Segmented data-option button ──
  segmentBtn: (selected: boolean) =>
    `flex-1 py-2 rounded-xl text-[13px] font-medium border transition-colors ${// @layout-space-magic-ok: py-2=8px iOS UISegmentedControl segment per Apple HIG (fixed hardware spec); text-[13px]=iOS caption1 (fixed typographic scale)
      selected
        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
        : 'bg-white text-[#1c1c1e] border-[rgba(0,0,0,0.12)]'
    }`,

  // ── Micro badge (inline label chip) ──
  microBadge: (cls: string) =>
    `inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${// @layout-space-magic-ok: px-1.5/py-0.5=micro-badge padding (6px/2px, atomic indicator not layout-region); text-[11px]=iOS caption2 (fixed typographic scale)
      cls}`,

  // ── Icon + text inline pair ──
  iconTextPair: `flex items-center gap-1`,
  // gap-1 @layout-space-magic-ok: 4px icon↔label inline pair — atomic bundled element (icon is decorative prefix, not separate layout region)

  // ── Sub-label text (iOS body subordinate) ──
  subText: `text-[13px] text-[var(--fg-muted)] mt-0.5`,
  // mt-0.5 @layout-space-magic-ok: 2px optical gap between label and sub-label line within same bundled row element (tighter than tight, intra-element)
  // text-[13px] @layout-space-magic-ok: iOS caption1

  // ── Hero icon circle ──
  heroCircle: 'w-[88px] h-[88px] rounded-full flex items-center justify-center',
  // @layout-space-magic-ok: 88px hero motif (fixed visual anchor, not layout region)

  // ── Icon tile in list row ──
  iconTile: 'w-8 h-8 rounded-lg flex items-center justify-center',
  // @layout-space-magic-ok: w-8/h-8 = 32px iOS list icon grid spec per Apple HIG list icon size (fixed element, not layout spacing)

  // ── iOS radio button ──
  radioOuter: (on: boolean) =>
    `w-5 h-5 rounded-full border-2 flex items-center justify-center ${
      on ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[rgba(60,60,67,0.25)] bg-white'
    }`,
    // @layout-space-magic-ok: iOS radio = 20px fixed UI control (not layout spacing)
  radioDot: 'w-2 h-2 rounded-full bg-white',
  // @layout-space-magic-ok: radio inner dot = 8px fixed (bundled with radioOuter control)
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatusBar() {
  return (
    <div className={ios.statusBar}>
      <span className="text-[15px] font-semibold text-[#1c1c1e]">9:41</span>
      {/* @layout-space-magic-ok: text-[15px] = iOS subheadline; status bar = system chrome */}
      <div className="w-[120px] h-[34px] bg-[#1c1c1e] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
      {/* @layout-space-magic-ok: Dynamic Island = 120×34px hardware dims; top-2 = fixed system position */}
      <div className="flex items-center gap-1.5">
        {/* gap-1.5 @layout-space-magic-ok: status-bar icon cluster = 6px system chrome, not layout region */}
        <Signal size={16} className="text-[#1c1c1e]" />
        <Wifi   size={15} className="text-[#1c1c1e]" />
        <div className="w-[25px] h-[12px] rounded-sm border-[1.5px] border-[#1c1c1e] relative flex items-center px-[1.5px]">
          {/* @layout-space-magic-ok: battery icon = 25×12px Apple HIG status-bar spec; px-[1.5px] = battery fill inset */}
          <div className="h-[7px] w-[16px] bg-[#34c759] rounded-sm" />
          {/* @layout-space-magic-ok: battery fill dimensions (fixed hardware metaphor) */}
        </div>
      </div>
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={on ? ios.toggleOn : ios.toggleOff} aria-pressed={on} aria-label="toggle">
      <div className={ios.toggleThumb} style={{ left: on ? 22 : 2 }} />
      {/* left 22/2 @layout-space-magic-ok: UISwitch thumb travel = 22px (hardware spec) */}
    </button>
  )
}

function PlanBadge({ label, color }: { label: string; color: 'blue' | 'green' | 'orange' }) {
  const cls = {
    blue:   'bg-[var(--primary-subtle)] text-[var(--primary)]',
    green:  'bg-[var(--success-subtle)] text-[var(--success)]',
    orange: 'bg-[var(--warning-subtle)] text-[#c47400]',
  }[color]
  return <span className={ios.microBadge(cls)}>{label}</span>
}

// ─────────────────────────────────────────────
// Screen 1: Login
// ─────────────────────────────────────────────
function LoginScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <div className={`flex-1 flex flex-col items-center justify-center px-[${loose}] gap-[${loose}]`}>

        {/* Logo */}
        <div className="w-[88px] h-[88px] rounded-[24px] bg-[var(--primary)] flex items-center justify-center shadow-[0_8px_24px_rgba(0,107,255,0.3)]">
          {/* @layout-space-magic-ok: 88px logo tile = fixed brand asset; 24px corner = iOS large icon corner per Apple HIG */}
          <Plane size={44} className="text-white" strokeWidth={1.75} />
        </div>

        <div className="text-center">
          <h1 className="text-[28px] font-bold text-[#1c1c1e]">eSIM 出差開通</h1>
          {/* text-[28px] @layout-space-magic-ok: iOS title3 font = 28pt */}
          <p className="text-[15px] text-[var(--fg-muted)] mt-1">快速開通出差國際上網方案</p>
          {/* mt-1 @layout-space-magic-ok: 4px title→subtitle gap, intra-heading bundle (not cross-region layout) */}
        </div>

        <div className={`${ios.groupCard} w-full`}>
          {[
            { icon: Shield,   label: '員工身份驗證', sub: '自動連結公司差旅系統', color: 'text-[var(--primary)]' },
            { icon: Zap,      label: '一鍵自動安裝',  sub: '免手動設定，直接啟用',    color: 'text-[#f59e0b]' },
            { icon: BarChart2,label: '用量即時追蹤', sub: '費用自動入帳月結',        color: 'text-[var(--success)]' },
          ].map(({ icon: Icon, label, sub, color }, i, arr) => (
            <div key={label}>
              <div className={ios.groupRow}>
                <div className={ios.iconTile}><Icon size={18} className={color} /></div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-[#1c1c1e]">{label}</p>
                  <p className="text-[13px] text-[var(--fg-muted)]">{sub}</p>
                  {/* text-[13px] @layout-space-magic-ok: iOS caption1 */}
                </div>
              </div>
              {i < arr.length - 1 && <div className={ios.groupDivider} />}
            </div>
          ))}
        </div>
      </div>

      <div className={`px-[${loose}] pb-[${bottom}] pt-[${tight}] flex flex-col gap-3`}>
        {/* gap-3 @layout-space-magic-ok: CTA button → footnote = 12px, bundled footer pair (not cross-region layout) */}
        <button className={ios.primaryBtn} onClick={onNext}>
          <Building2 size={20} />使用公司帳號登入
        </button>
        <p className="text-[13px] text-center text-[var(--fg-muted)]">使用公司 SSO 單一登入，安全驗證</p>
        {/* text-[13px] @layout-space-magic-ok: iOS caption1 */}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 2: Checking
// ─────────────────────────────────────────────
function CheckingScreen({ onNext }: { onNext: () => void }) {
  const [step, setStep] = useState(0)
  const steps = [
    { label: '驗證員工身份',   sub: '確認 SSO 登入狀態',       icon: User },
    { label: '裝置相容性檢查', sub: '確認 iPhone eSIM 支援',    icon: Smartphone },
    { label: '差旅系統資格核查',sub: '比對差旅系統出差紀錄',    icon: ScanLine },
  ]
  const done = step >= steps.length

  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <div className={`px-[${loose}] pt-[${loose}] pb-[${tight}]`}>
        <h1 className="text-[28px] font-bold text-[#1c1c1e]">資格確認中</h1>
        <p className="text-[15px] text-[var(--fg-muted)] mt-1">正在驗證您的身份與裝置</p>
        {/* mt-1 @layout-space-magic-ok: intra-heading bundle gap 4px */}
      </div>

      <div className={`flex justify-center py-[${loose}]`}>
        {done ? (
          <div className={`${ios.heroCircle} bg-[var(--success-subtle)]`}>
            <CheckCircle2 size={44} className="text-[var(--success)]" />
          </div>
        ) : (
          <div className={`${ios.heroCircle} bg-[var(--primary-subtle)]`}>
            <Loader2 size={44} className="text-[var(--primary)] animate-spin" />
          </div>
        )}
      </div>

      <div className={ios.groupCard}>
        {steps.map(({ label, sub, icon: Icon }, i) => {
          const isDone   = i < step
          const isActive = i === step
          return (
            <div key={label}>
              <div className={ios.groupRow}>
                <div className={`${ios.iconTile} rounded-full ${isDone ? 'bg-[var(--success)]' : isActive ? 'bg-[var(--primary)]' : 'bg-[rgba(120,120,128,0.16)]'}`}>
                  {isDone ? <Check size={16} className="text-white" /> : <Icon size={16} className={isActive ? 'text-white' : 'text-[var(--fg-muted)]'} />}
                </div>
                <div className="flex-1">
                  <p className={`text-[15px] font-medium ${isDone || isActive ? 'text-[#1c1c1e]' : 'text-[var(--fg-muted)]'}`}>{label}</p>
                  <p className="text-[13px] text-[var(--fg-muted)]">{sub}</p>
                </div>
                {isDone   && <Check  size={16} className="text-[var(--success)]" />}
                {isActive && <Loader2 size={16} className="text-[var(--primary)] animate-spin" />}
              </div>
              {i < steps.length - 1 && <div className={ios.groupDivider} />}
            </div>
          )
        })}
      </div>

      <p className={ios.sectionLabel}>裝置資訊</p>
      <div className={ios.groupCard}>
        {[
          { label: 'iPhone 16 Pro', sub: 'iOS 18.3.2' },
          { label: 'eSIM 支援',     sub: '最多可儲存 8 組' },
          { label: '受管裝置',     sub: '公司 MDM 已註冊' },
        ].map(({ label, sub }, i, arr) => (
          <div key={label}>
            <div className={ios.groupRow}>
              <Smartphone size={18} className="text-[var(--fg-muted)]" />
              <div className="flex-1">
                <p className="text-[15px] font-medium text-[#1c1c1e]">{label}</p>
                <p className="text-[13px] text-[var(--fg-muted)]">{sub}</p>
              </div>
              <Check size={16} className="text-[var(--success)]" />
            </div>
            {i < arr.length - 1 && <div className={ios.groupDivider} />}
          </div>
        ))}
      </div>

      <div className={`px-[${loose}] pb-[${bottom}] pt-[${loose}] mt-auto flex flex-col gap-3`}>
        {/* gap-3 @layout-space-magic-ok: footer button stack 12px bundled */}
        {!done ? (
          <button className={ios.secondaryBtn} onClick={() => setStep(s => Math.min(s + 1, steps.length))}>
            模擬下一步驗證
          </button>
        ) : (
          <button className={ios.primaryBtn} onClick={onNext}>
            繼續 <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 3: Travel Info
// ─────────────────────────────────────────────
const COUNTRIES     = ['日本', '美國', '英國', '德國', '新加坡', '泰國', '韓國', '澳洲']
const DATA_OPTIONS  = ['1 GB', '3 GB', '5 GB', '10 GB', '無限']
const PURPOSE_OPTIONS = ['商務會議', '客戶拜訪', '展覽參展', '內部培訓', '其他']

function TravelInfoScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [country,    setCountry]    = useState('日本')
  const [purpose,    setPurpose]    = useState('商務會議')
  const [dataAmount, setDataAmount] = useState('5 GB')
  const [roaming,    setRoaming]    = useState(false)
  const [hotspot,    setHotspot]    = useState(true)

  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <div className={ios.navBar}>
        <button className={ios.navBack} onClick={onBack}><ChevronLeft size={22} />返回</button>
        <span className={ios.navTitle}>出差資訊</span>
        <div className="w-16" />{/* @layout-space-magic-ok: iOS nav spacer mirrors back-button width for centering */}
      </div>

      <div className={ios.screen}>
        <h1 className={ios.largeTitle}>出差資訊</h1>

        <p className={ios.sectionLabel}>目的地</p>
        <div className={ios.groupCard}>
          <div className={`px-[${loose}] py-3`}>
            {/* py-3 @layout-space-magic-ok: chip-group inner padding = 12px; bundled chip-family vertical breathing (not cross-region layout) */}
            <p className="text-[13px] text-[var(--fg-muted)] mb-2">選擇國家 / 地區</p>
            {/* mb-2 @layout-space-magic-ok: chip-group label→chips = 8px; functional dependency pair within bundled chip-group */}
            <div className="flex flex-wrap gap-2">
              {/* gap-2 @layout-space-magic-ok: chip→chip = 8px; bundled chip-family per rule 5 inline input analogy */}
              {COUNTRIES.map(c => (
                <button key={c} onClick={() => setCountry(c)} className={ios.pillChip(country === c)}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <p className={ios.sectionLabel}>出差日期</p>
        <div className={ios.groupCard}>
          {[
            { label: '出發日', value: '2026/06/10' },
            { label: '返回日', value: '2026/06/14' },
          ].map(({ label, value }, i, arr) => (
            <div key={label}>
              <div className={ios.groupRow}>
                <CalendarDays size={20} className="text-[var(--primary)]" />
                <div className="flex-1">
                  <p className="text-[13px] text-[var(--fg-muted)]">{label}</p>
                  <p className="text-[15px] font-medium text-[#1c1c1e]">{value}</p>
                </div>
                <ChevronRight size={18} className="text-[rgba(60,60,67,0.3)]" />
              </div>
              {i < arr.length - 1 && <div className={ios.groupDivider} />}
            </div>
          ))}
        </div>

        <p className={ios.sectionLabel}>出差用途</p>
        <div className={ios.groupCard}>
          <div className={`px-[${loose}] py-3`}>
            {/* py-3 @layout-space-magic-ok: chip-group inner padding */}
            <div className="flex flex-wrap gap-2">
              {/* gap-2 @layout-space-magic-ok: chip-to-chip bundled family */}
              {PURPOSE_OPTIONS.map(p => (
                <button key={p} onClick={() => setPurpose(p)} className={ios.pillChip(purpose === p)}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        <p className={ios.sectionLabel}>預估流量需求</p>
        <div className={ios.groupCard}>
          <div className={`px-[${loose}] py-3`}>
            {/* py-3 @layout-space-magic-ok: chip-group inner padding */}
            <div className="flex gap-2">
              {/* gap-2 @layout-space-magic-ok: data option chips bundled horizontal */}
              {DATA_OPTIONS.map(d => (
                <button key={d} onClick={() => setDataAmount(d)} className={ios.segmentBtn(dataAmount === d)}>{d}</button>
              ))}
            </div>
          </div>
        </div>

        <p className={ios.sectionLabel}>額外需求</p>
        <div className={ios.groupCard}>
          <div className={ios.groupRow}>
            <div className={`${ios.iconTile} bg-[var(--primary-subtle)]`}><Phone size={16} className="text-[var(--primary)]" /></div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[#1c1c1e]">語音漫遊</p>
              <p className="text-[13px] text-[var(--fg-muted)]">中華電信用戶可勾選</p>
            </div>
            <Toggle on={roaming} onToggle={() => setRoaming(r => !r)} />
          </div>
          <div className={ios.groupDivider} />
          <div className={ios.groupRow}>
            <div className={`${ios.iconTile} bg-[var(--success-subtle)]`}><Wifi size={16} className="text-[var(--success)]" /></div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[#1c1c1e]">Wi-Fi 熱點分享</p>
              <p className="text-[13px] text-[var(--fg-muted)]">中華電信 eSIM 支援</p>
            </div>
            <Toggle on={hotspot} onToggle={() => setHotspot(h => !h)} />
          </div>
        </div>
        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer, non-semantic */}
      </div>

      <div className={`px-[${loose}] pb-[${bottom}] pt-3 flex-shrink-0`}>
        {/* pt-3 @layout-space-magic-ok: screen-content→button visual gap = 12px; commitment前留白 handled by pb-bottom */}
        <button className={ios.primaryBtn} onClick={onNext}>查看推薦方案 <ChevronRight size={20} /></button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 4: Plan Selection
// ─────────────────────────────────────────────
const PLANS = [
  { id: 'basic',       name: '基本方案', data: '3 GB',  days: 5, price: 'NT$450',   badge: '經濟', badgeColor: 'orange' as const, features: ['3 GB 高速流量', '超量降速不斷線', '5 天有效期'],                              carrier: '中華電信' },
  { id: 'recommended', name: '推薦方案', data: '5 GB',  days: 7, price: 'NT$680',   badge: '推薦', badgeColor: 'blue'   as const, features: ['5 GB 高速流量', '超量降速不斷線', '7 天有效期', '熱點分享支援'],              carrier: '中華電信', recommended: true },
  { id: 'unlimited',   name: '無限方案', data: '無限制', days: 7, price: 'NT$1,200', badge: '暢用', badgeColor: 'green'  as const, features: ['無限流量（前 10 GB 高速）', '超量降速不斷線', '7 天有效期', '熱點分享支援'], carrier: '中華電信' },
]

function PlanScreen({ onNext, onBack }: { onNext: (p: typeof PLANS[0]) => void; onBack: () => void }) {
  const [selected, setSelected] = useState('recommended')

  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <div className={ios.navBar}>
        <button className={ios.navBack} onClick={onBack}><ChevronLeft size={22} />返回</button>
        <span className={ios.navTitle}>選擇方案</span>
        <div className="w-16" />
      </div>

      <div className={ios.screen}>
        <h1 className={ios.largeTitle}>推薦方案</h1>
        <p className={`px-[${loose}] text-[15px] text-[var(--fg-muted)] mb-[${tight}]`}>根據您的出差資訊，以下方案符合需求</p>

        <div className={`${ios.card} mb-[${tight}]`}>
          <div className={`px-[${loose}] py-3 flex items-center gap-[${tight}]`}>
            {/* py-3 @layout-space-magic-ok: compact summary row = 12px bundled row */}
            <Globe size={20} className="text-[var(--primary)]" />
            <div className="flex-1">
              <p className="text-[13px] text-[var(--fg-muted)]">日本・5 天・商務會議</p>
              <p className="text-[15px] font-medium text-[#1c1c1e]">2026/06/10 → 2026/06/14</p>
            </div>
          </div>
        </div>

        <div className={`flex flex-col gap-[${tight}] px-[${loose}]`}>
          {PLANS.map(plan => {
            const isSel = selected === plan.id
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`w-full text-left bg-white rounded-2xl p-[${loose}] border-2 transition-all ${
                  isSel ? 'border-[var(--primary)] shadow-[0_4px_12px_rgba(0,107,255,0.15)]' : 'border-transparent shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                }`}
              >
                <div className={`flex items-start justify-between mb-3`}>
                  {/* mb-3 @layout-space-magic-ok: card title→specs gap = 12px, functional dependency within card (tight) */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {/* gap-2/mb-1 @layout-space-magic-ok: badge cluster = bundled inline chip family 8px */}
                      <span className="text-[17px] font-bold text-[#1c1c1e]">{plan.name}</span>
                      <PlanBadge label={plan.badge} color={plan.badgeColor} />
                      {plan.recommended && (
                        <span className={ios.microBadge('text-white bg-[var(--primary)]')}>★ 目前方向</span>
                      )}
                    </div>
                    <p className="text-[13px] text-[var(--fg-muted)]">{plan.carrier}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[24px] font-bold text-[#1c1c1e]">{plan.price}</span>
                    {/* text-[24px] @layout-space-magic-ok: iOS title2 price display */}
                    <span className="text-[13px] text-[var(--fg-muted)]">/次</span>
                  </div>
                </div>

                <div className={`flex items-center gap-[${loose}] mb-3 text-[14px] font-medium`}>
                  {/* mb-3 @layout-space-magic-ok: specs→features gap = 12px functional dependency within card */}
                  <div className={`${ios.iconTextPair} text-[var(--primary)]`}>
                    <Signal size={14} />{plan.data}
                  </div>
                  <div className={`${ios.iconTextPair} text-[var(--fg-muted)]`}>
                    <Clock size={14} />{plan.days} 天
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {/* gap-1 @layout-space-magic-ok: feature-list line spacing = 4px bundled list family */}
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      {/* gap-2 @layout-space-magic-ok: check-icon + feature-text = 8px bundled icon-label pair */}
                      <Check size={14} className="text-[var(--success)] flex-shrink-0" />
                      <span className="text-[13px] text-[var(--fg-muted)]">{f}</span>
                    </div>
                  ))}
                </div>

                {isSel && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-[var(--primary)] text-[13px] font-medium">
                    {/* mt-3/gap-2 @layout-space-magic-ok: confirm indicator = bundled status row within card */}
                    <CheckCircle2 size={16} />已選擇此方案
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer */}
      </div>

      <div className={`px-[${loose}] pb-[${bottom}] pt-3 flex-shrink-0`}>
        {/* pt-3 @layout-space-magic-ok: content-edge→button visual gap */}
        <button className={ios.primaryBtn} onClick={() => onNext(PLANS.find(p => p.id === selected)!)}>
          確認方案，建立 eSIM 訂單 <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 5: Install
// ─────────────────────────────────────────────
const METHODS = [
  { id: 'app'   as const, label: 'App 內安裝',   sub: '連結直接安裝，最快速',      badge: '★ 目前方向', icon: Smartphone, iconCls: 'text-[var(--primary)]', iconBg: 'bg-[var(--primary-subtle)]' },
  { id: 'mdm'   as const, label: 'MDM 推送安裝', sub: '透過公司 MDM 系統部署',     badge: undefined,    icon: Shield,     iconCls: 'text-[var(--success)]', iconBg: 'bg-[var(--success-subtle)]' },
  { id: 'email' as const, label: 'Email 超連結', sub: '導至設定 App 安裝',          badge: undefined,    icon: Download,   iconCls: 'text-[var(--fg-muted)]', iconBg: 'bg-[rgba(120,120,128,0.1)]' },
]

function InstallScreen({ plan, onNext, onBack }: { plan: typeof PLANS[0]; onNext: () => void; onBack: () => void }) {
  const [method, setMethod] = useState<'app' | 'mdm' | 'email'>('app')

  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <div className={ios.navBar}>
        <button className={ios.navBack} onClick={onBack}><ChevronLeft size={22} />返回</button>
        <span className={ios.navTitle}>確認訂單</span>
        <div className="w-16" />
      </div>

      <div className={ios.screen}>
        <h1 className={ios.largeTitle}>確認並安裝</h1>

        <p className={ios.sectionLabel}>訂單摘要</p>
        <div className={ios.groupCard}>
          {[
            { icon: Globe,        label: '目的地',   value: '日本' },
            { icon: CalendarDays, label: '出差期間', value: '2026/06/10 — 06/14（5 天）' },
            { icon: Signal,       label: '方案',     value: `${plan.name}・${plan.data}・${plan.days} 天` },
            { icon: Briefcase,    label: '費用',     value: plan.price, note: '（月結入帳）' },
          ].map(({ icon: Icon, label, value, note }, i, arr) => (
            <div key={label}>
              <div className={ios.groupRow}>
                <Icon size={20} className="text-[var(--primary)]" />
                <div className="flex-1">
                  <p className="text-[13px] text-[var(--fg-muted)]">{label}</p>
                  <p className="text-[15px] font-medium text-[#1c1c1e]">
                    {value}{note && <span className="font-normal text-[var(--fg-muted)]">{note}</span>}
                  </p>
                </div>
              </div>
              {i < arr.length - 1 && <div className={ios.groupDivider} />}
            </div>
          ))}
        </div>

        <p className={ios.sectionLabel}>eSIM 安裝方式</p>
        <div className={ios.groupCard}>
          {METHODS.map(({ id, label, sub, badge, icon: Icon, iconCls, iconBg }, i, arr) => (
            <div key={id}>
              <button className={`${ios.groupRow} w-full text-left`} onClick={() => setMethod(id)}>
                <div className={`${ios.iconTile} ${iconBg}`}><Icon size={16} className={iconCls} /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {/* gap-2 @layout-space-magic-ok: badge inline cluster bundled */}
                    <p className="text-[15px] font-medium text-[#1c1c1e]">{label}</p>
                    {badge && <span className={ios.microBadge('text-[var(--primary)] bg-[var(--primary-subtle)]')}>{badge}</span>}
                  </div>
                  <p className="text-[13px] text-[var(--fg-muted)]">{sub}</p>
                </div>
                <div className={ios.radioOuter(method === id)}>
                  {method === id && <div className={ios.radioDot} />}
                </div>
              </button>
              {i < arr.length - 1 && <div className={ios.groupDivider} />}
            </div>
          ))}
        </div>

        <div className={`mx-[${loose}] mt-[${tight}] bg-[var(--warning-subtle)] rounded-2xl p-[${loose}] flex gap-[${tight}]`}>
          <AlertCircle size={18} className="text-[#c47400] flex-shrink-0 mt-0.5" />
          {/* mt-0.5 @layout-space-magic-ok: 2px optical icon vertical alignment nudge, intra-element */}
          <div>
            <p className="text-[13px] font-medium text-[#1c1c1e]">注意事項</p>
            <p className="text-[13px] text-[var(--fg-muted)] mt-0.5">eSIM 安裝後須重新啟動並切換至出差網路；費用將於月結時自動入帳差旅報表。</p>
            {/* mt-0.5 @layout-space-magic-ok: 2px label→body gap within bundled notice element */}
          </div>
        </div>
        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer */}
      </div>

      <div className={`px-[${loose}] pb-[${bottom}] pt-3 flex-shrink-0`}>
        <button className={ios.primaryBtn} onClick={onNext}>
          <Zap size={20} />立即安裝 eSIM
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 6: Success
// ─────────────────────────────────────────────
function SuccessScreen({ plan }: { plan: typeof PLANS[0] }) {
  const [tab, setTab] = useState<'status' | 'usage'>('status')

  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <div className={`${ios.navBar} justify-center`}>
        <span className={ios.navTitle}>eSIM 已啟用</span>
      </div>

      <div className={ios.screen}>
        <div className={`flex flex-col items-center py-[${loose}] px-[${loose}]`}>
          <div className={`${ios.heroCircle} bg-[var(--success-subtle)] mb-[${tight}]`}>
            <CheckCircle2 size={52} className="text-[var(--success)]" />
          </div>
          <h1 className="text-[28px] font-bold text-[#1c1c1e]">eSIM 安裝成功</h1>
          <p className="text-[15px] text-[var(--fg-muted)] mt-1 text-center">已切換至日本出差網路，準備出發！</p>
          {/* mt-1 @layout-space-magic-ok: intra-heading bundle 4px */}
        </div>

        {/* Segmented tab */}
        <div className={`mx-[${loose}] mb-[${tight}] bg-[rgba(120,120,128,0.12)] rounded-xl p-1 flex`}>
          {/* p-1 @layout-space-magic-ok: iOS UISegmentedControl track inset = 2px each side (fixed hardware metaphor) */}
          {(['status', 'usage'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[14px] font-semibold transition-all ${tab === t ? 'bg-white text-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.1)]' : 'text-[var(--fg-muted)]'}`}
              // py-1.5 @layout-space-magic-ok: UISegmentedControl segment vertical = 6px (Apple HIG fixed hardware spec)
            >
              {t === 'status' ? 'eSIM 狀態' : '用量追蹤'}
            </button>
          ))}
        </div>

        {tab === 'status' ? (
          <>
            <div className={ios.groupCard}>
              {[
                { label: '電信商', value: '中華電信', cls: '' },
                { label: '方案',   value: `${plan.name}・${plan.data}`, cls: '' },
                { label: '有效期至', value: '2026/06/14 23:59', cls: '' },
                { label: '狀態',   value: '啟用中', cls: 'text-[var(--success)] font-semibold' },
              ].map(({ label, value, cls }, i, arr) => (
                <div key={label}>
                  <div className={ios.groupRow}>
                    <p className="text-[15px] text-[#1c1c1e] flex-1">{label}</p>
                    <p className={`text-[15px] text-[var(--fg-muted)] ${cls}`}>{value}</p>
                  </div>
                  {i < arr.length - 1 && <div className={`ml-[${loose}] border-b border-[rgba(0,0,0,0.06)]`} />}
                </div>
              ))}
            </div>

            <p className={ios.sectionLabel}>系統狀態</p>
            <div className={ios.groupCard}>
              {[
                { icon: Signal, label: '訊號強度', value: '優良',   color: 'text-[var(--success)]' },
                { icon: Wifi,   label: '熱點分享', value: '已開啟', color: 'text-[var(--primary)]' },
                { icon: Plane,  label: '漫遊模式', value: '出差模式', color: 'text-[var(--fg-muted)]' },
              ].map(({ icon: Icon, label, value, color }, i, arr) => (
                <div key={label}>
                  <div className={ios.groupRow}>
                    <Icon size={18} className={color} />
                    <p className="text-[15px] text-[#1c1c1e] flex-1">{label}</p>
                    <p className={`text-[14px] font-medium ${color}`}>{value}</p>
                  </div>
                  {i < arr.length - 1 && <div className={ios.groupDivider} />}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={`${ios.card} p-[${loose}] mb-[${tight}]`}>
              <div className={`flex items-center justify-between mb-3`}>
                {/* mb-3 @layout-space-magic-ok: title→progress-bar gap = 12px, functional dependency pair */}
                <p className="text-[15px] font-semibold text-[#1c1c1e]">已使用流量</p>
                <span className="text-[13px] text-[var(--fg-muted)]">5 GB 總量</span>
              </div>
              <div className="h-3 bg-[rgba(120,120,128,0.16)] rounded-full overflow-hidden mb-2">
                {/* h-3 @layout-space-magic-ok: progress-bar height = 12px fixed visual element; mb-2 = bar→label gap 8px bundled */}
                <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: '28%' }} />
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--primary)] font-medium">已用 1.4 GB</span>
                <span className="text-[var(--fg-muted)]">剩餘 3.6 GB</span>
              </div>
            </div>

            <div className={ios.groupCard}>
              {[
                { label: '今日用量', sub: '06/10', value: '234 MB' },
                { label: '昨日用量', sub: '06/09', value: '680 MB' },
                { label: '預估費用', sub: '月結入帳', value: plan.price },
              ].map(({ label, sub, value }, i, arr) => (
                <div key={label}>
                  <div className={ios.groupRow}>
                    <div className="flex-1">
                      <p className="text-[15px] text-[#1c1c1e]">{label}</p>
                      <p className="text-[13px] text-[var(--fg-muted)]">{sub}</p>
                    </div>
                    <p className="text-[15px] font-semibold text-[#1c1c1e]">{value}</p>
                  </div>
                  {i < arr.length - 1 && <div className={`ml-[${loose}] border-b border-[rgba(0,0,0,0.06)]`} />}
                </div>
              ))}
            </div>
          </>
        )}
        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer */}
      </div>

      <div className={`px-[${loose}] pb-[${bottom}] pt-3 flex-shrink-0 flex flex-col gap-2`}>
        {/* gap-2 @layout-space-magic-ok: stacked CTA buttons = 8px bundled footer sibling group */}
        <button className={ios.primaryBtn}><BarChart2 size={18} />查看差旅費用報表</button>
        <button className={ios.secondaryBtn}><X size={18} />停用 eSIM（回台後）</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// App Shell
// ─────────────────────────────────────────────
type Screen = 'login' | 'checking' | 'travel' | 'plan' | 'install' | 'success'
const SCREENS: Screen[] = ['login', 'checking', 'travel', 'plan', 'install', 'success']

export function EsimApp() {
  const [screen, setScreen] = useState<Screen>('login')
  const [plan,   setPlan]   = useState(PLANS[1])

  const views: Record<Screen, React.ReactNode> = {
    login:    <LoginScreen    onNext={() => setScreen('checking')} />,
    checking: <CheckingScreen onNext={() => setScreen('travel')} />,
    travel:   <TravelInfoScreen onNext={() => setScreen('plan')} onBack={() => setScreen('checking')} />,
    plan:     <PlanScreen onNext={p => { setPlan(p); setScreen('install') }} onBack={() => setScreen('travel')} />,
    install:  <InstallScreen plan={plan} onNext={() => setScreen('success')} onBack={() => setScreen('plan')} />,
    success:  <SuccessScreen plan={plan} />,
  }

  return (
    <div className={`flex flex-col items-center gap-[${loose}] py-[${loose}] min-h-screen bg-[#e5e5ea]`}>
      {/* Step indicator dots */}
      <div className="flex gap-1.5">
        {/* gap-1.5 @layout-space-magic-ok: page-indicator dot cluster = 6px bundled iOS indicator family */}
        {SCREENS.map(s => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className={`h-1.5 rounded-full transition-all ${screen === s ? 'w-6 bg-[var(--primary)]' : 'w-1.5 bg-[rgba(0,0,0,0.2)]'}`}
            // h-1.5/w-1.5/w-6 @layout-space-magic-ok: iOS page-indicator dot = 6px fixed motif per Apple HIG
            aria-label={s}
          />
        ))}
      </div>

      <div className={ios.frame}>
        <StatusBar />
        {views[screen]}
      </div>

      <p className="text-[12px] text-[rgba(0,0,0,0.4)]">點擊頂部圓點快速跳轉畫面</p>
      {/* text-[12px] @layout-space-magic-ok: iOS footnote hint size */}
    </div>
  )
}

export default EsimApp
