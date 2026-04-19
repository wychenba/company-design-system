import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Rating } from './rating'

const meta: Meta<typeof Rating> = {
  title: 'Design System/Components/Rating/展示',
  component: Rating,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '星星評分元件——離散 1–5 分。interactive 送出評分 / readOnly 展示平均分；precision full 整星 / half 半星。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Rating>

/* ── 商品列表的平均分（Amazon / Shopify 風格）── */
export const ReadOnlyProductRating: Story = {
  name: '商品列表平均分',
  render: () => (
    <div className="flex flex-col gap-4 w-[420px]">
      {[
        { name: 'AirPods Pro (第二代)', rating: 4.7, count: 12843 },
        { name: 'Kindle Paperwhite', rating: 4.5, count: 8921 },
        { name: 'Anker 快充行動電源 20000mAh', rating: 4.8, count: 23104 },
        { name: 'UNIQLO 輕量羽絨外套', rating: 4.2, count: 592 },
      ].map((p) => (
        <div key={p.name} className="flex items-center gap-3 p-3 border border-border rounded-md bg-surface">
          <div className="flex-1 min-w-0">
            <div className="text-body font-medium truncate">{p.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <Rating
                value={p.rating}
                readOnly
                precision="half"
                size="sm"
                aria-label={`平均評分 ${p.rating} 星，共 5 星,${p.count} 則評論`}
              />
              <span className="text-caption text-fg-secondary">{p.rating}</span>
              <span className="text-caption text-fg-muted">({p.count.toLocaleString()})</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
}

/* ── 送出評分 flow（Yelp / Google Reviews 風格）── */
export const InteractiveReview: Story = {
  name: '送出評分 Flow',
  render: () => {
    const ReviewForm = () => {
      const [rating, setRating] = useState(0)
      const labels = ['', '很差', '不佳', '普通', '不錯', '很棒']
      return (
        <div className="flex flex-col gap-4 w-[420px] p-5 border border-border rounded-md bg-surface">
          <div className="text-body font-semibold">為這次服務評分</div>
          <p className="text-caption text-fg-muted">
            台北信義區 · 鼎泰豐 · 2026/04/15 用餐
          </p>
          <div className="flex items-center gap-3 py-2">
            <Rating
              value={rating}
              onChange={setRating}
              size="lg"
              precision="full"
              aria-label="為這次用餐給 1 到 5 星"
            />
            <span className="text-body text-fg-secondary min-w-[48px]">
              {labels[rating] ?? ''}
            </span>
          </div>
          <div className="flex items-center gap-2 justify-end pt-1">
            <button
              type="button"
              disabled={rating === 0}
              className="h-field-md px-3 rounded-md bg-primary text-white text-body font-medium disabled:opacity-disabled disabled:cursor-not-allowed"
            >
              送出評分
            </button>
          </div>
        </div>
      )
    }
    return <ReviewForm />
  },
}

/* ── 尺寸對照 ── */
export const SizeVariants: Story = {
  name: '尺寸對照',
  render: () => (
    <div className="flex flex-col gap-6 w-[520px]">
      <div className="flex flex-col gap-2">
        <span className="text-caption font-medium text-fg-secondary">sm — 商品列表、DataTable cell 內</span>
        <div className="flex items-center gap-3 p-3 border border-border rounded-md">
          <Rating value={4.5} readOnly precision="half" size="sm" aria-label="平均 4.5 星" />
          <span className="text-caption text-fg-secondary">4.5</span>
          <span className="text-caption text-fg-muted">(8,921)</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-caption font-medium text-fg-secondary">md — 一般卡片、評論列表（預設）</span>
        <div className="flex items-center gap-3 p-3 border border-border rounded-md">
          <Rating value={5} readOnly size="md" aria-label="這則評論 5 星" />
          <span className="text-caption text-fg-muted">王小明 · 2 天前</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-caption font-medium text-fg-secondary">lg — 送出評分 form 的主 CTA 區</span>
        <div className="flex items-center gap-3 p-4 border border-border rounded-md">
          <Rating defaultValue={0} size="lg" aria-label="為這次用餐評分" />
        </div>
      </div>
    </div>
  ),
}

/* ── Disabled 狀態 ── */
export const DisabledState: Story = {
  name: 'Disabled 狀態',
  render: () => (
    <div className="flex flex-col gap-4 w-[420px]">
      <p className="text-caption text-fg-muted">
        評分期限已過的舊訂單，Rating 顯示使用者當初給的分數但無法再修改。
      </p>
      <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-surface">
        <div className="flex-1">
          <div className="text-body font-medium">鼎泰豐 · 2025/11/03 訂單</div>
          <div className="text-caption text-fg-muted mt-0.5">評分期限已過</div>
        </div>
        <Rating value={4} disabled aria-label="此訂單已完成評分 4 星，無法修改" />
      </div>
    </div>
  ),
}
