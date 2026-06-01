# react-nav-router 脚手架实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `react-nav-router` 从仅有源码的裸仓库，升级为带构建、单测、E2E、API 文档、示例站与 CI 的可发布 npm 库。

**Architecture:** pnpm workspace 单仓 + 库源码不动。围绕源码补：tsup 构建 / vitest 单测 / @testing-library jsdom / api-extractor + api-documenter / VitePress（同站承载 guide + demo + api）+ React demo 通过 Vue 壳挂载 / Playwright E2E 跑文档站 preview / GitHub Actions CI + Pages 部署文档。

**Tech Stack:** pnpm, TypeScript 5, tsup (esbuild), vitest, @testing-library/react, jsdom, @microsoft/api-extractor, @microsoft/api-documenter, vitepress, @vitejs/plugin-react, @playwright/test, eslint, prettier, husky, lint-staged, GitHub Actions.

**前置：** 仓库根目录 `/Users/mingenesis/Projects/repos/react-nav-router`。已 `git init` 并提交了 spec。

---

## Task 1: 清理残留 + .gitignore + .editorconfig

**Files:**

- Delete: `src/NavStack copy.tsx`, `src/NavView copy.tsx`, `src/NavViewContext copy.ts`, `.DS_Store`
- Create: `.gitignore`, `.editorconfig`

- [ ] **Step 1: 删残留**

```bash
cd /Users/mingenesis/Projects/repos/react-nav-router
rm -f .DS_Store "src/NavStack copy.tsx" "src/NavView copy.tsx" "src/NavViewContext copy.ts"
ls src/
```

预期 `ls src/` 只剩 7 个非副本文件：`NavRouter.tsx NavRouterContext.ts NavStack.tsx NavView.tsx NavViewContext.ts index.ts router.ts`。

- [ ] **Step 2: 写 `.gitignore`**

完整内容：

```gitignore
# deps
node_modules/

# build
dist/
temp/

# vitepress
docs/.vitepress/cache/
docs/.vitepress/dist/
docs/api/

# tests
coverage/
.nyc_output/
e2e-results/
playwright-report/
test-results/

# logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*

# editor / os
.DS_Store
.vscode/
.idea/
*.swp

# env
.env
.env.local
```

- [ ] **Step 3: 写 `.editorconfig`**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "chore: cleanup copy files, add .gitignore and .editorconfig"
```

---

## Task 2: tsconfig + package.json + tsup + LICENSE + pnpm workspace + README 骨架

**Files:**

- Create: `tsconfig.json`, `tsconfig.test.json`, `package.json`(覆盖), `tsup.config.ts`, `pnpm-workspace.yaml`, `LICENSE`, `README.md`

- [ ] **Step 1: 写 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src"],
  "exclude": [
    "node_modules",
    "dist",
    "**/__tests__/**",
    "**/*.test.ts",
    "**/*.test.tsx"
  ]
}
```

- [ ] **Step 2: 写 `tsconfig.test.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals", "node"]
  },
  "include": ["src", "tests", "vitest.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: 写 `pnpm-workspace.yaml`**

```yaml
packages:
  - "."
```

（仅根包；docs 站作为根包内子目录，不单独建子包，简化）

- [ ] **Step 4: 写 `tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  external: ["react", "react-dom"],
  treeshake: true,
  outExtension({ format }) {
    return { js: format === "esm" ? ".mjs" : ".cjs" };
  },
});
```

- [ ] **Step 5: 覆盖写 `package.json`**

```json
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
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tsup": "^8.3.0",
    "typescript": "^5.5.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- [ ] **Step 6: 写 `LICENSE`（MIT，author 留 TODO）**

```text
MIT License

Copyright (c) 2026 TODO

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 7: 写 `README.md` 骨架（后续 Task 21 补全）**

````markdown
# react-nav-router

Lightweight iOS-style stack router for React 18.

> Documentation: <https://TODO.github.io/react-nav-router>

## Install

```bash
pnpm add react-nav-router
```
````

## Quick start

```tsx
import { createRouter, NavRouter } from "react-nav-router";

const router = createRouter({ rootRoute: "/", history: "hash" });

export default function App() {
  return <NavRouter router={router} render={(path) => <Page path={path} />} />;
}
```

See [docs site](https://TODO.github.io/react-nav-router) for guides, API and live demos.

## License

MIT

````

- [ ] **Step 8: 安装依赖 + 类型检查**

```bash
pnpm install
pnpm typecheck
````

预期：`pnpm install` 成功；`pnpm typecheck` 输出无错误退出。

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "chore: bootstrap tsconfig, package.json, tsup, LICENSE, README skeleton"
```

---

## Task 3: ESLint + Prettier + Husky + lint-staged

**Files:**

- Create: `.eslintrc.cjs`, `.eslintignore`, `.prettierrc`, `.prettierignore`, `.husky/pre-commit`
- Modify: `package.json`（追加 devDeps + scripts + lint-staged 配置）

- [ ] **Step 1: 追加 devDeps + scripts + lint-staged 到 `package.json`**

把 `package.json` 的 `devDependencies` 块替换为下面（追加 lint 相关）：

```json
"devDependencies": {
  "@types/node": "^20.12.0",
  "@types/react": "^18.3.0",
  "@types/react-dom": "^18.3.0",
  "@typescript-eslint/eslint-plugin": "^7.18.0",
  "@typescript-eslint/parser": "^7.18.0",
  "eslint": "^8.57.0",
  "eslint-config-prettier": "^9.1.0",
  "eslint-plugin-react": "^7.35.0",
  "eslint-plugin-react-hooks": "^4.6.2",
  "eslint-plugin-tsdoc": "^0.3.0",
  "husky": "^9.1.0",
  "lint-staged": "^15.2.0",
  "prettier": "^3.3.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "tsup": "^8.3.0",
  "typescript": "^5.5.0"
}
```

把 `scripts` 块替换为：

```json
"scripts": {
  "build": "tsup",
  "dev": "tsup --watch",
  "typecheck": "tsc --noEmit",
  "lint": "eslint . && prettier --check .",
  "lint:fix": "eslint . --fix && prettier --write .",
  "prepare": "husky"
}
```

在根对象末尾追加 lint-staged 配置：

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,cjs,mjs,json,md,yml,yaml}": ["prettier --write"]
}
```

- [ ] **Step 2: 写 `.eslintrc.cjs`**

```js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: [
    "@typescript-eslint",
    "react",
    "react-hooks",
    "eslint-plugin-tsdoc",
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  settings: { react: { version: "18" } },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "tsdoc/syntax": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
  overrides: [
    {
      files: [
        "**/__tests__/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "e2e/**",
        "tests/**",
      ],
      rules: { "@typescript-eslint/no-explicit-any": "off" },
    },
  ],
  ignorePatterns: [
    "dist/",
    "temp/",
    "coverage/",
    "docs/.vitepress/cache/",
    "docs/.vitepress/dist/",
    "docs/api/",
    "node_modules/",
    "playwright-report/",
    "test-results/",
  ],
};
```

- [ ] **Step 3: 写 `.eslintignore`**（与 ignorePatterns 同步备份）

```text
dist
temp
coverage
docs/.vitepress/cache
docs/.vitepress/dist
docs/api
node_modules
playwright-report
test-results
```

- [ ] **Step 4: 写 `.prettierrc`**

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 80,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 5: 写 `.prettierignore`**

```text
dist
temp
coverage
docs/.vitepress/cache
docs/.vitepress/dist
docs/api
node_modules
pnpm-lock.yaml
playwright-report
test-results
etc/*.api.md
```

- [ ] **Step 6: 安装依赖 + 初始化 husky**

```bash
pnpm install
pnpm exec husky init
```

预期 husky 创建 `.husky/pre-commit`，内容默认是 `npm test`，下一步覆盖。

- [ ] **Step 7: 覆盖 `.husky/pre-commit`**

```bash
pnpm exec lint-staged
```

加可执行位：

```bash
chmod +x .husky/pre-commit
```

- [ ] **Step 8: 首次 lint 跑通**

```bash
pnpm lint
```

