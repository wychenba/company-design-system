import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Inbox, Search, FileText } from 'lucide-react'
import { Empty } from './empty'
import { Button } from '@/design-system/components/Button/button'

const meta: Meta = {
  title: 'Design System/Components/Empty/設計規格',
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
        <Desc>Empty 是 layout pattern——排列 Icon + Title + Description + Action 成居中垂直堆疊。預設只有 description,icon / title / action 全部可選。</Desc>
        <div className="border border-border rounded-lg p-8">
          <Empty
            icon={Inbox}
            title="沒有訊息"
            description="當您收到新訊息時,會在這裡顯示"
            action={<Button variant="primary" size="sm">發送第一則訊息</Button>}
          />
        </div>
      </div>

      <div>
        <H3>Slot 與 Spacing</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Slot</Th><Th>可選</Th><Th>Typography</Th><Th>上方間距</Th></tr></thead>
            <tbody>
              <tr><Td mono>icon</Td><Td>選填</Td><Td>Avatar 48px neutral + icon</Td><Td>—</Td></tr>
              <tr><Td mono>title</Td><Td>選填</Td><Td>16px font-medium centered</Td><Td mono>--layout-space-tight</Td></tr>
              <tr><Td mono>description</Td><Td>必有(預設唯一 slot)</Td><Td>14px fg-secondary centered</Td><Td mono>mt-0.5(2px,跟 item-layout 一致)</Td></tr>
              <tr><Td mono>action</Td><Td>選填</Td><Td>CTA Button</Td><Td mono>--layout-space-loose</Td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <H3>Props 速查</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Prop</Th><Th>Type</Th><Th>Default</Th><Th>說明</Th></tr></thead>
            <tbody>
              {[
                ['icon', 'LucideIcon', '—', 'Avatar 48px 內的 icon'],
                ['title', 'string', '—', '主要標題(16px medium)'],
                ['description', 'string', '必填(預設唯一 slot)', '說明文字(14px fg-secondary)'],
                ['action', 'ReactNode', '—', 'CTA button / 操作區'],
              ].map(([p, t, d, desc]) => (
                <tr key={p}><Td mono>{p}</Td><Td mono>{t}</Td><Td mono>{d}</Td><Td>{desc}</Td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

export const VariantMatrix: Story = {
  name: '常見場景',
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <H3>Table 空資料</H3>
        <div className="border border-border rounded-lg p-8">
          <Empty description="無資料" className="py-12" />
        </div>
      </div>

      <div>
        <H3>SelectMenu 搜尋無結果</H3>
        <div className="border border-border rounded-lg p-4 max-w-xs">
          <Empty icon={Search} description="找不到符合的項目" className="py-6" />
        </div>
      </div>

      <div>
        <H3>Page section 初次引導</H3>
        <div className="border border-border rounded-lg p-8">
          <Empty
            icon={FileText}
            title="還沒有專案"
            description="建立第一個專案開始追蹤您的任務"
            action={<Button variant="primary">建立專案</Button>}
          />
        </div>
      </div>
    </div>
  ),
}
