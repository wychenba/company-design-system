import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ExternalLink } from 'lucide-react'
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card'
import { Avatar } from '@/design-system/components/Avatar/avatar'
import { Button } from '@/design-system/components/Button/button'

const meta: Meta = {
  title: 'Design System/Internal/HoverCard/設計原則',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

const Rule = ({
  title, note, children,
}: {
  title: string; note?: string; children: React.ReactNode
}) => (
  <div className="mb-14">
    <h3 className="text-body font-bold text-foreground mb-1">{title}</h3>
    {note && <p className="text-caption text-fg-muted mb-5 max-w-[720px] leading-relaxed">{note}</p>}
    <div className="flex flex-col gap-3 max-w-md">{children}</div>
  </div>
)

const Label = ({ children, warn }: { children: React.ReactNode; warn?: boolean }) => (
  <p className={`text-footnote leading-normal ${warn ? 'text-error font-medium' : 'text-fg-muted'}`}>{children}</p>
)

export const VsTooltipRule: Story = {
  name: '與 Tooltip 的分界（SSOT）',
  render: () => (
    <div>
      <Rule
        title="HoverCard — 內容可互動、滑鼠移到浮層上不消失"
        note="適合放按鈕、連結、需要選取的文字。使用者 hover trigger → 浮層出現 → 滑鼠移到浮層上繼續停留並點擊按鈕 / 連結都沒問題"
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className="underline cursor-pointer">@陳麒仁</span>
          </HoverCardTrigger>
          <HoverCardContent className="bg-surface-raised border border-border rounded-lg p-4 shadow-[var(--elevation-200)]">
            <div className="flex flex-col gap-2 w-64">
              <div className="flex items-center gap-3">
                <Avatar name="陳麒仁" size={40} />
                <div>
                  <div className="text-body font-medium">陳麒仁</div>
                  <div className="text-caption text-fg-muted">Design Engineer</div>
                </div>
              </div>
              <Button variant="tertiary" size="sm">傳訊息</Button>
            </div>
          </HoverCardContent>
        </HoverCard>
        <Label>↑ hover @mention 彈出 NameCard，滑鼠可移到浮層點「傳訊息」</Label>
      </Rule>

      <Rule
        title="Tooltip — 純文字、不可互動、離開 trigger 即消失"
        note="適合一句話的提示（icon-only 的 aria-label、字串截斷補全）。無法互動，滑鼠離開 trigger 立刻消失。完整對照見 spec 的「與 Tooltip 的分界」"
      >
        <Label>完整情境對照與三角度分析見 hover-card.spec.md「與 Tooltip 的分界」（SSOT）</Label>
      </Rule>

      <Rule
        title="判斷法：「使用者會想移到浮層上做事嗎？」"
        note="需要 → HoverCard；純看一句話 → Tooltip"
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Avatar name="陳麒仁" size={32} />
              </HoverCardTrigger>
              <HoverCardContent className="bg-surface-raised border border-border rounded-lg p-3">
                <div className="flex flex-col gap-2 w-56">
                  <div className="text-body font-medium">陳麒仁</div>
                  <Button variant="tertiary" size="sm">查看 profile</Button>
                </div>
              </HoverCardContent>
            </HoverCard>
            <Label>HoverCard（可點按鈕）</Label>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <span title="此設定影響全域" className="text-footnote text-fg-muted underline decoration-dotted">全域設定 (hover)</span>
            <Label>Tooltip（純文字提示）</Label>
          </div>
        </div>
      </Rule>
    </div>
  ),
}

export const PureBehaviorPrimitiveRule: Story = {
  name: '純行為 primitive——視覺由 consumer 決定',
  render: () => (
    <div>
      <Rule
        title="HoverCard 不含視覺樣式——bg / border / shadow / padding 由 consumer 決定"
        note="HoverCard 本身只提供 z-index、動畫、sideOffset。視覺由消費者（NameCard / OverflowIndicator / custom）各自決定，符合不同場景的視覺語言"
      >
        <div className="flex gap-6">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="tertiary" size="sm">亮色 Card 樣式</Button>
            </HoverCardTrigger>
            <HoverCardContent className="bg-surface-raised border border-border rounded-lg p-4 shadow-[var(--elevation-200)]">
              <div className="w-48 text-body">NameCard 風格：亮底 + 邊框 + elevation</div>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="tertiary" size="sm">深色 Tooltip 樣式</Button>
            </HoverCardTrigger>
            <HoverCardContent className="bg-tooltip text-inverse-fg rounded-md px-3 py-2" data-theme="dark">
              <div className="w-48 text-caption">OverflowIndicator 風格：深底 + compact</div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <Label>↑ 同一個 HoverCard primitive 兩種視覺——consumer 根據場景選樣式</Label>
      </Rule>

      <Rule
        title="Avatar 自動整合（建議 pattern）"
        note="人員類 Avatar 透過 `hoverCard` prop 自動 wrap HoverCardTrigger，不需要 consumer 手動組合。統一人員 hover 提供 NameCard 的體驗"
      >
        <div className="flex items-center gap-3">
          <Avatar name="陳麒仁" size={40} hoverCard={
            <div className="flex flex-col gap-2 w-56">
              <div className="text-body font-medium">陳麒仁</div>
              <div className="text-caption text-fg-muted">Design Engineer · 台北</div>
              <Button variant="tertiary" size="sm">傳訊息</Button>
            </div>
          } />
          <span className="text-body">陳麒仁</span>
        </div>
        <Label>↑ Avatar hoverCard prop 自動整合,無需手動 HoverCardTrigger</Label>
      </Rule>
    </div>
  ),
}

export const NotForCriticalInfoRule: Story = {
  name: '不可承載必要資訊',
  render: () => (
    <div>
      <Rule
        title="❌ 關鍵資訊不放 HoverCard（觸控裝置無法 hover）"
        note="手機 / 平板沒有 hover 事件，HoverCard 根本不會觸發。關鍵資訊（錯誤警告、必要操作說明、付款條款）如果只靠 HoverCard，觸控使用者會完全錯過"
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="primary" danger>刪除帳號</Button>
          </HoverCardTrigger>
          <HoverCardContent className="bg-surface-raised border border-error rounded-lg p-4">
            <div className="w-64">
              <div className="text-body font-medium text-error mb-1">永久刪除警告</div>
              <p className="text-caption">此動作會永久刪除所有資料</p>
            </div>
          </HoverCardContent>
        </HoverCard>
        <Label warn>↑ 刪除警告只靠 hover → 手機使用者點按鈕前根本沒看到 → 改用 Dialog 確認</Label>
      </Rule>

      <Rule
        title="✅ 補充資訊 / 預覽 / 人員卡適合 HoverCard"
        note="看到更好、看不到也不影響主流程的場景。即便觸控裝置沒 hover，使用者透過點擊人員 / 連結仍能取得完整資訊（HoverCard 只是桌機的快捷預覽）"
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <a className="text-primary underline cursor-pointer inline-flex items-center gap-1">
              使用者手冊 <ExternalLink size={12} />
            </a>
          </HoverCardTrigger>
          <HoverCardContent className="bg-surface-raised border border-border rounded-lg p-4">
            <div className="w-64">
              <div className="text-body font-medium mb-1">使用者手冊</div>
              <p className="text-caption text-fg-muted">完整操作指南與常見問題</p>
            </div>
          </HoverCardContent>
        </HoverCard>
        <Label>↑ 連結預覽,hover 才看到是加分,沒看到點進去也行</Label>
      </Rule>
    </div>
  ),
}
