/**
 * Canvas-side entry. Runs inside the Storybook iframe.
 * Listens for mode changes, binds DOM listeners, emits inspect payload,
 * renders redline overlay.
 */
import { addons } from '@storybook/preview-api'
import { measureElement } from './utils/dom-geometry'
import { extractComputed } from './utils/computed-style'
import { annotateWithTokens, extractSourceVars, extractAllAuthorDecls } from './utils/token-reverse-lookup'
import { drawOverlay, clearOverlay, toggleLabels } from './utils/overlay'
import { EVENTS, type DevmodeMode, type ForceState, type InspectPayload } from './constants'

let mode: DevmodeMode = 'off'
let pinnedEl: Element | null = null
let hoverEl: Element | null = null
/** pin 模式下的 sibling hover target(Figma-style distance measurement) */
let siblingHoverEl: Element | null = null

/**
 * Pseudo-class force-state(2026-04-25):對齊 Chrome / Firefox / Safari Inspector
 * 「force element state」idiom。實作 trick:對 pinned element 加 inline style
 * 直接 mimic 該 state(無法真 force browser pseudo-class,但 visual approximation 足)。
 * 限制:只 mimic 可被 JS 讀取的 state class declarations(:hover / :focus / :active
 * 在 stylesheet 中的 visible properties)。
 */
let forceState: ForceState = 'none'

const findStateRules = (el: Element, state: 'hover' | 'focus' | 'active'): string => {
  // 走 matched stylesheet rules,找 selector 含 :hover / :focus / :active 的 rules
  // 把 pseudo-class 從 selector 拿掉檢查 base selector 是否 match,然後 collect declarations
  const collected: string[] = []
  const pseudo = `:${state}`
  function walk(rules: CSSRuleList | undefined) {
    if (!rules) return
    for (const rule of Array.from(rules)) {
      const nested = (rule as { cssRules?: CSSRuleList }).cssRules
      if (nested) walk(nested)
      if (!(rule instanceof CSSStyleRule)) continue
      const sel = rule.selectorText
      if (!sel?.includes(pseudo)) continue
      // 把 :hover 拿掉檢查 base selector 是否 match el
      const baseSelector = sel.replaceAll(pseudo, '').replaceAll(`:not(${pseudo})`, '').trim()
      if (!baseSelector) continue
      try {
        if (el.matches(baseSelector)) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style.item(i)
            const val = rule.style.getPropertyValue(prop)
            collected.push(`${prop}: ${val}${rule.style.getPropertyPriority(prop) ? ' !important' : ''}`)
          }
        }
      } catch {
        // invalid selector after pseudo strip, skip
      }
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    try { walk(sheet.cssRules) } catch { /* CORS */ }
  }
  return collected.join('; ')
}

const applyForceState = (state: ForceState) => {
  if (!pinnedEl || !(pinnedEl instanceof HTMLElement)) return
  // Clear previous force-state inline styles
  pinnedEl.removeAttribute('data-ds-devmode-forced')
  if (state === 'none') {
    pinnedEl.style.cssText = pinnedEl.dataset.dsDevmodePrevStyle ?? ''
    delete pinnedEl.dataset.dsDevmodePrevStyle
    return
  }
  // Backup original inline style first time
  if (!('dsDevmodePrevStyle' in pinnedEl.dataset)) {
    pinnedEl.dataset.dsDevmodePrevStyle = pinnedEl.style.cssText || ''
  }
  const rules = findStateRules(pinnedEl, state)
  pinnedEl.style.cssText = (pinnedEl.dataset.dsDevmodePrevStyle ?? '') + ';' + rules
  pinnedEl.setAttribute('data-ds-devmode-forced', state)
}

/**
 * Touch device detection(2026-04-25 mobile 支援):
 * - 觸控裝置上 hover 不 fire,Live 模式無效;改 default tap-to-pin UX
 * - 從 hover events 第一次觸發起計次,搭配 navigator 偵測
 */