预期：eslint 检查现有 `src/`，可能出现少量 warning（如未用变量），但不应有 error。若有 error，按提示在源码上做最小修复（不改变行为，例如未用 import）后再次执行直到通过。

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "chore: setup eslint, prettier, husky, lint-staged"
```

---

## Task 4: 首次构建验证

**Files:** 无新文件，仅运行命令。

- [ ] **Step 1: 跑 build**

```bash
pnpm build
```

预期：tsup 输出 `dist/index.mjs`、`dist/index.cjs`、`dist/index.d.ts`、`dist/index.d.cts`（或类似），以及 `.map` 文件。

- [ ] **Step 2: 检查产物**

```bash
ls -1 dist/
```

预期至少看到：

```
index.cjs
index.cjs.map
index.d.cts
index.d.ts
index.mjs
index.mjs.map
```

- [ ] **Step 3: 验证类型入口能被外部解析**

```bash
node -e "import('./dist/index.mjs').then(m => console.log(Object.keys(m).sort().join(',')))"
```

预期输出包含：`AppearStatus,NavRouteContext,NavRouter,NavStack,NavView,NavViewContext,createLocation,createRoute,createRouter,useNavRoute`。

- [ ] **Step 4: 提交（lockfile）**

```bash
git add pnpm-lock.yaml
git commit -m "chore: lock dependencies after first successful build" || echo "nothing to commit"
```

---

## Task 5: API Extractor 流水线 + 基线快照

**Files:**

- Create: `api-extractor.json`
- Modify: `package.json`（加 api 相关 devDeps + scripts）
- Create: `etc/react-nav-router.api.md`（首次跑 api:extract 生成）

- [ ] **Step 1: 追加 devDeps 与 scripts**

`devDependencies` 内追加：

```json
"@microsoft/api-extractor": "^7.47.0",
"@microsoft/api-documenter": "^7.25.0"
```

`scripts` 内追加：

```json
"api:extract": "api-extractor run --local",
"api:check": "api-extractor run",
"api:doc": "api-documenter markdown -i temp -o docs/api"
```

- [ ] **Step 2: 写 `api-extractor.json`**

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
  "mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts",
  "bundledPackages": [],
  "apiReport": {
    "enabled": true,
    "reportFolder": "<projectFolder>/etc/",
    "reportTempFolder": "<projectFolder>/temp/"
  },
  "docModel": {
    "enabled": true,
    "apiJsonFilePath": "<projectFolder>/temp/<unscopedPackageName>.api.json"
  },
  "dtsRollup": {
    "enabled": false
  },
  "tsdocMetadata": {
    "enabled": false
  },
  "messages": {
    "compilerMessageReporting": { "default": { "logLevel": "warning" } },
    "extractorMessageReporting": {
      "default": { "logLevel": "warning" },
      "ae-missing-release-tag": { "logLevel": "none" }
    },
    "tsdocMessageReporting": { "default": { "logLevel": "warning" } }
  }
}
```

- [ ] **Step 3: 安装 + 首次抽取**

```bash
pnpm install
pnpm build
mkdir -p etc temp
pnpm api:extract
```

预期：生成 `etc/react-nav-router.api.md` 与 `temp/react-nav-router.api.json`。

- [ ] **Step 4: 跑 api:doc 验证 markdown 渲染**

```bash
mkdir -p docs/api
pnpm api:doc
ls docs/api/ | head
```

