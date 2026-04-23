import * as React from 'react'
import { EMPTY_DISPLAY } from '@/design-system/components/Field/field-wrapper'
import { Tag } from '@/design-system/components/Tag/tag'
import { OverflowIndicator } from '@/design-system/components/OverflowIndicator/overflow-indicator'
import { Avatar } from '@/design-system/components/Avatar/avatar'
import { NameCard, NameCardDefaultActions } from '@/design-system/components/NameCard/name-card'

// ── Types ───────────────────────────────────────────────────────────────────

// PersonValue 承載 NameCard 所需的完整資訊(optional)。DS 全域 person avatar 的
// hoverCard NameCard 呈現一致(name / subtitle / status / statusMessage / fields / actions / View more)—
// 消費者的 person 資料若有 rich info 可直接傳入,缺項則自然不 render 該 section。
// 對齊 avatar.spec.md「person avatar hover → NameCard」DS-wide canonical。
export interface PersonData {
  name: string
  avatarUrl?: string
  /** 角色 / 部門 / ID 等 meta 單行(NameCard subtitle) */
  description?: string
  /** Presence 狀態(對齊 Avatar presence canonical) */
  status?: 'online' | 'away' | 'busy' | 'offline'
  /** Status 訊息(NameCard status section) */
  statusMessage?: React.ReactNode
  /** 結構化 info fields(NameCard info section) */
  fields?: { label: string; value: string }[]
  /** 跳至完整 profile 頁的 handler(hover NameCard 必含,不傳時 fallback noop placeholder) */
  onViewProfile?: () => void
}

export type PersonValue = string | PersonData

function resolvePerson(value: PersonValue): PersonData {
  return typeof value === 'string' ? { name: value } : value
}

// buildPersonNameCard — DS 全域 person avatar hoverCard 的 canonical NameCard JSX 建構器。
// 用一個 helper 避免每個 consumer 各自構造 NameCard 導致顯示的資訊不一致。
// 缺項 prop 自然不 render(NameCard 內部 conditional)。
function buildPersonNameCard(person: PersonData): React.ReactNode {
  return (
    <NameCard
      name={person.name}
      subtitle={person.description}
      avatar={{ src: person.avatarUrl, alt: person.name }}
      status={person.status}
      statusMessage={person.statusMessage}
      fields={person.fields}
      actions={<NameCardDefaultActions />}
      // onViewMore hover context 必含(avatar.spec.md canonical)。consumer 傳
      // `onViewProfile` 則用真 handler,否則 noop placeholder(UI 仍渲染 View more
      // footer,避免 preview 變死路)。
      onViewMore={person.onViewProfile ?? (() => {})}
    />
  )
}

// ── Avatar Size ─────────────────────────────────────────────────────────────
// 與 Tag 高度對齊:sm=20px, md/lg=24px(對齊 item-anatomy AVATAR_SIZE.inline)

const AVATAR_PX: Record<'sm' | 'md' | 'lg', number> = { sm: 20, md: 24, lg: 24 }

// ── PersonAvatar ────────────────────────────────────────────────────────────
// Consume DS `Avatar` primitive(2026-04-22 refactor,M1 SSOT consumption)+ 預設 NameCard
// hoverCard(avatar.spec.md DS-wide「person avatar hover → NameCard」canonical)。
//
// 之前用 local `<img>` / `<User icon />` hand-craft 繞過 DS Avatar,違反 M1。本次 refactor:
// - 所有 person avatar 經過 DS Avatar primitive(size 對應 uiSize family,fallback / icon / badge 集中管理)
// - 人員資訊 → NameCard(subtitle = description,actions = NameCardDefaultActions)

function PersonAvatar({
  person,
  size = 'md',
  className = '',
  style,
}: {
  person: PersonData
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <Avatar
      src={person.avatarUrl}
      alt={person.name}
      size={AVATAR_PX[size]}
      className={className}
      style={style}
      hoverCard={buildPersonNameCard(person)}
    />
  )
}

// ── Single Person Display ───────────────────────────────────────────────────

function PersonDisplay({ value, size = 'md' }: { value?: PersonValue | null; size?: 'sm' | 'md' | 'lg' }) {
  if (!value) return <span className="text-fg-muted">{EMPTY_DISPLAY}</span>

  const person = resolvePerson(value)

  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <PersonAvatar person={person} size={size} />
      <span className="truncate">{person.name}</span>
    </span>
  )
}
PersonDisplay.displayName = 'PersonDisplay'

// ── Multi Person Display ────────────────────────────────────────────────────
// 多人堆疊:avatar 重疊(-2px),不顯示人名。
// 第一個 avatar z-index 最高(在最上面),依此類推。
// 溢出時顯示 +N 指示器,hover 出 tooltip 列出溢出的人(avatar + 人名)。

function MultiPersonDisplay({
  value,
  size = 'md',
  max,
  onRemove,
}: {
  value?: PersonValue[] | null
  size?: 'sm' | 'md' | 'lg'
  /** 最多顯示幾個 avatar(不含 +N),預設 3 */
  max?: number
  /** 傳入時啟用 dismiss(edit mode),callback 接收被移除的 person */
  onRemove?: (person: PersonValue) => void
}) {
  if (!value || value.length === 0) return <span className="text-fg-muted">{EMPTY_DISPLAY}</span>

  const resolvedMax = max ?? 3
  const people = value.map(resolvePerson)
  const visible = people.slice(0, resolvedMax)
  const hidden = people.slice(resolvedMax)
  const overflow = hidden.length

  // 單人回退到 PersonDisplay(顯示名字)
  if (people.length === 1) {
    return <PersonDisplay value={value[0]} size={size} />
  }

  return (
    <span className="inline-flex items-center min-w-0">
      {visible.map((person, i) => (
        <PersonAvatar
          key={person.name + i}
          person={person}
          size={size}
          className={`ring-2 ring-[var(--surface)] ${i > 0 ? '-ml-0.5' : ''}`}
          style={{ zIndex: visible.length - i }}
        />
      ))}
      {overflow > 0 && (
        <OverflowIndicator
          count={overflow}
          size={size}
          className="ring-2 ring-[var(--surface)] -ml-0.5"
        >
          {hidden.map((person, i) => (
            <Tag
              key={person.name + i}
              variant="neutral"
              size="sm"
              // Tag.avatar 是 ReactNode(非 AvatarData object)——傳 <Avatar> 元素。
              // Tag 內部用 `w-4 h-4 rounded-full` 容器 slot,Avatar 填滿 object-cover。
              // **hoverCard 必帶**(avatar.spec.md DS-wide canonical:所有 person avatar 必 hover → NameCard)。
              // 跟 PersonAvatar 共用 `buildPersonNameCard` helper 確保顯示資訊一致。
              avatar={
                <Avatar
                  src={person.avatarUrl}
                  alt={person.name}
                  size={16}
                  hoverCard={buildPersonNameCard(person)}
                />
              }
              onDismiss={onRemove ? () => onRemove(value![resolvedMax + i]) : undefined}
            >
              {person.name}
            </Tag>
          ))}
        </OverflowIndicator>
      )}
    </span>
  )
}
MultiPersonDisplay.displayName = 'MultiPersonDisplay'

export { PersonDisplay, MultiPersonDisplay, PersonAvatar, buildPersonNameCard, resolvePerson }
