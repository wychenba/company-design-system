// 2026-05-22 Phase 2 team-distribution-roadmap:dogfood `@qijenchen/storybook-config`
// 共用 addons + framework + docs config 從 package import,本檔只加 DS-internal addon(ds-devmode)
// 2026-05-26 改用 npm package path(`@qijenchen/storybook-config/preset`)而非 monorepo relative —
// 真正 dogfood consumer code path,確保 published package 也跑得起來(monorepo `workspaces:` 自動 resolve)
import type { StorybookConfig } from '@storybook/react-vite'
import {
  sharedAddons,
  sharedFramework,
  sharedDocsConfig,
  sharedTypescriptConfig,
  sharedStoryGlobs,
} from '@qijenchen/storybook-config/preset'

const config: StorybookConfig = {
  stories: sharedStoryGlobs,

  addons: [
    ...sharedAddons,
    // DS Devmode local addon — Figma Dev Mode 等級 inspect(anatomy / redline / token reverse lookup)
    // Local-only:DS repo dogfood,consumer product 不需要(他們看 storybook 不寫元件)
    './addons/ds-devmode/preset',
  ],

  framework: sharedFramework,
  docs: sharedDocsConfig,
  typescript: sharedTypescriptConfig,
}

export default config
