# 无限循环问题修复

## 问题描述
应用启动后出现 "Maximum update depth exceeded" 错误，导致疯狂发送请求和页面崩溃。

## 根本原因

### 1. DraggableGrid 组件的循环依赖
**位置**: `components/draggable-grid.tsx`

**问题代码**:
```typescript
useEffect(() => {
  if (onItemsChange) {
    onItemsChange(items);
  }
}, [items, onItemsChange]);
```

**循环路径**:
1. `items` 状态变化
2. 触发 `useEffect`，调用 `onItemsChange(items)`
3. 父组件 (`pages/index.tsx`) 更新 `pageGridItems`
4. 传递新的 `initialItems` 给 `DraggableGrid`
5. `DraggableGrid` 重新渲染，`items` 再次变化
6. 回到步骤 1，形成无限循环

**修复方案**:
- **删除**这个 `useEffect`，因为 `items` 的变化已经在 `handleDelete` 和 `handleSave` 中手动调用 `onItemsChange`
- **添加**新的 `useEffect` 来同步 `initialItems` 的变化（页面切换时）:
```typescript
useEffect(() => {
  setItems(initialItems || []);
}, [initialItems]);
```

### 2. CustomSidebar 组件的依赖问题
**位置**: `components/custom-sidebar.tsx`

**问题代码**:
```typescript
useEffect(() => {
  if (!isInitialized && items.length > 0) {
    const firstItemId = items[0].id;
    setSelectedItemId(firstItemId);
    onPageChange?.(firstItemId);
    setIsInitialized(true);
  }
}, [isInitialized, items, onPageChange]); // items 和 onPageChange 会频繁变化
```

**问题**:
- `items` 和 `onPageChange` 作为依赖项，每次变化都会触发 `useEffect`
- 即使有 `isInitialized` 标志，依赖项的变化仍会导致不必要的执行

**修复方案**:
- 将初始化逻辑拆分为独立的 `useEffect`，使用**空依赖数组**（只在挂载时执行）
- 将 `items` 同步和删除检查分离到不同的 `useEffect`

```typescript
// 初始化时选中第一个按钮（只执行一次）
useEffect(() => {
  if (items.length > 0 && selectedItemId === null) {
    const firstItemId = items[0].id;
    setSelectedItemId(firstItemId);
    onPageChange?.(firstItemId);
  }
}, []); // 空依赖数组

// 当 items 从外部变化时更新本地状态
useEffect(() => {
  setSidebarItems(items);
}, [items]);

// 当选中的项被删除时，选中第一个
useEffect(() => {
  if (selectedItemId && items.length > 0 && !items.find(item => item.id === selectedItemId)) {
    const firstItemId = items[0].id;
    setSelectedItemId(firstItemId);
    onPageChange?.(firstItemId);
  }
}, [items, selectedItemId, onPageChange]);
```

## 修复后的数据流

### 正常的数据流（无循环）

1. **用户操作** → 添加/删除图标
2. `handleSave` 或 `handleDelete` → 更新本地 `items` 状态
3. 手动调用 `onItemsChange(newItems)` → 通知父组件
4. 父组件更新 `pageGridItems` → 保存到 KV
5. **不会**触发子组件重新渲染（因为没有 `useEffect` 监听 `items`）

### 页面切换的数据流

1. 用户点击侧边栏按钮
2. `setCurrentPageId(newPageId)`
3. `DraggableGrid` 的 `key={currentPageId}` 导致组件重新挂载
4. 新的 `initialItems` 传入
5. `useEffect` 同步 `initialItems` 到 `items`
6. 显示新页面的图标

## 关键修复点总结

1. ✅ **移除** `DraggableGrid` 中监听 `items` 变化的 `useEffect`
2. ✅ **添加** 同步 `initialItems` 的 `useEffect`（只在 `initialItems` 变化时触发）
3. ✅ **简化** `CustomSidebar` 的初始化逻辑，使用空依赖数组
4. ✅ **分离** 不同职责的 `useEffect`，避免复杂的依赖关系
5. ✅ 使用 `useCallback` 包装回调函数（在 `pages/index.tsx` 中）

## 测试验证

修复后应该验证：
- ✅ 页面加载时不会出现无限循环
- ✅ 点击侧边栏按钮可以正常切换页面
- ✅ 添加/删除图标不会触发无限更新
- ✅ 拖拽图标到 Dock 栏正常工作
- ✅ 不同页面的图标数据独立存储
- ✅ Dock 栏在所有页面保持一致
