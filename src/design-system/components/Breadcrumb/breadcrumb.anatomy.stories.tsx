import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './breadcrumb'

const meta: Meta = {
  title: 'Design System/Components/Breadcrumb/設計規格',
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
        <Desc>Breadcrumb 是純 HTML + Tailwind 元件(無 Radix primitive),基於 shadcn/ui Breadcrumb 結構橋接 DS token。使用 `&lt;nav aria-label="Breadcrumb"&gt;` 確保正確 a11y。</Desc>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">專案</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Q1 行銷活動</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>電子報設計</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div>
        <H3>結構元件</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>元件</Th><Th>作用</Th><Th>HTML</Th></tr></thead>
            <tbody>
              <tr><Td mono>Breadcrumb</Td><Td>外層 nav,aria-label="Breadcrumb"</Td><Td mono>&lt;nav&gt;</Td></tr>
              <tr><Td mono>BreadcrumbList</Td><Td>flex 容器</Td><Td mono>&lt;ol&gt;</Td></tr>
              <tr><Td mono>BreadcrumbItem</Td><Td>單一層級</Td><Td mono>&lt;li&gt;</Td></tr>
              <tr><Td mono>BreadcrumbLink</Td><Td>可點擊的上層 / 中層</Td><Td mono>&lt;a&gt;</Td></tr>
              <tr><Td mono>BreadcrumbPage</Td><Td>當前頁(最末項,不可點擊)</Td><Td mono>&lt;span aria-current="page"&gt;</Td></tr>
              <tr><Td mono>BreadcrumbSeparator</Td><Td>ChevronRight 分隔符</Td><Td mono>&lt;li role="presentation"&gt;</Td></tr>
              <tr><Td mono>BreadcrumbEllipsis</Td><Td>中間層過多時的省略符</Td><Td>—</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

export const CollapseMatrix: Story = {
  name: '長路徑收合(Ellipsis)',
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <H3>路徑過長時用 Ellipsis 收合中間</H3>
        <Desc>保留第一層(根)+ 最後兩層(當前 + 上一層),中間以 `...` 取代。使用者需要看到「我在哪裡」+「根位置」,中間層通常不需要完整可見。</Desc>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">專案</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>設定</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="text-footnote text-fg-muted mt-3">Ellipsis 可以 hover 展開中間層(consumer 自行實作互動,本元件只渲染 `...` icon)</p>
      </div>
    </div>
  ),
}

export const UsageExamples: Story = {
  name: '真實場景',
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <H3>檔案管理器路徑</H3>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="#">Documents</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="#">Projects</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="#">2026-Q1</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>spec.md</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div>
        <H3>電商多層分類</H3>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="#">首頁</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="#">Electronics</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="#">Phones</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>iPhone 15 Pro</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div>
        <H3>App 內部階層(專案 / 子專案 / 任務)</H3>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="#">Engineering</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="#">Design System</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="#">Sprint 23</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Button 重構</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  ),
}
