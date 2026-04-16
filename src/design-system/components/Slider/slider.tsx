import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Slider — 數值範圍選取器
 *
 * 基於 Radix Slider primitive,橋接設計系統 token。詳細設計原則見 `slider.spec.md`。
 *
 * ── 核心設計 ──
 * 1. **視覺單一**:track 厚度、thumb 直徑、ring 尺寸都是固定值,不隨 `size` 變
 * 2. **`size` 只控容器外高**:對齊 Field family 的 `h-field-*` tier,讓 Slider 能跟
 *    Input / NumberInput / Select 在 Field 內並排對齊
 * 3. **Range mode 免費**:Radix 原生支援 `value: number[]`,傳多值自動多 thumb
 * 4. **Hover / active 用 elevation 陰影**:不用色變,避免暗示「這是 button」
 */

const sliderRootVariants = cva(
  // 容器外層:水平置中 + relative(Radix 會絕對定位內部元素)
  // flex items-center 讓 track+thumb 在任何 field-height 下都垂直置中
  //
  // ── Disabled 策略:灰階 token swap(對齊 Button / Checkbox)──
  // Slider 的藍色 range 是美學視覺,不是 semantic state——使用者從 disabled
  // slider 需要辨識的是 thumb 位置 + range 長度,這兩者不依賴顏色。失去藍色
  // 沒有資訊損失。
  //
  // 跟 Switch 的差別:Switch 的 on/off 是純顏色差異(沒有形狀差異),所以必須
  // 靠 opacity 保留色彩身分。Slider 的位置/長度是形狀差異,不需要保留顏色身分,
  // 跟 Checkbox(checkmark 形狀 = semantic 載體)同類,應該走灰階。
  //
  // 詳細判準見 `slider.spec.md` 的「Disabled 策略」章節。
  [
    'relative flex items-center w-full min-w-0 touch-none select-none',
    'data-[disabled]:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        sm: 'h-field-sm',
        md: 'h-field-md',
        lg: 'h-field-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export interface SliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'children'>,
    VariantProps<typeof sliderRootVariants> {}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, size, value, defaultValue, ...props }, ref) => {
  // 推導要渲染幾個 thumb:controlled 用 value,uncontrolled 用 defaultValue,
  // 都沒有時 fallback 單 thumb(Radix 預設行為)
  const thumbCount =
    (Array.isArray(value) && value.length) ||
    (Array.isArray(defaultValue) && defaultValue.length) ||
    1

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      className={cn(sliderRootVariants({ size }), className)}
      {...props}
    >
      {/*
        Track — 凹槽底線,rest / disabled **都用 `bg-muted`**(shadcn Badge /
        skeleton 同家族的 subtle bg 語意)。顏色不隨 state 變動——track 的語意
        是「告訴使用者這條線是 slider 可滑動範圍」,這個語意 enabled / disabled
        都成立,所以色也不該變。
      */}
      <SliderPrimitive.Track className={cn(
        'relative grow overflow-hidden rounded-full h-1',
        // Rest:bg-secondary(n-3,「微淡可辨」的 subtle fill,跟 Tag neutral / Badge low 同級)
        // Disabled:bg-muted(n-2,「disabled-like 退化」底色)
        'bg-secondary data-[disabled]:bg-muted',
      )}>
        {/*
          Range — 填滿段。

          ── Range 色 = Thumb border 色(語意一致) ──
          Rest 兩者都是 `primary`,disabled 兩者都是 `border`(n-5)。為什麼要一致?
          Range 是「填充視覺」,Thumb border 是「thumb 的輪廓線」——視覺上 thumb
          的 border 剛好是 range 的延續(thumb 坐落在 range 的端點上,border 跟
          range 在色彩上融為一體,看起來像「range 包住 thumb」而不是「thumb 浮在
          range 上」)。兩個 token 綁在一起,不論什麼 state 都一致。
        */}
        <SliderPrimitive.Range
          className={cn(
            'absolute h-full bg-primary',
            'data-[disabled]:bg-border',
          )}
        />
      </SliderPrimitive.Track>

      {/*
        Thumb — N 個(由 thumbCount 決定)。
        白底 + 2px 邊框,邊框色 = Range 色(**一致綁定**):
          - Rest: `border-primary` ↔ Range `bg-primary`
          - Disabled: `border-border` ↔ Range `bg-border`
        這個一致性讓 thumb border 跟 range 融為一體,看起來像「range 包住 thumb」
        的連續視覺。thumb 的白底則是「被 range 圍住的空心洞」,讓 thumb 的位置
        清楚浮出。不論 state,thumb border 跟 range 永遠同色。

        **為什麼 thumb bg 不能改**:`bg-surface`(白)必須在 rest / disabled 都維持,
        否則會融入 track 的 `bg-muted` 裡消失。這是之前踩過的同色融色 bug
        (曾經寫成 `data-[disabled]:bg-muted` 讓 thumb 跟 track 完全融合)。
      */}
      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            'block h-4 w-4 shrink-0 rounded-full cursor-grab',
            'bg-surface border-2 border-primary',
            'transition-all duration-150',
            // Hover:border 加深到 primary-hover + elevation 陰影
            'hover:border-primary-hover hover:[box-shadow:var(--elevation-100)]',
            'active:cursor-grabbing active:border-primary-hover active:[box-shadow:var(--elevation-200)]',
            // Focus:soft primary halo(不用 ring,避免 border + ring-offset 三層同心圓）
            'outline-none focus-visible:[box-shadow:0_0_0_4px_var(--primary-subtle)]',
            // Disabled:border 跟 Range 一起退成 border(n-5),bg 保留 bg-surface
            'data-[disabled]:cursor-not-allowed data-[disabled]:border-border',
            'data-[disabled]:hover:[box-shadow:none]',
          )}
          aria-label={thumbCount > 1 ? `Thumb ${i + 1}` : undefined}
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = 'Slider'

export { Slider, sliderRootVariants }
