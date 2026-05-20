// AppShell stories 共用 helper(對齊 sidebar.stories.tsx IconCollapse baseline)
// @story-baseline: src/design-system/components/Sidebar/sidebar.stories.tsx#IconCollapse
//
// **嚴格**對齊既有 production-grade Sidebar story baseline,避免 AppShell stories 跟
// Sidebar 既有範例視覺偏移(2026-05-20 user 抓 anti-drift)。
// Showcase + Anatomy stories 全部 consume 此 file 不重發明 simplified mock。

import {
  Inbox,
  Calendar,
  Settings,
  Users,
  BarChart3,
  LayoutDashboard,
  PanelRightOpen,
} from 'lucide-react'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/design-system/components/Sidebar/sidebar'
import { Button } from '@/design-system/components/Button/button'
import {
  ItemAvatar,
} from '@/design-system/patterns/element-anatomy/item-anatomy'
import {
  NameCard,
  NameCardDefaultActions,
} from '@/design-system/components/NameCard/name-card'

// ── MAIN_NAV(對齊 sidebar.stories.tsx baseline)────────────────────────

export const MAIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

// ── WorkspaceBrand(對齊 sidebar.stories.tsx)────────────────────────────

export const WorkspaceBrand = () => (
  <div className="flex items-center gap-2 min-w-0 group-data-[collapsible=icon]:justify-center">
    <ItemAvatar alt="Acme Inc" shape="square" color="blue" solid />
    <span className="text-body-lg font-medium truncate group-data-[collapsible=icon]:hidden">Acme Inc</span>
  </div>
)

// ── UserFooter(對齊 sidebar.stories.tsx)────────────────────────────────

export const UserFooter = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <div role="group" aria-label="當前使用者">
          <ItemAvatar
            alt="Alan Chen"
            color="blue"
            hoverCard={
              <NameCard
                name="Alan Chen"
                subtitle="Design｜D-0042"
                avatar={{ alt: 'Alan Chen', color: 'blue' }}
                status="online"
                actions={<NameCardDefaultActions />}
              />
            }
          />
          <span data-sidebar="menu-label" className="min-w-0 flex-1 truncate">Alan Chen</span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
)

// ── AcmeSidebar(完整 production-grade,對齊 sidebar IconCollapse story)──

export function AcmeSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <WorkspaceBrand />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    id={item.id}
                    startIcon={item.icon}
                    tooltip={item.label}
                  >
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserFooter />
      </SidebarFooter>
    </Sidebar>
  )
}

// ── PageHeader(對齊 sidebar.stories PageContent header pattern,SidebarTrigger + h1 緊鄰 gap-2)──

export function PageHeader({
  title,
  onToggleAside,
  asideOpen,
}: {
  title: string
  onToggleAside?: () => void
  asideOpen?: boolean
}) {
  return (
    <header className="flex h-[var(--chrome-header-height)] shrink-0 items-center gap-2 border-b border-divider bg-surface px-[var(--layout-space-loose)]">
      <SidebarTrigger />
      <h1 className="text-body-lg font-medium flex-1 truncate">{title}</h1>
      {onToggleAside && (
        <Button
          size="sm"
          variant="text"
          iconOnly
          startIcon={PanelRightOpen}
          aria-label={asideOpen ? '關閉詳情' : '開啟詳情'}
          onClick={onToggleAside}
        />
      )}
    </header>
  )
}
