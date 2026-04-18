import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Tag as TagIcon } from 'lucide-react'
import { Chip, ChipGroup } from './chip'

const meta: Meta = {
  title: 'Design System/Components/Chip/設計規格',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-body font-bold text-foreground mb-2">{children}</h3>
)
const Desc = ({ children }: { children: React.ReactNode }) => (
  <p className="text-caption text-fg-muted mb-4 max-w-[720px] leading-relaxed">{children}</p>
)
const Td = ({ children, mono }: { children: React.ReactNode; mono?: boolean }) => (
  <td className={`border border-border px-3 py-1.5 text-caption ${mono ? 'font-mono' : ''}`}>{children}</td>
)
const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="border border-border px-3 py-1.5 text-caption text-fg-secondary bg-muted text-left">{children}</th>
)

export const Overview: Story = {
  name: '元件總覽',
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <H3>Anatomy</H3>
        <Desc>Chip 是 **Material Design Filter Chip** 實作——多選(預設)或單選的 pill 控件。基於 Radix ToggleGroup,橋接 DS token。視覺上是一排獨立的 `rounded-full` pill,各自有 `gap-2` 間距(非連體,這是跟 SegmentedControl 的主要差異)。</Desc>
        <ChipGroup defaultValue={['electronics', 'food']}>
          <Chip value="electronics">電子產品</Chip>
          <Chip value="furniture">家具</Chip>
          <Chip value="food">食品</Chip>
          <Chip value="clothing">服飾</Chip>
          <Chip value="books">書籍</Chip>
        </ChipGroup>
      </div>

      <div>
        <H3>Props 速查</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>元件</Th><Th>主要 Props</Th></tr></thead>
            <tbody>
              <tr><Td mono>ChipGroup</Td><Td mono>type?: 'single' | 'multiple'(default 'multiple'),value / onValueChange,size,layout</Td></tr>
              <tr><Td mono>Chip</Td><Td mono>value(必填),startIcon,disabled</Td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <H3>與 SegmentedControl 的差異</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th></Th><Th>Chip</Th><Th>SegmentedControl</Th></tr></thead>
            <tbody>
              <tr><Td>選擇語意</Td><Td>多選為主,可選單選</Td><Td>固定單選(radio)</Td></tr>
              <tr><Td>視覺連接</Td><Td mono>各自獨立 pill,gap-2</Td><Td mono>Items 連體,-ml-px border 重疊</Td></tr>
              <tr><Td>圓角</Td><Td mono>rounded-full(M3 身份特徵)</Td><Td mono>rounded-md</Td></tr>
              <tr><Td>溢出處理</Td><Td>layout="scroll" / "menu"(共用 horizontal-overflow pattern)</Td><Td>不支援 overflow</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

export const SelectionMatrix: Story = {
  name: 'Multi vs Single 選擇',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <H3>Multiple(預設)</H3>
        <Desc>選取任意數量——filter panel 的 tag 選取、toolbar 多選過濾。</Desc>
        <ChipGroup defaultValue={['zh', 'en']}>
          <Chip value="zh">中文</Chip>
          <Chip value="en">英文</Chip>
          <Chip value="ja">日文</Chip>
          <Chip value="ko">韓文</Chip>
        </ChipGroup>
      </div>

      <div>
        <H3>Single(單選)</H3>
        <Desc>互斥單選——當需要 chip 的視覺感(rounded-full, 獨立 pill)但語意是互斥時使用。若需 compact 連體,改用 SegmentedControl。</Desc>
        <ChipGroup type="single" defaultValue="all">
          <Chip value="all">全部</Chip>
          <Chip value="active">進行中</Chip>
          <Chip value="done">已完成</Chip>
        </ChipGroup>
      </div>
    </div>
  ),
}

export const LayoutMatrix: Story = {
  name: 'Layout(wrap / scroll / menu)',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <H3>wrap(預設)</H3>
        <Desc>超出容器自然換行。適合空間充裕的 filter panel。</Desc>
        <div className="max-w-md border border-border rounded-md p-3">
          <ChipGroup defaultValue={['a']}>
            {['電子產品', '家具', '食品', '服飾', '書籍', '運動', '玩具', '美妝', '家電'].map(label => (
              <Chip key={label} value={label}>{label}</Chip>
            ))}
          </ChipGroup>
        </div>
      </div>

      <div>
        <H3>scroll</H3>
        <Desc>水平捲動 + fade mask(共用 `horizontal-overflow` pattern,跟 Tabs 一致)。適合空間受限但希望保留 chip 視覺的場景。</Desc>
        <div className="max-w-md border border-border rounded-md p-3">
          <ChipGroup layout="scroll" defaultValue={['a']}>
            {['電子產品', '家具', '食品', '服飾', '書籍', '運動', '玩具', '美妝', '家電'].map(label => (
              <Chip key={label} value={label}>{label}</Chip>
            ))}
          </ChipGroup>
        </div>
      </div>

      <div>
        <H3>menu(overflow 收入 DropdownMenu)</H3>
        <Desc>隱藏溢出到下拉選單(類似 Tabs overflow="menu")。適合 chip 很多但使用者不常切後面的場景。</Desc>
        <div className="max-w-md border border-border rounded-md p-3">
          <ChipGroup layout="menu" defaultValue={['a']}>
            {['電子產品', '家具', '食品', '服飾', '書籍', '運動', '玩具', '美妝', '家電'].map(label => (
              <Chip key={label} value={label}>{label}</Chip>
            ))}
          </ChipGroup>
        </div>
      </div>
    </div>
  ),
}