预期 `docs/api/` 下出现 `index.md` 与若干 `react-nav-router.*.md`。这些文件不进 git（.gitignore 已排除）。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat(api): setup api-extractor pipeline with baseline snapshot"
```

---

## Task 6: Vitest 配置 + 测试辅助工具

**Files:**

- Create: `vitest.config.ts`, `tests/utils/raf.ts`, `tests/utils/history.ts`, `tests/setup.ts`
- Modify: `package.json`（加 test 相关 devDeps + scripts）

- [ ] **Step 1: 追加 devDeps 与 scripts**

`devDependencies` 追加：

```json
"@testing-library/jest-dom": "^6.5.0",
"@testing-library/react": "^16.0.0",
"@vitest/coverage-v8": "^2.1.0",
"jsdom": "^25.0.0",
"vitest": "^2.1.0"
```

`scripts` 追加：

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 2: 写 `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/__tests__/**",
        "src/**/*.test.{ts,tsx}",
        "src/index.ts",
      ],
      thresholds: {
        "src/router.ts": {
          lines: 95,
          branches: 95,
          functions: 95,
          statements: 95,
        },
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

- [ ] **Step 3: 写 `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: 写 `tests/utils/raf.ts`**

```ts
import { vi } from "vitest";

type RafCallback = (time: number) => void;

let queue: { id: number; cb: RafCallback }[] = [];
let nextId = 1;

/** 安装可控 rAF：所有 requestAnimationFrame 入队，调用 flushRaf 才执行 */
export function installRaf() {
  queue = [];
  nextId = 1;
  vi.stubGlobal("requestAnimationFrame", (cb: RafCallback) => {
    const id = nextId++;
    queue.push({ id, cb });
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    queue = queue.filter((item) => item.id !== id);
  });
}

/** 还原原生 rAF */
export function uninstallRaf() {
  vi.unstubAllGlobals();
  queue = [];
}

/** 执行队列里所有当前帧 callback（递归追加的将在下一次调用时执行） */
export function flushRaf() {
  const current = queue;
  queue = [];
  for (const { cb } of current) {
    cb(performance.now());
  }
}

/** 当前等待的 rAF 数 */
export function pendingRaf(): number {
  return queue.length;
}
```

- [ ] **Step 5: 写 `tests/utils/history.ts`**

```ts
/** 触发 popstate，模拟浏览器后退/前进 */
export function firePopState(state: unknown) {
  window.dispatchEvent(new PopStateEvent("popstate", { state }));
}

/** 触发 hashchange，模拟用户手动改 hash */
export function fireHashChange(newHash: string) {
  const oldURL = window.location.href;
  window.location.hash = newHash;
  window.dispatchEvent(
    new HashChangeEvent("hashchange", {
      oldURL,
      newURL: window.location.href,
    }),
  );
}

/** 复位 history 与 location.hash 到初始状态，供 afterEach 调用 */
export function resetHistory() {
  window.history.replaceState(null, "", "/");
}
```

- [ ] **Step 6: 安装 + 自检**

```bash
pnpm install
pnpm vitest run --reporter=verbose --passWithNoTests
```

预期：vitest 启动成功，0 test 通过。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "test: setup vitest with jsdom and rAF/history utils"
```

---

## Task 7: 单测 - createRoute / createLocation

**Files:**

- Create: `src/__tests__/createRoute.test.ts`

- [ ] **Step 1: 写测试文件**

```ts
import { describe, it, expect } from "vitest";
import { createRoute, createLocation } from "../router";

describe("createRoute", () => {
  it("字符串输入：仅 path", () => {
    const r = createRoute("/home");
    expect(r.path).toBe("/home");
    expect(r.params).toBeUndefined();
  });

  it("字符串输入：path 自带标准 query", () => {
    const r = createRoute("/page?a=1&b=2");
    expect(r.path).toBe("/page");
    expect(r.params).toEqual({ a: "1", b: "2" });
  });

  it("字符串输入：path 自带 JSON-encoded query", () => {
    const q = encodeURIComponent(JSON.stringify({ n: 1, b: true, s: "x" }));
    const r = createRoute("/p?" + q);
    expect(r.path).toBe("/p");
    expect(r.params).toEqual({ n: 1, b: true, s: "x" });
  });

  it("对象输入：path 中的 query 覆盖对象的 params", () => {
    const r = createRoute({ path: "/p?a=1", params: { ignore: "me" } });
    expect(r.path).toBe("/p");
    expect(r.params).toEqual({ a: "1" });
  });

  it("对象输入：无 query 时保留传入 params", () => {
    const r = createRoute({ path: "/p", params: { x: "y" } });
    expect(r.params).toEqual({ x: "y" });
  });

  it("不修改入参", () => {
    const src = { path: "/p?a=1", params: { x: "y" } };
    createRoute(src);
    expect(src).toEqual({ path: "/p?a=1", params: { x: "y" } });
  });

  it("toString 等价于 createLocation", () => {
    const r = createRoute({ path: "/p", params: { a: "b" } });
    expect(String(r)).toBe(createLocation(r));
  });

  it("空 query 字符串视为无 params", () => {
    const r = createRoute("/p?");
    expect(r.params).toBeUndefined();
  });
});

describe("createLocation", () => {
  it("无 params：仅返回 path", () => {
    expect(createLocation({ path: "/x" })).toBe("/x");
  });

  it("空 params 对象：不输出 ?", () => {
    expect(createLocation({ path: "/x", params: {} })).toBe("/x");
  });

  it("全 string params：输出标准 query string", () => {
    expect(createLocation({ path: "/x", params: { a: "1", b: "2" } })).toBe(
      "/x?a=1&b=2",
    );
  });

  it("含非 string params：输出 JSON-encoded", () => {
    const url = createLocation({ path: "/x", params: { n: 1, b: true } });
    expect(url.startsWith("/x?")).toBe(true);
    const json = decodeURIComponent(url.substring("/x?".length));
    expect(JSON.parse(json)).toEqual({ n: 1, b: true });
  });

  it("round-trip：createRoute(createLocation(r)) 等价于原 route（params 形态）", () => {
    const src = { path: "/x", params: { a: "1" } };
    const round = createRoute(createLocation(src));
    expect(round.path).toBe(src.path);
    expect(round.params).toEqual(src.params);
  });

  it("round-trip：非 string params 通过 JSON-encoded 保类型", () => {
    const src = { path: "/x", params: { n: 42, b: false } };
    const round = createRoute(createLocation(src));
    expect(round.params).toEqual(src.params);
  });
});
```

- [ ] **Step 2: 跑测试**

```bash
pnpm test src/__tests__/createRoute.test.ts
```

预期：14 tests passed。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "test: cover createRoute and createLocation round-trip"
```

---

## Task 8: 单测 - Router 控制器（非 history）

**Files:**

- Create: `src/__tests__/router.test.ts`

- [ ] **Step 1: 写测试文件**

```ts
import { describe, it, expect, vi } from "vitest";
import { createRouter } from "../router";

describe("createRouter - 基础", () => {
  it("无 rootRoute：初始栈为空", () => {
    const r = createRouter();
    expect(r.getNavStack()).toEqual([]);
  });

  it("rootRoute 初始化：字符串形式", () => {
    const r = createRouter({ rootRoute: "/home" });
    expect(r.getNavStack()).toHaveLength(1);
    expect(r.getNavStack()[0].path).toBe("/home");
  });

  it("rootRoute 初始化：对象形式", () => {
    const r = createRouter({ rootRoute: { path: "/x", params: { a: "1" } } });
    expect(r.getNavStack()[0].params).toEqual({ a: "1" });
  });
});

describe("createRouter - navigateTo / navigateBack", () => {
  it("navigateTo 默认追加栈顶", () => {
    const r = createRouter({ rootRoute: "/" });
    r.navigateTo("/a");
    r.navigateTo("/b");
    expect(r.getNavStack().map((x) => x.path)).toEqual(["/", "/a", "/b"]);
  });

  it("navigateBack 默认回退一层（-1）", () => {
    const r = createRouter({ rootRoute: "/" });
    r.navigateTo("/a");
    r.navigateTo("/b");
    r.navigateBack();
    expect(r.getNavStack().map((x) => x.path)).toEqual(["/", "/a"]);
  });

  it("navigateBack(正整数 N) 保留前 N 个", () => {
    const r = createRouter({ rootRoute: "/" });
    r.navigateTo("/a");
    r.navigateTo("/b");
    r.navigateTo("/c");
    r.navigateBack(1);
    expect(r.getNavStack().map((x) => x.path)).toEqual(["/"]);
  });

  it("navigateBack(-N) 回退 N 层", () => {
    const r = createRouter({ rootRoute: "/" });
    r.navigateTo("/a");
    r.navigateTo("/b");
    r.navigateBack(-2);
    expect(r.getNavStack().map((x) => x.path)).toEqual(["/"]);
  });
});

describe("createRouter - listen", () => {
  it("navigateTo 触发 listener，payload 是目标 route", () => {
    const r = createRouter();
    const spy = vi.fn();
    r.listen(spy);
    r.navigateTo("/a");
    expect(spy).toHaveBeenCalledTimes(1);
    const evt = spy.mock.calls[0][0];
    expect(evt.action).toBe("navigateTo");
    expect(evt.payload.path).toBe("/a");
  });

  it("navigateBack 触发 listener，payload 是 lastIndex", () => {
    const r = createRouter({ rootRoute: "/" });
    const spy = vi.fn();
    r.listen(spy);
    r.navigateBack(-1);
    expect(spy.mock.calls[0][0]).toEqual({
      action: "navigateBack",
      payload: -1,
    });
  });

  it("返回的 unsubscribe 取消监听", () => {
    const r = createRouter();
    const spy = vi.fn();
    const off = r.listen(spy);
    off();
    r.navigateTo("/a");
    expect(spy).not.toHaveBeenCalled();
  });

  it("unsubscribe 幂等：多次调用不抛错", () => {
    const r = createRouter();
    const off = r.listen(() => {});
    off();
    expect(() => off()).not.toThrow();
  });

  it("fire 期间 listener 取消自己不影响本轮其他 listener", () => {
    const r = createRouter();
    const order: string[] = [];
    const off1 = r.listen(() => {
      order.push("a");
      off1();
    });
    r.listen(() => order.push("b"));
    r.navigateTo("/x");
    expect(order).toEqual(["a", "b"]);
  });
});

describe("createRouter - customNavigation", () => {
  it("customNavigation 决定最终栈", () => {
    const r = createRouter({
      customNavigation(evt, stack, def) {
        if (evt.action === "navigateTo") {
          // 同 path 去重
          if (stack.some((x) => x.path === evt.payload.path)) return stack;
        }
        return def(evt, stack);
      },
    });
    r.navigateTo("/a");
    r.navigateTo("/a");
    expect(r.getNavStack()).toHaveLength(1);
  });

  it("customNavigation 接收 defaultNavigation 引用", () => {
    const defSeen = vi.fn();
    const r = createRouter({
      customNavigation(evt, stack, def) {
        defSeen(typeof def);
        return def(evt, stack);
      },
    });
    r.navigateTo("/a");
    expect(defSeen).toHaveBeenCalledWith("function");
  });
});
```

- [ ] **Step 2: 跑测试**

```bash
pnpm test src/__tests__/router.test.ts
```

预期：14 tests passed。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "test: cover router navigateTo/Back/listen/customNavigation"
```

---

## Task 9: 单测 - Router history (hash) 模式

**Files:**

- Create: `src/__tests__/router.history.test.ts`

- [ ] **Step 1: 写测试文件**

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRouter } from "../router";
import {
  firePopState,
  fireHashChange,
  resetHistory,
} from "../../tests/utils/history";

