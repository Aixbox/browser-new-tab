// 拖拽相关的处理逻辑
import { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { GridItem } from "@/lib/grid-model";


export interface DragState {
  gridItems: GridItem[];  // 简化：移除多页面结构
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
  };


  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;

    // 如果没有 over 目标，不做任何操作
    if (!over) return;
    
    // 如果拖到自己身上，不做任何操作
    if (active.id === over.id) return;

    setState.setGridItems((items) => {
      const ids = items.map(item => item.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      
      // 如果索引没有变化，返回原数组（避免触发更新）
      if (oldIndex === newIndex) return items;
      
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setState.setActiveId(null);
    // 和官方示例一样：只清空 activeId
  };

  return {
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
  };
}

