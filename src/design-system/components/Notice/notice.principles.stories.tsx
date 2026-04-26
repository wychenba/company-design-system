// @principles-rationale: Merged WhenToUse + WhenNotToUse + Vs*Rule into a single
// `UsageGuidance` story (3 sections) per 2026-04-26 user mandate to consolidate
// decision-related stories. Canonical core ≥ 2 satisfied internally.
import type { Meta, StoryObj } from '@storybook/react'
import LinkTo from '@storybook/addon-links/react'

const meta: Meta = {
  title: 'Design System/Internal/Notice/設計原則',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h3 className="text-body-lg font-medium text-foreground mb-2">{title}</h3>
    <div className="prose prose-sm max-w-prose">{children}</div>
  </section>
)

export const UsageGuidance: Story = {
  name: '使用指引',
  render: () => (
    <div>
      <Section title="何時用">
        <p>適合 Notice 的真實業務場景(點擊跳轉「展示」頁範例):</p>
        <ul className="space-y-1">
          <li>
            <LinkTo kind="Design System/Internal/Notice/展示" name="部署成功 banner"><span className="text-primary hover:underline font-medium cursor-pointer">部署成功 banner</span></LinkTo>
          </li>
          <li>
            <LinkTo kind="Design System/Internal/Notice/展示" name="Workspace 付款失敗"><span className="text-primary hover:underline font-medium cursor-pointer">Workspace 付款失敗</span></LinkTo>
          </li>
          <li>
            <LinkTo kind="Design System/Internal/Notice/展示" name="Inline 通知變體對照"><span className="text-primary hover:underline font-medium cursor-pointer">Inline 通知變體對照</span></LinkTo>
          </li>
          <li>
            <LinkTo kind="Design System/Internal/Notice/展示" name="Toast 樣式"><span className="text-primary hover:underline font-medium cursor-pointer">Toast 樣式</span></LinkTo>
          </li>
          <li>
            <LinkTo kind="Design System/Internal/Notice/展示" name="Neutral 純文字"><span className="text-primary hover:underline font-medium cursor-pointer">Neutral 純文字</span></LinkTo>
          </li>
        </ul>
        <p className="text-fg-muted mt-3">判斷不確定時:對照 spec.md「何時用 / 何時不用」段;若仍不符,改用近親元件(見下方 vs 近親段落)。</p>
      </Section>

      <Section title="何時不用 + 替代">
        <p>Notice 是 internal primitive,無 dismiss / no auto-dismiss 行為——需要這些行為改用以下 consumer:</p>
        <ul>
          <li><strong>需要 dismiss(永久 inline)</strong> → 用 <code>Alert</code></li>
          <li><strong>需要 auto-dismiss(短暫 toast)</strong> → 用 <code>Toast</code></li>
          <li><strong>表單欄位錯誤訊息</strong> → 用 <code>Field</code> 內建 errorText,不用 Notice</li>
        </ul>
      </Section>

      <Section title="vs 近親 — Notice / Alert / Toast">
        <p>三者關係:Notice 是 primitive,Alert / Toast 是 consumer:</p>
        <ul>
          <li><strong>Notice(本元件)</strong> — internal primitive,提供 announcement row 結構 + variant token</li>
          <li><strong>Alert</strong> — 永久 inline announcement(stays until dismissed)</li>
          <li><strong>Toast</strong> — 短暫 announcement(auto-dismiss)</li>
        </ul>
        <p className="text-fg-muted">建新 announcement 類元件 → 消費 Notice 不要 hand-craft row(對齊 SSOT 消費 canonical)。</p>
      </Section>
    </div>
  ),
}
