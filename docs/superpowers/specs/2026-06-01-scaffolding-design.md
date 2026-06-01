# react-nav-router 工程化脚手架设计

- **日期**：2026-06-01
- **状态**：草案，待实施
- **范围**：为现有源码补齐脚手架、单元测试、E2E、API 文档、示例站点与 CI

## 1. 背景与目标

仓库当前只有 `src/` 下七个源文件与一个仅含 `name` 字段的 `package.json`，缺少构建、测试、文档、示例与 CI 全套工程化支持，且存在 `src/NavStack copy.tsx`、`src/NavView copy.tsx`、`src/NavViewContext copy.ts` 三个无人维护的副本文件。

目标：把 `react-nav-router` 升级为可发布、可演示、可持续演进的 npm 库，具体交付物：

1. 可发布的 npm 包：ESM + CJS + 类型声明
2. 完整的单元测试（覆盖率门槛：`router.ts` ≥ 95%，其余 ≥ 80%）
3. Playwright E2E，验证真实浏览器的过渡、history 行为
4. VitePress 文档站，集成 React Demo（文档与示例同站）
5. api-extractor + api-documenter 自动 API 文档
6. GitHub Actions CI + GitHub Pages 自动发布文档
7. ESLint + Prettier + Husky + lint-staged 基线
8. 清理三个 `*copy*` 残留文件

非目标（本期不做）：

- 不接入 changesets 自动发包，仅手动 `npm publish`
- 不做 storybook，不做 sandpack 在线编辑
- 不写国际化文档

## 2. 工具链固化

| 范畴     | 选型                                                                          | 备注                                               |
| -------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| 包管理   | pnpm                                                                          | workspace 含根包与 docs 子站（如需）               |
| 语言     | TypeScript 5.x                                                                | `strict`, `target=ES2020`, `jsx=react-jsx`         |
| 构建     | tsup (esbuild)                                                                | 产 ESM + CJS + d.ts，external `react`, `react-dom` |
| 单测     | vitest + @testing-library/react + jsdom                                       | 覆盖率 v8                                          |
| E2E      | @playwright/test                                                              | 默认 chromium，CI 单浏览器                         |
| Lint     | eslint + @typescript-eslint + eslint-plugin-react-hooks + eslint-plugin-tsdoc | flat config                                        |
| Format   | prettier 3                                                                    | 与现有代码风格对齐（单引号、2 空格）               |
| Hook     | husky + lint-staged                                                           | pre-commit：lint --fix + prettier --write          |
| API 抽取 | @microsoft/api-extractor                                                      | 入口 `dist/index.d.ts`                             |
| API 文档 | @microsoft/api-documenter                                                     | markdown 模式 → `docs/api/`                        |
| 文档站   | vitepress + @vitejs/plugin-react                                              | 单站点同时承载 guide / demo / api                  |
| CI       | GitHub Actions (Node 20)                                                      | PR 跑全套，main 推 Pages                           |

包产物形态：`dist/index.{mjs,cjs,d.ts,d.mts}`，`package.json` 用 `exports` 字段做条件导出，`sideEffects: false`。

## 3. 目录结构

