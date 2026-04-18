import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { PeoplePicker } from './people-picker'

const meta: Meta = {
  title: 'Design System/Components/PeoplePicker/設計規格',
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

const SAMPLE_PEOPLE = [
  { name: '陳麒仁', avatarUrl: 'https://i.pravatar.cc/80?img=1' },
  { name: 'Alice Wang', avatarUrl: 'https://i.pravatar.cc/80?img=5' },
  { name: 'Bob Chen', avatarUrl: 'https://i.pravatar.cc/80?img=12' },
  { name: 'Diana Lin', avatarUrl: 'https://i.pravatar.cc/80?img=20' },
]

export const Overview: Story = {
  name: '元件總覽',
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <H3>Anatomy</H3>
        <Desc>PeoplePicker 是組合元件——Popover(浮層)+ Command(cmdk 搜尋)+ SelectMenu(選單)+ PersonDisplay(Avatar + Name)。外觀對齊 Select / Combobox,差異在選項前綴有 Avatar 視覺。</Desc>
        <div className="max-w-md border border-border rounded-lg p-4">
          <PeoplePicker
            people={SAMPLE_PEOPLE}
            value={SAMPLE_PEOPLE[0]}
            onChange={() => {}}
          />
        </div>
      </div>

      <div>
        <H3>單選 vs 多選</H3>
        <Desc>透過 `value` prop 的類型決定:`PersonValue | null`(單選)或 `PersonValue[]`(多選)。多選 field 顯示 Avatar 陣列(同 Combobox)。</Desc>
        <div className="flex flex-col gap-3 max-w-md">
          <div>
            <div className="text-caption text-fg-muted mb-2">單選(assignee 場景)</div>
            <PeoplePicker
              people={SAMPLE_PEOPLE}
              value={SAMPLE_PEOPLE[0]}
              onChange={() => {}}
            />
          </div>
          <div>
            <div className="text-caption text-fg-muted mb-2">多選(reviewers 場景)</div>
            <PeoplePicker
              people={SAMPLE_PEOPLE}
              value={[SAMPLE_PEOPLE[0], SAMPLE_PEOPLE[1]]}
              onChange={() => {}}
            />
          </div>
        </div>
      </div>

      <div>
        <H3>Props 速查</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Prop</Th><Th>Type</Th><Th>Default</Th><Th>說明</Th></tr></thead>
            <tbody>
              {[
                ['mode', "'edit' | 'readonly' | 'disabled'", "'edit'", 'Field mode'],
                ['size', "'sm' | 'md' | 'lg'", "'md'", '對齊 field-height tier'],
                ['value', 'PersonValue | PersonValue[] | null', '—', '單選 / 多選(類型決定模式)'],
                ['onChange', '(value: PersonValue[]) => void', '—', '值變更 callback'],
                ['people', 'PersonValue[]', '[]', '可選人員清單(dropdown 顯示)'],
                ['searchPlaceholder', 'string', "'搜尋人員…'", '搜尋框 placeholder'],
                ['emptyText', 'string', "'沒有符合的人員'", '空結果提示'],
                ['disabled', 'boolean', 'false', '停用'],
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

export const ModeMatrix: Story = {
  name: 'Mode 對照',
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <div>
        <H3>edit(預設)</H3>
        <Desc>Field 樣式 + 展開觸發 Popover + Command 搜尋。</Desc>
        <PeoplePicker people={SAMPLE_PEOPLE} value={SAMPLE_PEOPLE[0]} onChange={() => {}} />
      </div>
      <div>
        <H3>readonly</H3>
        <Desc>顯示選中人員(Avatar + Name),無 dropdown trigger、無搜尋。</Desc>
        <PeoplePicker mode="readonly" people={SAMPLE_PEOPLE} value={SAMPLE_PEOPLE[0]} />
      </div>
      <div>
        <H3>disabled</H3>
        <PeoplePicker mode="disabled" people={SAMPLE_PEOPLE} value={SAMPLE_PEOPLE[0]} />
      </div>
      <div>
        <H3>readonly(empty)</H3>
        <PeoplePicker mode="readonly" people={SAMPLE_PEOPLE} value={null} />
      </div>
    </div>
  ),
}

export const PersonValueType: Story = {
  name: 'PersonValue 型別',
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <H3>兩種 PersonValue 格式</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>格式</Th><Th>Type</Th><Th>用途</Th></tr></thead>
            <tbody>
              <tr><Td>簡單字串</Td><Td mono>string</Td><Td>只有名字(fallback 顯示 initials)</Td></tr>
              <tr><Td>完整物件</Td><Td mono>{'{ name: string; avatarUrl?: string; description?: string }'}</Td><Td>含 avatar URL 和 description(role / email)</Td></tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 max-w-md mt-4">
          <div>
            <div className="text-caption text-fg-muted mb-1">字串 value(顯示 initials)</div>
            <PeoplePicker
              people={['陳麒仁', 'Alice Wang', 'Bob Chen']}
              value="陳麒仁"
              onChange={() => {}}
            />
          </div>
          <div>
            <div className="text-caption text-fg-muted mb-1">物件 value(顯示 avatar)</div>
            <PeoplePicker
              people={SAMPLE_PEOPLE}
              value={SAMPLE_PEOPLE[0]}
              onChange={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  ),
}
