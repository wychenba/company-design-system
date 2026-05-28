import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Use extensionless paths — tsc compiles to ./manager.js + ./preview.js in dist/;
// require.resolve respects node module resolution(.js > .mjs > .cjs)without
// hardcoded source extension that breaks post-publish.
export const managerEntries = (entry: string[] = []) => [...entry, require.resolve('./manager')]
export const previewAnnotations = (entry: string[] = []) => [...entry, require.resolve('./preview')]
