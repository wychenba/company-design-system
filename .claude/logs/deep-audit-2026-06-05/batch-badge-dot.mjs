// Badge dot → critical/high only (Option A, user 拍板 2026-06-05). Run: CLAUDE_BYPASS_DESIGN_APPROVAL=1 node ...
import { readFileSync, writeFileSync } from 'node:fs'
if (process.env.CLAUDE_BYPASS_DESIGN_APPROVAL !== '1') { console.error('refuse'); process.exit(2) }
const C = 'packages/design-system/src/components/Badge/'
const edits = [
  // ── badge.tsx ──
  { f: 'badge.tsx', old: `import { cva, type VariantProps } from 'class-variance-authority'`, neo: `import { cva } from 'class-variance-authority'` },
  {
    f: 'badge.tsx',
    old: `// 規則：default low, escalate with reason。見 badge.spec.md「選 level 的流程」。`,
    neo: `// dot 模式只接 critical / high（單一 attention 點,實心可見色）—— 不提供 medium/low dot:
// dot = 「這裡有東西要看」,淡點不 earn existence(對齊 Material small-badge / Ant status dot /
// Polaris:dot 是單一 attention/status,非 4 級 severity 刻度;2026-06-05 user 拍板 Option A)。
// medium/low 仍完整存在於 count/text badge。
//
// 規則：count default low, escalate with reason。見 badge.spec.md「選 level 的流程」+「dot 變體」。`,
  },
  {
    f: 'badge.tsx',
    old: `export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>,
    Omit<VariantProps<typeof badgeVariants>, 'dot'> {
  /** dot 模式：6×6px 純色圓點，無文字 */
  dot?: boolean
  /** 顯示的數量（dot 模式下忽略） */
  count?: number
  /** 數量上限，超過時顯示 "max+"（例：max=99 → "99+"） */
  max?: number
}`,
    neo: `type BadgeBaseProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>

interface BadgeDotProps extends BadgeBaseProps {
  /** dot 模式：6×6px 純色圓點，無文字 */
  dot: true
  /** dot 只接高訊號 attention 色:critical(立即)/ high(有感)。預設 critical。
   * 不提供 medium/low —— dot = 「這裡有東西要看」,淡點不 earn existence
   * (對齊 Material/Ant/Polaris:dot 是單一 attention/status,非 severity 刻度)。 */
  variant?: 'critical' | 'high'
  count?: never
  max?: never
}

interface BadgeCountProps extends BadgeBaseProps {
  dot?: false
  /** 四級 severity（low→critical),見 badge.spec.md「選 level 的流程」 */
  variant?: 'critical' | 'high' | 'medium' | 'low'
  /** 顯示的數量 */
  count?: number
  /** 數量上限，超過時顯示 "max+"（例：max=99 → "99+"） */
  max?: number
}

export type BadgeProps = BadgeDotProps | BadgeCountProps`,
  },
  {
    f: 'badge.tsx',
    old: `    const display = dot ? null : (
      max != null && count != null && count > max ? \`\${max}+\` : \`\${count}\`
    )`,
    neo: `    // dot 預設 attention 色 = critical(非 cva 的 count default 'low');count 沿用 cva default 'low'。
    const effectiveVariant = variant ?? (dot ? 'critical' : 'low')
    const display = dot ? null : (
      max != null && count != null && count > max ? \`\${max}+\` : \`\${count}\`
    )`,
  },
  { f: 'badge.tsx', old: `className={cn(badgeVariants({ variant, dot }), className)}`, neo: `className={cn(badgeVariants({ variant: effectiveVariant, dot }), className)}` },
  // ── badge.stories.tsx showcase ──
  {
    f: 'badge.stories.tsx',
    old: `      <Badge dot variant="critical" />
      <Badge dot variant="high" />
      <Badge dot variant="medium" />
      <Badge dot variant="low" />
      <span className="text-caption text-fg-muted">6×6px 純色圓點</span>`,
    neo: `      <Badge dot variant="critical" />
      <Badge dot variant="high" />
      <span className="text-caption text-fg-muted">6×6px attention 點 —— 只 critical / high(單一注意點,不分 medium/low)</span>`,
  },
  { f: 'badge.stories.tsx', old: `四個層級（critical / high / medium / low）＋ dot 模式。`, neo: `count 四級 severity（critical / high / medium / low）；dot 模式只 critical / high（單一 attention 點）。` },
  // ── badge.principles.stories.tsx color-blind Rule(改 2 dot,點仍成立)──
  {
    f: 'badge.principles.stories.tsx',
    old: `        <div className="flex items-center gap-4">
          <Badge dot variant="critical" aria-label="緊急" />
          <Badge dot variant="high" aria-label="重要" />
          <Badge dot variant="medium" aria-label="一般" />
          <Badge dot variant="low" aria-label="被動" />
        </div>
        <Label>↑ 4 個 dot 差異只在顏色——必須靠 aria-label 明確語意,不能只靠「紅色代表緊急」</Label>`,
    neo: `        <div className="flex items-center gap-4">
          <Badge dot variant="critical" aria-label="緊急" />
          <Badge dot variant="high" aria-label="重要" />
        </div>
        <Label>↑ critical(橘)vs high(藍)只靠顏色——color-blind 使用者分不清,必須靠 aria-label 明確語意,不能只靠顏色</Label>`,
  },
  // ── badge.anatomy.stories.tsx matrix(dot tab 只列 critical/high + 切 dot 時 snap)──
  {
    f: 'badge.anatomy.stories.tsx',
    old: `            {VARIANTS.map((v) => <Tab key={v} active={variant === v} onClick={() => setVariant(v)}>{v}</Tab>)}`,
    neo: `            {(isDot ? VARIANTS.filter((v) => v === 'critical' || v === 'high') : VARIANTS).map((v) => <Tab key={v} active={variant === v} onClick={() => setVariant(v)}>{v}</Tab>)}`,
  },
  {
    f: 'badge.anatomy.stories.tsx',
    old: `            <Tab active={mode === 'dot'} onClick={() => setMode('dot')}>dot</Tab>`,
    neo: `            <Tab active={mode === 'dot'} onClick={() => { setMode('dot'); if (variant !== 'critical' && variant !== 'high') setVariant('critical') }}>dot</Tab>`,
  },
  {
    f: 'badge.anatomy.stories.tsx',
    old: `              ? <Badge dot variant={variant} />`,
    neo: `              ? <Badge dot variant={variant === 'high' ? 'high' : 'critical'} />`,
  },
]
let ok = 0; const fail = []
for (const e of edits) {
  const p = C + e.f
  const src = readFileSync(p, 'utf8')
  const n = src.split(e.old).length - 1
  if (n !== 1) { fail.push(`${e.f}: got ${n} for "${e.old.slice(0, 45)}"`); continue }
  writeFileSync(p, src.replace(e.old, e.neo)); ok++
}
console.log(`applied ${ok}/${edits.length}`)
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log('  ' + f)); process.exit(1) }
