import React from 'react'
import { useChannel } from '@storybook/manager-api'
import { EVENTS, type InspectPayload, type DevmodeMode, type ForceState } from './constants'

/**
 * Theme-aware text color(2026-05-01 修):
 * Storybook 8 用 `--sb-color-*` namespace,我們原 code 用 `--sb-fg` / `--sb-fg-muted`
 * 永遠 fallback 到 hard-coded `#1F2532` (dark)→ dark theme bg 上 invisible
 * (user 抓到此 bug,先前 #65727F canonicalize 不夠,fallback 本身就有問題)。
 *
 * 解法:自定 `--dm-fg` / `--dm-fg-muted` CSS variables,透過 `<style>` tag 注入
 * `@media (prefers-color-scheme: dark)` rule 切換 → 純 CSS,無 React state,
 * 切 OS theme 自動 reflow。fallback 仍保留 `#1F2532` / `#65727F`(light theme)。
 */
const ThemeStyleInjector: React.FC = () => (
  <style>{`
    .ds-devmode-root { --dm-fg: #1F2532; --dm-fg-muted: #65727F; }
    @media (prefers-color-scheme: dark) {
      .ds-devmode-root { --dm-fg: #E5E8EB; --dm-fg-muted: #9AA3AC; }
    }
  `}</style>
)

const styles: Record<string, React.CSSProperties> = {
  root: {
    padding: '12px 16px',
    fontSize: 11,  // 對齊 Chrome Styles panel 11px(原 12 偏鬆,精簡 + 資訊密度提升)
    fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
    color: 'var(--dm-fg, #1F2532)',
    height: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 10,  // section head 縮小:Chrome MetricsSidebarPane / Styles section labels 都 10px
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--dm-fg-muted, #65727F)',
    margin: '8px 0 4px',  // 從 12 6 緊湊到 8 4
  },
  badge: {
    display: 'inline-block',
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 3,
    background: 'rgba(0,101,234,0.12)',
    color: '#0065EA',
    fontWeight: 500,
  },
  anatomy: {
    position: 'relative',
    border: '1px solid rgba(128,128,128,0.25)',
    borderRadius: 6,
    padding: '24px 28px',  // 從 36 40 壓縮 — 更接近 Chrome MetricsSidebarPane 的 compact 派
    background: 'var(--sb-bg-subtle, rgba(0,0,0,0.02))',
    marginTop: 4,
  },
  distance: {
    // 跟 canvas distanceLabel 統一(white-bg + red text + 1px red outline),
    // 跨 canvas/panel 視覺一致,且不在淺橙 margin band 上「過度突出」。
    position: 'absolute',
    fontSize: 10,
    fontWeight: 700,
    color: '#EC4436',
    background: '#fff',
    padding: '0 3px',
    borderRadius: 2,
    boxShadow: '0 0 0 1px rgba(236,68,54,0.35)',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  },
  borderBox: {
    position: 'relative',
    border: '1px dashed rgba(184, 152, 0, 0.6)',
    padding: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paddingBox: {
    position: 'relative',
    border: '1px dashed rgba(147,196,125,0.7)',
    padding: 8,
    background: 'repeating-linear-gradient(-45deg, rgba(147,196,125,0.18) 0 3px, transparent 3px 6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--dm-fg-muted, #65727F)',
    fontSize: 11,
    minWidth: 120,
    minHeight: 40,
  },
  edgeLabel: {
    color: 'var(--dm-fg-muted, #65727F)',
    fontSize: 10,
    lineHeight: 1,
  },
  toggle: {
    display: 'inline-flex',
    border: '1px solid rgba(128,128,128,0.35)',
    borderRadius: 4,
    overflow: 'hidden',
    fontSize: 11,
  },
  toggleBtn: (active: boolean): React.CSSProperties => ({
    padding: '3px 10px',
    cursor: 'pointer',
    background: active ? 'rgba(0,101,234,0.15)' : 'transparent',
    color: active ? '#0065EA' : 'var(--dm-fg, #1F2532)',
    border: 0,
    fontWeight: active ? 600 : 400,
    fontFamily: 'inherit',
  }),
  code: {
    background: 'var(--sb-bg-subtle, rgba(0,0,0,0.04))',
    border: '1px solid rgba(128,128,128,0.2)',
    borderRadius: 4,
    padding: '8px 10px',
    fontFamily: '"SF Mono", Menlo, Consolas, monospace',
    fontSize: 11,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    counterReset: 'ln',
  },
  codeRow: {
    display: 'grid',
    gridTemplateColumns: '18px 1fr',
    gap: 8,
  },
  codeLn: {
    color: 'var(--dm-fg-muted, #65727F)',
    userSelect: 'none',
  },
  tokenChip: {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: 2,
    verticalAlign: -1,
    marginRight: 4,
    border: '1px solid rgba(128,128,128,0.3)',
  },
  copy: {
    cursor: 'pointer',
    background: 'transparent',
    border: 0,
    color: 'var(--dm-fg-muted, #65727F)',
    padding: 2,
    borderRadius: 3,
    fontSize: 12,
  },
  empty: {
    color: 'var(--dm-fg-muted, #65727F)',
    fontSize: 12,
    padding: '24px 0',
    textAlign: 'center',
  },
  modeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(128,128,128,0.2)',
    marginBottom: 8,
  },
}

