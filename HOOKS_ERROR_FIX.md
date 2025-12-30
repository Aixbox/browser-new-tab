# React Hooks 错误修复

## 错误信息
```
Error: Rendered more hooks than during the previous render.
```

## 问题原因

在 `components/dock.tsx` 中，`useSortable` hook 被放在了 `renderIcon` 函数内部：

```typescript
const renderIcon = (item: DockItem, index: number) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id }); // ❌ 错误：在函数内部调用 hook
  
  // ...
};
```

### React Hooks 规则

React Hooks 必须遵守以下规则：
1. ✅ 只能在组件的顶层调用
2. ❌ 不能在条件语句中调用
3. ❌ 不能在循环中调用
4. ❌ 不能在嵌套函数中调用

违反这些规则会导致：
- Hook 调用顺序不一致
- 状态管理混乱
- "Rendered more hooks" 错误

## 解决方案

将 `renderIcon` 函数重构为独立的组件 `DraggableDockItem`，在组件顶层调用 hooks。

### 修复前的代码结构

```typescript
export const Dock = ({ items, ... }) => {
  // Dock 组件的 hooks
  
  const renderIcon = (item: DockItem, index: number) => {
    // ❌ 在嵌套函数中调用 hook
    const { ... } = useSortable({ id: item.id });
    
    return <div>...</div>;
  };
  
  return (
    <div>
      {items.map((item, index) => renderIcon(item, index))}
    </div>
  );
};
```

### 修复后的代码结构

```typescript
// ✅ 独立的组件，在顶层调用 hooks
const DraggableDockItem = ({ 
  item, 
  index,
  iconSize,
  borderRadius,
  opacity,
  nameSize,
  nameColor,
  showName,
  openInNewTab,
  onHoverChange
}: {
  item: DockItem;
  index: number;
  iconSize: number;
  borderRadius: number;
  opacity: number;
  nameSize: number;
  nameColor: string;
  showName: boolean;
  openInNewTab: boolean;
  onHoverChange: (index: number | null) => void;
}) => {
  // ✅ 在组件顶层调用 hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 渲染逻辑
  const renderIcon = () => {
    // 不再调用 hooks，只是普通的渲染函数
    if (item.iconType === 'text' && item.iconText && item.iconColor) {
      return <div>...</div>;
    }
    // ...
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-center"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        {renderIcon()}
      </div>
      {/* 名称显示 */}
    </div>
  );
};

// Dock 主组件
export const Dock = ({ items, ... }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { setNodeRef, isOver } = useDroppable({
    id: 'dock-droppable',
  });

  return (
    <motion.div>
      <div ref={setNodeRef}>
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div>
            {items.map((item, index) => (
              <motion.div key={item.id}>
                {/* ✅ 使用独立组件 */}
                <DraggableDockItem
                  item={item}
                  index={index}
                  iconSize={iconSize}
                  borderRadius={borderRadius}
                  opacity={opacity}
                  nameSize={nameSize}
                  nameColor={nameColor}
                  showName={showName}
                  openInNewTab={openInNewTab}
                  onHoverChange={setHoveredIndex}
                />
              </motion.div>
            ))}
          </div>
        </SortableContext>
      </div>
    </motion.div>
  );
};
```

## 关键改动

### 1. 创建独立组件
将 `renderIcon` 函数提取为 `DraggableDockItem` 组件：
- 组件可以在顶层调用 hooks
- 符合 React Hooks 规则
- 代码更清晰，职责分离

### 2. 传递必要的 props
`DraggableDockItem` 需要接收所有渲染所需的数据：
- `item`: 图标数据
- `index`: 索引（用于 hover 状态）
- 样式相关参数：`iconSize`, `borderRadius`, `opacity`, `nameSize`, `nameColor`, `showName`
- 行为相关参数：`openInNewTab`, `onHoverChange`

### 3. 保持渲染逻辑
`renderIcon` 现在是组件内部的普通函数，不再调用 hooks：
```typescript
const renderIcon = () => {
  // 只负责根据 item 类型返回不同的 JSX
  if (item.iconType === 'text') return <div>...</div>;
  if (item.iconType === 'image') return <IconImage ... />;
  if (item.iconType === 'logo') return <IconImage ... />;
  return <div>...</div>;
};
```

## 最佳实践

### ✅ 正确的做法
```typescript
// 独立组件，在顶层调用 hooks
const MyComponent = ({ id }) => {
  const { ... } = useSortable({ id });
  return <div>...</div>;
};

// 在父组件中使用
{items.map(item => <MyComponent key={item.id} id={item.id} />)}
```

### ❌ 错误的做法
```typescript
// 在函数中调用 hooks
const renderItem = (id) => {
  const { ... } = useSortable({ id }); // ❌ 错误
  return <div>...</div>;
};

{items.map(item => renderItem(item.id))}
```

## 验证修复

修复后应该：
- ✅ 不再出现 "Rendered more hooks" 错误
- ✅ Dock 图标可以正常拖拽
- ✅ 拖拽动画流畅
- ✅ 所有功能正常工作

## 相关资源

- [React Hooks 规则](https://react.dev/reference/rules/rules-of-hooks)
- [dnd-kit useSortable](https://docs.dndkit.com/presets/sortable/usesortable)
- [React 组件提取](https://react.dev/learn/extracting-state-logic-into-a-reducer#comparing-usestate-and-usereducer)
