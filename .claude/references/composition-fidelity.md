# Composition Fidelity Visual Diff(SSOT,2026-05-27 codify)

**Mechanical 機制讓「DS components 在 consumer (ds-product-template) 渲染必跟 DS canonical 一致」可被驗證**(byte-identity 不夠,需 visual diff)。

Per user 2026-05-27 verbatim directive 對應 root cause:**DS source 提供 primitive,consumer 自由 compose;npm byte-identity 不約束 compose 方式**。Consumer 可寫 `<Avatar size={32}>` 即使 DS canonical demo 用 `<Avatar size={24}>` — bytes 同但 visual drift。

## 對齊世界級

- **Polaris**(Shopify):Chromatic visual regression on every PR(component-level + page-level)— Polaris 自家 templates 跟 partner consumer apps 都被 diff
- **Material UI X** PR snapshot gate:`mui-x` package consumer apps 用 `@mui/x-data-grid` 必過 visual snapshot
- **Carbon Design System**(IBM):Percy visual diff cross DS storybook + consumer-app sample
- **Atlassian Design System**:VR(visual regression)CI on consumer repos pulling DS

## 機制三層

| 層 | 落地 | SSOT |
|---|---|---|
| 1 source-level marker | Consumer story tsx 開頭 `// @story-baseline: <DS-path>#<exportName>` | story-rules.md「Production-grade composition fidelity」段 + check_story_invariants.sh R7 |
| 2 anti-pattern hook | DS-internal grep regex 攔 simplified mock pattern | `.claude/references/story-baseline-registry.json` + check_story_invariants.sh R8 |
| 3 **visual diff CI** | DS canonical screenshot vs consumer story screenshot,pixel diff threshold | `scripts/composition-fidelity-visual-diff.mjs` + `npm run composition-fidelity` |

層 1+2 已 ship(2026-05-20)。**層 3 = 本檔 SSOT(2026-05-27 ship)**。

## 層 3 用法

```bash
# Local — against running storybooks:
npm run composition-fidelity -- \
  --ds-url=http://localhost:9001 \
  --consumer-url=http://localhost:9002 \
  --consumer-app-files=/path/to/ds-product-template/apps/template/src/App.tsx \
  --out=.claude/snapshots/composition-fidelity \
  --threshold-pct=2

# CI — against built storybook-static dirs:
npm run composition-fidelity -- \
  --ds-static=storybook-static \
  --consumer-static=/path/to/ds-product-template/storybook-static \
  --consumer-app-files=/path/to/ds-product-template/apps/template/src/App.tsx \
  --threshold-pct=0.5
```

**Mapping SSOT**:`@story-baseline:` marker in consumer source file(s)。Script parses marker → derives DS canonical story id → cross-side screenshot + pixelmatch diff。Fail PR 若任一 mapping diff > threshold-pct。

**Exit codes**:0 = all within threshold / 1 = at least one exceeds / 2 = setup error。

## Threshold guidance

- `0.5%` — strict baseline change(intentional fix必 update baseline)
- `2%` — typical(allows brand text difference like "Acme Inc" vs "Acme Product")
- `5%` — initial bootstrap(consumer 多元化內容差異)

**Initial ds-product-template baseline 1.41%**(measured 2026-05-27):brand text + NAV labels content-level diff。Structural composition byte-equal。

## CI workflow(待 next-phase ship)

對應 codex feature `exec_permission_approvals` graduate 後可 land 在 ds-product-template repo:

```yaml
# .github/workflows/composition-fidelity.yml(ds-product-template)
on: [push, pull_request]
jobs:
  composition-fidelity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build-storybook
      # Fetch DS storybook from Pages (or download artifact)
      - run: curl -L https://ajenchen.github.io/design-system/storybook-static.tar.gz | tar xz -C ds-baseline
      - run: npm install @qijenchen/design-system --include=dev
      - run: |
          node node_modules/@qijenchen/design-system/scripts/composition-fidelity-visual-diff.mjs \
            --ds-static=ds-baseline/storybook-static \
            --consumer-static=storybook-static \
            --consumer-app-files=apps/template/src/App.tsx \
            --threshold-pct=2
```

## 不該做的事

- ❌ 把 baseline screenshots commit 進 ds-product-template repo(stale 風險)— 改 fetch from DS Pages live
- ❌ Threshold 設 0%(content-level diff 必然有，brand text / NAV labels)
- ❌ 跑 raw DOM diff(M32 educated:pixel-quantified verify ≠ attribute existence)
- ❌ 抽樣 5 stories(M-rule 不抽樣 / 不少於 user 明示「所有元件」scope)

## 反 pattern 錨例

**2026-05-27**:user 抓 AppShell Avatar+Label drift。Triple-verify 發現:
1. Source byte-equivalent(DS sidebar.stories.tsx WorkspaceBrand 跟 ds-product-template App.tsx 同 pattern)
2. Stale build artifact:DS storybook-static built BEFORE commit 4e3256c1 fix → DS render 用 ItemAvatar wrapper / consumer 用 raw Avatar
3. User screenshot 從 stale deploy 看到「DS-rendered」vs「consumer-rendered」structural diff

**Lesson**:byte-identity ≠ visual identity ≠ deployed identity。三層皆需 mechanical verify。Composition-fidelity 機制覆蓋第 3 層。