const isTouchDevice = (): boolean => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(hover: none)').matches
  )
}

const channel = addons.getChannel()

const isInspectableTarget = (t: EventTarget | null): t is Element => {
  if (!(t instanceof Element)) return false
  if (t.closest('#__ds_devmode_overlay__')) return false
  // skip storybook root wrappers
  if (t.id === 'storybook-root') return false
  return true
}

const build = (el: Element): InspectPayload => {
  const geom = measureElement(el)
  const computed = extractComputed(el)
  const merged: Record<string, string> = { ...computed.layout, ...computed.style }
  // Source-first(2026-04-25):author 在 stylesheet / inline style 寫的 var() 直接抓
  const sourceVars = extractSourceVars(el)
  // Reverse-lookup 降為 fallback hint(只在無 source var 時 candidates 用)
  const candidates = annotateWithTokens(merged)
  // Merge:source(authoritative)優先,reverse-lookup 補無 source 的 property
  const tokenUsage = Object.keys(merged).map(prop => {
    const src = sourceVars.get(prop)
    if (src) {
      // Author 寫了 token(可信)
      return {
        property: prop,
        raw: src.rawValue,
        tokens: src.tokens,
        resolved: src.resolved,
        source: 'author' as const,
      }
    }
    const cand = candidates.find(c => c.property === prop)
    if (cand) {
      // Reverse-lookup candidates(speculative,標明)
      return {
        property: prop,
        raw: cand.raw,
        tokens: cand.tokens,
        resolved: cand.resolved,
        source: 'speculative' as const,
      }
    }
    return null
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  // 完整 author CSS(2026-04-25):每個 author-written declaration 配 resolved 值
  const allAuthorDecls = extractAllAuthorDecls(el)
  const fullCs = getComputedStyle(el)
  const authorCss: InspectPayload['authorCss'] = []
  for (const [prop, decl] of allAuthorDecls) {
    authorCss.push({
      property: prop,
      rawValue: decl.rawValue,
      resolved: fullCs.getPropertyValue(prop).trim() || decl.rawValue,
      tokens: decl.tokens,
      fromSelector: decl.fromSelector,
    })
  }
  // Sort:含 token 的 author tokens 先,其餘 plain value 後;property name alphabetical 內排
  authorCss.sort((a, b) => {
    if (a.tokens.length && !b.tokens.length) return -1
    if (!a.tokens.length && b.tokens.length) return 1
    return a.property.localeCompare(b.property)
  })

  // Auto-layout context(2026-04-25):flex / grid container 才填
  const csForLayout = getComputedStyle(el)
  const display = csForLayout.display
  let autoLayout: InspectPayload['autoLayout'] = null
  if (display === 'flex' || display === 'inline-flex') {
    autoLayout = {
      display: 'flex',
      flexDirection: csForLayout.flexDirection,
      gap: csForLayout.gap,
      rowGap: csForLayout.rowGap,
      columnGap: csForLayout.columnGap,
      justifyContent: csForLayout.justifyContent,
      alignItems: csForLayout.alignItems,
      flexWrap: csForLayout.flexWrap,
    }
  } else if (display === 'grid' || display === 'inline-grid') {
    autoLayout = {
      display: 'grid',
      gap: csForLayout.gap,
      rowGap: csForLayout.rowGap,
      columnGap: csForLayout.columnGap,
      justifyContent: csForLayout.justifyContent,
      alignItems: csForLayout.alignItems,
      gridTemplateColumns: csForLayout.gridTemplateColumns,
      gridTemplateRows: csForLayout.gridTemplateRows,
    }
  }

  // Element breadcrumb chain(2026-04-25):從 storybook-root 父鏈到 element
  const breadcrumb: InspectPayload['breadcrumb'] = []
  let cur: Element | null = el
  while (cur && cur.id !== 'storybook-root' && cur !== document.body) {
    breadcrumb.unshift({
      tag: cur.tagName.toLowerCase(),
      id: cur.id || '',
      className: typeof cur.className === 'string' ? cur.className : (cur.className as SVGAnimatedString | undefined)?.baseVal ?? '',
    })
    cur = cur.parentElement
  }

  return {
    ...geom,
    computed: merged,
    tokenUsage,
    breadcrumb,
    autoLayout,
    authorCss,
    siblingDistance: null,
  }
}

/** Sibling distance helper(對齊 overlay.ts drawSiblingDistance 兩軸獨立邏輯) */
const computeSiblingDistance = (
  a: DOMRect,
  b: DOMRect,
): { horizontal: number | null; vertical: number | null } | null => {
  if (a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom) return null  // overlap
  let h: number | null = null
  let v: number | null = null
  if (b.left >= a.right) h = b.left - a.right
  else if (b.right <= a.left) h = a.left - b.right
  if (b.top >= a.bottom) v = b.top - a.bottom
  else if (b.bottom <= a.top) v = a.top - b.bottom
  if (h === null && v === null) return null
  return { horizontal: h, vertical: v }
}

const emit = (el: Element, sibling: Element | null = null) => {
  // Defensive:storybook 切 story 會 unmount 舊 subtree → pinnedEl detached。
  // detached element 的 getBoundingClientRect 全 0 + matches() 拋錯,直接清空 overlay 並
  // 重置 pin state(否則 panel 顯 0 × 0 的 ghost,user 困惑)。
  if (!el.isConnected) {
    if (pinnedEl === el) pinnedEl = null
    if (siblingHoverEl === el) siblingHoverEl = null
    if (hoverEl === el) hoverEl = null
    clearOverlay()
    return
  }
  const payload = build(el)
  if (sibling && sibling.isConnected && sibling !== el) {
    payload.siblingDistance = computeSiblingDistance(el.getBoundingClientRect(), sibling.getBoundingClientRect())
  }
  channel.emit(EVENTS.INSPECT, payload)
  drawOverlay({
    element: el,
    mode: mode === 'pin' ? 'pin' : 'live',
    label: payload.id ? `#${payload.id}` : payload.className ? `.${String(payload.className).split(/\s+/)[0]}` : payload.tag,
    sibling: sibling && sibling.isConnected ? sibling : null,
  })
}

const onMouseOver = (e: MouseEvent) => {
  if (!isInspectableTarget(e.target)) return
  const target = e.target as Element

  if (mode === 'live') {
    if (hoverEl === target) return
    hoverEl = target
    emit(hoverEl)
    return
  }

  // Pin mode:hover 其他元素時畫 sibling distance(Figma-style)
  if (mode === 'pin' && pinnedEl) {
    // Skip self / 不是 document body 層的 target 才畫
    if (target === pinnedEl) return
    // 避免 sibling 是 pinned 的祖先 / 後代(overlap 情況 Figma 也不畫 distance)
    if (pinnedEl.contains(target) || target.contains(pinnedEl)) {
      if (siblingHoverEl) {
        siblingHoverEl = null
        emit(pinnedEl)
      }
      return
    }
    if (siblingHoverEl === target) return
    siblingHoverEl = target
    emit(pinnedEl, siblingHoverEl)
  }
}

const onClick = (e: MouseEvent) => {
  if (mode === 'off') return
  if (!isInspectableTarget(e.target)) return
  e.preventDefault()
  e.stopPropagation()
  pinnedEl = e.target as Element
  mode = 'pin'
  channel.emit(EVENTS.TOGGLE, mode)
  emit(pinnedEl)
}

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!target) return false
  const el = target as HTMLElement
  if (!el.tagName) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (el.isContentEditable) return true
  return false
}

