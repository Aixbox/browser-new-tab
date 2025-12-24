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

## 密钥认证（可选）

为了保护你的个性化设置（如头像、布局等），可以设置访问密钥。

### 设置密钥

#### 方法 1: 通过 Cloudflare Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → 选择你的项目 `new-tab`
3. 进入 **Settings** → **Environment variables**
4. 点击 **Add variable**：
   - Variable name: `SECRET_KEY`
   - Value: 你的密钥（建议使用 UUID）
   - Environment: `Production` (或 `Preview` 用于测试)
5. 点击 **Save**

#### 方法 2: 通过命令行

```bash
# 设置环境变量
wrangler pages secret put SECRET_KEY --project-name new-tab
# 然后输入你的密钥（建议使用 UUID）
```

#### 如何生成 UUID 密钥

**使用 Node.js:**
```bash
node -e "console.log(crypto.randomUUID());"
```

**使用在线工具:**
- 访问 https://www.uuidgenerator.net/
- 复制生成的 UUID

**使用浏览器控制台:**
```javascript
crypto.randomUUID()
```

### 使用密钥

- 首次访问网站时，会提示输入密钥
- 输入正确的密钥后，会保存在浏览器 localStorage 中
- 下次访问时会自动验证，无需重复输入
- 如果更换浏览器或清除缓存，需要重新输入密钥

### 修改密钥

1. 生成新的 UUID 密钥
2. 在 Cloudflare Dashboard 中更新 `SECRET_KEY` 环境变量
3. 所有用户需要使用新密钥重新验证

### 移除密钥保护

在 Cloudflare Dashboard 中删除 `SECRET_KEY` 环境变量，或使用命令行：
```bash
wrangler pages secret delete SECRET_KEY --project-name new-tab
```

### 修改密钥

1. 在 GitHub Secrets 中更新 `SECRET_KEY`
2. 推送代码触发重新部署
3. 所有用户需要使用新密钥重新验证

### 手动配置密钥哈希

如果不使用 GitHub Actions，可以手动在 Cloudflare Dashboard 中配置：

1. 生成密钥的 SHA-256 哈希：
   ```bash
   # 使用 Node.js
   node -e "const crypto = require('crypto'); console.log(crypto.createHash('sha256').update('your-secret-key').digest('hex'));"
   
   # 或使用 OpenSSL
   echo -n "your-secret-key" | openssl dgst -sha256 -hex | cut -d' ' -f2
   ```

2. 在 Cloudflare Dashboard 中设置环境变量：
   - 进入 Pages 项目 → Settings → Environment variables
   - 添加变量：`SECRET_KEY_HASH` = `<生成的哈希值>`
   - 选择环境：Production (和 Preview，如果需要)

3. 或使用命令行：
   ```bash
   echo "your-hash-here" | wrangler pages secret put SECRET_KEY_HASH --project-name new-tab
   ```

### 移除密钥保护

如果不需要密钥保护：
1. 在 GitHub Secrets 中删除 `SECRET_KEY`
2. 在 Cloudflare Dashboard 中删除环境变量：
   - 进入 Pages 项目 → Settings → Environment variables
   - 删除 `SECRET_KEY_HASH` 变量
   - 或使用命令行：
   ```bash
   wrangler pages secret delete SECRET_KEY_HASH --project-name new-tab
   ```

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
