import type { Meta, StoryObj } from '@storybook/react'
import { SearchX, WifiOff, Lock, Inbox } from 'lucide-react'
import { Empty } from './empty'
import { Button } from '@/design-system/components/Button/button'

const meta: Meta<typeof Empty> = {
  title: 'Design System/Components/Empty/展示',
  component: Empty,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '空狀態視覺元件——icon + title + description + action 的居中垂直堆疊。預設只需 description,其他皆可選。',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Empty>

/* ── 搜尋無結果(Jira / Linear 慣例)─────────────────────────────────── */
export const SearchNoResults: Story = {
  name: '搜尋無結果',
  render: () => (
    <div className="border border-border rounded-lg p-8 max-w-md">
      <Empty
        icon={SearchX}
        title="找不到相符的任務"
        description="試試其他關鍵字,或調整篩選條件"
        action={<Button variant="tertiary">清除所有篩選</Button>}
      />
    </div>
  ),
}

/* ── 空清單 — Jira 無 task ────────────────────────────────────────── */
export const NoTasks: Story = {
  name: '空清單',
  render: () => (
    <div className="border border-border rounded-lg p-8 max-w-md">
      <Empty
        icon={Inbox}
        title="這個 Sprint 還沒有任務"
        description="從 backlog 拖拉任務進來,或直接建立新任務"
        action={<Button variant="primary">建立任務</Button>}
      />
    </div>
  ),
}

/* ── 錯誤無法載入(action-oriented)────────────────────────────────── */
export const LoadFailure: Story = {
  name: '錯誤無法載入',
  render: () => (
    <div className="border border-border rounded-lg p-8 max-w-md">
      <Empty
        icon={WifiOff}
        title="連線中斷,無法載入資料"
        description="請檢查網路連線後重試"
        action={<Button variant="secondary">重新載入</Button>}
      />
    </div>
  ),
}

/* ── 權限不足 ─────────────────────────────────────────────────────── */
export const NoPermission: Story = {
  name: '權限不足',
  render: () => (
    <div className="border border-border rounded-lg p-8 max-w-md">
      <Empty
        icon={Lock}
        title="你沒有檢視這個專案的權限"
        description="請聯絡專案擁有者要求存取,或返回你有權限的工作區"
        action={<Button variant="tertiary">聯絡擁有者</Button>}
      />
    </div>
  ),
}
