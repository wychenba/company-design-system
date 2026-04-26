import type { Meta, StoryObj } from '@storybook/react'
import { Users, Settings, Bell, ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
import { Badge } from '@/design-system/components/Badge/badge'

const meta: Meta<typeof Tabs> = {
  title: 'Design System/Components/Tabs/展示',
  component: Tabs,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[600px]">
      <TabsList>
        <TabsTrigger value="overview">總覽</TabsTrigger>
        <TabsTrigger value="members" startIcon={Users}>成員</TabsTrigger>
        <TabsTrigger value="notifications" badge={<Badge count={3} />}>通知</TabsTrigger>
        <TabsTrigger value="settings" startIcon={Settings}>設定</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="p-4">總覽內容</TabsContent>
      <TabsContent value="members" className="p-4">成員內容</TabsContent>
      <TabsContent value="notifications" className="p-4">通知內容</TabsContent>
      <TabsContent value="settings" className="p-4">設定內容</TabsContent>
    </Tabs>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-[600px]">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <div className="text-caption text-fg-muted mb-2">size = {size}</div>
          <Tabs defaultValue="detail">
            <TabsList size={size}>
              <TabsTrigger value="detail">詳情</TabsTrigger>
              <TabsTrigger value="comments">留言</TabsTrigger>
              <TabsTrigger value="history">歷史紀錄</TabsTrigger>
              <TabsTrigger value="attachments">附件</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ))}
    </div>
  ),
}

export const WithSuffix: Story = {
  render: () => (
    <Tabs defaultValue="notifications" className="w-[700px]">
      <TabsList>
        <TabsTrigger value="all" startIcon={Bell}>全部</TabsTrigger>
        <TabsTrigger value="notifications" badge={<Badge count={12} />}>通知</TabsTrigger>
        <TabsTrigger value="more" endIcon={ChevronDown}>更多</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
}

const MANY_TABS = [
  { value: 'overview', label: '總覽' },
  { value: 'members', label: '成員' },
  { value: 'activity', label: '活動紀錄' },
  { value: 'notifications', label: '通知' },
  { value: 'billing', label: '計費與付款' },
  { value: 'integrations', label: '整合' },
  { value: 'security', label: '安全' },
  { value: 'audit', label: '稽核日誌' },
  { value: 'advanced', label: '進階設定' },
]

export const OverflowScroll: Story = {
  name: 'Overflow: scroll（拖拉右下角調整寬度）',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="text-caption text-fg-muted max-w-xl">
        <strong>overflow="scroll"</strong> — 單行橫向滾動 + 邊緣 fade mask + 左右 scroll arrow buttons。
        拖拉容器右下角調整寬度，觀察 arrow 如何依滾動位置出現 / 消失。
        鍵盤使用者用方向鍵（Radix 原生 + 瀏覽器 scroll-into-view），trackpad 兩指滑動，滑鼠點 arrow。
      </div>
      <div
        className="resize-x overflow-hidden border border-dashed border-border p-4 min-w-[240px] max-w-full"
        style={{ width: '480px' }}
      >
        <Tabs defaultValue="overview">
          <TabsList overflow="scroll">
            {MANY_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  ),
}

export const OverflowMenu: Story = {
  name: 'Overflow: menu（拖拉右下角調整寬度）',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="text-caption text-fg-muted max-w-xl">
        <strong>overflow="menu"</strong> — 塞不下收進 "⋯" dropdown。
        所有 triggers 仍在 DOM（visibility: hidden 保留 Radix roving tabindex），
        menu items 透過 Tabs context 的 onValueChange proxy click。拖拉容器右下角調整寬度，
        觀察 tabs 即時進 / 出 dropdown（ResizeObserver 追蹤容器尺寸）。
      </div>
      <div
        className="resize-x overflow-hidden border border-dashed border-border p-4 min-w-[240px] max-w-full"
        style={{ width: '480px' }}
      >
        <Tabs defaultValue="overview">
          <TabsList overflow="menu">
            {MANY_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="a" className="w-[600px]">
      <TabsList>
        <TabsTrigger value="a">可用</TabsTrigger>
        <TabsTrigger value="b" disabled>停用</TabsTrigger>
        <TabsTrigger value="c">可用</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
}
