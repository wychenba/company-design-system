import type { Meta } from '@storybook/react'
import { useState } from 'react'
import {
  Mail, Bell, Settings, Star, ChevronRight, Globe, Lock,
  Trash2, ExternalLink,
} from 'lucide-react'
import { SelectMenuItem } from '@/design-system/components/SelectMenu/select-menu-item'
import { SelectionItem } from '@/design-system/components/SelectionControl/selection-item'
import { Checkbox } from '@/design-system/components/Checkbox/checkbox'
import { Tag } from '@/design-system/components/Tag/tag'
import { Avatar } from '@/design-system/components/Avatar/avatar'

const meta: Meta = {
  title: 'Design System/Patterns/Item Layout',
  parameters: { layout: 'padded' },
}
export default meta

/* ═══════════════════════════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════════════════════════ */

type SizeKey = 'sm' | 'md' | 'lg'
type ConsumerKey = 'SelectMenuItem' | 'SelectionItem' | 'ListItem'
type PrefixType = 'icon' | 'avatar'

const SIZES: SizeKey[] = ['sm', 'md', 'lg']

/** Consumer preset definitions — spacing varies by consumer, structure is shared */
interface ConsumerPreset {
  label: string
  desc: string
  mode: 'scanning' | 'reading'
  py: string
  pyDesc: string
  px: string
  pxDesc: string
  gap: string
  gapDesc: string
  suffixGap: string
  suffixGapDesc: string
}

const CONSUMERS: Record<ConsumerKey, ConsumerPreset> = {
  SelectMenuItem: {
    label: 'SelectMenuItem',
    desc: '浮層選單（DropdownMenu / ComboBox）',
    mode: 'scanning',
    py: '(field-height − 一行文字高度) / 2',
    pyDesc: '單行 = field-height',
    px: 'px-3 (12px)',
    pxDesc: '選單標準水平間距',
    gap: 'gap-2 (8px)',
    gapDesc: 'prefix-content 間距',
    suffixGap: 'gap-1 (4px)',
    suffixGapDesc: 'value + ChevronRight 更緊湊',
  },
  SelectionItem: {
    label: 'SelectionItem',
    desc: '表單 Checkbox / Radio',
    mode: 'reading',
    py: '(field-height − 一行文字高度) / 2',
    pyDesc: '單行 = field-height',
    px: 'none',
    pxDesc: '由外層容器決定',
    gap: 'gap-2 (8px)',
    gapDesc: '控件與 label 間距',
    suffixGap: '--',
    suffixGapDesc: '無 suffix',
  },
  ListItem: {
    label: 'ListItem',
    desc: '頁面列表（未來元件）',
    mode: 'reading',
    py: 'py-3 (12px)',
    pyDesc: '觸控友好的列表行高',
    px: 'px-4 (16px)',
    pxDesc: '頁面標準水平間距',
    gap: 'gap-3 (12px)',
    gapDesc: '適合較大的 avatar',
    suffixGap: 'gap-2 (8px)',
    suffixGapDesc: '後綴元素間距',
  },
}

interface TypoSpec {
  labelFont: string
  labelSize: string
  labelLh: string
  descFont: string
  descSize: string
  descLh: string
  iconPx: number
}

const SCANNING_SPECS: Record<SizeKey, TypoSpec> = {
  sm: { labelFont: 'text-body leading-compact', labelSize: '14px', labelLh: '1.3', descFont: 'text-caption', descSize: '12px', descLh: '1.3', iconPx: 16 },
  md: { labelFont: 'text-body leading-compact', labelSize: '14px', labelLh: '1.3', descFont: 'text-caption', descSize: '12px', descLh: '1.3', iconPx: 16 },
  lg: { labelFont: 'text-body-lg leading-compact', labelSize: '16px', labelLh: '1.3', descFont: 'text-body leading-compact', descSize: '14px', descLh: '1.3', iconPx: 20 },
}

const READING_SPECS: Record<SizeKey, TypoSpec> = {
  sm: { labelFont: 'text-body', labelSize: '14px', labelLh: '1.5', descFont: 'text-body', descSize: '14px', descLh: '1.5', iconPx: 16 },
  md: { labelFont: 'text-body', labelSize: '14px', labelLh: '1.5', descFont: 'text-body', descSize: '14px', descLh: '1.5', iconPx: 16 },
  lg: { labelFont: 'text-body-lg', labelSize: '16px', labelLh: '1.5', descFont: 'text-body-lg', descSize: '16px', descLh: '1.5', iconPx: 20 },
}

const FIELD_HEIGHTS: Record<SizeKey, string> = { sm: '28px', md: '32px', lg: '36px' }

/* ═══════════════════════════════════════════════════════════════════════════
   Shared UI Components
   ═══════════════════════════════════════════════════════════════════════════ */

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-h6 font-semibold text-foreground">{children}</h3>
)
const Desc = ({ children }: { children: React.ReactNode }) => (
  <p className="text-caption text-fg-muted max-w-[720px]">{children}</p>
)
const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left p-2 border-b border-divider text-fg-muted font-medium text-caption whitespace-nowrap">{children}</th>
)
const Td = ({ children, mono }: { children: React.ReactNode; mono?: boolean }) => (
  <td className={`p-2 border-b border-divider align-top whitespace-nowrap text-caption ${mono ? 'font-mono' : ''}`}>{children}</td>
)

