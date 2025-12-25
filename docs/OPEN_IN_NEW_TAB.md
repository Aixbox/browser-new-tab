# 新标签页打开设置

## 功能概述

用户可以在设置中控制搜索结果和图标是否在新标签页中打开，提供更灵活的浏览体验。

## 设置位置

**路径：** 设置 → 打开方式

**两个开关：**
1. **新标签页中打开搜索结果** - 控制搜索引擎的搜索结果打开方式
2. **新标签页中打开图标** - 控制拖拽网格中图标的打开方式

**默认值：** 两个开关默认都是开启状态（在新标签页打开）

**界面特点：**
- 独立的设置页面，在左侧导航栏中
- 每个选项都有详细的说明文字
- 开关切换后立即生效
- 有提示信息说明无需刷新页面

## 数据存储

### KV 存储格式

**Key:** `open_in_new_tab`

**Value:** JSON 字符串
```json
{
  "search": true,
  "icon": true
}
```

### 默认行为

如果 KV 中没有存储该设置，默认值为：
```typescript
{
  search: true,  // 搜索结果在新标签页打开
  icon: true     // 图标在新标签页打开
}
```

## 实现细节

### 1. 数据流程

#### 读取流程
```
页面加载
    ↓
getServerSideProps 执行
    ↓
从 KV 读取 open_in_new_tab
    ↓
解析 JSON 并设置默认值
    ↓
传递给 Home 组件
    ↓
分发给 SearchEngine 和 DraggableGrid
```

#### 写入流程
```
用户切换开关
    ↓
AccountSettings.handleSaveOpenInNewTab()
    ↓
调用 setSetting('open_in_new_tab', JSON.stringify(settings))
    ↓
POST /api/settings
    ↓
验证密钥 → 写入 KV
    ↓
触发 CustomEvent 'openInNewTabChanged'
    ↓
SearchEngine 和 DraggableGrid 监听事件并更新状态
```

### 2. 组件通信

使用 **CustomEvent** 实现组件间通信，无需刷新页面即可生效：

```typescript
// 发送事件（AccountSettings）
window.dispatchEvent(new CustomEvent('openInNewTabChanged', { 
  detail: { search: true, icon: false }
}));

// 监听事件（SearchEngine / DraggableGrid）
useEffect(() => {
  const handleSettingsChange = (e: CustomEvent) => {
    if (e.detail?.search !== undefined) {
      setOpenInNewTab(e.detail.search);
    }
  };
  
  window.addEventListener('openInNewTabChanged', handleSettingsChange);
  return () => window.removeEventListener('openInNewTabChanged', handleSettingsChange);
}, []);
```

### 3. 打开方式实现

#### SearchEngine 组件
```typescript
const handleSubmit = (e: React.FormEvent) => {
  // ...
  const target = openInNewTab ? '_blank' : '_self';
  window.open(searchUrl, target);
};
```

#### DraggableGrid 组件
```typescript
const handleClick = () => {
  const target = openInNewTab ? '_blank' : '_self';
  window.open(item.url, target);
};
```

## 用户体验

### 即时生效

- ✅ 切换开关后立即生效，无需刷新页面
- ✅ 使用 CustomEvent 实现实时通信
- ✅ 设置自动保存到 KV

### 跨设备同步

- ✅ 设置保存在 KV 中
- ✅ 刷新页面后从 KV 加载
- ✅ 跨设备/浏览器同步

### 安全性

- ✅ 写入需要密钥验证
- ✅ 读取无需验证（通过 SSR）

## 使用场景

### 场景 1：在新标签页打开（默认）
- 搜索结果在新标签页打开
- 图标在新标签页打开
- 不会离开当前页面

### 场景 2：在当前标签页打开
- 搜索结果替换当前页面
- 图标替换当前页面
- 适合想要快速导航的用户

### 场景 3：混合模式
- 搜索结果在新标签页打开
- 图标在当前标签页打开
- 或反之

## 技术特点

### 1. 服务端渲染
- 初始值通过 `getServerSideProps` 从 KV 读取
- 首屏加载即有正确的设置

### 2. 客户端更新
- 切换开关立即更新本地状态
- 同时保存到 KV
- 触发事件通知其他组件

### 3. 事件驱动
- 使用 CustomEvent 实现松耦合
- 组件间无需直接引用
- 易于扩展

## 文件修改清单

### 新增文件
1. `components/open-method-settings.tsx`
   - 独立的打开方式设置组件
   - 包含两个开关和密钥验证逻辑
   - 实现 `handleSaveOpenInNewTab()` 方法
   - 触发 CustomEvent

### 修改文件
1. `components/account-settings.tsx`
   - 移除打开方式设置（已移到独立页面）
   - 只保留头像设置

2. `components/settings-drawer.tsx`
   - 导入 `OpenMethodSettings` 组件
   - 添加对 `openMethod` 标签页的处理
   - 传递 `initialOpenInNewTab` 给 `OpenMethodSettings`

3. `pages/index.tsx`
   - 从 KV 读取 `open_in_new_tab`
   - 传递给 SearchEngine 和 DraggableGrid

4. `components/search-engine.tsx`
   - 接收 `openInNewTab` prop
   - 监听 CustomEvent
   - 根据设置决定打开方式

5. `components/draggable-grid.tsx`
   - 接收 `openInNewTab` prop
   - 监听 CustomEvent
   - 根据设置决定打开方式

## 未来改进

1. **添加更多打开方式选项**
   - 在新窗口打开
   - 在后台标签页打开
   - 在侧边栏打开

2. **按域名自定义**
   - 某些网站在新标签页打开
   - 某些网站在当前标签页打开

3. **快捷键支持**
   - Ctrl/Cmd + Click 强制在新标签页打开
   - Shift + Click 强制在当前标签页打开

4. **统计功能**
   - 记录用户最常用的打开方式
   - 智能推荐设置
