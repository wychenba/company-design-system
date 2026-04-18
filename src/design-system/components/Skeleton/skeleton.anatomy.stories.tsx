import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './skeleton'

const meta: Meta = {
  title: 'Design System/Components/Skeleton/設計規格',
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

export const Overview: Story = {
  name: '元件總覽',
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <H3>Anatomy</H3>
        <Desc>Skeleton 是純 CSS animated gradient div——用灰色色塊模擬真實內容的形狀與排版,讓使用者預期即將出現的佈局。shadcn passthrough + 橋接 DS token(bg-secondary)。</Desc>
        <div className="flex flex-col gap-2 max-w-md">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      <div>
        <H3>Props 速查</H3>
        <Desc>Skeleton 只是 styled div——尺寸 / 形狀完全由 className(Tailwind utilities)決定。</Desc>
      </div>
    </div>
  ),
}

export const CommonShapes: Story = {
  name: '常見形狀',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <H3>單行文字</H3>
        <Skeleton className="h-4 w-48" />
      </div>

      <div>
        <H3>多行段落(寬度遞減模擬自然換行)</H3>
        <div className="flex flex-col gap-2 max-w-md">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      <div>
        <H3>標題 + 描述</H3>
        <div className="flex flex-col gap-2 max-w-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div>
        <H3>Avatar(圓形)+ name</H3>
        <div className="flex items-center gap-3 max-w-sm">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>

      <div>
        <H3>Card 載入</H3>
        <div className="border border-border rounded-lg p-4 max-w-sm flex flex-col gap-3">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-5 w-3/4" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>

      <div>
        <H3>List 載入(多 row 同形狀)</H3>
        <div className="flex flex-col gap-3 max-w-md">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}

export const DesignPrinciple: Story = {
  name: '設計原則',
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <H3>形狀貼合真實內容</H3>
        <Desc>Skeleton 的形狀應該**貼近真實內容的排版**——使用者看到 skeleton 後資料載入,佈局不應大幅跳動。形狀嚴重偏離真實內容會讓使用者預期被打破、體感更慢。</Desc>
      </div>

      <div>
        <H3>長時間 loading 不適合 Skeleton</H3>
        <Desc>Skeleton 暗示「佈局已就位,資料很快會來」——長時間(&gt; 10s)持續顯示會讓使用者懷疑是否卡住。此時改用 progress indicator 或說明文字。</Desc>
      </div>
    </div>
  ),
}
