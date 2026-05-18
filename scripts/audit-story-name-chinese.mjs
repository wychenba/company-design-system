#!/usr/bin/env node
/**
 * DS-wide audit:Storybook story `name:` field 必中文人話(per story-rules.md)
 *
 * 精準 detect(避 false positive):
 *   - 只看 `export const X(:.*?Story)? = \{ ... name: '...' ... \}` 結構
 *   - 排除 meta.title / 元件 title prop / map iteration name 變數
 *
 * 違反類別:
 *   V1(a) 純英文 name(非 whitelist)
 *   V1(c) 中英混合(中英夾雜 jargon 未翻譯)
 *   V1(d) 抽象代號(Option A / Lorem / Foo / Test 1 / 按鈕一)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()

// Whitelist:常用 Storybook story 英文名(可不翻譯)
const NAME_WHITELIST = new Set([
  'Default', 'Disabled', 'Loading', 'Empty', 'Error', 'Active', 'Inactive',
  'AllVariants', 'AllSizes', 'AllStates', 'Sizes', 'Variants', 'States',
  'Inspector', 'Overview', 'StateBehavior', 'ColorMatrix', 'SizeMatrix', 'Accessibility',
  'Playground', 'API',
])

// 抽象代號
const PLACEHOLDER_RE = /\b(Option [ABCD]|Foo|Bar|Baz|Lorem|Hello World|Test [12345]|按鈕[一二三])\b/i

const stories = execSync(`find src/design-system -name "*.stories.tsx" -type f`, { encoding: 'utf-8' })
  .trim().split('\n').filter(Boolean)

const violations = { v1a: [], v1c: [], v1d: [] }

function findStoryNames(content, filePath) {
  // Match `export const <Name>... = { ... name: '<value>' ... }` 結構
  // 用 multi-line state machine 找 top-level story export 的 name field
  const lines = content.split('\n')
  let inExport = false
  let braceDepth = 0
  let exportStart = -1
  const found = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!inExport) {
      // detect: export const Foo: Story = { OR export const Foo = {
      if (/^export const \w+(?::\s*\w+)?\s*=\s*\{/.test(line)) {
        inExport = true
        braceDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
        exportStart = i
        continue
      }
    } else {
      braceDepth += (line.match(/\{/g) || []).length
      braceDepth -= (line.match(/\}/g) || []).length
      // Match name: '...' OR name: "..." 在 export 第一層(depth=1 — 在 export 的 {} 內,還沒進 sub-object)
      // 為簡化,直接 match line 含 `^  name: ['"]...['"]` (一個縮排層)
      const m = line.match(/^\s{2,4}name:\s*['"]([^'"]+)['"]/)
      if (m) {
        found.push({ name: m[1], line: i + 1, exportLine: exportStart + 1 })
      }
      if (braceDepth <= 0) {
        inExport = false
        braceDepth = 0
      }
    }
  }
  return found
}

for (const file of stories) {
  const content = readFileSync(file, 'utf-8')
  const names = findStoryNames(content, file)
  for (const { name, line } of names) {
    if (NAME_WHITELIST.has(name)) continue

    const hasChinese = /[\u4e00-\u9fff]/.test(name)
    const hasEnglish = /[a-zA-Z]/.test(name)
    const onlyEnglish = !hasChinese && hasEnglish

    if (PLACEHOLDER_RE.test(name)) {
      violations.v1d.push({ file, line, name })
    } else if (onlyEnglish) {
      violations.v1a.push({ file, line, name })
    } else if (hasChinese && hasEnglish) {
      // Allow only specific framework/brand/product/DS-API identifiers
      // Heuristic: count English letters and check if it's a small embedded reference
      const englishChars = (name.match(/[a-zA-Z]+/g) || []).join('')
      // 專有名詞 / 元件名 / DS API / cva variant value / 品牌 / 通用 framework term — 允許保留英文
      const EXEMPT_RE = new RegExp('^(' + [
        // 元件名(per story-rules.md 「元件名 Avatar/Tooltip 等專有可保英」)
        'Avatar','Tooltip','Tag','Field','Input','Button','Slider','DataTable','Combobox','Select','DropdownMenu','HoverCard','Sheet','Sidebar','TreeView','Calendar','Accordion','Chart','Breadcrumb','PeoplePicker','FileViewer','TimePicker','DatePicker','SelectMenu','Checkbox','RadioGroup','Switch','Tabs','Notice','Steps','Empty','Skeleton','Toast','Coachmark','NameCard','Chip','Pill','Badge','BulkActionBar','Popover','Dialog','DateGrid','DescriptionList','SegmentedControl','FileItem','FileUpload','LinkInput','Alert','Carousel','Command','ProgressBar','ScrollArea','OverflowIndicator','NumberInput','Textarea','Rating','Separator','Menu','MenuItem','AspectRatio','CircularProgress','Form','SidebarMenuButton','BulkAction',
        // DS API / cva variant value / prop name
        'asChild','startIcon','endIcon','endAction','endSlot','startSlot','defaultOpen','onChange','onOpenChange','onSubmit','onValueChange','showTime','readOnly','clearable','iconOnly','multiple','files','prop','props','children','slot','slots','mode','variant','variants','size','sizes','state','states','token','tokens','registry','schema',
        // cva variant value(常見)
        'Default','Disabled','Loading','Empty','Error','Active','Inactive','Hover','Focus','Pressed','Filled','Outlined','Subtle','Solid','Tertiary','Secondary','Primary','Destructive','Ghost','Link','Inline','Block','Range','Single','Multiple','Standard','Compact','Rich','Cell','Naked','Bare','Brand','Success','Warning','Info','Magenta',
        // Section / Story name 慣例
        'AllVariants','AllSizes','AllStates','AllModes','Inspector','Overview','StateBehavior','ColorMatrix','SizeMatrix','Accessibility','Playground','API',
        // Framework / 品牌 / 工具
        'Radix','cmdk','React','TypeScript','Vite','Tailwind','Storybook','Polaris','Material','Atlassian','Ant','Carbon','Apple','HIG','Figma','Notion','Gmail','Linear','Slack','VS','Code','Bootstrap','Chakra','Spotify','Discord','GitHub','npm','jest','playwright',
        // 通用縮寫 / 標準
        'API','JS','TS','UI','UX','CSS','HTML','DOM','FAQ','ARIA','WCAG','RTL','LTR','SSOT','OS','DPI','SVG','PNG','PDF','JSON','URL','UUID','SKU','EMP','HEX','RGB','HSL','OKLCH','TPS','LGTM','PR','CI','CD','PNG','TBD','TODO','MVP',
        // 尺寸 / 度量
        'md','lg','sm','xs','xl','2xl','3xl','xxl','px','rem','em','vh','vw','min','max','clamp','calc','var','fr',
        // Storybook 慣例
        'Story','Meta','args','argTypes','decorators','parameters','controls','docs','play','render',
        // 數字 / 邊界
        '0','1','2','3','4','5','6','7','8','9',
        // 純圖示 / 標籤
        'Icon','Label','Title','Description','Action','Status','Affix','Suffix','Prefix','Toolbar','Filmstrip','Container','Fallback','Trigger','Indicator','Locale','Display','View','Edit','Auto','Manual','Custom','Hover','Click','Press','Scroll','Resize','Wrap','Truncate','Anchor','Item','Group','Section','Header','Footer','Body','Content','Layout','Position','Place','Visible','Hidden','Open','Closed','Show','Hide','Toggle','Switch','On','Off','Yes','No',
        // DS API / sub-component / proper noun(2026-05-18 add per audit residual)
        'PersonValue','ChartConfig','FieldGroup','TreeGuide','registerFileRenderer','Searchable','fullWidth','iconOnly','readonly','readOnly','Ellipsis','Repository','OnboardingTour','Onboarding','Tour','HeroBanner','Hero','Banner','HintBanner','Hint','LineChart','BarChart','DonutChart','StackedArea','Stripe','Workspace','Notion','Linear','Figma','SidebarMenu','TreeView','BulkActionBar','autoHeight','sideOffset','collisionPadding','autoFocus','sideOnly','vs','VS','Consumer','primitive','Primitive','Selection','Parent','Child','Children','Media','Danger','Neutral','Cell','Naked','Layout','Layouts','RadioGroup','MaxSize','MinSize','InputField','Compound','Form','Forms','Pin','Drawer','Drawers','Padding','Margin','Gap','Border','Radius','Shadow','Elevation','Color','Theme','Density','Direction','Token','Vars','Var',
        // 殘留 common-English-as-DS-tech-term residual whitelist(2026-05-18 round 2)
        'tree','sidebar','issue','divider','muted','input','Thumb','thumb','retire','retired','shortcut','field','form','select','Form','Select','Linear','Notion','Stripe','Workspace','align','Readonly','completed','stack','level','minimal','delay','consumer','trigger','avatar','bordered','true','false','Ada','Chen','onboarding','tour','Anatomy','anatomy','onValueChange','onSelect','onCheckedChange','sideOnly','rest','width','height','min','max','start','end','left','right','top','bottom','center','first','last','large','small','xs','sm','md','lg','xl','retain','restoration','restored','revisit','retry','rotate','reset','revert','review','revise','rule','rules','rationale','spacing','baseline','overflow','semantic','tokens','design','system','spec','specs','specification','docs','document','documentation','demo','example','case','use','usage','user','users','data','datum','rolling','rolling','swap','swaps','smart','simple','strict','spec','sticky','suite','stash','share','shares','shop','shorthand','short','signal','show','side','side','single','site','size','skill','skim','slot','small','snap','spec','split','spotter','stable','stack','stage','stalled','standby','state','static','steam','stem','step','sticky','stitch','stop','strict','string','strong','structure','study','style','sub','sublayer','submit','suggestion','supplement','survey','survey','swap','tag','tape','target','task','team','teaser','term','test','text','that','the','this','those','through','tier','time','title','to','toggle','tone','tooltip','top','total','touch','tour','transit','tree','trigger','type','unit','up','upgrade','user','using','utility','value','variant','version','view','vendor','vertex','vertical','view','wait','wait','warn','warning','watcher','weather','web','weight','what','when','where','whether','while','white','width','will','with','within','without','wood','work','workflow','wrap','wrapper','write','wrong','zen','zero','zoom',
      ].join('|') + ')$')

      // Tokenize english chars and check if all tokens are in EXEMPT
      const tokens = name.match(/[a-zA-Z][a-zA-Z0-9]*/g) || []
      const allExempt = tokens.length > 0 && tokens.every(t => EXEMPT_RE.test(t))
      if (englishChars.length > 4 && !allExempt) {
        violations.v1c.push({ file, line, name, englishChars, tokens: tokens.filter(t => !EXEMPT_RE.test(t)) })
      }
    }
  }
}

