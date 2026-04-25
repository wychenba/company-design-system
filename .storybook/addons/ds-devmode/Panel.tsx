import React from 'react'
import { useChannel } from '@storybook/manager-api'
import { EVENTS, type InspectPayload, type DevmodeMode, type ForceState } from './constants'

const styles: Record<string, React.CSSProperties> = {
  root: {
    padding: '12px 16px',
    fontSize: 12,
    fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
    color: 'var(--sb-fg, #1F2532)',
    height: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--sb-fg-muted, #65727F)',
    margin: '12px 0 6px',
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
    padding: '36px 40px',
    background: 'var(--sb-bg-subtle, rgba(0,0,0,0.02))',
    marginTop: 4,
  },
  distance: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 600,
    color: '#fff',
    background: '#EC4436',
    padding: '1px 5px',
    borderRadius: 3,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  },
  borderBox: {
    position: 'relative',
    border: '1px dashed rgba(128,128,128,0.5)',
    padding: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paddingBox: {
    position: 'relative',
    border: '1px dashed rgba(0,101,234,0.55)',
    padding: 8,
    background: 'repeating-linear-gradient(-45deg, rgba(0,101,234,0.12) 0 3px, transparent 3px 6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--sb-fg-muted, #65727F)',
    fontSize: 11,
    minWidth: 120,
    minHeight: 40,
  },
  edgeLabel: {
    color: 'var(--sb-fg-muted, #65727F)',
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
    color: active ? '#0065EA' : 'var(--sb-fg, #1F2532)',
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
    color: 'var(--sb-fg-muted, #a0a0a0)',
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
    color: 'var(--sb-fg-muted, #65727F)',
    padding: 2,
    borderRadius: 3,
    fontSize: 12,
  },
  empty: {
    color: 'var(--sb-fg-muted, #65727F)',
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
        {fallback ? <>, <span style={{ color: 'var(--sb-fg-muted, #888)' }}>{fallback}</span></> : null}
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
      <span style={{ color: 'var(--sb-fg-muted, #888)', margin: '0 6px' }}>→</span>
      <strong style={{ color: '#1F2532' }}>{resolved}</strong>
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
          style={{ marginLeft: 6, fontSize: 10, color: 'var(--sb-fg-muted, #888)', fontStyle: 'italic' }}
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
                <span style={{ color: 'var(--sb-fg-muted, #7A8896)' }}>{k}</span>
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
  const { distancesToParent, padding, margin, border, rect } = payload
  const w = Math.round(rect.width)
  const h = Math.round(rect.height)
  // Content size = rect - border - padding(對齊 Chrome DevTools box model 第 4 層 inner-most)。
  // 之前未扣 border → 有 border 元件(Tag / FileItem rich / Input)content size 偏大 2px,
  // 跟 Storybook addon-measure(扣 border)對不上;修正使我們 = Chrome = addon-measure 三方一致。
  const iw = Math.max(0, w - padding.left - padding.right - border.left - border.right)
  const ih = Math.max(0, h - padding.top - padding.bottom - border.top - border.bottom)
  // Margin layer container — Chrome 4-rect box model:margin → border → padding → content
  const marginOuter: React.CSSProperties = {
    position: 'relative',
    border: '1px dashed rgba(155, 99, 0, 0.45)',
    padding: 14,
    background: 'repeating-linear-gradient(45deg, rgba(247, 142, 30, 0.08) 0 3px, transparent 3px 6px)',
    marginTop: 4,
  }
  return (
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
            {border.top || border.right || border.bottom || border.left
              ? `Border ${border.top}/${border.right}/${border.bottom}/${border.left}`
              : 'Border'}
          </span>
          <span style={{ ...styles.edgeLabel, color: '#0065EA' }}>{padding.left}</span>
          <div style={styles.paddingBox}>
            <span style={{ ...styles.edgeLabel, position: 'absolute', top: -9, left: 8, background: 'var(--sb-bg, #fff)', padding: '0 4px', color: '#0065EA' }}>
              Padding
            </span>
            {/* Padding top — center 上方(對齊 Chrome devtools-frontend Box Model 4 邊全顯示
                 idiom;canvas 不畫 per-side padding 數字,Panel 必須是 canonical) */}
            <span style={{ ...styles.edgeLabel, position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', color: '#0065EA' }}>
              {padding.top}
            </span>
            <span style={{ color: 'var(--sb-fg, #1F2532)', fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span>{`${iw} × ${ih}`}</span>
              <span style={{ fontSize: 9, color: 'var(--sb-fg-muted, #65727F)', fontWeight: 400 }}>content</span>
            </span>
            {/* Padding bottom — center 下方 */}
            <span style={{ ...styles.edgeLabel, position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', color: '#0065EA' }}>
              {padding.bottom}
            </span>
          </div>
          <span style={{ ...styles.edgeLabel, color: '#0065EA' }}>{padding.right}</span>
        </div>
        <div style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 10, color: 'var(--sb-fg-muted, #65727F)' }}>
          {w} × {h} <span style={{ opacity: 0.7 }}>(border-box)</span>
        </div>
      </div>
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
            <span style={{ color: 'var(--sb-fg-muted, #65727F)' }}>direction</span>
            <code>{autoLayout.flexDirection}</code>
          </>
        )}
        {autoLayout.gap && autoLayout.gap !== 'normal' && autoLayout.gap !== '0px' && (
          <>
            <span style={{ color: 'var(--sb-fg-muted, #65727F)' }}>gap</span>
            <code>{autoLayout.gap}</code>
          </>
        )}
        {autoLayout.justifyContent && autoLayout.justifyContent !== 'normal' && (
          <>
            <span style={{ color: 'var(--sb-fg-muted, #65727F)' }}>justify</span>
            <code>{autoLayout.justifyContent}</code>
          </>
        )}
        {autoLayout.alignItems && autoLayout.alignItems !== 'normal' && (
          <>
            <span style={{ color: 'var(--sb-fg-muted, #65727F)' }}>align</span>
            <code>{autoLayout.alignItems}</code>
          </>
        )}
        {isFlex && autoLayout.flexWrap && autoLayout.flexWrap !== 'nowrap' && (
          <>
            <span style={{ color: 'var(--sb-fg-muted, #65727F)' }}>wrap</span>
            <code>{autoLayout.flexWrap}</code>
          </>
        )}
        {!isFlex && autoLayout.gridTemplateColumns && autoLayout.gridTemplateColumns !== 'none' && (
          <>
            <span style={{ color: 'var(--sb-fg-muted, #65727F)' }}>columns</span>
            <code style={{ wordBreak: 'break-all' }}>{autoLayout.gridTemplateColumns}</code>
          </>
        )}
        {!isFlex && autoLayout.gridTemplateRows && autoLayout.gridTemplateRows !== 'none' && (
          <>
            <span style={{ color: 'var(--sb-fg-muted, #65727F)' }}>rows</span>
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
    <div style={styles.root}>
      <div style={styles.modeRow}>
        <strong style={{ fontSize: 12 }}>DS Devmode</strong>
        <div style={styles.toggle} role="group" aria-label="Inspect mode">
          <button style={styles.toggleBtn(mode === 'off')} onClick={() => setModeAndBroadcast('off')}>Off</button>
          <button style={styles.toggleBtn(mode === 'live')} onClick={() => setModeAndBroadcast('live')}>Live</button>
          <button style={styles.toggleBtn(mode === 'pin')} onClick={() => setModeAndBroadcast('pin')} disabled={!payload}>Pin</button>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--sb-fg-muted, #65727F)' }}>Alt+I toggle · Esc unpin · ↑↓→← walk DOM · Pin 後 hover 測距 · 觸控:tap 即 pin</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 8, fontSize: 10, color: 'var(--sb-fg-muted, #65727F)' }}>
              {payload.breadcrumb.map((crumb, i) => {
                const isLast = i === payload.breadcrumb.length - 1
                const label = `${crumb.tag}${crumb.id ? `#${crumb.id}` : ''}${crumb.className ? `.${String(crumb.className).split(/\s+/).filter(Boolean)[0]}` : ''}`
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <span>›</span>}
                    <span style={{ color: isLast ? 'var(--sb-fg, #1F2532)' : undefined, fontWeight: isLast ? 600 : 400 }}>
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
            {payload.className && (
              <code style={{ fontSize: 11, color: 'var(--sb-fg-muted, #65727F)', wordBreak: 'break-all' }}>
                .{String(payload.className).split(/\s+/).filter(Boolean).join(' .')}
              </code>
            )}
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
              <span style={{ fontSize: 10, color: 'var(--sb-fg-muted, #65727F)' }}>:state</span>
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
          </div>
          <AnatomyBox payload={payload} />

          {/* Sibling distance(pin mode hover 另一元素時顯示)— Panel canonical:
              canvas 小距離 hide label 時 user 仍能在此讀數。對齊 Figma Inspect
              「Distance to selected」idiom。*/}
          {payload.siblingDistance && (
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 12px', fontSize: 11, padding: '8px 0', marginTop: 8, borderTop: '1px solid rgba(128,128,128,0.15)' }}>
              <span style={{ color: 'var(--sb-fg-muted, #65727F)' }}>Sibling distance</span>
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
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--sb-fg-muted, #65727F)' }}>CSS</span>
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
                      <span style={{ color: 'var(--sb-fg-muted, #7A8896)' }}>{d.property}</span>
                      {': '}
                      {d.tokens.length > 0
                        ? renderAuthorRaw(d.rawValue, d.resolved, { tokens: d.tokens, resolved: d.resolved, source: 'author', raw: d.rawValue })
                        : d.rawValue !== d.resolved
                        ? <>
                            <span style={{ fontFamily: '"SF Mono", Menlo, monospace' }}>{d.rawValue}</span>
                            <span style={{ color: 'var(--sb-fg-muted, #888)', margin: '0 6px' }}>→</span>
                            <strong>{d.resolved}</strong>
                          </>
                        : <span>{d.rawValue}</span>}
                      {';'}
                      {d.fromSelector !== 'inline' && (
                        <span title={`from rule: ${d.fromSelector}`} style={{ marginLeft: 6, fontSize: 9, color: 'var(--sb-fg-muted, #aaa)' }}>
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
