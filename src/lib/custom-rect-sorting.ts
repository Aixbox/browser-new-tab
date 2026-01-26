import { arrayMove, SortingStrategy } from "@dnd-kit/sortable";

// 记录拖拽过程中的状态
let dragState: {
  activeIndex: number;
  maxReachedIndex: number;  // 向右拖拽时到达的最远位置
  minReachedIndex: number;  // 向左拖拽时到达的最近位置
} | null = null;

export const customRectSorting: SortingStrategy = ({
  activeNodeRect,
  rects,
  activeIndex,
  overIndex, //鼠标悬停位置对应的元素
  index, //计算transform的元素
}) => {


  // 如果没有激活的节点或者索引相同，不需要变换
  if (!activeNodeRect || activeIndex === index) {
    return null;
  }


  // 获取当前元素的矩形
  const currentRect = rects[index];
  if (!currentRect) {
    return null;
  }

  if (index === overIndex) {
    console.log("currentRect", currentRect);
    console.log("activeNodeRect", activeNodeRect);
    const overRect = rects[overIndex];
    if (!overRect) {
      return null;
    }

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
      console.log("不在同一行，不交换");
      return null;
    }

    // 定义边缘触发区域（左右各 30% 为边缘）
    const edgeThreshold = currentRect.width * 0.9;
    const leftEdge = currentRect.left + edgeThreshold;
    const rightEdge = currentRect.right - edgeThreshold;

    // 判断是否触碰上下边缘（避免垂直方向的误触发）
    const topEdge = currentRect.top + currentRect.height / 4;
    const bottomEdge = currentRect.bottom - currentRect.height / 4;
    const isTouchingVerticalEdge = activeCenterY < topEdge || activeCenterY > bottomEdge;

    // 如果触碰上下边缘，不交换
    if (isTouchingVerticalEdge) {
      console.log("触碰上下边缘，不交换");
      return null;
    }

    // 根据相对位置判断是否应该交换
    let shouldSwap = false;

    if (isCurrentOnLeft) {
      const newRects = arrayMove(rects, overIndex, activeIndex);
      const oldRect = rects[index];
      const newRect = newRects[index];
      console.log("oldRect", oldRect, index, activeIndex);
      console.log("newRect", newRect, index, activeIndex);
      // 当前元素在拖拽元素左边：只有拖拽元素触碰左边缘时才交换
      shouldSwap = activeCenterX < leftEdge;
    } else {
      // 当前元素在拖拽元素右边：只有拖拽元素触碰右边缘时才交换
      shouldSwap = activeCenterX > rightEdge;
    }

    // 如果不应该交换，返回 null（不应用 transform）
    if (!shouldSwap) {
      console.log("不应该交换");
      return null;
    }
  }

  const newRects = arrayMove(rects, overIndex, activeIndex);

  const oldRect = rects[index];
  const newRect = newRects[index];
  

  if (!newRect || !oldRect) {
    return null;
  }

  return {
    x: newRect.left - oldRect.left,
    y: newRect.top - oldRect.top,
    scaleX: newRect.width / oldRect.width,
    scaleY: newRect.height / oldRect.height,
  };
};