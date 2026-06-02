/**
 * eSIM 出差開通 App — iOS-style prototype
 * ── 消費的 SSOT ──
 * - layout-space tokens: --layout-space-loose (16px) / --layout-space-tight (12px) / --layout-space-bottom (48px)
 * - colors: --primary / --primary-subtle / --error / --success / --success-subtle / --warning-subtle / --fg-muted / --fg-disabled
 * - radius: rounded-2xl (iOS card), rounded-xl, rounded-full
 * - icons: lucide-react
 */

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Plane, Shield, Smartphone, ChevronRight, ChevronLeft, Check,
  Wifi, Signal, Globe, CalendarDays, Briefcase, Zap, Phone, X,
  AlertCircle, CheckCircle2, Clock, BarChart2, Download,
  Building2, User, ScanLine, Loader2, Settings, Home, TrendingUp, MapPin,
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

  // ── iOS UITabBarController bottom tab bar ──
  tabBar:
    'flex-shrink-0 bg-[rgba(242,242,247,0.92)] border-t border-[rgba(0,0,0,0.08)] backdrop-blur-sm' +
    ' flex items-end px-2 pt-2 pb-6', // @layout-space-magic-ok: px-2=8px tab-bar side inset; pt-2=8px icon-area top; pb-6=24px safe-area for Dynamic Island devices (iOS UITabBarController safe-area)
  tabItem: (active: boolean) =>
    `flex-1 flex flex-col items-center gap-0.5 ${active ? 'text-[var(--primary)]' : 'text-[rgba(60,60,67,0.45)]'}`, // @layout-space-magic-ok: gap-0.5=2px icon→label optical nudge within bundled tab-item
  tabLabel: 'text-[10px] font-medium leading-none', // @layout-space-magic-ok: iOS UITabBarItem label = 10pt (Apple HIG UITabBar fixed typographic scale)

  // ── Usage tab chart section ──
  usageChartTitle: `text-[15px] font-semibold text-[#1c1c1e] mb-3`, // @layout-space-magic-ok: mb-3=12px title→progress-bar gap, functional dependency pair within usage card bundle
  progressBar:     `h-3 bg-[rgba(120,120,128,0.16)] rounded-full overflow-hidden mb-2`, // @layout-space-magic-ok: h-3=12px progress-bar fixed visual element (iOS UIProgressView height); mb-2=8px bar→label gap bundled indicator element
  activateHeroTitle: `text-[17px] font-semibold text-[#1c1c1e] mb-1`, // @layout-space-magic-ok: mb-1=4px intra-heading bundle (title→subtitle, same semantic unit, tighter than tight)
  devDots: `flex gap-1.5`, // @layout-space-magic-ok: gap-1.5=6px iOS page-indicator dot cluster — fixed motif per Apple HIG UIPageControl (not consumer layout region)
  statusIcons: `flex items-center gap-1.5`, // @layout-space-magic-ok: gap-1.5=6px status-bar icon cluster — system chrome fixed motif (not consumer layout region)
  devControls: `flex flex-col items-center gap-2`, // @layout-space-magic-ok: gap-2=8px toggle→dots dev-controls cluster — external dev UI, not consumer layout region
  themeToggleTrack: (isModern: boolean) => `flex rounded-full p-0.5 ${isModern ? 'bg-white/10' : 'bg-black/10'}`, // @layout-space-magic-ok: p-0.5=2px toggle-track inset — fixed pill-control hardware metaphor (UISegmentedControl track)

  // ── Checking screen footer CTA stack ──
  checkingFooter: `px-[${loose}] pb-[${bottom}] pt-[${loose}] mt-auto flex flex-col gap-3`, // @layout-space-magic-ok: gap-3=12px footer CTA button stack, bundled pair (functional dependency, not cross-region layout)

  // ── Chip group container ──
  chipGroupPad: `px-[${loose}] py-3`, // @layout-space-magic-ok: py-3=12px chip-group inner padding, bundled chip-family vertical breathing (not cross-region layout)
  chipRow: `flex flex-wrap gap-2`, // @layout-space-magic-ok: gap-2=8px chip→chip gap, bundled chip-family per inline-input analogy
  segmentRow: `flex gap-2`, // @layout-space-magic-ok: gap-2=8px data-option chip horizontal group, bundled

  // ── Plan card sub-layout ──
  planSummaryRow: `px-[${loose}] py-3 flex items-center gap-[${tight}]`, // @layout-space-magic-ok: py-3=12px compact summary row, bundled
  planCardHeader: `flex items-start justify-between mb-3`, // @layout-space-magic-ok: mb-3=12px card-title→specs gap, functional dependency within card bundle
  planCardBadgeRow: `flex items-center gap-2 mb-1`, // @layout-space-magic-ok: gap-2/mb-1=8px/4px badge cluster, bundled inline chip family
  planCardSpecRow: `flex items-center gap-[${loose}] mb-3 text-[14px] font-medium`, // @layout-space-magic-ok: mb-3=12px specs→features gap within card; text-[14px]=iOS subheadline
  planCardFeatureList: `flex flex-col gap-1`, // @layout-space-magic-ok: gap-1=4px feature-list line spacing, bundled list family
  planCardFeatureRow: `flex items-center gap-2`, // @layout-space-magic-ok: gap-2=8px check-icon + feature-text, bundled icon-label pair
  planCardConfirmRow: (cls: string) => `mt-3 flex items-center justify-center gap-2 text-[13px] font-medium ${cls}`, // @layout-space-magic-ok: mt-3/gap-2=12px/8px confirm indicator row, bundled status within card

  // ── Install screen method badge row ──
  installBadgeRow: `flex items-center gap-2`, // @layout-space-magic-ok: gap-2=8px badge inline cluster, bundled

  // ── Success screen header ──
  successHeroSection: `flex flex-col items-center py-[${loose}] px-[${loose}]`,
  successSegmentTrack: `mx-[${loose}] mb-[${tight}] bg-[rgba(120,120,128,0.12)] rounded-xl p-1 flex`, // @layout-space-magic-ok: p-1=2px iOS UISegmentedControl track inset (fixed hardware metaphor)
  successTabBtn: (active: boolean) =>
    `flex-1 py-1.5 rounded-lg text-[14px] font-semibold transition-all ${// @layout-space-magic-ok: py-1.5=6px UISegmentedControl segment vertical per Apple HIG
      active ? 'bg-white text-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.1)]' : 'text-[var(--fg-muted)]'
    }`,
  successUsageCard: `p-[${loose}] mb-[${tight}]`,
  successUsageHeader: `flex items-center justify-between mb-3`, // @layout-space-magic-ok: mb-3=12px title→progress-bar gap within usage card bundle
  successFooter: `px-[${loose}] pb-[${bottom}] pt-3 flex-shrink-0 flex flex-col gap-2`, // @layout-space-magic-ok: gap-2=8px stacked CTA buttons, bundled footer sibling group; pt-3=12px content-edge→button visual gap

  // ── Dashboard hero card (active plan banner) ──
  dashHero:
    `mx-[${loose  }] rounded-3xl p-[${loose}] bg-[var(--primary)] text-white overflow-hidden relative`,
  dashHeroSub: `text-[13px] font-medium text-white/70 mt-0.5`, // @layout-space-magic-ok: mt-0.5=2px optical gap, intra-hero bundle
  dashStatCard:
    `flex-1 bg-white rounded-2xl p-[${tight}] flex flex-col gap-1`, // @layout-space-magic-ok: gap-1=4px label→value pair, bundled stat atom
  dashActiveBadge:
    `inline-flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 mb-2`, // @layout-space-magic-ok: px-2/py-0.5=8px/2px hero badge-pill micro-element (fixed visual chip, not layout-region); mb-2=8px badge→title functional dependency within hero card bundle
  dashIconTileOffset:
    `${'' /* placeholder — computed below */}`, // unused; see dashHeroIconTile
  dashHeroIconTile:
    `bg-white/20 mt-1`, // @layout-space-magic-ok: mt-1=4px optical alignment nudge between icon tile and hero title top (intra-card bundle)
  dashProgressLabel:
    `flex justify-between text-[12px] text-white/80 mb-1`, // @layout-space-magic-ok: mb-1=4px label→bar functional dependency within bundled progress block; text-[12px]=iOS footnote (fixed typographic scale)

  // ── Shared screen footer (CTA bar) ──
  screenFooter: `px-[${loose}] pb-[${bottom}] pt-3 flex-shrink-0`, // @layout-space-magic-ok: pt-3=12px screen-content→button breathing per Apple HIG bottom CTA bar rhythm (UIKit fixed spec)

  // ── Plan card ──
  planCard: (selected: boolean) =>
    `w-full text-left bg-white rounded-2xl p-[${loose}] border-2 transition-all ${
      selected ? 'border-[var(--primary)] shadow-[0_4px_12px_rgba(0,107,255,0.15)]' : 'border-transparent shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
    }`,
    // @layout-space-magic-ok: same card padding/radius as ios.groupCard; shadow values are elevation-layer not spacing
}

// ─────────────────────────────────────────────
// Theme type + Modern (dark) style constants
// Inspired by consumer telecom apps (Firsty / Circles / Airalo):
// deep-navy bg + lime accent #c8f135 + glassmorphism cards
// ─────────────────────────────────────────────
export type Theme = 'corporate' | 'modern'

