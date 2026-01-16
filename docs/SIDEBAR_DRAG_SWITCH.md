# 侧边栏拖拽切换功能

## 功能说明

实现了拖拽图标到侧边栏按钮时自动切换页面的功能。用户可以：

1. 从当前宫格拖动图标
2. 将图标悬浮到侧边栏的其他按钮上
3. 自动切换到对应的宫格页面
4. 将图标放置到目标宫格中

## 技术实现

### 1. 多页面数据管理

- 使用 `pageGridItems` 对象存储多个页面的图标数据：`{ pageId: items[] }`
- 每个侧边栏按钮对应一个独立的宫格页面
- 数据保存到 KV 存储的 `page_grid_items` 键中

### 2. 侧边栏按钮 Droppable

- 每个侧边栏按钮使用 `useDroppable` hook，ID 格式为 `sidebar-button-{pageId}`
- 当拖拽悬浮在按钮上时，按钮会高亮显示（`ring-2 ring-white/50`）

### 3. 拖拽事件处理

- `onDragStart`: 记录正在拖拽的图标 ID
- `onDragOver`: 检测是否悬浮在侧边栏按钮上，如果是则自动切换页面
- `onDragEnd`: 处理图标的最终放置位置

### 4. 页面切换

- 通过 `currentPageId` 状态管理当前显示的页面
- 拖拽悬浮时自动调用 `setCurrentPageId` 切换页面
- DraggableGrid 组件根据 `currentPageId` 显示对应页面的图标

## 主要改动文件

### pages/index.tsx
- 添加 `pageGridItems` 状态管理多页面数据
- 添加 `currentPageId` 状态管理当前页面
- 添加 `dragOverPageId` 状态跟踪拖拽悬浮的页面
- 实现 `handleDragOver` 处理拖拽悬浮事件
- 更新 `handleDragEnd` 支持多页面数据保存
- 更新 SSR 数据加载，支持 `page_grid_items` 格式

### components/custom-sidebar.tsx
- 添加 `currentPageId` prop 用于高亮当前页面按钮
- 新增 `SidebarButton` 组件，使用 `useDroppable` 让按钮可接收拖拽
- 按钮悬浮时显示高亮效果

### components/sidebar-demo.tsx
- 添加 `currentPageId` prop 并传递给 CustomSidebar

## 用户体验

1. **视觉反馈**：拖拽悬浮在按钮上时，按钮会显示白色边框高亮
2. **即时切换**：悬浮即切换，无需等待放下
3. **跨页面拖拽**：可以将图标从一个页面拖到另一个页面
4. **数据持久化**：所有操作自动保存到 KV 存储

## 兼容性

- 向后兼容旧的单页面数据格式（`icon_items`）
- 首次加载时会将旧数据迁移到新格式
- 保持 Dock 功能不变
