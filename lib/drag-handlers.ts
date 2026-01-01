// 拖拽相关的处理逻辑
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

export interface DragState {
  pageGridItems: Record<string, any[]>;
  currentPageId: string;
  dockItems: any[];
}

export interface DragHandlers {
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: any) => void;
  onDragEnd: (event: DragEndEvent) => Promise<void>;
}

export function createDragHandlers(
  state: DragState,
  setState: {
    setActiveId: (id: string | null) => void;
    setDragOverPageId: (id: string | null) => void;
    setCurrentPageId: (id: string) => void;
    setPageGridItems: (items: Record<string, any[]>) => void;
    setDockItems: (items: any[]) => void;
  },
  switchTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
): DragHandlers {
  
  const handleDragStart = (event: DragStartEvent) => {
    setState.setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: any) => {
    const { over, active } = event;
    
    if (over?.id) {
      console.log('DragOver - over.id:', over.id);
    }
    
    // 清除之前的定时器
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }
    
    // 侧边栏按钮悬浮切换页面
    if (over?.id && typeof over.id === 'string' && over.id.startsWith('sidebar-button-')) {
      const pageId = over.id.replace('sidebar-button-', '');
      
      if (pageId !== state.currentPageId) {
        setState.setDragOverPageId(pageId);
        
        switchTimeoutRef.current = setTimeout(() => {
          console.log('Switching to page:', pageId);
          setState.setCurrentPageId(pageId);
          setState.setDragOverPageId(null);
        }, 150);
      }
    } else {
      setState.setDragOverPageId(null);
    }
    
    // 跨页面拖拽预览
    if (active && over?.id && !over.id.toString().startsWith('sidebar-button-') && over.id !== 'dock-droppable') {
      const currentItems = state.pageGridItems[state.currentPageId] || [];
      const isInCurrentPage = currentItems.some(item => item.id === active.id);
      
      if (!isInCurrentPage) {
        let draggedItem: any = null;
        for (const items of Object.values(state.pageGridItems)) {
          const found = items.find(item => item.id === active.id);
          if (found) {
            draggedItem = found;
            break;
          }
        }
        if (!draggedItem) {
          draggedItem = state.dockItems.find(item => item.id === active.id);
        }
        
        if (draggedItem) {
          const newPageGridItems = {
            ...state.pageGridItems,
            [state.currentPageId]: [...currentItems, { ...draggedItem, _tempPreview: true }]
          };
          setState.setPageGridItems(newPageGridItems);
        }
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('DragEnd - active.id:', active.id, 'over?.id:', over?.id);
    
    setState.setActiveId(null);

    // 清理临时预览
    const cleanPageGridItems = Object.fromEntries(
      Object.entries(state.pageGridItems).map(([pageId, items]) => [
        pageId,
        items.filter(item => !item._tempPreview)
      ])
    );

    // 查找拖拽源
    let draggedFromGrid: any = null;
    let sourcePageId: string | null = null;
    
    for (const [pageId, items] of Object.entries(cleanPageGridItems)) {
      const found = items.find(item => item.id === active.id);
      if (found) {
        draggedFromGrid = found;
        sourcePageId = pageId;
        break;
      }
    }
    
    const draggedFromDock = state.dockItems.find(item => item.id === active.id);

    // 拖到侧边栏按钮
    if (over?.id && typeof over.id === 'string' && over.id.startsWith('sidebar-button-')) {
      const targetPageId = over.id.replace('sidebar-button-', '');
      await handleDropToSidebarButton(
        active.id as string,
        targetPageId,
        draggedFromGrid,
        sourcePageId,
        draggedFromDock,
        cleanPageGridItems,
        state,
        setState
      );
      return;
    }

    setState.setDragOverPageId(null);

    const currentGridItems = cleanPageGridItems[state.currentPageId] || [];
    const currentDraggedFromGrid = currentGridItems.find(item => item.id === active.id);

    // 拖到 Dock
    if (over?.id === 'dock-droppable' && (currentDraggedFromGrid || draggedFromGrid)) {
      await handleDropToDock(
        active.id as string,
        currentDraggedFromGrid || draggedFromGrid,
        currentDraggedFromGrid ? state.currentPageId : sourcePageId,
        cleanPageGridItems,
        state,
        setState
      );
      return;
    }

    // 从 Dock 拖出
    if (draggedFromDock) {
      await handleDragFromDock(
        active.id as string,
        over,
        draggedFromDock,
        cleanPageGridItems,
        currentGridItems,
        state,
        setState
      );
      return;
    }

    // 跨页面拖拽
    if (draggedFromGrid && sourcePageId && sourcePageId !== state.currentPageId) {
      await handleCrossPageDrag(
        active.id as string,
        over,
        draggedFromGrid,
        sourcePageId,
        cleanPageGridItems,
        currentGridItems,
        state,
        setState
      );
      return;
    }

    // 同页面排序
    if (currentDraggedFromGrid && active.id !== over?.id && over?.id) {
      await handleSamePageReorder(
        active.id as string,
        over.id as string,
        currentGridItems,
        state,
        setState
      );
    }

    // Dock 内部排序
    if (draggedFromDock && active.id !== over?.id && over?.id) {
      handleDockReorder(active.id as string, over.id as string, state, setState);
    }
  };

  return {
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
  };
}

// 辅助函数
async function handleDropToSidebarButton(
  activeId: string,
  targetPageId: string,
  draggedFromGrid: any,
  sourcePageId: string | null,
  draggedFromDock: any,
  cleanPageGridItems: Record<string, any[]>,
  state: DragState,
  setState: any
) {
  if (draggedFromGrid && sourcePageId) {
    const sourceItems = cleanPageGridItems[sourcePageId].filter(item => item.id !== activeId);
    const targetItems = [...(cleanPageGridItems[targetPageId] || []), draggedFromGrid];
    
    const newPageGridItems = {
      ...cleanPageGridItems,
      [sourcePageId]: sourceItems,
      [targetPageId]: targetItems,
    };
    
    setState.setPageGridItems(newPageGridItems);
    setState.setCurrentPageId(targetPageId);
    setState.setDragOverPageId(null);
    
    await savePageGridItems(newPageGridItems);
  } else if (draggedFromDock) {
    const targetItems = [...(cleanPageGridItems[targetPageId] || []), draggedFromDock];
    const newDockItems = state.dockItems.filter(item => item.id !== activeId);
    
    const newPageGridItems = {
      ...cleanPageGridItems,
      [targetPageId]: targetItems,
    };
    
    setState.setPageGridItems(newPageGridItems);
    setState.setDockItems(newDockItems);
    setState.setCurrentPageId(targetPageId);
    setState.setDragOverPageId(null);
    
    await savePageGridItems(newPageGridItems);
  }
}

async function handleDropToDock(
  activeId: string,
  itemToMove: any,
  fromPageId: string | null,
  cleanPageGridItems: Record<string, any[]>,
  state: DragState,
  setState: any
) {
  if (itemToMove && !state.dockItems.find(dockItem => dockItem.id === itemToMove.id)) {
    const newDockItems = [...state.dockItems, itemToMove];
    setState.setDockItems(newDockItems);
    
    // 保存 Dock 数据到 KV
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'dock_items',
          value: JSON.stringify(newDockItems),
        }),
      });
    } catch (error) {
      console.error('Failed to save dock items:', error);
    }
    
    if (fromPageId) {
      const newGridItems = cleanPageGridItems[fromPageId].filter(item => item.id !== activeId);
      const newPageGridItems = { ...cleanPageGridItems, [fromPageId]: newGridItems };
      setState.setPageGridItems(newPageGridItems);
      
      await savePageGridItems(newPageGridItems);
    }
  }
}