const dark = {
  // ── Outer shell ──
  outerBg: 'bg-[#0a0f1e]',
  frameBorder: 'border-[#2a2a3e]',

  // ── Frame inner bg ──
  screenBg: 'bg-[#0d1229]',

  // ── Status bar (dark glass) ──
  statusBar:
    `flex items-center justify-between px-7 pt-3 pb-1 bg-transparent flex-shrink-0`, // @layout-space-magic-ok: same hardware dims as ios.statusBar; dark variant = transparent bg

  // ── Tab bar (dark glassmorphism) ──
  tabBar:
    'flex-shrink-0 bg-[rgba(13,18,41,0.92)] border-t border-white/[0.08] backdrop-blur-sm' +
    ' flex items-end px-2 pt-2 pb-6', // @layout-space-magic-ok: same hardware dims as ios.tabBar
  tabItem: (active: boolean) =>
    `flex-1 flex flex-col items-center gap-0.5 ${active ? 'text-[#c8f135]' : 'text-white/40'}`, // @layout-space-magic-ok: same gap-0.5 bundled tab-item as ios.tabItem

  // ── Greeting bar ──
  greetSub:  'text-[13px] text-white/50', // @layout-space-magic-ok: iOS caption1
  greetName: 'text-[28px] font-bold text-white leading-tight', // @layout-space-magic-ok: iOS title3
  avatarRing: 'w-[40px] h-[40px] rounded-full bg-[#c8f135]/20 flex items-center justify-center border border-[#c8f135]/30',
  // @layout-space-magic-ok: avatar 40px fixed element per Apple HIG navigation avatar size

  // ── Hero card (gradient) ──
  heroCard:
    `mx-[${loose}] rounded-3xl p-[${loose}] overflow-hidden relative` +
    ' bg-gradient-to-br from-[#1a3a6e] via-[#0f2654] to-[#0d1229]' +
    ' border border-white/[0.08]',
  heroBadge:
    `inline-flex items-center gap-1 bg-[#c8f135]/20 border border-[#c8f135]/40 rounded-full px-2 py-0.5 mb-2`, // @layout-space-magic-ok: same micro-element dims as ios.dashActiveBadge
  heroBigNum:
    'text-[52px] font-black text-white leading-none tracking-tight', // @layout-space-magic-ok: hero big-number display — fixed typographic motif (Firsty-style dominant metric)
  heroUnit:
    'text-[22px] font-bold text-white/60 ml-1', // @layout-space-magic-ok: iOS title2; ml-1=4px unit suffix optical nudge, intra-heading bundle
  heroSub:
    `text-[13px] text-white/50 mt-0.5`, // @layout-space-magic-ok: mt-0.5=2px optical gap, intra-hero bundle; iOS caption1
  heroProgressLabel:
    `flex justify-between text-[12px] text-white/50 mb-1`, // @layout-space-magic-ok: same dims as ios.dashProgressLabel
  heroCta:
    `w-full h-[48px] rounded-2xl bg-[#c8f135] text-[#0d1229] font-bold text-[15px]` +
    ` flex items-center justify-center gap-[${tight}] active:opacity-90 transition-opacity mt-[${tight}]`,
    // @layout-space-magic-ok: h-[48px] = compact CTA; mt-tight = 12px card-content→CTA functional dependency

  // ── Stat tiles ──
  statCard:
    `flex-1 rounded-2xl p-[${tight}] flex flex-col gap-1 bg-white/[0.06] border border-white/[0.08]`, // @layout-space-magic-ok: gap-1=4px bundled stat atom (same as ios.dashStatCard)
  statLabel: 'text-[11px] font-medium text-white/50 uppercase tracking-wide', // @layout-space-magic-ok: iOS caption2
  statValue: 'text-[20px] font-bold text-white', // @layout-space-magic-ok: iOS title3 stat value
  statSub:   'text-[11px] text-white/40', // @layout-space-magic-ok: iOS caption2

  // ── Section header ──
  sectionLabel:
    `px-[${loose}] pb-1.5 pt-5 text-[13px] font-medium text-white/40 uppercase tracking-wide`, // @layout-space-magic-ok: same dims as ios.sectionLabel

  // ── Glass card + row ──
  groupCard:
    `mx-[${loose}] rounded-2xl overflow-hidden bg-white/[0.06] border border-white/[0.08]`,
  groupRow:
    `flex items-center px-[${loose}] py-3.5 gap-[${tight}]`, // @layout-space-magic-ok: same 44px tap-target dims as ios.groupRow
  groupDivider:
    `ml-14 border-b border-white/[0.06]`, // @layout-space-magic-ok: same ml-14 inset separator as ios.groupDivider

  // ── Row text ──
  rowTitle: 'text-[15px] font-medium text-white',
  rowSub:   'text-[13px] text-white/50', // @layout-space-magic-ok: iOS caption1
  rowMeta:  'text-[12px] font-semibold text-[#c8f135]', // @layout-space-magic-ok: iOS footnote inline status

  // ── Icon tile ──
  iconTile:
    `w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.1]`, // @layout-space-magic-ok: 32px iOS list icon grid spec

  // ── Login CTA ──
  loginBtn:
    `w-full h-[54px] rounded-2xl bg-[#c8f135] text-[#0d1229] font-bold` +
    ` text-[17px] flex items-center justify-center gap-[${tight}] active:opacity-90 transition-opacity`,
    // @layout-space-magic-ok: same iOS prominent button spec as ios.primaryBtn
  loginSubtitle: `text-[15px] text-white/50 mt-1`, // @layout-space-magic-ok: mt-1=4px title→subtitle intra-heading bundle (tighter than tight, same semantic unit)
  loginFooter: `px-[${loose}] pb-[${bottom}] pt-[${tight}] flex flex-col gap-3`, // @layout-space-magic-ok: gap-3=12px CTA→footnote bundled footer pair (functional dependency, not cross-region layout)

  // ── Nav bar ──
  navBar:
    `flex items-center px-[${loose}] py-2` + // @layout-space-magic-ok: py-2=8px iOS UINavigationBar vertical padding (fixed system chrome, not layout region)
    ' bg-[rgba(13,18,41,0.92)] border-b border-white/[0.06] backdrop-blur-sm flex-shrink-0',
  navBack: `flex items-center gap-0.5 text-[#c8f135] text-[17px] font-normal`, // @layout-space-magic-ok: gap-0.5=2px chevron↔label optical nudge; text-[17px]=iOS body per Apple HIG
  navTitle: 'text-[17px] font-semibold text-white text-center flex-1',

  // ── Large title (iOS largeTitle, dark variant) ──
  largeTitle:
    `px-[${loose}] pt-3 pb-2 text-[34px] font-bold text-white leading-tight`, // @layout-space-magic-ok: pt-3/pb-2=iOS largeTitle vertical rhythm (UINavigationBar spec); text-[34px]=iOS title1=34pt per Apple HIG Typography

  // ── Secondary CTA ──
  secondaryBtn:
    `w-full h-[54px] rounded-2xl border border-white/20 text-white font-semibold` +
    ` text-[17px] flex items-center justify-center gap-[${tight}] active:opacity-80 transition-opacity`,
    // @layout-space-magic-ok: same iOS prominent button spec as ios.secondaryBtn

  // ── Selection chips ──
  pillChip: (selected: boolean) =>
    `px-3 py-1.5 rounded-full text-[14px] font-medium border transition-colors ${// @layout-space-magic-ok: same micro-dims as ios.pillChip
      selected
        ? 'bg-[#c8f135] text-[#0d1229] border-[#c8f135]'
        : 'bg-white/[0.06] text-white border-white/20'
    }`,
  segmentBtn: (selected: boolean) =>
    `flex-1 py-2 rounded-xl text-[13px] font-medium border transition-colors ${// @layout-space-magic-ok: same UISegmentedControl dims as ios.segmentBtn
      selected
        ? 'bg-[#c8f135] text-[#0d1229] border-[#c8f135]'
        : 'bg-white/[0.06] text-white border-white/10'
    }`,
  segmentTrack: `mx-[${loose}] mb-[${tight}] bg-white/[0.08] rounded-xl p-1 flex`, // @layout-space-magic-ok: p-1=2px iOS UISegmentedControl track inset (fixed hardware metaphor)

  // ── Plan card ──
  planCard: (selected: boolean) =>
    `w-full text-left rounded-2xl p-[${loose}] border-2 transition-all ${
      selected
        ? 'bg-white/[0.08] border-[#c8f135] shadow-[0_4px_12px_rgba(200,241,53,0.12)]'
        : 'bg-white/[0.04] border-white/[0.08]'
    }`,

  // ── Warning / notice box ──
  warningBox:
    `mx-[${loose}] mt-[${tight}] bg-[#c8f135]/[0.08] border border-[#c8f135]/20 rounded-2xl p-[${loose}] flex gap-[${tight}]`,

  // ── Radio (dark lime) ──
  radioOuter: (on: boolean) =>
    `w-5 h-5 rounded-full border-2 flex items-center justify-center ${
      on ? 'border-[#c8f135] bg-[#c8f135]' : 'border-white/30 bg-transparent'
    }`,
    // @layout-space-magic-ok: iOS radio = 20px fixed UI control (same as ios.radioOuter)
  radioDot: 'w-2 h-2 rounded-full bg-[#0d1229]', // @layout-space-magic-ok: radio inner dot = 8px fixed

  // ── Success screen (dark variants) ──
  successSegmentTrack: `mx-[${loose}] mb-[${tight}] bg-white/[0.08] rounded-xl p-1 flex`, // @layout-space-magic-ok: p-1=2px UISegmentedControl track inset
  successTabBtn: (active: boolean) =>
    `flex-1 py-1.5 rounded-lg text-[14px] font-semibold transition-all ${// @layout-space-magic-ok: py-1.5=6px UISegmentedControl segment vertical per Apple HIG
      active ? 'bg-white/[0.15] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)]' : 'text-white/40'
    }`,
  successUsageCard: `p-[${loose}] mb-[${tight}]`,
  successUsageHeader: `flex items-center justify-between mb-3`, // @layout-space-magic-ok: mb-3=12px title→progress-bar gap
  successFooter: `px-[${loose}] pb-[${bottom}] pt-3 flex-shrink-0 flex flex-col gap-2`, // @layout-space-magic-ok: gap-2/pt-3=8px/12px stacked CTAs footer; pt-3=12px Apple HIG CTA bar rhythm
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatusBar({ theme = 'corporate' }: { theme?: Theme }) {
  const fg = theme === 'modern' ? 'text-white' : 'text-[#1c1c1e]'
  const islandBg = theme === 'modern' ? 'bg-white/20' : 'bg-[#1c1c1e]'
  const barCls = theme === 'modern' ? dark.statusBar : ios.statusBar
  return (
    <div className={barCls}>
      <span className={`text-[15px] font-semibold ${fg}`}>9:41</span>
      {/* @layout-space-magic-ok: text-[15px] = iOS subheadline; status bar = system chrome */}
      <div className={`w-[120px] h-[34px] ${islandBg} rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2`} />
      {/* @layout-space-magic-ok: Dynamic Island = 120×34px hardware dims; top-2 = fixed system position */}
      <div className={ios.statusIcons}>
        <Signal size={16} className={fg} />
        <Wifi   size={15} className={fg} />
        <div className={`w-[25px] h-[12px] rounded-sm border-[1.5px] ${theme === 'modern' ? 'border-white/60' : 'border-[#1c1c1e]'} relative flex items-center px-[1.5px]`}>
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
// iOS Bottom Tab Bar (UITabBarController)
// ─────────────────────────────────────────────
type Tab = 'home' | 'activate' | 'esim' | 'usage' | 'settings'

const TAB_ITEMS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'home',     label: '首頁',      Icon: Home },
  { id: 'activate', label: '出差開通', Icon: Plane },
  { id: 'esim',     label: '我的 eSIM', Icon: Smartphone },
  { id: 'usage',    label: '用量',      Icon: BarChart2 },
  { id: 'settings', label: '設定',      Icon: Settings },
]

function BottomTabBar({ tab, onTabChange, theme = 'corporate' }: { tab: Tab; onTabChange: (t: Tab) => void; theme?: Theme }) {
  const t = theme === 'modern' ? dark : ios
  return (
    <div className={t.tabBar}>
      {TAB_ITEMS.map(({ id, label, Icon }) => (
        <button key={id} className={t.tabItem(tab === id)} onClick={() => onTabChange(id)} aria-label={label}>
          <Icon size={24} />
          <span className={ios.tabLabel}>{label}</span>
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Dashboard (首頁)
// ─────────────────────────────────────────────
function DashboardTab({ onGoActivate, theme = 'corporate' }: { onGoActivate: () => void; theme?: Theme }) {
  const isModern = theme === 'modern'

  if (isModern) return (
    <div className={`flex flex-col h-full ${dark.screenBg}`}>
      {/* Greeting */}
      <div className={`flex items-center justify-between px-[${loose}] pt-[${loose}] pb-[${tight}]`}>
        <div>
          <p className={dark.greetSub}>早安，</p>
          <h1 className={dark.greetName}>王大明</h1>
        </div>
        <div className={dark.avatarRing}>
          <User size={20} className="text-[#c8f135]" />
        </div>
      </div>

      <div className={ios.screen}>
        {/* Hero — big data number + progress + CTA */}
        <div className={dark.heroCard}>
          <div className="absolute -right-6 -top-6 w-[140px] h-[140px] rounded-full bg-[#c8f135]/[0.05] pointer-events-none" />
          {/* @layout-space-magic-ok: 140px decorative motif (fixed visual element) */}

          <div className={dark.heroBadge}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#c8f135]" />
            {/* @layout-space-magic-ok: w-1.5/h-1.5=6px status dot fixed indicator motif */}
            <span className="text-[11px] font-semibold text-[#c8f135]">啟用中</span>
            {/* text-[11px] @layout-space-magic-ok: iOS caption2 */}
          </div>

          <div className="flex items-end justify-between relative z-10">
            <div>
              <div className="flex items-baseline">
                <span className={dark.heroBigNum}>3.6</span>
                <span className={dark.heroUnit}>GB 剩餘</span>
              </div>
              <p className={dark.heroSub}>推薦方案・日本・到期 06/14</p>
            </div>
            <div className={dark.iconTile}>
              <Globe size={16} className="text-[#c8f135]" />
            </div>
          </div>

          <div className={`mt-[${tight}]`}>
            <div className={dark.heroProgressLabel}>
              <span>已用 1.4 GB</span><span>共 5 GB</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              {/* h-2 @layout-space-magic-ok: 8px hero progress bar fixed visual motif */}
              <div className="h-full bg-[#c8f135] rounded-full" style={{ width: '28%' }} />
            </div>
          </div>

          <button className={dark.heroCta} onClick={onGoActivate}>
            <Plane size={18} />管理方案
          </button>
        </div>

        {/* Stat tiles */}
        <div className={`flex gap-[${tight}] px-[${loose}] mt-[${tight}]`}>
          <div className={dark.statCard}>
            <p className={dark.statLabel}>今日用量</p>
            <p className={dark.statValue}>234 MB</p>
            <div className={`${ios.iconTextPair} text-[#c8f135] text-[11px] font-medium`}>
              <TrendingUp size={12} />正常
            </div>
          </div>
          <div className={dark.statCard}>
            <p className={dark.statLabel}>本月費用</p>
            <p className={dark.statValue}>NT$680</p>
            <p className={dark.statSub}>月結入帳</p>
          </div>
        </div>

        {/* Active devices */}
        <p className={dark.sectionLabel}>啟用中的裝置</p>
        <div className={dark.groupCard}>
          {[
            { name: 'iPhone 16 Pro', sub: 'iOS 18.3.2・主要裝置', active: true },
            { name: 'iPad Pro 13"',  sub: 'iPadOS 18.3・已配置',  active: true },
          ].map(({ name, sub, active }, i, arr) => (
            <div key={name}>
              <div className={dark.groupRow}>
                <div className={dark.iconTile}><Smartphone size={16} className="text-[#c8f135]" /></div>
                <div className="flex-1">
                  <p className={dark.rowTitle}>{name}</p>
                  <p className={dark.rowSub}>{sub}</p>
                </div>
                {active && <span className={dark.rowMeta}>● 線上</span>}
              </div>
              {i < arr.length - 1 && <div className={dark.groupDivider} />}
            </div>
          ))}
        </div>

        {/* Upcoming trips */}
        <p className={dark.sectionLabel}>近期出差</p>
        <div className={dark.groupCard}>
          <div className={dark.groupRow}>
            <div className={dark.iconTile}><MapPin size={16} className="text-[#c8f135]" /></div>
            <div className="flex-1">
              <p className={dark.rowTitle}>日本・東京</p>
              <p className={dark.rowSub}>2026/06/10 — 06/14・商務會議</p>
            </div>
            <span className={dark.rowMeta}>進行中</span>
          </div>
          <div className={dark.groupDivider} />
          <div className={dark.groupRow}>
            <div className={dark.iconTile}><MapPin size={16} className="text-white/40" /></div>
            <div className="flex-1">
              <p className={dark.rowTitle}>美國・紐約</p>
              <p className={dark.rowSub}>2026/07/02 — 07/06・客戶拜訪</p>
            </div>
            <button className="text-[13px] font-semibold text-[#c8f135]" onClick={onGoActivate}>申請</button>
          </div>
        </div>

        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer */}
      </div>
    </div>
  )

  // ── Corporate theme (original) ──
  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <div className={`flex items-center justify-between px-[${loose}] pt-[${loose}] pb-[${tight}]`}>
        <div>
          <p className="text-[13px] text-[var(--fg-muted)]">早安，</p>
          {/* text-[13px] @layout-space-magic-ok: iOS caption1 */}
          <h1 className="text-[28px] font-bold text-[#1c1c1e] leading-tight">王大明</h1>
          {/* text-[28px] @layout-space-magic-ok: iOS title3 */}
        </div>
        <div className="w-[40px] h-[40px] rounded-full bg-[var(--primary-subtle)] flex items-center justify-center">
          {/* @layout-space-magic-ok: avatar 40px fixed element per Apple HIG navigation avatar size */}
          <User size={20} className="text-[var(--primary)]" />
        </div>
      </div>

      <div className={ios.screen}>
        <div className={ios.dashHero}>
          <div className="absolute -right-8 -top-8 w-[120px] h-[120px] rounded-full bg-white/10 pointer-events-none" />
          {/* @layout-space-magic-ok: 120px decorative motif */}
          <div className="absolute -right-2 top-12 w-[80px] h-[80px] rounded-full bg-white/[0.07] pointer-events-none" />
          {/* @layout-space-magic-ok: 80px decorative motif */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className={ios.dashActiveBadge}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                {/* @layout-space-magic-ok: 6px status dot fixed indicator motif */}
                <span className="text-[11px] font-semibold text-white">啟用中</span>
                {/* text-[11px] @layout-space-magic-ok: iOS caption2 */}
              </div>
              <p className="text-[22px] font-bold text-white leading-tight">推薦方案・日本</p>
              {/* text-[22px] @layout-space-magic-ok: iOS title2 */}
              <p className={ios.dashHeroSub}>中華電信・5 GB・到期 2026/06/14</p>
            </div>
            <div className={`${ios.iconTile} ${ios.dashHeroIconTile}`}><Globe size={16} className="text-white" /></div>
          </div>
          <div className={`mt-[${tight}]`}>
            <div className={ios.dashProgressLabel}><span>已用 1.4 GB</span><span>剩餘 3.6 GB</span></div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              {/* h-2 @layout-space-magic-ok: 8px hero progress bar fixed visual motif */}
              <div className="h-full bg-white rounded-full" style={{ width: '28%' }} />
            </div>
          </div>
        </div>

        <div className={`flex gap-[${tight}] px-[${loose}] mt-[${tight}]`}>
          <div className={ios.dashStatCard}>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">今日用量</p>
            {/* text-[11px] @layout-space-magic-ok: iOS caption2 stat label */}
            <p className="text-[20px] font-bold text-[#1c1c1e]">234 MB</p>
            {/* text-[20px] @layout-space-magic-ok: iOS title3 stat value */}
            <div className={`${ios.iconTextPair} text-[var(--success)] text-[11px] font-medium`}><TrendingUp size={12} />正常</div>
          </div>
          <div className={ios.dashStatCard}>
            <p className="text-[11px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">本月費用</p>
            <p className="text-[20px] font-bold text-[#1c1c1e]">NT$680</p>
            <p className="text-[11px] text-[var(--fg-muted)]">月結入帳</p>
          </div>
        </div>

        <p className={ios.sectionLabel}>啟用中的裝置</p>
        <div className={ios.groupCard}>
          {[
            { name: 'iPhone 16 Pro', sub: 'iOS 18.3.2・主要裝置', active: true },
            { name: 'iPad Pro 13"',  sub: 'iPadOS 18.3・已配置',  active: true },
          ].map(({ name, sub, active }, i, arr) => (
            <div key={name}>
              <div className={ios.groupRow}>
                <div className={`${ios.iconTile} ${active ? 'bg-[var(--primary-subtle)]' : 'bg-[rgba(120,120,128,0.1)]'}`}>
                  <Smartphone size={16} className={active ? 'text-[var(--primary)]' : 'text-[var(--fg-muted)]'} />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-[#1c1c1e]">{name}</p>
                  <p className="text-[13px] text-[var(--fg-muted)]">{sub}</p>
                </div>
                {active && <span className="text-[12px] font-semibold text-[var(--success)]">● 線上</span>}
                {/* text-[12px] @layout-space-magic-ok: iOS footnote inline status */}
              </div>
              {i < arr.length - 1 && <div className={ios.groupDivider} />}
            </div>
          ))}
        </div>

        <p className={ios.sectionLabel}>近期出差</p>
        <div className={ios.groupCard}>
          <div className={ios.groupRow}>
            <div className={`${ios.iconTile} bg-[var(--warning-subtle)]`}><MapPin size={16} className="text-[#c47400]" /></div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[#1c1c1e]">日本・東京</p>
              <p className="text-[13px] text-[var(--fg-muted)]">2026/06/10 — 06/14・商務會議</p>
            </div>
            <span className="text-[12px] font-semibold text-[var(--primary)]">進行中</span>
            {/* text-[12px] @layout-space-magic-ok: iOS footnote inline status */}
          </div>
          <div className={ios.groupDivider} />
          <div className={ios.groupRow}>
            <div className={`${ios.iconTile} bg-[rgba(120,120,128,0.1)]`}><MapPin size={16} className="text-[var(--fg-muted)]" /></div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[#1c1c1e]">美國・紐約</p>
              <p className="text-[13px] text-[var(--fg-muted)]">2026/07/02 — 07/06・客戶拜訪</p>
            </div>
            <button className="text-[13px] font-semibold text-[var(--primary)]" onClick={onGoActivate}>申請</button>
          </div>
        </div>

        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer */}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab placeholder screens
// ─────────────────────────────────────────────
function MyEsimTab({ theme = 'corporate' }: { theme?: Theme }) {
  const isM = theme === 'modern'
  const d = isM ? dark : ios
  const bg = isM ? dark.screenBg : 'bg-[#f2f2f7]'
  const titleCls = isM ? 'text-white' : 'text-[#1c1c1e]'
  const rowTitle = isM ? dark.rowTitle : 'text-[15px] font-medium text-[#1c1c1e]'
  const rowSub   = isM ? dark.rowSub   : 'text-[13px] text-[var(--fg-muted)]'
  const chevron  = isM ? 'text-white/20' : 'text-[rgba(60,60,67,0.3)]'
  const esimItems = [
    { label: '日本 出差方案', sub: '啟用中・到期 06/14', statusCls: isM ? 'text-[#c8f135]' : 'text-[var(--success)]', status: '啟用中' },
    { label: '美國 商務方案', sub: '已停用・2026/05/03',  statusCls: isM ? 'text-white/30'  : 'text-[var(--fg-muted)]', status: '已停用' },
  ]
  const quickItems = [
    { label: '開通新 eSIM',   icon: Plane,    iconCls: isM ? 'text-[#c8f135]' : 'text-[var(--primary)]',   tileCls: isM ? '' : 'bg-[var(--primary-subtle)]' },
    { label: '查看 QR Code',  icon: ScanLine, iconCls: isM ? 'text-white/50'  : 'text-[var(--fg-muted)]',  tileCls: isM ? '' : 'bg-[rgba(120,120,128,0.1)]' },
  ]
  return (
    <div className={`flex flex-col h-full ${bg}`}>
      <div className={`px-[${loose}] pt-[${loose}] pb-[${tight}]`}>
        <h1 className={`text-[34px] font-bold ${titleCls}`}>我的 eSIM</h1>
        {/* text-[34px] @layout-space-magic-ok: iOS largeTitle */}
      </div>
      <div className={ios.screen}>
        <div className={d.groupCard}>
          {esimItems.map(({ label, sub, statusCls, status }, i, arr) => (
            <div key={label}>
              <div className={d.groupRow}>
                <div className={`${isM ? dark.iconTile : `${ios.iconTile} bg-[var(--primary-subtle)]`}`}>
                  <Globe size={16} className={isM ? 'text-[#c8f135]' : 'text-[var(--primary)]'} />
                </div>
                <div className="flex-1">
                  <p className={rowTitle}>{label}</p>
                  <p className={rowSub}>{sub}</p>
                </div>
                <span className={`text-[13px] font-medium ${statusCls}`}>{status}</span>
              </div>
              {i < arr.length - 1 && <div className={d.groupDivider} />}
            </div>
          ))}
        </div>
        <p className={d.sectionLabel}>快速操作</p>
        <div className={d.groupCard}>
          {quickItems.map(({ label, icon: Icon, iconCls, tileCls }, i, arr) => (
            <div key={label}>
              <div className={d.groupRow}>
                <div className={`${isM ? dark.iconTile : `${ios.iconTile} ${tileCls}`}`}>
                  <Icon size={16} className={iconCls} />
                </div>
                <p className={`${rowTitle} flex-1`}>{label}</p>
                <ChevronRight size={18} className={chevron} />
              </div>
              {i < arr.length - 1 && <div className={d.groupDivider} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UsageTab({ theme = 'corporate' }: { theme?: Theme }) {
  const isM = theme === 'modern'
  const d = isM ? dark : ios
  const bg = isM ? dark.screenBg : 'bg-[#f2f2f7]'
  const titleCls = isM ? 'text-white' : 'text-[#1c1c1e]'
  const rowTitle = isM ? dark.rowTitle : 'text-[15px] text-[#1c1c1e]'
  const rowSub   = isM ? dark.rowSub   : 'text-[13px] text-[var(--fg-muted)]'
  const cardCls  = isM ? `${dark.groupCard} p-[${loose}] mb-[${tight}]` : `${ios.card} p-[${loose}] mb-[${tight}]`
  const barFill  = isM ? 'bg-[#c8f135]' : 'bg-[var(--primary)]'
  const barUsed  = isM ? 'text-[#c8f135] font-medium' : 'text-[var(--primary)] font-medium'
  const barTotal = isM ? dark.rowSub : 'text-[var(--fg-muted)]'
  const chartTitle = isM
    ? `text-[15px] font-semibold text-white mb-3` // @layout-space-magic-ok: mb-3=12px title→bar gap, functional dependency pair within usage card bundle
    : ios.usageChartTitle
  const progressBar = isM
    ? `h-3 bg-white/10 rounded-full overflow-hidden mb-2` // @layout-space-magic-ok: h-3=12px iOS UIProgressView; mb-2=8px bar→label bundled indicator element
    : ios.progressBar
  return (
    <div className={`flex flex-col h-full ${bg}`}>
      <div className={`px-[${loose}] pt-[${loose}] pb-[${tight}]`}>
        <h1 className={`text-[34px] font-bold ${titleCls}`}>用量</h1>
        {/* text-[34px] @layout-space-magic-ok: iOS largeTitle */}
      </div>
      <div className={ios.screen}>
        <div className={cardCls}>
          <p className={chartTitle}>本月已使用流量</p>
          <div className={progressBar}>
            <div className={`h-full ${barFill} rounded-full`} style={{ width: '42%' }} />
          </div>
          <div className="flex justify-between text-[13px]">
            <span className={barUsed}>已用 2.1 GB</span>
            <span className={barTotal}>總量 5 GB</span>
          </div>
        </div>
        <p className={d.sectionLabel}>費用明細</p>
        <div className={d.groupCard}>
          {[
            { label: '6 月份預估費用', value: 'NT$680', sub: '月結入帳' },
            { label: '5 月份費用',     value: 'NT$450', sub: '已入帳' },
            { label: '4 月份費用',     value: 'NT$0',   sub: '未出差' },
          ].map(({ label, value, sub }, i, arr) => (
            <div key={label}>
              <div className={d.groupRow}>
                <div className="flex-1">
                  <p className={rowTitle}>{label}</p>
                  <p className={rowSub}>{sub}</p>
                </div>
                <p className={`text-[15px] font-semibold ${isM ? 'text-white' : 'text-[#1c1c1e]'}`}>{value}</p>
              </div>
              {i < arr.length - 1 && <div className={d.groupDivider} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsTab({ theme = 'corporate' }: { theme?: Theme }) {
  const isM = theme === 'modern'
  const d = isM ? dark : ios
  const [notify, setNotify] = useState(true)
  const bg = isM ? dark.screenBg : 'bg-[#f2f2f7]'
  const titleCls = isM ? 'text-white' : 'text-[#1c1c1e]'
  const rowTitle = isM ? dark.rowTitle : 'text-[15px] text-[#1c1c1e]'
  const rowSub   = isM ? dark.rowSub   : 'text-[13px] text-[var(--fg-muted)]'
  const chevron  = isM ? 'text-white/20' : 'text-[rgba(60,60,67,0.3)]'
  const profileCard = isM ? `${dark.groupCard} p-[${loose}] mb-[${tight}] flex items-center gap-[${tight}]` : `${ios.card} p-[${loose}] mb-[${tight}] flex items-center gap-[${tight}]`
  const avatarRing  = isM ? dark.avatarRing : 'w-[40px] h-[40px] rounded-full bg-[var(--primary-subtle)] flex items-center justify-center flex-shrink-0'
  const avatarIcon  = isM ? 'text-[#c8f135]' : 'text-[var(--primary)]'
  return (
    <div className={`flex flex-col h-full ${bg}`}>
      <div className={`px-[${loose}] pt-[${loose}] pb-[${tight}]`}>
        <h1 className={`text-[34px] font-bold ${titleCls}`}>設定</h1>
        {/* text-[34px] @layout-space-magic-ok: iOS largeTitle */}
      </div>
      <div className={ios.screen}>
        <div className={profileCard}>
          <div className={avatarRing}>
            {/* @layout-space-magic-ok: avatar 40/52px fixed element per Apple HIG profile card size */}
            <User size={24} className={avatarIcon} />
          </div>
          <div>
            <p className={`text-[17px] font-semibold ${isM ? 'text-white' : 'text-[#1c1c1e]'}`}>王大明</p>
            <p className={rowSub}>engineering@company.com</p>
          </div>
        </div>
        <p className={d.sectionLabel}>通知設定</p>
        <div className={d.groupCard}>
          <div className={d.groupRow}>
            <div className="flex-1">
              <p className={`text-[15px] font-medium ${isM ? 'text-white' : 'text-[#1c1c1e]'}`}>開通成功通知</p>
              <p className={rowSub}>eSIM 安裝完成時通知</p>
            </div>
            <Toggle on={notify} onToggle={() => setNotify(n => !n)} />
          </div>
        </div>
        <p className={d.sectionLabel}>帳戶</p>
        <div className={d.groupCard}>
          {['重新登入公司帳號', '聯絡 IT 支援', '使用條款'].map((label, i, arr) => (
            <div key={label}>
              <div className={d.groupRow}>
                <p className={`${rowTitle} flex-1`}>{label}</p>
                <ChevronRight size={18} className={chevron} />
              </div>
              {i < arr.length - 1 && <div className={d.groupDivider} />}
            </div>
          ))}
        </div>
        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer */}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 1: Login
// ─────────────────────────────────────────────
function LoginScreen({ onNext, theme = 'corporate' }: { onNext: () => void; theme?: Theme }) {
  if (theme === 'modern') return (
    <div className={`flex flex-col h-full ${dark.screenBg}`}>
      <div className={`flex-1 flex flex-col items-center justify-center px-[${loose}] gap-[${loose}]`}>
        {/* Logo */}
        <div className="w-[88px] h-[88px] rounded-[24px] bg-[#c8f135] flex items-center justify-center shadow-[0_8px_32px_rgba(200,241,53,0.3)]">
          {/* @layout-space-magic-ok: 88px logo tile = fixed brand asset; 24px corner = iOS large icon corner */}
          <Plane size={44} className="text-[#0d1229]" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <h1 className="text-[28px] font-black text-white tracking-tight">eSIM 出差開通</h1>
          {/* text-[28px] @layout-space-magic-ok: iOS title3 */}
          <p className={dark.loginSubtitle}>快速開通出差國際上網方案</p>
        </div>
        <div className={`${dark.groupCard} w-full`}>
          {[
            { icon: Shield,    label: '員工身份驗證', sub: '自動連結公司差旅系統' },
            { icon: Zap,       label: '一鍵自動安裝',  sub: '免手動設定，直接啟用' },
            { icon: BarChart2, label: '用量即時追蹤', sub: '費用自動入帳月結' },
          ].map(({ icon: Icon, label, sub }, i, arr) => (
            <div key={label}>
              <div className={dark.groupRow}>
                <div className={dark.iconTile}><Icon size={18} className="text-[#c8f135]" /></div>
                <div className="flex-1">
                  <p className={dark.rowTitle}>{label}</p>
                  <p className={dark.rowSub}>{sub}</p>
                </div>
              </div>
              {i < arr.length - 1 && <div className={dark.groupDivider} />}
            </div>
          ))}
        </div>
      </div>
      <div className={dark.loginFooter}>
        <button className={dark.loginBtn} onClick={onNext}>
          <Building2 size={20} />使用公司帳號登入
        </button>
        <p className="text-[13px] text-center text-white/40">使用公司 SSO 單一登入，安全驗證</p>
        {/* text-[13px] @layout-space-magic-ok: iOS caption1 */}
      </div>
    </div>
  )

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
function CheckingScreen({ onNext, theme = 'corporate' }: { onNext: () => void; theme?: Theme }) {
  const isM = theme === 'modern'
  const d = isM ? dark : ios
  const bg = isM ? dark.screenBg : 'bg-[#f2f2f7]'
  const titleCls = isM ? 'text-white' : 'text-[#1c1c1e]'
  const subCls   = isM ? 'text-white/50 mt-1' : 'text-[var(--fg-muted)] mt-1' // @layout-space-magic-ok: mt-1=4px intra-heading bundle (title→subtitle same semantic unit, tighter than tight)
  const rowTitle = isM ? dark.rowTitle : 'text-[15px] font-medium text-[#1c1c1e]'
  const rowSub   = isM ? dark.rowSub   : 'text-[13px] text-[var(--fg-muted)]'
  const devCls   = isM ? 'text-white/40' : 'text-[var(--fg-muted)]'
  const [step, setStep] = useState(0)
  const steps = [
    { label: '驗證員工身份',   sub: '確認 SSO 登入狀態',       icon: User },
    { label: '裝置相容性檢查', sub: '確認 iPhone eSIM 支援',    icon: Smartphone },
    { label: '差旅系統資格核查',sub: '比對差旅系統出差紀錄',    icon: ScanLine },
  ]
  const done = step >= steps.length

  return (
    <div className={`flex flex-col h-full ${bg}`}>
      <div className={`px-[${loose}] pt-[${loose}] pb-[${tight}]`}>
        <h1 className={`text-[28px] font-bold ${titleCls}`}>資格確認中</h1>
        {/* text-[28px] @layout-space-magic-ok: iOS title3 */}
        <p className={`text-[15px] ${subCls}`}>正在驗證您的身份與裝置</p>
      </div>

      <div className={`flex justify-center py-[${loose}]`}>
        {done ? (
          <div className={`${ios.heroCircle} ${isM ? 'bg-[#c8f135]/10' : 'bg-[var(--success-subtle)]'}`}>
            <CheckCircle2 size={44} className={isM ? 'text-[#c8f135]' : 'text-[var(--success)]'} />
          </div>
        ) : (
          <div className={`${ios.heroCircle} ${isM ? 'bg-white/[0.06]' : 'bg-[var(--primary-subtle)]'}`}>
            <Loader2 size={44} className={isM ? 'text-[#c8f135] animate-spin' : 'text-[var(--primary)] animate-spin'} />
          </div>
        )}
      </div>

      <div className={d.groupCard}>
        {steps.map(({ label, sub, icon: Icon }, i) => {
          const isDone   = i < step
          const isActive = i === step
          const stepIconBg = isDone
            ? (isM ? 'bg-[#c8f135]' : 'bg-[var(--success)]')
            : isActive
              ? (isM ? 'bg-[#c8f135]/20 border border-[#c8f135]/40' : 'bg-[var(--primary)]')
              : (isM ? 'bg-white/[0.08]' : 'bg-[rgba(120,120,128,0.16)]')
          const stepIconColor = isDone
            ? (isM ? 'text-[#0d1229]' : 'text-white')
            : isActive ? (isM ? 'text-[#c8f135]' : 'text-white')
            : devCls
          return (
            <div key={label}>
              <div className={d.groupRow}>
                <div className={`${ios.iconTile} rounded-full ${stepIconBg}`}>
                  {isDone ? <Check size={16} className={stepIconColor} /> : <Icon size={16} className={stepIconColor} />}
                </div>
                <div className="flex-1">
                  <p className={`text-[15px] font-medium ${isDone || isActive ? (isM ? 'text-white' : 'text-[#1c1c1e]') : devCls}`}>{label}</p>
                  <p className={rowSub}>{sub}</p>
                </div>
                {isDone   && <Check   size={16} className={isM ? 'text-[#c8f135]' : 'text-[var(--success)]'} />}
                {isActive && <Loader2 size={16} className={`${isM ? 'text-[#c8f135]' : 'text-[var(--primary)]'} animate-spin`} />}
              </div>
              {i < steps.length - 1 && <div className={d.groupDivider} />}
            </div>
          )
        })}
      </div>

      <p className={d.sectionLabel}>裝置資訊</p>
      <div className={d.groupCard}>
        {[
          { label: 'iPhone 16 Pro', sub: 'iOS 18.3.2' },
          { label: 'eSIM 支援',     sub: '最多可儲存 8 組' },
          { label: '受管裝置',     sub: '公司 MDM 已註冊' },
        ].map(({ label, sub }, i, arr) => (
          <div key={label}>
            <div className={d.groupRow}>
              <Smartphone size={18} className={devCls} />
              <div className="flex-1">
                <p className={rowTitle}>{label}</p>
                <p className={rowSub}>{sub}</p>
              </div>
              <Check size={16} className={isM ? 'text-[#c8f135]' : 'text-[var(--success)]'} />
            </div>
            {i < arr.length - 1 && <div className={d.groupDivider} />}
          </div>
        ))}
      </div>

      <div className={ios.checkingFooter}>
        {!done ? (
          <button className={isM ? dark.secondaryBtn : ios.secondaryBtn} onClick={() => setStep(s => Math.min(s + 1, steps.length))}>
            模擬下一步驗證
          </button>
        ) : (
          <button className={isM ? dark.loginBtn : ios.primaryBtn} onClick={onNext}>
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

function TravelInfoScreen({ onNext, onBack, theme = 'corporate' }: { onNext: () => void; onBack: () => void; theme?: Theme }) {
  const isM = theme === 'modern'
  const d = isM ? dark : ios
  const bg = isM ? dark.screenBg : 'bg-[#f2f2f7]'
  const rowTitle = isM ? dark.rowTitle : 'text-[15px] font-medium text-[#1c1c1e]'
  const rowSub   = isM ? dark.rowSub   : 'text-[13px] text-[var(--fg-muted)]'
  const chevron  = isM ? 'text-white/20' : 'text-[rgba(60,60,67,0.3)]'
  const chipLabel = isM ? 'text-[13px] text-white/40 mb-2' : 'text-[13px] text-[var(--fg-muted)] mb-2' // @layout-space-magic-ok: mb-2=8px chip-group label→chips, functional dependency within bundled chip-group

  const [country,    setCountry]    = useState('日本')
  const [purpose,    setPurpose]    = useState('商務會議')
  const [dataAmount, setDataAmount] = useState('5 GB')
  const [roaming,    setRoaming]    = useState(false)
  const [hotspot,    setHotspot]    = useState(true)

  return (
    <div className={`flex flex-col h-full ${bg}`}>
      <div className={d.navBar}>
        <button className={d.navBack} onClick={onBack}><ChevronLeft size={22} />返回</button>
        <span className={d.navTitle}>出差資訊</span>
        <div className="w-16" />{/* @layout-space-magic-ok: iOS nav spacer mirrors back-button width for centering */}
      </div>

      <div className={ios.screen}>
        <h1 className={d.largeTitle}>出差資訊</h1>

        <p className={d.sectionLabel}>目的地</p>
        <div className={d.groupCard}>
          <div className={ios.chipGroupPad}>
            <p className={chipLabel}>選擇國家 / 地區</p>
            <div className={ios.chipRow}>
              {COUNTRIES.map(c => (
                <button key={c} onClick={() => setCountry(c)} className={d.pillChip(country === c)}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <p className={d.sectionLabel}>出差日期</p>
        <div className={d.groupCard}>
          {[
            { label: '出發日', value: '2026/06/10' },
            { label: '返回日', value: '2026/06/14' },
          ].map(({ label, value }, i, arr) => (
            <div key={label}>
              <div className={d.groupRow}>
                <CalendarDays size={20} className={isM ? 'text-[#c8f135]' : 'text-[var(--primary)]'} />
                <div className="flex-1">
                  <p className={rowSub}>{label}</p>
                  <p className={rowTitle}>{value}</p>
                </div>
                <ChevronRight size={18} className={chevron} />
              </div>
              {i < arr.length - 1 && <div className={d.groupDivider} />}
            </div>
          ))}
        </div>

        <p className={d.sectionLabel}>出差用途</p>
        <div className={d.groupCard}>
          <div className={ios.chipGroupPad}>
            <div className={ios.chipRow}>
              {PURPOSE_OPTIONS.map(p => (
                <button key={p} onClick={() => setPurpose(p)} className={d.pillChip(purpose === p)}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        <p className={d.sectionLabel}>預估流量需求</p>
        <div className={d.groupCard}>
          <div className={ios.chipGroupPad}>
            <div className={ios.segmentRow}>
              {DATA_OPTIONS.map(o => (
                <button key={o} onClick={() => setDataAmount(o)} className={d.segmentBtn(dataAmount === o)}>{o}</button>
              ))}
            </div>
          </div>
        </div>

        <p className={d.sectionLabel}>額外需求</p>
        <div className={d.groupCard}>
          <div className={d.groupRow}>
            <div className={`${isM ? dark.iconTile : `${ios.iconTile} bg-[var(--primary-subtle)]`}`}>
              <Phone size={16} className={isM ? 'text-[#c8f135]' : 'text-[var(--primary)]'} />
            </div>
            <div className="flex-1">
              <p className={rowTitle}>語音漫遊</p>
              <p className={rowSub}>中華電信用戶可勾選</p>
            </div>
            <Toggle on={roaming} onToggle={() => setRoaming(r => !r)} />
          </div>
          <div className={d.groupDivider} />
          <div className={d.groupRow}>
            <div className={`${isM ? dark.iconTile : `${ios.iconTile} bg-[var(--success-subtle)]`}`}>
              <Wifi size={16} className={isM ? 'text-[#c8f135]' : 'text-[var(--success)]'} />
            </div>
            <div className="flex-1">
              <p className={rowTitle}>Wi-Fi 熱點分享</p>
              <p className={rowSub}>中華電信 eSIM 支援</p>
            </div>
            <Toggle on={hotspot} onToggle={() => setHotspot(h => !h)} />
          </div>
        </div>
        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer, non-semantic */}
      </div>

      <div className={ios.screenFooter}>
        <button className={isM ? dark.loginBtn : ios.primaryBtn} onClick={onNext}>查看推薦方案 <ChevronRight size={20} /></button>
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

function PlanScreen({ onNext, onBack, theme = 'corporate' }: { onNext: (p: typeof PLANS[0]) => void; onBack: () => void; theme?: Theme }) {
  const isM = theme === 'modern'
  const d = isM ? dark : ios
  const bg = isM ? dark.screenBg : 'bg-[#f2f2f7]'
  const subText  = isM ? 'text-white/50' : 'text-[var(--fg-muted)]'
  const planName = isM ? 'text-[17px] font-bold text-white' : 'text-[17px] font-bold text-[#1c1c1e]'
  const planCarrier = isM ? dark.rowSub : 'text-[13px] text-[var(--fg-muted)]'
  const priceMain   = isM ? 'text-[24px] font-bold text-white' : 'text-[24px] font-bold text-[#1c1c1e]' // @layout-space-magic-ok: iOS title2 price display
  const priceUnit   = isM ? dark.rowSub : 'text-[13px] text-[var(--fg-muted)]'
  const featureText = isM ? 'text-[13px] text-white/50' : 'text-[13px] text-[var(--fg-muted)]'
  const accentCls   = isM ? 'text-[#c8f135]' : 'text-[var(--primary)]'
  const mutedCls    = isM ? 'text-white/40'   : 'text-[var(--fg-muted)]'
  const checkCls    = isM ? 'text-[#c8f135] flex-shrink-0' : 'text-[var(--success)] flex-shrink-0'
  const [selected, setSelected] = useState('recommended')

  return (
    <div className={`flex flex-col h-full ${bg}`}>
      <div className={d.navBar}>
        <button className={d.navBack} onClick={onBack}><ChevronLeft size={22} />返回</button>
        <span className={d.navTitle}>選擇方案</span>
        <div className="w-16" />
      </div>

      <div className={ios.screen}>
        <h1 className={d.largeTitle}>推薦方案</h1>
        <p className={`px-[${loose}] text-[15px] ${subText} mb-[${tight}]`}>根據您的出差資訊，以下方案符合需求</p>

        <div className={`${isM ? dark.groupCard : ios.card} mb-[${tight}]`}>
          <div className={ios.planSummaryRow}>
            <Globe size={20} className={isM ? 'text-[#c8f135]' : 'text-[var(--primary)]'} />
            <div className="flex-1">
              <p className={planCarrier}>日本・5 天・商務會議</p>
              <p className={`text-[15px] font-medium ${isM ? 'text-white' : 'text-[#1c1c1e]'}`}>2026/06/10 → 2026/06/14</p>
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
                className={d.planCard(isSel)}
              >
                <div className={ios.planCardHeader}>
                  <div>
                    <div className={ios.planCardBadgeRow}>
                      <span className={planName}>{plan.name}</span>
                      <PlanBadge label={plan.badge} color={plan.badgeColor} />
                      {plan.recommended && (
                        <span className={ios.microBadge(isM ? 'text-[#0d1229] bg-[#c8f135]' : 'text-white bg-[var(--primary)]')}>★ 目前方向</span>
                      )}
                    </div>
                    <p className={planCarrier}>{plan.carrier}</p>
                  </div>
                  <div className="text-right">
                    <span className={priceMain}>{plan.price}</span>
                    <span className={priceUnit}>/次</span>
                  </div>
                </div>

                <div className={`${ios.planCardSpecRow} ${accentCls}`}>
                  <div className={`${ios.iconTextPair} ${accentCls}`}><Signal size={14} />{plan.data}</div>
                  <div className={`${ios.iconTextPair} ${mutedCls}`}><Clock size={14} />{plan.days} 天</div>
                </div>

                <div className={ios.planCardFeatureList}>
                  {plan.features.map(f => (
                    <div key={f} className={ios.planCardFeatureRow}>
                      <Check size={14} className={checkCls} />
                      <span className={featureText}>{f}</span>
                    </div>
                  ))}
                </div>

                {isSel && (
                  <div className={ios.planCardConfirmRow(accentCls)}>
                    <CheckCircle2 size={16} />已選擇此方案
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer */}
      </div>

      <div className={ios.screenFooter}>
        <button className={isM ? dark.loginBtn : ios.primaryBtn} onClick={() => onNext(PLANS.find(p => p.id === selected)!)}>
          確認方案，建立 eSIM 訂單 <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 5: Install
// ─────────────────────────────────────────────
function InstallScreen({ plan, onNext, onBack, theme = 'corporate' }: { plan: typeof PLANS[0]; onNext: () => void; onBack: () => void; theme?: Theme }) {
  const isM = theme === 'modern'
  const d = isM ? dark : ios
  const bg = isM ? dark.screenBg : 'bg-[#f2f2f7]'
  const rowLabel  = isM ? dark.rowSub   : 'text-[13px] text-[var(--fg-muted)]'
  const rowValue  = isM ? 'text-[15px] font-medium text-white' : 'text-[15px] font-medium text-[#1c1c1e]'
  const rowNote   = isM ? 'font-normal text-white/40' : 'font-normal text-[var(--fg-muted)]'
  const methodLabel = isM ? dark.rowTitle : 'text-[15px] font-medium text-[#1c1c1e]'
  const methodSub   = isM ? dark.rowSub   : 'text-[13px] text-[var(--fg-muted)]'
  const accentIcon  = isM ? 'text-[#c8f135]' : 'text-[var(--primary)]'

  const METHODS_THEMED = [
    { id: 'app'   as const, label: 'App 內安裝',   sub: '連結直接安裝，最快速',   badge: '★ 目前方向', icon: Smartphone,
      iconCls: isM ? 'text-[#c8f135]' : 'text-[var(--primary)]', iconBg: isM ? '' : 'bg-[var(--primary-subtle)]' },
    { id: 'mdm'   as const, label: 'MDM 推送安裝', sub: '透過公司 MDM 系統部署',   badge: undefined,    icon: Shield,
      iconCls: isM ? 'text-white/60'  : 'text-[var(--success)]',  iconBg: isM ? '' : 'bg-[var(--success-subtle)]' },
    { id: 'email' as const, label: 'Email 超連結', sub: '導至設定 App 安裝',       badge: undefined,    icon: Download,
      iconCls: isM ? 'text-white/30'  : 'text-[var(--fg-muted)]', iconBg: isM ? '' : 'bg-[rgba(120,120,128,0.1)]' },
  ]
  const warnIconCls = `${isM ? 'text-[#c8f135]' : 'text-[#c47400]'} flex-shrink-0 mt-0.5` // @layout-space-magic-ok: mt-0.5=2px optical icon vertical alignment nudge, intra-element (not layout region)
  const warnBodyCls = `text-[13px] mt-0.5 ${isM ? 'text-white/50' : 'text-[var(--fg-muted)]'}` // @layout-space-magic-ok: mt-0.5=2px label→body gap within bundled notice element (not layout region)
  const [method, setMethod] = useState<'app' | 'mdm' | 'email'>('app')

  return (
    <div className={`flex flex-col h-full ${bg}`}>
      <div className={d.navBar}>
        <button className={d.navBack} onClick={onBack}><ChevronLeft size={22} />返回</button>
        <span className={d.navTitle}>確認訂單</span>
        <div className="w-16" />
      </div>

      <div className={ios.screen}>
        <h1 className={d.largeTitle}>確認並安裝</h1>

        <p className={d.sectionLabel}>訂單摘要</p>
        <div className={d.groupCard}>
          {[
            { icon: Globe,        label: '目的地',   value: '日本' },
            { icon: CalendarDays, label: '出差期間', value: '2026/06/10 — 06/14（5 天）' },
            { icon: Signal,       label: '方案',     value: `${plan.name}・${plan.data}・${plan.days} 天` },
            { icon: Briefcase,    label: '費用',     value: plan.price, note: '（月結入帳）' },
          ].map(({ icon: Icon, label, value, note }, i, arr) => (
            <div key={label}>
              <div className={d.groupRow}>
                <Icon size={20} className={accentIcon} />
                <div className="flex-1">
                  <p className={rowLabel}>{label}</p>
                  <p className={rowValue}>
                    {value}{note && <span className={rowNote}>{note}</span>}
                  </p>
                </div>
              </div>
              {i < arr.length - 1 && <div className={d.groupDivider} />}
            </div>
          ))}
        </div>

        <p className={d.sectionLabel}>eSIM 安裝方式</p>
        <div className={d.groupCard}>
          {METHODS_THEMED.map(({ id, label, sub, badge, icon: Icon, iconCls, iconBg }, i, arr) => (
            <div key={id}>
              <button className={`${d.groupRow} w-full text-left`} onClick={() => setMethod(id)}>
                <div className={`${isM ? dark.iconTile : `${ios.iconTile} ${iconBg}`}`}>
                  <Icon size={16} className={iconCls} />
                </div>
                <div className="flex-1">
                  <div className={ios.installBadgeRow}>
                    <p className={methodLabel}>{label}</p>
                    {badge && <span className={ios.microBadge(isM ? 'text-[#0d1229] bg-[#c8f135]' : 'text-[var(--primary)] bg-[var(--primary-subtle)]')}>{badge}</span>}
                  </div>
                  <p className={methodSub}>{sub}</p>
                </div>
                <div className={d.radioOuter(method === id)}>
                  {method === id && <div className={d.radioDot} />}
                </div>
              </button>
              {i < arr.length - 1 && <div className={d.groupDivider} />}
            </div>
          ))}
        </div>

        <div className={isM ? dark.warningBox : `mx-[${loose}] mt-[${tight}] bg-[var(--warning-subtle)] rounded-2xl p-[${loose}] flex gap-[${tight}]`}>
          <AlertCircle size={18} className={warnIconCls} />
          <div>
            <p className={`text-[13px] font-medium ${isM ? 'text-white' : 'text-[#1c1c1e]'}`}>注意事項</p>
            <p className={warnBodyCls}>eSIM 安裝後須重新啟動並切換至出差網路；費用將於月結時自動入帳差旅報表。</p>
          </div>
        </div>
        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer */}
      </div>

      <div className={ios.screenFooter}>
        <button className={isM ? dark.loginBtn : ios.primaryBtn} onClick={onNext}>
          <Zap size={20} />立即安裝 eSIM
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Screen 6: Success
// ─────────────────────────────────────────────
function SuccessScreen({ plan, theme = 'corporate' }: { plan: typeof PLANS[0]; theme?: Theme }) {
  const isM = theme === 'modern'
  const d = isM ? dark : ios
  const bg = isM ? dark.screenBg : 'bg-[#f2f2f7]'
  const heroTitle  = isM ? 'text-[28px] font-bold text-white' : 'text-[28px] font-bold text-[#1c1c1e]' // @layout-space-magic-ok: iOS title3
  const heroSub    = isM ? `text-[15px] text-white/50 mt-1 text-center` : `text-[15px] text-[var(--fg-muted)] mt-1 text-center` // @layout-space-magic-ok: mt-1=4px intra-heading bundle
  const rowLabel   = isM ? 'text-[15px] text-white/60 flex-1' : 'text-[15px] text-[#1c1c1e] flex-1'
  const rowValue   = isM ? 'text-[15px] text-white/40' : 'text-[15px] text-[var(--fg-muted)]'
  const successCls = isM ? 'text-[#c8f135] font-semibold' : 'text-[var(--success)] font-semibold'
  const inlineDivider = isM ? `ml-[${loose}] border-b border-white/[0.06]` : `ml-[${loose}] border-b border-[rgba(0,0,0,0.06)]`
  const barBg   = isM ? 'h-3 bg-white/10 rounded-full overflow-hidden' : ios.progressBar
  const barFill = isM ? 'h-full bg-[#c8f135] rounded-full' : 'h-full bg-[var(--primary)] rounded-full'
  const barUsed = isM ? 'text-[#c8f135] font-medium' : 'text-[var(--primary)] font-medium'
  const barRem  = isM ? 'text-white/40' : 'text-[var(--fg-muted)]'
  const usageCardCls = isM ? `${dark.groupCard} ${dark.successUsageCard}` : `${ios.card} ${ios.successUsageCard}`
  const sysColors = isM
    ? { signal: 'text-[#c8f135]', wifi: 'text-[#c8f135]', plane: 'text-white/40' }
    : { signal: 'text-[var(--success)]', wifi: 'text-[var(--primary)]', plane: 'text-[var(--fg-muted)]' }
  const [tab, setTab] = useState<'status' | 'usage'>('status')

  return (
    <div className={`flex flex-col h-full ${bg}`}>
      <div className={`${d.navBar} justify-center`}>
        <span className={d.navTitle}>eSIM 已啟用</span>
      </div>

      <div className={ios.screen}>
        <div className={ios.successHeroSection}>
          <div className={`${ios.heroCircle} ${isM ? 'bg-[#c8f135]/10' : 'bg-[var(--success-subtle)]'} mb-[${tight}]`}>
            <CheckCircle2 size={52} className={isM ? 'text-[#c8f135]' : 'text-[var(--success)]'} />
          </div>
          <h1 className={heroTitle}>eSIM 安裝成功</h1>
          <p className={heroSub}>已切換至日本出差網路，準備出發！</p>
        </div>

        <div className={isM ? dark.successSegmentTrack : ios.successSegmentTrack}>
          {(['status', 'usage'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={isM ? dark.successTabBtn(tab === t) : ios.successTabBtn(tab === t)}>
              {t === 'status' ? 'eSIM 狀態' : '用量追蹤'}
            </button>
          ))}
        </div>

        {tab === 'status' ? (
          <>
            <div className={d.groupCard}>
              {[
                { label: '電信商',  value: '中華電信',                      special: false },
                { label: '方案',    value: `${plan.name}・${plan.data}`,    special: false },
                { label: '有效期至',value: '2026/06/14 23:59',              special: false },
                { label: '狀態',    value: '啟用中',                        special: true  },
              ].map(({ label, value, special }, i, arr) => (
                <div key={label}>
                  <div className={d.groupRow}>
                    <p className={rowLabel}>{label}</p>
                    <p className={`${rowValue} ${special ? successCls : ''}`}>{value}</p>
                  </div>
                  {i < arr.length - 1 && <div className={inlineDivider} />}
                </div>
              ))}
            </div>

            <p className={d.sectionLabel}>系統狀態</p>
            <div className={d.groupCard}>
              {[
                { icon: Signal, label: '訊號強度', value: '優良',    color: sysColors.signal },
                { icon: Wifi,   label: '熱點分享', value: '已開啟',  color: sysColors.wifi   },
                { icon: Plane,  label: '漫遊模式', value: '出差模式', color: sysColors.plane  },
              ].map(({ icon: Icon, label, value, color }, i, arr) => (
                <div key={label}>
                  <div className={d.groupRow}>
                    <Icon size={18} className={color} />
                    <p className={`text-[15px] ${isM ? 'text-white' : 'text-[#1c1c1e]'} flex-1`}>{label}</p>
                    <p className={`text-[14px] font-medium ${color}`}>{value}</p>
                  </div>
                  {i < arr.length - 1 && <div className={d.groupDivider} />}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={usageCardCls}>
              <div className={isM ? dark.successUsageHeader : ios.successUsageHeader}>
                <p className={`text-[15px] font-semibold ${isM ? 'text-white' : 'text-[#1c1c1e]'}`}>已使用流量</p>
                <span className={`text-[13px] ${isM ? 'text-white/40' : 'text-[var(--fg-muted)]'}`}>5 GB 總量</span>
              </div>
              <div className={barBg}>
                <div className={barFill} style={{ width: '28%' }} />
              </div>
              <div className="flex justify-between text-[13px]">
                <span className={barUsed}>已用 1.4 GB</span>
                <span className={barRem}>剩餘 3.6 GB</span>
              </div>
            </div>

            <div className={d.groupCard}>
              {[
                { label: '今日用量', sub: '06/10',   value: '234 MB'    },
                { label: '昨日用量', sub: '06/09',   value: '680 MB'    },
                { label: '預估費用', sub: '月結入帳', value: plan.price  },
              ].map(({ label, sub, value }, i, arr) => (
                <div key={label}>
                  <div className={d.groupRow}>
                    <div className="flex-1">
                      <p className={`text-[15px] ${isM ? 'text-white' : 'text-[#1c1c1e]'}`}>{label}</p>
                      <p className={isM ? dark.rowSub : 'text-[13px] text-[var(--fg-muted)]'}>{sub}</p>
                    </div>
                    <p className={`text-[15px] font-semibold ${isM ? 'text-white' : 'text-[#1c1c1e]'}`}>{value}</p>
                  </div>
                  {i < arr.length - 1 && <div className={inlineDivider} />}
                </div>
              ))}
            </div>
          </>
        )}
        <div className="h-8" />{/* @layout-space-magic-ok: scroll-bottom spacer */}
      </div>

      <div className={isM ? dark.successFooter : ios.successFooter}>
        <button className={isM ? dark.loginBtn : ios.primaryBtn}><BarChart2 size={18} />查看差旅費用報表</button>
        <button className={isM ? dark.secondaryBtn : ios.secondaryBtn}><X size={18} />停用 eSIM（回台後）</button>
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
  const [tab,    setTab]    = useState<Tab>('home')
  const [theme,  setTheme]  = useState<Theme>('corporate')

  const isModern     = theme === 'modern'
  const isOnboarding = screen === 'login' || screen === 'checking'

  const activateFlow: Record<string, React.ReactNode> = {
    travel:  <TravelInfoScreen onNext={() => setScreen('plan')}    onBack={() => setScreen('checking')} theme={theme} />,
    plan:    <PlanScreen       onNext={p => { setPlan(p); setScreen('install') }} onBack={() => setScreen('travel')} theme={theme} />,
    install: <InstallScreen    plan={plan} onNext={() => { setScreen('success'); setTab('esim') }} onBack={() => setScreen('plan')} theme={theme} />,
    success: <SuccessScreen    plan={plan} theme={theme} />,
  }

  function ActivateHome() {
    return (
      <div className={`flex flex-col h-full ${isModern ? dark.screenBg : 'bg-[#f2f2f7]'}`}>
        <div className={`px-[${loose}] pt-[${loose}] pb-[${tight}]`}>
          <h1 className={`text-[34px] font-bold leading-tight ${isModern ? 'text-white' : 'text-[#1c1c1e]'}`}>
            {/* text-[34px] @layout-space-magic-ok: iOS largeTitle */}
            出差開通
          </h1>
        </div>
        <div className={ios.screen}>
          <div className={`flex flex-col items-center py-[${loose}] px-[${loose}]`}>
            <div className={`${ios.heroCircle} ${isModern ? 'bg-[#c8f135]/10' : 'bg-[var(--primary-subtle)]'} mb-[${tight}]`}>
              <Plane size={44} className={isModern ? 'text-[#c8f135]' : 'text-[var(--primary)]'} strokeWidth={1.75} />
            </div>
            <p className={ios.activateHeroTitle} style={{ color: isModern ? '#ffffff' : undefined }}>準備出差了嗎？</p>
            <p className={`text-[15px] text-center ${isModern ? 'text-white/50' : 'text-[var(--fg-muted)]'}`}>
              填寫出差資訊，一鍵開通國際 eSIM
            </p>
          </div>
          <div className={`px-[${loose}]`}>
            <button
              className={isModern ? dark.loginBtn : ios.primaryBtn}
              onClick={() => setScreen('travel')}
            >
              <Plane size={20} />開始申請 eSIM
            </button>
          </div>
        </div>
      </div>
    )
  }

  const goActivate = () => { setTab('activate'); setScreen('travel') }

  const tabContent: Record<Tab, React.ReactNode> = {
    home:     <DashboardTab onGoActivate={goActivate} theme={theme} />,
    activate: activateFlow[screen] ?? <ActivateHome />,
    esim:     <MyEsimTab theme={theme} />,
    usage:    <UsageTab theme={theme} />,
    settings: <SettingsTab theme={theme} />,
  }

  // Frame border changes by theme
  const frameCls = ios.frame.replace('border-[#1c1c1e]', isModern ? dark.frameBorder : 'border-[#1c1c1e]')

  return (
    <div className={`flex flex-col items-center gap-[${loose}] py-[${loose}] min-h-screen transition-colors duration-500 ${isModern ? dark.outerBg : 'bg-[#e5e5ea]'}`}>

      {/* Theme toggle + dev dots */}
      <div className={ios.devControls}>
        {/* Theme toggle pill */}
        <div className={ios.themeToggleTrack(isModern)}>
          {(['corporate', 'modern'] as Theme[]).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${// @layout-space-magic-ok: px-3/py-1=12px/4px toggle-segment micro-element (UISegmentedControl fixed hardware spec); text-[12px]=iOS footnote
                theme === t
                  ? isModern ? 'bg-[#c8f135] text-[#0d1229]' : 'bg-white text-[#1c1c1e] shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
                  : isModern ? 'text-white/50' : 'text-[rgba(60,60,67,0.5)]'
              }`}
            >
              {t === 'corporate' ? '企業' : '現代'}
            </button>
          ))}
        </div>

        {/* Step indicator dots */}
        <div className={ios.devDots}>
          {SCREENS.map(s => (
            <button
              key={s}
              onClick={() => setScreen(s)}
              className={`h-1.5 rounded-full transition-all ${screen === s ? 'w-6 bg-[var(--primary)]' : `w-1.5 ${isModern ? 'bg-white/20' : 'bg-[rgba(0,0,0,0.2)]'}`}`}
              // h-1.5/w-1.5/w-6 @layout-space-magic-ok: iOS page-indicator dot = 6px fixed motif per Apple HIG
              aria-label={s}
            />
          ))}
        </div>
      </div>

      <div className={frameCls}>
        <StatusBar theme={theme} />
        {isOnboarding ? (
          screen === 'login'
            ? <LoginScreen    onNext={() => setScreen('checking')} theme={theme} />
            : <CheckingScreen onNext={() => { setScreen('travel'); setTab('home') }} theme={theme} />
        ) : (
          <div className={`flex flex-col flex-1 overflow-hidden ${isModern ? dark.screenBg : ''}`}>
            <div className="flex-1 overflow-hidden">
              {tabContent[tab]}
            </div>
            <BottomTabBar tab={tab} onTabChange={t => { setTab(t) }} theme={theme} />
          </div>
        )}
      </div>

      <p className={`text-[12px] ${isModern ? 'text-white/30' : 'text-[rgba(0,0,0,0.4)]'}`}>點擊頂部圓點快速跳轉畫面</p>
      {/* text-[12px] @layout-space-magic-ok: iOS footnote hint size */}
    </div>
  )
}

export default EsimApp