const onKey = (e: KeyboardEvent) => {
  // Alt+I toggles inspect
  if (e.altKey && (e.key === 'i' || e.key === 'I')) {
    e.preventDefault()
    const next: DevmodeMode = mode === 'off' ? (isTouchDevice() ? 'pin' : 'live') : 'off'
    setMode(next)
  }
  // Esc clears pin
  if (e.key === 'Escape' && mode === 'pin') {
    pinnedEl = null
    setMode(isTouchDevice() ? 'off' : 'live')
  }
  // `H` toggles redline labels(對齊 Chrome `Ctrl+hold` idiom — 暫清 label 看視覺對齊)。
  // 只在 inspect mode active 且 user 不在 input field 才響應(避免打字撞鍵)。
  if ((e.key === 'h' || e.key === 'H') && mode !== 'off' && !e.altKey && !e.metaKey && !e.ctrlKey
      && !isTypingTarget(e.target)) {
    e.preventDefault()
    toggleLabels()
  }
  // Arrow keys walk DOM tree(when pinned;Chrome DevTools idiom)
  if (mode === 'pin' && pinnedEl) {
    let next: Element | null = null
    if (e.key === 'ArrowUp') {
      // Parent
      next = pinnedEl.parentElement
      if (next?.id === 'storybook-root') next = null  // 不超過 storybook root
    } else if (e.key === 'ArrowDown') {
      // First child
      next = pinnedEl.firstElementChild
    } else if (e.key === 'ArrowLeft') {
      // Previous sibling
      next = pinnedEl.previousElementSibling
    } else if (e.key === 'ArrowRight') {
      // Next sibling
      next = pinnedEl.nextElementSibling
    }
    if (next) {
      e.preventDefault()
      pinnedEl = next
      siblingHoverEl = null
      emit(pinnedEl)
    }
  }
}

