# 文件夹创建功能修复

## 问题根源

之前的实现中，`DraggableGrid` 组件虽然导入了 `SortableContext`，但**从未使用它**。这导致：

1. ❌ 碰撞检测不会持续运行（collision detection 只在有 SortableContext 时才会每帧触发）
2. ❌ 悬停状态跟踪无法工作（hover state tracking 依赖持续的碰撞检测）
3. ❌ 文件夹预览永远不会显示（因为 500ms 计时器无法正常工作）
4. ❌ 图标要么立即避让，要么完全不避让

## 修复内容

### 1. 添加 SortableContext 包裹 (components/draggable-grid.tsx)

```tsx
<SortableContext items={currentItems.map(item => item.id)} strategy={rectSortingStrategy}>
  <LayoutGroup>
    <div className="grid ...">
      {/* 图标网格 */}
    </div>
  </LayoutGroup>
</SortableContext>
```

**作用**: 让 dnd-kit 的碰撞检测系统持续运行，每帧都会调用自定义碰撞检测函数。

### 2. 统一使用 useSortable (components/folder-item.tsx)

将文件夹组件从使用 `useDraggable` + `useDroppable` 改为使用 `useSortable`：

```tsx
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ 
  id: folder.id,
  animateLayoutChanges: () => false,
});
```

**作用**: 确保文件夹也参与到 SortableContext 的排序系统中，可以正确检测碰撞。

### 3. 修复计时器逻辑 (lib/collision-detection.ts)

**关键改进**: 当用户从边缘移动到中心（或反之）时，**重置计时器**：

```typescript
if (hoverState.isInCenter !== isInCenter) {
  // 位置改变（外围<->中心），重置计时器
  hoverState.startTime = now;
  hoverState.isInCenter = isInCenter;
  
  // 如果从中心移到外围，退出文件夹模式
  if (!isInCenter && hoverState.inFolderMode) {
    hoverState.inFolderMode = false;
    // 触发事件通知预览消失
  }
}
```

**原因**: 
- 边缘悬停 500ms → 触发排序避让
- 中心悬停 500ms → 显示文件夹预览
- 这是**两个独立的计时器**，不应该累加

### 4. 保持 animateLayoutChanges: () => false

在 `DraggableItem` 和 `FolderItemComponent` 中都设置：

```tsx
useSortable({ 
  id: item.id,
  animateLayoutChanges: () => false,
});
```

**作用**: 禁用自动排序动画，防止图标立即避让。排序只在 `onDragEnd` 中手动处理。

## 工作流程

### 用户拖动图标到另一个图标上：

1. **碰撞检测持续运行**（因为有 SortableContext）
2. **检测鼠标位置**：
   - 外围 50% → `isInCenter = false`
   - 中心 50% → `isInCenter = true`
3. **计时器开始**：
   - 首次进入目标图标 → 开始计时
   - 从边缘移到中心（或反之）→ 重置计时
4. **500ms 后**：
   - 如果在中心区域 → 显示文件夹预览（光圈 + "创建文件夹"文字）
   - 如果在边缘区域 → 触发排序避让（未来实现）
5. **松开鼠标**：
   - 如果在文件夹创建模式 → 创建文件夹
   - 否则 → 执行排序

## 测试要点

1. ✅ 拖动图标到另一个图标中心，等待 500ms，应该显示文件夹预览
2. ✅ 在预览显示后松开鼠标，应该创建文件夹
3. ✅ 拖动过程中移出图标，预览应该消失
4. ✅ 从边缘移到中心，计时器应该重置（需要重新等待 500ms）
5. ✅ 文件夹可以正常拖动和排序
6. ✅ 可以拖动图标到文件夹上添加到文件夹

## 下一步（未实现）

- [ ] 实现边缘悬停 500ms 后的排序避让动画
- [ ] 优化文件夹预览的视觉效果
- [ ] 添加更多的用户反馈（如悬停进度指示器）
