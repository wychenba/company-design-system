// @anatomy-rationale:
//   SizeMatrix N/A — Chart 寬度由 ResponsiveContainer 自動填滿父層,高度由
//     consumer className 決定(無離散 size tier)。資料密度由 categorical token
//     --chart-1..5 限制,不靠 size。
//   StateBehavior N/A — Chart 是 data viz 容器,互動(hover tooltip / legend
//     toggle)由 Recharts library 處理且為內部行為。已由 Inspector 的 tooltip
//     indicator 切換涵蓋,無 DS 層級的 hover / focus / disabled state。
import type { Meta, StoryObj } from '@storybook/react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from './chart'
import { H3, Desc, Td, Th, TokenCell } from '@/design-system/stories-helpers/anatomy/anatomy-utils'

const meta: Meta = {
  title: 'Design System/Components/Chart/設計規格',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

// ── Sample data ────────────────────────────────────────────────────────────
// 真實業務場景:三個月網站流量(對標 Vercel Analytics dashboard)

const visitorData = [
  { month: '1 月', desktop: 186, mobile: 80 },
  { month: '2 月', desktop: 305, mobile: 200 },
  { month: '3 月', desktop: 237, mobile: 120 },
  { month: '4 月', desktop: 73,  mobile: 190 },
  { month: '5 月', desktop: 209, mobile: 130 },
  { month: '6 月', desktop: 214, mobile: 140 },
]

const visitorConfig = {
  desktop: { label: 'Desktop', color: 'var(--chart-1)' },
  mobile:  { label: 'Mobile',  color: 'var(--chart-2)' },
} satisfies ChartConfig

// 訂閱方案分布(對標 Stripe dashboard)
const subscriptionData = [
  { tier: 'Free',    users: 820, fill: 'var(--color-free)' },
  { tier: 'Pro',     users: 340, fill: 'var(--color-pro)' },
  { tier: 'Team',    users: 180, fill: 'var(--color-team)' },
  { tier: 'Enterprise', users: 42, fill: 'var(--color-enterprise)' },
]

const subscriptionConfig = {
  free:       { label: 'Free',       color: 'var(--chart-1)' },
  pro:        { label: 'Pro',        color: 'var(--chart-2)' },
  team:       { label: 'Team',       color: 'var(--chart-3)' },
  enterprise: { label: 'Enterprise', color: 'var(--chart-4)' },
} satisfies ChartConfig

// ── Stories ────────────────────────────────────────────────────────────────

export const Overview: Story = {
  name: '1. 元件總覽',
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <H3>Bar Chart — 6 個月 Desktop vs Mobile 訪問量</H3>
        <Desc>ChartConfig 定義 desktop / mobile 兩類別分別對應 --chart-1 / --chart-2,ChartContainer 自動注入 scoped CSS var `--color-desktop` / `--color-mobile`,Recharts Bar `fill="var(--color-desktop)"` 直接消費。Tooltip / Legend 都用 DS token 覆寫。</Desc>
        <div className="max-w-2xl">
          <ChartContainer config={visitorConfig}>
            <BarChart accessibilityLayer data={visitorData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
              <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      <div>
        <H3>Line Chart — 趨勢顯示</H3>
        <Desc>同一份資料改 Line chart:適合強調趨勢而非數值比較。</Desc>
        <div className="max-w-2xl">
          <ChartContainer config={visitorConfig}>
            <LineChart accessibilityLayer data={visitorData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
              <Line dataKey="mobile" type="monotone" stroke="var(--color-mobile)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
      </div>

      <div>
        <H3>Pie Chart — 訂閱方案分布</H3>
        <Desc>4 類別用 --chart-1..4,ChartConfig.key 與資料的 dataKey 對齊(pie 的 fill 改用 payload.fill)。</Desc>
        <div className="max-w-sm">
          <ChartContainer config={subscriptionConfig}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={subscriptionData}
                dataKey="users"
                nameKey="tier"
                innerRadius={40}
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent nameKey="tier" />} />
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  ),
}

// ── Inspector sample(單一資料集,供檢閱器使用)─────────────────────────────

type ChartType = 'bar' | 'line' | 'area' | 'pie'

interface InspectorArgs {
  type: ChartType
  showLegend: boolean
  showGrid: boolean
  tooltipIndicator: 'dot' | 'line' | 'dashed'
}

export const Inspector: Story = {
  name: '2. 元件檢閱器',
  parameters: {
    docs: {
      description: {
        story:
          '右側 Controls 切 chart 類型與視覺選項即時 render,取代 Figma inspect。切 type 觀察同一份 ChartConfig(desktop / mobile)在不同圖表類型下的色彩應用;tooltipIndicator 切換 dot / line / dashed 看指示器視覺差異。',
      },
    },
  },
  args: {
    type: 'bar',
    showLegend: true,
    showGrid: true,
    tooltipIndicator: 'dot',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['bar', 'line', 'area', 'pie'],
      description: 'bar=數值比較 / line=趨勢 / area=累積 / pie=比例分布',
    },
    showLegend: { control: 'boolean', description: '顯示底部圖例' },
    showGrid: { control: 'boolean', description: '顯示 Cartesian 網格(bar / line / area 適用)' },
    tooltipIndicator: {
      control: 'select',
      options: ['dot', 'line', 'dashed'],
      description: 'tooltip 色彩指示器形狀',
    },
  },
  render: (args) => {
    const { type, showLegend, showGrid, tooltipIndicator } = args as InspectorArgs
    return (
      <div className="max-w-2xl">
        <ChartContainer config={type === 'pie' ? subscriptionConfig : visitorConfig}>
          {type === 'bar' ? (
            <BarChart accessibilityLayer data={visitorData}>
              {showGrid && <CartesianGrid vertical={false} />}
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator={tooltipIndicator} />} />
              {showLegend && <ChartLegend content={<ChartLegendContent />} />}
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
              <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
            </BarChart>
          ) : type === 'line' ? (
            <LineChart accessibilityLayer data={visitorData}>
              {showGrid && <CartesianGrid vertical={false} />}
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator={tooltipIndicator} />} />
              {showLegend && <ChartLegend content={<ChartLegendContent />} />}
              <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
              <Line dataKey="mobile" type="monotone" stroke="var(--color-mobile)" strokeWidth={2} dot={false} />
            </LineChart>
          ) : type === 'area' ? (
            <AreaChart accessibilityLayer data={visitorData}>
              {showGrid && <CartesianGrid vertical={false} />}
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator={tooltipIndicator} />} />
              {showLegend && <ChartLegend content={<ChartLegendContent />} />}
              <Area dataKey="desktop" type="monotone" stroke="var(--color-desktop)" fill="var(--color-desktop)" fillOpacity={0.3} strokeWidth={2} stackId="visitors" />
              <Area dataKey="mobile" type="monotone" stroke="var(--color-mobile)" fill="var(--color-mobile)" fillOpacity={0.3} strokeWidth={2} stackId="visitors" />
            </AreaChart>
          ) : (
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel indicator={tooltipIndicator} />} />
              <Pie data={subscriptionData} dataKey="users" nameKey="tier" innerRadius={40} strokeWidth={2} />
              {showLegend && <ChartLegend content={<ChartLegendContent nameKey="tier" />} />}
            </PieChart>
          )}
        </ChartContainer>
      </div>
    )
  },
}

