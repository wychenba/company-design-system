import type { Meta, StoryObj } from '@storybook/react'
import LinkTo from '@storybook/addon-links/react'

const meta: Meta = {
  title: 'Design System/Internal/MenuItem/設計原則',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

// ── WhenToUse — 何時使用 Menu ──────────────────────


// ── UsageGuidance — 整合何時用 / 何時不用 / vs 近親(Polaris/Material/Ant 共識)
// 合併自舊 WhenToUse / VsItemAnatomyRule(2026-04-26 v3 canonical)

export const UsageGuidance: Story = {
  name: '使用指引',
  render: () => (
    <div className="flex flex-col gap-12">
      {/* 何時用 — 原 WhenToUse */}
      <div className="prose prose-sm max-w-prose">
      <p>適合 Menu 的真實業務場景(點擊跳轉「展示」頁範例):</p>
      <ul className="space-y-1">
        <li>
          <LinkTo kind="Design System/Internal/Menu/展示" name="Start Icon"><span className="text-primary hover:underline font-medium cursor-pointer">Start Icon</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/Menu/展示" name="Start Icon + Description"><span className="text-primary hover:underline font-medium cursor-pointer">Start Icon + Description</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/Menu/展示" name="Avatar"><span className="text-primary hover:underline font-medium cursor-pointer">Avatar</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/Menu/展示" name="Avatar + description"><span className="text-primary hover:underline font-medium cursor-pointer">Avatar + description</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/Menu/展示" name="多選"><span className="text-primary hover:underline font-medium cursor-pointer">多選</span></LinkTo>
        </li>
      </ul>
      <p className="text-fg-muted mt-3">判斷不確定時:對照 spec.md「何時用 / 何時不用」段;若仍不符,改用近親元件(見 <code>Vs*Rule</code> stories)。</p>
    </div>

      {/* vs 近親 — VsItemAnatomyRule — 原 VsItemAnatomyRule */}
      <div className="prose prose-sm max-w-prose">
      <p>MenuItem 是 Family 1(menu)的具體實作;item-anatomy 是 Family 1+2 的 cross-element SSOT。</p>
      <ul>
        <li><strong>MenuItem(本元件)</strong>—runtime 元件,實裝 Family 1 row</li>
        <li><strong>item-anatomy.spec.md</strong>—canonical doc,跨 MenuItem / Row / FileItem 共通的 anatomy 規則</li>
      </ul>
      <p className="text-fg-muted">judgment 改:動 item-anatomy.spec(SSOT);實作改:動 menu-item.tsx。</p>
    </div>
    </div>
  ),
}
