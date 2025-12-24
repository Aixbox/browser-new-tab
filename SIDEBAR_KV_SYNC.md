# 侧边栏 KV 存储同步功能

## 功能概述

侧边栏按钮现在会自动同步到 Cloudflare Workers KV 存储，实现跨设备/浏览器的数据持久化。

## 实现细节

### 1. 数据流程

```
用户操作（添加/编辑/删除按钮）
    ↓
CustomSidebar 组件触发 onItemsChange
    ↓
SidebarDemo 调用 saveSidebarItems()
    ↓
API Route: /api/settings (POST)
    ↓
验证密钥 → 写入 KV
    ↓
返回成功/失败
    ↓
显示 Toast 通知
```

### 2. 页面加载流程

```
用户访问页面
    ↓
getServerSideProps 执行
    ↓
从 KV 读取 sidebar_items
    ↓
传递给 Home 组件
    ↓
SidebarDemo 接收 initialSidebarItems
    ↓
渲染侧边栏
```

## 新增/修改的文件

### 1. `lib/settings-api.ts`
新增两个函数：
- `getSidebarItems()`: 获取侧边栏按钮配置
- `saveSidebarItems(items)`: 保存侧边栏按钮配置

### 2. `pages/index.tsx`
- 添加 `sidebarItems` 到 props
- 在 `getServerSideProps` 中从 KV 读取 `sidebar_items`
- 传递给 `SidebarDemo` 组件

### 3. `components/sidebar-demo.tsx`
- 接收 `initialSidebarItems` prop
- 在 `handleItemsChange` 中调用 `saveSidebarItems()`
- 添加错误处理和 Toast 通知

## 使用方法

### 用户操作

1. **添加按钮**
   - 点击侧边栏底部的 "+" 按钮
   - 输入标题和选择图标
   - 点击"添加"
   - 自动同步到 KV

2. **编辑按钮**
   - 右键点击按钮
   - 选择"编辑"
   - 修改标题或图标
   - 点击"保存"
   - 自动同步到 KV

3. **删除按钮**
   - 右键点击按钮
   - 选择"删除"
   - 自动同步到 KV

### 数据格式

KV 中存储的数据格式：

```json
[
  {
    "id": "1",
    "title": "Home",
    "icon": "home"
  },
  {
    "id": "2",
    "title": "Profile",
    "icon": "profile"
  }
]
```

**注意**: `onClick` 函数不会被保存，因为函数无法序列化。

## 安全性

- 所有写入操作都需要密钥验证
- 密钥存储在 Cloudflare 环境变量中
- 用户需要先验证密钥才能修改侧边栏

## 错误处理

- 保存失败时会显示错误提示
- 自动回滚到之前的状态
- 网络错误会被捕获并显示给用户

## 默认值

如果 KV 中没有数据，会使用默认配置：

```typescript
const defaultItems = [
  { id: "1", title: "Home", icon: "home" },
  { id: "2", title: "Profile", icon: "profile" },
  { id: "3", title: "Settings", icon: "settings" },
];
```

## 测试

1. 添加一个新按钮
2. 刷新页面，确认按钮仍然存在
3. 在另一个浏览器/设备上访问（使用相同密钥）
4. 确认侧边栏配置已同步

## 注意事项

1. **密钥要求**: 修改侧边栏需要先验证密钥
2. **最少按钮数**: 至少保留一个按钮，不能全部删除
3. **数据大小**: KV 单个值最大 25MB，侧边栏配置远小于此限制
4. **同步延迟**: KV 写入是即时的，但跨地域同步可能有几秒延迟
