import { chromium } from 'playwright'

const URL = 'http://localhost:6006'

const probes = [
  {
    name: 'SidebarHeader chrome-header-height md=48',
    storyId: 'design-system-components-sidebar-展示--icon-collapse',
    selector: '[data-sidebar="header"]',
    expectedHeight: 48,
  },
  {
    name: 'FileViewer Toolbar lockDensity=lg → 56',
    storyId: 'design-system-components-fileviewer-展示--open-snapshot',
    selector: '[data-density="lg"]', // ChromeHeader 第一個 with lockDensity="lg"
    expectedHeight: 56,
  },
  {
    name: 'Tabs trigger default(sm)=32',
    storyId: 'design-system-components-tabs-展示--default',
    selector: '[role="tab"]',  // 單個 trigger 量純 height
    expectedHeight: 32,
  },
  {
    name: 'Tabs list default = trigger(32) + border-b(1) = 33',
    storyId: 'design-system-components-tabs-展示--default',
    selector: '[role="tablist"]',
    expectedHeight: 33,  // items-stretch makes triggers fill;list 加自己的 border-b
  },
]

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

let pass = 0
let fail = 0
const failures = []

for (const probe of probes) {
  const url = `${URL}/iframe.html?id=${probe.storyId}&viewMode=story`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  const heights = await page.evaluate((sel) => {
    const elements = Array.from(document.querySelectorAll(sel))
    return elements.map((el) => el.getBoundingClientRect().height)
  }, probe.selector)

  if (heights.length === 0) {
    console.log(`  ❌ ${probe.name}: selector "${probe.selector}" no element found`)
    fail++
    failures.push({ ...probe, actual: 'no-element', heights: [] })
    continue
  }

  const firstH = Math.round(heights[0])
  if (firstH === probe.expectedHeight) {
    console.log(`  ✅ ${probe.name}: ${firstH}px(${heights.length} matched)`)
    pass++
  } else {
    console.log(`  ❌ ${probe.name}: expected ${probe.expectedHeight}, got ${firstH}(all heights: ${heights.map(h => Math.round(h)).join(',')})`)
    fail++
    failures.push({ ...probe, actual: firstH, heights })
  }
}

await browser.close()

console.log(`\nResult: ${pass}/${probes.length} pass`)
if (fail > 0) {
  console.log('Failures:', JSON.stringify(failures, null, 2))
  process.exit(1)
}
