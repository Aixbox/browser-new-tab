# AGENTS.md

本文件面向本仓库的自动化编码代理，包含构建/检查命令与代码风格约定。

## 目录
- 项目概览
- 常用命令
- 单测与单文件测试
- 代码风格与工程约定
- UI 与设计系统
- 错误处理与日志
- 运行环境与部署
- 规则文件与外部约定

## 项目概览
- 技术栈：Next.js 15、React 19、TypeScript 5
- 页面体系：Pages Router（`pages/`），同时存在 `components/`、`hooks/`、`lib/`
- 样式：Tailwind CSS v4 + 设计系统 + shadcn/ui
- 运行：默认 Next.js，本地可对齐 Cloudflare Pages

## 常用命令（package.json）
- 开发：`npm run dev`
- 构建：`npm run build`
- 启动：`npm run start`
- Lint：`npm run lint`
- Cloudflare Pages 构建：`npm run pages:build`
- Cloudflare Pages 预览：`npm run preview`

### 依赖安装
- `npm install --legacy-peer-deps`

## 单测与单文件测试
- 当前未发现 Jest/Vitest/Playwright/Cypress 等测试配置。
- 如需新增测试，请先与维护者确认测试框架与目录约定。
- 单文件测试命令：暂无。

## 代码风格与工程约定

### TypeScript 与模块
- 使用严格 TypeScript（`tsconfig.json`：`strict: true`）。
- 路径别名：`@/*` 指向仓库根目录。
- 类型导入优先使用 `import type`。
- `"use client"` 必须放在文件首行。
- 允许 `any`（eslint 规则 `@typescript-eslint/no-explicit-any` 已关闭），但仍建议最小化。

### 导入顺序（项目内常见模式）
1. React/Next 相关
2. 第三方依赖
3. 项目内模块（`@/` 或相对路径）
4. 类型导入（尽量与值导入分组）

### 组件与 shadcn/ui 约定
- 组件使用 `React.forwardRef` 并设置 `displayName`。
- UI 组件使用 `class-variance-authority (cva)` 声明变体。
- 类名合并统一使用 `cn()`（`clsx` + `tailwind-merge`）。
- 组件支持 `asChild`（Radix Slot）模式。

### 格式与命名
- 文件内风格保持一致（本仓库既有双引号也有单引号）。
- `camelCase` 用于变量/函数，`PascalCase` 用于组件/类型。
- 避免无意义单字母变量，除非是非常局部的循环/回调。

### React 与 Hooks
- Hooks 以 `use` 开头，放在 `hooks/`。
- 组件中的副作用使用 `useEffect`，注意清理事件/定时器。
- 事件处理函数命名为 `handleXxx` 或 `onXxx`。

### Next.js 约定
- Pages Router API：`pages/api/*` 采用默认导出 `handler`。
- Edge Runtime：`export const runtime = 'edge'` 出现在 API 文件中。
- 服务端数据通过 `getServerSideProps` 获取（见 `pages/index.tsx`）。

## UI 与设计系统（重要）
- 设计系统示例与规范在 `docs/AI_STYLE_GUIDE.md`。
- 必须遵循玻璃态审美：`backdrop-blur-xl bg-primary/20 border-2 border-border/50`。
- 圆角层级：卡片 `rounded-3xl`，按钮/输入 `rounded-full`。
- 阴影体系：优先使用 `shadow-button` / `shadow-button-hover`。
- 颜色必须使用变量（如 `text-foreground`、`bg-primary/20`）。
- 响应式要求：支持 `short:lg:` 断点。
- 间距系统：页面级使用 `p-inset px-sides pb-footer-safe-area`。

## 错误处理与日志
- API 与 async 逻辑使用 `try/catch`，错误通过 `console.error` 记录。
- 业务错误通过 `ActionResult` 模式返回：`success(...)` / `error(...)`。
- 不要吞掉错误（避免空 `catch`）。

## 数据与存储
- Settings 与同步数据基于 Cloudflare KV。
- 数据同步使用时间戳机制（见 `hooks/use-data-sync.ts`）。
- KV 访问在 `pages/api/*`，需校验 `SECRET_KEY` 时保持一致逻辑。

## 运行环境与部署
- Next.js 配置在 `next.config.mjs`：
  - `reactStrictMode: true`
  - `eslint.ignoreDuringBuilds: true`
  - `typescript.ignoreBuildErrors: true`
- Cloudflare Pages 本地绑定：`@cloudflare/next-on-pages/next-dev`

## 规则文件与外部约定
- 未发现 `.cursorrules` 或 `.cursor/rules/`。
- 未发现 `.github/copilot-instructions.md`。
- 其他重要文档：
  - `docs/AI_STYLE_GUIDE.md`
  - `README.md`
  - `DEPLOYMENT.md`

## 外部参考（仅用于理解）
- shadcn/ui 组件结构：`components/ui/*` 作为模板
- Tailwind 自定义主题：`tailwind.config.js`

## 变更建议
- 如需新增测试或改动构建流程，请先与维护者确认。
