// Batch 2 — user-approved (Q1「補 code」) RadioGroup mode='disabled'/'readonly' + Slider Field-disabled.
// Run: CLAUDE_BYPASS_DESIGN_APPROVAL=1 node batch2-fieldmode.mjs
import { readFileSync, writeFileSync } from 'node:fs'
if (process.env.CLAUDE_BYPASS_DESIGN_APPROVAL !== '1') { console.error('refuse: bypass not set'); process.exit(2) }
const R = 'packages/design-system/src/components'
const edits = [
  // ── RadioGroup R1: readonly context ──
  {
    f: `${R}/RadioGroup/radio-group.tsx`,
    old: `const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,`,
    neo: `// RadioGroup mode='readonly' → 透過 context 把 readOnly 傳給所有 child RadioGroupItem
// (item 已支援 readOnly prop + data-[readonly] 樣式;Radix Root 無 readOnly,故用 context)。
const RadioGroupReadonlyContext = React.createContext(false)

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,`,
    label: 'RadioGroup readonly context',
  },
  // ── RadioGroup R2: disabled mode + readonly provider on default render ──
  {
    f: `${R}/RadioGroup/radio-group.tsx`,
    old: `  return (
    <RadioGroupPrimitive.Root
      className={cn("grid", className)}
      value={value}
      defaultValue={defaultValue}
      {...props}
      ref={ref}
    />
  )`,
    neo: `  // mode='disabled' → Radix Root disabled(原生 propagate 給所有 item);
  // mode='readonly' → context 傳 readOnly 給 items(item 渲染為 data-[readonly] 鎖互動 + aria-readonly)。
  return (
    <RadioGroupReadonlyContext.Provider value={mode === 'readonly'}>
      <RadioGroupPrimitive.Root
        className={cn("grid", className)}
        value={value}
        defaultValue={defaultValue}
        {...props}
        disabled={mode === 'disabled' || (props as { disabled?: boolean }).disabled}
        ref={ref}
      />
    </RadioGroupReadonlyContext.Provider>
  )`,
    label: 'RadioGroup disabled+readonly render',
  },
  // ── RadioGroup R3a: item reads group readonly context ──
  {
    f: `${R}/RadioGroup/radio-group.tsx`,
    old: `    const fieldCtx = useFieldContext()

    const generatedId = React.useId()`,
    neo: `    const fieldCtx = useFieldContext()
    // group-level readonly(RadioGroup mode='readonly')或 item-level readOnly,任一 true 即鎖互動。
    const groupReadonly = React.useContext(RadioGroupReadonlyContext)
    const effectiveReadonly = readOnly || groupReadonly

    const generatedId = React.useId()`,
    label: 'RadioGroupItem read context',
  },
  // ── RadioGroup R3b: item uses effectiveReadonly ──
  {
    f: `${R}/RadioGroup/radio-group.tsx`,
    old: `        aria-readonly={readOnly || undefined}
        data-readonly={readOnly || undefined}
        tabIndex={readOnly ? -1 : undefined}`,
    neo: `        aria-readonly={effectiveReadonly || undefined}
        data-readonly={effectiveReadonly || undefined}
        tabIndex={effectiveReadonly ? -1 : undefined}`,
    label: 'RadioGroupItem effectiveReadonly',
  },
  // ── Slider S1: import field-context ──
  {
    f: `${R}/Slider/slider.tsx`,
    old: `import { cn } from '@/lib/utils'`,
    neo: `import { cn } from '@/lib/utils'
import { useFieldContext } from '@/design-system/components/Field/field-context'`,
    label: 'Slider import field-context',
  },
  // ── Slider S2: fieldCtx disabled cascade ──
  {
    f: `${R}/Slider/slider.tsx`,
    old: `>(({ className, size, value, defaultValue, 'aria-label': ariaLabel, ...props }, ref) => {`,
    neo: `>(({ className, size, value, defaultValue, 'aria-label': ariaLabel, ...props }, ref) => {
  // Field 家族整合:被 <Field mode="disabled"> 包裹時自動 disabled(per slider.spec.md「Slider 作為 Field
  // 家族整合時繼承其 canonical」)。Slider 已有完整 data-[disabled] 視覺,故只需把 fieldCtx disabled 接上。
  const fieldCtx = useFieldContext()
  const fieldDisabled = fieldCtx?.mode === 'disabled'`,
    label: 'Slider fieldCtx disabled decl',
  },
  // ── Slider S3: pass disabled to Root ──
  {
    f: `${R}/Slider/slider.tsx`,
    old: `      className={cn(sliderRootVariants({ size }), className)}
      {...props}
    >`,
    neo: `      className={cn(sliderRootVariants({ size }), className)}
      {...props}
      disabled={(props as { disabled?: boolean }).disabled || fieldDisabled}
    >`,
    label: 'Slider Root disabled',
  },
]
for (const e of edits) {
  const src = readFileSync(e.f, 'utf8')
  const n = src.split(e.old).length - 1
  if (n !== 1) { console.error(`✗ ${e.label}: expected 1 match, got ${n}`); process.exit(1) }
  writeFileSync(e.f, src.replace(e.old, e.neo))
  console.log(`✓ ${e.label}`)
}
console.log(`applied ${edits.length} edits`)
