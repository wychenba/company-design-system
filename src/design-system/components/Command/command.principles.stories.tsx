import type { Meta, StoryObj } from '@storybook/react'
import LinkTo from '@storybook/addon-links/react'

const meta: Meta = {
  title: 'Design System/Internal/Command/設計原則',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

// ── WhenToUse — 何時使用 Command ──────────────────────


// ── UsageGuidance — 整合何時用 / 何時不用 / vs 近親(Polaris/Material/Ant 共識)
// 合併自舊 WhenToUse / VsSelectMenuRule(2026-04-26 v3 canonical)

export const UsageGuidance: Story = {
  name: '使用指引',
  render: () => (
    <div className="flex flex-col gap-12">
      {/* 何時用 — 原 WhenToUse */}
      <div className="prose prose-sm max-w-prose">
      <p>適合 Command 的真實業務場景(點擊跳轉「展示」頁範例):</p>
      <ul className="space-y-1">
        <li>
          <LinkTo kind="Design System/Internal/Command/展示" name="全域指令面板"><span className="text-primary hover:underline font-medium cursor-pointer">全域指令面板</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/Command/展示" name="Inline 搜尋清單"><span className="text-primary hover:underline font-medium cursor-pointer">Inline 搜尋清單</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/Command/展示" name="外觀切換器"><span className="text-primary hover:underline font-medium cursor-pointer">外觀切換器</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Internal/Command/展示" name="無結果狀態"><span className="text-primary hover:underline font-medium cursor-pointer">無結果狀態</span></LinkTo>
        </li>
      </ul>
      <p className="text-fg-muted mt-3">判斷不確定時:對照 spec.md「何時用 / 何時不用」段;若仍不符,改用近親元件(見 <code>Vs*Rule</code> stories)。</p>
    </div>

      {/* vs 近親 — VsSelectMenuRule — 原 VsSelectMenuRule */}
      <div className="prose prose-sm max-w-prose">
      <p>兩者皆 keyboard navigation 但 mental model 不同:</p>
      <ul>
        <li><strong>Command</strong> — keyboard-first 命令面板;搜尋為主、可執行 action(non-form)</li>
        <li><strong>SelectMenu</strong> — form-input 的選擇器;value 寫回 form,讀取 selected value</li>
      </ul>
      <p className="text-fg-muted">判斷:結果是「執行某 action」→ Command;結果是「設定欄位 value」→ SelectMenu。</p>
    </div>
    </div>
  ),
}