describe("createRouter - history hash", () => {
  beforeEach(() => {
    resetHistory();
  });

  it("rootRoute + history: 写入 history.state 与 hash", () => {
    const r = createRouter({ rootRoute: "/home", history: "hash" });
    expect(window.location.hash).toBe("#/home");
    expect(window.history.state).toEqual({ navStack: ["/home"] });
    expect(r.getNavStack()[0].path).toBe("/home");
  });

  it("navigateTo 触发 pushState 写入新栈", () => {
    const r = createRouter({ rootRoute: "/", history: "hash" });
    r.navigateTo("/a");
    expect(window.location.hash).toBe("#/a");
    expect(window.history.state).toEqual({ navStack: ["/", "/a"] });
    expect(r.getNavStack().map((x) => x.path)).toEqual(["/", "/a"]);
  });

  it("popstate：栈被替换为 state 中保存的栈，触发 historyPop", () => {
    const r = createRouter({ rootRoute: "/", history: "hash" });
    const spy = vi.fn();
    r.listen(spy);
    firePopState({ navStack: ["/", "/x"] });
    expect(r.getNavStack().map((x) => x.path)).toEqual(["/", "/x"]);
    expect(spy).toHaveBeenCalledWith({
      action: "historyPop",
      payload: undefined,
    });
  });

  it("popstate：state 无 navStack 时忽略", () => {
    const r = createRouter({ rootRoute: "/", history: "hash" });
    const before = r.getNavStack();
    firePopState(null);
    expect(r.getNavStack()).toBe(before);
  });

  it("initFromHistory：构造时 url 已有 hash，恢复对应路由", () => {
    window.location.hash = "#/restored";
    const r = createRouter({ history: "hash" });
    expect(r.getNavStack()[0].path).toBe("/restored");
  });

  it("initFromHistory：rootRoute 与 hash 相同时不重复 push", () => {
    window.location.hash = "#/home";
    const r = createRouter({ rootRoute: "/home", history: "hash" });
    expect(r.getNavStack()).toHaveLength(1);
  });

  it("hashchange 手动改 hash：整栈替换为单路由 + historyPop", () => {
    const r = createRouter({ rootRoute: "/", history: "hash" });
    const spy = vi.fn();
    r.listen(spy);
    fireHashChange("#/manual");
    expect(r.getNavStack()).toHaveLength(1);
    expect(r.getNavStack()[0].path).toBe("/manual");
    expect(spy).toHaveBeenCalledWith({
      action: "historyPop",
      payload: undefined,
    });
  });

  it("hashchange 与栈顶相同的 hash：忽略，不 fire", () => {
    const r = createRouter({ rootRoute: "/", history: "hash" });
    r.navigateTo("/a");
    const spy = vi.fn();
    r.listen(spy);
    fireHashChange("#/a");
    expect(spy).not.toHaveBeenCalled();
  });

  it("hashchange 清空 hash：忽略", () => {
    const r = createRouter({ rootRoute: "/home", history: "hash" });
    const before = r.getNavStack();
    fireHashChange("");
    expect(r.getNavStack()).toBe(before);
  });
});
```

- [ ] **Step 2: 跑测试**

```bash
pnpm test src/__tests__/router.history.test.ts
```

预期：9 tests passed。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "test: cover router hash history (popstate/hashchange/init)"
```

---

## Task 10: 单测 - NavStack 渲染（不含动画）

**Files:**

- Create: `src/__tests__/NavStack.test.tsx`

- [ ] **Step 1: 写测试文件**

```tsx
import React, { useState } from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NavStack } from "../NavStack";
import { installRaf, uninstallRaf, flushRaf } from "../../tests/utils/raf";

beforeEach(() => installRaf());
afterEach(() => uninstallRaf());

type Item = { id: string };

function renderText(item: Item) {
  return <div>page-{item.id}</div>;
}

describe("NavStack - 渲染基础", () => {
  it("单元素栈：渲染栈顶页面", () => {
    const stack: Item[] = [{ id: "a" }];
    render(<NavStack stack={stack} render={renderText} />);
    expect(screen.getByText("page-a")).toBeInTheDocument();
  });

  it("多元素栈：所有页面渲染但只栈顶可见，其余 display:none", () => {
    const stack: Item[] = [{ id: "a" }, { id: "b" }];
    render(<NavStack stack={stack} render={renderText} />);
    expect(screen.getByText("page-a").parentElement).toHaveStyle({
      display: "none",
    });
    expect(screen.getByText("page-b").parentElement).not.toHaveStyle({
      display: "none",
    });
  });

  it("renderCommon 包裹外层结构", () => {
    const stack: Item[] = [{ id: "a" }];
    render(
      <NavStack
        stack={stack}
        render={renderText}
        renderCommon={(children) => <div data-testid="wrap">{children}</div>}
      />,
    );
    expect(screen.getByTestId("wrap")).toBeInTheDocument();
    expect(screen.getByTestId("wrap")).toContainElement(
      screen.getByText("page-a"),
    );
  });
});

describe("NavStack - 同 path 引用的 key 复用", () => {
  function Counter({ id }: { id: string }) {
    const [n, setN] = useState(0);
    return (
      <div>
        <span>
          {id}:{n}
        </span>
        <button onClick={() => setN(n + 1)} data-testid={`btn-${id}`}>
          +
        </button>
      </div>
    );
  }

  it("相同对象引用再入栈：React key 稳定，组件 state 保留", () => {
    const a: Item = { id: "a" };
    const b: Item = { id: "b" };
    const { rerender } = render(
      <NavStack stack={[a]} render={({ id }) => <Counter id={id} />} />,
    );
    // 模拟"用户点击 +" 让 state 变 1，再 push b、pop 回 a，断言 state 仍是 1
    act(() => {
      screen.getByTestId("btn-a").click();
    });
    expect(screen.getByText("a:1")).toBeInTheDocument();

    rerender(
      <NavStack stack={[a, b]} render={({ id }) => <Counter id={id} />} />,
    );
    flushRaf();
    flushRaf();
    rerender(<NavStack stack={[a]} render={({ id }) => <Counter id={id} />} />);
    flushRaf();
    flushRaf();
    expect(screen.getByText("a:1")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试**

```bash
pnpm test src/__tests__/NavStack.test.tsx
```

预期：4 tests passed。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "test: cover NavStack rendering and key stability"
```

---

## Task 11: 单测 - NavStack 过渡时序

**Files:**

- Create: `src/__tests__/NavStack.transition.test.tsx`

- [ ] **Step 1: 写测试文件**

```tsx
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NavStack } from "../NavStack";
import {
  installRaf,
  uninstallRaf,
  flushRaf,
  pendingRaf,
} from "../../tests/utils/raf";

beforeEach(() => {
  installRaf();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});
afterEach(() => {
  vi.useRealTimers();
  uninstallRaf();
});

type Item = { id: string };
const renderText = (it: Item) => <div data-testid={"p-" + it.id}>p{it.id}</div>;

function getTransform(testId: string) {
  return screen.getByTestId(testId).parentElement!.style.transform;
}

describe("NavStack - push 动画时序", () => {
  it("双 rAF 后到达结束态，timer 后回到稳态", () => {
    const a: Item = { id: "a" };
    const b: Item = { id: "b" };
    const { rerender } = render(<NavStack stack={[a]} render={renderText} />);

    // push b
    rerender(<NavStack stack={[a, b]} render={renderText} />);

    // 此时 useEffect 已经 schedule 第一个 rAF
    expect(pendingRaf()).toBe(1);

    // 第一 rAF：内部 schedule 第二个 rAF
    act(() => flushRaf());
    expect(pendingRaf()).toBe(1);

    // 第二 rAF：setTransitioning(true)
    act(() => flushRaf());

    // 此时 b 应处于 PopOutStart（结束态），transform 居中
    expect(getTransform("p-b")).toContain("translate3d(0");

    // 推进过渡 timer（transitionDuration=250 + 50 缓冲）
    act(() => vi.advanceTimersByTime(300));

    // 现在稳态：transform 应为空（Normal）
    expect(getTransform("p-b")).toBe("");
  });

  it("动画未结束又变 stack：丢弃中间态，以新 stack 为新基线", () => {
    const a: Item = { id: "a" };
    const b: Item = { id: "b" };
    const c: Item = { id: "c" };
    const { rerender } = render(<NavStack stack={[a]} render={renderText} />);
    rerender(<NavStack stack={[a, b]} render={renderText} />);
    act(() => {
      flushRaf();
      flushRaf();
    });
    // 不等 timer 完成，直接再 push c
    rerender(<NavStack stack={[a, b, c]} render={renderText} />);
    act(() => {
      flushRaf();
      flushRaf();
      vi.advanceTimersByTime(300);
    });
    // 最终栈顶 c 处于稳态
    expect(getTransform("p-c")).toBe("");
  });
});
```

- [ ] **Step 2: 跑测试**

```bash
pnpm test src/__tests__/NavStack.transition.test.tsx
```

预期：2 tests passed。若某用例因 transform 字符串格式断言过严失败，可放宽为 `.toMatch(/translate3d/)` 或读取 `appearStatus` 而非 transform。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "test: cover NavStack double-rAF transition timing"
```

---

## Task 12: 单测 - NavView 生命周期

**Files:**

- Create: `src/__tests__/NavView.test.tsx`

- [ ] **Step 1: 写测试文件**

```tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { NavView } from "../NavView";
import { AppearStatus, NavViewContext } from "../NavViewContext";

function setup(initialStatus: number) {
  const will = vi.fn();
  const did = vi.fn();
  const willD = vi.fn();
  const didD = vi.fn();

  const Wrapper = ({ status }: { status: number }) => (
    <NavViewContext.Provider value={{ appearStatus: status, path: null }}>
      <NavView
        willAppear={will}
        didAppear={did}
        willDisappear={willD}
        didDisappear={didD}
      >
        <div>content</div>
      </NavView>
    </NavViewContext.Provider>
  );

  const utils = render(<Wrapper status={initialStatus} />);
  return { ...utils, Wrapper, will, did, willD, didD };
}

