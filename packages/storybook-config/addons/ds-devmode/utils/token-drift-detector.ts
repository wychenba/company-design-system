/**
 * Token drift detector — R6 v3(2026-05-13,per codex propose + user「做完」拍板)
 *
 * 偵測 author CSS 寫 raw value(`8px`)而剛好等於某 DS token(`--space-2: 8px`)的「drift」情況。
 * 提示「possibly drift — should use `var(--space-2)` instead」。
 *
 * Codex V3 verdict 補:必 prefix allowlist 限制(`--space-*`/`--layout-space-*`/`--radius-*`/`--color-*`),
 * 不可包含 framework var(`--tw-*` / `--storybook-*`),避免 false positive 把 framework internal 當 DS token。
 */

// 2026-05-13 Q7 round 2 fix(per codex「stop hand-maintaining prefix guesses」):
// 改 strategy 從「prefix allowlist」→「denylist-only」— 任何 `--token` 預設 allowed,只 deny
// framework internal vars。這消除 prefix 維護 burden + 涵蓋全 DS canonical namespaces 包括
// 漏抓的 `--on-emphasis` / `--blue-hover`/`--red-hover`/etc / `--inverse-*` / `--notification` /
// `--status-*` / `--neutral-*` / `--muted` / `--secondary` / scrollbar / chart / `--tab-height-*` /
// `--tree-indent-*` 等(per codex Q7 round 2 cite semantic.css:171-348 + uiSize.css:32-45)。

const DRIFT_PREFIX_DENYLIST = [
  '--tw-',           // Tailwind internal
  '--storybook-',    // Storybook framework
  '--sb-',           // Storybook short alias
  '--ds-devmode-',   // 本 addon internal
  '--radix-',        // Radix UI internal
  '--reach-',        // Reach UI internal
]

interface DriftCandidate {
  /** Property name(e.g. `padding-top`) */
  property: string
  /** Raw author value(e.g. `8px`) */
  rawValue: string
  /** Matching DS tokens (by canonical name) */
  matchedTokens: string[]
  /** Severity: high = single exact match;medium = multiple matches(ambiguous) */
  severity: 'high' | 'medium'
}

function isAllowedToken(name: string): boolean {
  // 2026-05-13 Q7 round 2(denylist-only strategy):任何 `--token` 預設 OK,只排除 framework internal。
  if (DRIFT_PREFIX_DENYLIST.some(p => name.startsWith(p))) return false
  return name.startsWith('--')
}

function readAllowedRootTokens(): Map<string, string> {
  const out = new Map<string, string>()
  const cs = getComputedStyle(document.documentElement)
  for (let i = 0; i < cs.length; i++) {
    const name = cs.item(i)
    if (!name.startsWith('--')) continue
    if (!isAllowedToken(name)) continue
    const val = cs.getPropertyValue(name).trim()
    if (!val) continue
    out.set(name, val.toLowerCase())
  }
  return out
}

let cachedTokens: { map: Map<string, string>; ts: number } | null = null
const CACHE_TTL_MS = 5000

function getCachedTokens(): Map<string, string> {
  const now = Date.now()
  if (cachedTokens && now - cachedTokens.ts < CACHE_TTL_MS) return cachedTokens.map
  const map = readAllowedRootTokens()
  cachedTokens = { map, ts: now }
  return map
}

/**
 * Detect drift candidates for element's computed style.
 * @param el Element to analyze
 * @param authorDecls Author CSS declarations from extractAllAuthorDecls(prop → raw value,no var() resolution)
 */
export function detectDrift(el: Element, authorDecls: Map<string, string>): DriftCandidate[] {
  const candidates: DriftCandidate[] = []
  const tokens = getCachedTokens()

  // Reverse index:value → token names(group by same value)
  const valueToTokens = new Map<string, string[]>()
  for (const [name, val] of tokens) {
    const arr = valueToTokens.get(val) ?? []
    arr.push(name)
    valueToTokens.set(val, arr)
  }

  for (const [prop, raw] of authorDecls) {
    // Skip if author already used var() — they're consuming a token consciously
    if (raw.includes('var(')) continue
    // Skip if raw is computed-only(zero / auto / inherit / initial / etc.)
    const lower = raw.trim().toLowerCase()
    if (!lower || ['auto', 'inherit', 'initial', 'unset', 'none', '0', '0px'].includes(lower)) continue
    const matched = valueToTokens.get(lower)
    if (!matched || matched.length === 0) continue
    candidates.push({
      property: prop,
      rawValue: raw,
      matchedTokens: matched,
      severity: matched.length === 1 ? 'high' : 'medium',
    })
  }
  return candidates
}

/**
 * Get all elements using a specific token name(R6 v3 hot map basic impl)。
 * Bounded scope:limit to `#storybook-root` subtree(per codex V3 perf concern「全 page 全 prop scan 會 hang」)。
 * @param tokenName Token name(e.g. `--space-2`)
 * @returns Elements where any computed property equals the token's resolved value
 */
export function findElementsUsingToken(tokenName: string): Element[] {
  const tokens = getCachedTokens()
  const tokenValue = tokens.get(tokenName)
  if (!tokenValue) return []

  // Bound scope to storybook root(per codex V3 perf canonical)
  const root = document.getElementById('storybook-root') ?? document.body
  if (!root) return []

  const out: Element[] = []
  // Limit scope:只掃 visible elements,limit properties scanned
  const candidates = root.querySelectorAll<HTMLElement>('*')
  const PROPS_TO_SCAN = [
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'border-radius', 'font-size', 'line-height', 'gap', 'width', 'height',
    'color', 'background-color', 'border-color',
  ]

  // 2026-05-13 codex Q8 fix:500-cap silent miss large stories — log scanned/total + missed warning
  const totalCount = candidates.length
  const scanLimit = Math.min(500, totalCount)
  if (totalCount > 500) {
    // eslint-disable-next-line no-console
    console.warn(`[ds-devmode hotmap] only scanned first 500 of ${totalCount} elements(per perf cap)— large story may have missed matches。Refine with #storybook-root subtree filter OR pagination.`)
  }
  for (const el of Array.from(candidates).slice(0, scanLimit)) {
    const cs = getComputedStyle(el)
    for (const prop of PROPS_TO_SCAN) {
      const val = cs.getPropertyValue(prop).trim().toLowerCase()
      if (val === tokenValue) {
        out.push(el)
        break
      }
    }
  }
  return out
}

/**
 * Expose globally(matched diagnostic helper canonical):
 * `window.__ds_devmode_drift(el, authorDecls)` / `window.__ds_devmode_hotmap(tokenName)`
 */
declare global {
  interface Window {
    __ds_devmode_drift?: (el: Element, authorDecls: Map<string, string>) => DriftCandidate[]
    __ds_devmode_hotmap?: (tokenName: string) => Element[]
  }
}

export function installDriftGlobal(): void {
  if (typeof window === 'undefined') return
  window.__ds_devmode_drift = detectDrift
  window.__ds_devmode_hotmap = findElementsUsingToken
}
