#!/usr/bin/env node
/**
 * Word-level batch translation for 118 remaining 中英混合 story names.
 * Tokenize name → translate each English word via dict → reassemble.
 * Keeps DS-API / brand / cva-variant identifiers as-is.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()

// Word → 翻譯。Lowercase key 對應原 lowercase / Capitalized 各自翻
const TRANSLATE_LC = new Map([
  ['indent', '縮排'],
  ['expand', '展開'],
  ['select', '選取'],
  ['token', '設計變數'],
  ['variant', '變體'],
  ['duration', '持續時間'],
  ['label', '標籤'],
  ['orientation', '方向'],
  ['clearable', '可清空'],
  ['state', '狀態'],
  ['mode', '模式'],
  ['prop', '屬性'],
  ['slot', '插槽'],
  ['border', '邊框'],
  ['bg', '背景'],
  ['padding', '內距'],
  ['placeholder', '占位'],
  ['nested', '巢狀'],
  ['gallery', '相簿'],
  ['rhythm', '節奏'],
  ['zoom', '縮放'],
  ['filmstrip', '縮圖膠卷'],
  ['column', '欄'],
  ['title', '標題'],
  ['description', '說明'],
  ['action', '動作'],
  ['suffix', '後綴'],
  ['prefix', '前綴'],
  ['indicator', '指示'],
  ['container', '容器'],
  ['fallback', '退場方案'],
  ['toolbar', '工具列'],
  ['retire', '退役'],
  ['control', '控制元件'],
  ['layout', '排版'],
  ['horizontal', '水平'],
  ['vertical', '垂直'],
  ['locale', '地區設定'],
  ['multi', '多'],
  ['single', '單'],
  ['range', '範圍'],
  ['edit', '編輯'],
  ['display', '顯示'],
  ['view', '檢視'],
  ['generic', '通用'],
  ['ratio', '比例'],
  ['clamp', '夾值'],
  ['header', '頁首'],
  ['footer', '頁尾'],
  ['undo', '復原'],
  ['pattern', '模式'],
  ['focus', '聚焦'],
  ['hover', '滑鼠移過'],
  ['active', '啟用'],
  ['inactive', '未啟用'],
  ['disabled', '停用'],
  ['error', '錯誤'],
  ['loading', '載入中'],
  ['empty', '空'],
  ['default', '預設'],
  ['solid', '實心'],
  ['subtle', '低調'],
  ['outlined', '描邊'],
  ['filled', '填滿'],
  ['ghost', '幽靈'],
  ['primary', '主要'],
  ['secondary', '次要'],
  ['tertiary', '第三層'],
  ['destructive', '危險'],
  ['link', '連結'],
  ['standard', '標準'],
  ['compact', '緊湊'],
  ['rich', '豐富'],
  ['cell', '儲存格'],
  ['naked', '裸態'],
  ['inline', '行內'],
  ['block', '區塊'],
  ['icon', '圖示'],
  ['item', '項目'],
  ['items', '項目'],
  ['group', '群組'],
  ['section', '區段'],
  ['body', '主體'],
  ['content', '內容'],
  ['position', '位置'],
  ['place', '位置'],
  ['visible', '可見'],
  ['hidden', '隱藏'],
  ['open', '開啟'],
  ['closed', '關閉'],
  ['show', '顯示'],
  ['hide', '隱藏'],
  ['toggle', '切換'],
  ['switch', '開關'],
  ['on', '開'],
  ['off', '關'],
  ['yes', '是'],
  ['no', '否'],
  ['wrap', '換行'],
  ['scroll', '捲動'],
  ['menu', '選單'],
  ['click', '點擊'],
  ['press', '按下'],
  ['resize', '縮放'],
  ['truncate', '截斷'],
  ['anchor', '錨點'],
  ['orientation', '方向'],
  ['locale', '地區設定'],
  ['precision', '精度'],
  ['multiple', '多選'],
  ['affix', '附加位'],
  ['status', '狀態'],
  ['style', '樣式'],
  ['size', '尺寸'],
  ['width', '寬度'],
  ['height', '高度'],
  ['gap', '間距'],
  ['radius', '圓角'],
  ['shadow', '陰影'],
  ['close', '關閉'],
  ['dismiss', '取消'],
  ['confirm', '確認'],
  ['cancel', '取消'],
  ['ok', '確定'],
  ['accept', '接受'],
  ['reject', '拒絕'],
  ['save', '儲存'],
  ['delete', '刪除'],
  ['remove', '移除'],
  ['clear', '清空'],
  ['add', '新增'],
  ['new', '新'],
  ['old', '舊'],
  ['first', '第一'],
  ['last', '最後'],
  ['next', '下一'],
  ['prev', '上一'],
  ['previous', '上一'],
  ['power', '進階'],
  ['user', '使用者'],
  // chart 類型
  ['bar', '長條'],
  ['line', '折線'],
  ['donut', '環圈'],
  ['stacked', '堆疊'],
  ['area', '面積'],
  ['chart', '圖表'],
  // UI patterns
  ['banner', '橫幅'],
  ['hero', '主視覺'],
  ['hint', '提示'],
  ['repository', '程式庫'],
  ['onboarding', '引導'],
  ['tour', '導覽'],
  ['parent', '父層'],
  ['child', '子'],
  ['media', '媒體'],
  ['danger', '危險'],
  ['neutral', '中性'],
  ['connector', '連線'],
  ['ring', '環'],
  ['marker', '標記'],
  ['selection', '選取'],
  ['anchor', '錨點'],
  ['arrow', '箭頭'],
  ['detail', '詳情'],
  ['project', '專案'],
  ['workspace', '工作區'],
  ['actions', '動作'],
  ['readonly', '唯讀'],
  ['middle', '中段'],
  ['side', '位置'],
  ['surface', '視覺底'],
  ['convention', '慣例'],
  ['contrast', '對比'],
  ['floor', '下限'],
])

// 不翻 — DS-API / brand / cva-variant-name / 元件名 / 純識別字(過短可能是縮寫)
const DONT_TRANSLATE = new Set([
  // 元件名
  'avatar','tooltip','tag','field','input','button','slider','datatable','combobox','select','dropdownmenu','hovercard','sheet','sidebar','treeview','calendar','accordion','chart','breadcrumb','peoplepicker','fileviewer','timepicker','datepicker','selectmenu','checkbox','radiogroup','tabs','notice','steps','skeleton','toast','coachmark','namecard','chip','badge','bulkactionbar','popover','dialog','dategrid','descriptionlist','segmentedcontrol','fileitem','fileupload','linkinput','alert','carousel','command','progressbar','scrollarea','overflowindicator','numberinput','textarea','rating','separator','aspectratio','circularprogress','form','sidebarmenu','sidebarmenubutton','radio','aria','wcag',
  // brand
  'radix','cmdk','react','typescript','vite','tailwind','storybook','polaris','material','atlassian','ant','carbon','apple','hig','figma','notion','gmail','linear','slack','vs','code','bootstrap','chakra','spotify','discord','github','npm','jest','playwright','undo','redo',
  // DS API
  'aschild','starticon','endicon','endaction','endslot','startslot','defaultopen','onchange','onopenchange','onsubmit','onvaluechange','showtime','readonly','iconony','iconly','files','file','children','registerfilerender','registerfilerenderer','chartconfig',
  // cva variant value
  'allvariants','allsizes','allstates','allmodes','playground','api','inspector','overview','statebehavior','colormatrix','sizematrix','accessibility','brand','success','warning','info','magenta',
  // 標準 size
  'md','lg','sm','xs','xl','2xl','3xl','xxl',
  // 數字
  '0','1','2','3','4','5','6','7','8','9',
  // CSS
  'px','rem','em','vh','vw','fr','flex','grid','px','min','max','calc','var',
  // file ext
  'pdf','png','svg','json','html','css',
  // 縮寫
  'faq','json','url','uuid','sku','emp','hex','rgb','hsl','oklch','tps','lgtm','pr','ci','cd','dpi','ui','ux','os','tbd','todo','mvp','ssot','dom','js','ts','rtl','ltr','rwd',
  // 已 retire
  'retire','retired','deprecated','obsolete',
])

function translateName(name) {
  // Tokenize: split by English-word boundaries, keep delimiters
  return name.replace(/[a-zA-Z][a-zA-Z0-9]*/g, (word) => {
    const lc = word.toLowerCase()
    if (DONT_TRANSLATE.has(lc)) return word
    const cn = TRANSLATE_LC.get(lc)
    return cn || word
  })
}

const reportPath = `${ROOT}/.claude/planning/2026-05-18-story-name-audit.json`
// Re-run audit to get fresh report
execSync('node scripts/audit-story-name-chinese.mjs', { stdio: 'pipe' })
const report = JSON.parse(readFileSync(reportPath, 'utf-8'))

const allViolations = [...report.v1a, ...report.v1c, ...report.v1d]
let fixed = 0
let unchanged = 0

for (const v of allViolations) {
  const newName = translateName(v.name)
  if (newName === v.name) {
    unchanged++
    continue
  }
  // Apply Edit
  const full = `${ROOT}/${v.file}`
  let content = readFileSync(full, 'utf-8')
  const esc = v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(\\bname:\\s*)(['"])${esc}\\2`, 'g')
  const updated = content.replace(re, (_m, prefix, q) => `${prefix}${q}${newName}${q}`)
  if (updated !== content) {
    writeFileSync(full, updated, 'utf-8')
    fixed++
  } else {
    unchanged++
  }
}

console.log(`Fixed: ${fixed}`)
console.log(`Unchanged: ${unchanged}`)
console.log(`Total in audit: ${allViolations.length}`)
