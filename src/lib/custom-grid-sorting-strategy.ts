import type { ClientRect } from '@dnd-kit/core';
import type { SortingStrategy } from '@dnd-kit/sortable';

/**
 * 锁定式交换记录
 * 记录已经发生过交换的元素对，避免反复切换
 */
let swapLockMap = new Map<string, Set<string>>();

/**
 * 重置交换锁定状态（在拖拽开始时调用）
 */
export function resetSwapLock() {
  swapLockMap.clear();
}

/**
 * 检查两个元素是否已经交换过
 */
function hasSwapped(activeId: string, targetId: string): boolean {
  const key = `${activeId}-${targetId}`;
  const reverseKey = `${targetId}-${activeId}`;
  
  return swapLockMap.has(key) || swapLockMap.has(reverseKey);
}

/**
 * 标记两个元素已经交换
 */
function markSwapped(activeId: string, targetId: string) {
  const key = `${activeId}-${targetId}`;
  if (!swapLockMap.has(key)) {
    swapLockMap.set(key, new Set([targetId]));
  }
}

/**
 * 自定义网格排序策略 - 锁定式交换
 * 
 * 核心逻辑：
 * 1. 判断拖拽元素（active）和目标元素（over）的相对位置
 * 2. 如果目标在左边：只有触碰目标的左边缘时才交换
 * 3. 如果目标在右边：只有触碰目标的右边缘时才交换
 * 4. 交换后锁定，不会因为继续拖动而反复切换
 */
export const customGridSortingStrategy: SortingStrategy = ({
  activeNodeRect,
  activeIndex,
  index,
  rects,
  overIndex,
}) => {
  // 如果没有激活的节点或者索引相同，不需要变换
  if (!activeNodeRect || activeIndex === index) {
    return null;
  }

  // 获取当前元素和目标元素的矩形
  const currentRect = rects[index];
  const overRect = rects[overIndex];

  if (!currentRect || !overRect) {
    return null;
  }

  // 如果当前元素不是 over 目标，使用默认行为
  if (index !== overIndex) {
    // 计算标准的位置偏移
    const sortedRects = rects.slice().sort((a, b) => {
      if (a.top !== b.top) {
        return a.top - b.top;
      }
      return a.left - b.left;
    });

    const oldIndex = sortedRects.indexOf(currentRect);
    const newIndex = sortedRects.indexOf(rects[activeIndex]);

    if (oldIndex === -1 || newIndex === -1) {
      return null;
    }

    // 如果需要移动，返回偏移量
    if (
      (activeIndex < index && index <= overIndex) ||
      (activeIndex > index && index >= overIndex)
    ) {
      const offset = {
        x: rects[activeIndex].left - currentRect.left,
        y: rects[activeIndex].top - currentRect.top,
      };

      return {
        x: offset.x,
        y: offset.y,
        scaleX: 1,
        scaleY: 1,
      };
    }

    return null;
  }

  // 当前元素是 over 目标，需要判断是否应该交换
  // 计算拖拽元素的中心点
  const activeCenterX = activeNodeRect.left + activeNodeRect.width / 2;
  const activeCenterY = activeNodeRect.top + activeNodeRect.height / 2;

  // 计算当前元素（over 目标）的中心点
  const currentCenterX = currentRect.left + currentRect.width / 2;

  // 判断当前元素在拖拽元素的左边还是右边
  const isCurrentOnLeft = currentCenterX < activeCenterX;

  // 判断是否在同一行（Y 坐标差距小于元素高度的一半）
  const isSameRow = Math.abs(currentRect.top - activeNodeRect.top) < currentRect.height / 2;

  // 如果不在同一行，不交换
  if (!isSameRow) {
    return null;
  }

  // 定义边缘触发区域（左右各 30% 为边缘）
  const edgeThreshold = currentRect.width * 0.3;
  const leftEdge = currentRect.left + edgeThreshold;
  const rightEdge = currentRect.right - edgeThreshold;

  // 判断是否触碰上下边缘（避免垂直方向的误触发）
  const topEdge = currentRect.top + currentRect.height / 4;
  const bottomEdge = currentRect.bottom - currentRect.height / 4;
  const isTouchingVerticalEdge = activeCenterY < topEdge || activeCenterY > bottomEdge;

  // 如果触碰上下边缘，不交换
  if (isTouchingVerticalEdge) {
    return null;
  }

  // 根据相对位置判断是否应该交换
  let shouldSwap = false;

  if (isCurrentOnLeft) {
    // 当前元素在拖拽元素左边：只有拖拽元素触碰左边缘时才交换
    shouldSwap = activeCenterX < leftEdge;
  } else {
    // 当前元素在拖拽元素右边：只有拖拽元素触碰右边缘时才交换
    shouldSwap = activeCenterX > rightEdge;
  }

  // 如果不应该交换，返回 null（不应用 transform）
  if (!shouldSwap) {
    return null;
  }

  // 应该交换，返回偏移量
  const offset = {
    x: activeNodeRect.left - currentRect.left,
    y: activeNodeRect.top - currentRect.top,
  };

  return {
    x: offset.x,
    y: offset.y,
    scaleX: 1,
    scaleY: 1,
  };
};