const TkVal = ({ token, value }: { token: string; value?: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="font-mono text-[12px] text-fg-secondary">{token}</span>
    {value && <span className="font-mono text-[10px] text-fg-muted">{value}</span>}
  </div>
)

const Swatch = ({ value, size = 'md' }: { value: string; size?: 'sm' | 'md' }) => {
  const s = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  if (value === 'transparent') {
    return <span className={`${s} rounded-sm shrink-0 border border-border`}
      style={{ backgroundImage: 'linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%),linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%)', backgroundSize: '6px 6px', backgroundPosition: '0 0,3px 3px' }} />
  }
  return <span className={`${s} rounded-sm shrink-0 border border-black/10`} style={{ backgroundColor: `var(${value})` }} />
}

const Tab = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick}
    className={`px-2.5 py-1 text-[12px] font-mono rounded-md cursor-pointer transition-colors ${
      active ? 'bg-primary text-white font-semibold' : 'bg-neutral-hover text-fg-secondary hover:bg-neutral-active'
    }`}>
    {children}
  </button>
)

const PropRow = ({ label, dot, children }: { label: string; dot?: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-3 py-2 border-b border-divider last:border-b-0">
    <span className="text-[11px] text-fg-muted font-medium w-[88px] shrink-0 pt-0.5 flex items-center gap-1.5">
      {dot && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />}
      {label}
    </span>
    <div className="flex-1 text-[12px] font-mono text-fg-secondary">{children}</div>
  </div>
)

/** Blueprint zone colors */
const Z = {
  pad:     { bg: 'rgba(194,225,154,0.6)', border: 'rgba(139,179,91,0.9)', text: '#5a7a2e' },
  icon:    { bg: 'rgba(166,208,245,0.6)', border: 'rgba(80,145,210,0.9)', text: '#2d6a9f' },
  gap:     { bg: 'rgba(253,218,158,0.6)', border: 'rgba(218,165,60,0.9)', text: '#8a6010' },
  label:   { bg: 'rgba(199,178,230,0.6)', border: 'rgba(138,103,190,0.9)', text: '#6035a8' },
  dim:     { text: '#d04040' },
  suffix:  { bg: 'rgba(253,186,186,0.5)', border: 'rgba(210,80,80,0.7)', text: '#a03030' },
}

/** Menu container */
const MenuFrame = ({ children, width = 320 }: { children: React.ReactNode; width?: number }) => (
  <div
    className="rounded-lg bg-surface-raised border border-border overflow-hidden py-2"
    style={{ width, boxShadow: 'var(--elevation-200)' }}
  >
    {children}
  </div>
)


/** ListItem preview (simulated — component not yet built) */
const ListItemPreview = ({ size, startIcon: StartIcon, avatar, label, description, suffix }: {
  size: SizeKey
  startIcon?: React.ComponentType<{ size: number; className?: string }>
  avatar?: React.ReactNode
  label: string
  description?: string
  suffix?: React.ReactNode
}) => {
  const iconPx = size === 'lg' ? 20 : 16
  const hasBlockPrefix = !!avatar && !!description
  const alignClass = hasBlockPrefix
    ? (size === 'lg' ? 'h-[calc(1lh+2px+var(--font-body-size)*1.5)]' : 'h-[calc(1lh+2px+var(--font-body-size)*1.5)]')
    : 'h-[1lh]'

  return (
    <div className={`flex items-start gap-3 px-4 py-3 ${size === 'lg' ? 'text-body-lg' : 'text-body'}`}>
      {(StartIcon || avatar) && (
        <div className={`${alignClass} flex items-center shrink-0`}>
          {StartIcon && <StartIcon size={iconPx} aria-hidden />}
          {avatar && (
            <div className={`shrink-0 rounded-full overflow-hidden ${hasBlockPrefix ? (size === 'lg' ? 'w-10 h-10' : 'w-8 h-8') : 'w-6 h-6'}`}>
              {avatar}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="truncate">{label}</span>
        {description && (
          <p className="mt-0.5 text-fg-secondary">{description}</p>
        )}
      </div>
      {suffix && (
        <div className={`${alignClass} flex items-center ml-auto`}>
          {suffix}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. 檢閱器
   ═══════════════════════════════════════════════════════════════════════════ */

const InspectorInner = () => {
  const [consumer, setConsumer] = useState<ConsumerKey>('SelectMenuItem')
  const [size, setSize] = useState<SizeKey>('md')
  const [hasPrefix, setHasPrefix] = useState(true)
  const [prefixType, setPrefixType] = useState<PrefixType>('icon')
  const [hasDescription, setHasDescription] = useState(true)
  const [hasSuffix, setHasSuffix] = useState(false)

  const preset = CONSUMERS[consumer]
  const spec = preset.mode === 'scanning' ? SCANNING_SPECS[size] : READING_SPECS[size]
  const isBlockAlign = prefixType === 'avatar' && hasDescription
  const alignContainer = isBlockAlign ? '= label行高 + 2px + desc行高' : '= 一行文字高度'
  const alignDesc = isBlockAlign ? 'prefix > 24px → 對齊 label + description 文字塊' : 'prefix ≤ 24px → 對齊第一行 label'

  // Blueprint sizing
  const bpH = hasDescription ? 80 : 60
  const hasPx = consumer !== 'SelectionItem'
  const gapLabel = consumer === 'ListItem' ? 'gap-3' : 'gap-2'
  const gapPx = consumer === 'ListItem' ? '12px' : '8px'
  const pxLabel = consumer === 'ListItem' ? 'px-4' : 'px-3'
  const pxPx = consumer === 'ListItem' ? '16px' : '12px'

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-fg-muted w-24 shrink-0">Consumer</span>
          <div className="flex gap-1.5">
            {(Object.keys(CONSUMERS) as ConsumerKey[]).map((c) => (
              <Tab key={c} active={consumer === c} onClick={() => setConsumer(c)}>{c}</Tab>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-fg-muted w-24 shrink-0">Size</span>
          <div className="flex gap-1.5">
            {SIZES.map((sz) => <Tab key={sz} active={size === sz} onClick={() => setSize(sz)}>{sz}</Tab>)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-fg-muted w-24 shrink-0">hasPrefix</span>
          <div className="flex gap-1.5">
            <Tab active={hasPrefix} onClick={() => setHasPrefix(true)}>on</Tab>
            <Tab active={!hasPrefix} onClick={() => setHasPrefix(false)}>off</Tab>
          </div>
        </div>
        {hasPrefix && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-fg-muted w-24 shrink-0">prefixType</span>
            <div className="flex gap-1.5">
              <Tab active={prefixType === 'icon'} onClick={() => setPrefixType('icon')}>icon</Tab>
              <Tab active={prefixType === 'avatar'} onClick={() => setPrefixType('avatar')}>avatar</Tab>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-fg-muted w-24 shrink-0">hasDescription</span>
          <div className="flex gap-1.5">
            <Tab active={hasDescription} onClick={() => setHasDescription(true)}>on</Tab>
            <Tab active={!hasDescription} onClick={() => setHasDescription(false)}>off</Tab>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-fg-muted w-24 shrink-0">hasSuffix</span>
          <div className="flex gap-1.5">
            <Tab active={hasSuffix} onClick={() => setHasSuffix(true)}>on</Tab>
            <Tab active={!hasSuffix} onClick={() => setHasSuffix(false)}>off</Tab>
          </div>
        </div>
      </div>

      {/* Preview + Panel */}
      <div className="flex gap-8 items-start">
        {/* Left: live preview + blueprint */}
        <div className="flex flex-col gap-6 min-w-[440px]">
          {/* Live preview */}
          <div className="px-8 py-8 rounded-lg bg-canvas border border-divider flex items-center justify-center">
            {consumer === 'SelectMenuItem' && (
              <MenuFrame width={360}>
                <SelectMenuItem
                  size={size}
                  startIcon={hasPrefix && prefixType === 'icon' ? Mail : undefined}
                  avatar={hasPrefix && prefixType === 'avatar' ? <Avatar alt="Alice" color="indigo" size="fill" /> : undefined}
                  description={hasDescription ? '每日寄送摘要信件' : undefined}
                  tag={hasSuffix ? <Tag size={size} variant="blue">Pro</Tag> : undefined}
                >
                  電子郵件通知
                </SelectMenuItem>
              </MenuFrame>
            )}
            {consumer === 'SelectionItem' && (
              <div className="w-[360px]">
                <SelectionItem
                  size={size}
                  control={<Checkbox size={size} checked={true} />}
                  label="電子郵件通知"
                  description={hasDescription ? '每日寄送摘要信件到您的電子信箱' : undefined}
                />
              </div>
            )}
            {consumer === 'ListItem' && (
              <div className="w-[360px] rounded-lg border border-divider overflow-hidden bg-surface">
                <ListItemPreview
                  size={size}
                  startIcon={hasPrefix && prefixType === 'icon' ? Mail : undefined}
                  avatar={hasPrefix && prefixType === 'avatar' ? <Avatar alt="Alice" color="indigo" size="fill" /> : undefined}
                  label="電子郵件通知"
                  description={hasDescription ? '每日寄送摘要信件到您的電子信箱' : undefined}
                  suffix={hasSuffix ? <ChevronRight size={spec.iconPx} className="text-fg-muted" /> : undefined}
                />
              </div>
            )}
          </div>

          {/* Blueprint */}
          <div className="flex flex-col gap-3">
            {/* Legend */}
            <div className="flex items-center gap-4 text-[11px]">
              {[
                ...(hasPx ? [{ c: Z.pad, l: 'Padding' }] : []),
                ...(hasPrefix ? [{ c: Z.icon, l: 'Prefix' }] : []),
                { c: Z.gap, l: 'Gap' },
                { c: Z.label, l: 'Content' },
                ...(hasSuffix ? [{ c: Z.suffix, l: 'Suffix' }] : []),
              ].map(({ c, l }) => (
                <span key={l} className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ background: c.bg, border: `1.5px dashed ${c.border}` }} />
                  <span className="font-medium" style={{ color: c.text }}>{l}</span>
                </span>
              ))}
            </div>

            {/* Diagram — 2D: vertical padding + horizontal zones */}
            <div className="flex items-center">
              <div className="flex flex-col rounded-lg overflow-hidden" style={{ width: 'fit-content', outline: `2px solid ${Z.dim.text}22` }}>
                {/* Top padding zone — width controlled by content row */}
                <div className="flex items-center justify-center"
                  style={{ height: 20, background: Z.pad.bg, borderBottom: `1.5px dashed ${Z.pad.border}` }}>
                  <span className="text-[10px] font-mono font-bold" style={{ color: Z.pad.text }}>padding-y</span>
                </div>
                {/* Horizontal content row */}
                <div className="flex items-stretch" style={{ height: bpH - 40 }}>
                {hasPx && (
                  <div className="flex items-center justify-center shrink-0"
                    style={{ width: 52, height: '100%', background: Z.pad.bg, borderRight: `1.5px dashed ${Z.pad.border}` }}>
                    <span className="text-[13px] font-mono font-bold" style={{ color: Z.pad.text }}>{pxLabel}</span>
                  </div>
                )}
                {hasPrefix && (
                  <>
                    <div className="flex items-center justify-center shrink-0"
                      style={{ width: 56, height: '100%', background: Z.icon.bg, borderLeft: `1.5px dashed ${Z.icon.border}`, borderRight: `1.5px dashed ${Z.icon.border}` }}>
                      <span className="text-[13px] font-mono font-bold" style={{ color: Z.icon.text }}>
                        {prefixType === 'icon' ? `${spec.iconPx}px` : 'avatar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-center shrink-0"
                      style={{ width: 44, height: '100%', background: Z.gap.bg, borderRight: `1.5px dashed ${Z.gap.border}` }}>
                      <span className="text-[13px] font-mono font-bold" style={{ color: Z.gap.text }}>{gapLabel}</span>
                    </div>
                  </>
                )}
                <div className="flex flex-col items-center justify-center flex-1 min-w-[80px]"
                  style={{ height: '100%', background: Z.label.bg, borderLeft: `1.5px dashed ${Z.label.border}`, borderRight: `1.5px dashed ${Z.label.border}` }}>
                  <span className="text-[14px] font-mono font-bold" style={{ color: Z.label.text }}>Label</span>
                  {hasDescription && (
                    <>
                      <span className="text-[10px] font-mono mt-1 opacity-60" style={{ color: Z.gap.text }}>mt-0.5 (2px)</span>
                      <span className="text-[12px] font-mono opacity-80" style={{ color: Z.label.text }}>description</span>
                    </>
                  )}
                </div>
                {hasSuffix && (
                  <>
                    <div className="flex items-center justify-center shrink-0"
                      style={{ width: 36, height: '100%' }}>
                      <span className="text-[10px] font-mono text-fg-muted">flex-1</span>
                    </div>
                    <div className="flex items-center justify-center shrink-0"
                      style={{ width: 56, height: '100%', background: Z.suffix.bg, borderLeft: `1.5px dashed ${Z.suffix.border}`, borderRight: `1.5px dashed ${Z.suffix.border}` }}>
                      <span className="text-[13px] font-mono font-bold" style={{ color: Z.suffix.text }}>suffix</span>
                    </div>
                  </>
                )}
                {hasPx && (
                  <div className="flex items-center justify-center shrink-0"
                    style={{ width: 52, height: '100%', background: Z.pad.bg, borderLeft: `1.5px dashed ${Z.pad.border}` }}>
                    <span className="text-[13px] font-mono font-bold" style={{ color: Z.pad.text }}>{pxLabel}</span>
                  </div>
                )}
                </div>
                {/* Bottom padding zone */}
                <div className="flex items-center justify-center"
                  style={{ height: 20, background: Z.pad.bg, borderTop: `1.5px dashed ${Z.pad.border}` }}>
                  <span className="text-[10px] font-mono font-bold" style={{ color: Z.pad.text }}>padding-y</span>
                </div>
              </div>

              {/* Height annotation */}
              <div className="ml-4 flex items-center" style={{ height: bpH }}>
                <svg width="10" height={bpH} className="shrink-0">
                  <line x1="5" y1="2" x2="5" y2={bpH - 2} stroke={Z.dim.text} strokeWidth="1" />
                  <line x1="1" y1="2" x2="9" y2="2" stroke={Z.dim.text} strokeWidth="1.5" />
                  <line x1="1" y1={bpH - 2} x2="9" y2={bpH - 2} stroke={Z.dim.text} strokeWidth="1.5" />
                </svg>
                <div className="ml-2">
                  <TkVal token={`--field-height-${size}`} value={`${FIELD_HEIGHTS[size]} (single-line)`} />
                </div>
              </div>
            </div>

            {/* Annotations below the blueprint */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-mono text-fg-muted">
              {hasPx && <span><strong style={{ color: Z.pad.text }}>padding-x</strong> = {pxPx}</span>}
              {hasPrefix && <span><strong style={{ color: Z.icon.text }}>prefix-content gap</strong> = {gapPx}</span>}
              <span><strong style={{ color: Z.label.text }}>py</strong> = {preset.py.includes('calc') ? `calc((field-height-${size} − 一行文字高度) / 2)` : preset.py}</span>
              {hasDescription && <span>label-desc gap = mt-0.5 (2px)</span>}
            </div>
          </div>
        </div>

        {/* Right: Inspect panel */}
        <div className="w-[320px] shrink-0 border border-divider rounded-lg bg-surface overflow-hidden">
          <div className="px-4 py-2.5 border-b border-divider bg-neutral-hover">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-foreground">Inspect</span>
              <span className="text-[10px] font-mono text-fg-muted">{preset.label}</span>
            </div>
          </div>

          {/* LAYOUT */}
          <div className="px-4 py-1">
            <div className="py-2 border-b border-divider"><span className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">Layout</span></div>
            <PropRow label="padding-y" dot={Z.pad.text}>
              <TkVal token={preset.py} value={preset.pyDesc} />
            </PropRow>
            <PropRow label="padding-x" dot={Z.pad.text}>
              <TkVal token={preset.px} value={preset.pxDesc} />
            </PropRow>
            <PropRow label="prefix-content" dot={Z.gap.text}>
              <TkVal token={preset.gap} value={preset.gapDesc} />
            </PropRow>
            {hasDescription && (
              <PropRow label="label-desc" dot={Z.gap.text}><TkVal token="mt-0.5" value="2px" /></PropRow>
            )}
            {hasSuffix && (
              <PropRow label="suffix gap" dot={Z.suffix.text}>
                <TkVal token={preset.suffixGap} value={preset.suffixGapDesc} />
              </PropRow>
            )}
            {hasPrefix && (
              <PropRow label="icon size" dot={Z.icon.text}>{spec.iconPx}px</PropRow>
            )}
          </div>

          {/* TYPOGRAPHY */}
          <div className="px-4 py-1">
            <div className="py-2 border-b border-divider"><span className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">Typography</span></div>
            <PropRow label="Label"><TkVal token={spec.labelFont} value={spec.labelSize} /></PropRow>
            <PropRow label="Label lh"><TkVal token={preset.mode === 'scanning' ? 'leading-compact' : 'default'} value={spec.labelLh} /></PropRow>
            {hasDescription && (
              <>
                <PropRow label="Desc"><TkVal token={spec.descFont} value={spec.descSize} /></PropRow>
                <PropRow label="Desc color">
                  <span className="inline-flex items-center gap-2"><Swatch value="--fg-secondary" /><span>fg-secondary</span></span>
                </PropRow>
              </>
            )}
          </div>

          {/* ALIGNMENT */}
          <div className="px-4 py-1 pb-3">
            <div className="py-2 border-b border-divider"><span className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">Alignment</span></div>
            <PropRow label="outer"><TkVal token="flex items-start" /></PropRow>
            <PropRow label="align container"><TkVal token={alignContainer} value={alignDesc} /></PropRow>
            <PropRow label="threshold"><TkVal token="24px" value="prefix > 24px triggers block align" /></PropRow>
            {hasSuffix && (
              <PropRow label="suffix align"><TkVal token={alignContainer} value="shares prefix container height" /></PropRow>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const Inspector = {
  name: '1. 檢閱器',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <H3>Item Layout 檢閱器</H3>
        <Desc>
          Item Layout 是抽象對齊系統，不是固定元件。每個消費元件提供自己的間距（padding、gap），
          但共用相同的三區域結構和對齊規則。切換 Consumer 可看到不同元件的預設值。
        </Desc>
      </div>
      <InspectorInner />
    </div>
  ),
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. 對齊容器（24px 閾值）
   ═══════════════════════════════════════════════════════════════════════════ */

export const AlignmentThreshold = {
  name: '2. 對齊容器（24px 閾值）',
  render: () => (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <H3>對齊容器 — 24px 閾值</H3>
        <Desc>
          prefix 和 suffix 共用相同的對齊容器高度，由 prefix 內容物決定。
          &le; 24px → 對齊容器 = 一行文字高度（inline），&gt; 24px → 對齊容器 = label行高 + 2px + desc行高（block）。
          Suffix 永遠跟 prefix 使用相同的容器高度。
        </Desc>
      </div>

      {/* Side-by-side comparison */}
      <div className="flex gap-12 items-start">
        {/* Inline: <= 24px */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-caption font-semibold text-foreground">&le; 24px — Inline 對齊</span>
            <span className="text-[11px] text-fg-muted">icon (16/20px), checkbox (16/20px)</span>
          </div>

          {/* Blueprint diagram — LARGE */}
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-stretch rounded-lg overflow-hidden" style={{ height: 88, outline: `2px solid ${Z.dim.text}22` }}>
              <div className="flex items-center justify-center shrink-0"
                style={{ width: 72, height: '100%', background: Z.icon.bg, borderRight: `1.5px dashed ${Z.icon.border}` }}>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[14px] font-mono font-bold" style={{ color: Z.icon.text }}>prefix</span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: Z.icon.text }}>一行文字高度</span>
                </div>
              </div>
              <div className="flex items-center justify-center shrink-0"
                style={{ width: 48, height: '100%', background: Z.gap.bg }}>
                <span className="text-[13px] font-mono font-bold" style={{ color: Z.gap.text }}>gap</span>
              </div>
              <div className="flex flex-col items-center justify-center shrink-0"
                style={{ width: 120, height: '100%', background: Z.label.bg }}>
                <span className="text-[14px] font-mono font-bold" style={{ color: Z.label.text }}>Label</span>
                <span className="text-[10px] font-mono mt-1 opacity-60" style={{ color: Z.gap.text }}>mt-0.5</span>
                <span className="text-[12px] font-mono opacity-80" style={{ color: Z.label.text }}>description</span>
              </div>
              <div className="flex items-center justify-center shrink-0"
                style={{ width: 72, height: '100%', background: Z.suffix.bg, borderLeft: `1.5px dashed ${Z.suffix.border}` }}>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[14px] font-mono font-bold" style={{ color: Z.suffix.text }}>suffix</span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: Z.suffix.text }}>一行文字高度</span>
                </div>
              </div>
            </div>
            <span className="text-[11px] text-fg-muted">prefix center = label 第一行垂直中心，suffix 使用相同的 一行文字高度</span>
          </div>

          {/* Live example */}
          <MenuFrame width={360}>
            <SelectMenuItem size="md" startIcon={Mail} description="每日寄送摘要信件" tag={<Tag size="md" variant="blue">Pro</Tag>}>
              電子郵件通知
            </SelectMenuItem>
            <SelectMenuItem size="md" startIcon={Bell} description="瀏覽器推送即時通知" tag={<Tag size="md" variant="green">Free</Tag>}>
              推送通知
            </SelectMenuItem>
          </MenuFrame>
        </div>

        {/* Block: > 24px */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-caption font-semibold text-foreground">&gt; 24px — Block 對齊</span>
            <span className="text-[11px] text-fg-muted">avatar (32/40px) with description</span>
          </div>

          {/* Blueprint diagram — LARGE */}
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-stretch rounded-lg overflow-hidden" style={{ height: 88, outline: `2px solid ${Z.dim.text}22` }}>
              <div className="flex items-center justify-center shrink-0"
                style={{ width: 72, height: '100%', background: Z.icon.bg, borderRight: `1.5px dashed ${Z.icon.border}` }}>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[14px] font-mono font-bold" style={{ color: Z.icon.text }}>prefix</span>
                  <span className="text-[9px] font-mono" style={{ color: Z.icon.text }}>label行高</span>
                  <span className="text-[9px] font-mono" style={{ color: Z.icon.text }}>+2px+desc行高</span>
                </div>
              </div>
              <div className="flex items-center justify-center shrink-0"
                style={{ width: 48, height: '100%', background: Z.gap.bg }}>
                <span className="text-[13px] font-mono font-bold" style={{ color: Z.gap.text }}>gap</span>
              </div>
              <div className="flex flex-col items-center justify-center shrink-0"
                style={{ width: 120, height: '100%', background: Z.label.bg }}>
                <span className="text-[14px] font-mono font-bold" style={{ color: Z.label.text }}>Label</span>
                <span className="text-[10px] font-mono mt-1 opacity-60" style={{ color: Z.gap.text }}>mt-0.5</span>
                <span className="text-[12px] font-mono opacity-80" style={{ color: Z.label.text }}>description</span>
              </div>
              <div className="flex items-center justify-center shrink-0"
                style={{ width: 72, height: '100%', background: Z.suffix.bg, borderLeft: `1.5px dashed ${Z.suffix.border}` }}>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[14px] font-mono font-bold" style={{ color: Z.suffix.text }}>suffix</span>
                  <span className="text-[9px] font-mono" style={{ color: Z.suffix.text }}>label行高</span>
                  <span className="text-[9px] font-mono" style={{ color: Z.suffix.text }}>+2px+desc行高</span>
                </div>
              </div>
            </div>
            <span className="text-[11px] text-fg-muted">prefix center = label + description 文字塊中心，suffix 使用相同的 calc</span>
          </div>

          {/* Live example */}
          <MenuFrame width={360}>
            <SelectMenuItem size="md" avatar={<Avatar alt="Alice" color="indigo" size="fill" />} description="Design team lead">
              Alice Chen
            </SelectMenuItem>
            <SelectMenuItem size="md" avatar={<Avatar alt="Bob" color="yellow" size="fill" />} description="Backend engineer">
              Bob Wang
            </SelectMenuItem>
          </MenuFrame>
        </div>
      </div>

      {/* Threshold table */}
      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium text-fg-secondary">對齊容器規則總覽</span>
        <div className="overflow-x-auto">
          <table className="border-collapse text-caption">
            <thead><tr><Th>條件</Th><Th>對齊容器</Th><Th>對齊目標</Th><Th>適用場景</Th></tr></thead>
            <tbody>
              <tr>
                <Td>prefix &le; 24px</Td>
                <Td mono>一行文字高度</Td>
                <Td>第一行 label 垂直中心</Td>
                <Td>icon (16/20px), checkbox (16/20px)</Td>
              </tr>
              <tr>
                <Td>prefix &gt; 24px + 有 desc</Td>
                <Td mono>label行高 + 2px + desc行高</Td>
                <Td>label + gap + desc 文字塊中心</Td>
                <Td>avatar (32/40px) with description</Td>
              </tr>
              <tr>
                <Td>無 description</Td>
                <Td mono>一行文字高度</Td>
                <Td>強制 inline（prefix 上限 24px）</Td>
                <Td>所有無 description 的情況</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. 閱讀模式比較
   ═══════════════════════════════════════════════════════════════════════════ */

export const ReadingModes = {
  name: '3. 閱讀模式比較',
  render: () => (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <H3>掃描模式 vs 閱讀模式</H3>
        <Desc>
          同一套佈局結構，typography 策略依閱讀場景調整。掃描模式用於浮層（一掃而過），
          閱讀模式用於頁面/表單（仔細閱讀）。差異在行高和 description 字體。
        </Desc>
      </div>

      {/* Side-by-side at all sizes */}
      <div className="flex gap-12 items-start">
        {/* Scanning */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-caption font-semibold text-foreground">掃描模式（Scanning）</span>
            <span className="text-[11px] text-fg-muted">浮層 / overlay — SelectMenuItem, ComboboxItem</span>
          </div>
          {SIZES.map((sz) => (
            <div key={sz} className="flex items-start gap-3">
              <span className="text-[12px] text-fg-muted w-6 shrink-0 pt-2 font-mono font-semibold">{sz}</span>
              <MenuFrame width={300}>
                <SelectMenuItem size={sz} startIcon={Mail} description="每日寄送摘要信件">
                  電子郵件通知
                </SelectMenuItem>
              </MenuFrame>
            </div>
          ))}
          <div className="mt-1 flex flex-col gap-1 text-[11px] text-fg-muted">
            <p><strong>Label:</strong> leading-compact (1.3)</p>
            <p><strong>Desc:</strong> 降一級字體 + fg-secondary</p>
            <p><strong>Gap:</strong> mt-0.5 (2px)</p>
          </div>
        </div>

        {/* Reading */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-caption font-semibold text-foreground">閱讀模式（Reading）</span>
            <span className="text-[11px] text-fg-muted">頁面 / 表單 — SelectionItem (Checkbox/Radio)</span>
          </div>
          {SIZES.map((sz) => (
            <div key={sz} className="flex items-start gap-3">
              <span className="text-[12px] text-fg-muted w-6 shrink-0 pt-2 font-mono font-semibold">{sz}</span>
              <div className="w-[300px]">
                <SelectionItem
                  size={sz}
                  control={<Checkbox size={sz} checked={true} />}
                  label="電子郵件通知"
                  description="每日寄送摘要信件到您的電子信箱"
                />
              </div>
            </div>
          ))}
          <div className="mt-1 flex flex-col gap-1 text-[11px] text-fg-muted">
            <p><strong>Label:</strong> default line-height (1.5)</p>
            <p><strong>Desc:</strong> 同字體 + fg-secondary（僅顏色區分）</p>
            <p><strong>Gap:</strong> mt-0.5 (2px)</p>
          </div>
        </div>
      </div>

      {/* Token comparison table */}
      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium text-fg-secondary">Typography Token 對照表</span>
        <div className="overflow-x-auto">
          <table className="border-collapse text-caption">
            <thead>
              <tr>
                <Th>Size</Th>
                <Th>掃描 — Label</Th>
                <Th>掃描 — Desc</Th>
                <Th>閱讀 — Label</Th>
                <Th>閱讀 — Desc</Th>
                <Th>Label-Desc Gap</Th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map((sz) => {
                const sc = SCANNING_SPECS[sz]
                const rd = READING_SPECS[sz]
                return (
                  <tr key={sz}>
                    <Td mono>{sz}</Td>
                    <Td><TkVal token={sc.labelFont} value={`${sc.labelSize}, lh ${sc.labelLh}`} /></Td>
                    <Td><TkVal token={sc.descFont} value={`${sc.descSize}, lh ${sc.descLh}`} /></Td>
                    <Td><TkVal token={rd.labelFont} value={`${rd.labelSize}, lh ${rd.labelLh}`} /></Td>
                    <Td><TkVal token={rd.descFont} value={`${rd.descSize}, lh ${rd.descLh}`} /></Td>
                    <Td mono>mt-0.5 (2px)</Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. Icon 色彩 + 消費元件預設
   ═══════════════════════════════════════════════════════════════════════════ */

export const IconColorsAndPresets = {
  name: '4. Icon 色彩 + 消費元件預設',
  render: () => (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <H3>Icon 色彩原則</H3>
        <Desc>
          一條統一規則：icon 代表 label 內容或類別時，與 label 同色（foreground）。
          icon 純粹指示方向/展開/導覽時，fg-muted。Suffix value 文字與 label 同字體大小，只降色不降級。
        </Desc>
      </div>

      {/* Color rule table */}
      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium text-fg-secondary">色彩判斷規則</span>
        <div className="overflow-x-auto">
          <table className="border-collapse text-caption">
            <thead><tr><Th>判斷</Th><Th>顏色</Th><Th>範例</Th></tr></thead>
            <tbody>
              <tr>
                <Td>代表內容/類別</Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <Swatch value="--foreground" />
                    <span className="font-mono">foreground（繼承）</span>
                  </span>
                </Td>
                <Td>Mail, Settings, Star</Td>
              </tr>
              <tr>
                <Td>代表危險操作</Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <Swatch value="--error" />
                    <span className="font-mono">text-error（與 label 同色）</span>
                  </span>
                </Td>
                <Td>Trash2 + 紅色 label</Td>
              </tr>
              <tr>
                <Td>指示方向/展開</Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <Swatch value="--fg-muted" />
                    <span className="font-mono">text-fg-muted</span>
                  </span>
                </Td>
                <Td>ChevronRight, ChevronDown, ExternalLink</Td>
              </tr>
              <tr>
                <Td>suffix value 文字</Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <Swatch value="--fg-muted" />
                    <span className="font-mono">fg-muted, 同 label 字體大小</span>
                  </span>
                </Td>
                <Td>&quot;深色&quot;、&quot;已啟用&quot;</Td>
              </tr>
              <tr>
                <Td>disabled</Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <Swatch value="--fg-disabled" />
                    <span className="font-mono">text-fg-disabled</span>
                  </span>
                </Td>
                <Td>全部統一</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual reference — live examples */}
      <div className="flex flex-col gap-4">
        <span className="text-caption font-medium text-fg-secondary">視覺參考</span>
        <div className="flex gap-8 items-start">
          {/* Prefix icons: inherit foreground */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-fg-muted font-medium">Prefix icon = foreground（代表內容）</span>
            <MenuFrame width={260}>
              <SelectMenuItem size="md" startIcon={Mail}>電子郵件</SelectMenuItem>
              <SelectMenuItem size="md" startIcon={Settings}>設定</SelectMenuItem>
              <SelectMenuItem size="md" startIcon={Star}>收藏</SelectMenuItem>
            </MenuFrame>
          </div>

          {/* Suffix indicator: fg-muted */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-fg-muted font-medium">Suffix indicator = fg-muted（指示方向）</span>
            <MenuFrame width={280}>
              <SelectMenuItem
                size="md"
                startIcon={Globe}
                endContent={
                  <div className="h-[1lh] flex items-center gap-1 ml-auto">
                    <span className="text-body text-fg-muted">English</span>
                    <ChevronRight size={16} className="text-fg-muted" />
                  </div>
                }
              >
                語言
              </SelectMenuItem>
              <SelectMenuItem
                size="md"
                startIcon={Lock}
                endContent={
                  <div className="h-[1lh] flex items-center ml-auto">
                    <ChevronRight size={16} className="text-fg-muted" />
                  </div>
                }
              >
                隱私設定
              </SelectMenuItem>
            </MenuFrame>
          </div>

          {/* Danger: same color as label */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-fg-muted font-medium">危險操作 = 與 label 同色（text-error）</span>
            <MenuFrame width={260}>
              <SelectMenuItem size="md" startIcon={Trash2} className="text-error">
                刪除專案
              </SelectMenuItem>
            </MenuFrame>
          </div>
        </div>
      </div>

      {/* Consumer preset comparison */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-caption font-semibold text-foreground">消費元件預設比較</span>
          <span className="text-[11px] text-fg-muted">每個元件自訂間距，但結構和對齊規則不變</span>
        </div>

        <div className="overflow-x-auto">
          <table className="border-collapse text-caption">
            <thead>
              <tr>
                <Th>屬性</Th>
                <Th>SelectMenuItem</Th>
                <Th>SelectionItem</Th>
                <Th>ListItem</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: '場景', k: 'desc' as const },
                { label: '閱讀模式', k: 'mode' as const },
                { label: 'padding-y', k: 'py' as const },
                { label: 'padding-x', k: 'px' as const },
                { label: 'prefix-content gap', k: 'gap' as const },
                { label: 'suffix gap', k: 'suffixGap' as const },
              ].map(({ label, k }) => (
                <tr key={label}>
                  <Td>{label}</Td>
                  <Td mono>{CONSUMERS.SelectMenuItem[k]}</Td>
                  <Td mono>{CONSUMERS.SelectionItem[k]}</Td>
                  <Td mono>{CONSUMERS.ListItem[k]}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live consumer examples */}
      <div className="flex flex-col gap-4">
        <span className="text-caption font-medium text-fg-secondary">消費元件即時範例（md size）</span>
        <div className="flex gap-8 items-start">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-fg-muted font-medium">SelectMenuItem</span>
            <MenuFrame width={280}>
              <SelectMenuItem size="md" startIcon={Mail} description="每日寄送摘要信件">
                電子郵件通知
              </SelectMenuItem>
              <SelectMenuItem size="md" startIcon={Bell}>
                推送通知
              </SelectMenuItem>
            </MenuFrame>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-fg-muted font-medium">SelectionItem</span>
            <div className="w-[280px]">
              <SelectionItem
                size="md"
                control={<Checkbox size="md" checked={true} />}
                label="電子郵件通知"
                description="每日寄送摘要信件"
              />
              <SelectionItem
                size="md"
                control={<Checkbox size="md" />}
                label="推送通知"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-fg-muted font-medium">ListItem（模擬）</span>
            <div className="w-[280px] rounded-lg border border-divider overflow-hidden bg-surface">
              <ListItemPreview
                size="md"
                startIcon={Mail}
                label="電子郵件通知"
                description="每日寄送摘要信件"
                suffix={<ChevronRight size={16} className="text-fg-muted" />}
              />
              <div className="border-t border-divider" />
              <ListItemPreview
                size="md"
                startIcon={Bell}
                label="推送通知"
                suffix={<ChevronRight size={16} className="text-fg-muted" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}
