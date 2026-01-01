# 代码重构说明

## pages/index.tsx 重构

原文件 900+ 行代码已拆分为多个模块，提高可维护性。

### 新增文件结构

```
components/
  ├── drag-overlay-item.tsx      # 拖拽覆盖层图标组件
  └── context-menu.tsx            # 右键菜单组件

hooks/
  ├── use-settings-sync.ts        # 设置同步 Hook
  ├── use-context-menu.ts         # 右键菜单 Hook
  ├── use-sidebar-auto-hide.ts    # 侧边栏自动隐藏 Hook
  └── use-page-wheel-switch.ts    # 滚轮切换页面 Hook（带动画）

lib/
  ├── drag-handlers.ts            # 拖拽处理逻辑（400+ 行）
  └── collision-detection.ts      # 碰撞检测逻辑
```

### 重构后的 pages/index.tsx

- 从 900+ 行减少到约 200 行
- 职责更清晰，只负责组件组合和状态管理
- 所有复杂逻辑都提取到独立模块

### 主要改进

1. **拖拽逻辑分离** - `lib/drag-handlers.ts`
   - 处理所有拖拽事件（onDragStart, onDragOver, onDragEnd）
   - 包含跨页面拖拽、Dock 拖拽、排序等所有逻辑
   - 约 400 行代码独立管理

2. **碰撞检测分离** - `lib/collision-detection.ts`
   - 自定义碰撞检测算法
   - 侧边栏按钮特殊处理

3. **自定义 Hooks**
   - `useSettingsSync` - 监听所有设置变化事件
   - `useContextMenu` - 右键菜单状态管理
   - `useSidebarAutoHide` - 侧边栏自动隐藏逻辑
   - `usePageWheelSwitch` - 滚轮切换页面（带动画效果）

4. **组件提取**
   - `DragOverlayItem` - 拖拽时的图标显示
   - `ContextMenu` - 右键菜单 UI

### 优势

- ✅ 代码更易读、易维护
- ✅ 逻辑分离，职责单一
- ✅ 便于单元测试
- ✅ 便于复用
- ✅ 减少主文件复杂度

### 新功能：滚轮切换页面动画

**功能说明：**
- 在宫格区域上下滚动滚轮可以切换不同页面
- 向上滚动：切换到上一页，动画效果是从上方滑入
- 向下滚动：切换到下一页，动画效果是从下方滑入
- 使用 Framer Motion 实现流畅的过渡动画
- 防抖处理，避免快速滚动导致的问题

**实现细节：**
- `usePageWheelSwitch` Hook 处理滚轮事件和动画状态
- `AnimatePresence` 组件管理页面切换动画
- 动画时长 400ms，使用 ease-in-out 缓动函数
- 只在组件模式下启用，极简模式不受影响
