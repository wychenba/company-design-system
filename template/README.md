# template/

2026-05-23 ship per team-distribution-roadmap Phase 5+6 — pre-built scaffold 給 user 不用等 Claude 在 new repo 內生 boilerplate。

## 安全 / 部署模式(per 2026-05-23 user directive)

**Repo**:**Private**(team member-only collaborators,non-member 看不到 source)
**App / Storybook host**:**Netlify**(non-GitHub Pages — public host 不適合 private workspace)
**權限控管**:**Netlify Basic Password**(free-tier 唯一可用,共用 password)OR Pro Team protection($19/mo,per-account login)OR Cloudflare Access(免費 50 user,自架 SSO)— 2026-05-29 改 from Identity(已 deprecated)

不適用 host(本 template 已 ban):
- ❌ **GitHub Pages**:public host,private workspace 不該 expose
- ❌ **Vercel free tier**:可,但本 template 統一 Netlify(reduce host fragmentation)

## 命名 SSOT(2026-05-29 釐清,前期 dir/repo 名 drift)

- **DS-internal source dir**: `template/product-workspace/`(本目錄,scaffold source SSOT;歷史名「product-workspace」沿用,內部 path 不影響 fork user)
- **Published GitHub Template Repository**: [`ajenchen/ds-product-template`](https://github.com/ajenchen/ds-product-template)(fork user 真實看到 / fork 的 repo,2026-05-27 從 `product-workspace` 重命名)
- **Fork user 創的 new repo**: `<their-username>/<their-product-name>`(他們自選)

## 怎麼用(2026-05-27 已升級成「Use this template」按鈕,以下為 owner setup 流程)

**Owner setup once**:在 `ajenchen/ds-product-template` GitHub repo → `Settings → General → Template repository ✓` 勾選 + `Settings → General → Change visibility: Public`。本 DS repo `template/product-workspace/` 內容透過 sync 機制(or 手動 push)同步到 `ajenchen/ds-product-template`。

**Fork user**:在 `ajenchen/ds-product-template` 點「Use this template」→ 自動建他自己的 repo,流程詳該 repo `README.md`「Template Usage」段。

**(歷史:legacy bash 流程 — 在 template-repository 機制前用)**
```bash
gh repo create ajenchen/ds-product-template --private --confirm
git clone github.com/ajenchen/ds-product-template
cd ds-product-template
cp -r /path/to/this-ds-repo/template/product-workspace/. .
sed -i '' 's/qijenchen/<YOUR_ORG>/g' package.json .github/CODEOWNERS README.md
npm install
git add . && git commit -m "chore: initial scaffold from DS template"
git push origin main
```

完成,team 之後從 [`ajenchen/ds-product-template`](https://github.com/ajenchen/ds-product-template) repo 「Use this template」開工(per [docs/01-first-time-setup.md](product-workspace/docs/01-first-time-setup.md))。

## Files included

```
template/product-workspace/
├── README.md                            ← consumer-facing quick start
├── package.json                          ← workspaces + DS deps + scripts
├── tsconfig.json                         ← (TODO consumer 自添)
├── vite.config.ts                        ← (TODO consumer 自添)
├── .gitignore
├── renovate.json                         ← auto DS bump PR
├── .claude/
│   └── settings.json                     ← enable design-system@qijenchen plugin
├── .storybook/
│   ├── main.ts                           ← import from @qijenchen/storybook-config
│   └── preview.tsx                       ← import shared preview
├── .github/
│   ├── CODEOWNERS                        ← team review
│   └── workflows/
│       ├── audit.yml                     ← per-PR tsc + content + code + build + storybook
│       └── deploy.yml                    ← per-app Vercel matrix deploy
├── apps/
│   └── _template/                        ← npm run create-app <name> source
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           └── main.tsx                  ← demo with DS Button + Avatar
├── packages/
│   └── shared-utils/                     ← (TODO consumer fill 跨 product utility)
├── scripts/
│   └── create-app.mjs                    ← npm run create-app <name> generator
├── codemods/
│   └── README.md                         ← DS major bump migration scripts hub
└── docs/
    ├── 01-first-time-setup.md            ← Day 0 上工
    ├── 02-create-new-product.md          ← 生新 app
    ├── 03-co-edit-workflow.md            ← team PR / merge
    ├── 04-ds-upgrade.md                  ← auto-update propagation 機制
    └── 05-troubleshooting.md             ← 排查
```

## DS side preconditions(must be satisfied first)

1. `@qijenchen/design-system` published to npm(or internal registry consumer can pull from)
2. `@qijenchen/storybook-config` published(same as DS)
3. `design-system@qijenchen` Claude plugin published to marketplace(per host decision)
4. NPM_TOKEN(or alternative auth)distributed to `ajenchen/ds-product-template` as CI secret
5. Renovate app installed to `qijenchen` GitHub org
