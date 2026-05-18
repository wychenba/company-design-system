// @anatomy-exempt: anatomy specs / token 對照表格用 raw <table>,非業務資料表。業務資料表才用 <DataTable>。
// @anatomy-rationale:
//   SizeMatrix N/A — MVP 只支援 view="month" + 固定 size="md",無多 size tier
//     (lg 為後續增量,見 calendar.spec.md「MVP vs 後續增量」)。
//   StateBehavior 已存在(today / outside month / hover / event tile 等狀態
//     已由 StateBehavior 5. 涵蓋)。
import type { Meta, StoryObj } from '@storybook/react'
import { Calendar, type CalendarEvent } from './calendar'
import { H3, Desc, Td, Th } from '@/design-system/stories-helpers/anatomy/anatomy-utils'

const meta: Meta<typeof Calendar> = {
  title: 'Design System/Components/Calendar/設計規格',
  component: Calendar,
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof Calendar>

const now = new Date()
const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')

const sampleEvents: CalendarEvent[] = [
  { id: 'e1', title: 'Design review', start: `${thisMonth}-05`, end: `${thisMonth}-05`, color: 'blue' },
  { id: 'e2', title: 'Sprint planning', start: `${thisMonth}-08`, end: `${thisMonth}-08`, color: 'blue' },
  { id: 'e3', title: 'Release deadline', start: `${thisMonth}-12`, end: `${thisMonth}-12`, color: 'red' },
  { id: 'e4', title: 'Q review', start: `${thisMonth}-18`, end: `${thisMonth}-18`, color: 'green' },
  { id: 'e5', title: 'Alex vacation', start: `${thisMonth}-20`, end: `${thisMonth}-22`, color: 'yellow', allDay: true },
]

// ── 1. 元件總覽 ────────────────────────────────────────────────────────────────
export const Overview: Story = {
  name: '元件總覽',
  render: () => (
    <div className="h-screen p-4 bg-canvas">
      <Calendar events={sampleEvents} />
    </div>
  ),
}

// ── 2. 元件檢閱器 ────────────────────────────────────────────────────────────
export const Inspector: Story = {
  name: '元件檢閱器',
  parameters: {
    docs: { description: { story: '右側 Controls 切 props 即時 render,取代 Figma inspect。view 目前只支援 `month`(week / day 為 tech debt,已 disable)。' } },
    layout: 'fullscreen',
  },
  args: {
    view: 'month',
    weekStartsOn: 0,
    locale: 'en-US',
    events: sampleEvents,
  },
  argTypes: {
    view: { control: 'radio', options: ['month', 'week', 'day'] },
    weekStartsOn: { control: 'radio', options: [0, 1] },
    locale: { control: 'select', options: ['en-US', 'zh-TW', 'ja-JP'] },
    size: { control: 'radio', options: ['md', 'lg'] },
    events: { control: 'object' },
  },
  render: (args) => (
    <div className="h-screen p-4 bg-canvas">
      <Calendar {...args} />
    </div>
  ),
}

// ── 3. 色彩對照表(事件 color 類別 + Cell / Event tile token)─────────────────────
// 跳過 4. SizeMatrix(rationale 見 calendar.spec.md「MVP vs 後續增量」,MVP 只 md;lg 為 tech debt)
export const ColorMatrix: Story = {
  name: '色彩對照表',
  render: () => {
    const colorEvents: CalendarEvent[] = (
      ['blue', 'green', 'orange', 'purple', 'red', 'yellow'] as const
    ).map((c, i) => ({
      id: `c-${c}`,
      title: `${c} category`,
      start: `${thisMonth}-${String(i + 3).padStart(2, '0')}`,
      end: `${thisMonth}-${String(i + 3).padStart(2, '0')}`,
      color: c,
    }))
    return (
      <div className="p-4 bg-canvas flex flex-col gap-10">
        <div>
          <H3>事件類別色(6 色)</H3>
          <Desc>
            6 個 event color 對齊 Tag primitive colors(blue / green / orange / purple / red / yellow)。
            color 是**類別語意**(同 team / 同 project),非 severity。
          </Desc>
          <div className="h-[560px]">
            <Calendar events={colorEvents} />
          </div>
        </div>

        <div>
          <H3>Cell 視覺 token</H3>
          <Desc>月 view cell 的狀態色彩。Cell 高度固定容納日期 header + 3 event tile;7 欄等分。</Desc>
          <div className="overflow-x-auto">
            <table className="text-caption border-collapse">
              <thead>
                <tr>
                  <Th>區塊</Th>
                  <Th>Token / Class</Th>
                  <Th>說明</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>Cell 高度</Td>
                  <Td mono>min-h-28(112px)</Td>
                  <Td>容納 header + 3 event tile,MVP 月 view 固定</Td>
                </tr>
                <tr>
                  <Td>Cell 寬度</Td>
                  <Td mono>1fr × 7</Td>
                  <Td>週 7 欄等分</Td>
                </tr>
                <tr>
                  <Td>日期 header</Td>
                  <Td mono>h-7 · text-body · font-medium</Td>
                  <Td>右上角數字,對齊 Google Calendar</Td>
                </tr>
                <tr>
                  <Td>Today cell(日期數字)</Td>
                  <Td mono>bg-primary · text-on-emphasis · rounded-full · px-2 py-0.5</Td>
                  <Td>primary-filled pill(對齊 Google Calendar today pill)</Td>
                </tr>
                <tr>
                  <Td>Outside day cell</Td>
                  <Td mono>text-fg-disabled · bg-muted</Td>
                  <Td>上/下月溢出日期弱化 + 背景略暗</Td>
                </tr>
                <tr>
                  <Td>Hover cell</Td>
                  <Td mono>hover:bg-neutral-hover</Td>
                  <Td>提示可點擊新增入口</Td>
                </tr>
                <tr>
                  <Td>Weekend cell(可選)</Td>
                  <Td mono>bg-muted</Td>
                  <Td>對齊 Google Calendar,可由 prop 控制,MVP 預設關閉</Td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <H3>Event tile 視覺 token</H3>
          <Desc>事件 tile 的色彩由 event `color` 欄位決定,bg / text 走 subtle / text tier。</Desc>
          <div className="overflow-x-auto">
            <table className="text-caption border-collapse">
              <thead>
                <tr>
                  <Th>情境</Th>
                  <Th>Token / Class</Th>
                  <Th>說明</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>一般 event(timed)</Td>
                  <Td mono>bg-{`{color}`}-subtle · text-{`{color}`}-text · rounded-md · px-1.5 py-0.5 · text-caption · truncate</Td>
                  <Td>單行 tile,color 依事件類別</Td>
                </tr>
                <tr>
                  <Td>All-day event</Td>
                  <Td mono>同上 + grid-column span(橫跨多 cell)</Td>
                  <Td>實作用 absolute 或 grid span</Td>
                </tr>
                <tr>
                  <Td>Hover tile</Td>
                  <Td mono>hover:bg-{`{color}`}-hover</Td>
                  <Td>微暗化表示可點擊</Td>
                </tr>
                <tr>
                  <Td>超出 tile 限制</Td>
                  <Td mono>「+N more」link(對齊 Google Calendar)</Td>
                  <Td>click 展開 popover 列表</Td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  },
}

// ── 5. 狀態行為 ─────────────────────────────────────────────────────────────
export const StateBehavior: Story = {
  name: '狀態行為',
  render: () => (
    <div className="h-screen p-4 bg-canvas">
      <div className="mb-2 text-body text-fg-muted space-y-1">
        <div>• <b>today</b> cell:date 數字加 `bg-primary text-on-emphasis rounded-full` 圓</div>
        <div>• <b>outside month</b>:前後月日期走 `text-fg-muted`</div>
        <div>• <b>多事件 cell</b>:超出顯示的 event 顯示「+N more」(hover 展開)</div>
        <div>• <b>event hover</b>:tile 輕微 `hover:brightness-95` + `cursor-pointer`</div>
        <div>• <b>empty cell</b>:無事件保持純底色,點擊觸發 onDateClick</div>
      </div>
      <Calendar events={sampleEvents} />
    </div>
  ),
}

// ── Accessibility ─────────────────────────────────────────────────────────
// 2026-05-17 ship per audit Dim 13(story-rules.md 6-canonical 含 Accessibility)
export const Accessibility = {
  name: '無障礙',
  render: () => (
    <div className="max-w-3xl text-body text-fg-secondary">
      <h3 className="text-h5 text-foreground mb-2">無障礙設計</h3>
      <p className="whitespace-pre-line">{"詳 `calendar.spec.md` 「A11y 預設」段。摘要:\n\n  ARIA / Pattern  :對齊 [W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/) 對應 pattern。\n\n  Keyboard 行為  :\n\n- Tab — focus calendar\n- ↑/↓/←/→ — 切 day\n- PageUp/Down — 切月\n- Shift+PageUp/Down — 切年\n- Enter — 選 date\n- Esc — 取消 / 關閉\n\n  Focus  :focus-visible ring 對齊 DS 設計準則( outline: 2px solid var(--ring) );focus management 由元件 own。\n\n  驗證  :Storybook a11y addon panel 應 0 critical violation;鍵盤完整可操作(無需滑鼠)。WCAG AA contrast ≥ 4.5:1(text)/ 3:1(UI)。"}</p>
    </div>
  ),
}
