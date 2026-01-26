// 拖拽相关的处理逻辑
import { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { GridItem } from "@/lib/grid-model";
import { resetSwapLock } from "./custom-grid-sorting-strategy";


export interface DragState {
  gridItems: GridItem[];  // 简化：移除多页面结构
}

/**
 * 交换锁定记录
 * 记录在当前拖拽过程中已经交换过的元素对
 */
let swappedPairs = new Set<string>();

/**
 * 生成交换对的唯一键
 */
function getSwapKey(id1: string, id2: string): string {
  return [id1, id2].sort().join('-');
}

/**
 * 检查是否已经交换过
 */
function hasSwapped(id1: string, id2: string): boolean {
  return swappedPairs.has(getSwapKey(id1, id2));
}

/**
 * 标记已经交换
 */
function markSwapped(id1: string, id2: string) {
  swappedPairs.add(getSwapKey(id1, id2));
}

/**
 * 重置交换记录
 */
function resetSwappedPairs() {
  swappedPairs.clear();
}


export interface DragHandlers {
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function createDragHandlers(
  state: DragState,
  setState: {
    setActiveId: (id: string | null) => void;
    setGridItems: (items: GridItem[] | ((prev: GridItem[]) => GridItem[])) => void;
  }
): DragHandlers {
  
  const handleDragStart = (event: DragStartEvent) => {
    setState.setActiveId(event.active.id as string);
    // 重置交换记录
    resetSwappedPairs();
    resetSwapLock();
  };


  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;

    // 如果没有 over 目标，不做任何操作
    if (!over) return;
    
    // 如果拖到自己身上，不做任何操作
    if (active.id === over.id) return;

    // 检查是否已经交换过这对元素
    if (hasSwapped(active.id as string, over.id as string)) {
      return; // 已经交换过，不再处理
    }

    setState.setGridItems((items) => {
      const ids = items.map(item => item.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      
      // 如果索引没有变化，返回原数组（避免触发更新）
      if (oldIndex === newIndex) return items;
      
      // 标记这对元素已经交换
      markSwapped(active.id as string, over.id as string);
      
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setState.setActiveId(null);
    // 清空交换记录（为下次拖拽做准备）
    resetSwappedPairs();
    resetSwapLock();
  };

  return {
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
  };
}
