// DEPRECATED 2026-05-28 — entry point moved to ./preset.cjs(per beta.27-.31 5 連敗
// root cause:Node ESM/esbuild-register CJS-interop 衝突,`.cjs` 強制 CJS 是唯一可
// 靠 pattern)。`./preset` exports map points to preset.cjs。本 .ts 留作 type-check
// reference + git-blame anchor,但不被任何 consumer 載入。
//
// 對齊 packages/storybook-config/addons/ds-devmode/preset.cjs 同 pattern。

export const managerEntries = (entry: string[] = []) => entry
export const previewAnnotations = (entry: string[] = []) => entry
