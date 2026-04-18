import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DescriptionList, DescriptionItem } from './description-list'

const meta: Meta = {
  title: 'Design System/Components/DescriptionList/設計規格',
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
        <Desc>DescriptionList 是 `dl / dt / dd` HTML 語義元件——每個 DescriptionItem 是一組 label(dt)+ value(dd)配對。對齊 Atlassian / Polaris 慣例。CSS grid 容器,`cols` prop 控制欄數。</Desc>
        <div className="border border-border rounded-lg p-4 max-w-md">
          <DescriptionList>
            <DescriptionItem label="Email">user@example.com</DescriptionItem>
            <DescriptionItem label="團隊">Engineering</DescriptionItem>
            <DescriptionItem label="時區">UTC+8(台北)</DescriptionItem>
            <DescriptionItem label="建立時間">2026-04-18</DescriptionItem>
          </DescriptionList>
        </div>
      </div>

      <div>
        <H3>Typography(閱讀模式)</H3>
        <Desc>層級靠色彩區分,不靠字體大小。兩者都是 14px,行高 1.5(閱讀模式)。</Desc>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Part</Th><Th>HTML</Th><Th>Typography</Th></tr></thead>
            <tbody>
              <tr><Td mono>label</Td><Td mono>&lt;dt&gt;</Td><Td mono>text-body(14px)+ text-fg-secondary(neutral-8)</Td></tr>
              <tr><Td mono>value</Td><Td mono>&lt;dd&gt;</Td><Td mono>text-body(14px)+ text-foreground(neutral-9)</Td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <H3>間距</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>位置</Th><Th>Value</Th></tr></thead>
            <tbody>
              <tr><Td>label → value(同 item 內)</Td><Td mono>mt-0.5(2px)——極小間距,視覺上 label 與 value 緊密配對</Td></tr>
              <tr><Td>items 之間垂直 gap</Td><Td mono>gap-y-[var(--layout-space-tight)]——density-aware</Td></tr>
              <tr><Td>columns 之間水平 gap</Td><Td mono>gap-x-4(16px)</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

export const ColsMatrix: Story = {
  name: 'cols(1 / 2 / 3)',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <H3>cols=1(預設,窄容器)</H3>
        <Desc>垂直堆疊,適合 NameCard、sidebar detail 等窄容器。</Desc>
        <div className="border border-border rounded-lg p-4 max-w-xs">
          <DescriptionList cols={1}>
            <DescriptionItem label="Email">user@example.com</DescriptionItem>
            <DescriptionItem label="團隊">Engineering</DescriptionItem>
            <DescriptionItem label="時區">UTC+8(台北)</DescriptionItem>
          </DescriptionList>
        </div>
      </div>

      <div>
        <H3>cols=2(中等寬度)</H3>
        <Desc>兩欄並排,適合 NameCard info fields / detail panel。</Desc>
        <div className="border border-border rounded-lg p-4 max-w-lg">
          <DescriptionList cols={2}>
            <DescriptionItem label="姓名">陳麒仁</DescriptionItem>
            <DescriptionItem label="職稱">Design Engineer</DescriptionItem>
            <DescriptionItem label="Email">user@example.com</DescriptionItem>
            <DescriptionItem label="電話">0912-345-678</DescriptionItem>
            <DescriptionItem label="團隊">Engineering</DescriptionItem>
            <DescriptionItem label="時區">UTC+8</DescriptionItem>
          </DescriptionList>
        </div>
      </div>

      <div>
        <H3>cols=3(寬容器)</H3>
        <Desc>三欄,適合寬 detail panel 顯示大量屬性。</Desc>
        <div className="border border-border rounded-lg p-4 max-w-3xl">
          <DescriptionList cols={3}>
            <DescriptionItem label="訂單編號">#20260418-001</DescriptionItem>
            <DescriptionItem label="狀態">已出貨</DescriptionItem>
            <DescriptionItem label="建立時間">2026-04-18 10:35</DescriptionItem>
            <DescriptionItem label="付款方式">信用卡</DescriptionItem>
            <DescriptionItem label="配送方式">宅配</DescriptionItem>
            <DescriptionItem label="預計送達">2026-04-20</DescriptionItem>
            <DescriptionItem label="商品">Q1 行銷套組</DescriptionItem>
            <DescriptionItem label="數量">3</DescriptionItem>
            <DescriptionItem label="總金額">NT$ 2,490</DescriptionItem>
          </DescriptionList>
        </div>
      </div>
    </div>
  ),
}