describe("NavView 生命周期", () => {
  it("首帧直接 Normal：补发 willAppear + didAppear", () => {
    const { will, did } = setup(AppearStatus.Normal);
    expect(will).toHaveBeenCalledTimes(1);
    expect(did).toHaveBeenCalledTimes(1);
  });

  it("Hidden → PushInStart(entering) 触发 willAppear", () => {
    const { rerender, Wrapper, will } = setup(AppearStatus.Hidden);
    expect(will).not.toHaveBeenCalled();
    act(() => rerender(<Wrapper status={AppearStatus.PushInStart} />));
    expect(will).toHaveBeenCalledTimes(1);
  });

  it("entering → Normal 触发 didAppear（已发过 willAppear 不再补）", () => {
    const { rerender, Wrapper, will, did } = setup(AppearStatus.Hidden);
    act(() => rerender(<Wrapper status={AppearStatus.PushInStart} />));
    act(() => rerender(<Wrapper status={AppearStatus.Normal} />));
    expect(will).toHaveBeenCalledTimes(1);
    expect(did).toHaveBeenCalledTimes(1);
  });

  it("Normal → 动画值(leaving) 触发 willDisappear", () => {
    const { rerender, Wrapper, willD } = setup(AppearStatus.Normal);
    act(() => rerender(<Wrapper status={AppearStatus.PushOutEnd} />));
    expect(willD).toHaveBeenCalledTimes(1);
  });

  it("leaving → Hidden 触发 didDisappear", () => {
    const { rerender, Wrapper, didD } = setup(AppearStatus.Normal);
    act(() => rerender(<Wrapper status={AppearStatus.PushOutEnd} />));
    act(() => rerender(<Wrapper status={AppearStatus.Hidden} />));
    expect(didD).toHaveBeenCalledTimes(1);
  });

  it("卸载时若仍可见：补发 didDisappear", () => {
    const { unmount, didD } = setup(AppearStatus.Normal);
    unmount();
    expect(didD).toHaveBeenCalledTimes(1);
  });

  it("卸载时若已 hidden：不补发", () => {
    const { unmount, didD } = setup(AppearStatus.Hidden);
    unmount();
    expect(didD).not.toHaveBeenCalled();
  });

  it("回调用 ref 读最新值：prop 变更不重跑 effect", () => {
    const will1 = vi.fn();
    const will2 = vi.fn();
    const Comp = ({ cb }: { cb: () => void }) => (
      <NavViewContext.Provider
        value={{ appearStatus: AppearStatus.Hidden, path: null }}
      >
        <NavView willAppear={cb}>
          <div />
        </NavView>
      </NavViewContext.Provider>
    );
    const { rerender } = render(<Comp cb={will1} />);
    rerender(<Comp cb={will2} />);
    // 触发 willAppear：换状态
    const Comp2 = ({ cb }: { cb: () => void }) => (
      <NavViewContext.Provider
        value={{ appearStatus: AppearStatus.PushInStart, path: null }}
      >
        <NavView willAppear={cb}>
          <div />
        </NavView>
      </NavViewContext.Provider>
    );
    act(() => rerender(<Comp2 cb={will2} />));
    expect(will1).not.toHaveBeenCalled();
    expect(will2).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 跑测试**

```bash
pnpm test src/__tests__/NavView.test.tsx
```

预期：8 tests passed。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "test: cover NavView lifecycle callbacks"
```

---

## Task 13: 单测 - NavRouter 集成

**Files:**

- Create: `src/__tests__/NavRouter.test.tsx`

- [ ] **Step 1: 写测试文件**

```tsx
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NavRouter } from "../NavRouter";
import { createRouter } from "../router";
import { installRaf, uninstallRaf, flushRaf } from "../../tests/utils/raf";

beforeEach(() => installRaf());
afterEach(() => uninstallRaf());

describe("NavRouter", () => {
  it("订阅 router：navigateTo 后页面切换", () => {
    const router = createRouter({ rootRoute: "/a" });
    render(
      <NavRouter
        router={router}
        render={(path) => <div data-testid="page">{path}</div>}
      />,
    );
    expect(screen.getByTestId("page")).toHaveTextContent("/a");
    act(() => router.navigateTo("/b"));
    flushRaf();
    flushRaf();
    // 找最后一个 page 元素（栈顶）
    const pages = screen.getAllByTestId("page");
    expect(pages[pages.length - 1]).toHaveTextContent("/b");
  });

  it("renderCommon 拿到栈顶 path", () => {
    const router = createRouter({ rootRoute: "/x" });
    render(
      <NavRouter
        router={router}
        render={(p) => <div>{p}</div>}
        renderCommon={(children, path) => (
          <div>
            <div data-testid="top">{path ?? "null"}</div>
            {children}
          </div>
        )}
      />,
    );
    expect(screen.getByTestId("top")).toHaveTextContent("/x");
  });

  it("栈空时 renderCommon 收到 path=undefined（route=null）", () => {
    const router = createRouter();
    render(
      <NavRouter
        router={router}
        render={(p) => <div>{p}</div>}
        renderCommon={(children, path) => (
          <div>
            <div data-testid="top">{String(path)}</div>
            {children}
          </div>
        )}
      />,
    );
    expect(screen.getByTestId("top")).toHaveTextContent("undefined");
  });
});
```

- [ ] **Step 2: 跑测试**

```bash
pnpm test src/__tests__/NavRouter.test.tsx
```

预期：3 tests passed。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "test: cover NavRouter context wiring and renderCommon"
```

---

## Task 14: 单测 - useNavRoute + 覆盖率门槛验证

**Files:**

- Create: `src/__tests__/useNavRoute.test.tsx`

- [ ] **Step 1: 写测试文件**

```tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useNavRoute } from "../NavRouterContext";
import { NavRouter } from "../NavRouter";
import { createRouter } from "../router";

describe("useNavRoute", () => {
  it("NavRouter 外：默认值，navigateTo 为 no-op", () => {
    function Probe() {
      const { route, navigateTo } = useNavRoute();
      return (
        <div>
          <span data-testid="route">{String(route)}</span>
          <button data-testid="btn" onClick={() => navigateTo("/x")}>
            go
          </button>
        </div>
      );
    }
    render(<Probe />);
    expect(screen.getByTestId("route")).toHaveTextContent("null");
    expect(() => screen.getByTestId("btn").click()).not.toThrow();
  });

  it("NavRouter 内：返回当前 route 与可用 navigate", () => {
    const router = createRouter({ rootRoute: "/a" });
    const spy = vi.spyOn(router, "navigateTo");
    function Probe() {
      const { route, navigateTo } = useNavRoute();
      return (
        <div>
          <span data-testid="r">{route?.path}</span>
          <button data-testid="btn" onClick={() => navigateTo("/b")}>
            go
          </button>
        </div>
      );
    }
    render(<NavRouter router={router} render={() => <Probe />} />);
    expect(screen.getByTestId("r")).toHaveTextContent("/a");
    act(() => {
      screen.getByTestId("btn").click();
    });
    expect(spy).toHaveBeenCalledWith("/b");
  });
});
```

- [ ] **Step 2: 跑全量测试 + 覆盖率**

```bash
pnpm test:coverage
```

预期：所有 test passed，覆盖率达标：`src/router.ts` ≥ 95%，整体 ≥ 80%。若失败：

- `router.ts` 覆盖率不达标 → 在 `router.test.ts` 或 `router.history.test.ts` 补充用例覆盖未命中分支（覆盖率报告 `coverage/index.html` 标红行）
- 整体不达标 → 优先补 NavStack 的边界分支（`replace` 路径、`pop` 中旧栈顶不存在等）

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "test: cover useNavRoute and hit coverage thresholds"
```

---

## Task 15: VitePress 文档站骨架 + React Demo 壳

**Files:**

- Create: `docs/.vitepress/config.ts`, `docs/.vitepress/theme/index.ts`, `docs/.vitepress/theme/ReactDemo.vue`, `docs/index.md`
- Modify: `package.json`（追加 docs 相关 devDeps + scripts）

- [ ] **Step 1: 追加 devDeps 与 scripts**

`devDependencies` 追加：

```json
"@vitejs/plugin-react": "^4.3.0",
"vitepress": "^1.4.0",
"vue": "^3.5.0"
```

`scripts` 追加：

```json
"docs:dev": "vitepress dev docs",
"docs:build": "pnpm api:extract && pnpm api:doc && vitepress build docs",
"docs:preview": "vitepress preview docs --port 4173"
```

- [ ] **Step 2: 写 `docs/.vitepress/config.ts`**

```ts
import { defineConfig } from "vitepress";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  title: "react-nav-router",
  description: "Lightweight iOS-style stack router for React 18.",
  base: "/react-nav-router/", // GH Pages 子路径，按实际仓库名调整或留空
  srcExclude: ["superpowers/**"],
  vite: {
    plugins: [react()],
    resolve: {
      alias: {
        "react-nav-router": resolve(__dirname, "../../src/index.ts"),
      },
    },
    optimizeDeps: {
      exclude: ["react-nav-router"],
    },
  },
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/index" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Concepts", link: "/guide/concepts" },
            { text: "Recipes", link: "/guide/recipes" },
            { text: "History Mode", link: "/guide/history" },
            { text: "Testing", link: "/guide/testing" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/TODO/react-nav-router" },
    ],
  },
});
```

- [ ] **Step 3: 写 `docs/.vitepress/theme/ReactDemo.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";

