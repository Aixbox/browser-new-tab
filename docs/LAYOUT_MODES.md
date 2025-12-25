# 布局模式功能

## 功能概述

提供两种布局模式：**组件模式**和**极简模式**，用户可以根据自己的喜好选择不同的页面布局风格。

## 布局模式对比

### 组件模式（默认）

**特点：**
- ✅ 显示侧边栏（左侧）
- ✅ 显示图标网格
- ✅ 显示时间组件
- ✅ 显示搜索框
- ✅ 功能完整，适合日常使用

**布局：**
```
┌─────────────────────────────────────┐
│ [侧边栏]  时间显示                   │
│   头像    搜索框                     │
│   按钮    图标网格                   │
│   按钮    [图标] [图标] [图标]       │
│   按钮    [图标] [图标] [图标]       │
└─────────────────────────────────────┘
```

### 极简模式

**特点：**
- ❌ 隐藏侧边栏
- ❌ 隐藏图标网格
- ✅ 显示时间组件（居中）
- ✅ 显示搜索框（居中）
- ✅ 右上角显示设置按钮
- ✅ 简洁清爽，专注搜索

**布局：**
```
┌─────────────────────────────────────┐
│                              [设置]  │
│                                      │
│            时间显示                   │
│            搜索框                     │
│                                      │
│                                      │
└─────────────────────────────────────┘
```

## 设置位置

**路径：** 设置 → 布局

**界面特点：**
- 卡片式选择界面
- 每个模式都有图标和说明
- 实时预览图
- 功能对比表格
- 选中状态有明显标识

## 数据存储

### KV 存储格式

**Key:** `layout_mode`

**Value:** 字符串
- `"component"` - 组件模式
- `"minimal"` - 极简模式

### 默认值

如果 KV 中没有存储该设置，默认值为 `"component"`（组件模式）

## 实现细节

### 1. 数据流程

#### 读取流程
```
页面加载
    ↓
getServerSideProps 执行
    ↓
从 KV 读取 layout_mode
    ↓
传递给 Home 组件
    ↓
根据模式渲染不同布局
```

#### 写入流程
```
用户选择布局模式
    ↓
LayoutSettings.handleLayoutModeChange()
    ↓
调用 setSetting('layout_mode', mode)
    ↓
POST /api/settings
    ↓
验证密钥 → 写入 KV
    ↓
触发 CustomEvent 'layoutModeChanged'
    ↓
Home 组件监听事件并更新布局
```

### 2. 组件通信

使用 **CustomEvent** 实现实时切换，无需刷新页面：

```typescript
// 发送事件（LayoutSettings）
window.dispatchEvent(new CustomEvent('layoutModeChanged', { 
  detail: { mode: 'minimal' }
}));

// 监听事件（Home）
useEffect(() => {
  const handleLayoutModeChange = (e: CustomEvent) => {
    if (e.detail?.mode) {
      setCurrentLayoutMode(e.detail.mode);
    }
  };
  
  window.addEventListener('layoutModeChanged', handleLayoutModeChange);
  return () => window.removeEventListener('layoutModeChanged', handleLayoutModeChange);
}, []);
```

### 3. 条件渲染

根据 `currentLayoutMode` 状态条件渲染不同的布局：

```typescript
{currentLayoutMode === 'component' && (
  <>
    <SidebarDemo />
    <div className="pl-16">
      <SimpleTimeDisplay />
      <SearchEngine />
      <DraggableGrid />
    </div>
  </>
)}

{currentLayoutMode === 'minimal' && (
  <div className="flex flex-col items-center justify-center">
    <SimpleTimeDisplay />
    <SearchEngine />
    <button>设置</button>
  </div>
)}
```

## 用户体验

### 即时生效

- ✅ 切换模式后立即生效，无需刷新页面
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

### 场景 1：日常使用（组件模式）
- 需要快速访问常用网站
- 使用侧边栏功能
- 需要完整的功能集

### 场景 2：专注搜索（极简模式）
- 只需要搜索功能
- 喜欢简洁的界面
- 减少视觉干扰

### 场景 3：演示/投屏（极简模式）
- 在大屏幕上展示
- 需要简洁的视觉效果
- 隐藏个人信息（侧边栏头像等）

## 技术特点

### 1. 服务端渲染
- 初始布局模式通过 `getServerSideProps` 从 KV 读取
- 首屏加载即显示正确的布局

### 2. 客户端更新
- 切换模式立即更新本地状态
- 同时保存到 KV
- 触发事件通知页面组件

### 3. 事件驱动
- 使用 CustomEvent 实现松耦合
- 组件间无需直接引用
- 易于扩展

### 4. 响应式设计
- 两种模式都支持响应式布局
- 在不同屏幕尺寸下都有良好体验

## 极简模式特殊处理

### 右键菜单

在极简模式下，由于没有侧边栏，用户可以通过右键点击页面任意位置打开菜单：

```typescript
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  setContextMenuPosition({ x: e.clientX, y: e.clientY });
};

<main onContextMenu={handleContextMenu}>
  {/* 页面内容 */}
</main>
```

**菜单功能：**
- 右键点击页面任意位置显示菜单
- 菜单包含"设置"选项
- 点击"设置"打开设置对话框
- 点击页面其他地方自动关闭菜单

**样式特点：**
- 毛玻璃效果背景
- 跟随鼠标位置显示
- 高 z-index 确保在最上层

### 居中布局

使用 Flexbox 实现完美居中：

```typescript
<div className="h-full w-full flex flex-col items-center justify-center gap-8">
  <SimpleTimeDisplay />
  <SearchEngine />
</div>
```

## 文件修改清单

### 新增文件
1. `components/layout-settings.tsx`
   - 布局模式设置组件
   - 卡片式选择界面
   - 包含预览图和功能对比
   - 实现 `handleLayoutModeChange()` 方法
   - 触发 CustomEvent

### 修改文件
1. `components/settings-drawer.tsx`
   - 导入 `LayoutSettings` 组件
   - 添加 `initialLayoutMode` prop
   - 添加对 `layout` 标签页的处理

2. `pages/index.tsx`
   - 从 KV 读取 `layout_mode`
   - 添加 `layoutMode` 到 props
   - 添加 `currentLayoutMode` 状态
   - 监听 `layoutModeChanged` 事件
   - 根据模式条件渲染不同布局
   - 极简模式添加设置按钮

## 未来改进

1. **更多布局模式**
   - 紧凑模式：更小的间距和组件
   - 宽屏模式：针对超宽屏幕优化
   - 自定义模式：用户自定义显示哪些组件

2. **动画过渡**
   - 切换模式时添加平滑过渡动画
   - 组件淡入淡出效果

3. **自动切换**
   - 根据时间自动切换（白天/夜晚）
   - 根据屏幕尺寸自动切换

4. **布局预设**
   - 保存多个自定义布局
   - 快速切换预设

5. **组件位置自定义**
   - 拖拽调整组件位置
   - 自定义组件大小
