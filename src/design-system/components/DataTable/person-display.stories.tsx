import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { PeoplePicker } from '@/design-system/components/PeoplePicker/people-picker'
import type { PersonValue } from './person-display'
import { PersonDisplay, MultiPersonDisplay } from './person-display'
import { Button } from '@/design-system/components/Button/button'

const meta: Meta = {
  title: 'Design System/Components/PeoplePicker/展示',
  parameters: {
    docs: {
      description: {
        component: '人員選擇元件。外觀同 Select，value 前面多 avatar。多人時 avatar 堆疊。',
      },
    },
  },
}

export default meta
type Story = StoryObj

const samplePeople = [
  { name: 'Alice Chen', avatarUrl: 'https://i.pravatar.cc/48?u=alice', description: 'Design｜D-0042｜EMP-1001' },
  { name: 'Bob Lin', avatarUrl: 'https://i.pravatar.cc/48?u=bob', description: 'Engineering｜E-0087｜EMP-1002' },
  { name: 'Charlie Wu', avatarUrl: 'https://i.pravatar.cc/48?u=charlie', description: 'Product｜P-0015｜EMP-1003' },
  { name: 'Diana Huang', avatarUrl: 'https://i.pravatar.cc/48?u=diana', description: 'Marketing｜M-0023｜EMP-1004' },
  { name: 'Eric Tsai', avatarUrl: 'https://i.pravatar.cc/48?u=eric', description: 'Engineering｜E-0091｜EMP-1005' },
  { name: 'Fiona Lee', avatarUrl: 'https://i.pravatar.cc/48?u=fiona', description: 'Design｜D-0056｜EMP-1006' },
]

/* ── 單人（互動） ── */
const SinglePicker = () => {
  const [val, setVal] = React.useState<PersonValue | null>(samplePeople[0])
  return (
    <div className="flex flex-col gap-6 max-w-xs">
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">edit（可互動）</h3>
        <PeoplePicker value={val} people={samplePeople} onChange={(v) => setVal(v[0] ?? null)} />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">readonly</h3>
        <PeoplePicker mode="readonly" value={samplePeople[0]} />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">disabled</h3>
        <PeoplePicker mode="disabled" value={samplePeople[0]} />
      </div>
    </div>
  )
}

export const Single: Story = {
  name: '單人',
  render: () => <SinglePicker />,
}

/* ── 多人（互動） ── */
const MultiPicker = () => {
  const [val, setVal] = React.useState<PersonValue[]>(samplePeople.slice(0, 4))
  const readonlyVal = samplePeople.slice(0, 4)
  return (
    <div className="flex flex-col gap-6 max-w-xs">
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">edit（可互動,多選）</h3>
        <PeoplePicker value={val} people={samplePeople} onChange={setVal} />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">readonly</h3>
        <PeoplePicker mode="readonly" value={readonlyVal} />
      </div>
    </div>
  )
}

export const Multi: Story = {
  name: '多人',
  render: () => <MultiPicker />,
}

/* ── 尺寸與 Button 對齊 ── */
const SizePicker = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
  const [val, setVal] = React.useState<PersonValue | null>(samplePeople[0])
  return (
    <div className="flex items-center gap-3">
      <PeoplePicker size={size} value={val} people={samplePeople} onChange={(v) => setVal(v[0] ?? null)} className="max-w-xs" />
      <Button size={size}>送出</Button>
      <span className="text-caption text-fg-muted">size="{size}"</span>
    </div>
  )
}

export const SizeAlignment: Story = {
  name: '尺寸',
  render: () => (
    <div className="flex flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map(size => (
        <SizePicker key={size} size={size} />
      ))}
    </div>
  ),
}
