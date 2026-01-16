# 多页面宫格功能说明

## 功能概述

项目已实现多页面宫格系统，每个侧边栏按钮对应一个独立的宫格页面，Dock 栏在所有页面间共享。

## 核心功能

### 1. 侧边栏按钮切换页面
- 点击侧边栏中的不同按钮可以切换到不同的宫格页面
- 每个按钮对应一个独立的宫格，图标数据互不影响
- 当前选中的按钮会有高亮显示

### 2. 独立的宫格数据
- 每个页面的宫格图标数据独立存储
- 在不同页面添加、编辑、删除图标互不影响
- 数据结构：`{ pageId: IconItem[] }`

### 3. 全局共享的 Dock 栏
- Dock 栏在所有页面保持一致
- 无论切换到哪个页面，Dock 栏显示的图标都相同
- Dock 栏数据独立存储

### 4. 拖拽逻辑
- **从宫格拖到 Dock**：
  - 图标会添加到 Dock 栏
  - 图标会从当前页面的宫格中移除
  - 切换到其他页面，Dock 栏中的图标依然存在

- **从 Dock 拖回宫格**：
  - 图标会添加到当前页面的宫格中
  - 图标会从 Dock 栏中移除
  - 只会添加到当前选中的页面

- **宫格内部排序**：
  - 在同一个宫格内拖动图标可以调整顺序
  - 不会影响其他页面的图标

- **Dock 内部排序**：
  - 在 Dock 栏内拖动图标可以调整顺序
  - 所有页面看到的 Dock 顺序都会同步更新

## 数据存储

### KV 存储键
- `page_grid_items`: 存储所有页面的宫格数据
  ```json
  {
    "page1": [{ id: "1", name: "Google", ... }],
    "page2": [{ id: "2", name: "GitHub", ... }]
  }
  ```

- `dock_items`: 存储 Dock 栏数据
  ```json
  [{ id: "3", name: "YouTube", ... }]
  ```

## 技术实现

### 状态管理
- `currentPageId`: 当前选中的页面 ID（对应侧边栏按钮 ID）
- `pageGridItems`: 所有页面的宫格数据映射
- `dockItems`: Dock 栏图标数组

### 组件通信
- 侧边栏按钮点击 → 触发 `onPageChange(pageId)` → 更新 `currentPageId`
- 宫格数据变化 → 触发 `onItemsChange(items)` → 更新对应页面数据
- Dock 数据变化 → 触发 `onItemsChange(items)` → 更新全局 Dock 数据

### 拖拽处理
```typescript
// 从宫格拖到 Dock
if (over?.id === 'dock-droppable' && draggedFromGrid) {
  // 1. 添加到 Dock
  setDockItems([...dockItems, draggedFromGrid]);
  
  // 2. 从当前页面宫格移除
  const newGridItems = currentGridItems.filter(item => item.id !== active.id);
  setPageGridItems({ ...pageGridItems, [currentPageId]: newGridItems });
  
  // 3. 保存到 KV
  await setSetting('dock_items', JSON.stringify(newDockItems));
  await setSetting('page_grid_items', JSON.stringify(newPageGridItems));
}

// 从 Dock 拖回宫格
if (over?.id === 'grid-droppable' && draggedFromDock) {
  // 1. 添加到宫格
  const newGridItems = [...currentGridItems, draggedFromDock];
  setPageGridItems({ ...pageGridItems, [currentPageId]: newGridItems });
  
  // 2. 从 Dock 移除
  const newDockItems = dockItems.filter(item => item.id !== active.id);
  setDockItems(newDockItems);
  
  // 3. 保存到 KV
  await setSetting('page_grid_items', JSON.stringify(newPageGridItems));
  await setSetting('dock_items', JSON.stringify(newDockItems));
}

// 宫格内部排序
if (draggedFromGrid && active.id !== over?.id) {
  // 调整宫格内图标顺序
}

// Dock 内部排序
if (draggedFromDock && active.id !== over?.id) {
  // 调整 Dock 内图标顺序
}
```

## 使用流程

1. **添加侧边栏按钮**
   - 点击侧边栏底部的 "+" 按钮
   - 输入按钮名称和选择图标
   - 新按钮会自动创建一个空的宫格页面

2. **切换页面**
   - 点击侧边栏中的任意按钮
   - 宫格区域会显示该页面的图标
   - Dock 栏保持不变

3. **添加图标到宫格**
   - 在当前页面点击宫格中的 "+" 按钮
   - 输入网站信息
   - 图标只会添加到当前页面

4. **移动图标到 Dock**
   - 从宫格拖动图标到底部 Dock 栏
   - 图标会从宫格消失，出现在 Dock 栏
   - 切换到其他页面，Dock 栏中的图标依然存在

5. **从 Dock 拖回宫格**
   - 从 Dock 栏拖动图标到宫格区域
   - 图标会从 Dock 栏消失，添加到当前页面的宫格中
   - 只会添加到当前选中的页面

6. **调整图标顺序**
   - 在宫格内拖动图标可以调整顺序
   - 在 Dock 栏内拖动图标可以调整顺序

## 注意事项

- 初次加载时会自动选中第一个侧边栏按钮
- 删除侧边栏按钮时，对应页面的宫格数据会保留（但无法访问）
- Dock 栏中的图标不会重复添加（通过 ID 判断）
- 所有数据变更都会自动保存到 KV 存储
