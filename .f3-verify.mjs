import { chromium } from 'playwright';

const URL = 'file:///home/user/design-system/storybook-static/iframe.html?id=design-system-components-datatable--row-drag-interactive&viewMode=story';

const out = (msg) => console.log(`[verify] ${msg}`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('[console.error]', m.text());
});

await page.goto(URL, { waitUntil: 'networkidle' });
// Wait for table rows
await page.waitForSelector('[role="row"], tr', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(800);

// Capture row order initially
const initialRowTexts = await page.$$eval('tr, [role="row"]', (rows) =>
  rows.map((r) => r.textContent?.trim().slice(0, 40)).filter(Boolean),
);
out(`Initial rows count: ${initialRowTexts.length}`);
out(`Initial first 5 rows: ${JSON.stringify(initialRowTexts.slice(0, 5))}`);

// Screenshot 1 — initial (no hover)
await page.screenshot({ path: '/tmp/f3-row-drag-verify-1.png', fullPage: false });
out('shot1 saved');

// Find drag handles. The story says GripVertical reveals on hover.
// Look for an element rendered as drag handle — likely button with grip icon.
const handleSelectors = [
  '[data-row-drag-handle]',
  '[aria-label*="drag"]',
  '[aria-label*="Drag"]',
  'button:has(svg.lucide-grip-vertical)',
  '[data-testid*="drag"]',
  'svg.lucide-grip-vertical',
];

let handleSel = null;
for (const sel of handleSelectors) {
  const c = await page.locator(sel).count();
  if (c > 0) {
    handleSel = sel;
    out(`Found handle via selector: ${sel} (count=${c})`);
    break;
  }
}

if (!handleSel) {
  // Dump first row HTML for debug
  const firstRowHtml = await page.locator('tr, [role="row"]').nth(1).innerHTML().catch(() => '(none)');
  out('No drag handle selector matched. First row HTML excerpt:');
  console.log(firstRowHtml.slice(0, 2000));
}

// First data row (skip header)
const firstDataRow = page.locator('tbody tr, [role="rowgroup"] [role="row"]').first();
const rowBox = await firstDataRow.boundingBox();
out(`First data row box: ${JSON.stringify(rowBox)}`);

// Hover at far-left of first row to trigger handle reveal
if (rowBox) {
  await page.mouse.move(rowBox.x + 8, rowBox.y + rowBox.height / 2);
  await page.waitForTimeout(300);
}

// Check handle visibility (opacity)
let handleOpacityBefore = null, handleOpacityAfter = null;
if (handleSel) {
  const handleHandle = page.locator(handleSel).first();
  // Note: the prior screenshot1 was taken before hover; we read opacity now post-hover
  handleOpacityAfter = await handleHandle.evaluate((el) => {
    const target = el.closest('button') || el;
    return getComputedStyle(target).opacity;
  }).catch(() => 'err');
  out(`Handle opacity AFTER hover: ${handleOpacityAfter}`);
}

await page.screenshot({ path: '/tmp/f3-row-drag-verify-2.png', fullPage: false });
out('shot2 saved (hover state)');

// Read opacity for unhovered (last row) handle for comparison
if (handleSel) {
  const allHandles = await page.locator(handleSel).count();
  if (allHandles > 1) {
    handleOpacityBefore = await page.locator(handleSel).last().evaluate((el) => {
      const target = el.closest('button') || el;
      return getComputedStyle(target).opacity;
    }).catch(() => 'err');
    out(`Handle opacity (unhovered last-row): ${handleOpacityBefore}`);
  }
}

// Attempt programmatic drag from row1 handle to row3 area
let dragOk = false;
let finalRowTexts = initialRowTexts;
if (handleSel && rowBox) {
  try {
    const handleEl = page.locator(handleSel).first();
    const hb = await handleEl.boundingBox();
    out(`Handle box: ${JSON.stringify(hb)}`);
    const row3 = page.locator('tbody tr, [role="rowgroup"] [role="row"]').nth(2);
    const r3b = await row3.boundingBox();
    out(`Row3 box: ${JSON.stringify(r3b)}`);
    if (hb && r3b) {
      // dnd-kit uses pointer events; emulate
      await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
      await page.mouse.down();
      // gradual movement to trigger activation distance
      const steps = 12;
      const dx = (r3b.x + r3b.width / 2) - (hb.x + hb.width / 2);
      const dy = (r3b.y + r3b.height / 2 + 4) - (hb.y + hb.height / 2);
      for (let i = 1; i <= steps; i++) {
        await page.mouse.move(hb.x + hb.width / 2 + (dx * i) / steps, hb.y + hb.height / 2 + (dy * i) / steps, { steps: 2 });
        await page.waitForTimeout(20);
      }
      await page.waitForTimeout(150);
      await page.mouse.up();
      await page.waitForTimeout(400);
      dragOk = true;
    }
  } catch (e) {
    out('drag err: ' + e.message);
  }
}

finalRowTexts = await page.$$eval('tr, [role="row"]', (rows) =>
  rows.map((r) => r.textContent?.trim().slice(0, 40)).filter(Boolean),
);
out(`Final first 5 rows: ${JSON.stringify(finalRowTexts.slice(0, 5))}`);

await page.screenshot({ path: '/tmp/f3-row-drag-verify-3.png', fullPage: false });
out('shot3 saved (post-drag)');

const reordered = JSON.stringify(initialRowTexts) !== JSON.stringify(finalRowTexts);
out(`Order changed: ${reordered}`);

await browser.close();

console.log(JSON.stringify({
  handleSelector: handleSel,
  handleOpacityHovered: handleOpacityAfter,
  handleOpacityUnhovered: handleOpacityBefore,
  initialFirstRows: initialRowTexts.slice(0, 5),
  finalFirstRows: finalRowTexts.slice(0, 5),
  reordered,
  dragAttempted: dragOk,
}, null, 2));