const props = defineProps<{ src: string }>();

const containerRef = ref<HTMLDivElement | null>(null);
let root: Root | null = null;

const demoModules = import.meta.glob("/demos/*/index.tsx");

async function mount() {
  if (!containerRef.value) return;
  const key = `/demos/${props.src}/index.tsx`;
  const loader = demoModules[key];
  if (!loader) {
    containerRef.value.textContent = `Demo not found: ${props.src}`;
    return;
  }
  const mod: any = await loader();
  const Component = mod.default;
  root?.unmount();
  root = createRoot(containerRef.value);
  root.render(createElement(Component));
}

onMounted(mount);
watch(() => props.src, mount);
onBeforeUnmount(() => {
  root?.unmount();
  root = null;
});
</script>

<template>
  <div class="react-demo" ref="containerRef" />
</template>

<style scoped>
.react-demo {
  position: relative;
  width: 100%;
  height: 480px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}
</style>
```

- [ ] **Step 4: 写 `docs/.vitepress/theme/index.ts`**

```ts
import DefaultTheme from "vitepress/theme";
import ReactDemo from "./ReactDemo.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("ReactDemo", ReactDemo);
  },
};
```

- [ ] **Step 5: 写 `docs/index.md`**

```markdown
---
layout: home
hero:
  name: react-nav-router
  text: iOS-style stack router for React 18
  tagline: Lightweight, animated, history-aware
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/index
features:
  - title: 栈式导航
    details: push / pop / replace 与 iOS 风格过渡动画
  - title: 历史联动
    details: hash 模式开箱即用，popstate / hashchange 自动处理
  - title: 生命周期钩子
    details: willAppear / didAppear / willDisappear / didDisappear
---
```

- [ ] **Step 6: 安装 + 起 dev 自检**

```bash
pnpm install
pnpm docs:dev --port 5173 &
SERVER_PID=$!
sleep 5
curl -fsS http://localhost:5173/react-nav-router/ -o /dev/null
kill $SERVER_PID
```

预期：curl 成功返回 200，docs 首页可渲染。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat(docs): scaffold vitepress site with React demo shell"
```

---

## Task 16: 文档站 Guide 五篇

**Files:**

- Create: `docs/guide/getting-started.md`, `docs/guide/concepts.md`, `docs/guide/recipes.md`, `docs/guide/history.md`, `docs/guide/testing.md`

- [ ] **Step 1: 写 `docs/guide/getting-started.md`**

```markdown
# Getting Started

## 安装

\`\`\`bash
pnpm add react-nav-router

# or

npm i react-nav-router
\`\`\`

需要 `react@>=18` 与 `react-dom@>=18` 作为 peer dependency。

## 最小示例

\`\`\`tsx
import { createRouter, NavRouter } from 'react-nav-router';

const router = createRouter({ rootRoute: '/', history: 'hash' });

function Page({ path }: { path: string }) {
return <div>Now at {path}</div>;
}

export default function App() {
return <NavRouter router={router} render={(p) => <Page path={p} />} />;
}
\`\`\`

## 跳转与回退

\`\`\`tsx
import { useNavRoute } from 'react-nav-router';

function Home() {
const { navigateTo, navigateBack } = useNavRoute();
return (
<>
<button onClick={() => navigateTo('/detail?id=1')}>Open detail</button>
<button onClick={() => navigateBack()}>Back</button>
</>
);
}
\`\`\`

<ReactDemo src="basic" />
```

- [ ] **Step 2: 写 `docs/guide/concepts.md`**

```markdown
# Concepts

库分三层：

- **数据层** `createRouter` — 维护路由栈、与浏览器历史联动
- **视图层** `NavStack` / `NavView` — 栈渲染与过渡动画、页面生命周期
- **集成层** `NavRouter` / `useNavRoute` — 把上面两层粘起来

## 路由栈语义

- `navigateTo(to)` — 默认把目标 route 入栈
- `navigateBack(lastIndex = -1)` — 按 `Array.slice(0, lastIndex)` 裁栈
  - 正整数 N：保留前 N 个
  - 负整数 -N：回退 N 层
- 自定义跳转策略通过 `customNavigation` 注入

## AppearStatus 状态机

`NavStack` 内部为每个视图打 `appearStatus`，由 `NavView` 翻译成 will/did Appear/Disappear 四钩子。具体状态见 API 文档。

## React key 复用

`NavStack` 用 `WeakMap<stackItem, number>` 为每个 stack item 分配稳定 key，相同引用的页面回到栈中时组件实例复用，内部 state 不丢。

> 因此 `stack` 数组的元素必须保持引用稳定 —— `createRouter` 内部已经按这种方式构造 route 对象。
```

- [ ] **Step 3: 写 `docs/guide/recipes.md`**

```markdown
# Recipes

## 自定义跳转策略

<ReactDemo src="advanced" />

\`\`\`tsx
const router = createRouter({
rootRoute: '/',
history: 'hash',
customNavigation(evt, stack, def) {
if (evt.action === 'navigateTo') {
// 同 path 不重复入栈
if (stack.some((r) => r.path === evt.payload.path)) return stack;
}
return def(evt, stack);
},
});
\`\`\`

## 公共布局（renderCommon）

\`\`\`tsx
<NavRouter
router={router}
render={(p) => <Page path={p} />}
renderCommon={(children, path) => (

<div className="shell">
<header>当前：{path}</header>
<main>{children}</main>
</div>
)}
/>
\`\`\`

## 嵌套 NavStack

外层 `NavRouter` 接管浏览器 history（一个页面内只允许一个），内层手动构建 `NavStack` 控制子页面栈。
```

- [ ] **Step 4: 写 `docs/guide/history.md`**

```markdown
# History Mode

目前仅支持 `history: 'hash'`，行为：

- 初始化：若 url 已有 `#/path`，从 hash 恢复路由（与 `rootRoute` 重复时不重复 push）
- `navigateTo` / `navigateBack`：写入 `history.pushState`，state 中保存当前栈的序列化形式
- 浏览器后退：`popstate` 触发，使用 state 中保存的栈反序列化恢复
- 用户手动改 hash：`hashchange` 触发，**视为整页跳转**，路由栈替换为单路由

> ⚠️ 同一页面内只能有一个 `Router` 开启 `history`。嵌套场景下，子 Router 不传 `history` 配置。
```

- [ ] **Step 5: 写 `docs/guide/testing.md`**

```markdown
# Testing

## 在用户项目中 mock NavRouter

\`\`\`tsx
import { NavRouteContext } from 'react-nav-router';

render(
<NavRouteContext.Provider
value={{
      route: { path: '/test', params: {} },
      length: 1,
      navigateTo: vi.fn(),
      navigateBack: vi.fn(),
    }}

>

    <YourPage />

</NavRouteContext.Provider>,
);
\`\`\`

## 过渡动画

`NavStack` 的过渡用 `requestAnimationFrame` 双帧 + `setTimeout`，在 jsdom 中需要手动 flush。本仓库 `tests/utils/raf.ts` 提供参考实现。

## 生命周期演示

<ReactDemo src="lifecycle" />
```

