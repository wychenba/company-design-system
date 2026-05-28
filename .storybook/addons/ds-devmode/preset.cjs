// preset.cjs — hand-written CommonJS preset(mirror of packages/storybook-config/
// addons/ds-devmode/preset.cjs)to bypass ESM/CJS evaluation conflict。
//
// 2026-05-28 beta.27-.31 5 連敗 anchor:storybook-config 用 createRequire / fileURLToPath
// 在 ESM scope 都被 esbuild-register CJS-transpile + Node ESM-execute 衝突攔。
// `.cjs` 強制 CJS evaluation = world-class Storybook addon canonical pattern。
//
// Source `.storybook/addons/ds-devmode/manager.tsx` + `preview.ts` 走 esbuild-register
// on-the-fly transpile → 此 .cjs path.resolve 路徑直接指 .tsx / .ts(esbuild-register
// handles 副檔名)。NOT compiled dist。
const path = require('path')

module.exports = {
  managerEntries: (entry = []) => [...entry, path.join(__dirname, 'manager.tsx')],
  previewAnnotations: (entry = []) => [...entry, path.join(__dirname, 'preview.ts')],
}