async function handleDragFromDock(
  activeId: string,
  over: any,
  draggedFromDock: any,
  cleanPageGridItems: Record<string, any[]>,
  currentGridItems: any[],
  state: DragState,
  setState: any
) {
  const overDockItem = state.dockItems.find(item => item.id === over?.id);
  
  if (over?.id === 'dock-droppable' && !overDockItem && over.id !== activeId) {
    // 拖到 Dock 空白区域，移到宫格
    const newCurrentItems = [...currentGridItems, draggedFromDock];
    const newPageGridItems = { ...cleanPageGridItems, [state.currentPageId]: newCurrentItems };
    
    setState.setPageGridItems(newPageGridItems);
    setState.setDockItems((prevDockItems: any[]) => 
      prevDockItems.filter(item => item.id !== activeId)
    );
    
    await savePageGridItems(newPageGridItems);
    return;
  }

  if (over?.id !== 'dock-droppable') {
    // 拖到宫格
    const overItemIndex = currentGridItems.findIndex(item => item.id === over?.id && !item._tempPreview);
    let newPageGridItems = { ...cleanPageGridItems };
    
    if (overItemIndex !== -1) {
      // 插入到指定位置
      const newCurrentItems = [...currentGridItems];
      newCurrentItems.splice(overItemIndex, 0, draggedFromDock);
      newPageGridItems[state.currentPageId] = newCurrentItems;
    } else {
      // 添加到末尾
      const newCurrentItems = [...currentGridItems, draggedFromDock];
      newPageGridItems[state.currentPageId] = newCurrentItems;
    }
    
    setState.setDockItems((prevDockItems: any[]) => 
      prevDockItems.filter(item => item.id !== activeId)
    );
    setState.setPageGridItems(newPageGridItems);
    
    await savePageGridItems(newPageGridItems);
  }
}

