# 密钥认证系统迁移说明

## 概述

已将密钥管理从客户端设置迁移到 GitHub Secrets + Cloudflare 环境变量的认证系统，类似于 UptimeFlare 的架构。

## 最新更新（环境变量方式）

密钥现在直接存储在 Cloudflare Pages 环境变量中（明文 UUID），而不是 KV 存储或哈希值。这大大简化了配置。

**重要变更**: 
- 用户需要直接在 Cloudflare Dashboard 中设置 `SECRET_KEY` 环境变量
- 不再使用 SHA-256 哈希，直接使用 UUID 作为密钥
- 不再通过 GitHub Secrets 自动部署

## 主要变更

### 1. 新增文件

- **`components/secret-input.tsx`**: 密钥输入组件
  - 首次访问时显示密钥输入界面
  - 验证密钥并保存到 localStorage
  - 支持密码显示/隐藏切换

- **`pages/api/verify-secret.ts`**: 密钥验证 API
  - 接收用户输入的密钥
  - 与环境变量 `SECRET_KEY` 中存储的密钥直接比对
  - 返回验证结果

### 2. 修改文件

#### `pages/index.tsx`
- 添加密钥验证逻辑
- 在 SSR 中检查 `SECRET_KEY` 环境变量是否存在
- 首次访问检查 localStorage 中的密钥
- 未验证时显示 `SecretInput` 组件
- 验证通过后才显示主界面

#### `components/account-settings.tsx`
- **删除**整个密钥管理 UI 部分
- 只保留头像设置功能
- 移除所有密钥相关的状态和函数

#### `components/settings-drawer.tsx`
- 移除 `hasSecretKey` prop
- 简化 `AccountSettings` 组件调用

#### `pages/api/settings.ts`
- **删除** `verifySecret` 和 `setSecret` actions
- 只保留 `setSetting` 和 `getSetting` 功能
- 移除密码哈希函数

#### `lib/settings-api.ts`
- **删除** `verifySecret()` 和 `setSecret()` 函数
- 只保留 `getSetting()` 和 `setSetting()` 函数

#### `.github/workflows/deploy.yml`
- 移除了自动设置密钥的逻辑
- 只负责构建和部署代码
- 用户需要手动在 Cloudflare Dashboard 中设置 `SECRET_KEY`

#### `docs/CLOUDFLARE_DEPLOY.md`
- 添加 `SECRET_KEY` 配置说明
- 新增"密钥认证"章节
- 说明如何设置、使用、修改和移除密钥

## 工作流程

### 部署流程

1. 部署代码到 Cloudflare Pages（通过 GitHub Actions）
2. 用户在 Cloudflare Dashboard 中手动设置 `SECRET_KEY` 环境变量：
   - 进入 Workers & Pages → 项目 → Settings → Environment variables
   - 添加 `SECRET_KEY` 变量，值为 UUID 密钥
3. 环境变量立即生效（无需重新部署）

### 用户访问流程

1. 用户首次访问网站
2. SSR 检查环境变量 `SECRET_KEY` 是否存在
   - 如果没有：直接允许访问（未设置密钥）
   - 如果有：继续验证流程
3. 检查 localStorage 中是否有 `secret_key`
   - 如果有：验证密钥是否正确
     - 正确：允许访问
     - 错误：清除 localStorage，显示输入界面
   - 如果没有：显示密钥输入界面
4. 用户输入密钥
5. 与环境变量中的密钥直接比对
   - 匹配：保存到 localStorage，允许访问
   - 不匹配：显示错误提示

## 安全特性

1. **环境变量存储**: 密钥存储在 Cloudflare 环境变量中，不暴露在代码中
2. **客户端缓存**: 验证通过后密钥保存在 localStorage，避免重复输入
3. **服务端验证**: 密钥验证在 Edge Runtime 中进行，环境变量不暴露给客户端
4. **简单配置**: 使用 UUID 作为密钥，无需复杂的哈希计算
5. **即时生效**: 修改环境变量后立即生效，无需重新部署

## 使用说明

### 设置密钥

**方法 1: Cloudflare Dashboard**
1. 登录 Cloudflare Dashboard
2. Workers & Pages → 选择项目 → Settings → Environment variables
3. 添加变量：
   - Name: `SECRET_KEY`
   - Value: 你的密钥（建议使用 UUID）

**方法 2: 命令行**
```bash
# 生成 UUID
node -e "console.log(crypto.randomUUID());"

# 设置环境变量
wrangler pages secret put SECRET_KEY --project-name new-tab
```

### 验证密钥

访问网站时输入设置的密钥即可。

### 修改密钥

1. 生成新的 UUID 密钥
2. 在 Cloudflare Dashboard 中更新 `SECRET_KEY` 环境变量
3. 所有用户需要使用新密钥重新验证

### 移除密钥保护

在 Cloudflare Dashboard 中删除 `SECRET_KEY` 环境变量，或：
```bash
wrangler pages secret delete SECRET_KEY --project-name new-tab
```

## 技术细节

### 环境变量

- `SECRET_KEY`: 密钥（建议使用 UUID，36 字符）

### KV 存储结构

- `avatar_url`: 用户头像 URL
- 其他设置...

### API 端点

- `POST /api/verify-secret`: 验证密钥
  - 请求: `{ secret: string }`
  - 响应: `{ verified: boolean, isFirstTime?: boolean }`

## 迁移影响

### 对现有用户的影响

1. **首次部署后**: 如果未设置 `SECRET_KEY`，用户可以直接访问（向后兼容）
2. **设置密钥后**: 所有用户需要输入密钥才能访问
3. **已保存的设置**: 不受影响，仍然保存在 KV 中

### 对开发的影响

1. **本地开发**: 需要在 `next.config.mjs` 中配置本地 KV（已配置）
2. **测试**: 可以不设置密钥进行测试，或在本地环境变量中设置 `SECRET_KEY`

## 注意事项

1. **密钥强度**: 建议使用强密钥（随机字符串或 UUID）
2. **密钥保管**: 密钥只存在于 GitHub Secrets 和用户的 localStorage 中
3. **浏览器兼容性**: 使用 Web Crypto API，需要现代浏览器支持
4. **清除缓存**: 用户清除浏览器缓存后需要重新输入密钥

## 后续优化建议

1. 添加密钥重置功能（通过邮箱或其他方式）
2. 支持多用户（每个用户独立的密钥和设置）
3. 添加密钥过期机制
4. 支持 2FA 双因素认证
