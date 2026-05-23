import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Tokens/Opacity',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
透明度 token 系統。定義「禁用」「半透明遮罩」「hover overlay」等狀態的不透明度。

完整規則:\`packages/design-system/src/tokens/opacity/opacity.spec.md\`

**禁:**\`opacity-0\`/\`/N\` 數字 utility(走 token,不直接寫死)。
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj


function OpacityRow({ utility, value, usage }: { utility: string; value: string; usage: string }) {
  return (
    <div className="grid items-center gap-x-6 gap-y-1 border-b border-border py-4 last:border-0"
      style={{ gridTemplateColumns: '180px 100px 1fr 200px' }}>
      <div>
        <code className="block text-caption font-medium text-fg-secondary">{utility}</code>
      </div>
      <div className="text-caption font-mono text-fg-muted">{value}</div>
      <div className="text-body text-foreground">{usage}</div>
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded bg-primary"
          style={{ opacity: parseFloat(value) }}
          aria-label={`${utility} preview`}
        />
        <span className="text-caption text-fg-muted">preview</span>
      </div>
    </div>
  )
}


export const Overview: Story = {
  name: '總覽',
  render: () => (
    <div className="max-w-4xl">
      <h2 className="text-h3 mb-2">Opacity Tokens</h2>
      <p className="text-body text-fg-secondary mb-6">
        本系統定義 6 個 opacity token,覆蓋 disabled / hover overlay / backdrop / skeleton 等場景。
        Token 隨 dark mode 自動切換(dark theme 下 overlay 數值不同)。
      </p>

      <OpacityRow utility="opacity-disabled" value="0.4" usage="禁用元素整體(整 row 不可互動)" />
      <OpacityRow utility="opacity-hover-overlay" value="0.04" usage="row hover bg 疊加" />
      <OpacityRow utility="opacity-press-overlay" value="0.08" usage="row 按下(pressed)bg 疊加" />
      <OpacityRow utility="opacity-backdrop" value="0.5" usage="Dialog / Sheet backdrop 變暗" />
      <OpacityRow utility="opacity-skeleton" value="0.12" usage="Skeleton loading 灰塊基底" />
      <OpacityRow utility="opacity-divider-strong" value="0.16" usage="hover 期間強化的 divider" />

      <p className="text-caption text-fg-muted mt-6">
        實際 CSS 值見 <code>packages/design-system/src/tokens/opacity/opacity.css</code>;dark mode override 在同檔 <code>[data-theme=&quot;dark&quot;]</code> 段。
      </p>
    </div>
  ),
}
