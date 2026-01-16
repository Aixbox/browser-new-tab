# 数据同步机制说明

## 概述

实现了基于时间戳的数据同步机制，可以在多个设备/浏览器之间同步数据，并且只在数据变化时才重新加载，减少不必要的数据传输。

## 工作原理

### 1. 时间戳对象 (SyncTimestamps)

每个可修改的数据字段都有一个对应的时间戳：

```typescript
{
  account: 1234567890,        // 账号（头像）
  openMethod: 1234567890,     // 打开方式
  icon: 1234567890,           // 图标样式
  timeDate: 1234567890,       // 时间和日期（预留）
  theme: 1234567890,          // 主题（背景）
  layout: 1234567890,         // 布局模式
  sidebar: 1234567890,        // 侧边栏设置
  sidebarButtons: 1234567890, // 侧边栏按钮
  gridIcons: 1234567890,      // 宫格图标数据
  dockIcons: 1234567890,      // Dock栏图标数据
  searchEngines: 1234567890,  // 搜索引擎数据
}
```

### 2. 数据存储

- **Cloudflare KV**: 存储所有数据和同步时间戳对象
- **LocalStorage**: 缓存数据和时间戳对象

### 3. 同步流程

```
页面加载
  ↓
1. 从 localStorage 读取本地时间戳
  ↓
2. 从 KV 获取远程时间戳 (GET /api/sync-timestamps)
  ↓
3. 比较本地和远程时间戳
  ↓
4. 如果有差异，获取变化的数据 (GET /api/sync-data?fields=xxx)
  ↓
5. 更新本地数据和时间戳
  ↓
6. 触发 UI 更新或刷新页面
```

### 4. 数据修改流程

```
用户修改数据
  ↓
1. 保存数据到 KV (POST /api/settings)
  ↓
2. 更新对应字段的时间戳 (POST /api/sync-timestamps)
  ↓
3. 同时更新本地缓存的时间戳
```

## 核心文件

### 1. `lib/sync-manager.ts`
- 时间戳类型定义
- 本地存储管理
- 时间戳比较逻辑
- 字段到 KV key 的映射

### 2. `hooks/use-data-sync.ts`
- 数据同步 Hook
- 在页面加载时自动检查更新
- `updateRemoteTimestamp()` - 更新远程时间戳的辅助函数

### 3. `pages/api/sync-timestamps.ts`
- GET: 获取同步时间戳对象
- POST: 更新同步时间戳对象

### 4. `pages/api/sync-data.ts`
- GET: 按需获取指定字段的数据
- 支持批量获取多个字段

### 5. `lib/settings-api.ts`
- 修改了 `setSetting()` 和 `saveSidebarItems()`
- 保存数据时自动更新对应字段的时间戳

## 使用示例

### 在组件中使用数据同步

```typescript
// pages/index.tsx
import { useDataSync } from '@/hooks/use-data-sync';

// 在组件中
useDataSync((field, data) => {
  switch (field) {
    case 'icon':
      setCurrentIconStyle(data);
      break;
    case 'theme':
      setCurrentBackgroundUrl(data);
      break;
    // ... 其他字段
  }
});
```

### 保存数据时更新时间戳

```typescript
// 方式1: 使用 setSetting (自动更新时间戳)
import { setSetting } from '@/lib/settings-api';
await setSetting('icon_style', JSON.stringify(newStyle));

// 方式2: 手动更新时间戳
import { updateRemoteTimestamp } from '@/hooks/use-data-sync';
await fetch('/api/settings', { /* ... */ });
await updateRemoteTimestamp('gridIcons');
```

## 字段映射表

| 同步字段 | KV Key | 说明 |
|---------|--------|------|
| account | avatar_url | 头像 |
| openMethod | open_in_new_tab | 打开方式 |
| icon | icon_style | 图标样式 |
| timeDate | time_date_settings | 时间日期（预留） |
| theme | background_url | 背景 |
| layout | layout_mode | 布局模式 |
| sidebar | sidebar_settings | 侧边栏设置 |
| sidebarButtons | sidebar_items | 侧边栏按钮 |
| gridIcons | page_grid_items | 宫格图标 |
| dockIcons | dock_items | Dock图标 |
| searchEngines | search_engines, selected_engine | 搜索引擎 |

## 优势

1. **减少数据传输**: 只在数据变化时才重新加载
2. **多设备同步**: 在不同设备/浏览器之间自动同步数据
3. **本地缓存**: 使用 localStorage 缓存，提高加载速度
4. **按需加载**: 只加载变化的数据，不是全部重新加载
5. **自动化**: 保存数据时自动更新时间戳，无需手动管理

## 注意事项

1. **时间戳精度**: 使用毫秒级时间戳 (`Date.now()`)
2. **时区问题**: 时间戳是 UTC 时间，不受时区影响
3. **并发问题**: 如果多个设备同时修改，以最后修改的为准
4. **刷新策略**: 某些数据更新后需要刷新页面（如侧边栏按钮、图标数据）
5. **错误处理**: 网络错误时会在控制台输出日志，不影响页面使用

## 调试

在浏览器控制台可以看到同步日志：

```
[Sync] Checking for updates...
[Sync] Fields need update: ['icon', 'theme']
[Sync] Updating icon: {...}
[Sync] Updating theme: "https://..."
[Sync] Sync completed
```

查看本地缓存的时间戳：

```javascript
localStorage.getItem('newtab_sync_timestamps')
```

## 未来扩展

- 添加冲突解决机制
- 支持增量同步（只传输变化的部分）
- 添加同步状态指示器
- 支持手动触发同步
