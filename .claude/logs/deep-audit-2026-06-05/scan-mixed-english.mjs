// Standalone mixed-English story-name scan (fail-closed allowlist). Finds EVERY name whose
// Latin words aren't proper-noun/prop exceptions — catches agent misses the judgment review left.
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

// Component dir names (proper nouns)
const COMPONENTS = execSync("ls packages/design-system/src/components", { encoding: 'utf8' })
  .trim().split('\n').filter(s => s && s !== 'README.md')
const PATTERNS = ['ItemAnatomy', 'ChromeHeader', 'SurfaceHeader', 'SurfaceBody', 'SurfaceFooter', 'OverflowTagList', 'ResizeHandle', 'ActionBar']
const SUBCOMPONENTS = ['MenuItem', 'SidebarMenu', 'SidebarMenuButton', 'FieldGroup', 'FieldControlGroup', 'ChartConfig', 'PersonValue', 'DateGrid', 'SelectMenu', 'ButtonGroup', 'AppShell']
// Format / protocol / abbreviation proper nouns
const FORMATS = ['API', 'ARIA', 'FAQ', 'MVP', 'PR', 'UI', 'UX', 'URL', 'URI', 'ID', 'PDF', 'CSV', 'JSON', 'XML', 'HTML', 'CSS', 'JS', 'TS', 'JSX', 'TSX', 'SVG', 'PNG', 'JPG', 'WebP', 'HTTP', 'HTTPS', 'OK', 'CTA', 'SEO', 'N', 'X', 'A11y', 'a11y', 'RTL', 'LTR', 'DOM', 'CSP', 'SaaS']
// Real brand / product names
const BRANDS = ['Figma', 'GitHub', 'Gmail', 'Jira', 'Linear', 'Notion', 'Slack', 'Stripe', 'Google', 'Apple', 'Spotify', 'Trello', 'Asana', 'Dropbox', 'Outlook', 'Zoom', 'Shopify', 'Airtable', 'Polaris', 'Carbon', 'Material', 'Atlassian', 'Ant', 'Radix', 'React', 'Storybook', 'Tailwind', 'Vite']
const EXTRA = ['vs', 'Router', 'Next', 'Ada', 'Chen', 'Alice', 'Bob', 'Lin', 'Charlie', 'Wu', 'Diana', 'Huang', 'Eric', 'Tsai', 'Fiona', 'Lee'] // vs + person-name demo data
const ALLOW = new Set([...COMPONENTS, ...PATTERNS, ...SUBCOMPONENTS, ...FORMATS, ...BRANDS, ...EXTRA])

const isAllowed = (w) => {
  if (ALLOW.has(w)) return true
  if (/^Q[1-4]$/.test(w)) return true            // quarters Q1..Q4
  if (/[a-z][A-Z]/.test(w)) return true          // camelCase prop identifier (showTime, iconOnly, startIcon)
  if (/^v?\d+$/.test(w)) return true             // version/number tokens
  return false
}
// data names (not reader-facing story display names) — skip
const isDataName = (name) =>
  /\.(png|jpe?g|pdf|csv|json|zip|docx?|xlsx?|svg|gif|webp|mp4|txt|md|ts|tsx)$/i.test(name) || // filename
  /\$\{/.test(name) ||                                                                          // template literal (dynamic)
  /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(name) ||                                                     // person name "Alice Chen"
  /^[a-z0-9-]+$/i.test(name)                                                                     // kebab slug filename-ish

const files = execSync("find packages/design-system/src -name '*.stories.tsx'", { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean)
const flags = []
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*name:\s*['"`]([^'"`]+)['"`]/)
    if (!m) continue
    const name = m[1]
    if (isDataName(name)) continue
    const words = name.match(/[A-Za-z][A-Za-z0-9]*/g) || []
    const bad = words.filter(w => !isAllowed(w))
    if (bad.length) flags.push({ file: f.replace('packages/design-system/src/', ''), line: i + 1, name, bad })
  }
}
console.log(`flagged names: ${flags.length}`)
for (const fl of flags) console.log(`  ${fl.file}:${fl.line} | ${fl.name}  [bad: ${fl.bad.join(',')}]`)
import { writeFileSync as _w } from 'node:fs'
_w('.claude/logs/deep-audit-2026-06-05/mixed-english-flags.json', JSON.stringify(flags, null, 1))
