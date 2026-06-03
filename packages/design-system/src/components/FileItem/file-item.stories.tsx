// @story-trait-rationale: hasInteractiveStates 由 anatomy.stories.tsx StateBehavior auto-compile owns(2026-05-15 F-migration);Default scenario 由 Rich / Compact / HoverSwap 等真實上傳情境 story 覆蓋,Disabled state 由 status="error" / "uploading" 真實 state 體現。
import * as React from 'react'
import type { Meta } from '@storybook/react'
import { Trash2, ChevronDown } from 'lucide-react'
import { FileItem } from './file-item'
import { Button } from '@/design-system/components/Button/button'
import { FileViewer, type FileInfo } from '@/design-system/components/FileViewer/file-viewer'

// 錯誤 description 範例(含 clickable "View log"):consumer 自由 ReactNode,通常用底線 link 表 clickable
const errorDescWithLog = (
  <>
    There&rsquo;s something wrong.{' '}
    <a href="#" className="underline hover:text-error-hover" onClick={(e) => e.preventDefault()}>
      View log
    </a>
  </>
)

const meta: Meta<typeof FileItem> = {
  title: 'Design System/Components/FileItem/展示',
  component: FileItem,
  parameters: { layout: 'padded' },
}
export default meta

const noop = () => {}

// FileItem row dedicated action(2026-04-23 統一 canonical):
// **Row action 絕對值 cap = ≤ 24px,不隨 row tier 放大**。rich + compact 統一用
// Button size="xs" iconOnly variant="text"(24 固定,≤ cap):
// compact row 透過 FileItem 內部 suffix wrapper `[&>[data-unbounded]]:my-[calc((1lh-var(--field-height-xs))/2)]`
// trick 讓 Button(24)layout footprint 收斂到 1lh(~18px)不撐高 row,觸控範圍仍 24。
// Trash/Delete 非 dismiss 語意(dismiss 嚴格 = X close overlay),不套 `dismiss` prop——
// Button variant="text" 本來就 fg-muted,視覺已弱化(兩 mode 同)。
// 詳 item-anatomy.spec.md「Predicate」+「Row action 絕對值 cap」
const deleteBtn = <Button size="xs" iconOnly variant="text" startIcon={Trash2} aria-label="刪除" onClick={noop} />
const deleteBtnXs = deleteBtn

export const Rich = {
  name: '豐富樣式',
  render: () => (
    // rich(預設 form surface)各 status 展示:uploading / completed(保留 100% 完成條)/ error
    // 也可傳 onClick/onDownload 讓整 row 點開(預設 FileViewer,consumer 決定)
    // Rich 永遠 border card → list wrapper `gap-2` 防邊框相黏
    <div className="flex flex-col gap-2 max-w-md">
      <FileItem mode="rich" name="Alan Profile.png" status="uploading" progress={40}
        description="5.7 MB of 7.5MB" thumbnailSrc="https://i.pravatar.cc/80?u=alan" actions={deleteBtn} />
      <FileItem mode="rich" name="Alan Profile.png" status="completed"
        description="5.7 MB" thumbnailSrc="https://i.pravatar.cc/80?u=alan"
        onClick={noop} onDownload={noop} actions={deleteBtn} />
      <FileItem mode="rich" name="Alan Profile.png" status="error" progress={65}
        description={errorDescWithLog} thumbnailSrc="https://i.pravatar.cc/80?u=alan"
        onRetry={noop} actions={deleteBtn} />
    </div>
  ),
}

export const Compact = {
  name: '緊湊樣式',
  render: () => (
    // compact + status 各狀態展示(uploading / completed / error,永遠有 progress bar)
    // list wrapper `gap-1`(4px)簡化 canonical — compact list 統一 gap-1,不論純/混合(2026-04-23)
    <div className="flex flex-col gap-1 max-w-md">
      <FileItem mode="compact" name="UXP T-Phone.csv" status="uploading" progress={60} actions={deleteBtnXs} />
      <FileItem mode="compact" name="UXP T-Phone.csv" status="error" description={errorDescWithLog} actions={deleteBtnXs} />
      <FileItem mode="compact" name="UXP T-Phone.csv" status="completed"
        onClick={noop} onDownload={noop} actions={deleteBtnXs} />
    </div>
  ),
}

