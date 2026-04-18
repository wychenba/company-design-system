import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { toast } from './toast'
import { Button } from '@/design-system/components/Button/button'

const meta: Meta = {
  title: 'Design System/Components/Toast/設計規格',
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

const Swatch = ({ value, size = 'sm' }: { value: string; size?: 'sm' | 'md' }) => {
  const s = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  return <span className={`${s} rounded-md shrink-0 border border-black/10 inline-block align-middle`} style={{ backgroundColor: value === 'white' ? '#fff' : `var(${value})` }} />
}

const TokenCell = ({ token, display }: { token: string; display?: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <Swatch value={token} size="sm" />
    <span className="font-mono">{display ?? token}</span>
  </span>
)

export const Overview: Story = {
  name: '元件總覽',
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <H3>Anatomy</H3>
        <Desc>Toast 基於 sonner(浮動管理) + 消費 Notice primitive(layout + icon + theme 策略,與 Alert 共用)。透過 `toast()` 函式觸發,不是 JSX 元件。</Desc>
        <div className="flex gap-3 flex-wrap">
          <Button variant="tertiary" onClick={() => toast({ variant: 'success', title: '已儲存', description: '變更已同步至雲端' })}>
            觸發 success toast
          </Button>
          <Button variant="tertiary" onClick={() => toast({ variant: 'error', title: '操作失敗', description: '請檢查網路連線後重試' })}>
            觸發 error toast
          </Button>
          <Button variant="tertiary" onClick={() => toast({
            variant: 'success',
            title: '已刪除',
            description: '訊息已移至封存',
            action: { label: '復原', onClick: () => toast({ variant: 'info', title: '已復原' }) },
          })}>觸發 action toast</Button>
        </div>
      </div>

      <div>
        <H3>ToastOptions(toast 函式參數)</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Field</Th><Th>Type</Th><Th>Default</Th><Th>說明</Th></tr></thead>
            <tbody>
              {[
                ['variant', "'neutral' | 'success' | 'info' | 'warning' | 'error'", "'neutral'", '語意 + 色彩'],
                ['title', 'string', '必填', '主要訊息'],
                ['description', 'string', '—', '補充說明,自然換行'],
                ['action', '{ label: string; onClick: () => void }', '—', 'tertiary xs 按鈕(Undo pattern)'],
                ['duration', 'number', '4000', '自動關閉時間(ms)'],
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

export const ContainerArchitecture: Story = {
  name: 'Container 三層架構',
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <H3>為什麼分三層</H3>
        <Desc>
          Toast 的 container 結構是**刻意三層**——解決陰影 token 在 light / dark
          mode 不同強度的問題(dark 45% black,light 4% black)。若陰影跟
          `data-theme="dark"` 在同一層,light 頁面上的 dark toast 會有過重陰影。
        </Desc>
      </div>

      <div>
        <H3>三層結構</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Layer</Th><Th>Class</Th><Th>作用</Th></tr></thead>
            <tbody>
              <tr><Td>1. Shadow wrapper</Td><Td mono>rounded-lg + elevation-200</Td><Td>永遠在頁面 theme 解析,陰影用頁面 theme 的輕陰影</Td></tr>
              <tr><Td>2. Bg layer</Td><Td mono>bg-&#123;color&#125;</Td><Td>有色相 variant 在頁面 theme 解析</Td></tr>
              <tr><Td>3. Theme layer</Td><Td mono>data-theme + text-foreground</Td><Td>content token 在此 re-resolve(讓 Icon/Text 切到 inverse theme)</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

export const VariantThemeStrategy: Story = {
  name: 'Variant × Theme 策略',
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <H3>跟 Alert 共用同一套 variant × theme</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Variant</Th><Th>Bg</Th><Th>data-theme</Th><Th>視覺</Th></tr></thead>
            <tbody>
              <tr><Td mono>neutral</Td><Td><TokenCell token="--surface-raised" display="bg-surface-raised(同層翻轉)" /></Td><Td mono>{'{inverse}'}</Td><Td>light 頁→暗底 / dark 頁→亮底</Td></tr>
              <tr><Td mono>success</Td><Td><TokenCell token="--surface-raised" display="bg-surface-raised(同層翻轉)" /></Td><Td mono>{'{inverse}'}</Td><Td>同上 + 綠色 icon</Td></tr>
              <tr><Td mono>info</Td><Td><TokenCell token="--info" display="bg-info(outer)" /></Td><Td mono>"dark"(inner)</Td><Td>藍底白字</Td></tr>
              <tr><Td mono>warning</Td><Td><TokenCell token="--warning" display="bg-warning(outer)" /></Td><Td mono>"light"(inner)</Td><Td>黃底深字</Td></tr>
              <tr><Td mono>error</Td><Td><TokenCell token="--error" display="bg-error(outer)" /></Td><Td mono>"dark"(inner)</Td><Td>橘底白字</Td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-footnote text-fg-muted mt-3">neutral/success 的 bg + data-theme 在同一層,因為 `bg-surface-raised` 需要跟 data-theme 一起翻轉。</p>
      </div>

      <div>
        <H3>觸發各 variant 測試</H3>
        <div className="flex flex-wrap gap-2">
          {(['neutral', 'info', 'success', 'warning', 'error'] as const).map(v => (
            <Button key={v} variant="tertiary" size="sm" onClick={() => toast({ variant: v, title: `${v} toast`, description: '範例訊息' })}>
              {v}
            </Button>
          ))}
        </div>
      </div>
    </div>
  ),
}
