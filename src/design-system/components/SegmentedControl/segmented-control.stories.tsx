import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { AlignLeft, AlignCenter, AlignRight, List, LayoutGrid, Calendar } from 'lucide-react'
import { SegmentedControl, SegmentedControlItem } from './segmented-control'
import { Badge } from '@/design-system/components/Badge/badge'

const meta: Meta<typeof SegmentedControl> = {
  title: 'Design System/Components/SegmentedControl/展示',
  component: SegmentedControl,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof SegmentedControl>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('list')
    return (
      <SegmentedControl value={value} onValueChange={setValue}>
        <SegmentedControlItem value="list">清單</SegmentedControlItem>
        <SegmentedControlItem value="board">看板</SegmentedControlItem>
        <SegmentedControlItem value="calendar">行事曆</SegmentedControlItem>
      </SegmentedControl>
    )
  },
}

export const WithStartIcon: Story = {
  render: () => {
    const [value, setValue] = useState('list')
    return (
      <SegmentedControl value={value} onValueChange={setValue}>
        <SegmentedControlItem value="list" startIcon={List}>清單</SegmentedControlItem>
        <SegmentedControlItem value="board" startIcon={LayoutGrid}>看板</SegmentedControlItem>
        <SegmentedControlItem value="calendar" startIcon={Calendar}>行事曆</SegmentedControlItem>
      </SegmentedControl>
    )
  },
}

export const WithBadge: Story = {
  render: () => {
    const [value, setValue] = useState('all')
    return (
      <SegmentedControl value={value} onValueChange={setValue}>
        <SegmentedControlItem value="all" badge={<Badge count={12} />}>全部</SegmentedControlItem>
        <SegmentedControlItem value="active" badge={<Badge count={3} />}>進行中</SegmentedControlItem>
        <SegmentedControlItem value="done" badge={<Badge count={9} />}>已完成</SegmentedControlItem>
      </SegmentedControl>
    )
  },
}

export const IconOnly: Story = {
  render: () => {
    const [value, setValue] = useState('left')
    return (
      <SegmentedControl value={value} onValueChange={setValue} iconOnly>
        <SegmentedControlItem value="left" startIcon={AlignLeft} aria-label="靠左對齊" />
        <SegmentedControlItem value="center" startIcon={AlignCenter} aria-label="置中對齊" />
        <SegmentedControlItem value="right" startIcon={AlignRight} aria-label="靠右對齊" />
      </SegmentedControl>
    )
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <div className="text-caption text-fg-muted mb-1">size = {size}</div>
          <SegmentedControl size={size} defaultValue="a">
            <SegmentedControlItem value="a">Label</SegmentedControlItem>
            <SegmentedControlItem value="b">Label</SegmentedControlItem>
            <SegmentedControlItem value="c">Label</SegmentedControlItem>
            <SegmentedControlItem value="d">Label</SegmentedControlItem>
          </SegmentedControl>
        </div>
      ))}
    </div>
  ),
}

export const FullWidth: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-caption text-fg-muted mb-1">父容器 w-full（跟著 story panel）</div>
        <SegmentedControl defaultValue="a" fullWidth>
          <SegmentedControlItem value="day">日</SegmentedControlItem>
          <SegmentedControlItem value="week">週</SegmentedControlItem>
          <SegmentedControlItem value="month">月</SegmentedControlItem>
        </SegmentedControl>
      </div>
      <div className="w-[320px]">
        <div className="text-caption text-fg-muted mb-1">父容器 w-[320px]（示範等分跟父容器走）</div>
        <SegmentedControl defaultValue="a" fullWidth>
          <SegmentedControlItem value="day">日</SegmentedControlItem>
          <SegmentedControlItem value="week">週</SegmentedControlItem>
          <SegmentedControlItem value="month">月</SegmentedControlItem>
        </SegmentedControl>
      </div>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <SegmentedControl defaultValue="a" disabled>
        <SegmentedControlItem value="a">清單</SegmentedControlItem>
        <SegmentedControlItem value="b">看板</SegmentedControlItem>
        <SegmentedControlItem value="c">行事曆</SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl defaultValue="a">
        <SegmentedControlItem value="a">清單</SegmentedControlItem>
        <SegmentedControlItem value="b" disabled>看板</SegmentedControlItem>
        <SegmentedControlItem value="c">行事曆</SegmentedControlItem>
      </SegmentedControl>
    </div>
  ),
}
