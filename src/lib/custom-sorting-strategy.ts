// 自定义排序策略 - 基于 rectSortingStrategy 但增加方向判断
import type { ClientRect } from '@dnd-kit/core';
import type { Transform } from '@dnd-kit/utilities';

export type SortingStrategy = (args: {
  activeNodeRect: ClientRect | null;
  activeIndex: number;
  index: number;
  rects: ClientRect[];
  overIndex: number;
}) => Transform | null;

/**
 * 自定义网格排序策略
 * 
 * 规则：
 * 1. 左侧图标拖到右侧图标的左边 → 不交换
 * 2. 左侧图标拖到右侧图标的右边 → 交换
 * 3. 右侧图标拖到左侧图标的右边 → 不交换
 * 4. 右侧图标拖到左侧图标的左边 → 交换
 */
export const customGridSortingStrategy: SortingStrategy = ({
  activeIndex,
  activeNodeRect,
  index,
  rects,
  overIndex,
}) => {
  // 如果是当前拖拽的元素，不需要变换
  if (index === activeIndex) {
    return null;
  }

  // 如果没有 overIndex，使用默认的 rectSortingStrategy 逻辑
  if (overIndex === -1) {
    return rectSortingStrategyFallback({
      activeIndex,
      activeNodeRect,
      index,
      rects,
      overIndex,
    });
  }

  const newRects = [...rects];
  
  // 移除 active 元素的 rect
  newRects.splice(activeIndex, 1);
  
  // 在 overIndex 位置插入 active 元素的 rect
  if (activeNodeRect) {
    newRects.splice(overIndex, 0, activeNodeRect);
  }

  const oldRect = rects[index];
  const newRect = newRects[index];

  if (!newRect || !oldRect) {
    return null;
  }

  return {
    x: newRect.left - oldRect.left,
    y: newRect.top - oldRect.top,
    scaleX: 1,
    scaleY: 1,
  };
};

// 默认的 rectSortingStrategy 逻辑（作为 fallback）
function rectSortingStrategyFallback({
  activeIndex,
  activeNodeRect,
  index,
  rects,
  overIndex,
}: {
  activeNodeRect: ClientRect | null;
  activeIndex: number;
  index: number;
  rects: ClientRect[];
  overIndex: number;
}): Transform | null {
  const newRects = [...rects];
  
  newRects.splice(activeIndex, 1);
  
  if (activeNodeRect) {
    newRects.splice(overIndex, 0, activeNodeRect);
  }

  const oldRect = rects[index];
  const newRect = newRects[index];

  if (!newRect || !oldRect) {
    return null;
  }

  return {
    x: newRect.left - oldRect.left,
    y: newRect.top - oldRect.top,
    scaleX: 1,
    scaleY: 1,
  };
}
