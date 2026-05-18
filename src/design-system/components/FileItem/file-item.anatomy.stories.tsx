// @anatomy-exempt: anatomy specs / token 對照表格用 raw <table>,非業務資料表。業務資料表才用 <DataTable>。
import type { Meta, StoryObj } from '@storybook/react'
import { X, Download, RotateCw } from 'lucide-react'
import { FileItem } from './file-item'
import { Button } from '@/design-system/components/Button/button'
import { H3, Desc, Td, Th, Swatch } from '@/design-system/stories-helpers/anatomy/anatomy-utils'

const meta: Meta<typeof FileItem> = {
  title: 'Design System/Components/FileItem/設計規格',
  component: FileItem,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof FileItem>

export const Overview: Story = {
  name: '元件總覽',
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <H3>Anatomy</H3>
        <Desc>FileItem 是組合元件——Prefix(Avatar 或 Paperclip)+ Content(name + description + 可選 progress bar)+ 可選 Actions suffix。基於 item-layout pattern。</Desc>
        <div className="flex flex-col gap-2 max-w-lg">
          <FileItem
            name="Q1-report.pdf"
            description="2.4 MB · 上傳中 75%"
            status="uploading"
            progress={75}
            mode="rich"
          />
          <FileItem
            name="beach-photo.jpg"
            description="4.8 MB"
            mode="rich"
            thumbnailSrc="https://i.pravatar.cc/112?img=3"
          />
        </div>
      </div>

      <div>
        <H3>Props 速查</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Prop</Th><Th>Type</Th><Th>Default</Th><Th>說明</Th></tr></thead>
            <tbody>
              {[
                ['name', 'string', '必填', '檔名'],
                ['mode', "'compact' | 'rich'", "'compact'", 'compact=Paperclip 16px icon / rich=Avatar 56px 縮圖'],
                ['status', "'uploading' | 'completed' | 'error'", '—', '上傳狀態(不傳=已上傳靜態)'],
                ['progress', 'number', '—', '上傳進度 0-100(uploading 時顯示 bar)'],
                ['description', 'string', '—', 'rich 任意場景 / compact 只有 error 才顯示'],
                ['thumbnailSrc', 'string', '—', 'rich mode 的縮圖 URL(圖片類檔案)'],
                ['actions', 'ReactNode', '—', 'suffix actions(例:delete / cancel button)'],
                ['onDownload', '() => void', '—', "hover-swap:status='completed' 時,row hover ✓ 換成 Download ↓。幾何=rich → Button xs 24(row action ≤ 24 cap)/ compact → ItemInlineAction 16"],
                ['onRetry', '() => void', '—', "hover-swap:status='error' 時,row hover ✗ 換成 RotateCw ⟲(幾何同上 — rich xs / compact Inline Action)"],
                ['onClick', '() => void', '—', '傳入後整個 item 變可點擊(cursor-pointer,**無 hover bg**——FileItem 設計準則:permanent-anchored 元件不加 hover-bg double-emphasis)'],
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

export const Inspector: Story = {
  name: '元件檢閱器',
  parameters: {
    docs: { description: { story: '右側 Controls 切 props 即時 render,取代 Figma inspect。調整 `mode` / `status` / `progress` 看 compact vs rich 佈局與狀態 icon/進度條變化。' } },
  },
  args: {
    name: 'Q1 行銷報告 PDF(範例檔)',
    mode: 'rich',
    status: 'uploading',
    progress: 60,
    description: '2.4 MB · 上傳中',
    thumbnailSrc: 'https://i.pravatar.cc/112?img=3',
  },
  argTypes: {
    name: { control: 'text' },
    mode: { control: 'radio', options: ['compact', 'rich'] },
    status: { control: 'radio', options: [undefined, 'uploading', 'completed', 'error'] },
    progress: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    description: { control: 'text' },
    thumbnailSrc: { control: 'text' },
  },
  render: (args) => (
    <div className="max-w-lg">
      <FileItem {...args} />
    </div>
  ),
}

export const ColorMatrix: Story = {
  name: '色彩對照表',
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <H3>Status × 元素 色彩矩陣</H3>
        <Desc>
          FileItem 本身無色彩變體——text 走 item-anatomy row primitive 共用 token
          (`--foreground` / `--fg-secondary`);background 依 mode 固定(rich = `--surface` + border / compact Type B = `--secondary` / compact Type A = transparent),**無 hover-bg**(見下方 Container background table)。
          Status 才驅動色彩:progress bar 色(inProgress / success / error)+ status icon 色(check / X)+ description 色(error 時升階)。
        </Desc>
        <div className="overflow-x-auto mb-4">
          <table className="text-caption border-collapse min-w-[720px]">
            <thead>
              <tr>
                <Th>Status</Th>
                <Th>Filename text</Th>
                <Th>Description text</Th>
                <Th>Progress bar fill</Th>
                <Th>Status icon</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td mono>無 status(已上傳)</Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--foreground" size="sm" /><span className="font-mono">--foreground</span></span></Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--fg-secondary" size="sm" /><span className="font-mono">--fg-secondary</span></span></Td>
                <Td>—(無 bar)</Td>
                <Td>—</Td>
              </tr>
              <tr>
                <Td mono>uploading</Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--foreground" size="sm" /><span className="font-mono">--foreground</span></span></Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--fg-secondary" size="sm" /><span className="font-mono">--fg-secondary</span></span></Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--primary" size="sm" /><span className="font-mono">--primary(inProgress)</span></span></Td>
                <Td>—(只顯示 bar)</Td>
              </tr>
              <tr>
                <Td mono>completed</Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--foreground" size="sm" /><span className="font-mono">--foreground</span></span></Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--fg-secondary" size="sm" /><span className="font-mono">--fg-secondary</span></span></Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--success" size="sm" /><span className="font-mono">--success</span></span></Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--success" size="sm" /><span className="font-mono">CircleCheck text-success</span></span></Td>
              </tr>
              <tr>
                <Td mono>error</Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--foreground" size="sm" /><span className="font-mono">--foreground</span></span></Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--error" size="sm" /><span className="font-mono">--error(升階)</span></span></Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--error" size="sm" /><span className="font-mono">--error</span></span></Td>
                <Td><span className="inline-flex items-center gap-1.5"><Swatch value="--error" size="sm" /><span className="font-mono">XCircle text-error</span></span></Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <H3>視覺對照(rich mode)</H3>
        <div className="flex flex-col gap-2 max-w-lg">
          <FileItem name="Q1-marketing-report.pdf" description="2.4 MB · 已上傳" mode="rich" />
          <FileItem name="brand-guidelines.pdf" description="1.2 MB · 上傳中 45%" status="uploading" progress={45} mode="rich" />
          <FileItem name="Q2-forecast.xlsx" description="上傳成功 · 3.8 MB" status="completed" progress={100} mode="rich" />
          <FileItem name="legacy-data.csv" description="上傳失敗 · 網路中斷" status="error" mode="rich" />
        </div>
      </div>

      <div>
        <H3>Container background(per mode,**無 hover-bg**)</H3>
        <Desc>
          FileItem 設計準則(2026-04-23):**永不顯示 hover-bg**。三種型態皆已 permanent-anchored(rich = border card / compact Type B = bg-secondary / compact Type A = 底部 progress bar),再加 hover-bg 是 double-emphasis 視覺雜。affordance 只靠 `cursor-pointer`(onClick 時)+ hover-swap icon fade。詳 spec「Hover 行為 canonical」。
        </Desc>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead>
              <tr><Th>Mode / State</Th><Th>Background</Th><Th>Rationale</Th></tr>
            </thead>
            <tbody>
              <tr><Td mono>rich(all status)</Td><Td><span className="inline-flex items-center gap-1.5"><Swatch value="--surface" size="sm" /><span className="font-mono">--surface</span> + border</span></Td><Td>永遠是 card(border + rounded + bg-surface)</Td></tr>
              <tr><Td mono>compact Type B(no status)</Td><Td><span className="inline-flex items-center gap-1.5"><Swatch value="--secondary" size="sm" /><span className="font-mono">--secondary</span>(= neutral-3)</span></Td><Td>靜態 pill,對齊 Badge low / ProgressBar track SSOT</Td></tr>
              <tr><Td mono>compact Type A(with status)</Td><Td><span className="font-mono">transparent</span></Td><Td>底部 progress bar 作 permanent affordance(分隔線型)</Td></tr>
              <tr><Td mono>hover(任意 mode)</Td><Td><span className="font-mono">無變化</span></Td><Td>permanent-anchored → 不加 hover-bg。cursor-pointer 作 affordance(onClick 時)</Td></tr>
              <tr><Td mono>error</Td><Td><span className="font-mono">容器不變</span></Td><Td>只升階 description / bar / icon,不染容器——避免整 row 轉紅蓋過其他 metadata</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

export const ModeMatrix: Story = {
  name: '模式 對照(緊湊 vs 豐富)',
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <H3>rich — Avatar 56px square 在左</H3>
        <Desc>閱讀模式(text-body 14px 1.5 line-height),資訊容量較高。適合圖片 / 文件 / 需要縮圖的場景。</Desc>
        <div className="flex flex-col gap-2 max-w-lg">
          <FileItem name="Q1-report.pdf" description="2.4 MB · 已上傳" mode="rich" />
          <FileItem name="photo.jpg" description="4.8 MB" mode="rich" thumbnailSrc="https://i.pravatar.cc/112?img=3" />
          <FileItem name="contract.pdf" description="1.2 MB · 上傳中 45%" status="uploading" progress={45} mode="rich" />
        </div>
      </div>

      <div>
        <H3>compact（預設）— Paperclip 16px icon 在左</H3>
        <Desc>掃描模式(text-caption),資訊密度高。適合批次上傳的 logs / CSV / JSON。Description 只在 error 才顯示。</Desc>
        <div className="flex flex-col gap-1 max-w-lg">
          <FileItem name="users.csv" mode="compact" status="completed" progress={100} />
          <FileItem name="orders.json" mode="compact" status="uploading" progress={42} />
          <FileItem name="products.xlsx" mode="compact" status="error" description="檔案格式不支援" />
          <FileItem name="logs.txt" mode="compact" status="completed" progress={100} />
        </div>
      </div>

      <div>
        <H3>Mode 對照</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Mode</Th><Th>Prefix</Th><Th>Typography</Th><Th>Description</Th><Th>使用場景</Th></tr></thead>
            <tbody>
              <tr><Td mono>compact（預設）</Td><Td>Paperclip 16px</Td><Td>掃描模式(text-caption)</Td><Td>只有 error 才顯示</Td><Td>批次上傳、一般檔案</Td></tr>
              <tr><Td mono>rich</Td><Td>Avatar 48px square</Td><Td>閱讀模式(text-body)</Td><Td>任何場景</Td><Td>圖片、文件、需要預覽</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

export const SizeMatrix: Story = {
  name: '尺寸對照表',
  render: () => (
    <div className="flex flex-col gap-10">
      <div>
        <H3>Mode 決定 density,不走 size prop</H3>
        <Desc>
          FileItem **沒有 size prop**——兩種 mode(compact / rich)已經覆蓋所有密度需求。對齊
          Dropbox / Google Drive / Linear 的檔案清單慣例:compact 是系統列表預設,rich 是 media-heavy
          場景(照片、需要縮圖的場景)。Size tier 的區別在 mode 上已足夠表達。
        </Desc>
        <div className="overflow-x-auto mb-4">
          <table className="text-caption border-collapse">
            <thead>
              <tr>
                <Th>Dimension</Th>
                <Th>compact(預設)</Th>
                <Th>rich</Th>
              </tr>
            </thead>
            <tbody>
              <tr><Td>Prefix</Td><Td mono>Paperclip 16px(foreground)</Td><Td mono>Avatar 56px square(縮圖或 fallback)</Td></tr>
              <tr><Td>Row 高度(無 bar)</Td><Td mono>h-field-md(32/36 density)</Td><Td mono>≈ 56px + py</Td></tr>
              <tr><Td>Typography</Td><Td mono>text-body leading-compact(掃描模式)</Td><Td mono>text-body 預設行高(閱讀模式)</Td></tr>
              <tr><Td>Description</Td><Td>僅 error 才顯示</Td><Td>任何場景都可顯示</Td></tr>
              <tr><Td>Progress bar</Td><Td mono>絕對定位 2px 在底</Td><Td mono>inline 4px,bar 底部對齊 avatar</Td></tr>
              <tr><Td>Actions</Td><Td>右側 ItemInlineAction(row 24 容不下 Button xs)</Td><Td>右側 Button xs iconOnly(24 固定,row action ≤ 24 cap;多 action 橫排)</Td></tr>
              <tr><Td>使用場景</Td><Td>批次上傳、log 列表、CSV/JSON</Td><Td>圖片上傳、文件附件、需預覽的檔案</Td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <H3>同一批 5 個檔案:compact vs rich</H3>
        <Desc>同樣 5 個檔案,兩種 mode 呈現的視覺密度差異——compact 可一目 5 行掃完,rich 需滾動且視覺重量高。</Desc>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-caption text-fg-muted mb-2 font-mono">mode="compact"</div>
            <div className="flex flex-col gap-0 max-w-sm border border-border rounded-md">
              <FileItem name="Q1-report.pdf" mode="compact" status="completed" progress={100} />
              <FileItem name="users.csv" mode="compact" status="completed" progress={100} />
              <FileItem name="products.xlsx" mode="compact" status="uploading" progress={62} />
              <FileItem name="logs.txt" mode="compact" status="error" description="檔案格式不支援" />
              <FileItem name="invoice-2026.pdf" mode="compact" status="completed" progress={100} />
            </div>
          </div>
          <div>
            <div className="text-caption text-fg-muted mb-2 font-mono">mode="rich"</div>
            <div className="flex flex-col gap-2 max-w-sm">
              <FileItem name="Q1-report.pdf" description="2.4 MB · 已上傳" mode="rich" />
              <FileItem name="users.csv" description="120 KB · 已上傳" mode="rich" />
              <FileItem name="products.xlsx" description="1.2 MB · 上傳中 62%" mode="rich" status="uploading" progress={62} />
              <FileItem name="logs.txt" description="檔案格式不支援" mode="rich" status="error" />
              <FileItem name="invoice-2026.pdf" description="880 KB · 已上傳" mode="rich" />
            </div>
          </div>
        </div>
        <p className="text-footnote text-fg-muted mt-3">
          選 mode 的 test:檔案是「資料 row」→ compact;是「內容物件」(圖片 / 附件)→ rich。
        </p>
      </div>
    </div>
  ),
}

export const StateBehavior: Story = {
  name: '狀態行為',
  render: () => (
    <div className="flex flex-col gap-4 max-w-lg">
      <div>
        <H3>所有狀態對照</H3>
        <div className="flex flex-col gap-2">
          <FileItem name="uploading.pdf" description="2.4 MB · 上傳中 60%" status="uploading" progress={60} mode="rich" actions={<Button variant="text" size="xs" iconOnly startIcon={X} aria-label="取消" />} />
          <FileItem name="completed.pdf" description="2.4 MB · 已上傳" status="completed" mode="rich" actions={<Button variant="text" size="xs" iconOnly startIcon={Download} aria-label="下載" />} />
          <FileItem name="error.pdf" description="網路中斷,請重試" status="error" mode="rich" actions={<div className="flex gap-1"><Button variant="text" size="xs" iconOnly startIcon={RotateCw} aria-label="重試" /><Button variant="text" size="xs" iconOnly startIcon={X} aria-label="移除" /></div>} />
          <FileItem name="static.pdf" description="已儲存 · 1.2 MB" mode="rich" onClick={() => {}} actions={<Button variant="text" size="xs" iconOnly startIcon={Download} aria-label="下載" />} />
        </div>
      </div>

      <div>
        <H3>Progress bar 色彩</H3>
        <div className="overflow-x-auto">
          <table className="text-caption border-collapse">
            <thead><tr><Th>Status</Th><Th>Progress bar 色</Th><Th>Status icon</Th></tr></thead>
            <tbody>
              <tr><Td mono>uploading</Td><Td mono>bg-primary</Td><Td>—</Td></tr>
              <tr><Td mono>completed</Td><Td mono>bg-success(100%)</Td><Td>CircleCheck(text-success)</Td></tr>
              <tr><Td mono>error</Td><Td mono>bg-error(失敗點位置)</Td><Td>XCircle(text-error)</Td></tr>
              <tr><Td>(無 status)</Td><Td>無 bar</Td><Td>—</Td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
}

// ── Accessibility ─────────────────────────────────────────────────────────
// 2026-05-17 ship per audit Dim 13(story-rules.md 6-canonical 含 Accessibility)
export const Accessibility = {
  name: '無障礙',
  render: () => (
    <div className="max-w-3xl text-body text-fg-secondary">
      <h3 className="text-h5 text-foreground mb-2">無障礙設計</h3>
      <p className="whitespace-pre-line">{"詳 `fileitem.spec.md` 「A11y 預設」段。摘要:\n\n-    aria-busy  for uploading  : status=\"uploading\"  時 row 自動  aria-busy=\"true\" ,SR 朗讀「busy」避免 user 嘗試互動已 in-flight item。\n-   Error state live region  : status=\"error\"  row 自動  role=\"status\"  +  aria-live=\"polite\" ,error 訊息(label + description)即時 announce,user 不用主動 navigate 過去。 polite  不打斷既有 SR 朗讀,適合 file upload 非緊急情境。\n-   Action button labels  :Download / retry / remove 等 inline action 必傳  aria-l"}</p>
    </div>
  ),
}