async function handleCrossPageDrag(
  activeId: string,
  over: any,
  draggedFromGrid: any,
  sourcePageId: string,
  cleanPageGridItems: Record<string, any[]>,
  currentGridItems: any[],
  state: DragState,
  setState: any
) {
  const overItemIndex = currentGridItems.findIndex(item => item.id === over?.id && !item._tempPreview);
  let newPageGridItems = { ...cleanPageGridItems };
  
  // 从源页面移除
  const sourceItems = cleanPageGridItems[sourcePageId].filter(item => item.id !== activeId);
  newPageGridItems[sourcePageId] = sourceItems;
  
  if (overItemIndex !== -1) {
    // 插入到指定位置
    const newCurrentItems = [...currentGridItems];
    newCurrentItems.splice(overItemIndex, 0, draggedFromGrid);
    newPageGridItems[state.currentPageId] = newCurrentItems;
  } else {
    // 添加到末尾
    const newCurrentItems = [...currentGridItems, draggedFromGrid];
    newPageGridItems[state.currentPageId] = newCurrentItems;
  }
  
  setState.setPageGridItems(newPageGridItems);
  await savePageGridItems(newPageGridItems);
}

async function handleSamePageReorder(
  activeId: string,
  overId: string,
  currentGridItems: any[],
  state: DragState,
  setState: any
) {
  const oldIndex = currentGridItems.findIndex((item) => item.id === activeId);
  const newIndex = currentGridItems.findIndex((item) => item.id === overId);
  
  if (oldIndex !== -1 && newIndex !== -1) {
    const newItems = [...currentGridItems];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    const newPageGridItems = { ...state.pageGridItems, [state.currentPageId]: newItems };
    setState.setPageGridItems(newPageGridItems);
    
    await savePageGridItems(newPageGridItems);
  }
}

function handleDockReorder(
  activeId: string,
  overId: string,
  state: DragState,
  setState: any
) {
  const oldIndex = state.dockItems.findIndex((item) => item.id === activeId);
  const newIndex = state.dockItems.findIndex((item) => item.id === overId);
  
  if (oldIndex !== -1 && newIndex !== -1) {
    const newItems = [...state.dockItems];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    setState.setDockItems(newItems);
    
    // 保存 Dock 数据到 KV
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'dock_items',
        value: JSON.stringify(newItems),
      }),
    }).catch(error => console.error('Failed to save dock items:', error));
  }
}

async function savePageGridItems(pageGridItems: Record<string, any[]>) {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'page_grid_items',
        value: JSON.stringify(pageGridItems),
      }),
    });
  } catch (error) {
    console.error('Failed to save page grid items:', error);
  }
}
