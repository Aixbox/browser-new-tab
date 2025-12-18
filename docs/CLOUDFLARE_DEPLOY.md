# Cloudflare Pages 部署指南

本项目使用 **GitHub Actions + Terraform** 自动化部署到 Cloudflare Pages，集成 D1 数据库和 R2 存储。

## 部署架构

- **CI/CD**: GitHub Actions
- **基础设施**: Terraform (deploy.tf - 自动创建 D1、R2、Pages 项目)
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
     - 权限需要：Account.Cloudflare Pages (Edit), Account.D1 (Edit), Account.R2 (Edit)
   - `CLOUDFLARE_ACCOUNT_ID` (可选): 你的 Cloudflare Account ID
     - 如果不设置，会自动从 API 获取

### 2. 推送代码触发部署

```bash
git add .
git commit -m "feat: setup cloudflare deployment"
git push origin main
```

推送到 `main` 分支后，GitHub Actions 会自动：
1. 构建 Next.js 项目
2. 使用 Terraform 创建/更新 D1 数据库、R2 存储桶、Pages 项目
3. 部署到 Cloudflare Pages

### 3. 查看部署状态

- GitHub Actions: 仓库的 **Actions** 标签页
- Cloudflare Dashboard: https://dash.cloudflare.com/

部署完成后，你的网站将在：`https://newsletter-app.pages.dev`

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
# next.config.mjs 会自动调用 setupDevPlatform() 配置本地 D1 和 R2

# 使用 Cloudflare Pages 环境预览（完整模拟生产环境）
npm run preview
```

本地开发时，`setupDevPlatform()` 会：
- 在 next.config.mjs 中直接配置 D1 和 R2 绑定
- 创建本地模拟的 D1 数据库和 R2 存储
- 通过 `getRequestContext()` 在 API 路由中访问

## 初始化数据库

首次部署后，需要初始化数据库表结构：

```bash
# 安装 wrangler（如果还没有）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 执行数据库迁移
wrangler d1 execute newsletter-db --file=./schema.sql --remote
```

查看数据库内容：
```bash
wrangler d1 execute newsletter-db --command="SELECT * FROM subscribers" --remote
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
npx wrangler pages deploy .vercel/output/static --project-name newsletter-app
```

## 在代码中使用 D1 和 R2

### 使用 D1 数据库

```typescript
// app/api/subscribe/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const env = process.env as unknown as CloudflareEnv;
  const { email, name } = await request.json();

  try {
    await env.DB.prepare(
      'INSERT INTO subscribers (email, name) VALUES (?, ?)'
    ).bind(email, name).run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
```

### 使用 R2 存储

```typescript
// app/api/upload/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const env = process.env as unknown as CloudflareEnv;
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    await env.ASSETS.put(file.name, file.stream());
    return Response.json({ success: true, filename: file.name });
  } catch (error) {
    return Response.json({ error: 'Failed to upload' }, { status: 500 });
  }
}
```

## 环境变量

如果需要环境变量：
- **本地开发**: 在 `next.config.mjs` 的 `setupDevPlatform()` 中配置
- **生产环境**: 在 `deploy.tf` 中通过 Terraform 配置，或在 Cloudflare Dashboard 的 Pages 项目设置中添加

## 注意事项

1. **Edge Runtime**: 使用 D1 和 R2 的 API 路由需要设置 `export const runtime = 'edge'`
2. **兼容性**: 确保 `wrangler.toml` 中的 `compatibility_flags` 包含 `nodejs_compat`
3. **数据库 ID**: 记得在 `wrangler.toml` 中更新实际的 D1 数据库 ID
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

### D1 数据库
```bash
# 查看数据库列表
wrangler d1 list

# 查询数据
wrangler d1 execute newsletter-db --command="SELECT * FROM subscribers" --remote

# 执行 SQL 文件
wrangler d1 execute newsletter-db --file=./schema.sql --remote

# 导出数据
wrangler d1 export newsletter-db --output=backup.sql --remote
```

### R2 存储
```bash
# 查看存储桶列表
wrangler r2 bucket list

# 查看存储桶内容
wrangler r2 object list newsletter-assets

# 上传文件
wrangler r2 object put newsletter-assets/test.txt --file=./test.txt

# 下载文件
wrangler r2 object get newsletter-assets/test.txt --file=./downloaded.txt
```

### Pages 部署
```bash
# 查看部署列表
wrangler pages deployment list --project-name=newsletter-app

# 查看实时日志
wrangler pages deployment tail --project-name=newsletter-app

# 回滚到之前的部署
wrangler pages deployment rollback --project-name=newsletter-app
```

## 参考文档

- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [D1 数据库](https://developers.cloudflare.com/d1/)
- [R2 存储](https://developers.cloudflare.com/r2/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