export const HoverSwap = {
  name: 'Hover 替換',
  render: () => (
    <div className="flex flex-col max-w-md gap-4">
      <div>
        <div className="text-caption text-fg-muted mb-2">
          ↓ 游標移入任一 row:completed 綠 ✓ 變 Download ↓,error 紅 ✗ 變 Retry ⟲
        </div>
        {/* Rich border card list:無外框 + `gap-2`(item-anatomy「連續 item 貼邊合法性」) */}
        <div className="flex flex-col gap-2">
          <FileItem mode="rich" name="Q1 營收報表.xlsx" status="completed"
            description="Uploaded to URL" thumbnailSrc="https://i.pravatar.cc/80?u=xls"
            onDownload={noop} actions={deleteBtn} />
          <FileItem mode="rich" name="合約草案 v3.pdf" status="error"
            description="There's something wrong. View log"
            thumbnailSrc="https://i.pravatar.cc/80?u=pdf"
            onRetry={noop} actions={deleteBtn} />
        </div>
      </div>
      <div>
        <div className="text-caption text-fg-muted mb-2">
          同樣 pattern 在 compact mode:status slot 幾何與 delete action 一致(兩 mode 統一 Button xs 24),center 自動對齊
        </div>
        {/* Compact list 統一 gap-1(canonical 簡化) */}
        <div className="flex flex-col gap-1">
          <FileItem mode="compact" name="data-2024-q1.csv" status="completed"
            onDownload={noop} actions={deleteBtnXs} />
          <FileItem mode="compact" name="backup-failed.json" status="error"
            description={<>Network timeout. <a href="#" className="underline hover:text-error-hover" onClick={(e) => e.preventDefault()}>View log</a></>}
            onRetry={noop} actions={deleteBtnXs} />
        </div>
      </div>
    </div>
  ),
}

// ── FileViewer 真實整合 —— Clickable story 用 ──
// onClick 打開 FileViewer,預設用 picsum 圖片模擬 preview(real-world consumer
// 會用實際檔案 blob url / CDN url)。
const attachmentFiles: FileInfo[] = [
  {
    id: 'attach-1',
    url: 'https://picsum.photos/seed/report-pdf/1200/800',
    name: '報告.pdf',
    mimeType: 'application/pdf',
    size: 2_400_000,
    description: '2.3 MB',
  },
  {
    id: 'attach-2',
    url: 'https://picsum.photos/seed/contract-docx/1200/800',
    name: '合約附件.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1_100_000,
    description: '1.1 MB',
  },
  {
    id: 'attach-3',
    url: 'https://picsum.photos/seed/data-csv/1200/800',
    name: 'data.csv',
    mimeType: 'text/csv',
    size: 48_000,
  },
  {
    id: 'attach-4',
    url: 'https://picsum.photos/seed/backup-json/1200/800',
    name: 'backup.json',
    mimeType: 'application/json',
    size: 320_000,
  },
]

export const Clickable = {
  name: '已上傳',
  render: () => {
    // Real FileViewer wiring:click → 打開 FileViewer at 對應 index
    const [open, setOpen] = React.useState(false)
    const [index, setIndex] = React.useState(0)
    const openAt = (idx: number) => {
      setIndex(idx)
      setOpen(true)
    }
    return (
      <>
        <div className="flex flex-col gap-2 max-w-md">
          {attachmentFiles.map((f, i) => {
            const isImage = i < 2 // 前兩個 rich card(有 thumbnail)
            const sizeLabel = f.description ?? (f.size != null ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : '—')
            return isImage ? (
              <FileItem
                key={f.id}
                mode="rich"
                name={f.name}
                description={sizeLabel}
                thumbnailSrc={f.url}
                onClick={() => openAt(i)}
                actions={deleteBtn}
              />
            ) : (
              <FileItem
                key={f.id}
                mode="compact"
                name={f.name}
                onClick={() => openAt(i)}
                actions={deleteBtn}
              />
            )
          })}
        </div>
        <FileViewer files={attachmentFiles} open={open} onOpenChange={setOpen} index={index} onIndexChange={setIndex} />
      </>
    )
  },
}

export const CompactMixed = {
  name: 'Compact 混合',
  render: () => (
    // Real-world:email 草稿 — 新上傳中(status=uploading/error)+ 舊已存附件(無 status 靜態)混在同 list
    // **重要 invariant**:upload-manager 的 **completed**(bar 100% + ✓)跟靜態(無 bar)不共存
    // —— completed-保留 是「剛完成的 upload session」,無 status 是「已存 attachment」,
    //    業務語義互斥(表單情境完成後 consumer 會清掉 status 轉靜態)。
    // 這 mixed 情境只含:上傳中(uploading/error)+ 已存附件(saved attachments,無 status)
    <div className="flex flex-col gap-1 max-w-md">
      <FileItem mode="compact" name="圖片草稿.png" status="uploading" progress={40} actions={deleteBtnXs} />
      <FileItem mode="compact" name="回覆範本.docx" onClick={noop} actions={deleteBtnXs} />
      <FileItem mode="compact" name="backup-failed.json" status="error"
        description={<>Network timeout. <a href="#" className="underline hover:text-error-hover" onClick={(e) => e.preventDefault()}>View log</a></>}
        onRetry={noop} actions={deleteBtnXs} />
      <FileItem mode="compact" name="附件封面.pdf" onClick={noop} actions={deleteBtnXs} />
    </div>
  ),
}

