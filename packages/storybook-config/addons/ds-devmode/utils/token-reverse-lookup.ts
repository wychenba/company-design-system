/**
 * Token resolution:source-first(2026-04-25 改)。
 *
 * 兩階段:
 *   1. **Source extraction**(優先):walk matched stylesheet rules + element.style,
 *      抓含 `var(...)` 的 declarations。author 寫了哪個 token 就顯示哪個。
 *   2. **Reverse-lookup**(fallback only):若 source 無 var(),不 speculate token。
 *      只在 user 顯式要 candidates 時才查反查表。
 *
 * 為什麼:reverse-lookup 在同 px 多 token 時挑 declaration 第一個,常 misleading
 * (e.g. SVG width=16px 同時 match `--layout-space-loose` / `--font-h5-size` /
 * `--font-body-lg-size`,挑 layout-space-loose 顯示 → 視覺誤導,SVG 跟 layout
 * 間距無語義關係)。Chrome DevTools / Firefox / Safari Inspector 全用 source-first。
 */

interface TokenMap {
  byResolved: Map<string, string[]>
  byName: Map<string, { raw: string; resolved: string; chain: string[] }>
}

const normalize = (v: string) => v.replace(/\s+/g, ' ').trim().toLowerCase()

let cached: { map: TokenMap; builtAt: number } | null = null
const TTL_MS = 2000

function readRootVars(): Map<string, string> {
  const out = new Map<string, string>()
  const root = document.documentElement
  const cs = getComputedStyle(root)
  for (let i = 0; i < cs.length; i++) {
    const name = cs.item(i)
    if (name.startsWith('--')) {
      out.set(name, cs.getPropertyValue(name).trim())
    }
  }
  return out
}

function resolveVarExpr(raw: string, vars: Map<string, string>, chain: string[] = []): string {
  let val = raw.trim()
  const re = /var\((--[a-zA-Z0-9-_]+)(?:,\s*([^)]+))?\)/
  let safety = 10
  while (re.test(val) && safety-- > 0) {
    val = val.replace(re, (_m, name: string, fallback?: string) => {
      const v = vars.get(name)
      if (v && v.length) {
        chain.push(name)
        return v
      }
      return fallback ? fallback.trim() : _m
    })
  }
  return val
}

export function buildTokenMap(): TokenMap {
  const now = Date.now()
  if (cached && now - cached.builtAt < TTL_MS) return cached.map

  const rawVars = readRootVars()
  const byName: TokenMap['byName'] = new Map()
  const byResolved: TokenMap['byResolved'] = new Map()

  rawVars.forEach((raw, name) => {
    const chain: string[] = []
    const resolved = resolveVarExpr(raw, rawVars, chain)
    byName.set(name, { raw, resolved, chain })
    const key = normalize(resolved)
    if (!byResolved.has(key)) byResolved.set(key, [])
    byResolved.get(key)!.push(name)
  })

  const map = { byName, byResolved }
  cached = { map, builtAt: now }
  return map
}

export interface TokenLookup {
  property: string
  raw: string
  resolved: string
  tokens: string[]
  chain: string[]
}

/**
 * Given a property value (resolved by the browser), find tokens that match.
 * Also handles values that contain var() references by re-resolving.
 * Approach:
 *   1. Normalize computed value (already resolved by browser → no var() left)
 *   2. Look up reverse map by normalized resolved value
 *   3. Return all tokens that resolve to same value
 */
export function lookupTokensForValue(property: string, resolvedValue: string): TokenLookup | null {
  if (!resolvedValue || resolvedValue === 'none' || resolvedValue === 'auto') return null
  const map = buildTokenMap()

  const tryKeys: string[] = [normalize(resolvedValue)]
  const colorMatch = resolvedValue.match(/rgba?\([^)]+\)/i) || resolvedValue.match(/#[0-9a-f]{3,8}\b/i)
  if (colorMatch) tryKeys.push(normalize(colorMatch[0]))
  const lenMatch = resolvedValue.match(/-?\d*\.?\d+px\b/)
  if (lenMatch && resolvedValue !== lenMatch[0]) tryKeys.push(normalize(lenMatch[0]))

  for (const k of tryKeys) {
    const names = map.byResolved.get(k)
    if (names && names.length) {
      const chain = names[0] ? map.byName.get(names[0])?.chain ?? [] : []
      return {
        property,
        raw: resolvedValue,
        resolved: resolvedValue,
        tokens: names,
        chain,
      }
    }
  }

  return null
}

