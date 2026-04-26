import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Slider } from './slider'

const meta: Meta<typeof Slider> = {
  title: 'Design System/Components/Slider/展示',
  component: Slider,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof Slider>

// ── Single value ─────────────────────────────────────────────────────────

export const Default: Story = {
  name: '預設(單一值)',
  render: () => {
    const [value, setValue] = React.useState([50])
    return (
      <div className="w-[360px] flex flex-col gap-4">
        <Slider value={value} onValueChange={setValue} aria-label="預設 slider demo" />
        <p className="text-caption text-fg-secondary">Value: {value[0]}</p>
      </div>
    )
  },
}

// ── Range mode ───────────────────────────────────────────────────────────

export const Range: Story = {
  name: '範圍模式(雙 thumb)',
  render: () => {
    const [value, setValue] = React.useState([20, 80])
    return (
      <div className="w-[360px] flex flex-col gap-4">
        <Slider value={value} onValueChange={setValue} />
        <p className="text-caption text-fg-secondary">
          Range: {value[0]} – {value[1]}
        </p>
      </div>
    )
  },
}

// ── Sizes(容器對齊)───────────────────────────────────────────────────

export const SizeAlignment: Story = {
  name: '容器尺寸對齊(視覺不變,高度跟 Field 對齊)',
  render: () => (
    <div className="w-[360px] flex flex-col gap-6">
      <p className="text-caption text-fg-secondary max-w-[480px]">
        三個 size 下 track 厚度與 thumb 直徑一致——只有容器外高跟著
        `--field-height-*` 變。這讓 Slider 能在 Field 內跟 Input / Select /
        NumberInput 並排對齊,同時保持自己的視覺身分不變。
      </p>
      {(['sm', 'md', 'lg'] as const).map(size => (
        <div key={size} className="flex flex-col gap-2">
          <div className="text-caption text-fg-muted">
            size = {size}(h-field-{size})
          </div>
          <div className="border border-dashed border-border rounded-md p-0">
            <Slider size={size} defaultValue={[40]} />
          </div>
        </div>
      ))}
    </div>
  ),
}

// ── Min / Max / Step ─────────────────────────────────────────────────────

export const MinMaxStep: Story = {
  name: 'Min / Max / Step',
  render: () => {
    const [value, setValue] = React.useState([32])
    return (
      <div className="w-[360px] flex flex-col gap-4">
        <div className="text-caption text-fg-muted">
          min=0, max=100, step=4
        </div>
        <Slider
          value={value}
          onValueChange={setValue}
          min={0}
          max={100}
          step={4}
        />
        <p className="text-caption text-fg-secondary">Value: {value[0]}</p>
      </div>
    )
  },
}

// ── Disabled ─────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => (
    <div className="w-[360px] flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-caption text-fg-muted">單值 disabled</div>
        <Slider defaultValue={[60]} disabled />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-caption text-fg-muted">範圍 disabled</div>
        <Slider defaultValue={[20, 80]} disabled />
      </div>
    </div>
  ),
}

// ── With live value commit ──────────────────────────────────────────────

export const OnCommit: Story = {
  name: 'onValueCommit(放開時才觸發)',
  render: () => {
    const [live, setLive] = React.useState([50])
    const [committed, setCommitted] = React.useState([50])
    return (
      <div className="w-[360px] flex flex-col gap-4">
        <p className="text-caption text-fg-secondary">
          拖曳時 live 跟著變,放開才更新 committed(適合昂貴操作如 API
          query、圖片重繪)
        </p>
        <Slider
          value={live}
          onValueChange={setLive}
          onValueCommit={setCommitted}
        />
        <div className="flex flex-col gap-1 text-caption">
          <span className="text-fg-secondary">Live: {live[0]}</span>
          <span className="text-foreground font-medium">
            Committed: {committed[0]}
          </span>
        </div>
      </div>
    )
  },
}