```
react-nav-router/
├── .github/workflows/
│   ├── ci.yml
│   └── docs.yml
├── .husky/pre-commit
├── .changeset/config.json        # 仅占位
├── src/
│   ├── index.ts
│   ├── router.ts
│   ├── NavRouter.tsx
│   ├── NavRouterContext.ts
│   ├── NavStack.tsx
│   ├── NavView.tsx
│   ├── NavViewContext.ts
│   └── __tests__/
│       ├── createRoute.test.ts
│       ├── router.test.ts
│       ├── router.history.test.ts
│       ├── NavStack.test.tsx
│       ├── NavStack.transition.test.tsx
│       ├── NavView.test.tsx
│       ├── NavRouter.test.tsx
│       └── useNavRoute.test.tsx
├── tests/utils/
│   ├── raf.ts                    # 可控 rAF 队列辅助
│   └── history.ts                # popstate / hashchange 触发辅助
├── docs/                         # VitePress 单站点
│   ├── .vitepress/
│   │   ├── config.ts             # vite plugins: [react()], srcExclude
│   │   └── theme/
│   │       ├── index.ts          # 注册 <ReactDemo>
│   │       └── ReactDemo.vue     # Vue 壳，挂载 React root
│   ├── demos/
│   │   ├── basic/index.tsx
│   │   ├── advanced/index.tsx
│   │   ├── lifecycle/index.tsx
│   │   └── _shared/Button.tsx
│   ├── guide/
│   │   ├── getting-started.md
│   │   ├── concepts.md
│   │   ├── recipes.md
│   │   ├── history.md
│   │   └── testing.md
│   ├── api/                      # api-documenter 产物，gitignore
│   ├── index.md
│   └── superpowers/specs/        # 本设计文档所在；vitepress srcExclude 排除
├── e2e/
│   ├── basic.spec.ts
│   ├── transition.spec.ts
│   ├── history.spec.ts
│   ├── lifecycle.spec.ts
│   ├── advanced.spec.ts
│   └── fixtures.ts
├── etc/
│   └── react-nav-router.api.md   # api-extractor review file，进 git
├── temp/                         # api-extractor 临时产物，gitignore
├── dist/                         # gitignore
├── .gitignore
├── .editorconfig
├── .eslintrc.cjs
├── .prettierrc
├── tsconfig.json
├── tsconfig.test.json
├── tsup.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── api-extractor.json
├── pnpm-workspace.yaml
├── package.json
├── LICENSE
├── README.md
└── CHANGELOG.md
```

VitePress 配置中通过 `srcExclude: ['superpowers/**']` 把本设计文档及今后的 spec 全部排除在站点构建之外；`docs/api/` 由 api-documenter 生成后参与构建（默认即包含，无需 exclude）。

## 4. 关键设计

### 4.1 包元信息

`package.json` 重点字段：

```jsonc
{
  "name": "react-nav-router",
  "version": "0.0.0",
  "description": "Lightweight iOS-style stack router for React 18.",
  "license": "MIT",
  "author": "TODO",
  "repository": "TODO",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
    },
    "./package.json": "./package.json",
  },
  "sideEffects": false,
  "files": ["dist", "README.md", "LICENSE"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
  },
}
```

author / repository 留 `TODO` 占位，发布前手动填。

### 4.2 测试策略

**单测分层**

| 文件                           | 关注点                                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `createRoute.test.ts`          | URL ↔ Route round-trip：标准 query、JSON-encoded、空 params、path 自带 `?` 覆写、`toString`                                                  |
| `router.test.ts`               | rootRoute 初始化 / navigateTo / navigateBack 正负数 / customNavigation / listen 订阅幂等 / fire 时 listener 增删的快照安全                   |
| `router.history.test.ts`       | hash 模式：pushState 写入 / popstate 恢复 / hashchange 手动改 hash → replaceState + historyPop / 空 hash 忽略 / 与栈顶相同的 hash 忽略       |
| `NavStack.test.tsx`            | push/pop/replace action 推断 / 旧栈顶在新栈中存在与否的两条路径 / WeakMap key 复用（同 path 再入应保留组件 state）/ renderCommon 包裹        |
| `NavStack.transition.test.tsx` | 双 rAF 时序 + setTimeout 推进 `transitioning` 状态轨迹 / 动画未结束又变 stack 时丢弃中间态                                                   |
| `NavView.test.tsx`             | 四钩子全路径触发 / 首帧直接 Normal 时补发 willAppear / 卸载时若未到 hidden 补发 didDisappear / 回调用最新 ref 不因 prop 变更重跑 effect      |
| `NavRouter.test.tsx`           | useSyncExternalStore 订阅触发 rerender / navActions ref 稳定 / NavRouteContext 注入正确 route / renderCommon 拿到 top.path / 栈空时 top=null |
| `useNavRoute.test.tsx`         | 包裹外默认值 no-op / 包裹内拿到当前 route 并能触发 navigateTo                                                                                |

