import type { Meta, StoryObj } from '@storybook/react'
import LinkTo from '@storybook/addon-links/react'

const meta: Meta = {
  title: 'Design System/Internal/SelectMenu/設計原則',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

// ── WhenToUse — 何時使用 SelectMenu ──────────────────────


// ── UsageGuidance — 整合何時用 / 何時不用 / vs 近親(Polaris/Material/Ant 共識)
// 合併自舊 WhenToUse / VsCommandRule(2026-04-26 v3 canonical)

export const UsageGuidance: Story = {
  name: '使用指引',
  render: () => (
    <div className="flex flex-col gap-12">
      {/* 何時用 — 原 WhenToUse */}
      <div className="prose prose-sm max-w-prose">
      <p>適合 SelectMenu 的真實業務場景(點擊跳轉「展示」頁範例):</p>
      <ul className="space-y-1">
        <li>
          <LinkTo kind="Design System/Internal/SelectMenu/展示" name="單選"><span className="text-primary hover:underline font-medium cursor-pointer">單選</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/SelectMenu/展示" name="搜尋"><span className="text-primary hover:underline font-medium cursor-pointer">搜尋</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/SelectMenu/展示" name="多選"><span className="text-primary hover:underline font-medium cursor-pointer">多選</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/SelectMenu/展示" name="多選 + 搜尋"><span className="text-primary hover:underline font-medium cursor-pointer">多選 + 搜尋</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/SelectMenu/展示" name="可清除"><span className="text-primary hover:underline font-medium cursor-pointer">可清除</span></LinkTo>
        </li>
      </ul>
      <p className="text-fg-muted mt-3">判斷不確定時:對照 spec.md「何時用 / 何時不用」段;若仍不符,改用近親元件(見 <code>Vs*Rule</code> stories)。</p>
    </div>

      {/* vs 近親 — VsCommandRule — 原 VsCommandRule */}
      <div className="prose prose-sm max-w-prose">
      <p>兩者都 keyboard-navigable + 搜尋,但 mental model 不同:</p>
      <ul>
        <li><strong>SelectMenu(本元件)</strong>—form-input dropdown;結果寫回 form value(read selected)</li>
        <li><strong>Command</strong>—命令面板;結果是執行某 action(non-form)</li>
      </ul>
      <p className="text-fg-muted">判斷:結果回 form value → SelectMenu;結果觸發 action → Command。</p>
    </div>
    </div>
  ),
}
