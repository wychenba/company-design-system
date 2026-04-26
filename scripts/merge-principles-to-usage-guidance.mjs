#!/usr/bin/env node
// Mechanical merge: WhenToUse + WhenNotToUse + Vs*Rule → ONE UsageGuidance
// per component principles.stories.tsx.
//
// Strategy:
//   1. Find each export const block matching decision pattern
//   2. Extract their render() return content
//   3. Build new UsageGuidance story concatenating contents wrapped in
//      Rule helpers (preserves real-world refs / existing styling)
//   4. Replace old exports + insert new UsageGuidance

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS_DIR = 'src/design-system/components';

const DECISION_PATTERNS = {
  when: /^(WhenToUse|WhatItIs|UsageScenarioRule)$/,
  not: /^(WhenNotToUse|Forbidden\w*|Donts\w*|Pitfalls|Prohibitions|NonGoals|VisualDonts)$/,
  vs: /^(Vs[A-Z]\w+|[A-Z][a-z]+Vs[A-Z]\w*Rule)$/,
};

function findExportBlock(content, exportName) {
  // Locate `export const NAME` and find matching closing `}` at top-level
  const re = new RegExp(`^export const ${exportName}\\b[^=]*=\\s*\\{`, 'm');
  const m = content.match(re);
  if (!m) return null;
  const start = m.index;
  let depth = 0;
  let inBlock = false;
  let i = start;
  for (; i < content.length; i++) {
    const c = content[i];
    if (c === '{') { depth++; inBlock = true; }
    else if (c === '}') {
      depth--;
      if (inBlock && depth === 0) { i++; break; }
    }
  }
  // Extend to end of line
  while (i < content.length && content[i] !== '\n') i++;
  // Include trailing blank line if present
  if (content[i] === '\n' && content[i+1] === '\n') i += 1;
  return { start, end: i + 1, text: content.slice(start, i + 1) };
}

function extractRenderBody(blockText) {
  // Find `render: () => ( ... )` content
  const m = blockText.match(/render:\s*\([^)]*\)\s*=>\s*\(/);
  if (!m) return null;
  const startIdx = m.index + m[0].length;
  let depth = 1;
  let i = startIdx;
  for (; i < blockText.length; i++) {
    if (blockText[i] === '(') depth++;
    else if (blockText[i] === ')') {
      depth--;
      if (depth === 0) break;
    }
  }
  return blockText.slice(startIdx, i).trim();
}

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const exports = [...content.matchAll(/^export const (\w+)/gm)].map(m => m[1]);

  if (exports.includes('UsageGuidance')) {
    return { status: 'skip', reason: 'already has UsageGuidance' };
  }

  const whenList = exports.filter(e => DECISION_PATTERNS.when.test(e));
  const notList = exports.filter(e => DECISION_PATTERNS.not.test(e));
  const vsList = exports.filter(e => DECISION_PATTERNS.vs.test(e));
  const merge = [...whenList, ...notList, ...vsList];

  if (merge.length < 2) {
    return { status: 'skip', reason: 'fewer than 2 decision stories' };
  }

  // Extract each block + render body
  const sections = [];
  const blocks = [];
  for (const name of merge) {
    const block = findExportBlock(content, name);
    if (!block) continue;
    const body = extractRenderBody(block.text);
    if (!body) continue;
    blocks.push(block);
    let label;
    if (whenList.includes(name)) label = '何時用';
    else if (notList.includes(name)) label = '何時不用 / 替代元件';
    else label = `vs 近親 — ${name}`;
    sections.push({ name, label, body });
  }

  if (sections.length < 2) {
    return { status: 'skip', reason: 'failed to extract sufficient render bodies' };
  }

  // Build new UsageGuidance — wrap each section's body inside a div with comment header
  const usageGuidance = `// ── UsageGuidance — 整合何時用 / 何時不用 / vs 近親(Polaris/Material/Ant 共識)
// 合併自舊 ${merge.join(' / ')}(2026-04-26 v3 canonical)

export const UsageGuidance: Story = {
  name: '使用指引',
  render: () => (
    <div className="flex flex-col gap-12">
${sections.map(s => `      {/* ${s.label} — 原 ${s.name} */}
      ${s.body}`).join('\n\n')}
    </div>
  ),
}
`;

  // Remove old blocks(reverse order to preserve indices)
  blocks.sort((a, b) => b.start - a.start);
  for (const b of blocks) {
    content = content.slice(0, b.start) + content.slice(b.end);
  }

  // Insert new UsageGuidance before first remaining export const(or at end)
  const firstExportMatch = content.match(/^export const /m);
  if (firstExportMatch) {
    const insertPos = firstExportMatch.index;
    // Find line start
    const lineStart = content.lastIndexOf('\n', insertPos) + 1;
    content = content.slice(0, lineStart) + usageGuidance + '\n' + content.slice(lineStart);
  } else {
    content += '\n' + usageGuidance;
  }

  writeFileSync(filePath, content);
  return {
    status: 'merged',
    merged: merge,
    sections: sections.length,
  };
}

const results = { merged: [], skipped: [], error: [] };
const dirs = readdirSync(COMPONENTS_DIR).filter(d => statSync(join(COMPONENTS_DIR, d)).isDirectory());
for (const name of dirs) {
  const dir = join(COMPONENTS_DIR, name);
  const files = readdirSync(dir).filter(f => f.endsWith('.principles.stories.tsx'));
  if (files.length === 0) continue;
  const filePath = join(dir, files[0]);
  try {
    const r = processFile(filePath);
    if (r.status === 'merged') results.merged.push({ name, ...r });
    else results.skipped.push({ name, reason: r.reason });
  } catch (e) {
    results.error.push({ name, reason: e.message });
  }
}

console.log(`\n=== Merge results ===`);
console.log(`Merged: ${results.merged.length}`);
results.merged.forEach(r => console.log(`  ✓ ${r.name}: ${r.merged.length} → 1 (sections=${r.sections})`));
console.log(`\nSkipped: ${results.skipped.length}`);
results.skipped.forEach(r => console.log(`  - ${r.name}: ${r.reason}`));
if (results.error.length) {
  console.log(`\nErrors: ${results.error.length}`);
  results.error.forEach(r => console.log(`  ✗ ${r.name}: ${r.reason}`));
}
