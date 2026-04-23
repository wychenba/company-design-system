import * as React from 'react'
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch'
import type { FileRendererProps } from './file-viewer-types'

/**
 * ImageRenderer — FileViewer 的圖片 renderer。
 *
 * ── 世界級 zoom semantic canonical(2026-04-21 重寫)──
 * Figma / Preview.app / Adobe Acrobat / Google Drive 共通:
 *   - `100%` = image natural pixel size(**非** CSS contain-scaled)
 *   - 開圖預設 fit-to-page(image 自動 fit,zoom input 顯示 fit % 如 40%)
 *   - `fit-to-width` = image width 填滿 container width(portrait 會 overflow 垂直)
 *   - `fit-to-page` = image 完整可見(contain semantic)
 *   - `+/-` preset 改 zoom 對應 natural 倍率,精準
 *
 * ── 實作細節 ──
 * image 不走 CSS `object-contain`(那會 pre-scale,導致 transform.scale 解讀錯誤);
 * 改走 **natural size + transform scale 管實際顯示**。onLoad 時算 fit-page scale
 * 再 `onZoomChange(fitPct)` 將 UI zoom 同步到真實倍率。
 *
 * ── 為什麼消費 react-zoom-pan-pinch ──
 * Zoom + pan 是行為 primitive;自寫 pinch / wheel 踩大量 edge case
 * (trackpad vs mouse / momentum / bounds),library 是 canonical 解法
 * (世界級 Figma Community / Miro embed / PhotoSwipe 同類流派)。
 */

const MIN_SCALE = 0.1 // 10%
const MAX_SCALE = 4.0 // 400%

type FitMode = 'fit-width' | 'fit-page'

export const ImageRenderer: React.FC<FileRendererProps> = ({
  file,
  zoom,
  onZoomChange,
  fitRequest,
  onCapabilitiesChange,
}) => {
  const apiRef = React.useRef<ReactZoomPanPinchRef | null>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [loaded, setLoaded] = React.useState(false)

  // 宣告 capability — shell 用此決定 toolbar 內容。
  React.useEffect(() => {
    onCapabilitiesChange({ zoom: true })
  }, [onCapabilitiesChange])

  // 算 fit scale(container 寬高 / image natural 寬高)
  const computeFitScale = React.useCallback((fit: FitMode): number | null => {
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container) return null
    if (!img.naturalWidth || !img.naturalHeight) return null
    const cw = container.clientWidth
    const ch = container.clientHeight
    if (cw <= 0 || ch <= 0) return null
    const widthRatio = cw / img.naturalWidth
    const heightRatio = ch / img.naturalHeight
    // fit-width = 寬填滿;fit-page = 完整可見(取較小 scale)
    return fit === 'fit-width' ? widthRatio : Math.min(widthRatio, heightRatio)
  }, [])

  const clampToPct = React.useCallback((scale: number): number => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
    // Floor 而非 round:fit-to-page / fit-to-width 時 scale 是 float(e.g. 0.8356)。
    // round(0.8356 * 100) = 84 → 實際 scale 0.84 → image 比 canvas 大 4px,垂直溢出破壞
    // 對稱置中(user 抓:「上下邊距不對稱」)。Floor → 0.83 → image 比 canvas 小,永遠
    // 完整可見 + 視覺 symmetric padding。代價是最多 ~1% 的空間餘量,視覺幾乎看不出。
    return Math.floor(clamped * 100)
  }, [])

  // Image onLoad → 自動 fit-to-page(世界級開圖預設)
  const handleImageLoad = React.useCallback(() => {
    setLoaded(true)
    const scale = computeFitScale('fit-page')
    if (scale == null) return
    const pct = clampToPct(scale)
    // 等 transform 就緒再更新(避免 initialScale=1 → fit 過程跳兩段)
    requestAnimationFrame(() => {
      onZoomChange(pct)
    })
  }, [computeFitScale, clampToPct, onZoomChange])

  // 外部 zoom 變動(preset / ± / 打字 / fit request)→ centerView 重定位
  // library canonical `centerView` 同時處理 scale + 置中 + animation + bounds。
  React.useEffect(() => {
    const api = apiRef.current
    if (!api || !loaded) return
    const currentScale = api.state.scale
    const targetScale = zoom / 100
    if (Math.abs(currentScale - targetScale) < 0.005) return
    api.centerView(targetScale, 200)
  }, [zoom, loaded])

  // Fit request(toolbar 菜單點 fit-width / fit-page)→ 算 scale emit 回 shell
  React.useEffect(() => {
    if (!fitRequest || !loaded) return
    const scale = computeFitScale(fitRequest.fit)
    if (scale == null) return
    onZoomChange(clampToPct(scale))
  }, [fitRequest, loaded, computeFitScale, clampToPct, onZoomChange])

  // 內部 wheel / pinch zoom → 同步回 shell
  const handleTransformed = React.useCallback(
    (_ref: ReactZoomPanPinchRef, state: { scale: number }) => {
      const nextZoom = Math.round(state.scale * 100)
      if (nextZoom !== zoom) onZoomChange(nextZoom)
    },
    [zoom, onZoomChange],
  )

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <TransformWrapper
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={apiRef as any}
        initialScale={1}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        centerOnInit
        centerZoomedOut
        // Teams 對標(2026-04-23):image viewer 走 chat-app lightbox 慣例 —
        // drag 時 image 保持在 canvas bounds 內(zoom-fit 時 drag 無意義,zoom-in 時 drag pan 有限制)。
        // `limitToBounds=true` 跟 Microsoft Teams / Slack / iOS Photos 等 chat-lightbox 互動一致,
        // 避免 Figma-canvas 式「可 drag 到任意位置」的無界體驗混淆 viewer 語境。
        limitToBounds={true}
        // Wheel zoom canonical:
        // - `step: 0.03` = 每 tick ~3% scale,對齊 Figma / Preview.app 細緻度
        //   (原 0.1 = 10% 太粗,接近 Google Slides 離散慣例)
        // - `smoothStep: 0.005` = trackpad 連續 zoom 不跳格
        // - multiplicative 等距:library 內部 scale factor 乘算,log 視覺等距
        wheel={{ step: 0.03, smoothStep: 0.005 }}
        doubleClick={{ mode: 'reset' }}
        onTransform={handleTransformed}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="!w-full !h-full flex items-center justify-center"
        >
          <img
            ref={imgRef}
            src={file.url}
            alt={file.name}
            onLoad={handleImageLoad}
            draggable={false}
            // natural size(**不走 object-contain**)— transform scale 管實際顯示大小
            className="max-w-none max-h-none select-none"
            style={{ pointerEvents: 'none' }}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
ImageRenderer.displayName = 'ImageRenderer'

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'ico'])

/** 判斷檔案是否可用 ImageRenderer 渲染。 */
export function canRenderImage(file: { mimeType: string; name: string }): boolean {
  if (file.mimeType.startsWith('image/')) return true
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext ? IMAGE_EXTS.has(ext) : false
}
