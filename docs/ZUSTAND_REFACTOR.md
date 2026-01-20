# Zustand Store 重构说明

## 问题背景

之前的实现中，`gridItems` 通过 props 从 `index.tsx` → `ComponentLayout` → `PageGridCarousel` → `DraggableGrid` 层层传递，导致：

1. **循环更新风险**：`DraggableGrid` 既接收 props 又订阅 store，可能触发无限循环
2. **代码冗余**：需要在每一层传递 `gridItems` 和 `onGridItemsChange`
3. **性能问题**：props 变化会导致整个组件树重渲染

## 解决方案

### 核心思路：直接使用 Zustand Store

所有组件直接从 `useGridStore` 获取数据，不再通过 props 传递。

### 数据流设计

```
┌─────────────────────────────────────────────────────────┐
│                    useGridStore (Zustand)                │
│  ┌────────────────────────────────────────────────────┐ │
│  │ gridItems: GridItem[]      // 完整的图标数据      │ │
│  │ gridItemIds: string[]      // ID 顺序（拖拽优化） │ │
│  │ activeId: string | null    // 当前拖拽的图标      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
   index.tsx      DraggableGrid      其他组件
   (监听变化)      (直接读写)        (直接读写)
```

### 拖拽优化机制

1. **onDragOver**：只更新 `gridItemIds`（轻量级）
   ```typescript
   setGridItemIds((ids) => arrayMove(ids, oldIndex, newIndex));
   ```

2. **onDragEnd**：根据最新的 `gridItemIds` 重排 `gridItems`
   ```typescript
   const { gridItemIds, gridItems } = useGridStore.getState();
   const reorderedItems = gridItemIds.map(id => itemMap.get(id));
   setGridItems(reorderedItems);
   ```

3. **渲染**：`DraggableGrid` 直接使用 `gridItems`，不需要手动排序
   - `@dnd-kit` 会自动处理拖拽时的视觉位置
   - 只有 `onDragEnd` 时才更新完整数据

## 修改的文件

### 1. `src/lib/grid-store.ts`
- 添加 `gridItemIds: string[]` 状态
- 添加 `setGridItemIds` 方法
- `setGridItems` 同时更新 `gridItemIds`

### 2. `src/pages/index.tsx`
- 移除 `gridItems` 和 `onGridItemsChange` 的 props 传递
- 添加 `useEffect` 监听 `gridItems` 变化，自动保存到服务器
- 直接在组件中定义 drag handlers（不使用 `createDragHandlers`）

### 3. `src/components/home/ComponentLayout.tsx`
- 移除 `gridItems` 和 `onGridItemsChange` props

### 4. `src/components/home/PageGridCarousel.tsx`
- 移除 `gridItems` 和 `onItemsChange` props

### 5. `src/components/draggable-grid.tsx`
- 移除 `items` 和 `onItemsChange` props
- 直接使用 `useGridStore()` 获取 `gridItems` 和 `setGridItems`
- 所有修改操作直接调用 `setGridItems`

## 优势

1. **避免循环更新**：每个组件独立订阅 store，不会因为 props 变化触发循环
2. **代码简洁**：减少了大量 props 传递代码
3. **性能优化**：
   - 拖拽时只更新 `gridItemIds`（字符串数组）
   - 只有拖拽结束才更新完整的 `gridItems`
   - 只有使用到数据的组件才会重渲染
4. **易于维护**：数据流清晰，修改逻辑集中在 store

## 注意事项

1. **不要在 `DraggableGrid` 中使用 `gridItemIds` 排序**
   - `@dnd-kit` 会自动处理拖拽时的视觉效果
   - 手动排序会导致额外的重渲染

2. **保存到服务器的时机**
   - 在 `index.tsx` 中通过 `useEffect` 监听 `gridItems` 变化
   - 自动保存，不需要在每个修改操作中手动调用

3. **闭包陷阱**
   - 不使用 `createDragHandlers` 工厂函数
   - 直接在组件中定义 handlers，使用 `useCallback`
   - 在 `handleDragEnd` 中使用 `useGridStore.getState()` 获取最新状态

## 测试要点

- [x] 拖拽图标时其他图标正常避让
- [x] 快速拖拽不会出现无限循环错误
- [x] 拖拽结束后数据正确保存
- [x] 添加/编辑/删除图标功能正常
- [x] 文件夹功能正常
- [x] 页面刷新后数据正确加载
