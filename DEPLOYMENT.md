# 部署指南

本项目已迁移到 **Pages Router + SSR**，完全对齐 UptimeFlare 的实现方式。

## 架构变更

### 之前（App Router + Server Actions）
- ❌ 使用 App Router (`app/` 目录)
- ❌ 使用 Server Actions (`'use server'`)
- ❌ 在 Cloudflare Pages 上遇到 405 错误

### 现在（Pages Router + SSR）
- ✅ 使用 Pages Router (`pages/` 目录)
- ✅ 使用 `getServerSideProps` (SSR)
- ✅ 使用 Edge Runtime API Routes
- ✅ 完全兼容 Cloudflare Pages

## 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

开发服务器会自动配置本地 KV 存储（通过 `setupDevBindings`）。

## Cloudflare Pages 部署

### 1. 创建 KV 命名空间

在 Cloudflare Dashboard 中：
1. 进入 **Workers & Pages** > **KV**
2. 点击 **Create a namespace**
3. 命名为 `NEWTAB_KV`
4. 复制生成的 **Namespace ID**

### 2. 配置 wrangler.toml

将 `wrangler.toml` 中的 KV ID 替换为你的实际 ID：

```toml
[[kv_namespaces]]
binding = "NEWTAB_KV"
id = "your-actual-kv-namespace-id"  # 替换这里
```

### 3. 部署到 Cloudflare Pages

#### 方法 A: 使用 Wrangler CLI
```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy .vercel/output/static
```

#### 方法 B: 通过 Git 集成
1. 将代码推送到 GitHub
2. 在 Cloudflare Dashboard 中创建 Pages 项目
3. 连接 GitHub 仓库
4. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `.vercel/output/static`
5. 在 **Settings** > **Functions** > **KV namespace bindings** 中添加：
   - **Variable name**: `NEWTAB_KV`
   - **KV namespace**: 选择你创建的 KV

### 4. 验证部署

访问你的 Cloudflare Pages URL，检查：
- ✅ 页面正常加载
- ✅ 设置对话框可以打开
- ✅ 头像可以保存和显示
- ✅ 密钥管理功能正常
- ✅ 没有 405 错误

## 关键文件说明

### SSR 相关
- `pages/index.tsx` - 主页面，使用 `getServerSideProps` 从 KV 读取数据
- `pages/_app.tsx` - 应用根组件
- `pages/_document.tsx` - HTML 文档结构

### API 相关
- `pages/api/settings.ts` - Edge Runtime API，处理 KV 读写
- `lib/settings-api.ts` - 客户端 API 调用函数

### 配置文件
- `next.config.mjs` - Next.js 配置，使用 `setupDevBindings`
- `wrangler.toml` - Cloudflare 部署配置

## 与 UptimeFlare 的对齐

| 特性 | UptimeFlare | 本项目 | 状态 |
|------|-------------|--------|------|
| 路由系统 | Pages Router | Pages Router | ✅ |
| 数据获取 | `getServerSideProps` | `getServerSideProps` | ✅ |
| Runtime | `experimental-edge` | `experimental-edge` | ✅ |
| KV 访问 | `process.env.UPTIMEFLARE_STATE` | `process.env.NEWTAB_KV` | ✅ |
| 开发配置 | `setupDevBindings` | `setupDevBindings` | ✅ |
| API Routes | Edge Runtime | Edge Runtime | ✅ |

## 故障排查

### 问题：本地开发时 KV 不可用
**解决**：确保 `next.config.mjs` 中的 `setupDevBindings` 配置正确。

### 问题：部署后 405 错误
**解决**：检查 Cloudflare Pages 的 KV 绑定是否正确配置。

### 问题：头像不显示
**解决**：
1. 检查 KV 中是否有 `avatar_url` 键
2. 确保图片 URL 可访问
3. 查看浏览器控制台的错误信息

## 环境变量

本项目不需要额外的环境变量，所有配置通过 KV 绑定完成。

## 性能优化

- ✅ 使用 Edge Runtime，全球低延迟
- ✅ SSR 预渲染，首屏加载快
- ✅ KV 存储，读写速度快
- ✅ 静态资源 CDN 分发

## 安全性

- ✅ 密钥使用 SHA-256 哈希存储
- ✅ 不在客户端暴露敏感信息
- ✅ API 路由在 Edge Runtime 执行
- ✅ 支持密码保护功能

## 后续优化建议

1. 添加 Redis 缓存层（可选）
2. 实现更多设置选项
3. 添加数据导入/导出功能
4. 支持多用户（如果需要）
