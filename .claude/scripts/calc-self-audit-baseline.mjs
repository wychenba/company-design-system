#!/usr/bin/env node
// Calculate dynamic threshold from baseline-counts.jsonl
// 對齊 Datadog Watchdog「mean + 2σ」outlier detection 哲學
// Usage: node .claude/scripts/calc-self-audit-baseline.mjs

import fs from 'node:fs';
import path from 'node:path';

const FILE = path.resolve('.claude/logs/self-audit-baseline-counts.jsonl');

if (!fs.existsSync(FILE)) {
  console.log('No baseline file. Hook will use fixed threshold (Bugsnag/ESLint-aligned).');
  process.exit(0);
}

const lines = fs.readFileSync(FILE, 'utf8').trim().split('\n').filter(Boolean);
if (lines.length < 100) {
  console.log(`Baseline samples: ${lines.length} / 100 (need ≥ 100 for dynamic threshold). Hook still uses fixed.`);
  process.exit(0);
}

const stats = (arr) => {
  const n = arr.length;
  const mean = arr.reduce((s, x) => s + x, 0) / n;
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  return { n, mean, stddev, mean_plus_2sigma: mean + 2 * stddev };
};

const triggers = lines.map(l => JSON.parse(l).trigger || 0);
const topics = lines.map(l => JSON.parse(l).topic || 0);

console.log('Trigger phrase baseline:');
console.log(stats(triggers));
console.log('\nTopic repeat baseline:');
console.log(stats(topics));

console.log('\n→ Recommended dynamic thresholds(mean + 2σ outlier detection):');
console.log(`  Trigger ≥ ${Math.ceil(stats(triggers).mean_plus_2sigma)}`);
console.log(`  Topic > ${Math.ceil(stats(topics).mean_plus_2sigma)}`);
console.log('\nApply: edit .claude/hooks/stop_self_audit.sh L106 / L117 thresholds.');