const bind = () => {
  // Touch device: skip mouseover binding(hover doesn't fire on touch),
  // 仍綁 click 為 tap-to-pin。Click event 在 touch 上會自動 synthesize 從 tap 來。
  if (!isTouchDevice()) {
    document.addEventListener('mouseover', onMouseOver, true)
  }
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKey, true)
}

const unbind = () => {
  document.removeEventListener('mouseover', onMouseOver, true)
  document.removeEventListener('click', onClick, true)
  document.removeEventListener('keydown', onKey, true)
}

const setMode = (next: DevmodeMode) => {
  mode = next
  channel.emit(EVENTS.TOGGLE, next)
  if (next === 'off') {
    clearOverlay()
    pinnedEl = null
    hoverEl = null
    siblingHoverEl = null
    channel.emit(EVENTS.CLEAR)
    unbind()
  } else {
    bind()
    siblingHoverEl = null
    if (next === 'live' && hoverEl) emit(hoverEl)
    if (next === 'pin' && pinnedEl) emit(pinnedEl)
  }
}

// Listen to manager → preview mode changes
channel.on(EVENTS.TOGGLE, (next: DevmodeMode) => {
  if (next !== mode) setMode(next)
})

channel.on(EVENTS.CLEAR, () => {
  if (pinnedEl) applyForceState('none')  // restore inline style before unpin
  pinnedEl = null
  hoverEl = null
  siblingHoverEl = null
  forceState = 'none'
  clearOverlay()
})

channel.on(EVENTS.FORCE_STATE, (state: ForceState) => {
  forceState = state
  applyForceState(state)
  if (pinnedEl) emit(pinnedEl, siblingHoverEl)  // re-emit to reflect new computed
})

// Keep overlay accurate on scroll / resize(含 sibling distance 同步)
window.addEventListener('scroll', () => {
  if (mode === 'pin' && pinnedEl) emit(pinnedEl, siblingHoverEl)
  else if (mode === 'live' && hoverEl) emit(hoverEl)
}, true)
window.addEventListener('resize', () => {
  if (mode === 'pin' && pinnedEl) emit(pinnedEl, siblingHoverEl)
  else if (mode === 'live' && hoverEl) emit(hoverEl)
})
