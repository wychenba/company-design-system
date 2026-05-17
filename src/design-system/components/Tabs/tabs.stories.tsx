// @story-trait-rationale: hasSizes 由 anatomy.stories.tsx SizeMatrix auto-compile owns size showcase; hasInteractiveStates 的 Disabled story 已在本檔覆蓋(2026-05-15 F-migration)。
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
  name: '預設',
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

export const WithSuffix: Story = {
  name: '帶後綴',
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

// @story-trait-rationale: OverflowScroll / OverflowMenu + MANY_TABS array retired 2026-05-17 per audit Dim 24 —
//   anatomy.stories.tsx OverflowMatrix(3 overflow values side-by-side)已 cover overflow 機制比較。
//   展示層保留 typical 情境(Default / WithSuffix / Disabled);overflow 真實情境靠 anatomy。

export const Disabled: Story = {
  name: '停用',
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
