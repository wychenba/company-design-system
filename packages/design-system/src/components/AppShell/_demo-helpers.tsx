// AppShell stories 共用 helper(對齊 sidebar.stories.tsx IconCollapse baseline)
// @story-baseline: packages/design-system/src/components/Sidebar/sidebar.stories.tsx#IconCollapse
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
import { ChromeHeader } from '@/design-system/patterns/header-canonical/chrome-header'
import {
  ItemAvatar,
} from '@/design-system/patterns/element-anatomy/item-anatomy'
import { Avatar } from '@/design-system/components/Avatar/avatar'
import {
  ProfileCard,
  ProfileCardDefaultActions,
} from '@/design-system/components/ProfileCard/profile-card'

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

// 2026-05-21 v15 — Chrome header avatar SSOT, semantic-correct revise(per user 抓 v14
// RowSizeProvider hijack 是 semantic 漂移 + 「想辦法在語言正確下修到正確」directive):
//
// Chrome header **不是 row context**(per `item-anatomy.spec.md:550` 規則 scope 是 row primitive
// consumer + `header-canonical.spec.md` 4.5 chrome header avatar SSOT)。Chrome header avatar
// 是 spec-level canonical 24px、density-fixed、row-size-fixed,跟 row-anatomy 的 sm/md/lg
// lookup 邏輯無關。
//
// 因此 chrome header 內 avatar **用 raw `<Avatar size={24}>`,不用 `<ItemAvatar>`**:
//   - ItemAvatar 透過 RowSizeContext lookup 是 row primitive(Sidebar / SelectMenu / TreeView 等)
//     的 anatomy helper,目的避免 asChild consumer 寫死跨 row size 漂移
//   - Chrome header 沒有 sm/md/lg row size 概念,無 lookup 需求,用 raw Avatar 才語義正確
//   - 父 `<div flex items-center>` 已 provide 縱向對齊,ItemPrefix wrapper(`h-[1lh]`)冗餘
//
// SSOT 鎖定:`<Avatar size={24}>` 對應 `--chrome-header-avatar-size: 1.5rem` token
// (`header-canonical.css`)+ `header-canonical.spec.md` 4.5 canonical「24px raw Avatar」。
// 公式端透過 var() 連動;JS 端透過 spec authority + comment cite 連動。改 24 → 同步 token + 此 hardcode。
export const WorkspaceBrand = () => (
  <div className="flex items-center gap-2 min-w-0">
    {/* 24 per header-canonical.spec.md 4.5 chrome header avatar canonical; sync with `--chrome-header-avatar-size` */}
    <Avatar size={24} shape="square" color="blue" solid alt="Acme Inc" />
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
              <ProfileCard
                name="Alan Chen"
                subtitle="Design｜D-0042"
                avatar={{ alt: 'Alan Chen', color: 'blue' }}
                status="online"
                actions={<ProfileCardDefaultActions />}
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
// `includeWorkspaceBrand` default true(primary-sidebar 派 Linear/Notion 慣例:workspace brand 在 sidebar 頂)。
// `false` 用於 primary-header mode:workspace brand 移到 globalHeader 左側(GitHub logo / Slack workspace bar 慣例)。

export function AcmeSidebar({
  viewportInsetTop,
  includeWorkspaceBrand = true,
}: {
  viewportInsetTop?: string
  includeWorkspaceBrand?: boolean
} = {}) {
  return (
    <Sidebar collapsible="icon" viewportInsetTop={viewportInsetTop}>
      {includeWorkspaceBrand && (
        <SidebarHeader>
          <WorkspaceBrand />
        </SidebarHeader>
      )}
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

// ── GlobalHeader(primary-header mode 用,跨頁 chrome:WorkspaceBrand 左 + 跨頁 actions 右)──
// 2026-05-21 加 per user clarification「primary-header = primary-sidebar + 一條 global header」。
// 對齊 GitHub top nav(logo 左 / search 中 / account 右)+ Slack workspace bar 慣例。
// 消費 ChromeHeader(per `header-canonical.spec.md` Element + Background ownership 段:
// top-level chrome → 自畫 bg-surface)。

export function GlobalHeader({ rightSlot }: { rightSlot?: React.ReactNode } = {}) {
  // 2026-05-21 v2 ship Option B(per user「primary header toggle 為了與 sidebar menu item
  // startIcon 水平對齊...container 寬度 = sidebar-width-icon」+ Issue 2 geometry formula 落地):
  // 用 ChromeHeader `leadingRail` slot(width = `--sidebar-width-icon` = 2*loose + icon-size)。
  // Toggle center x = rail 寬度中點 = sidebar collapsed icon center x = 完美 vertical 對齊。
  return (
    <ChromeHeader className="bg-surface" leadingRail={<SidebarTrigger />}>
      <WorkspaceBrand />
      <div className="flex-1" />
      {rightSlot}
    </ChromeHeader>
  )
}

// ── PageHeader(top-level chrome header,消費 ChromeHeader primitive)──
// 2026-05-20 migrate 消費 ChromeHeader,撤回自刻 `<header>` + 重複 className
// (per header-canonical.spec.md「6. Background ownership」段「Top-level chrome
// header 自畫 bg-surface」+「Element canonical」段「ChromeHeader 內部用 `<header>`」)。
// global header aside toggle 已撤回(2026-05-20 user「圖二 global header 不該有」)— 由
// DataTable rowActions Info icon 主入口(row-driven)取代,page header 純 title。

export function PageHeader({
  title,
  tabsSlot,
  includeSidebarTrigger = true,
}: {
  title: string
  /**
   * Optional tabs row(per header-canonical.spec.md W1-W6 + Background ownership 段)。
   * 提供時 ChromeHeader 自動 column mode + suppress border + delegate paint 給 TabsList。
   */
  tabsSlot?: React.ReactNode
  /**
   * 是否含 SidebarTrigger(2026-05-21 加 per user「primary-header mode 的 sidebar toggle 應該只放在 primary header 才對」)。
   * - `primary-sidebar` mode = true(預設):PageHeader 是 chrome 第一層,trigger 自然在這
   * - `primary-header` mode = false:SidebarTrigger 已在 GlobalHeader,PageHeader 不該重複
   */
  includeSidebarTrigger?: boolean
}) {
  return (
    <ChromeHeader className="bg-surface" tabsSlot={tabsSlot}>
      {includeSidebarTrigger && <SidebarTrigger />}
      <h1 className="text-body-lg font-medium flex-1 truncate">{title}</h1>
    </ChromeHeader>
  )
}
