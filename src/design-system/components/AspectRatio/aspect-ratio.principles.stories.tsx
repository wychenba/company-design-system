import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AspectRatio } from './aspect-ratio'
import { Skeleton } from '@/design-system/components/Skeleton/skeleton'

/**
 * AspectRatio 設計原則——何時用 / 不用 / 如何選 ratio / 與 Skeleton 分界。
 * 完整規則見 `aspect-ratio.spec.md`。
 */

const meta: Meta = {
  title: 'Design System/Components/AspectRatio/設計原則',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

// ── Helpers ───────────────────────────────────────────────────────────────────

const Rule = ({
  title, note, children,
}: {
  title: string; note?: string; children: React.ReactNode
}) => (
  <div className="mb-14">
    <h3 className="text-body font-bold text-foreground mb-1">{title}</h3>
    {note && <p className="text-caption text-fg-muted mb-5 max-w-[720px] leading-relaxed">{note}</p>}
    <div className="flex flex-wrap gap-4 items-start">{children}</div>
  </div>
)

const Label = ({ children, warn }: { children: React.ReactNode; warn?: boolean }) => (
  <p className={`text-footnote leading-normal ${warn ? 'text-error font-medium' : 'text-fg-muted'}`}>{children}</p>
)

const Img = ({ seed, ratio }: { seed: string; ratio: number }) => {
  const h = Math.round(800 / ratio)
  return (
    <img
      src={`https://picsum.photos/seed/${seed}/800/${h}`}
      alt=""
      className="w-full h-full object-cover"
    />
  )
}

// ── Stories ───────────────────────────────────────────────────────────────────

// ── UsageGuidance — 整合何時用 / 何時不用 / vs 近親(Polaris/Material/Ant 共識)
// 合併自舊 WhenToUse / WhenNotToUse(2026-04-26 v3 canonical)

export const UsageGuidance: Story = {
  name: '使用指引',
  render: () => (
    <div className="flex flex-col gap-12">
      {/* 何時用 — 原 WhenToUse */}
      <div>
      <Rule
        title="✅ 使用 — 防止圖片未載入時的 layout 坍塌(CLS)"
        note="圖片 src 還沒 ready 時,若容器高度為 0,頁面 layout 會在載入後跳動(Cumulative Layout Shift 問題)。AspectRatio 鎖死比例 → 載入前後位置完全相同"
      >
        <div className="w-[320px]">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
            <Img seed="when-use-1" ratio={16 / 9} />
          </AspectRatio>
          <Label>↑ 載入後容器位置不跳動</Label>
        </div>
        <div className="w-[320px]">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md" />
          <Label>↑ 未載入狀態仍佔滿 16/9 空間</Label>
        </div>
      </Rule>

      <Rule
        title="✅ 使用 — 多張圖片需要統一比例(carousel / product grid)"
        note="輪播 / 產品列表各張圖原始比例不一,包 AspectRatio + object-cover 強制對齊,視覺整齊劃一"
      >
        <div className="grid grid-cols-3 gap-2 w-[480px]">
          {['grid-a', 'grid-b', 'grid-c'].map(s => (
            <AspectRatio key={s} ratio={1} className="bg-muted rounded-md overflow-hidden">
              <Img seed={s} ratio={1} />
            </AspectRatio>
          ))}
        </div>
        <Label>↑ 原圖比例不同,AspectRatio + object-cover 強制對齊成 1/1</Label>
      </Rule>

      <Rule
        title="❌ 不用 — content 高度本該隨內容變"
        note="AspectRatio 鎖死比例,無法 hug content。文字 / 表單 / 按鈕等 content-driven 高度的區塊不包"
      >
        <div className="w-[320px] border border-dashed border-error rounded-md p-4">
          <div className="text-body">標題文字</div>
          <div className="text-caption text-fg-muted mt-2">
            內容長度不固定的段落,包 AspectRatio 會強制裁切或留大片空白。
          </div>
        </div>
        <Label warn>↑ 此類 content 不該鎖比例</Label>
      </Rule>

      <Rule
        title="❌ 不用 — 圖片已固定 width + height 屬性"
        note="AspectRatio 是給 responsive(width=100%)場景。若 img 已寫死 200×200,直接用 img 即可"
      >
        <div className="p-4 border border-dashed border-error rounded-md">
          <img
            src="https://picsum.photos/seed/fixed-size/160/160"
            alt=""
            width={160}
            height={160}
            className="rounded-md"
          />
        </div>
        <Label warn>↑ 固定尺寸 img 不需要 AspectRatio 包裝</Label>
      </Rule>
    </div>

      {/* 何時不用 / 替代元件 — 原 WhenNotToUse */}
      <div>
      <Rule
        title="❌ 不用於 flex / grid layout"
        note="AspectRatio 是 container 鎖比例,不是佈局工具。多個元素並排用 flex / grid,不用 AspectRatio 排版"
      >
        <div className="w-[400px] border border-dashed border-error rounded-md p-4">
          <AspectRatio ratio={4 / 1} className="bg-muted rounded-md flex items-center justify-around">
            <div className="text-caption">Nike Pegasus 41</div>
            <div className="text-caption">Adidas UltraBoost</div>
            <div className="text-caption">New Balance 990</div>
          </AspectRatio>
        </div>
        <Label warn>↑ 用 AspectRatio 當橫排容器是誤用 → 用 flex gap-2</Label>
      </Rule>

      <Rule
        title="❌ 不放不該鎖比例的 content"
        note="文字 / 表單 / 按鈕等隨內容高度的 content 放進 AspectRatio,會強制裁切或留大片空白,違背語意"
      >
        <div className="w-[320px] border border-dashed border-error rounded-md p-2">
          <AspectRatio ratio={1} className="bg-muted rounded-md p-4">
            <div className="text-body font-bold mb-1">表單標題</div>
            <div className="text-caption text-fg-muted mb-2">這裡有一些說明文字,長度不固定。</div>
            <input className="border border-border rounded-md px-2 py-1 w-full" placeholder="輸入內容" />
          </AspectRatio>
        </div>
        <Label warn>↑ 表單內容不該鎖 1/1 比例</Label>
      </Rule>

      <Rule
        title="❌ 不重疊多層 AspectRatio"
        note="巢狀 AspectRatio 意義不明 — 外層比例與內層比例衝突時,結果無法預測"
      >
        <div className="w-[320px] border border-dashed border-error rounded-md p-2">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
            <AspectRatio ratio={1} className="bg-primary-subtle">
              <div className="w-full h-full flex items-center justify-center text-caption">
                內層 1/1 被外層 16/9 壓縮
              </div>
            </AspectRatio>
          </AspectRatio>
        </div>
        <Label warn>↑ 巢狀 AspectRatio 語意混亂,一律只包一層</Label>
      </Rule>
    </div>
    </div>
  ),
}

export const RatioChoice: Story = {
  name: 'DS 標準 ratio 選擇',
  render: () => (
    <div>
      <Rule
        title="16/9 — 寬螢幕 hero / feature 截圖 / video embed"
        note="最主流的 web hero ratio。Vercel / Airbnb / Linear hero section 標配;onboarding tour 截圖 Intercom / Pendo / Shepherd 慣例也是 16/9"
      >
        <div className="w-[360px]">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
            <Img seed="choice-16-9" ratio={16 / 9} />
          </AspectRatio>
          <Label>Airbnb listing hero / YouTube 縮圖</Label>
        </div>
      </Rule>

      <Rule
        title="4/3 — 產品照 / screenshot / 傳統照片"
        note="比 16/9 方一點。適合產品詳情、應用截圖、較老規格的照片"
      >
        <div className="w-[300px]">
          <AspectRatio ratio={4 / 3} className="bg-muted rounded-md overflow-hidden">
            <Img seed="choice-4-3" ratio={4 / 3} />
          </AspectRatio>
          <Label>Stripe product listing / Notion gallery cover</Label>
        </div>
      </Rule>

      <Rule
        title="1/1 — Avatar / 方圖貼文 / icon preview"
        note="方形是 feed grid 對齊的最佳選擇;Instagram / Dribbble / Pinterest thumbnail 慣例"
      >
        <div className="w-[240px]">
          <AspectRatio ratio={1} className="bg-muted rounded-md overflow-hidden">
            <Img seed="choice-1-1" ratio={1} />
          </AspectRatio>
          <Label>Instagram 貼文 / Dribbble shot 縮圖</Label>
        </div>
      </Rule>

      <Rule
        title="3/4 — 直式 portrait / 手機截圖"
        note="人像照、直式海報、手機螢幕截圖;比 1/1 略瘦,呈現「站立」視覺"
      >
        <div className="w-[220px]">
          <AspectRatio ratio={3 / 4} className="bg-muted rounded-md overflow-hidden">
            <Img seed="choice-3-4" ratio={3 / 4} />
          </AspectRatio>
          <Label>人物 portrait / iOS App Store screenshot</Label>
        </div>
      </Rule>

      <Rule
        title="21/9 — Ultra-wide hero banner / movie poster"
        note="強化「電影感」的超寬幅;首頁 hero / marketing banner / 影片封面 cinematic 版本"
      >
        <div className="w-[420px]">
          <AspectRatio ratio={21 / 9} className="bg-muted rounded-md overflow-hidden">
            <Img seed="choice-21-9" ratio={21 / 9} />
          </AspectRatio>
          <Label>Netflix 首頁 hero / 電影海報</Label>
        </div>
      </Rule>
    </div>
  ),
}

export const ChildrenFillRule: Story = {
  name: 'children 要填滿容器',
  render: () => (
    <div>
      <Rule
        title="✅ 正確 — children 加 w-full h-full object-cover"
        note="AspectRatio 本身不強制 children 尺寸;consumer 必須加 w-full h-full 讓 children 佔滿 + object-cover 防變形"
      >
        <div className="w-[320px]">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
            <img
              src="https://picsum.photos/seed/fill-correct/800/450"
              alt=""
              className="w-full h-full object-cover"
            />
          </AspectRatio>
          <Label>圖片填滿容器,裁切超出部分</Label>
        </div>
      </Rule>

      <Rule
        title="❌ 錯誤 — children 沒加 w-full h-full"
        note="img 預設 inline-size,不會撐滿容器 → AspectRatio 鎖的空間內出現空白"
      >
        <div className="w-[320px]">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
            <img
              src="https://picsum.photos/seed/fill-wrong/100/100"
              alt=""
            />
          </AspectRatio>
          <Label warn>↑ 左上角小圖 + 大片空白</Label>
        </div>
      </Rule>
    </div>
  ),
}

export const PlaceholderAndSkeleton: Story = {
  name: 'bg-muted placeholder 與 Skeleton 的分界',
  render: () => (
    <div>
      <Rule
        title="bg-muted — 簡單 placeholder 色(載入前的「空間佔位」)"
        note="AspectRatio 本身無色彩,consumer 慣例套 bg-muted 作為低成本 placeholder — 只表達「這裡會有圖」,無 loading 動態"
      >
        <div className="w-[320px]">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md" />
          <Label>靜態灰底 — 圖片尚未載入的預設色</Label>
        </div>
      </Rule>

      <Rule
        title="Skeleton — 明確的 loading state(脈動動畫)"
        note="當需要明確告訴使用者「正在載入」,AspectRatio 疊 Skeleton:AspectRatio 負責鎖比例,Skeleton 負責表達 loading 狀態"
      >
        <div className="w-[320px]">
          <AspectRatio ratio={16 / 9} className="rounded-md overflow-hidden">
            <Skeleton className="w-full h-full" />
          </AspectRatio>
          <Label>AspectRatio(鎖比例)+ Skeleton(loading 動畫)</Label>
        </div>
      </Rule>

      <Rule
        title="分界 — 兩者可疊用,職責不同"
        note="AspectRatio = container 鎖比例(解決 CLS);Skeleton = loading state 視覺。「鎖比例」與「標示 loading」是兩個獨立問題,疊用是 canonical pattern"
      >
        <div className="grid grid-cols-3 gap-3 w-[480px]">
          {[1, 2, 3].map(i => (
            <AspectRatio key={i} ratio={1} className="rounded-md overflow-hidden">
              <Skeleton className="w-full h-full" />
            </AspectRatio>
          ))}
        </div>
        <Label>↑ Product grid loading state — 三格 1/1 + Skeleton</Label>
      </Rule>
    </div>
  ),
}

