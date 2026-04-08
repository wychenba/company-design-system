import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Mail, Settings, User, LogOut, Plus, Trash2, Copy, Pencil, ExternalLink, Moon, Sun, Monitor, ChevronDown } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuRadioGroup,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut,
  DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuItemSuffix, DropdownMenuItemPrefix,
} from './dropdown-menu'
import { Button } from '@/design-system/components/Button/button'
import { Badge } from '@/design-system/components/Badge/badge'

const meta: Meta = {
  title: 'Design System/Components/DropdownMenu/展示',
  parameters: { layout: 'padded' },
}
export default meta

// ── 基本 ──

export const Basic: StoryObj = {
  name: '基本',
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="tertiary" endIcon={ChevronDown}>操作</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <DropdownMenuItemPrefix><Copy size={16} /></DropdownMenuItemPrefix>
          複製
          <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <DropdownMenuItemPrefix><Pencil size={16} /></DropdownMenuItemPrefix>
          編輯
          <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <DropdownMenuItemPrefix><Trash2 size={16} className="text-error" /></DropdownMenuItemPrefix>
          <span className="text-error">刪除</span>
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

// ── 群組 + Label ──

export const Groups: StoryObj = {
  name: '群組',
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="tertiary" endIcon={ChevronDown}>帳號</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>我的帳號</DropdownMenuLabel>
          <DropdownMenuItem>
            <DropdownMenuItemPrefix><User size={16} /></DropdownMenuItemPrefix>
            個人資料
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DropdownMenuItemPrefix><Settings size={16} /></DropdownMenuItemPrefix>
            設定
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <DropdownMenuItemPrefix><LogOut size={16} /></DropdownMenuItemPrefix>
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

// ── Suffix（badge + endIcon）──

export const WithSuffix: StoryObj = {
  name: '後綴（badge + icon）',
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="tertiary" endIcon={ChevronDown}>通知</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <DropdownMenuItemPrefix><Mail size={16} /></DropdownMenuItemPrefix>
          收件匣
          <DropdownMenuItemSuffix>
            <Badge count={12} />
          </DropdownMenuItemSuffix>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <DropdownMenuItemPrefix><ExternalLink size={16} /></DropdownMenuItemPrefix>
          在新視窗開啟
          <DropdownMenuItemSuffix>
            <ExternalLink size={16} className="text-fg-muted" />
          </DropdownMenuItemSuffix>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <DropdownMenuItemPrefix><Plus size={16} /></DropdownMenuItemPrefix>
          新增（已停用）
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

// ── 子選單 ──

const SubMenuDemo = () => {
  const [theme, setTheme] = useState('dark')
  const themeLabels: Record<string, string> = { light: '淺色', dark: '深色', system: '跟隨系統' }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="tertiary" endIcon={ChevronDown}>設定</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <DropdownMenuItemPrefix><User size={16} /></DropdownMenuItemPrefix>
          個人資料
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger value={themeLabels[theme]}>
            <DropdownMenuItemPrefix><Monitor size={16} /></DropdownMenuItemPrefix>
            主題
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <DropdownMenuItemPrefix><Sun size={16} /></DropdownMenuItemPrefix>
                淺色
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <DropdownMenuItemPrefix><Moon size={16} /></DropdownMenuItemPrefix>
                深色
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <DropdownMenuItemPrefix><Monitor size={16} /></DropdownMenuItemPrefix>
                跟隨系統
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <DropdownMenuItemPrefix><LogOut size={16} /></DropdownMenuItemPrefix>
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const SubMenu: StoryObj = {
  name: '子選單',
  render: () => <SubMenuDemo />,
}

// ── Checkbox Items ──

const CheckboxDemo = () => {
  const [showStatus, setShowStatus] = useState(true)
  const [showActivity, setShowActivity] = useState(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="tertiary" endIcon={ChevronDown}>顯示欄位</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>可見欄位</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={showStatus} onCheckedChange={setShowStatus}>
          狀態
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showActivity} onCheckedChange={setShowActivity}>
          最近活動
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem disabled>
          名稱（必要）
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const CheckboxItems: StoryObj = {
  name: 'Checkbox',
  render: () => <CheckboxDemo />,
}

// ── Radio Items ──

const RadioDemo = () => {
  const [sort, setSort] = useState('name')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="tertiary" endIcon={ChevronDown}>排序</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>排序方式</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="name">名稱</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">日期</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="size">大小</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const RadioItems: StoryObj = {
  name: 'Radio',
  render: () => <RadioDemo />,
}

// ── 尺寸 ──

export const Sizes: StoryObj = {
  name: '尺寸',
  render: () => (
    <div className="flex items-center gap-4">
      {(['sm', 'md', 'lg'] as const).map((sz) => (
        <DropdownMenu key={sz}>
          <DropdownMenuTrigger asChild>
            <Button variant="tertiary" size={sz} endIcon={ChevronDown}>{sz}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent size={sz}>
            <DropdownMenuItem>
              <DropdownMenuItemPrefix><Copy size={sz === 'lg' ? 20 : 16} /></DropdownMenuItemPrefix>
              複製
            </DropdownMenuItem>
            <DropdownMenuItem>
              <DropdownMenuItemPrefix><Pencil size={sz === 'lg' ? 20 : 16} /></DropdownMenuItemPrefix>
              編輯
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <DropdownMenuItemPrefix><Trash2 size={sz === 'lg' ? 20 : 16} /></DropdownMenuItemPrefix>
              <span className="text-error">刪除</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  ),
}
