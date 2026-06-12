# Changesets

2026-05-22 Phase 4 team-distribution-roadmap ship。Semver release for
`@qijenchen/design-system` + `@qijenchen/storybook-config`(linked versions per `config.json`)。

**2026-05-29 起 release 走手動 bump + GitHub Releases auto-notes**(commit 0146e02f):changesets 一直沒被 consume、`changeset-release/main` bot 支線是純 noise 已刪。目前 `.changeset/config.json` 保留備用(未來若改回 changesets-driven 可直接 re-adopt),但實際 release 不再依賴 `npx changeset` / `changeset-bot` / `changeset publish`。

## Workflow(手動 bump)

1. **Bump**:跑版本 bump(同步 `packages/*` + plugin/marketplace manifest)— 見 `scripts/sync-version-to-all-manifests.mjs`(讀 DS package.json 新 version → 同步寫進 plugin.json + marketplace.json 3 處)
2. **Tag + push**:打 tag(`0.1.0-beta.<N>`)push 上去
3. **Release**:tag push 觸發 `.github/workflows/release.yml`(`on: push: tags:`)→ audit gates → npm publish → `softprops/action-gh-release` 以 `generate_release_notes: true` 產 GitHub Release(changelog 由 GitHub Releases auto-notes 提供,無 tracked CHANGELOG.md)→ dispatch ds-product-template + fork repos cross-repo sync

## Codemod for breaking change

Major version bump 必伴隨 codemod(per roadmap Phase 4 deliverable):
- `packages/design-system/codemods/v1-to-v2/` etc.
- jscodeshift-based migration script
- README docs path

## World-class ref

- changesets/changesets GitHub repo
- Vercel `pkg.pr.new` pre-release model
- Material UI / Storybook / Radix UI 全 npm ecosystem 慣例
