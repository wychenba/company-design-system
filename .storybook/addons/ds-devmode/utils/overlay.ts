/**
 * Redline overlay rendered inside the canvas iframe document.
 * Built imperatively (no React) — cheap + no iframe bundling concerns.
 */
const OVERLAY_ID = '__ds_devmode_overlay__'

interface DrawOptions {
  element: Element
  mode: 'live' | 'pin'
  label?: string
  /** Figma-style sibling distance:pin mode hover 到其他元素時畫 edge-to-edge gap */
  sibling?: Element | null
}

const ensureRoot = (): HTMLElement => {
  let root = document.getElementById(OVERLAY_ID) as HTMLElement | null
  if (root) return root
  root = document.createElement('div')
  root.id = OVERLAY_ID
  root.style.cssText = `
    position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;
    font: 11px -apple-system, 'SF Pro Text', system-ui, sans-serif;
  `
  document.body.appendChild(root)
  return root
}

const makeDiv = (cssText: string, text?: string) => {
  const d = document.createElement('div')
  d.style.cssText = cssText
  if (text != null) d.textContent = text
  return d
}

// Visibility halo — 2px white shadow ring around elements ensures redlines /
// outlines remain readable on any bg(white / dark / busy / colored)。
// World-class 對照:Chrome ruler / Figma annotation / Photoshop guides 3+。
const HALO_LABEL = '0 0 0 2px #fff, 0 1px 4px rgba(0,0,0,0.4)'
const HALO_OUTLINE = '0 0 0 2px rgba(255,255,255,0.85), 0 0 0 4px rgba(0,0,0,0.15)'

const distanceLabel = (value: number, left: string, top: string, transform: string) =>
  makeDiv(
    `position:absolute;left:${left};top:${top};transform:${transform};
     background:#EC4436;color:#fff;padding:2px 7px;border-radius:3px;
     font-weight:700;font-size:11px;line-height:1.4;
     box-shadow:${HALO_LABEL};white-space:nowrap;z-index:1;`,
    String(Math.round(value)),
  )

// Distance line — 2px solid + white halo box-shadow(取代 dashed 1px,visibility 強化)
// 1px dashed 在 retina + busy bg 幾乎看不見;2px solid + halo 任何 bg 上都清楚。
const redLine = (cssText: string) =>
  makeDiv(
    `position:absolute;background:#EC4436;
     box-shadow:0 0 0 1px rgba(255,255,255,0.85);
     ${cssText}`,
  )

/**
 * T-cap(短 perpendicular line)在 distance line 兩端,讓起終點 unambiguous。
 * World-class:Figma / Sketch / Zeplin / Adobe XD / CAD 5+ 家共識。
 *
 * Horizontal distance line(width=W,height=2px):兩端各加 vertical 短 stub
 * Vertical distance line(width=2px,height=H):兩端各加 horizontal 短 stub
 *
 * cap-length = 8px(視覺平衡,不擋元素也不太短)
 */
const T_CAP = 8

const tCapVertical = (centerX: number, centerY: number) =>
  makeDiv(
    `position:absolute;left:${centerX - 1}px;top:${centerY - T_CAP / 2}px;
     width:2px;height:${T_CAP}px;background:#EC4436;
     box-shadow:0 0 0 1px rgba(255,255,255,0.85);pointer-events:none;`,
  )

const tCapHorizontal = (centerX: number, centerY: number) =>
  makeDiv(
    `position:absolute;left:${centerX - T_CAP / 2}px;top:${centerY - 1}px;
     width:${T_CAP}px;height:2px;background:#EC4436;
     box-shadow:0 0 0 1px rgba(255,255,255,0.85);pointer-events:none;`,
  )

/**
 * Dimension extension line(從元素邊延伸的短 perpendicular line)。
 * CAD / drafting / Chrome DevTools 慣例,讓「測量從哪元素邊出發」一目了然。
 * 比 distance line 更細(1px,半透明)避免 noise,但仍 visible halo。
 */
const EXTENSION_LEN = 6
const extensionLine = (cssText: string) =>
  makeDiv(
    `position:absolute;background:rgba(236,68,54,0.5);
     box-shadow:0 0 0 1px rgba(255,255,255,0.7);
     ${cssText}`,
  )

const paddingHatch = (left: number, top: number, width: number, height: number) => {
  if (width <= 0 || height <= 0) return null
  return makeDiv(
    `position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;
     background:repeating-linear-gradient(-45deg,rgba(0,101,234,0.55) 0 4px,rgba(0,101,234,0.2) 4px 8px);
     pointer-events:none;`,
  )
}

