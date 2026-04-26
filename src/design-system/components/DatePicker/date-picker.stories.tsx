import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DatePicker, DatePickerDisplay } from './date-picker'
import { Button } from '@/design-system/components/Button/button'

const meta: Meta<typeof DatePicker> = {
  title: 'Design System/Components/DatePicker/展示',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '日期選擇元件。外觀同 Select，Calendar icon 取代 ChevronDown。支援 clearable 和格式化選項。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DatePicker>

/* ── 基本用法 ── */
export const Default: Story = {
  name: '基本用法',
  render: () => {
    const [value, setValue] = React.useState('2026-04-02')
    return (
      <div className="flex flex-col gap-4 max-w-xs">
        <DatePicker value={value} onChange={setValue} />
        <p className="text-caption text-fg-muted">目前值：{value || '(empty)'}</p>
      </div>
    )
  },
}

/* ── 三種模式 ── */
export const Modes: Story = {
  name: '三種模式',
  render: () => (
    <div className="flex flex-col gap-6 max-w-xs">
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">edit</h3>
        <DatePicker value="2026-04-02" onChange={() => {}} />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">readonly</h3>
        <DatePicker mode="readonly" value="2026-04-02" />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">disabled</h3>
        <DatePicker mode="disabled" value="2026-04-02" />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">readonly (null)</h3>
        <DatePicker mode="readonly" value={null} />
      </div>
    </div>
  ),
}

/* ── 可清除 ── */
export const Clearable: Story = {
  name: '可清除',
  render: () => {
    const [value, setValue] = React.useState('2026-04-02')
    return (
      <div className="flex flex-col gap-4 max-w-xs">
        <p className="text-caption text-fg-muted">有值時右側出現清除按鈕</p>
        <DatePicker value={value} onChange={setValue} clearable />
      </div>
    )
  },
}

/* ── 尺寸與 Button 對齊 ── */
export const SizeAlignment: Story = {
  name: '尺寸',
  render: () => {
    const [sm, setSm] = React.useState('2026-04-02')
    const [md, setMd] = React.useState('2026-04-02')
    const [lg, setLg] = React.useState('2026-04-02')
    const states: Record<string, [string, (v: string) => void]> = { sm: [sm, setSm], md: [md, setMd], lg: [lg, setLg] }
    return (
      <div className="flex flex-col gap-4">
        {(['sm', 'md', 'lg'] as const).map(size => (
          <div key={size} className="flex items-center gap-3">
            <DatePicker size={size} value={states[size][0]} onChange={states[size][1]} className="max-w-xs" />
            <Button size={size}>送出</Button>
            <span className="text-caption text-fg-muted">size="{size}"</span>
          </div>
        ))}
      </div>
    )
  },
}

/* ── DatePicker.Range — Ant-style 區間選擇(2026-04-21 新增)── */
export const RangePicker: Story = {
  name: 'Range:訂房 / 訂機票情境',
  render: () => {
    const [range, setRange] = React.useState<[string | null, string | null]>(['2026-04-15', '2026-04-20'])
    return (
      <div className="flex flex-col gap-4 max-w-md">
        <p className="text-caption text-fg-muted">
          雙 input + 中間箭頭,整個 wrapper 是單一 trigger。點擊任一位置展開兩個月並列的 range picker。
        </p>
        <DatePicker.Range value={range} onChange={setRange} />
        <p className="text-caption text-fg-muted">
          目前值:from={range[0] ?? '(空)'} / to={range[1] ?? '(空)'}
        </p>
        <p className="text-caption text-fg-muted">Empty 初始狀態:</p>
        <DatePicker.Range
          value={[null, null]}
          onChange={() => {}}
          placeholder={['入住日期', '退房日期']}
          clearable
        />
      </div>
    )
  },
}

/* ── Display（DataTable cell 用）── */
export const Display: Story = {
  name: 'Display（cell 用）',
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-caption text-fg-muted w-20">預設</span>
        <DatePickerDisplay value="2026-04-02" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-caption text-fg-muted w-20">完整月份</span>
        <DatePickerDisplay value="2026-04-02" formatOptions={{ year: 'numeric', month: 'long', day: 'numeric' }} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-caption text-fg-muted w-20">zh-TW</span>
        <DatePickerDisplay value="2026-04-02" locale="zh-TW" formatOptions={{ year: 'numeric', month: 'long', day: 'numeric' }} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-caption text-fg-muted w-20">null</span>
        <DatePickerDisplay value={null} />
      </div>
    </div>
  ),
}