- [ ] **Step 6: 验证 docs 构建**

```bash
pnpm docs:build
```

预期：成功构建，输出在 `docs/.vitepress/dist/`。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "docs: write five guide pages"
```

---

## Task 17: Demo 三个 + 共享组件

**Files:**

- Create: `docs/demos/_shared/Button.tsx`, `docs/demos/_shared/Page.tsx`, `docs/demos/basic/index.tsx`, `docs/demos/advanced/index.tsx`, `docs/demos/lifecycle/index.tsx`

- [ ] **Step 1: 写 `docs/demos/_shared/Button.tsx`**

```tsx
import React from "react";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { style, ...rest } = props;
  return (
    <button
      {...rest}
      style={{
        padding: "8px 16px",
        marginRight: 8,
        border: "1px solid #888",
        borderRadius: 4,
        background: "#fff",
        cursor: "pointer",
        ...style,
      }}
    />
  );
}
```

- [ ] **Step 2: 写 `docs/demos/_shared/Page.tsx`**

```tsx
import React from "react";

export function Page({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ padding: 24, height: "100%", boxSizing: "border-box" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: 写 `docs/demos/basic/index.tsx`**

```tsx
import React from "react";
import { createRouter, NavRouter, useNavRoute } from "react-nav-router";
import { Button } from "../_shared/Button";
import { Page } from "../_shared/Page";

const router = createRouter({ rootRoute: "/home" });

function PageView({ path }: { path: string }) {
  const { navigateTo, navigateBack, length } = useNavRoute();
  return (
    <Page title={path}>
      <p>Stack depth: {length}</p>
      <Button onClick={() => navigateTo("/detail?id=" + Date.now())}>
        Push detail
      </Button>
      <Button onClick={() => navigateTo("/profile")}>Push profile</Button>
      <Button onClick={() => navigateBack()} disabled={length <= 1}>
        Back
      </Button>
    </Page>
  );
}

export default function BasicDemo() {
  return <NavRouter router={router} render={(p) => <PageView path={p} />} />;
}
```

- [ ] **Step 4: 写 `docs/demos/advanced/index.tsx`**

```tsx
import React from "react";
import { createRouter, NavRouter, useNavRoute } from "react-nav-router";
import { Button } from "../_shared/Button";
import { Page } from "../_shared/Page";

// 同 path 去重的自定义策略
const router = createRouter({
  rootRoute: "/home",
  customNavigation(evt, stack, def) {
    if (evt.action === "navigateTo") {
      if (stack.some((r) => r.path === evt.payload.path)) return stack;
    }
    return def(evt, stack);
  },
});

function PageView({ path }: { path: string }) {
  const { navigateTo, navigateBack, length } = useNavRoute();
  return (
    <Page title={path}>
      <p data-testid="depth">Stack depth: {length}</p>
      <Button onClick={() => navigateTo("/a")}>Push /a (dedup)</Button>
      <Button onClick={() => navigateTo("/b")}>Push /b</Button>
      <Button onClick={() => navigateBack()} disabled={length <= 1}>
        Back
      </Button>
    </Page>
  );
}

export default function AdvancedDemo() {
  return (
    <NavRouter
      router={router}
      render={(p) => <PageView path={p} />}
      renderCommon={(children, path) => (
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <header
            data-testid="header"
            style={{
              padding: "8px 16px",
              background: "#f0f0f0",
              borderBottom: "1px solid #ccc",
            }}
          >
            Top bar — current: {path}
          </header>
          <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
        </div>
      )}
    />
  );
}
```

- [ ] **Step 5: 写 `docs/demos/lifecycle/index.tsx`**

```tsx
import React, { useState } from "react";
import {
  createRouter,
  NavRouter,
  NavView,
  useNavRoute,
} from "react-nav-router";
import { Button } from "../_shared/Button";
import { Page } from "../_shared/Page";

const router = createRouter({ rootRoute: "/home" });

const counters: Record<string, Record<string, number>> = {};

function PageView({ path }: { path: string }) {
  const { navigateTo, navigateBack, length } = useNavRoute();
  const [, force] = useState(0);
  const bump = (k: string) => {
    counters[path] = counters[path] || {
      willAppear: 0,
      didAppear: 0,
      willDisappear: 0,
      didDisappear: 0,
    };
    counters[path][k] = (counters[path][k] || 0) + 1;
    force((n) => n + 1);
  };
  return (
    <NavView
      willAppear={() => bump("willAppear")}
      didAppear={() => bump("didAppear")}
      willDisappear={() => bump("willDisappear")}
      didDisappear={() => bump("didDisappear")}
    >
      <Page title={path}>
        <pre data-testid={`counters-${path}`}>
          {JSON.stringify(counters[path] || {}, null, 2)}
        </pre>
        <Button onClick={() => navigateTo("/detail?id=" + Date.now())}>
          Push
        </Button>
        <Button onClick={() => navigateBack()} disabled={length <= 1}>
          Back
        </Button>
      </Page>
    </NavView>
  );
}

export default function LifecycleDemo() {
  return <NavRouter router={router} render={(p) => <PageView path={p} />} />;
}
```

- [ ] **Step 6: 起 dev 自检 demo 可见**

```bash
pnpm docs:dev --port 5173 &
SERVER_PID=$!
sleep 5
curl -fsS http://localhost:5173/react-nav-router/guide/getting-started.html | grep -q 'react-demo'
echo "demo placeholder render OK"
kill $SERVER_PID
```

预期 grep 命中 `react-demo` className。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat(demos): add basic/advanced/lifecycle React demos"
```

---

## Task 18: Playwright E2E

**Files:**

- Create: `playwright.config.ts`, `e2e/fixtures.ts`, `e2e/basic.spec.ts`, `e2e/transition.spec.ts`, `e2e/history.spec.ts`, `e2e/lifecycle.spec.ts`, `e2e/advanced.spec.ts`
- Modify: `package.json`（追加 e2e devDeps + scripts）

- [ ] **Step 1: 追加 devDeps + scripts**

`devDependencies` 追加：

```json
"@playwright/test": "^1.47.0"
```

`scripts` 追加：

```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui"
```

- [ ] **Step 2: 写 `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const BASE = `http://localhost:${PORT}/react-nav-router`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html"]] : "list",
  use: {
    baseURL: BASE,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm docs:build && pnpm docs:preview",
    url: BASE + "/",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 3: 写 `e2e/fixtures.ts`**

```ts
import { Page } from "@playwright/test";

/** 等过渡动画结束（与 NavStack 的 transitionDuration + 缓冲一致） */
export async function waitForTransition(page: Page) {
  await page.waitForTimeout(350);
}
```

- [ ] **Step 4: 写 `e2e/basic.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { waitForTransition } from "./fixtures";

test("push then back", async ({ page }) => {
  await page.goto("/guide/getting-started.html");
  await page.waitForSelector("text=Stack depth");

  await page.getByRole("button", { name: "Push detail" }).click();
  await waitForTransition(page);
  await expect(page.getByText(/Stack depth: 2/)).toBeVisible();

  await page.getByRole("button", { name: "Back" }).click();
  await waitForTransition(page);
  await expect(page.getByText(/Stack depth: 1/)).toBeVisible();
});
```

- [ ] **Step 5: 写 `e2e/transition.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("transform 在 push 中出现非零值，结束后复位", async ({ page }) => {
  await page.goto("/guide/getting-started.html");
  await page.waitForSelector("text=Stack depth");

  const pushPromise = page.evaluate(() => {
    return new Promise<string[]>((resolve) => {
      const samples: string[] = [];
      const start = performance.now();
      const tick = () => {
        const wraps = document.querySelectorAll(".react-demo > div > div");
        wraps.forEach((el) =>
          samples.push((el as HTMLElement).style.transform),
        );
        if (performance.now() - start < 250) requestAnimationFrame(tick);
        else resolve(samples);
      };
      requestAnimationFrame(tick);
    });
  });

  await page.getByRole("button", { name: "Push detail" }).click();
  const samples = await pushPromise;
  expect(samples.some((s) => /translate3d/.test(s))).toBe(true);

  // 等动画结束并断言复位
  await page.waitForTimeout(400);
  const finalTransforms = await page.$$eval(".react-demo > div > div", (els) =>
    els.map((el) => (el as HTMLElement).style.transform),
  );
  expect(finalTransforms.every((t) => t === "" || t === "none")).toBe(true);
});
```

- [ ] **Step 6: 写 `e2e/history.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { waitForTransition } from "./fixtures";

test.describe("history hash 模式", () => {
  test("浏览器后退恢复栈", async ({ page }) => {
    await page.goto("/guide/getting-started.html");
    await page.waitForSelector("text=Stack depth");
    await page.getByRole("button", { name: "Push detail" }).click();
    await waitForTransition(page);
    const before = page.url();
    await page.goBack();
    await waitForTransition(page);
    expect(page.url()).not.toBe(before);
    await expect(page.getByText(/Stack depth: 1/)).toBeVisible();
  });
});
```

- [ ] **Step 7: 写 `e2e/lifecycle.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { waitForTransition } from "./fixtures";

test("lifecycle 钩子计数随 push/back 递增", async ({ page }) => {
  await page.goto("/guide/testing.html");
  // testing.md 末尾嵌入了 <ReactDemo src="lifecycle" />
  await page.waitForSelector('[data-testid^="counters-"]');
  const initialPre = page.locator('[data-testid="counters-/home"]');
  await expect(initialPre).toContainText('"willAppear": 1');
  await expect(initialPre).toContainText('"didAppear": 1');

  await page.getByRole("button", { name: "Push" }).click();
  await waitForTransition(page);
  // home 应触发了 willDisappear / didDisappear
  await expect(initialPre).toContainText('"willDisappear": 1');
  await expect(initialPre).toContainText('"didDisappear": 1');
});
```

- [ ] **Step 8: 写 `e2e/advanced.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { waitForTransition } from "./fixtures";

test("同 path 去重 + renderCommon 顶栏", async ({ page }) => {
  await page.goto("/guide/recipes.html");
  await page.waitForSelector("text=Stack depth");
  await expect(page.getByTestId("header")).toBeVisible();
  await page.getByRole("button", { name: "Push /a" }).click();
  await waitForTransition(page);
  await expect(page.getByTestId("depth")).toContainText("2");
  await page.getByRole("button", { name: "Push /a (dedup)" }).click();
  await waitForTransition(page);
  await expect(page.getByTestId("depth")).toContainText("2"); // 去重
});
```

- [ ] **Step 9: 安装 chromium**

```bash
pnpm install
pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 10: 本地跑通**

```bash
pnpm e2e
```

预期：所有 spec passed。失败时按报告 `playwright-report/index.html` 排查（动画时长、选择器、demo 嵌入）。

- [ ] **Step 11: 提交**

```bash
git add -A
git commit -m "test(e2e): add Playwright specs for basic/transition/history/lifecycle/advanced"
```

---

## Task 19: GitHub Actions CI

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: 写 `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  api-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm api:check

  e2e:
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report

  docs-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm docs:build
```

- [ ] **Step 2: 本地 yaml 语法自检**

```bash
node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8');console.log('len',y.length)"
```

预期输出文件长度，无异常。（若装了 actionlint 可跑 `actionlint .github/workflows/*.yml`）

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "ci: add GitHub Actions workflow for lint/test/build/api-check/e2e"
```

---

## Task 20: GitHub Pages 文档发布

**Files:**

- Create: `.github/workflows/docs.yml`

- [ ] **Step 1: 写 `.github/workflows/docs.yml`**

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm docs:build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "ci: deploy docs to GitHub Pages on main push"
```

- [ ] **Step 3: 手动步骤备注**

仓库 push 到 GitHub 后，到 `Settings → Pages`，把 "Source" 设为 "GitHub Actions"。这一步无法在代码里完成；在 README 中记下。

---

## Task 21: README 完善 + CHANGELOG + changeset 占位 + 终验

**Files:**

- Modify: `README.md`
- Create: `CHANGELOG.md`, `.changeset/config.json`, `.changeset/README.md`

- [ ] **Step 1: 完善 `README.md`**

覆盖写：

```markdown
# react-nav-router

Lightweight iOS-style stack router for React 18.

[![CI](https://github.com/TODO/react-nav-router/actions/workflows/ci.yml/badge.svg)](https://github.com/TODO/react-nav-router/actions/workflows/ci.yml)
[![Docs](https://github.com/TODO/react-nav-router/actions/workflows/docs.yml/badge.svg)](https://github.com/TODO/react-nav-router/actions/workflows/docs.yml)

> Documentation & live demos: <https://TODO.github.io/react-nav-router>

## Install

\`\`\`bash
pnpm add react-nav-router
\`\`\`

Peer: `react@>=18`, `react-dom@>=18`.

## Quick start

\`\`\`tsx
import { createRouter, NavRouter } from 'react-nav-router';

const router = createRouter({ rootRoute: '/', history: 'hash' });

export default function App() {
return <NavRouter router={router} render={(p) => <Page path={p} />} />;
}
\`\`\`

## Features

- iOS-style push / pop / replace transitions
- `willAppear` / `didAppear` / `willDisappear` / `didDisappear` lifecycle
- Hash-mode history binding with manual hash & popstate handling
- `customNavigation` hook for per-app stack policies
- Tiny — zero runtime dependencies, ~5KB gzip

## Development

\`\`\`bash
pnpm install
pnpm test # unit tests
pnpm e2e # playwright e2e
pnpm docs:dev # live docs site
pnpm build # produce dist/
\`\`\`

## Publishing docs

First-time setup: repo Settings → Pages → Source = "GitHub Actions". Subsequent pushes to `main` deploy automatically.

## License

MIT
```

- [ ] **Step 2: 写 `CHANGELOG.md`**

```markdown
# Changelog

All notable changes will be documented here.

## [Unreleased]

### Added

- Initial scaffolding: build (tsup), tests (vitest + playwright), docs (vitepress),
  API reference (api-extractor + api-documenter), CI/CD (GitHub Actions + Pages).
```

- [ ] **Step 3: 写 `.changeset/config.json`**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 4: 写 `.changeset/README.md`**

```markdown
# Changesets

This folder is reserved for future use of [changesets](https://github.com/changesets/changesets).
Not wired to CI yet; manual `pnpm publish` for now.
```

- [ ] **Step 5: 终验全套**

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm api:check
pnpm docs:build
pnpm e2e
```

预期：所有命令依次成功，无失败。

- [ ] **Step 6: 最终提交**

```bash
git add -A
git commit -m "chore: finalize README, CHANGELOG, changeset placeholder"
```

- [ ] **Step 7: 推送（可选，按用户准备就绪决定）**

```bash
# git remote add origin git@github.com:TODO/react-nav-router.git
# git push -u origin main
```

到 GitHub 后手动开启 Pages 来源为 "GitHub Actions"，CI 与 Pages workflow 即可工作。

---

## 自检勾稽

| 设计 §                       | 任务                                               |
| ---------------------------- | -------------------------------------------------- |
| §2 工具链                    | Task 2/3/5/6/15/18/19                              |
| §3 目录                      | Task 1/2/6/15/17/18/19/20/21                       |
| §4.1 包元信息                | Task 2 (含 exports / peerDependencies)             |
| §4.2 测试 — 单测             | Task 6/7/8/9/10/11/12/13/14                        |
| §4.2 测试 — E2E              | Task 18                                            |
| §4.3 API 流水线              | Task 5（+ Task 15 在 docs:build 中串联）           |
| §4.4 docs + demo             | Task 15/16/17                                      |
| §4.5 CI                      | Task 19/20                                         |
| §4.6 scripts                 | 散落在 Task 2/3/5/6/15/18 中追加                   |
| §5 落地 11 步                | 拆为 21 任务（更细粒度），落地步骤一一对应         |
| §6 风险（rAF）               | Task 6 (raf utils) + Task 11 (用 utils)            |
| §6 风险（VitePress + React） | Task 15（ReactDemo.vue 实现）                      |
| §7 未决项                    | author/repo 字段标 `TODO`，README/LICENSE 同样占位 |
