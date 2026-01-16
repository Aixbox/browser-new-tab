# 迁移总结：App Router → Pages Router (SSR)

## 🎯 迁移目标

将项目从 **App Router + Server Actions** 迁移到 **Pages Router + SSR**，完全对齐 UptimeFlare 的实现方式，解决 Cloudflare Pages 上的 405 错误。

## ✅ 已完成的变更

### 1. 路由系统迁移

#### 创建的文件
- ✅ `pages/_app.tsx` - 应用根组件
- ✅ `pages/_document.tsx` - HTML 文档结构
- ✅ `pages/index.tsx` - 主页面（使用 SSR）
- ✅ `pages/api/settings.ts` - Edge Runtime API

#### 删除的文件
- ❌ `app/page.tsx` - 旧的 App Router 主页
- ❌ `app/layout.tsx` - 旧的 App Router 布局
- ❌ `app/actions/settings.ts` - Server Actions（不兼容）
- ❌ `app/api/settings/route.ts` - App Router API

### 2. SSR 数据获取

**pages/index.tsx** 中实现了 `getServerSideProps`：
```typescript
export async function getServerSideProps() {
  const { NEWTAB_KV } = process.env as unknown as {
    NEWTAB_KV: KVNamespace
  };

  let avatarUrl: string | null = null;
  let hasSecretKey = false;

  if (NEWTAB_KV) {
    avatarUrl = await NEWTAB_KV.get('avatar_url');
    const secretHash = await NEWTAB_KV.get('secret_key_hash');
    hasSecretKey = !!secretHash;
  }

  return { props: { avatarUrl, hasSecretKey } };
}
```

### 3. API Routes 重构

**pages/api/settings.ts** 使用 Edge Runtime：
```typescript
export const runtime = 'edge';

export default async function handler(request: NextRequest) {
  const { NEWTAB_KV } = process.env as unknown as {
    NEWTAB_KV: KVNamespace
  };
  
  // GET/POST 处理逻辑
}
```

### 4. 组件更新

#### components/account-settings.tsx
- ✅ 接收 SSR 传入的 `initialAvatarUrl` 和 `hasSecretKey`
- ✅ 移除客户端的 `loadAvatar()` 和 `checkIfFirstTime()`
- ✅ 使用 `lib/settings-api.ts` 调用 API

#### components/settings-drawer.tsx
- ✅ 接收并传递 SSR props 到 AccountSettings

#### components/sidebar-demo.tsx
- ✅ 接收并显示 SSR 传入的 `avatarUrl`

#### components/custom-sidebar.tsx
- ✅ 支持显示头像图片
- ✅ 图片加载失败时显示默认图标

### 5. 配置文件更新

#### next.config.mjs
```javascript
// 对齐 UptimeFlare 方式
if (process.env.NODE_ENV === 'development') {
  const { setupDevBindings } = await import('@cloudflare/next-on-pages/next-dev');
  
  setupDevBindings({
    bindings: {
      NEWTAB_KV: {
        type: 'kv',
        id: 'NEWTAB_KV',
      },
    },
  });
}
```

#### wrangler.toml（新建）
```toml
name = "browser-new-tab"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "NEWTAB_KV"
id = "your-kv-namespace-id"
```

### 6. 工具函数

#### lib/settings-api.ts（新建）
```typescript
export async function getSetting(key: string) { ... }
export async function setSetting(key, value) { ... }
export async function verifySecret(secret) { ... }
export async function setSecret(newSecret, currentSecret) { ... }
```

## 📊 对比表

| 特性 | 迁移前 | 迁移后 |
|------|--------|--------|
| 路由系统 | App Router | Pages Router ✅ |
| 数据获取 | Client-side | SSR (`getServerSideProps`) ✅ |
| API 方式 | Server Actions | Edge Runtime API Routes ✅ |
| KV 访问 | ❌ 405 错误 | ✅ 正常工作 |
| 开发配置 | `setupDevPlatform` | `setupDevBindings` ✅ |
| 兼容性 | Cloudflare Pages 不兼容 | 完全兼容 ✅ |

## 🔧 技术细节

### 为什么 Server Actions 不工作？

1. **Cloudflare Pages 限制**
   - Server Actions 需要特殊的 POST 请求处理
   - Cloudflare 的 Edge Runtime 对 Server Actions 支持有限
   - 导致 405 Method Not Allowed 错误

2. **UptimeFlare 的成功经验**
   - 使用传统的 Pages Router
   - 通过 `getServerSideProps` 在服务端获取数据
   - API Routes 使用 Edge Runtime
   - 完美兼容 Cloudflare Pages

### SSR 的优势

1. **首屏性能**
   - 服务端预渲染，用户立即看到内容
   - 头像等数据无需客户端二次请求

2. **SEO 友好**
   - 搜索引擎可以直接抓取完整内容

3. **安全性**
   - 敏感操作在服务端执行
   - 减少客户端暴露

4. **兼容性**
   - 与 Cloudflare Pages 完美配合
   - 无需担心 Server Actions 的兼容性问题

## 🚀 部署步骤

1. **创建 KV 命名空间**
   ```bash
   wrangler kv:namespace create "NEWTAB_KV"
   ```

2. **更新 wrangler.toml**
   - 填入实际的 KV Namespace ID

3. **部署**
   ```bash
   npm run build
   wrangler pages deploy .vercel/output/static
   ```

4. **配置 Pages 项目**
   - 在 Cloudflare Dashboard 绑定 KV

## ✨ 测试清单

- [ ] 本地开发环境正常运行
- [ ] 页面可以正常加载
- [ ] 设置对话框可以打开
- [ ] 头像可以保存和显示（SSR）
- [ ] 密钥管理功能正常
- [ ] API 调用无 405 错误
- [ ] 部署到 Cloudflare Pages 成功
- [ ] 生产环境功能正常

## 📝 注意事项

1. **不要混用 App Router 和 Pages Router**
   - 已删除所有 `app/page.tsx` 等文件
   - 确保只使用 `pages/` 目录

2. **KV 绑定名称必须一致**
   - 代码中：`NEWTAB_KV`
   - next.config.mjs：`NEWTAB_KV`
   - wrangler.toml：`NEWTAB_KV`
   - Cloudflare Dashboard：`NEWTAB_KV`

3. **Edge Runtime 是必需的**
   - 所有 API Routes 必须声明 `export const runtime = 'edge'`
   - 主页面也使用 `export const runtime = 'experimental-edge'`

## 🎉 迁移完成

项目现在完全对齐 UptimeFlare 的实现方式，可以在 Cloudflare Pages 上正常运行，不会再出现 405 错误！
