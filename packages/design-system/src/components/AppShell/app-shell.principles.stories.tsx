// @benchmark-cited: Polaris / Material / Ant 共識 principles canonical(UsageGuidance integrated)
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Components/AppShell/設計原則',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

export const UsageGuidance: Story = {
  name: '使用準則',
  render: () => (
    <div className="prose max-w-2xl space-y-6 px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]">
      <section>
        <h2 className="text-h4 mb-2">何時用 AppShell</h2>
        <ul className="text-body space-y-1">
          <li>• 多頁 web service 主結構(Linear / Notion / Slack / GitHub / Asana 類)</li>
          <li>• 需要 sidebar + main 持續共存,跨頁切換時 sidebar 不重渲染</li>
          <li>• 需要 right panel(info / inspector / detail pane)跟 main 並存</li>
        </ul>
      </section>

      <section>
        <h2 className="text-h4 mb-2">何時不用</h2>
        <ul className="text-body space-y-1">
          <li>• 單頁 landing / marketing site → `&lt;main&gt;` 直接展開</li>
          <li>• Auth 頁(login / signup)→ 自寫 centered layout,不被 sidebar 佔位</li>
          <li>• Embedded widget / iframe → 已被 host shell 包住</li>
          <li>• 文件 reader(全螢幕閱讀)→ shell chrome 干擾閱讀</li>
        </ul>
      </section>

      <section>
        <h2 className="text-h4 mb-2">Layout mode 怎麼選</h2>
        <p className="text-body mb-2">
          唯一 distinguisher = <strong>Header scope 是 local 還是 global</strong>,
          <em>不是</em> workspace 多寡(Notion / Gmail 都支援 multi-workspace,卻分屬不同派)。
          問自己:頂部那條 bar 服務的是「當前這一頁」還是「整個 app」?
        </p>
        <ul className="text-body space-y-1">
          <li>
            <strong>primary-sidebar</strong>:頂部是 <strong>local toolbar</strong> —
            服務當前頁(breadcrumb / page-level actions / filter)。Sidebar 頂天立地,WorkspaceBrand 在 sidebar 頂。
            參考 Linear / Notion / Figma。
          </li>
          <li>
            <strong>primary-header</strong>:多一條 <strong>global bar</strong> 橫跨頂部 —
            服務整個 app(account / workspace switcher / 跨頁 search / notifications);local toolbar
            <em>仍在</em> main col 頂,只是上面多了 global header。WorkspaceBrand 改放 globalHeader 左側。
            參考 GitHub / Slack / Gmail。
          </li>
        </ul>
        <p className="text-caption text-fg-muted mt-2">
          兩 mode 是 product 角色表態 — 啟動時固定,不該在 runtime 切換。
          視覺對照圖見「設計規格 → 兩種布局模式對照圖」。
        </p>
      </section>

      <section>
        <h2 className="text-h4 mb-2">vs Sidebar 規則</h2>
        <p className="text-body">
          AppShell own composition + layout mode + Aside responsive 切換。Sidebar 視覺 + 行為 + mobile sheet
          SSOT 在 <code>sidebar.spec.md</code>,**AppShell 不 customize Sidebar**。多 sidebar 等未來 Sidebar
          SSOT 擴充才支援。
        </p>
      </section>

      <section>
        <h2 className="text-h4 mb-2">Consumer 紀律</h2>
        <ul className="text-body space-y-1">
          <li>❌ 禁:`&lt;AppShell&gt;` 內塞另一個 `&lt;AppShell&gt;`(整頁框架單例)</li>
          <li>❌ 禁:`sidebar={'{'}&lt;div&gt;...&lt;/div&gt;{'}'}` → 必傳真 `&lt;Sidebar&gt;` primitive</li>
          <li>❌ 禁:`header={'{'}&lt;header&gt;raw&lt;/header&gt;{'}'}` → 必傳 `&lt;ChromeHeader&gt;` 或 header-canonical 派生</li>
          <li>❌ 禁:`&lt;AppShell.Main&gt;` 強制 padding(違 layoutSpace 規則 1B)</li>
          <li>✅ 必:Main 內容遵循既有 `layoutSpace.spec.md` 6 條規則(Page header / Card / DataTable / naked list 各按規則)</li>
        </ul>
      </section>
    </div>
  ),
}
