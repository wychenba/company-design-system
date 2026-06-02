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
  // 2026-05-29 Phase 2 monorepo 2-scenario arch:
  // DS-internal stories(sharedStoryGlobs)+ product apps stories(apps/**)。
  // Scenario A(直 fork DS)在同個 Storybook 看 DS docs + 自己產品 apps。
  // Namespace 區隔:`Design System/...`(DS internal)vs `Apps/<name>/...`(per check_consumer_app_story_title.sh enforced)。
  stories: [
    ...sharedStoryGlobs,
    '../src/explorations/**/*.stories.@(tsx|mdx)',
    '../apps/**/*.stories.@(tsx|mdx)',
  ],

  addons: [
    ...sharedAddons,
    // DS Devmode local addon — Figma Dev Mode 等級 inspect(anatomy / redline / token reverse lookup)
    // Local-only:DS repo dogfood,consumer product 不需要(他們看 storybook 不寫元件)
    './addons/ds-devmode/preset',
    // 2026-05-26 DS-internal HTML viewer addon(2026-05-26 移出 shared preset 因 consumer 缺 peer deps)。
    // DS repo 有 react-syntax-highlighter + prettier(via design-system devDeps),可正常 load。
    '@whitespace/storybook-addon-html',
  ],

  framework: sharedFramework,
  docs: sharedDocsConfig,
  typescript: sharedTypescriptConfig,
}

export default config