export const CategoryTokens: Story = {
  name: '4. 類別配色 Token',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <H3>--chart-1..5（5 色類別 token）</H3>
        <Desc>Categorical data viz 專用 token,**固定到 primitive 而非 semantic**（避免 brand swap 影響 data viz 色義）。超過 5 類別應改用 grouping 或切換 visualization。</Desc>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Token</Th><Th>Light mode</Th><Th>Dark mode</Th><Th>建議</Th></tr></thead>
            <tbody>
              <tr><Td><TokenCell token="--chart-1" display="fill-chart-1" /></Td><Td mono>blue-6</Td><Td mono>blue-5</Td><Td>第一類別(主要)</Td></tr>
              <tr><Td><TokenCell token="--chart-2" display="fill-chart-2" /></Td><Td mono>purple-6</Td><Td mono>purple-5</Td><Td>第二類別</Td></tr>
              <tr><Td><TokenCell token="--chart-3" display="fill-chart-3" /></Td><Td mono>green-6</Td><Td mono>green-5</Td><Td>第三類別</Td></tr>
              <tr><Td><TokenCell token="--chart-4" display="fill-chart-4" /></Td><Td mono>yellow-7</Td><Td mono>yellow-5</Td><Td>第四類別(light 用 step-7 提高對比)</Td></tr>
              <tr><Td><TokenCell token="--chart-5" display="fill-chart-5" /></Td><Td mono>deep-orange-6</Td><Td mono>deep-orange-5</Td><Td>第五類別</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

export const ColorMatrix: Story = {
  name: '3. 色彩對照表',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <H3>Chart 整體 + Tooltip + Legend + Grid 視覺 token</H3>
        <Desc>所有非資料的視覺(tooltip / legend / grid / axis)都透過本 DS token 控制,確保跨圖表類型的視覺一致。</Desc>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>區塊</Th><Th>Token / utility</Th><Th>說明</Th></tr></thead>
            <tbody>
              <tr><Td>整體文字</Td><Td mono>text-caption</Td><Td>所有 chart 內部文字(axis / legend / tooltip)預設 caption 大小</Td></tr>
              <tr><Td>Tooltip bg</Td><Td><TokenCell token="--surface-raised" display="bg-surface-raised" /></Td><Td>浮層底色(與 Popover / Dialog 同源)</Td></tr>
              <tr><Td>Tooltip border</Td><Td><TokenCell token="--border" display="border-border" /></Td><Td>標準邊框</Td></tr>
              <tr><Td>Tooltip shadow</Td><Td mono>shadow-[var(--elevation-200)]</Td><Td>浮層 elevation(與 Popover / Dialog 同級)</Td></tr>
              <tr><Td>Tooltip label</Td><Td mono>font-medium</Td><Td>上方 label(系列名 / x 軸值)</Td></tr>
              <tr><Td>Tooltip 值</Td><Td mono>font-mono font-medium tabular-nums</Td><Td>數字用 mono + tabular-nums 對齊</Td></tr>
              <tr><Td>Tooltip 類別</Td><Td><TokenCell token="--fg-secondary" display="text-fg-secondary" /></Td><Td>類別名稱(Desktop / Mobile...)</Td></tr>
              <tr><Td>Legend 文字</Td><Td><TokenCell token="--fg-secondary" display="text-fg-secondary" /></Td><Td>與 Tooltip 類別同</Td></tr>
              <tr><Td>Grid line</Td><Td><TokenCell token="--divider" display="stroke-divider" /></Td><Td>Cartesian 網格線(比 border 更淡,不搶視覺)</Td></tr>
              <tr><Td>Axis tick</Td><Td><TokenCell token="--fg-muted" display="fill-fg-muted" /></Td><Td>軸刻度標籤色</Td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <H3>API 速查</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Export</Th><Th>角色</Th><Th>說明</Th></tr></thead>
            <tbody>
              <tr><Td mono>ChartContainer</Td><Td>外殼 + config provider</Td><Td>包 ResponsiveContainer,注入 scoped CSS var --color-{'{key}'}</Td></tr>
              <tr><Td mono>ChartConfig</Td><Td>型別</Td><Td>{'{'}[key]: {'{'} label, color | theme, icon? {'}'}{'}'}</Td></tr>
              <tr><Td mono>ChartTooltip</Td><Td>Recharts Tooltip alias</Td><Td>直接 re-export Recharts Tooltip</Td></tr>
              <tr><Td mono>ChartTooltipContent</Td><Td>tooltip 視覺</Td><Td>DS token 版;props:indicator(dot/line/dashed) / hideLabel / hideIndicator</Td></tr>
              <tr><Td mono>ChartLegend</Td><Td>Recharts Legend alias</Td><Td>直接 re-export</Td></tr>
              <tr><Td mono>ChartLegendContent</Td><Td>legend 視覺</Td><Td>DS token 版</Td></tr>
              <tr><Td mono>ChartStyle</Td><Td>scoped CSS 注入</Td><Td>ChartContainer 自動使用,consumer 通常不直接呼叫</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}