export function annotateWithTokens(groups: Record<string, string>): TokenLookup[] {
  const out: TokenLookup[] = []
  for (const [prop, val] of Object.entries(groups)) {
    const hit = lookupTokensForValue(prop, val)
    if (hit) out.push(hit)
  }
  return out
}

// ── Source-first extraction(2026-04-25 加)──

export interface SourceVar {
  property: string
  /** Author 在 stylesheet 寫的原 declaration value(含 var() 表達式)*/
  rawValue: string
  /** Walk var chain extract 出的 token names(順序:外層先內層後) */
  tokens: string[]
  /** Browser 解析後的最終值(等同 computed style)*/
  resolved: string
}

/**
 * 從 element 所有 matched stylesheet rules + inline style 中抓**全部 author-written
 * declarations**(2026-04-25 擴 — 不限 var-containing)。
 * 回傳 property → AuthorDecl(含 raw value / source selector / 是否含 token)。
 *
 * 對齊 user 底線「完整顯示原本 CSS」+ Chrome DevTools「Styles」panel 全 author 顯示 idiom。
 */
export interface AuthorDecl {
  property: string
  /** Author 在 stylesheet 寫的原 declaration value(可能是 var / calc / plain px / color / 等任何 CSS value)*/
  rawValue: string
  /** 來源 selector(從哪 rule 取) */
  fromSelector: string
  /** Var token names(有的話)*/
  tokens: string[]
}

export function extractAllAuthorDecls(el: Element): Map<string, AuthorDecl> {
  const map = new Map<string, AuthorDecl>()

  const captureDecl = (property: string, value: string, fromSelector: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    // 不過濾 — 全 capture(含 var / calc / plain / numeric)
    const tokens: string[] = []
    const re = /var\((--[a-zA-Z0-9-_]+)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(trimmed))) tokens.push(m[1])
    // 後寫覆蓋前寫(CSS cascade);用 set 不 setdefault
    map.set(property, { property, rawValue: trimmed, fromSelector, tokens })
  }

  if ((el as HTMLElement).style) {
    const inline = (el as HTMLElement).style
    for (let i = 0; i < inline.length; i++) {
      const prop = inline.item(i)
      captureDecl(prop, inline.getPropertyValue(prop), 'inline')
    }
  }

  // Filter:skip framework-internal universal selector(Tailwind v4 用 `*, ::before, ::after`
  // /  `*, ::after, ::before, ::backdrop, ::file-selector-button` 等 變體 註冊
  // 一堆 `--tw-*` @property tokens — 非 author design intent,顯示 = noise)。
  // 對齊 Chrome DevTools「Filter / Hide inherited」idiom。
  //
  // Heuristic:selector 開頭是 `*` 且僅含 `*` + `::pseudo` 元素(無 element / class / id selector)
  // → 視為 framework universal property registration,skip。
  const isFrameworkUniversalSelector = (sel: string): boolean => {
    const normalized = sel.replace(/\s+/g, ' ').trim()
    // 開頭必 `*,` 且整個 selector 只含 `*` / `::pseudo` / `,` / 空白
    if (!normalized.startsWith('*,') && normalized !== '*') return false
    // Tokenize by comma,每個 token 必須是 `*` or `::xxx`
    const tokens = normalized.split(',').map(t => t.trim())
    return tokens.every(t => t === '*' || /^::[a-z-]+$/.test(t))
  }

  function walk(rules: CSSRuleList | undefined) {
    if (!rules) return
    for (const rule of Array.from(rules)) {
      const nested = (rule as { cssRules?: CSSRuleList }).cssRules
      if (nested) walk(nested)
      if (!(rule instanceof CSSStyleRule)) continue
      // Skip framework universal selector(Tailwind --tw-* infrastructure,non-author)
      if (isFrameworkUniversalSelector(rule.selectorText)) continue
      let matches = false
      try { matches = el.matches(rule.selectorText) } catch { continue }
      if (!matches) continue
      // 2026-05-21 真因 fix(user 抓「DevMode 看不到 px-[var(--layout-space-loose)] padding-inline」):
      // 原 decl.item(i) enumeration 對 author 寫的 shorthand(padding-inline / margin-inline / inset
      // / 任何 logical property)會被 browser CSSOM 展開為 longhands(padding-inline-start +
      // padding-inline-end),但 getPropertyValue(longhand) 對 shorthand-derived 返回空字串。
      // 原 var() rawValue 只能透過 shorthand getPropertyValue('padding-inline') 取得。
      // **Fix**:parse rule.style.cssText 直接,保留 shorthand 原始 token(對齊 author 真正寫的)。
      // 對齊 Chrome DevTools Styles panel 慣例(顯示 author 寫的 shorthand,不 expand)。
      const cssText = rule.style.cssText
      // Split on `;` 但跳過 calc() / quoted 內的 `;`(實務上 CSS declaration ; 不會在 calc 內)
      const declarations = cssText.split(';').map(s => s.trim()).filter(Boolean)
      for (const declStr of declarations) {
        const colonIdx = declStr.indexOf(':')
        if (colonIdx < 0) continue
        const prop = declStr.slice(0, colonIdx).trim()
        let value = declStr.slice(colonIdx + 1).trim()
        // Strip !important suffix
        value = value.replace(/\s*!important\s*$/, '')
        captureDecl(prop, value, rule.selectorText)
      }
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try { walk(sheet.cssRules) } catch { continue }
  }

  return map
}