const paddingLabel = (val: number, left: number, top: number) =>
  makeDiv(
    `position:absolute;left:${left}px;top:${top}px;transform:translate(-50%,-50%);
     color:#fff;font-weight:500;font-size:11px;text-shadow:0 1px 2px rgba(0,0,0,0.5);
     pointer-events:none;`,
    String(Math.round(val)),
  )

export function clearOverlay() {
  const root = document.getElementById(OVERLAY_ID)
  if (root) root.remove()
}

/**
 * Sibling-to-sibling edge-to-edge 距離計算 + 繪製(Figma-style)。
 *
 * 4 種空間關係:
 * - B 在 A 右邊(B.left ≥ A.right) → horizontal gap = B.left - A.right
 * - B 在 A 左邊(B.right ≤ A.left) → horizontal gap = A.left - B.right
 * - B 在 A 下方(B.top ≥ A.bottom) → vertical gap = B.top - A.bottom
 * - B 在 A 上方(B.bottom ≤ A.top) → vertical gap = A.top - B.bottom
 *
 * 兩軸獨立計算,可能都畫(diagonal)或只一軸(aligned)或都不畫(overlap / contain)。
 */
function drawSiblingDistance(root: HTMLElement, a: DOMRect, b: DOMRect) {
  // sibling outline(青 cyan,跟主元素 purple 對比,Figma 慣例)
  root.appendChild(
    makeDiv(
      `position:absolute;left:${b.left - 1}px;top:${b.top - 1}px;
       width:${b.width}px;height:${b.height}px;
       border:2px solid #00A8B3;box-shadow:0 0 0 2px rgba(255,255,255,0.85), 0 0 0 4px rgba(0,168,179,0.25);
       box-sizing:content-box;pointer-events:none;`,
    ),
  )

  // Horizontal axis(左 / 右)— T-caps + extension lines + main line + label
  if (b.left >= a.right) {
    // B 在 A 右邊
    const gap = b.left - a.right
    if (gap >= 1) {
      const yTop = Math.max(a.top, b.top)
      const yBot = Math.min(a.bottom, b.bottom)
      const y = yTop <= yBot ? (yTop + yBot) / 2 : (a.top + a.bottom + b.top + b.bottom) / 4
      // Main horizontal line
      root.appendChild(redLine(`left:${a.right}px;top:${y}px;width:${gap}px;height:2px;`))
      // T-caps at both endpoints
      root.appendChild(tCapVertical(a.right, y))
      root.appendChild(tCapVertical(b.left, y))
      // Extension lines from element edges(若 measurement y 不在 element vertical 範圍內才畫)
      if (y < a.top || y > a.bottom) {
        const eyTop = Math.min(a.bottom, y)
        const eyBot = Math.max(a.bottom, y)
        root.appendChild(extensionLine(`left:${a.right - 1}px;top:${eyTop}px;width:2px;height:${eyBot - eyTop}px;`))
      }
      if (y < b.top || y > b.bottom) {
        const eyTop = Math.min(b.top, y)
        const eyBot = Math.max(b.top, y)
        root.appendChild(extensionLine(`left:${b.left - 1}px;top:${eyTop}px;width:2px;height:${eyBot - eyTop}px;`))
      }
      root.appendChild(distanceLabel(gap, `${a.right + gap / 2}px`, `${y}px`, 'translate(-50%,-50%)'))
    }
  } else if (b.right <= a.left) {
    // B 在 A 左邊
    const gap = a.left - b.right
    if (gap >= 1) {
      const yTop = Math.max(a.top, b.top)
      const yBot = Math.min(a.bottom, b.bottom)
      const y = yTop <= yBot ? (yTop + yBot) / 2 : (a.top + a.bottom + b.top + b.bottom) / 4
      root.appendChild(redLine(`left:${b.right}px;top:${y}px;width:${gap}px;height:2px;`))
      root.appendChild(tCapVertical(b.right, y))
      root.appendChild(tCapVertical(a.left, y))
      if (y < a.top || y > a.bottom) {
        const eyTop = Math.min(a.top, y)
        const eyBot = Math.max(a.top, y)
        root.appendChild(extensionLine(`left:${a.left - 1}px;top:${eyTop}px;width:2px;height:${eyBot - eyTop}px;`))
      }
      if (y < b.top || y > b.bottom) {
        const eyTop = Math.min(b.bottom, y)
        const eyBot = Math.max(b.bottom, y)
        root.appendChild(extensionLine(`left:${b.right - 1}px;top:${eyTop}px;width:2px;height:${eyBot - eyTop}px;`))
      }
      root.appendChild(distanceLabel(gap, `${b.right + gap / 2}px`, `${y}px`, 'translate(-50%,-50%)'))
    }
  }

  // Vertical axis(上 / 下)— T-caps + extension lines + main line + label
  if (b.top >= a.bottom) {
    // B 在 A 下方
    const gap = b.top - a.bottom
    if (gap >= 1) {
      const xLeft = Math.max(a.left, b.left)
      const xRight = Math.min(a.right, b.right)
      const x = xLeft <= xRight ? (xLeft + xRight) / 2 : (a.left + a.right + b.left + b.right) / 4
      root.appendChild(
        makeDiv(
          `position:absolute;left:${x}px;top:${a.bottom}px;width:2px;height:${gap}px;
           background:#EC4436;box-shadow:0 0 0 1px rgba(255,255,255,0.85);pointer-events:none;`,
        ),
      )
      root.appendChild(tCapHorizontal(x, a.bottom))
      root.appendChild(tCapHorizontal(x, b.top))
      if (x < a.left || x > a.right) {
        const exLeft = Math.min(a.right, x)
        const exRight = Math.max(a.right, x)
        root.appendChild(extensionLine(`left:${exLeft}px;top:${a.bottom - 1}px;height:2px;width:${exRight - exLeft}px;`))
      }
      if (x < b.left || x > b.right) {
        const exLeft = Math.min(b.left, x)
        const exRight = Math.max(b.left, x)
        root.appendChild(extensionLine(`left:${exLeft}px;top:${b.top - 1}px;height:2px;width:${exRight - exLeft}px;`))
      }
      root.appendChild(distanceLabel(gap, `${x}px`, `${a.bottom + gap / 2}px`, 'translate(-50%,-50%)'))
    }
  } else if (b.bottom <= a.top) {
    // B 在 A 上方
    const gap = a.top - b.bottom
    if (gap >= 1) {
      const xLeft = Math.max(a.left, b.left)
      const xRight = Math.min(a.right, b.right)
      const x = xLeft <= xRight ? (xLeft + xRight) / 2 : (a.left + a.right + b.left + b.right) / 4
      root.appendChild(
        makeDiv(
          `position:absolute;left:${x}px;top:${b.bottom}px;width:2px;height:${gap}px;
           background:#EC4436;box-shadow:0 0 0 1px rgba(255,255,255,0.85);pointer-events:none;`,
        ),
      )
      root.appendChild(tCapHorizontal(x, b.bottom))
      root.appendChild(tCapHorizontal(x, a.top))
      if (x < a.left || x > a.right) {
        const exLeft = Math.min(a.left, x)
        const exRight = Math.max(a.left, x)
        root.appendChild(extensionLine(`left:${exLeft}px;top:${a.top - 1}px;height:2px;width:${exRight - exLeft}px;`))
      }
      if (x < b.left || x > b.right) {
        const exLeft = Math.min(b.right, x)
        const exRight = Math.max(b.right, x)
        root.appendChild(extensionLine(`left:${exLeft}px;top:${b.bottom - 1}px;height:2px;width:${exRight - exLeft}px;`))
      }
      root.appendChild(distanceLabel(gap, `${x}px`, `${b.bottom + gap / 2}px`, 'translate(-50%,-50%)'))
    }
  }
}

