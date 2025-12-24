# Cloudflare Pages 部署指南

本项目使用 **GitHub Actions + Terraform** 自动化部署到 Cloudflare Pages，使用 KV 存储用户设置。

## 部署架构

- **CI/CD**: GitHub Actions
- **基础设施**: Terraform (deploy.tf - 自动创建 KV namespace、Pages 项目)
- **本地开发**: next.config.mjs 中的 setupDevPlatform()
- **构建工具**: @cloudflare/next-on-pages
- **部署工具**: Wrangler CLI

> **注意**: 不需要 wrangler.toml，本地开发配置在 next.config.mjs 中，生产环境由 Terraform 管理。

## 快速开始

### 1. 配置 GitHub Secrets

在你的 GitHub 仓库设置中添加以下 Secrets：

1. 进入仓库 **Settings** → **Secrets and variables** → **Actions**
2. 添加 Secret：
   - `CLOUDFLARE_API_TOKEN`: 你的 Cloudflare API Token
     - 获取方式：登录 Cloudflare Dashboard → My Profile → API Tokens → Create Token
     - 权限需要：Account.Cloudflare Pages (Edit), Account.Workers KV Storage (Edit)
   - `CLOUDFLARE_ACCOUNT_ID` (可选): 你的 Cloudflare Account ID
     - 如果不设置，会自动从 API 获取

### 2. 推送代码触发部署

```bash
git add .
git commit -m "feat: setup cloudflare deployment"
git push origin master
```

推送到 `master` 分支后，GitHub Actions 会自动：
1. 构建 Next.js 项目
2. 使用 Terraform 创建/更新 KV namespace、Pages 项目
3. 部署到 Cloudflare Pages

### 3. 查看部署状态

- GitHub Actions: 仓库的 **Actions** 标签页
- Cloudflare Dashboard: https://dash.cloudflare.com/

部署完成后，你的网站将在：`https://new-tab.pages.dev`

## 本地开发

### 安装依赖

```bash
npm install --legacy-peer-deps
```

> **注意**: 使用 `--legacy-peer-deps` 是因为某些依赖（如 vaul）还未正式支持 React 19。

### 本地开发服务器

```bash
# 标准 Next.js 开发（自动加载 Cloudflare 绑定）
npm run dev
# next.config.mjs 会自动调用 setupDevPlatform() 配置本地 KV

# 使用 Cloudflare Pages 环境预览（完整模拟生产环境）
npm run preview
```

本地开发时，`setupDevPlatform()` 会：
- 在 next.config.mjs 中直接配置 KV 绑定
- 创建本地模拟的 KV namespace
- 通过 `getRequestContext()` 在 API 路由中访问

## 初始化 KV 存储

首次部署后，KV namespace 会自动创建，无需手动初始化。

查看 KV 内容：
```bash
# 列出所有 KV namespace
wrangler kv:namespace list

# 列出 KV 中的所有键
wrangler kv:key list --namespace-id=<YOUR_NAMESPACE_ID>

# 读取特定键的值
wrangler kv:key get "settings:avatar" --namespace-id=<YOUR_NAMESPACE_ID>
```

## 手动部署（可选）

如果不想使用 GitHub Actions，也可以手动部署：

```bash
# 1. 安装 Terraform
# macOS: brew install terraform
# Windows: choco install terraform
# Linux: 参考 https://www.terraform.io/downloads

# 2. 设置环境变量
export CLOUDFLARE_API_TOKEN="your-api-token"
export TF_VAR_CLOUDFLARE_ACCOUNT_ID="your-account-id"

# 3. 初始化 Terraform
terraform init

# 4. 创建基础设施
terraform apply

# 5. 安装依赖
npm install --legacy-peer-deps

# 6. 构建并部署
npm run build
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static --project-name new-tab
```

## 在代码中使用 KV 存储

### 使用 KV namespace

```typescript
// app/api/settings/route.ts
import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const { env } = getRequestContext();
  const { key, value } = await request.json();

  try {
    // 写入 KV
    await env.NEWTAB_KV.put(key, value);

    // 读取 KV
    const storedValue = await env.NEWTAB_KV.get(key);

    return Response.json({ success: true, value: storedValue });
  } catch (error) {
    return Response.json({ error: 'Failed to access KV' }, { status: 500 });
  }
}
```



## 环境变量

如果需要环境变量：
- **本地开发**: 在 `next.config.mjs` 的 `setupDevPlatform()` 中配置
- **生产环境**: 在 `deploy.tf` 中通过 Terraform 配置，或在 Cloudflare Dashboard 的 Pages 项目设置中添加

## 注意事项

1. **Edge Runtime**: 使用 KV 存储的 API 路由需要设置 `export const runtime = 'edge'`
2. **兼容性**: 项目自动配置 `nodejs_compat` 兼容性标志
3. **KV 绑定**: KV namespace 通过 Terraform 自动绑定，无需手动配置
4. **构建输出**: Next.js 构建输出会在 `.vercel/output/static` 目录

## Terraform 管理

### 查看资源状态
```bash
terraform show
```

### 销毁资源（谨慎使用）
```bash
terraform destroy
```

### 更新配置
修改 `deploy.tf` 后：
```bash
terraform plan    # 预览变更
terraform apply   # 应用变更
```

## 常用命令

### KV 存储
```bash
# 查看 KV namespace 列表
wrangler kv:namespace list

# 列出所有键
wrangler kv:key list --namespace-id=<YOUR_NAMESPACE_ID>

# 读取键值
wrangler kv:key get "settings:avatar" --namespace-id=<YOUR_NAMESPACE_ID>

# 写入键值
wrangler kv:key put "settings:avatar" "data:image/png;base64,..." --namespace-id=<YOUR_NAMESPACE_ID>

# 删除键
wrangler kv:key delete "settings:avatar" --namespace-id=<YOUR_NAMESPACE_ID>
```



### Pages 部署
```bash
# 查看部署列表
wrangler pages deployment list --project-name=new-tab

# 查看实时日志
wrangler pages deployment tail --project-name=new-tab

# 回滚到之前的部署
wrangler pages deployment rollback --project-name=new-tab
```

## 参考文档

- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Workers KV](https://developers.cloudflare.com/kv/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