type ViewMode = 'list' | 'code'

const isColor = (v: string) => /^(#|rgba?\(|hsla?\()/i.test(v.trim())
const extractColor = (v: string) => {
  const m = v.match(/(rgba?\([^)]+\)|#[0-9a-f]{3,8}\b|hsla?\([^)]+\))/i)
  return m ? m[0] : null
}

const propsOrder = [
  'display', 'position',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'flex', 'flex-direction', 'gap',
  'justify-content', 'align-items',
  'color', 'background', 'background-color',
  'border', 'border-width', 'border-style', 'border-color', 'border-radius',
  'box-shadow', 'opacity',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
] as const

const sortEntries = (groups: Record<string, string>): [string, string][] =>
  Object.entries(groups).sort((a, b) => {
    const ai = propsOrder.indexOf(a[0] as (typeof propsOrder)[number])
    const bi = propsOrder.indexOf(b[0] as (typeof propsOrder)[number])
    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

const layoutKeys = new Set([
  'display', 'position', 'width', 'height', 'min-width', 'min-height',
  'max-width', 'max-height',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'flex', 'flex-direction', 'flex-wrap', 'gap', 'row-gap', 'column-gap',
  'justify-content', 'align-items', 'align-self',
  'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
])

const splitByGroup = (cs: Record<string, string>) => {
  const layout: Record<string, string> = {}
  const style: Record<string, string> = {}
  for (const [k, v] of Object.entries(cs)) {
    ;(layoutKeys.has(k) ? layout : style)[k] = v
  }
  return { layout, style }
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* ignore */
  }
}

type TokenByPropEntry = { tokens: string[]; resolved: string; source: 'author' | 'speculative'; raw?: string }

type TokenByPropEntryWithRaw = TokenByPropEntry & { raw?: string }

/**
 * Render author raw expression(calc / var combo)— 高亮全 var() token name
 * + 在右側 → 接 resolved value。對齊 Chrome / FF / Safari「raw → resolved」idiom。
 *
 * 例:`calc((var(--field-height-sm) - 16px - 2px) / 2)` → `5px`
 *      ─ var token highlighted with underline + tooltip resolved chain
 *      ─ calc / px / numeric 部分維持原 raw 文字
 *      ─ 整段右側接「→ 5px」 顯實際值
 */
const renderAuthorRaw = (raw: string, resolved: string, tokensByProp: TokenByPropEntryWithRaw): React.ReactNode => {
  // 切割 raw 成 segments:var() 部分 highlighted,其餘 plain
  const parts: React.ReactNode[] = []
  const re = /var\((--[a-zA-Z0-9-_]+)(?:,\s*([^)]+))?\)/g
  let lastIdx = 0
  let m: RegExpExecArray | null
  let segIdx = 0
  while ((m = re.exec(raw))) {
    if (m.index > lastIdx) {
      parts.push(<span key={`p-${segIdx++}`}>{raw.slice(lastIdx, m.index)}</span>)
    }
    const tokenName = m[1]
    const fallback = m[2]
    parts.push(
      <span key={`v-${segIdx++}`} style={{ color: '#7A4EE8' }}>
        var(
        <span
          title={`token: ${tokenName}\nresolved: ${resolved}`}
          style={{ color: '#C4423A', textDecoration: 'underline', textDecorationStyle: 'solid' }}
        >
          {tokenName}
        </span>
        {fallback ? <>, <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>{fallback}</span></> : null}
        )
      </span>
    )
    lastIdx = re.lastIndex
  }
  if (lastIdx < raw.length) {
    parts.push(<span key={`p-${segIdx++}`}>{raw.slice(lastIdx)}</span>)
  }
  return (
    <>
      <span style={{ fontFamily: '"SF Mono", Menlo, monospace' }}>{parts}</span>
      <span style={{ color: 'var(--dm-fg-muted, #65727F)', margin: '0 6px' }}>→</span>
      <strong style={{ color: 'var(--dm-fg, #1F2532)' }}>{resolved}</strong>
    </>
  )
}

const renderValue = (
  prop: string,
  v: string,
  tokenByProp: Map<string, TokenByPropEntry>,
): React.ReactNode => {
  const hit = tokenByProp.get(prop)
  const color = extractColor(v)

  // 'author' source = stylesheet 真實寫的 var()(可能含 calc / 多 var) — 顯完整 raw → resolved
  if (hit && hit.tokens.length && hit.source === 'author') {
    return (
      <>
        {color && isColor(color) && (
          <span style={{ ...styles.tokenChip, background: color }} />
        )}
        {renderAuthorRaw(hit.raw || `var(${hit.tokens[0]})`, hit.resolved, hit)}
      </>
    )
  }

  // 'speculative' source = reverse-lookup 推測,作 hint 顯示為淡灰 + 註記 candidate
  if (hit && hit.tokens.length && hit.source === 'speculative') {
    const allTokens = hit.tokens.length > 1 ? `${hit.tokens.length} candidates` : hit.tokens[0]
    return (
      <>
        {color && isColor(color) && (
          <span style={{ ...styles.tokenChip, background: color }} />
        )}
        <span>{v}</span>
        <span
          title={`同值 token candidates(speculative,author 沒寫 var()):${hit.tokens.join(', ')}`}
          style={{ marginLeft: 6, fontSize: 10, color: 'var(--dm-fg-muted, #65727F)', fontStyle: 'italic' }}
        >
          ⓘ {allTokens}
        </span>
      </>
    )
  }

  // No token info — pure computed value
  return (
    <>
      {color && isColor(color) && (
        <span style={{ ...styles.tokenChip, background: color }} />
      )}
      <span>{v}</span>
    </>
  )
}

const Section: React.FC<{
  title: string
  entries: [string, string][]
  view: ViewMode
  tokenByProp: Map<string, TokenByPropEntry>
}> = ({ title, entries, view, tokenByProp }) => {
  if (!entries.length) return null
  const codeText = entries
    .map(([k, v]) => {
      const hit = tokenByProp.get(k)
      // Code view:author source 顯完整 raw expression(calc + var combo)→ resolved 註釋
      // Speculative 不顯避免 misleading copy-paste
      let display: string
      if (hit && hit.tokens.length && hit.source === 'author') {
        const raw = hit.raw || `var(${hit.tokens[0]})`
        // Show "raw  /* → resolved */" if raw differs from resolved (formula present)
        display = raw === hit.resolved ? raw : `${raw};  /* → ${hit.resolved} */`
        return `${k}: ${display.replace(/;\s*\/\*/, ' /* ')};`  // clean repeat ;
      }
      display = v
      return `${k}: ${display};`
    })
    .join('\n')
  return (
    <section>
      <div style={styles.sectionHead}>
        <span>{title}</span>
        <button
          style={styles.copy}
          onClick={() => copyText(codeText)}
          title="Copy section"
          aria-label={`Copy ${title}`}
        >
          ⧉
        </button>
      </div>
      {view === 'list' ? (
        <div style={styles.code}>
          {entries.map(([k, v], i) => (
            <div key={k} style={styles.codeRow}>
              <span style={styles.codeLn}>{i + 1}</span>
              <span>
                <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>{k}</span>
                {': '}
                {renderValue(k, v, tokenByProp)}
                {';'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <pre style={{ ...styles.code, margin: 0 }}>{codeText}</pre>
      )}
    </section>
  )
}

const AnatomyBox: React.FC<{ payload: InspectPayload }> = ({ payload }) => {
  const { distancesToParent, padding, margin, border, position, rect } = payload
  const isPositioned = position && position.type !== 'static'
  const w = Math.round(rect.width)
  const h = Math.round(rect.height)
  // Content size = rect - border - padding(對齊 Chrome DevTools box model 第 4 層 inner-most)。
  // 之前未扣 border → 有 border 元件(Tag / FileItem rich / Input)content size 偏大 2px,
  // 跟 Storybook addon-measure(扣 border)對不上;修正使我們 = Chrome = addon-measure 三方一致。
  const iw = Math.max(0, w - padding.left - padding.right - border.left - border.right)
  const ih = Math.max(0, h - padding.top - padding.bottom - border.top - border.bottom)
  // Margin layer container — Chrome 4-rect box model:margin → border → padding → content
  // (+ position outer layer 對齊 Chrome `MetricsSidebarPane.ts` 5-layer model:position →
  //   margin → border → padding → content,non-static element 才顯 position 層)
  const marginOuter: React.CSSProperties = {
    position: 'relative',
    border: '1px dashed rgba(155, 99, 0, 0.45)',
    padding: 14,
    background: 'repeating-linear-gradient(45deg, rgba(247, 142, 30, 0.08) 0 3px, transparent 3px 6px)',
    marginTop: isPositioned ? 14 : 4,
  }
  const positionOuter: React.CSSProperties = {
    position: 'relative',
    border: '1px dotted rgba(123, 68, 196, 0.5)',
    padding: 14,
    background: 'rgba(123, 68, 196, 0.04)',
    marginTop: 4,
  }
  const positionFmt = (v: string) => v === 'auto' || v === '' ? '—' : v
  const anatomy = (
    <div style={marginOuter}>
      <span style={{ ...styles.edgeLabel, position: 'absolute', top: -9, left: 8, background: 'var(--sb-bg, #fff)', padding: '0 4px', color: '#A36100' }}>
        Margin {margin.top}/{margin.right}/{margin.bottom}/{margin.left}
      </span>
      <div style={styles.anatomy}>
        {distancesToParent && (
          <>
            <div style={{ ...styles.distance, top: 6, left: '50%', transform: 'translateX(-50%)' }}>
              {distancesToParent.top}
            </div>
            <div style={{ ...styles.distance, bottom: 6, left: '50%', transform: 'translateX(-50%)' }}>
              {distancesToParent.bottom}
            </div>
            <div style={{ ...styles.distance, left: 6, top: '50%', transform: 'translateY(-50%)' }}>
              {distancesToParent.left}
            </div>
            <div style={{ ...styles.distance, right: 6, top: '50%', transform: 'translateY(-50%)' }}>
              {distancesToParent.right}
            </div>
          </>
        )}
        <div style={styles.borderBox}>
          <span style={{ ...styles.edgeLabel, position: 'absolute', top: -9, left: 8, background: 'var(--sb-bg, #fff)', padding: '0 4px' }}>
            Border {border.top}/{border.right}/{border.bottom}/{border.left}
          </span>
          <span style={{ ...styles.edgeLabel, color: '#558B2F' }}>{padding.left}</span>
          <div style={styles.paddingBox}>
            <span style={{ ...styles.edgeLabel, position: 'absolute', top: -9, left: 8, background: 'var(--sb-bg, #fff)', padding: '0 4px', color: '#558B2F' }}>
              Padding
            </span>
            {/* Padding top — center 上方(對齊 Chrome devtools-frontend Box Model 4 邊全顯示
                 idiom;canvas 不畫 per-side padding 數字,Panel 必須是 canonical) */}
            <span style={{ ...styles.edgeLabel, position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', color: '#558B2F' }}>
              {padding.top}
            </span>
            <span style={{ color: 'var(--dm-fg, #1F2532)', fontWeight: 500 }}>{`${iw} × ${ih}`}</span>
            {/* Padding bottom — center 下方 */}
            <span style={{ ...styles.edgeLabel, position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', color: '#558B2F' }}>
              {padding.bottom}
            </span>
          </div>
          <span style={{ ...styles.edgeLabel, color: '#558B2F' }}>{padding.right}</span>
        </div>
        <div style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 10, color: 'var(--dm-fg-muted, #65727F)' }}>
          border-box
        </div>
      </div>
    </div>
  )
  if (!isPositioned) return anatomy
  return (
    <div style={positionOuter}>
      <span style={{ ...styles.edgeLabel, position: 'absolute', top: -9, left: 8, background: 'var(--sb-bg, #fff)', padding: '0 4px', color: '#7B44C4' }}>
        Position {position!.type} · {positionFmt(position!.top)}/{positionFmt(position!.right)}/{positionFmt(position!.bottom)}/{positionFmt(position!.left)}
      </span>
      {anatomy}
    </div>
  )
}

const AutoLayoutSection: React.FC<{ autoLayout: NonNullable<InspectPayload['autoLayout']> }> = ({ autoLayout }) => {
  const isFlex = autoLayout.display === 'flex'
  return (
    <>
      <div style={styles.sectionHead}>
        <span>Auto-layout</span>
        <span style={{ ...styles.badge, background: isFlex ? 'rgba(0,168,179,0.12)' : 'rgba(123,68,196,0.12)', color: isFlex ? '#00A8B3' : '#7B44C4' }}>
          {autoLayout.display}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px 12px', fontSize: 11, padding: '6px 0' }}>
        {isFlex && autoLayout.flexDirection && (
          <>
            <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>direction</span>
            <code>{autoLayout.flexDirection}</code>
          </>
        )}
        {autoLayout.gap && autoLayout.gap !== 'normal' && autoLayout.gap !== '0px' && (
          <>
            <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>gap</span>
            <code>{autoLayout.gap}</code>
          </>
        )}
        {autoLayout.justifyContent && autoLayout.justifyContent !== 'normal' && (
          <>
            <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>justify</span>
            <code>{autoLayout.justifyContent}</code>
          </>
        )}
        {autoLayout.alignItems && autoLayout.alignItems !== 'normal' && (
          <>
            <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>align</span>
            <code>{autoLayout.alignItems}</code>
          </>
        )}
        {isFlex && autoLayout.flexWrap && autoLayout.flexWrap !== 'nowrap' && (
          <>
            <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>wrap</span>
            <code>{autoLayout.flexWrap}</code>
          </>
        )}
        {!isFlex && autoLayout.gridTemplateColumns && autoLayout.gridTemplateColumns !== 'none' && (
          <>
            <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>columns</span>
            <code style={{ wordBreak: 'break-all' }}>{autoLayout.gridTemplateColumns}</code>
          </>
        )}
        {!isFlex && autoLayout.gridTemplateRows && autoLayout.gridTemplateRows !== 'none' && (
          <>
            <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>rows</span>
            <code style={{ wordBreak: 'break-all' }}>{autoLayout.gridTemplateRows}</code>
          </>
        )}
      </div>
    </>
  )
}

export const DsDevmodePanel: React.FC<{ active: boolean }> = ({ active }) => {
  const [payload, setPayload] = React.useState<InspectPayload | null>(null)
  const [view, setView] = React.useState<ViewMode>('list')
  const [mode, setMode] = React.useState<DevmodeMode>('off')
  const [forceState, setForceState] = React.useState<ForceState>('none')

  const emit = useChannel({
    [EVENTS.INSPECT]: (p: InspectPayload) => setPayload(p),
    [EVENTS.TOGGLE]: (m: DevmodeMode) => setMode(m),
    [EVENTS.CLEAR]: () => { setPayload(null); setForceState('none') },
  })

  if (!active) return null

  const tokenByProp = new Map<string, TokenByPropEntry>()
  payload?.tokenUsage.forEach(t => tokenByProp.set(t.property, { tokens: t.tokens, resolved: t.resolved, source: t.source, raw: t.raw }))
  const groups = payload ? splitByGroup(payload.computed) : { layout: {}, style: {} }

  const setModeAndBroadcast = (next: DevmodeMode) => {
    setMode(next)
    emit(EVENTS.TOGGLE, next)
    if (next === 'off') emit(EVENTS.CLEAR)
  }

  const setForceStateAndBroadcast = (next: ForceState) => {
    setForceState(next)
    emit(EVENTS.FORCE_STATE, next)
  }

  return (
    <div className="ds-devmode-root" style={styles.root}>
      <ThemeStyleInjector />
      <div style={styles.modeRow}>
        <strong style={{ fontSize: 12 }}>DS Devmode</strong>
        <div style={styles.toggle} role="group" aria-label="Inspect mode">
          <button style={styles.toggleBtn(mode === 'off')} onClick={() => setModeAndBroadcast('off')}>Off</button>
          <button style={styles.toggleBtn(mode === 'live')} onClick={() => setModeAndBroadcast('live')}>Live</button>
          <button style={styles.toggleBtn(mode === 'pin')} onClick={() => setModeAndBroadcast('pin')} disabled={!payload}>Pin</button>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--dm-fg-muted, #65727F)' }}>
          Alt+I toggle · Esc unpin · ↑↓←→ DOM · <b style={{ color: '#EC4436' }}>hover 別元素 = 量距</b> · H 暫清 · 觸控 tap pin
        </span>
      </div>

      {!payload && (
        <div style={styles.empty}>
          {mode === 'off'
            ? 'Off. Toggle Live/Pin, click an element to inspect.'
            : mode === 'live'
              ? 'Hover any canvas element.'
              : 'Click a canvas element to pin — 之後 hover 其他元素自動測距(Figma-style)。'}
        </div>
      )}

      {payload && (
        <>
          {/* Element tree breadcrumb(Chrome DevTools 風)*/}
          {payload.breadcrumb && payload.breadcrumb.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 8, fontSize: 10, color: 'var(--dm-fg-muted, #65727F)' }}>
              {payload.breadcrumb.map((crumb, i) => {
                const isLast = i === payload.breadcrumb.length - 1
                const label = `${crumb.tag}${crumb.id ? `#${crumb.id}` : ''}${crumb.className ? `.${String(crumb.className).split(/\s+/).filter(Boolean)[0]}` : ''}`
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <span>›</span>}
                    <span style={{ color: isLast ? 'var(--dm-fg, #1F2532)' : undefined, fontWeight: isLast ? 600 : 400 }}>
                      {label}
                    </span>
                  </React.Fragment>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={styles.badge}>{payload.tag}</span>
            {payload.id && <code style={{ fontSize: 11 }}>#{payload.id}</code>}
            {payload.className && (() => {
              const classes = String(payload.className).split(/\s+/).filter(Boolean)
              // Truncate long class lists(button 常 50+ class)— first 5 + count,
              // <details> let user 展開看全。對齊 Chrome Styles panel 同 idiom。
              if (classes.length <= 5) {
                return (
                  <code style={{ fontSize: 11, color: 'var(--dm-fg-muted, #65727F)', wordBreak: 'break-all' }}>
                    .{classes.join(' .')}
                  </code>
                )
              }
              return (
                <details style={{ fontSize: 11, color: 'var(--dm-fg-muted, #65727F)', flex: 1, minWidth: 0 }}>
                  <summary style={{ cursor: 'pointer', listStyle: 'none', wordBreak: 'break-all' }}>
                    <code>.{classes.slice(0, 5).join(' .')}</code>
                    <span style={{ color: 'var(--dm-fg-muted, #65727F)', marginLeft: 4 }}>(+{classes.length - 5} more)</span>
                  </summary>
                  <code style={{ display: 'block', wordBreak: 'break-all', marginTop: 4, paddingLeft: 4, borderLeft: '2px solid rgba(128,128,128,0.2)' }}>
                    .{classes.slice(5).join(' .')}
                  </code>
                </details>
              )
            })()}
            <button
              style={{ ...styles.copy, marginLeft: 'auto' }}
              onClick={() => {
                const allCss = Object.entries(payload.computed)
                  .map(([k, v]) => {
                    const hit = tokenByProp.get(k)
                    if (hit && hit.tokens.length && hit.source === 'author') {
                      const raw = hit.raw || `var(${hit.tokens[0]})`
                      return raw === hit.resolved
                        ? `${k}: ${raw};`
                        : `${k}: ${raw}; /* → ${hit.resolved} */`
                    }
                    return `${k}: ${v};`
                  })
                  .join('\n')
                const sel = `${payload.tag}${payload.id ? `#${payload.id}` : ''}${payload.className ? `.${String(payload.className).split(/\s+/).filter(Boolean).join('.')}` : ''}`
                copyText(`${sel} {\n${allCss}\n}`)
              }}
              title="Copy all CSS as rule"
              aria-label="Copy all CSS"
            >
              ⧉ Copy all CSS
            </button>
          </div>

          {/* Force pseudo-class state(Chrome 「:hov」force state idiom) */}
          {mode === 'pin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--dm-fg-muted, #65727F)' }}>:state</span>
              <div style={styles.toggle} role="group" aria-label="Force pseudo-class state">
                <button style={styles.toggleBtn(forceState === 'none')} onClick={() => setForceStateAndBroadcast('none')}>none</button>
                <button style={styles.toggleBtn(forceState === 'hover')} onClick={() => setForceStateAndBroadcast('hover')}>:hover</button>
                <button style={styles.toggleBtn(forceState === 'focus')} onClick={() => setForceStateAndBroadcast('focus')}>:focus</button>
                <button style={styles.toggleBtn(forceState === 'active')} onClick={() => setForceStateAndBroadcast('active')}>:active</button>
              </div>
            </div>
          )}

          <div style={styles.sectionHead}>
            <span>Layer properties</span>
            <span style={{ fontSize: 11, color: 'var(--dm-fg-muted, #65727F)', fontWeight: 400 }}>
              {Math.round(payload.rect.width)} × {Math.round(payload.rect.height)}
            </span>
          </div>
          <AnatomyBox payload={payload} />

          {/* Sibling distance(pin mode hover 另一元素時顯示)— Panel canonical:
              canvas 小距離 hide label 時 user 仍能在此讀數。對齊 Figma Inspect
              「Distance to selected」idiom。*/}
          {payload.siblingDistance && (
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 12px', fontSize: 11, padding: '8px 0', marginTop: 8, borderTop: '1px solid rgba(128,128,128,0.15)' }}>
              <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>Sibling distance</span>
              <span style={{ color: '#EC4436', fontWeight: 600 }}>
                {payload.siblingDistance.horizontal !== null && `H: ${Math.round(payload.siblingDistance.horizontal)}px`}
                {payload.siblingDistance.horizontal !== null && payload.siblingDistance.vertical !== null && '  ·  '}
                {payload.siblingDistance.vertical !== null && `V: ${Math.round(payload.siblingDistance.vertical)}px`}
              </span>
            </div>
          )}

          {payload.autoLayout && <AutoLayoutSection autoLayout={payload.autoLayout} />}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <div style={styles.toggle} role="group" aria-label="View">
              <button style={styles.toggleBtn(view === 'list')} onClick={() => setView('list')}>List</button>
              <button style={styles.toggleBtn(view === 'code')} onClick={() => setView('code')}>Code</button>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--dm-fg-muted, #65727F)' }}>CSS</span>
          </div>

          {/* Author CSS — 完整顯示 author 寫的所有 properties(對齊 user 底線「完整顯示原本 css」)*/}
          {payload.authorCss && payload.authorCss.length > 0 && (
            <>
              <div style={styles.sectionHead}>
                <span>Author CSS({payload.authorCss.length})</span>
                <button
                  style={styles.copy}
                  onClick={() => {
                    const text = payload.authorCss
                      .map(d => d.rawValue === d.resolved ? `${d.property}: ${d.rawValue};` : `${d.property}: ${d.rawValue}; /* → ${d.resolved} */`)
                      .join('\n')
                    copyText(text)
                  }}
                  title="Copy all author CSS"
                  aria-label="Copy author CSS"
                >
                  ⧉
                </button>
              </div>
              <div style={styles.code}>
                {payload.authorCss.map((d, i) => (
                  <div key={`${d.property}-${i}`} style={styles.codeRow}>
                    <span style={styles.codeLn}>{i + 1}</span>
                    <span>
                      <span style={{ color: 'var(--dm-fg-muted, #65727F)' }}>{d.property}</span>
                      {': '}
                      {d.tokens.length > 0
                        ? renderAuthorRaw(d.rawValue, d.resolved, { tokens: d.tokens, resolved: d.resolved, source: 'author', raw: d.rawValue })
                        : d.rawValue !== d.resolved
                        ? <>
                            <span style={{ fontFamily: '"SF Mono", Menlo, monospace' }}>{d.rawValue}</span>
                            <span style={{ color: 'var(--dm-fg-muted, #65727F)', margin: '0 6px' }}>→</span>
                            <strong>{d.resolved}</strong>
                          </>
                        : <span>{d.rawValue}</span>}
                      {';'}
                      {d.fromSelector !== 'inline' && (
                        <span title={`from rule: ${d.fromSelector}`} style={{ marginLeft: 6, fontSize: 9, color: 'var(--dm-fg-muted, #65727F)' }}>
                          ← .{d.fromSelector.split(/\s+/).find(s => s.startsWith('.'))?.slice(1).split(':')[0] || d.fromSelector.slice(0, 20)}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={styles.sectionHead}>
            <span>Computed CSS(filtered)</span>
          </div>
          <Section title="Layout" entries={sortEntries(groups.layout)} view={view} tokenByProp={tokenByProp} />
          <Section title="Style" entries={sortEntries(groups.style)} view={view} tokenByProp={tokenByProp} />

          {payload.tokenUsage.length === 0 && Object.keys(payload.computed).length > 0 && (
            <div style={{ ...styles.empty, padding: '12px 0' }}>No DS tokens matched this element&rsquo;s computed values.</div>
          )}
        </>
      )}
    </div>
  )
}
