# Dock 栏双向拖拽功能

## 功能说明

实现了 Dock 栏和宫格之间的双向拖拽功能：
- ✅ 从宫格拖到 Dock（已有）
- ✅ 从 Dock 拖回宫格（新增）
- ✅ 宫格内部排序
- ✅ Dock 内部排序

## 实现细节

### 1. Dock 组件改造

**文件**: `components/dock.tsx`

**关键改动**:
1. 导入 `useSortable` 和 `SortableContext`
2. 让每个 Dock 图标成为可拖拽项
3. 添加 `SortableContext` 包裹 Dock 图标列表

```typescript
// 导入拖拽相关组件
import { useSortable, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

// 在 renderIcon 中使用 useSortable
const {
  attributes,
  listeners,
  setNodeRef: setDraggableNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: item.id });

// 应用拖拽样式和事件
<div 
  ref={setDraggableNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className="cursor-grab active:cursor-grabbing"
>
  {/* 图标内容 */}
</div>

// 使用 SortableContext 包裹
<SortableContext items={items} strategy={rectSortingStrategy}>
  {/* Dock 图标列表 */}
</SortableContext>
```

### 2. 宫格组件改造

**文件**: `components/draggable-grid.tsx`

**关键改动**:
1. 导入 `useDroppable`
2. 让宫格区域成为 droppable
3. 添加视觉反馈（拖拽悬停时高亮）

```typescript
// 导入 droppable
import { useDroppable } from "@dnd-kit/core";

// 让宫格区域成为 droppable
const { setNodeRef: setGridDroppableRef, isOver: isGridOver } = useDroppable({
  id: 'grid-droppable',
});

// 应用到宫格容器
<div className="w-full" ref={setGridDroppableRef}>
  <div 
    className={cn(
      "grid w-full transition-all duration-200",
      isGridOver && "bg-white/5 rounded-lg" // 拖拽悬停时的视觉反馈
    )}
  >
    {/* 宫格图标 */}
  </div>
</div>
```

### 3. 拖拽逻辑处理

**文件**: `pages/index.tsx`

**关键改动**: 在 `handleDragEnd` 中处理四种拖拽场景

#### 场景 1: 从宫格拖到 Dock
```typescript
const draggedFromGrid = currentGridItems.find(item => item.id === active.id);

if (over?.id === 'dock-droppable' && draggedFromGrid) {
  // 检查 Dock 中是否已存在
  if (!dockItems.find(dockItem => dockItem.id === draggedFromGrid.id)) {
    // 添加到 Dock
    const newDockItems = [...dockItems, draggedFromGrid];
    setDockItems(newDockItems);
    
    // 从宫格移除
    const newGridItems = currentGridItems.filter(item => item.id !== active.id);
    setPageGridItems({ ...pageGridItems, [currentPageId]: newGridItems });
    
    // 保存
    await setSetting('dock_items', JSON.stringify(newDockItems));
    await setSetting('page_grid_items', JSON.stringify(newPageGridItems));
  }
}
```

#### 场景 2: 从 Dock 拖回宫格（新增）
```typescript
const draggedFromDock = dockItems.find(item => item.id === active.id);

if (over?.id === 'grid-droppable' && draggedFromDock) {
  // 检查宫格中是否已存在
  if (!currentGridItems.find(item => item.id === draggedFromDock.id)) {
    // 添加到宫格
    const newGridItems = [...currentGridItems, draggedFromDock];
    setPageGridItems({ ...pageGridItems, [currentPageId]: newGridItems });
    
    // 从 Dock 移除
    const newDockItems = dockItems.filter(item => item.id !== active.id);
    setDockItems(newDockItems);
    
    // 保存
    await setSetting('page_grid_items', JSON.stringify(newPageGridItems));
    await setSetting('dock_items', JSON.stringify(newDockItems));
  }
}
```

#### 场景 3: 宫格内部排序
```typescript
if (draggedFromGrid && active.id !== over?.id && over?.id) {
  const oldIndex = currentGridItems.findIndex((item) => item.id === active.id);
  const newIndex = currentGridItems.findIndex((item) => item.id === over.id);
  
  if (oldIndex !== -1 && newIndex !== -1) {
    const newItems = [...currentGridItems];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    
    setPageGridItems({ ...pageGridItems, [currentPageId]: newItems });
    await setSetting('page_grid_items', JSON.stringify(newPageGridItems));
  }
}
```

#### 场景 4: Dock 内部排序（新增）
```typescript
if (draggedFromDock && active.id !== over?.id && over?.id) {
  const oldIndex = dockItems.findIndex((item) => item.id === active.id);
  const newIndex = dockItems.findIndex((item) => item.id === over.id);
  
  if (oldIndex !== -1 && newIndex !== -1) {
    const newItems = [...dockItems];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    
    setDockItems(newItems);
    await setSetting('dock_items', JSON.stringify(newItems));
  }
}
```

## 拖拽判断逻辑

通过判断拖拽源来确定操作类型：

```typescript
const draggedFromDock = dockItems.find(item => item.id === active.id);
const draggedFromGrid = currentGridItems.find(item => item.id === active.id);

// draggedFromDock 存在 → 从 Dock 拖出
// draggedFromGrid 存在 → 从宫格拖出
```

## 防重复逻辑

在添加图标前检查目标区域是否已存在：

```typescript
// 添加到 Dock 前检查
if (!dockItems.find(dockItem => dockItem.id === draggedItem.id)) {
  // 添加逻辑
}

// 添加到宫格前检查
if (!currentGridItems.find(item => item.id === draggedItem.id)) {
  // 添加逻辑
}
```

## 用户体验优化

1. **视觉反馈**
   - 拖拽时图标半透明 (`opacity: 0.5`)
   - 悬停在宫格上时背景高亮 (`bg-white/5`)
   - Dock 悬停时放大效果 (`scale-105`)

2. **光标变化**
   - 正常状态: `cursor-grab`
   - 拖拽中: `cursor-grabbing`

3. **动画效果**
   - 使用 `framer-motion` 实现平滑的添加/删除动画
   - 使用 `dnd-kit` 的 transform 和 transition 实现拖拽动画

## 测试场景

- ✅ 从宫格拖到 Dock，图标从宫格消失
- ✅ 从 Dock 拖回宫格，图标从 Dock 消失
- ✅ 在宫格内拖动调整顺序
- ✅ 在 Dock 内拖动调整顺序
- ✅ 切换页面后 Dock 保持一致
- ✅ 从 Dock 拖到不同页面的宫格
- ✅ 防止重复添加（同一图标不能同时存在于宫格和 Dock）
- ✅ 数据持久化到 KV 存储

## 注意事项

1. **唯一性保证**: 同一个图标不能同时存在于宫格和 Dock 中
2. **页面隔离**: 从 Dock 拖回宫格时，只添加到当前选中的页面
3. **数据同步**: 所有拖拽操作都会立即保存到 KV 存储
4. **顺序保持**: Dock 的顺序在所有页面保持一致