**测试辅助**

- `tests/utils/raf.ts`：通过 `vi.stubGlobal('requestAnimationFrame', ...)` 维护一个可手动 flush 的 rAF 队列，配合 `vi.useFakeTimers({ toFake: ['setTimeout'] })`，精确控制双 rAF + 过渡 timer 三段时序
- `tests/utils/history.ts`：封装 `dispatchEvent(new PopStateEvent('popstate', { state }))` 与 `HashChangeEvent`，直接操纵 history 而不依赖真实浏览器

**覆盖率门槛**

- `router.ts` lines/branches ≥ 95%
- 其余源文件 ≥ 80%
- 通过 `vitest --coverage` 在 CI 中强制

**E2E 用例**

被测站点：`pnpm docs:preview --port 4173`（vitepress 静态产物）。Playwright `webServer` 配置自动启停。

| 文件                 | 场景                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `basic.spec.ts`      | 打开 `/demos/basic`，点击 push → URL hash 变化 → 新页可见 → 点击 back → URL 回退 → 旧页可见                                          |
| `transition.spec.ts` | push 触发动画：`page.waitForFunction` 抓 `transform` 中间帧并断言；动画结束后 transform 复位                                         |
| `history.spec.ts`    | `page.goBack()` → 栈正确回退；`page.evaluate(() => location.hash='#/x')` → 整栈替换；`page.reload()` → 从 hash 恢复                  |
| `lifecycle.spec.ts`  | `/demos/lifecycle` 把四个钩子调用次数渲染成 DOM 文本，断言序列：`willAppear=1 didAppear=1` → push → `willDisappear=1 didDisappear=1` |
| `advanced.spec.ts`   | customNavigation：同 path 去重；renderCommon 顶栏始终存在                                                                            |

CI 仅跑 chromium；失败自动留 trace + screenshot。

### 4.3 API 文档流水线

```
src/*.ts(x)
   └─ tsup ──► dist/index.d.ts
                  └─ api-extractor ──► etc/react-nav-router.api.md   (git tracked, PR diff = API change)
                                  └─► temp/react-nav-router.api.json
                                          └─ api-documenter md ──► docs/api/*.md   (gitignored)
                                                                       └─ vitepress build ──► .vitepress/dist/
```

- `etc/*.api.md` 进 git，PR 评审看 API 变更
- `docs/api/*.md` 不进 git，每次构建实时生成
- `pnpm api:check`（CI 用，未提交的 API 变更则失败）
- `pnpm api:update`（本地用，更新 .api.md 快照）

### 4.4 文档与示例集成（VitePress + React）

核心目标：文档与 demo 同站、同 build、demo 源码与文档代码块同源。

- `.vitepress/config.ts` 配 `vite.plugins: [react()]`，`vite.optimizeDeps.exclude: ['react-nav-router']`（用 workspace 源码而非 dist）
- `ReactDemo.vue`：Vue 单文件组件壳，`onMounted` 内用 `react-dom/client` 的 `createRoot` 挂载 React 组件；`onBeforeUnmount` 卸载
- 通过 `import.meta.glob('/demos/*/index.tsx', { eager: false })` 按 `src` prop 动态加载对应 demo
- markdown 使用：

  ```md
  ## Basic

  <ReactDemo src="basic" />

  <<< @/demos/basic/index.tsx
  ```

  示例代码与运行实例永远同源，不会漂移。

### 4.5 CI/CD

`ci.yml`（PR + main 触发）：

```
lint        → pnpm lint
typecheck   → pnpm typecheck
test        → pnpm test:coverage → 上传 coverage artifact
build       → pnpm build
api-check   → pnpm build && pnpm api:check
e2e         → needs: build → 安装 chromium → pnpm docs:build → pnpm e2e → 上传 trace
docs-build  → pnpm docs:build (只验证可构建)
```

`docs.yml`（仅 main 推送触发）：

