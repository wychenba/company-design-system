import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Check } from 'lucide-react'
import { Steps, StepItem } from './steps'

const meta: Meta = {
  title: 'Design System/Components/Steps/設計規格',
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
        <Desc>Steps 是有序步驟序列——Indicator(圓形)+ Label + 可選 Description + Connector(連接線)。每個 StepItem 有三種狀態:completed / current / upcoming。</Desc>
        <div className="border border-border rounded-lg p-4 max-w-2xl">
          <Steps value="shipping" completedValues={['cart', 'payment']}>
            <StepItem value="cart" label="購物車" />
            <StepItem value="payment" label="付款資訊" />
            <StepItem value="shipping" label="配送方式" description="當前步驟" />
            <StepItem value="review" label="確認訂單" />
            <StepItem value="done" label="完成" />
          </Steps>
        </div>
      </div>

      <div>
        <H3>三種狀態</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>狀態</Th><Th>Indicator</Th><Th>Label</Th><Th>Connector(右側)</Th></tr></thead>
            <tbody>
              <tr><Td>completed</Td><Td><span className="inline-flex items-center gap-1.5"><Swatch value="--primary" size="sm" /><span>filled primary + white check icon</span></span></Td><Td><TokenCell token="--foreground" display="foreground" /></Td><Td><TokenCell token="--primary" display="bg-primary" /></Td></tr>
              <tr><Td>current(= value)</Td><Td><span className="inline-flex items-center gap-1.5"><Swatch value="--primary" size="sm" /><span>hollow + primary border + ring</span></span></Td><Td><TokenCell token="--foreground" display="foreground" /></Td><Td><TokenCell token="--divider" display="bg-divider" /></Td></tr>
              <tr><Td>upcoming</Td><Td><span className="inline-flex items-center gap-1.5"><Swatch value="--border" size="sm" /><span>hollow + border</span></span></Td><Td><TokenCell token="--fg-secondary" display="fg-secondary" /></Td><Td><TokenCell token="--divider" display="bg-divider" /></Td></tr>
              <tr><Td>error</Td><Td><span className="inline-flex items-center gap-1.5"><Swatch value="--error" size="sm" /><span>bg-error + white icon</span></span></Td><Td><TokenCell token="--error" display="error" /></Td><Td>—</Td></tr>
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
                ['Steps', '', '', ''],
                ['  value', 'string', '—', '當前步驟 value'],
                ['  completedValues', 'string[]', '[]', '已完成的步驟 values'],
                ['  errorValues', 'string[]', '[]', '錯誤的步驟 values'],
                ['  size', "'sm' | 'md' | 'lg'", "'md'", 'indicator / 字體 tier'],
                ['  orientation', "'horizontal' | 'vertical'", "'vertical'", '步驟排列方向'],
                ['  onStepClick', '(value: string) => void', '—', '點擊 completed step 的 callback(linear 流程可回查)'],
                ['StepItem', '', '', ''],
                ['  value', 'string', '必填', '唯一識別碼'],
                ['  label', 'ReactNode', '必填', '步驟名稱'],
                ['  description', 'ReactNode', '—', '描述(vertical 模式常用)'],
                ['  icon', 'LucideIcon', '—', '替代 indicator 的 icon(default:數字 1,2,3)'],
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

export const OrientationMatrix: Story = {
  name: 'Orientation(horizontal / vertical)',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <H3>Horizontal</H3>
        <Desc>步驟水平排列,常見於結帳流程 / wizard 頂部。Indicator 之間有橫向 connector。</Desc>
        <div className="border border-border rounded-lg p-4 max-w-2xl">
          <Steps value="payment" completedValues={['cart']}>
            <StepItem value="cart" label="購物車" />
            <StepItem value="payment" label="付款" />
            <StepItem value="shipping" label="配送" />
            <StepItem value="done" label="完成" />
          </Steps>
        </div>
      </div>

      <div>
        <H3>Vertical(預設)</H3>
        <Desc>步驟垂直排列,支援 description(多行描述)。常見於 onboarding / 安裝引導 / 複雜流程。</Desc>
        <div className="border border-border rounded-lg p-4 max-w-md">
          <Steps orientation="vertical" value="config" completedValues={['install']}>
            <StepItem value="install" label="安裝套件" description="npm install @acme/cli" />
            <StepItem value="config" label="設定環境" description="修改 .env.local 加入 API key" />
            <StepItem value="deploy" label="部署上線" description="執行 acme deploy" />
          </Steps>
        </div>
      </div>
    </div>
  ),
}

export const SizeMatrix: Story = {
  name: 'Size 對照',
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <H3>三種 Size</H3>
        <Desc>Indicator 尺寸對齊 Avatar.block tier(sm 24、md 32、lg 40)。字體跟 MenuItem / TreeItem 同 tier。</Desc>
        <div className="flex flex-col gap-4">
          {(['sm', 'md', 'lg'] as const).map(size => (
            <div key={size} className="border border-dashed border-divider rounded-md p-4">
              <div className="text-caption text-fg-muted mb-2 font-mono">size="{size}"</div>
              <Steps size={size} value="b" completedValues={['a']}>
                <StepItem value="a" label="第一步" />
                <StepItem value="b" label="第二步" />
                <StepItem value="c" label="第三步" />
              </Steps>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}

export const IndentAlignment: Story = {
  name: 'Column Rhythm(indicator inline 對齊)',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <H3>Indicator 永遠 inline 對齊 label 第一行</H3>
        <Desc>**刻意打破 item-layout 的 24px 閾值規則**——不管 indicator 尺寸、不管有無 description,一律 inline 對齊。Column rhythm 優先於「大 prefix 視覺重量平衡文字塊」。這是 Steps 跟其他 row primitive 的本質差異——Steps 是「一條有連接關係的進度路徑」,column rhythm 是元件本身。</Desc>
        <div className="border border-border rounded-lg p-4 max-w-md">
          <Steps orientation="vertical" value="b" completedValues={['a']}>
            <StepItem value="a" label="簡短 label" />
            <StepItem
              value="b"
              label="帶有描述的 label"
              description="即使有多行 description,indicator 仍然對齊 label 第一行,保持 column rhythm"
            />
            <StepItem value="c" label="另一個 label" />
          </Steps>
        </div>
        <p className="text-footnote text-fg-muted mt-3">業界共識:Apple HIG、Material 3、Linear、GitHub Actions 的 steps 都是 indicator 對齊 label 第一行</p>
      </div>
    </div>
  ),
}
