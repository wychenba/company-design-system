import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Mail, Settings, User, LogOut, Plus, Trash2, Copy, Pencil, ExternalLink, Moon, Sun, Monitor, ChevronDown, FileText } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuRadioGroup,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut,
  DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuItemIcon,
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
          <DropdownMenuItemIcon><Copy size={16} /></DropdownMenuItemIcon>
          複製
          <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <DropdownMenuItemIcon><Pencil size={16} /></DropdownMenuItemIcon>
          編輯
          <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-error">
          <DropdownMenuItemIcon><Trash2 size={16} /></DropdownMenuItemIcon>
          刪除
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
            <DropdownMenuItemIcon><User size={16} /></DropdownMenuItemIcon>
            個人資料
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DropdownMenuItemIcon><Settings size={16} /></DropdownMenuItemIcon>
            設定
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <DropdownMenuItemIcon><LogOut size={16} /></DropdownMenuItemIcon>
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

// ── Suffix（badge + endIcon）──

export const WithSuffix: StoryObj = {
  name: '後綴',
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="tertiary" endIcon={ChevronDown}>操作</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <DropdownMenuItemIcon><Mail size={16} /></DropdownMenuItemIcon>
          收件匣
          <div className="h-[1lh] flex items-center ml-auto shrink-0">
            <Badge count={12} />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <DropdownMenuItemIcon><FileText size={16} /></DropdownMenuItemIcon>
          說明文件
          <div className="h-[1lh] flex items-center ml-auto shrink-0">
            <ExternalLink size={16} className="text-fg-muted" />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <DropdownMenuItemIcon><Plus size={16} /></DropdownMenuItemIcon>
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
          <DropdownMenuItemIcon><User size={16} /></DropdownMenuItemIcon>
          個人資料
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger value={themeLabels[theme]}>
            <DropdownMenuItemIcon><Monitor size={16} /></DropdownMenuItemIcon>
            主題
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <DropdownMenuItemIcon><Sun size={16} /></DropdownMenuItemIcon>
                淺色
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <DropdownMenuItemIcon><Moon size={16} /></DropdownMenuItemIcon>
                深色
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <DropdownMenuItemIcon><Monitor size={16} /></DropdownMenuItemIcon>
                跟隨系統
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <DropdownMenuItemIcon><LogOut size={16} /></DropdownMenuItemIcon>
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
        <DropdownMenuCheckboxItem checked disabled>
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
  name: '單選',
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
              <DropdownMenuItemIcon><Copy size={sz === 'lg' ? 20 : 16} /></DropdownMenuItemIcon>
              複製
            </DropdownMenuItem>
            <DropdownMenuItem>
              <DropdownMenuItemIcon><Pencil size={sz === 'lg' ? 20 : 16} /></DropdownMenuItemIcon>
              編輯
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-error">
              <DropdownMenuItemIcon><Trash2 size={sz === 'lg' ? 20 : 16} /></DropdownMenuItemIcon>
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  ),
}
