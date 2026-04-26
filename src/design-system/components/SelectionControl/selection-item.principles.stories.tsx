import type { Meta, StoryObj } from '@storybook/react'
import LinkTo from '@storybook/addon-links/react'

const meta: Meta = {
  title: 'Design System/Components/SelectionControl/設計原則',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

// ── WhenToUse — 何時使用 SelectionControl ──────────────────────


// ── UsageGuidance — 整合何時用 / 何時不用 / vs 近親(Polaris/Material/Ant 共識)
// 合併自舊 WhenToUse / VsCheckboxRule(2026-04-26 v3 canonical)

export const UsageGuidance: Story = {
  name: '使用指引',
  render: () => (
    <div className="flex flex-col gap-12">
      {/* 何時用 — 原 WhenToUse */}
      <div className="prose prose-sm max-w-prose">
      <p>適合 SelectionControl 的真實業務場景(點擊跳轉「展示」頁範例):</p>
      <ul className="space-y-1">
        <li>
          <LinkTo kind="Design System/Components/SelectionControl/展示" name="通知偏好"><span className="text-primary hover:underline font-medium cursor-pointer">通知偏好</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Components/SelectionControl/展示" name="方案選擇"><span className="text-primary hover:underline font-medium cursor-pointer">方案選擇</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Components/SelectionControl/展示" name="Prefix icon"><span className="text-primary hover:underline font-medium cursor-pointer">Prefix icon</span></LinkTo>
        </li>
        <li>
          <LinkTo kind="Design System/Components/SelectionControl/展示" name="Prefix avatar"><span className="text-primary hover:underline font-medium cursor-pointer">Prefix avatar</span></LinkTo>
        </li>
      </ul>
      <p className="text-fg-muted mt-3">判斷不確定時:對照 spec.md「何時用 / 何時不用」段;若仍不符,改用近親元件(見 <code>Vs*Rule</code> stories)。</p>
    </div>

      {/* vs 近親 — VsCheckboxRule — 原 VsCheckboxRule */}
      <div className="prose prose-sm max-w-prose">
      <p>兩者表達 selectable state,但結構與場景不同:</p>
      <ul>
        <li><strong>SelectionControl(本元件)</strong>—大塊 row(含 icon / avatar / multi-line description),適合 settings / list-as-page;Notion/Slack idiom</li>
        <li><strong>Checkbox + Field</strong>—緊湊 form 欄位;適合 form group 多選</li>
      </ul>
      <p className="text-fg-muted">判斷:row 是 page content(讀取/設定)→ SelectionControl;row 是 form input(submit value)→ Checkbox + Field。</p>
    </div>
    </div>
  ),
}