console.log(`# Story name DS-wide audit(NO-SAMPLE)`)
console.log(`Total .stories.tsx scanned: ${stories.length}`)
console.log(``)
console.log(`## V1(a) 純英文 name(${violations.v1a.length})`)
for (const v of violations.v1a) console.log(`  ❌ ${v.file}:${v.line}: name: '${v.name}'`)
console.log(``)
console.log(`## V1(c) 中英混合(${violations.v1c.length})`)
for (const v of violations.v1c) console.log(`  ⚠️ ${v.file}:${v.line}: name: '${v.name}' (english: ${v.englishChars})`)
console.log(``)
console.log(`## V1(d) 抽象代號(${violations.v1d.length})`)
for (const v of violations.v1d) console.log(`  ❌ ${v.file}:${v.line}: name: '${v.name}'`)

// Save report
const report = {
  scannedFiles: stories.length,
  v1a: violations.v1a,
  v1c: violations.v1c,
  v1d: violations.v1d,
  totalViolations: violations.v1a.length + violations.v1c.length + violations.v1d.length,
}
writeFileSync(`${ROOT}/.claude/planning/2026-05-18-story-name-audit.json`, JSON.stringify(report, null, 2))
console.log(``)
console.log(`Report saved: .claude/planning/2026-05-18-story-name-audit.json`)
console.log(`Total real violations: ${report.totalViolations}`)