export function drawOverlay({ element, mode, label, sibling }: DrawOptions) {
  clearOverlay()
  const root = ensureRoot()
  root.dataset.mode = mode

  const rect = element.getBoundingClientRect()
  const siblingRect = sibling && sibling !== element ? sibling.getBoundingClientRect() : null
  // 當 sibling 存在時,不畫 parent distance(避免視覺混亂),專注 A↔B 測量
  const parent = siblingRect ? null : (element.parentElement?.getBoundingClientRect() ?? null)
  const cs = getComputedStyle(element)
  const pad = {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  }

  // 1. Purple outline around element
  const outline = makeDiv(
    `position:absolute;left:${rect.left - 1}px;top:${rect.top - 1}px;
     width:${rect.width}px;height:${rect.height}px;
     border:2px solid #B668FF;box-shadow:0 0 0 2px rgba(255,255,255,0.85), 0 0 0 4px rgba(182,104,255,0.25);
     box-sizing:content-box;`,
  )
  root.appendChild(outline)

  // 2. Padding hatching (4 sides, non-overlapping)
  if (pad.top > 0) {
    const n = paddingHatch(rect.left, rect.top, rect.width, pad.top)
    if (n) root.appendChild(n)
  }
  if (pad.bottom > 0) {
    const n = paddingHatch(rect.left, rect.bottom - pad.bottom, rect.width, pad.bottom)
    if (n) root.appendChild(n)
  }
  if (pad.left > 0) {
    const n = paddingHatch(rect.left, rect.top + pad.top, pad.left, rect.height - pad.top - pad.bottom)
    if (n) root.appendChild(n)
  }
  if (pad.right > 0) {
    const n = paddingHatch(
      rect.right - pad.right,
      rect.top + pad.top,
      pad.right,
      rect.height - pad.top - pad.bottom,
    )
    if (n) root.appendChild(n)
  }

  // Padding value labels (center of each hatch)
  if (pad.top >= 10) root.appendChild(paddingLabel(pad.top, rect.left + rect.width / 2, rect.top + pad.top / 2))
  if (pad.bottom >= 10)
    root.appendChild(paddingLabel(pad.bottom, rect.left + rect.width / 2, rect.bottom - pad.bottom / 2))
  if (pad.left >= 10)
    root.appendChild(paddingLabel(pad.left, rect.left + pad.left / 2, rect.top + rect.height / 2))
  if (pad.right >= 10)
    root.appendChild(paddingLabel(pad.right, rect.right - pad.right / 2, rect.top + rect.height / 2))

  // 3. Distance to parent (red lines + T-caps + labels)
  if (parent) {
    // vertical line through element center to top/bottom
    const cx = rect.left + rect.width / 2
    // top
    if (rect.top > parent.top) {
      root.appendChild(redLine(`left:${cx}px;top:${parent.top}px;width:2px;height:${rect.top - parent.top}px;`))
      root.appendChild(tCapHorizontal(cx, parent.top))
      root.appendChild(tCapHorizontal(cx, rect.top))
      root.appendChild(
        distanceLabel(rect.top - parent.top, `${cx}px`, `${parent.top + (rect.top - parent.top) / 2}px`, 'translate(-50%,-50%)'),
      )
    }
    // bottom
    if (rect.bottom < parent.bottom) {
      root.appendChild(redLine(`left:${cx}px;top:${rect.bottom}px;width:2px;height:${parent.bottom - rect.bottom}px;`))
      root.appendChild(tCapHorizontal(cx, rect.bottom))
      root.appendChild(tCapHorizontal(cx, parent.bottom))
      root.appendChild(
        distanceLabel(
          parent.bottom - rect.bottom,
          `${cx}px`,
          `${rect.bottom + (parent.bottom - rect.bottom) / 2}px`,
          'translate(-50%,-50%)',
        ),
      )
    }
    const cy = rect.top + rect.height / 2
    // left
    if (rect.left > parent.left) {
      root.appendChild(redLine(`left:${parent.left}px;top:${cy}px;width:${rect.left - parent.left}px;height:2px;`))
      root.appendChild(tCapVertical(parent.left, cy))
      root.appendChild(tCapVertical(rect.left, cy))
      root.appendChild(
        distanceLabel(rect.left - parent.left, `${parent.left + (rect.left - parent.left) / 2}px`, `${cy}px`, 'translate(-50%,-50%)'),
      )
    }
    // right
    if (rect.right < parent.right) {
      root.appendChild(redLine(`left:${rect.right}px;top:${cy}px;width:${parent.right - rect.right}px;height:2px;`))
      root.appendChild(tCapVertical(rect.right, cy))
      root.appendChild(tCapVertical(parent.right, cy))
      root.appendChild(
        distanceLabel(
          parent.right - rect.right,
          `${rect.right + (parent.right - rect.right) / 2}px`,
          `${cy}px`,
          'translate(-50%,-50%)',
        ),
      )
    }
    // parent outline (faint dashed)
    root.appendChild(
      makeDiv(
        `position:absolute;left:${parent.left}px;top:${parent.top}px;width:${parent.width}px;height:${parent.height}px;
         border:1px dashed rgba(182,104,255,0.4);pointer-events:none;box-sizing:border-box;`,
      ),
    )
  }

  // 3b. Sibling distance(Figma-style,只在 sibling 存在時畫)
  if (siblingRect) {
    drawSiblingDistance(root, rect, siblingRect)
  }

  // 4. Property badge(默認 top,若太靠頂邊切換到 bottom 防 clip)
  if (label) {
    const badgeAbove = rect.top - 24 >= 4
    const badgeTop = badgeAbove ? rect.top - 24 : rect.bottom + 4
    const badge = makeDiv(
      `position:absolute;left:${rect.left}px;top:${badgeTop}px;
       background:#B668FF;color:#fff;padding:2px 8px;border-radius:4px;
       font-size:11px;font-weight:500;display:inline-flex;align-items:center;gap:4px;
       box-shadow:0 2px 6px rgba(0,0,0,0.2);pointer-events:none;white-space:nowrap;`,
      label,
    )
    // diamond icon
    const icon = makeDiv(
      `width:8px;height:8px;background:#fff;transform:rotate(45deg);display:inline-block;margin-right:2px;`,
    )
    badge.prepend(icon)
    root.appendChild(badge)
  }
}