/**
 * 從 element 所有 matched stylesheet rules + inline style 中抓含 var(...) 的
 * declarations。回傳 property → SourceVar map。
 *
 * 限制:
 * - CORS-blocked stylesheets(e.g. external CDN)讀不到 cssRules,跳過(該情境
 *   addon 本身設計上也不適用)
 * - Specificity 衝突時取最後一條 matching rule(對應 CSS cascade 最終勝出)
 */
export function extractSourceVars(el: Element): Map<string, SourceVar> {
  const map = new Map<string, SourceVar>()
  const tokenMap = buildTokenMap()

  const captureDecl = (property: string, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (!/var\(/.test(trimmed)) return  // 只 capture 含 var() 的 declarations
    const tokens: string[] = []
    const re = /var\((--[a-zA-Z0-9-_]+)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(trimmed))) tokens.push(m[1])
    const resolved = resolveVarExpr(trimmed, tokenMap.byName.size
      ? new Map([...tokenMap.byName].map(([k, v]) => [k, v.raw]))
      : new Map())
    map.set(property, { property, rawValue: trimmed, tokens, resolved })
  }

  // Inline style(highest specificity)
  if ((el as HTMLElement).style) {
    const inline = (el as HTMLElement).style
    for (let i = 0; i < inline.length; i++) {
      const prop = inline.item(i)
      captureDecl(prop, inline.getPropertyValue(prop))
    }
  }

  // Walk matched stylesheet rules — 必須遞迴(Tailwind v4 用 @layer / nested CSS,
  // CSSStyleRule 多在 CSSLayerBlockRule / CSSMediaRule / CSSSupportsRule 內部)。
  function walkRules(rules: CSSRuleList | undefined) {
    if (!rules) return
    for (const rule of Array.from(rules)) {
      // Nested grouping rules — recurse
      const nested = (rule as { cssRules?: CSSRuleList }).cssRules
      if (nested) walkRules(nested)
      // Leaf style rule
      if (!(rule instanceof CSSStyleRule)) continue
      let matches = false
      try {
        matches = el.matches(rule.selectorText)
      } catch {
        continue
      }
      if (!matches) continue
      // 2026-05-21 v2 fix(per codex M31 Layer C M10 proactive scan): 同 extractAllAuthorDecls
      // 邏輯 — CSSOM `decl.item(i)` 對 logical shorthand(padding-inline / margin-inline 等)
      // 展開為 longhand names,`getPropertyValue(longhand)` 返回空字串。改用 cssText parse 直接。
      const cssText = rule.style.cssText
      const declarations = cssText.split(';').map(s => s.trim()).filter(Boolean)
      for (const declStr of declarations) {
        const colonIdx = declStr.indexOf(':')
        if (colonIdx < 0) continue
        const prop = declStr.slice(0, colonIdx).trim()
        let value = declStr.slice(colonIdx + 1).trim()
        value = value.replace(/\s*!important\s*$/, '')
        captureDecl(prop, value)
      }
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null
    try {
      rules = sheet.cssRules
    } catch {
      continue  // CORS-blocked,跳過
    }
    walkRules(rules)
  }

  return map
}
