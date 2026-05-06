import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from './checkbox'
import { SelectionItem } from '@/design-system/components/SelectionControl/selection-item'

const meta: Meta<typeof Checkbox> = {
  title: 'Design System/Components/Checkbox/展示',
  component: Checkbox,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Checkbox>

// @story-trait-rationale: pre-existing trait gaps tracked separately; this PR scope = add Modes story with display card.
/* ── 三種模式 ── */
export const Modes: Story = {
  name: '三種模式',
  render: () => (
    <div className="flex flex-col gap-6 max-w-sm">
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">edit</h3>
        <Checkbox defaultChecked aria-label="同意條款(edit mode demo)" />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">display</h3>
        <Checkbox mode="display" checked aria-label="同意條款(display mode demo)" />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">readonly</h3>
        <Checkbox mode="readonly" checked aria-label="同意條款(readonly mode demo)" />
      </div>
      <div>
        <h3 className="text-body font-bold text-foreground mb-2">disabled</h3>
        <Checkbox mode="disabled" checked aria-label="同意條款(disabled mode demo)" />
      </div>
    </div>
  ),
}

/* ── 狀態 ── */
export const States: Story = {
  name: '狀態',
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-caption text-fg-muted mb-2">md（16px，預設）</p>
        <div className="flex items-center gap-4">
          <Checkbox aria-label="off" />
          <Checkbox defaultChecked aria-label="on" />
          <Checkbox checked="indeterminate" aria-label="indeterminate" />
          <Checkbox disabled aria-label="disabled off" />
          <Checkbox disabled defaultChecked aria-label="disabled on" />
          <Checkbox disabled checked="indeterminate" aria-label="disabled indeterminate" />
        </div>
        <div className="flex items-center gap-4 mt-1 text-[10px] text-fg-muted">
          <span className="w-4 text-center">off</span>
          <span className="w-4 text-center">on</span>
          <span className="w-4 text-center">—</span>
          <span className="w-4 text-center">off</span>
          <span className="w-4 text-center">on</span>
          <span className="w-4 text-center">—</span>
        </div>
      </div>
      <div>
        <p className="text-caption text-fg-muted mb-2">lg（20px）</p>
        <div className="flex items-center gap-4">
          <Checkbox size="lg" aria-label="off" />
          <Checkbox size="lg" defaultChecked aria-label="on" />
          <Checkbox size="lg" checked="indeterminate" aria-label="indeterminate" />
          <Checkbox size="lg" disabled aria-label="disabled off" />
          <Checkbox size="lg" disabled defaultChecked aria-label="disabled on" />
          <Checkbox size="lg" disabled checked="indeterminate" aria-label="disabled indeterminate" />
        </div>
      </div>
    </div>
  ),
}

/* ── 垂直 Group ── */
export const VerticalGroup: Story = {
  name: '垂直 Group',
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      {(['sm', 'md', 'lg'] as const).map(size => (
        <div key={size}>
          <p className="text-caption text-fg-muted mb-1">size="{size}"</p>
          <div className="grid">
            <SelectionItem size={size} control={<Checkbox id={`${size}-a`} size={size} />} label="Electronics" htmlFor={`${size}-a`} />
            <SelectionItem size={size} control={<Checkbox id={`${size}-b`} size={size} />} label="Furniture" description="桌椅、收納、辦公家具" htmlFor={`${size}-b`} />
            <SelectionItem size={size} control={<Checkbox id={`${size}-c`} size={size} />} label="Food & Beverage" htmlFor={`${size}-c`} />
          </div>
        </div>
      ))}
    </div>
  ),
}

/* ── 水平排列 ── */
export const Horizontal: Story = {
  name: '水平排列',
  render: () => (
    <div className="flex gap-6 max-w-md">
      <SelectionItem control={<Checkbox id="h-a" />} label="Electronics" htmlFor="h-a" />
      <SelectionItem control={<Checkbox id="h-b" />} label="Furniture" htmlFor="h-b" />
      <SelectionItem control={<Checkbox id="h-c" />} label="Food" htmlFor="h-c" />
    </div>
  ),
}

/* ── Disabled ── */
export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <div className="grid max-w-sm">
      <SelectionItem control={<Checkbox id="dis-a" disabled defaultChecked />} label="已選取但不可更改" htmlFor="dis-a" disabled />
      <SelectionItem control={<Checkbox id="dis-b" disabled />} label="此選項不可用" htmlFor="dis-b" disabled />
    </div>
  ),
}