```
pnpm install
pnpm build
pnpm api:extract && pnpm api:doc
pnpm docs:build
actions/upload-pages-artifact → actions/deploy-pages
```

GH Pages 启用 Actions 部署源；首次需 repo Settings → Pages 切到 "GitHub Actions"。

### 4.6 npm scripts 总览

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . && prettier --check .",
    "lint:fix": "eslint . --fix && prettier --write .",
    "api:extract": "api-extractor run --local",
    "api:check": "api-extractor run",
    "api:doc": "api-documenter markdown -i temp -o docs/api",
    "docs:dev": "vitepress dev docs",
    "docs:build": "pnpm api:extract && pnpm api:doc && vitepress build docs",
    "docs:preview": "vitepress preview docs --port 4173",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "prepare": "husky",
    "prepublishOnly": "pnpm build && pnpm api:check"
  }
}
```

## 5. 落地步骤（11 个增量提交）

1. **清理**：删 `src/*copy*` 与 `.DS_Store`；加 `.gitignore`；`git init`（若仓库尚未初始化）
2. **基线工程化**：`tsconfig.json` / `package.json` / `pnpm-workspace.yaml` / `tsup.config.ts` / `LICENSE` / `.editorconfig` / README 占位
3. **Lint/Format**：`.eslintrc.cjs` / `.prettierrc` / `.husky/pre-commit` / lint-staged 配置
4. **首次 build 校验**：`pnpm build`，确认 `dist/` 产物 + d.ts 完整
5. **API 流水线**：`api-extractor.json`，跑 `pnpm api:extract`，提交 `etc/*.api.md` 基线快照
6. **单测落地**：按 §4.2 清单逐文件 TDD 推进；router 纯函数先行，组件用 RTL，最后过渡动画
7. **VitePress 文档站**：`docs/.vitepress/{config,theme}` + ReactDemo 壳 + guide 五篇 + `pnpm api:doc` 验证 api 页可生成
8. **Demo 内容**：三个 demo + `_shared/`，guide 页用 `<ReactDemo>` 嵌入
9. **E2E**：`playwright.config.ts` + 5 个 spec + `fixtures.ts`
10. **CI**：`ci.yml` + `docs.yml`，PR 自检绿
11. **CHANGELOG 占位 + .changeset/config**，仓库收尾

每步独立可验证（lint 通 / build 出产物 / 测试绿 / docs 起得来 / e2e 过 / CI 绿）。

## 6. 风险与对策

| 风险                                                                                | 对策                                                                                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| jsdom 的 `requestAnimationFrame` 行为不稳，影响过渡测试                             | `tests/utils/raf.ts` 自管 rAF 队列；过渡时序细节由 E2E 在真实浏览器兜底                                                               |
| VitePress（Vue）集成 React 需要 Vue 壳，配置复杂度                                  | `ReactDemo.vue` 一次写好封装；社区有成熟示例参考；若实施时阻塞超过半天，降级为 iframe 方案（A），不阻塞整体进度                       |
| api-extractor 对 React 函数式组件 `React.memo` 包裹返回值的类型抽取可能产生 warning | 已在源码 `NavStack` 用 `as` 断言保留泛型；若 api-extractor 仍报警，添加 `// @public` 等显式标注并在 `api-extractor.json` 关闭对应规则 |
| `useSyncExternalStore` 在 jsdom 下的 shim 缺失                                      | React 18 内置 shim 自带；如出现问题加 `use-sync-external-store/shim`                                                                  |
| GH Pages 首次部署需要手动开启 Pages 来源                                            | README 中标注步骤，提交后 issue/PR 中提醒                                                                                             |

## 7. 未决项

- `package.json` 的 `author` / `repository` 字段实际值（占位 `TODO`）
- 是否需要 demo 暗色主题（VitePress 本身支持暗色，demo 可后置适配）

## 8. 后续

实施由 writing-plans 出具体执行计划，按 §5 步骤拆分为可独立提交、可独立验证的任务序列。
