// 拖拽相关的处理逻辑（和官方示例完全对齐）
import { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";


export interface DragState {
  // 不再需要任何状态，因为使用函数式更新
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
    setItemIds: (ids: string[] | ((prev: string[]) => string[])) => void;  // 改用 id 数组
  }
): DragHandlers {
  
  const handleDragStart = (event: DragStartEvent) => {
    setState.setActiveId(event.active.id as string);
  };


  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;

    // 完全模仿官方示例：直接对 id 数组进行 arrayMove
    setState.setItemIds((itemIds) =>
      arrayMove(itemIds, itemIds.indexOf(active.id as string), itemIds.indexOf(over?.id as string))
    );
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

