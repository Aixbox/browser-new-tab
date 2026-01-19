# 拖拽系统简化总结

## 目标
将拖拽系统简化到和官方 dnd-kit + Framer Motion 示例完全一致，以解决无限循环和性能问题。

## 主要变更

### 1. 移除多页面结构
**之前：**
```typescript
pageGridItems: Record<string, GridItem[]>  // 多页面结构
```

**现在：**
```typescript
gridItems: GridItem[]  // 单一数组，和官方示例一致
```

### 2. 简化 drag-handlers.ts
**之前：**
- 复杂的多页面逻辑
- Dock 拖拽逻辑
- 文件夹拖拽逻辑
- 跨页面拖拽逻辑
- 侧边栏切换逻辑

**现在：**
```typescript
// 和官方示例完全一致的逻辑
const handleDragOver = (event: DragOverEvent) => {
  const { over, active } = event;
  
  setState.setGridItems((items) => {
    const ids = items.map(item => item.id);
    return arrayMove(
      items,
      ids.indexOf(active.id as string),
      ids.indexOf(over?.id as string)
    );
  });
};
```

### 3. 简化 grid-store.ts
**之前：**
```typescript
interface GridStoreState {
  pageGridItems: Record<string, GridItem[]>;
  dockItems: DockItem[];
  activeId: string | null;
  // ...
}
```

**现在：**
```typescript
interface GridStoreState {
  gridItems: GridItem[];  // 单一数组
  activeId: string | null;
  // ...
}
```

### 4. 暂时注释的功能
为了匹配官方示例，以下功能已暂时注释：

- ✅ Dock 组件（在 ComponentLayout.tsx 中注释）
- ✅ 多页面轮播动画（在 PageGridCarousel.tsx 中简化）
- ✅ 所有复杂的拖拽逻辑（文件夹、跨页面、Dock 等）

### 5. 更新的组件

#### src/lib/drag-handlers.ts
- 移除所有复杂逻辑
- 只保留 `handleDragStart`、`handleDragOver`、`handleDragEnd`
- `handleDragOver` 使用 `arrayMove` 实时更新数组

#### src/lib/grid-store.ts
- 从 `pageGridItems: Record<string, GridItem[]>` 改为 `gridItems: GridItem[]`
- 移除 `dockItems`
- 保留函数式更新支持

#### src/pages/index.tsx
- 更新 `dragHandlers` 调用，移除多余参数
- 更新 `overlays` props
- 更新 `ComponentLayout` props
- 移除 `DockItem` 导入

#### src/components/home/ComponentLayout.tsx
- Props 从 `pageGridItems` 改为 `gridItems`
- 移除 `dockItems` 和 `onDockItemsChange`
- 注释 Dock 组件
- 移除 `DockItem` 导入

#### src/components/home/PageGridCarousel.tsx
- Props 从 `pageGridItems` 改为 `gridItems`
- 移除轮播动画逻辑
- 直接渲染单个页面

#### src/components/draggable-grid.tsx
- Props 从 `allPageItems` 和 `currentPageId` 改为 `items`
- 简化所有处理函数（删除、编辑、保存等）

#### src/components/home/HomeOverlays.tsx
- Props 从 `pageGridItems`、`currentPageId`、`dockItems` 改为 `gridItems`
- 移除 `DockItem` 导入

#### src/components/home/HomeShell.tsx
- overlays 类型从 `pageGridItems`、`currentPageId`、`dockItems` 改为 `gridItems`
- 移除 `DockItem` 导入

#### src/components/drag-overlay-item.tsx
- Props 从 `pageGridItems`、`currentPageId`、`dockItems` 改为 `gridItems`
- 移除 `DockItem` 导入

#### src/hooks/use-preload-assets.ts
- Props 从 `pageGridItems`、`dockItems` 改为 `gridItems`
- 简化预加载逻辑

## 和官方示例的对比

### 官方示例结构
```typescript
const [items, setItems] = useState(initialItems);

function handleDragOver({ active, over }) {
  setItems((items) =>
    arrayMove(items, items.indexOf(active.id), items.indexOf(over?.id))
  );
}
```

### 我们的结构
```typescript
const { gridItems, setGridItems } = useGridStore();

const handleDragOver = (event: DragOverEvent) => {
  setState.setGridItems((items) => {
    const ids = items.map(item => item.id);
    return arrayMove(
      items,
      ids.indexOf(active.id as string),
      ids.indexOf(over?.id as string)
    );
  });
};
```

### 主要区别
1. **官方使用 `useState`，我们使用 `Zustand`** - 这是可接受的差异
2. **官方使用字符串数组，我们使用对象数组** - 需要 `map(item => item.id)` 来提取 id
3. **其他逻辑完全一致**

## 编译状态
✅ 所有 TypeScript 类型错误已修复
✅ 所有组件已更新
✅ 代码可以正常编译

## 下一步
1. ✅ 测试基础拖拽功能是否正常工作
2. ✅ 确认无限循环问题是否解决
3. 如果问题解决，逐步恢复功能：
   - 先恢复 Dock
   - 再恢复多页面
   - 最后恢复文件夹功能

## 注意事项
- 所有被注释的代码都保留在原文件中，方便后续恢复
- 数据保存逻辑已更新为保存到 `icon_items` 而不是 `page_grid_items`
- Framer Motion 的 `layoutId` 和 `transition` 配置保持不变
- 文件夹功能仍然保留，只是拖拽逻辑简化了
