// @anatomy-rationale:
//   Inspector / ColorMatrix / SizeMatrix / StateBehavior N/A — HoverCard 是
//   純行為 primitive(基於 Radix HoverCard),不含視覺樣式。bg / border /
//   shadow / padding / size 全由 consumer 透過 className 決定;無 own variant /
//   state / size。Overview + VisualVariants 兩個 story 已涵蓋 consumer 兩種
//   常見視覺(NameCard 亮色 vs OverflowIndicator 深色 tooltip)。
import type { Meta, StoryObj } from '@storybook/react'
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card'
import { Avatar } from '@/design-system/components/Avatar/avatar'
import { Button } from '@/design-system/components/Button/button'
import { H3, Desc, Td, Th } from '@/design-system/stories-helpers/anatomy/anatomy-utils'

const meta: Meta = {
  title: 'Design System/Internal/HoverCard/設計規格',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

export const Overview: Story = {
  name: '元件總覽',
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <H3>Anatomy(純行為 primitive)</H3>
        <Desc>HoverCard 基於 Radix HoverCard,**不含視覺樣式**——只提供觸發邏輯、定位、動畫。Bg / border / shadow / padding 由 consumer 決定,符合不同場景的視覺語言。</Desc>
        <div className="flex items-center gap-6">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Avatar alt="Ada Chen" size={40} />
            </HoverCardTrigger>
            <HoverCardContent className="bg-surface-raised border border-border rounded-lg p-4 shadow-[var(--elevation-200)]">
              <div className="flex flex-col gap-2 w-56">
                <div className="text-body font-medium">Ada Chen</div>
                <div className="text-caption text-fg-muted">Design Engineer · 台北</div>
                <Button variant="tertiary" size="sm">傳訊息</Button>
              </div>
            </HoverCardContent>
          </HoverCard>
          <span className="text-caption text-fg-muted">← hover Avatar 彈出 NameCard(可點按鈕)</span>
        </div>
      </div>

      <div>
        <H3>HoverCard 只提供</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>職責</Th><Th>實作</Th></tr></thead>
            <tbody>
              <tr><Td>z-index(浮層層級)</Td><Td mono>z-50</Td></tr>
              <tr><Td>進出場動畫</Td><Td>fade + zoom + slide(方向感知)</Td></tr>
              <tr><Td>sideOffset(與 trigger 的間距)</Td><Td mono>預設 8px(跟 Tooltip / Popover 統一)</Td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-footnote text-fg-muted mt-3">
          不提供 bg / border / shadow / padding / rounded——consumer 決定。
        </p>
      </div>

      <div>
        <H3>Props 速查</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>元件</Th><Th>主要 Props</Th></tr></thead>
            <tbody>
              <tr><Td mono>HoverCard</Td><Td mono>openDelay={`{number}`} closeDelay={`{number}`}</Td></tr>
              <tr><Td mono>HoverCardTrigger</Td><Td mono>asChild={`{boolean}`}</Td></tr>
              <tr><Td mono>HoverCardContent</Td><Td mono>align / sideOffset / className(consumer 自套樣式)</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

export const VisualVariants: Story = {
  name: 'Consumer 的兩種常見視覺',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <H3>亮色 Card 樣式(NameCard pattern)</H3>
        <Desc>人員資訊卡、內容預覽等可互動浮層。使用 `bg-surface-raised + elevation-200 + rounded-lg + border`。</Desc>
        <div className="flex items-center gap-6">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="tertiary" size="sm">hover 看 Card</Button>
            </HoverCardTrigger>
            <HoverCardContent className="bg-surface-raised border border-border rounded-lg p-4 shadow-[var(--elevation-200)]">
              <div className="w-56">
                <div className="text-body font-medium mb-1">Ada Chen</div>
                <div className="text-caption text-fg-muted mb-3">Design Engineer · 台北</div>
                <Button variant="tertiary" size="sm">傳訊息</Button>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      <div>
        <H3>深色 Tooltip 樣式(OverflowIndicator pattern)</H3>
        <Desc>溢出清單 / 快速預覽。使用 `bg-tooltip + data-theme="dark" + compact padding`。</Desc>
        <div className="flex items-center gap-6">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="tertiary" size="sm">hover 看 Tooltip 樣式</Button>
            </HoverCardTrigger>
            <HoverCardContent className="bg-tooltip rounded-md px-3 py-2" data-theme="dark">
              <div className="text-caption w-56">
                深色樣式——常見於 OverflowIndicator 顯示溢出清單(+3 more 的 hover 展開)
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      <div>
        <H3>選擇對照</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Consumer</Th><Th>視覺風格</Th><Th>典型用途</Th></tr></thead>
            <tbody>
              <tr><Td>NameCard</Td><Td mono>亮色 Card(bg-surface-raised + elevation-200)</Td><Td>人員 / 組織 / 文件預覽</Td></tr>
              <tr><Td>OverflowIndicator</Td><Td mono>深色 Tooltip(bg-tooltip + data-theme dark)</Td><Td>+N 溢出清單</Td></tr>
              <tr><Td>Custom</Td><Td>Consumer 自訂</Td><Td>任何需要可互動 hover 浮層的場景</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

// ── Accessibility ─────────────────────────────────────────────────────────
// 2026-05-17 ship per audit Dim 13(story-rules.md 6-canonical 含 Accessibility)
export const Accessibility = {
  name: '無障礙',
  render: () => (
    <div className="max-w-3xl text-body text-fg-secondary">
      <h3 className="text-h5 text-foreground mb-2">無障礙設計</h3>
      <p className="whitespace-pre-line">{"[TODO] 本元件 spec.md 尚無「## A11y 預設」段。後續補:ARIA role / keyboard map / focus 行為。對齊 HoverCard 對應 Radix / Material / Polaris a11y 規範。"}</p>
    </div>
  ),
}
