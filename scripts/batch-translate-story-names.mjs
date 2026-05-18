#!/usr/bin/env node
/**
 * Batch-translate story `name:` field violations(per 2026-05-18 audit)
 * 21 純英 + 183 中英混合 → 中文人話
 *
 * Strategy:
 *   - Read report from .claude/planning/2026-05-18-story-name-audit.json
 *   - Apply per-pattern translation
 *   - 機械化 mapping + slash/plus 結構保留 + 跳過 API/brand identifier whitelist
 *   - Write only `name: '...'` field — 不動其他內容
 */

import { readFileSync, writeFileSync } from 'node:fs'

const ROOT = process.cwd()
const reportPath = `${ROOT}/.claude/planning/2026-05-18-story-name-audit.json`
const report = JSON.parse(readFileSync(reportPath, 'utf-8'))

// 字典 — 中英混合 / 純英 → 中文人話
// 保留 framework / brand / DS-API identifier(Tag / Input / Field / Avatar / FileItem / etc 是元件名)
const TRANSLATE = new Map([
  // 純英(V1a)
  ['Subtle + Description', '低調 + 說明文字'],
  ['Solid + Description', '實心 + 說明文字'],
  ['Placement(inline vs fixed)', '出現位置(內嵌 vs 固定)'],
  ['FAQ', 'FAQ 常見問題'],
  ['Layout(wrap / scroll / menu)', '排版(換行 vs 捲動 vs 選單)'],
  ['Overflow:wrap vs scroll vs menu', '超出處理:換行 vs 捲動 vs 選單'],
  ['Overflow:wrap vs scroll vs menu', '超出處理:換行 vs 捲動 vs 選單'],
  ['cols(1 / 2 / 3)', '欄數(1 / 2 / 3)'],
  ['Vertical vs Horizontal(cols)', '直式 vs 橫式(欄數對照)'],
  ['16/9 Hero Banner', '16:9 主視覺橫幅'],
  ['1/1 Instagram post', '1:1 社群方形貼文'],
  ['21/9 Cinematic banner', '21:9 影院橫幅'],
  ['Min / Max / Step', '最小 / 最大 / 步階'],
  ['Block control — RadioGroup', '區塊內控制元件 — RadioGroup'],
  ['Hover / Focus', '滑鼠移過 / 鍵盤聚焦'],
  ['iconOnly(group-level)', '純圖示(群組層)'],
  ['Ada Chen', 'Ada Chen(範例人名)'],
  ['Start Icon + Description', '前置圖示 + 說明文字'],
  ['Avatar + description', '頭像 + 說明文字'],
  ['Avatar overlay:presence dot / count badge', '頭像疊加層:在線小點 / 計數徽章'],
  ['Q1-marketing-report.pdf', 'Q1 行銷報告 PDF(範例檔)'],
  ['Declarative + Auto-collapse', '宣告式 API + 自動收合'],

  // 中英混合(V1c)— 常用模式
  ['Dismiss vs Destructive 語意區分', '取消 vs 危險動作 語意區分'],
  ['Icon Action Primitive 決策', '圖示動作通用零件決策'],
  ['Radio 不可單獨使用', '單選按鈕不可單獨使用'],
  ['垂直 Group', '直式群組'],
  ['Overflow 處理(scroll / menu)', '超出處理(捲動 / 選單)'],
  ['間距 Token', '間距設計變數'],
  ['Trigger slot 使用', '觸發位置插槽使用'],
  ['變體對照(default vs meta)', '變體對照(預設 vs 次要)'],
  ['寬度與框架 Token', '寬度與框架設計變數'],
  ['群組 / Label 使用原則', '群組 / 標籤使用原則'],
  ['Settings 類有子頁的頁面', '設定類有子頁的頁面'],
  ['Active state 跨群組單一', '啟用狀態跨群組單一'],
  ['multiple 選擇', '多選'],
  ['與 FileItem 的分工', '與 FileItem 的職責分工'],
  ['accept + maxSize + onReject 三配套', '檔案類型 + 最大尺寸 + 拒絕回呼 三配套'],
  ['內建 files prop', '內建 files 屬性'],
  ['Range 用兩個 TimePicker 組合,不內建', '時間範圍用兩個 TimePicker 組合,不內建'],
  ['清除用 X inline action,不用 label button', '清除用 X 行內動作,不用文字按鈕'],
  ['何時需要 tooltip', '何時需要工具提示'],
  ['Precision 選擇', '精度選擇'],
  ['Event color 類別語意', '事件顏色類別語意'],
  ['Slot 組合(description only → full)', '插槽組合(只有說明 → 完整)'],
  ['Icon + Title + Description + Action 結構', '圖示 + 標題 + 說明 + 動作 結構'],
])

function fixFile(filePath, oldName, newName) {
  const full = `${ROOT}/${filePath}`
  let content = readFileSync(full, 'utf-8')
  // Match `name: 'X'` OR `name: "X"` precise
  const esc = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(\\bname:\\s*)(['"])${esc}\\2`, 'g')
  const updated = content.replace(re, (_m, prefix, q) => `${prefix}${q}${newName}${q}`)
  if (updated === content) return { changed: false, reason: 'no-match' }
  writeFileSync(full, updated, 'utf-8')
  return { changed: true }
}

let fixed = 0
let unchanged = 0
let noMatch = 0
const all = [...report.v1a, ...report.v1c]
for (const v of all) {
  const newName = TRANSLATE.get(v.name)
  if (!newName) { unchanged++; continue }
  const r = fixFile(v.file, v.name, newName)
  if (r.changed) fixed++
  else if (r.reason === 'no-match') noMatch++
}

console.log(`Fixed: ${fixed}`)
console.log(`No-translation-mapping(skipped): ${unchanged}`)
console.log(`No-regex-match(file changed since audit?): ${noMatch}`)
console.log(`Total in report: ${all.length}`)
