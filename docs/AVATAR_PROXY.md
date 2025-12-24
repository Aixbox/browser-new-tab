# 头像图片代理功能

## 功能概述

头像加载失败时会自动使用图片代理 API (`/api/icon`) 进行重试，提高头像加载成功率。

## 实现位置

### 1. 侧边栏头像 (`components/custom-sidebar.tsx`)

**工作流程：**
1. 首次尝试直接加载用户提供的头像 URL
2. 如果加载失败（403、404 等），`onError` 事件触发
3. 自动切换到代理 URL：`/api/icon?url=${encodeURIComponent(avatarUrl)}`
4. 使用 `key` 属性强制 React 重新创建 `img` 元素，确保 `onError` 正确触发
5. 如果代理也失败，显示默认的 PersonIcon 图标

**状态管理：**
- `avatarError`: 标记头像是否加载失败
- `useProxy`: 标记是否使用代理
- 当 `avatarUrl` 改变时，自动重置这两个状态
- 使用 `key={useProxy ? 'proxy' : 'direct'}` 确保切换时重新创建元素

### 2. 设置页面头像 (`components/account-settings.tsx`)

**Avatar 组件：**
- 同样实现了两级加载机制
- 直接加载 → 代理加载 → 默认图标
- 使用 `key` 属性确保状态切换时正确重新渲染
- 当 `src` prop 改变时，通过 `useEffect` 重置状态

## 图片代理 API

**端点：** `/api/icon`

**参数：**
- `url`: 要代理的图片 URL（需要 URL 编码）

**功能：**
- 支持的图片格式：`.ico`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- 设置浏览器 User-Agent 模拟真实请求
- 5 秒超时保护
- 缓存控制：24 小时缓存，7 天 stale-while-revalidate
- CORS 支持

**安全限制：**
- 只允许图片类型的文件
- 验证 Content-Type 必须是 `image/*`
- 路径必须包含图标相关关键词（favicon, icon 等）

## 使用场景

1. **跨域图片加载**
   - 某些网站的图片有 CORS 限制
   - 通过代理可以绕过这些限制

2. **防盗链保护**
   - 某些图片服务器检查 Referer
   - 代理请求可以避免这个问题

3. **网络问题**
   - 用户网络无法直接访问某些图片服务器
   - 通过 Cloudflare 代理可能成功

## 性能优化

- 只在加载失败时才使用代理，避免不必要的代理请求
- 代理响应设置了合理的缓存策略
- 使用 Cloudflare Edge Runtime，全球加速

## 错误处理

- 直接加载失败 → 自动尝试代理
- 代理加载失败 → 显示默认图标
- 用户体验平滑，无需手动干预

## 技术细节

### 为什么需要 `key` 属性？

当图片加载失败时，我们改变 `useProxy` 状态来切换 URL。但是 React 可能会复用同一个 `img` DOM 元素，只是更新它的 `src` 属性。这可能导致：

1. 浏览器缓存了失败的请求，不会重新尝试
2. `onError` 事件可能不会再次触发

通过添加 `key={useProxy ? 'proxy' : 'direct'}`，我们强制 React 在切换代理时销毁旧的 `img` 元素并创建新的，确保：

- 浏览器会发起新的请求
- `onError` 事件会正确绑定和触发
- 状态转换更加可靠

### 状态重置

使用 `useEffect` 监听 `avatarUrl` 或 `src` 的变化，当用户更换头像时自动重置 `useProxy` 和 `avatarError` 状态，确保新头像从直接加载开始尝试。
