// @benchmark-unverified-blanket: file-level retraction per M22 (d) — claims herein not individually URL-cited; treat as unverified visual/usage rumor unless retrofit per-claim. Hook escape preserved.
import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AspectRatio } from './aspect-ratio'

/**
 * AspectRatio 展示——固定長寬比容器,常用於圖片 / 截圖 / illustration 鎖比例。
 * 展示範例對標世界級產品的真實情境(Airbnb listing hero、Stripe product 卡、
 * Instagram 方圖、YouTube cinematic banner),consumer 包 <img className="w-full
 * h-full object-cover" /> 是標準用法。設計規則詳見 `aspect-ratio.spec.md`。
 */

const meta: Meta = {
  title: 'Design System/Components/AspectRatio/展示',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

// ── Helpers ───────────────────────────────────────────────────────────────────

const Figure = ({
  children, caption,
}: { children: React.ReactNode; caption: string }) => (
  <figure className="flex flex-col gap-2">
    {children}
    <figcaption className="text-footnote text-fg-muted">{caption}</figcaption>
  </figure>
)

// ── Stories ───────────────────────────────────────────────────────────────────

export const HeroBanner16x9: Story = {
  name: '16:9 主視覺橫幅',
  render: () => (
    <div className="max-w-[720px]">
      <h3 className="text-body font-bold text-foreground mb-1">Airbnb listing hero</h3>
      <p className="text-caption text-fg-muted mb-5 max-w-[600px] leading-relaxed">
        寬螢幕影片、feature 截圖、listing cover 標配——16/9 是最主流的 web hero ratio(Vercel、Airbnb、Linear hero section)。
      </p>
      <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
        <img
          src="https://picsum.photos/seed/airbnb-hero/800/450"
          alt="Beachfront cottage in Santorini"
          className="w-full h-full object-cover"
        />
      </AspectRatio>
    </div>
  ),
}

export const ProductPhoto4x3: Story = {
  name: '4/3 產品照片 + CLS 對照',
  render: () => (
    <div className="flex flex-col gap-8 max-w-[900px]">
      <div>
        <h3 className="text-body font-bold text-foreground mb-1">Stripe product listing — 防 CLS 坍塌</h3>
        <p className="text-caption text-fg-muted mb-5 max-w-[600px] leading-relaxed">
          產品卡用 4/3 統一 thumbnail 高度。即使圖片還沒載入(或 src 無效),容器仍鎖死比例 → 頁面 layout 不跳動(CLS = 0)。
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { seed: 'headphones', title: 'Wireless Headphones', price: 'NT$ 3,990' },
            { seed: 'keyboard', title: 'Mechanical Keyboard', price: 'NT$ 5,490' },
            { seed: 'camera', title: 'Compact Camera', price: 'NT$ 12,800' },
          ].map(p => (
            <div key={p.seed} className="flex flex-col gap-2">
              <AspectRatio ratio={4 / 3} className="bg-muted rounded-lg overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/${p.seed}/600/450`}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
              </AspectRatio>
              <div className="text-body font-medium">{p.title}</div>
              <div className="text-caption text-fg-muted">{p.price}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-body font-bold text-foreground mb-1">對照:未載入狀態</h3>
        <p className="text-caption text-fg-muted mb-5 max-w-[600px] leading-relaxed">
          Src 未 ready 時,AspectRatio 仍維持 bg-muted 的 placeholder 空間,不坍塌成 0 高。
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <AspectRatio key={i} ratio={4 / 3} className="bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  ),
}

export const SquareAvatar1x1: Story = {
  name: '1:1 社群方形貼文',
  render: () => (
    <div className="max-w-[600px]">
      <h3 className="text-body font-bold text-foreground mb-1">Instagram-style 方形貼文</h3>
      <p className="text-caption text-fg-muted mb-5 max-w-[600px] leading-relaxed">
        方形貼文預覽、avatar、icon preview 標配——1/1 讓 feed grid 對齊一致。
      </p>
      <div className="grid grid-cols-3 gap-1">
        {['coffee', 'mountain', 'city', 'sunset', 'plant', 'food'].map(seed => (
          <AspectRatio key={seed} ratio={1} className="bg-muted overflow-hidden">
            <img
              src={`https://picsum.photos/seed/${seed}/400/400`}
              alt={seed}
              className="w-full h-full object-cover"
            />
          </AspectRatio>
        ))}
      </div>
    </div>
  ),
}

export const Ultrawide21x9: Story = {
  name: '21:9 影院橫幅',
  render: () => (
    <div className="max-w-[900px]">
      <h3 className="text-body font-bold text-foreground mb-1">YouTube cinematic / movie poster</h3>
      <p className="text-caption text-fg-muted mb-5 max-w-[600px] leading-relaxed">
        Ultra-wide hero banner、movie poster、影片縮圖 cinematic 版本——21/9 強化「電影感」寬幅視覺。
      </p>
      <AspectRatio ratio={21 / 9} className="bg-muted rounded-lg overflow-hidden">
        <img
          src="https://picsum.photos/seed/cinematic/1260/540"
          alt="Cinematic landscape banner"
          className="w-full h-full object-cover"
        />
      </AspectRatio>
    </div>
  ),
}

export const CommonRatios: Story = {
  name: '常用 比例 一覽',
  render: () => (
    <div className="flex flex-col gap-8 max-w-[720px]">
      <p className="text-caption text-fg-muted max-w-[600px] leading-relaxed">
        DS 標準 ratio 視覺對照——選擇對應情境的數值。
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Figure caption="16/9 — 寬螢幕 hero / 影片">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
            <img src="https://picsum.photos/seed/r16-9/640/360" alt="" className="w-full h-full object-cover" />
          </AspectRatio>
        </Figure>
        <Figure caption="4/3 — 產品照 / 截圖">
          <AspectRatio ratio={4 / 3} className="bg-muted rounded-md overflow-hidden">
            <img src="https://picsum.photos/seed/r4-3/600/450" alt="" className="w-full h-full object-cover" />
          </AspectRatio>
        </Figure>
        <Figure caption="1/1 — 方形 / avatar">
          <AspectRatio ratio={1} className="bg-muted rounded-md overflow-hidden">
            <img src="https://picsum.photos/seed/r1-1/400/400" alt="" className="w-full h-full object-cover" />
          </AspectRatio>
        </Figure>
        <Figure caption="3/4 — 直式 portrait">
          <AspectRatio ratio={3 / 4} className="bg-muted rounded-md overflow-hidden">
            <img src="https://picsum.photos/seed/r3-4/450/600" alt="" className="w-full h-full object-cover" />
          </AspectRatio>
        </Figure>
      </div>
    </div>
  ),
}
