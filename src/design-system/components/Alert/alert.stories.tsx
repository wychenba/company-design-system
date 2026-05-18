// @story-trait-rationale: hasVariants/hasInteractiveStates 的 canonical core stories(AllVariants / States)
//   集中在 anatomy.stories.tsx 的 ColorMatrix + StateBehavior(Inspector 互動);本 showcase
//   提供真實業務 scenario(部署 / 系統警示)而非 trait grid 重複展示。
import type { Meta } from '@storybook/react'
import { RefreshCw, Share2, X as XIcon } from 'lucide-react'
import { Alert } from './alert'
import { Button } from '@/design-system/components/Button/button'
import { ButtonDivider } from '@/design-system/components/Button/button-group'
import type { NoticeVariant } from '@/design-system/components/Notice/notice'

const meta: Meta = {
  title: 'Design System/Components/Alert/展示',
  parameters: { layout: 'padded' },
}
export default meta

const ALL: NoticeVariant[] = ['neutral', 'info', 'warning', 'error', 'success']
// 真實情境的 title(「人」test:遮 variant 標籤也看得懂)
const L: Record<string, string> = {
  neutral: '已切換至離線模式',
  info: 'v2.4 已發佈',
  warning: '免費額度剩 3 天',
  error: '付款失敗',
  success: '部署完成',
}
// description 用簡潔的輔助資訊(非 variant 名稱)
const D: Record<string, string> = {
  neutral: '變更會在重新連線後同步',
  info: '查看更新日誌了解新功能',
  warning: '升級方案以避免服務中斷',
  error: '請檢查卡號或改用其他付款方式',
  success: 'v2.4.1 已上線到 production',
}

const actionBtn = <Button variant="tertiary" size="xs">查看詳情</Button>

export const SubtleSingleLine = {
  name: 'Subtle 單行',
  render: () => (
    <div className="flex flex-col gap-3 max-w-lg">
      {ALL.map((v) => <Alert key={v} variant={v} appearance="subtle" title={L[v]} endContent={actionBtn} />)}
    </div>
  ),
}

export const SolidSingleLine = {
  name: 'Solid 單行',
  render: () => (
    <div className="flex flex-col gap-3 max-w-lg">
      {ALL.map((v) => <Alert key={v} variant={v} appearance="solid" title={L[v]} endContent={actionBtn} />)}
    </div>
  ),
}

export const SubtleWithDescription = {
  name: '低調 + 說明文字',
  render: () => (
    <div className="flex flex-col gap-3 max-w-lg">
      {ALL.map((v) => <Alert key={v} variant={v} appearance="subtle" title={L[v]} description={D[v]} endContent={actionBtn} />)}
    </div>
  ),
}

export const SolidWithDescription = {
  name: '實心 + 說明文字',
  render: () => (
    <div className="flex flex-col gap-3 max-w-lg">
      {ALL.map((v) => <Alert key={v} variant={v} appearance="solid" title={L[v]} description={D[v]} endContent={actionBtn} />)}
    </div>
  ),
}

export const CornerActionGroup = {
  name: '框架角落操作群組',
  render: () => (
    <div className="flex flex-col gap-4 max-w-lg">
      <span className="text-caption text-fg-muted">
        Chrome corner 是 action group region(Cat 3)。Close X 左側可並排 refresh / share 等
        額外 action + Separator,全部同 size Button iconOnly xs(notification banner 家族設計準則)。目前 Alert API 只渲染單一
        close X,多 action 時 consumer 自疊 wrapper 呈現(Alert 不 native 支援多 corner action)。
      </span>

      <div className="relative">
        <Alert
          variant="warning"
          appearance="subtle"
          title="部署管線偵測到新的 commit"
          description="點「重新整理」同步最新狀態,或忽略此訊息繼續目前作業。"
          dismissible={false}
        />
        {/* @story-trait-rationale: scenario showcase 沒 AllVariants/States,trait grid 在 anatomy */}
        <div className="absolute top-3 right-4 flex items-center gap-2">
          {/* Chrome action group canonical(2026-04-28):全 xs(notification banner family canonical),
              same-row consistency 同尺寸 + ButtonDivider 自帶 mx-1 = 12px 視覺距離(對齊 button-group 主檔)*/}
          <Button iconOnly size="xs" variant="text" startIcon={RefreshCw} aria-label="重新整理" />
          <Button iconOnly size="xs" variant="text" startIcon={Share2} aria-label="分享連結" />
          <ButtonDivider />
          <Button iconOnly dismiss size="xs" startIcon={XIcon} aria-label="關閉通知" />
        </div>
      </div>

      <span className="text-caption text-fg-muted">
        ✅ Close X 跟 refresh / share 同 Button iconOnly xs(chrome 輕量 action,chrome-header-height 幾何),Separator 分群。
        ❌ 禁止混 Inline Action + Button iconOnly(違反 same-row consistency)。
      </span>
    </div>
  ),
}

export const Fixed = {
  name: '固定顯示',
  render: () => (
    <div className="flex flex-col gap-6">
      <span className="text-caption text-fg-muted">固定在 header 底下,無圓角,full-width。</span>

      <div className="flex flex-col gap-1">
        <span className="text-caption text-fg-muted font-medium">Subtle Fixed</span>
        <div className="border border-divider rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-surface border-b border-divider">
            <span className="text-body font-medium">專案設定</span>
          </div>
          {ALL.map((v) => <Alert key={v} variant={v} appearance="subtle" placement="fixed" title={L[v]} />)}
          <div className="p-4 text-fg-muted text-caption">調整此專案的權限與通知偏好。變更會立刻套用到所有成員。</div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-caption text-fg-muted font-medium">Solid Fixed</span>
        <div className="border border-divider rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-surface border-b border-divider">
            <span className="text-body font-medium">專案設定</span>
          </div>
          {ALL.map((v) => <Alert key={v} variant={v} appearance="solid" placement="fixed" title={L[v]} />)}
          <div className="p-4 text-fg-muted text-caption">調整此專案的權限與通知偏好。變更會立刻套用到所有成員。</div>
        </div>
      </div>
    </div>
  ),
}