// surface="upload-manager":Google Drive / Dropbox 上傳管理面板。面板組合 canonical(2026-06-03 圖五/圖一 user 校準):
//   - 左右一律 loose(16px,對齊 header);上下目標「邊緣→item ink」= tight(12px),通則 container 該側 = 12 − item 該側留白
//   - rich item 上下留白 0 → py-tight(12/12 對稱);compact 上留 8(item py)→ pt-1(4),下進度條貼底留 0 → pb-tight(12)
//   - 列間 gap 反映密度:rich = tight(12px,卡片+48 縮圖)/ compact = 4px(密集文字列)
//   - rich item 拿掉全部 padding(px-0 py-0,列高靠 avatar 48);左右交給面板,避免雙重 L/R。對比 surface=form 的 border card。
export const UploadManagerSurface = {
  name: 'Upload manager · 豐富(無邊框)',
  render: () => (
    <div className="max-w-md rounded-md border border-divider bg-surface shadow-[var(--elevation-200)]">
      {/* header:上傳進度標題列。px loose 與下方 item 內容左緣切齊 */}
      <div className="flex items-center justify-between px-[var(--layout-space-loose)] py-2 border-b border-divider">
        <span className="text-body font-medium text-foreground">正在上傳 3 個項目</span>
        <Button size="xs" iconOnly variant="text" startIcon={ChevronDown} aria-label="收合" onClick={noop} />
      </div>
      {/* rich list:px loose(16px,對齊 header);py + gap 都 tight(12px)= 垂直對稱 */}
      <div className="flex flex-col gap-[var(--layout-space-tight)] px-[var(--layout-space-loose)] py-[var(--layout-space-tight)]">
        <FileItem mode="rich" surface="upload-manager" name="Alan Profile.png" status="uploading" progress={40}
          description="5.7 MB of 7.5 MB" thumbnailSrc="https://i.pravatar.cc/80?u=alan" actions={deleteBtn} />
        <FileItem mode="rich" surface="upload-manager" name="Q1 營收報表.xlsx" status="completed"
          description="2.4 MB" thumbnailSrc="https://i.pravatar.cc/80?u=xls" onDownload={noop} actions={deleteBtn} />
        <FileItem mode="rich" surface="upload-manager" name="合約草案 v3.pdf" status="error"
          description={errorDescWithLog} thumbnailSrc="https://i.pravatar.cc/80?u=pdf" onRetry={noop} actions={deleteBtn} />
      </div>
    </div>
  ),
}

// surface="upload-manager" 的 compact list:外框 padding 跟 rich 面板同(左右 loose 16 / 上下 tight 12),
// 但列間 gap 只 4px(密集文字列,item 自身保留 py-2 作列高來源)。對比上面 rich panel 的 12px gap,demo 兩 mode 密度差異。
export const UploadManagerCompactSurface = {
  name: 'Upload manager · 精簡(無邊框)',
  render: () => (
    <div className="max-w-md rounded-md border border-divider bg-surface shadow-[var(--elevation-200)]">
      {/* header:px loose 與下方 item 內容左緣切齊 */}
      <div className="flex items-center justify-between px-[var(--layout-space-loose)] py-2 border-b border-divider">
        <span className="text-body font-medium text-foreground">同步 3 個檔案</span>
        <Button size="xs" iconOnly variant="text" startIcon={ChevronDown} aria-label="收合" onClick={noop} />
      </div>
      {/* compact list:px loose(16)。上下不對稱 = 「12 − item 那側留白」:
          pt-1(4px,item 文字上方自帶 8px → 4+8=12);pb-tight(12px,進度條 absolute 貼底、下方無 item 留白 → 容器補滿 12)。
          列間 gap-1(4px,密集列)。詳 spec「為何 compact container 上下不對稱」。 */}
      <div className="flex flex-col gap-1 px-[var(--layout-space-loose)] pt-1 pb-[var(--layout-space-tight)]">
        <FileItem mode="compact" surface="upload-manager" name="季度報告.docx" status="uploading" progress={60}
          onClick={noop} actions={deleteBtn} />
        <FileItem mode="compact" surface="upload-manager" name="客戶名單.csv" status="completed"
          onClick={noop} actions={deleteBtn} />
        <FileItem mode="compact" surface="upload-manager" name="封面.png" status="error"
          description={errorDescWithLog} onRetry={noop} actions={deleteBtn} />
      </div>
    </div>
  ),
}
