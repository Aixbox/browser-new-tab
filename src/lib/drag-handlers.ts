// 拖拽相关的处理逻辑
import { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { isFolder, isIcon, stripTempPreviews } from "@/lib/grid-model";
import type { GridItem, IconItem, FolderItem } from "@/lib/grid-model";


export interface DragState {
  pageGridItems: Record<string, GridItem[]>;
  currentPageId: string;
  dockItems: IconItem[];
}


export interface DragHandlers {
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => Promise<void>;
}

export function createDragHandlers(
  state: DragState,
  setState: {
    setActiveId: (id: string | null) => void;
    setDragOverPageId: (id: string | null) => void;
    setCurrentPageId: (id: string) => void;
    setPageGridItems: (items: Record<string, GridItem[]>) => void;
    setDockItems: (items: IconItem[]) => void;
  },
  switchTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
): DragHandlers {
  
  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    setState.setActiveId(activeId);
  };


  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;

    if (!over || over.id === active.id) {
      return;
    }

    // 清除之前的定时器
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }

    // 侧边栏按钮悬浮切换页面
    if (typeof over.id === "string" && over.id.startsWith("sidebar-button-")) {
      const pageId = over.id.replace("sidebar-button-", "");

      if (pageId !== state.currentPageId) {
        setState.setDragOverPageId(pageId);

        switchTimeoutRef.current = setTimeout(() => {
          setState.setCurrentPageId(pageId);
          setState.setDragOverPageId(null);
        }, 150);
      }

      return;
    } else {
      setState.setDragOverPageId(null);
    }

    if (over.id === "dock-droppable" || over.id === "grid-droppable") {
      return;
    }

    // 实时更新同页面排序（Framer Motion 会自动处理动画）
    const currentGridItems = state.pageGridItems[state.currentPageId] || [];
    const activeIndex = currentGridItems.findIndex((item: GridItem) => item.id === active.id);
    const overIndex = currentGridItems.findIndex((item: GridItem) => item.id === over.id);
    
    // 只有当位置真的改变时才更新（避免无限循环）
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      setState.setPageGridItems({
        ...state.pageGridItems,
        [state.currentPageId]: arrayMove(currentGridItems, activeIndex, overIndex)
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('=== DragEnd Debug ===');
    console.log('active.id:', active.id);
    console.log('over?.id:', over?.id);
    
    setState.setActiveId(null);
    
    // 通知文件夹对话框拖动已结束
    window.dispatchEvent(new CustomEvent('folderDragEnd'));



    // 清理临时预览
    const cleanPageGridItems = stripTempPreviews(state.pageGridItems);

    // 查找拖拽源
    let draggedFromGrid: GridItem | null = null;
    let sourcePageId: string | null = null;
    let draggedFromFolder: { folderId: string; item: IconItem } | null = null;
    
    // 先检查是否从文件夹中拖出
    for (const [pageId, items] of Object.entries(cleanPageGridItems)) {
      for (const item of items) {
        if (isFolder(item)) {
          const foundInFolder = item.items.find(folderItem => folderItem.id === active.id);
          if (foundInFolder) {
            draggedFromFolder = { folderId: item.id, item: foundInFolder };
            sourcePageId = pageId;
            break;
          }
        }
      }
      if (draggedFromFolder) break;
      
      const found = items.find(item => item.id === active.id);
      if (found) {
        draggedFromGrid = found;
        sourcePageId = pageId;
        break;
      }
    }
    
    const draggedFromDock = state.dockItems.find(item => item.id === active.id) || null;


    // 如果从文件夹拖出且没有拖到任何目标（拖到背景），从文件夹移除
    if (draggedFromFolder && !over) {
      console.log('Dragged from folder to background, removing from folder');
      await handleRemoveIconFromFolder(
        draggedFromFolder.folderId,
        draggedFromFolder.item.id,
        sourcePageId,
        cleanPageGridItems,
        state,
        setState
      );
      return;
    }

    // 如果从文件夹拖出到宫格，从文件夹移除并添加到宫格
    if (draggedFromFolder && over?.id === 'grid-droppable') {
      console.log('Dragged from folder to grid, moving to grid');
      await handleMoveFromFolderToGrid(
        draggedFromFolder.folderId,
        draggedFromFolder.item,
        sourcePageId,
        cleanPageGridItems,
        state,
        setState
      );
      return;
    }

    // 如果从文件夹拖出到另一个图标上
    if (draggedFromFolder && over?.id && over.id !== active.id && !over.id.toString().startsWith('sidebar-button-') && over.id !== 'dock-droppable' && over.id !== 'grid-droppable') {
      const currentGridItems = cleanPageGridItems[state.currentPageId] || [];
      const targetItem = currentGridItems.find(item => item.id === over.id);
      
      // 如果目标是文件夹，添加到文件夹
      if (targetItem && isFolder(targetItem)) {
        console.log('Dragged from folder to another folder');
        await handleMoveFromFolderToFolder(
          draggedFromFolder.folderId,
          draggedFromFolder.item,
          targetItem.id,
          sourcePageId,
          cleanPageGridItems,
          state,
          setState
        );
        return;
      }
      
      // 如果目标是普通图标，从文件夹移除并插入到目标位置
      if (targetItem && isIcon(targetItem)) {
        console.log('Dragged from folder to grid icon position');
        await handleMoveFromFolderToGridPosition(
          draggedFromFolder.folderId,
          draggedFromFolder.item,
          over.id as string,
          sourcePageId,
          cleanPageGridItems,
          state,
          setState
        );
        return;
      }
    }

    // 检查是否拖到另一个图标上
    if (over?.id && over.id !== active.id && !over.id.toString().startsWith('sidebar-button-') && over.id !== 'dock-droppable' && over.id !== 'grid-droppable') {
      const currentGridItems = cleanPageGridItems[state.currentPageId] || [];
      const targetItem = currentGridItems.find(item => item.id === over.id);
      
      // 如果目标是文件夹且拖拽源是图标，添加到文件夹
      if (targetItem && isFolder(targetItem) && draggedFromGrid && isIcon(draggedFromGrid)) {
        console.log('Adding to folder!');
        await handleAddToFolder(
          active.id as string,
          targetItem,
          draggedFromGrid,
          sourcePageId,
          cleanPageGridItems,
          state,
          setState
        );
        return;
      }
    }

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
      const itemToMove = currentDraggedFromGrid || draggedFromGrid;
      if (itemToMove && isIcon(itemToMove)) {
        await handleDropToDock(
          active.id as string,
          itemToMove,
          currentDraggedFromGrid ? state.currentPageId : sourcePageId,
          cleanPageGridItems,
          state,
          setState
        );
      }
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

    // 同页面排序 - 顺序已在 onDragOver 中实时更新，这里只需保存
    if (currentDraggedFromGrid && sourcePageId === state.currentPageId) {
      await savePageGridItems(state.pageGridItems);
      return;
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
// 添加图标到文件夹
async function handleAddToFolder(
  activeId: string,
  targetFolder: FolderItem,
  draggedItem: IconItem,
  sourcePageId: string | null,
  cleanPageGridItems: Record<string, GridItem[]>,
  state: DragState,
  setState: any
) {
  // 检查图标是否已在文件夹中
  if (targetFolder.items.some(item => item.id === activeId)) {
    return;
  }
  
  const currentGridItems = cleanPageGridItems[state.currentPageId] || [];
  
  // 更新文件夹，添加新图标
  const updatedFolder: FolderItem = {
    ...targetFolder,
    items: [...targetFolder.items, draggedItem]
  };
  
  // 替换文件夹
  const newCurrentItems = currentGridItems.map(item => 
    item.id === targetFolder.id ? updatedFolder : item
  );
  
  let newPageGridItems = {
    ...cleanPageGridItems,
    [state.currentPageId]: newCurrentItems
  };
  
  // 如果是从其他页面拖过来的，需要从源页面移除
  if (sourcePageId && sourcePageId !== state.currentPageId) {
    const sourceItems = cleanPageGridItems[sourcePageId].filter(item => item.id !== activeId);
    newPageGridItems[sourcePageId] = sourceItems;
  } else if (sourcePageId === state.currentPageId) {
    // 从当前页面移除原图标
    newPageGridItems[state.currentPageId] = newCurrentItems.filter(item => item.id !== activeId);
  }
  
  setState.setPageGridItems(newPageGridItems);
  await savePageGridItems(newPageGridItems);
}

async function handleDropToSidebarButton(
  activeId: string,
  targetPageId: string,
  draggedFromGrid: GridItem | null,
  sourcePageId: string | null,
  draggedFromDock: IconItem | null,
  cleanPageGridItems: Record<string, GridItem[]>,
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
  itemToMove: IconItem,
  fromPageId: string | null,
  cleanPageGridItems: Record<string, GridItem[]>,
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
      // 更新时间戳
      const { updateRemoteTimestamp } = await import('@/hooks/use-data-sync');
      await updateRemoteTimestamp('dockIcons');
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
  draggedFromDock: IconItem,
  cleanPageGridItems: Record<string, GridItem[]>,
  currentGridItems: GridItem[],
  state: DragState,
  setState: any
) {
  const overDockItem = state.dockItems.find(item => item.id === over?.id);
  
  if (over?.id === 'dock-droppable' && !overDockItem && over.id !== activeId) {
    // 拖到 Dock 空白区域，移到宫格
    const newCurrentItems = [...currentGridItems, draggedFromDock];
    const newPageGridItems = { ...cleanPageGridItems, [state.currentPageId]: newCurrentItems };
    
    setState.setPageGridItems(newPageGridItems);
    setState.setDockItems(
      state.dockItems.filter(item => item.id !== activeId)
    );

    await savePageGridItems(newPageGridItems);
    return;
  }

  if (over?.id !== 'dock-droppable') {
    // 拖到宫格
    const overItemIndex = currentGridItems.findIndex(item => item.id === over?.id);

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

    setState.setDockItems(
      state.dockItems.filter(item => item.id !== activeId)
    );

    setState.setPageGridItems(newPageGridItems);

    await savePageGridItems(newPageGridItems);
  }



}

async function handleCrossPageDrag(
  activeId: string,
  over: any,
  draggedFromGrid: GridItem,
  sourcePageId: string,
  cleanPageGridItems: Record<string, GridItem[]>,
  currentGridItems: GridItem[],
  state: DragState,
  setState: any
) {
  const overItemIndex = currentGridItems.findIndex(item => item.id === over?.id);

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
  currentGridItems: GridItem[],
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
    (async () => {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'dock_items',
            value: JSON.stringify(newItems),
          }),
        });
        // 更新时间戳
        const { updateRemoteTimestamp } = await import('@/hooks/use-data-sync');
        await updateRemoteTimestamp('dockIcons');
      } catch (error) {
        console.error('Failed to save dock items:', error);
      }
    })();
  }
}

async function savePageGridItems(pageGridItems: Record<string, GridItem[]>) {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'page_grid_items',
        value: JSON.stringify(pageGridItems),
      }),
    });
    // 更新时间戳
    const { updateRemoteTimestamp } = await import('@/hooks/use-data-sync');
    await updateRemoteTimestamp('gridIcons');
  } catch (error) {
    console.error('Failed to save page grid items:', error);
  }
}

// 从文件夹中移除图标
async function handleRemoveIconFromFolder(
  folderId: string,
  itemId: string,
  sourcePageId: string | null,
  cleanPageGridItems: Record<string, GridItem[]>,
  state: DragState,
  setState: any
) {
  if (!sourcePageId) return;
  
  const currentGridItems = cleanPageGridItems[sourcePageId] || [];
  const folder = currentGridItems.find(item => item.id === folderId && isFolder(item)) as FolderItem | undefined;
  if (!folder) return;

  const removedItem = folder.items.find(item => item.id === itemId);
  if (!removedItem) return;

  // 如果文件夹只剩2个图标，移除一个后解散文件夹
  if (folder.items.length === 2) {
    const remainingItem = folder.items.find(item => item.id !== itemId);
    if (remainingItem) {
      // 用剩余的图标替换文件夹
      const newCurrentItems = currentGridItems.map(item => 
        item.id === folderId ? remainingItem : item
      );
      const newPageItems = { ...cleanPageGridItems, [sourcePageId]: newCurrentItems };
      setState.setPageGridItems(newPageItems);
      await savePageGridItems(newPageItems);
    }
  } else if (folder.items.length === 1) {
    // 如果只剩1个图标，直接删除文件夹
    const newCurrentItems = currentGridItems.filter(item => item.id !== folderId);
    const newPageItems = { ...cleanPageGridItems, [sourcePageId]: newCurrentItems };
    setState.setPageGridItems(newPageItems);
    await savePageGridItems(newPageItems);
  } else {
    // 更新文件夹，移除图标
    const updatedFolder: FolderItem = {
      ...folder,
      items: folder.items.filter(item => item.id !== itemId)
    };
    
    const newCurrentItems = currentGridItems.map(item => 
      item.id === folderId ? updatedFolder : item
    );
    const newPageItems = { ...cleanPageGridItems, [sourcePageId]: newCurrentItems };
    setState.setPageGridItems(newPageItems);
    await savePageGridItems(newPageItems);
  }
}

// 从文件夹移动到宫格
async function handleMoveFromFolderToGrid(
  folderId: string,
  item: IconItem,
  sourcePageId: string | null,
  cleanPageGridItems: Record<string, GridItem[]>,
  state: DragState,
  setState: any
) {
  if (!sourcePageId) return;
  
  const currentGridItems = cleanPageGridItems[sourcePageId] || [];
  const folder = currentGridItems.find(f => f.id === folderId && isFolder(f)) as FolderItem | undefined;
  if (!folder) return;

  // 如果文件夹只剩2个图标，移除一个后解散文件夹
  if (folder.items.length === 2) {
    const remainingItem = folder.items.find(i => i.id !== item.id);
    if (remainingItem) {
      const newCurrentItems = currentGridItems.map(i => 
        i.id === folderId ? remainingItem : i
      );
      newCurrentItems.push(item);
      const newPageItems = { ...cleanPageGridItems, [sourcePageId]: newCurrentItems };
      setState.setPageGridItems(newPageItems);
      await savePageGridItems(newPageItems);
    }
  } else {
    // 更新文件夹，移除图标并添加到宫格
    const updatedFolder: FolderItem = {
      ...folder,
      items: folder.items.filter(i => i.id !== item.id)
    };
    
    const newCurrentItems = currentGridItems.map(i => 
      i.id === folderId ? updatedFolder : i
    );
    newCurrentItems.push(item);
    const newPageItems = { ...cleanPageGridItems, [sourcePageId]: newCurrentItems };
    setState.setPageGridItems(newPageItems);
    await savePageGridItems(newPageItems);
  }
}

// 从文件夹移动到另一个文件夹
async function handleMoveFromFolderToFolder(
  sourceFolderId: string,
  item: IconItem,
  targetFolderId: string,
  sourcePageId: string | null,
  cleanPageGridItems: Record<string, GridItem[]>,
  state: DragState,
  setState: any
) {
  if (!sourcePageId) return;
  
  const currentGridItems = cleanPageGridItems[sourcePageId] || [];
  const sourceFolder = currentGridItems.find(f => f.id === sourceFolderId && isFolder(f)) as FolderItem | undefined;
  const targetFolder = currentGridItems.find(f => f.id === targetFolderId && isFolder(f)) as FolderItem | undefined;
  if (!sourceFolder || !targetFolder) return;

  // 更新源文件夹
  const updatedSourceFolder: FolderItem = {
    ...sourceFolder,
    items: sourceFolder.items.filter(i => i.id !== item.id)
  };
  
  // 更新目标文件夹
  const updatedTargetFolder: FolderItem = {
    ...targetFolder,
    items: [...targetFolder.items, item]
  };
  
  let newCurrentItems = currentGridItems.map(i => {
    if (i.id === sourceFolderId) return updatedSourceFolder;
    if (i.id === targetFolderId) return updatedTargetFolder;
    return i;
  });
  
  // 如果源文件夹只剩1个图标，解散文件夹
  if (updatedSourceFolder.items.length === 1) {
    const remainingItem = updatedSourceFolder.items[0];
    newCurrentItems = newCurrentItems.map(i => 
      i.id === sourceFolderId ? remainingItem : i
    );
  } else if (updatedSourceFolder.items.length === 0) {
    newCurrentItems = newCurrentItems.filter(i => i.id !== sourceFolderId);
  }
  
  const newPageItems = { ...cleanPageGridItems, [sourcePageId]: newCurrentItems };
  setState.setPageGridItems(newPageItems);
  await savePageGridItems(newPageItems);
}

// 从文件夹移动到宫格指定位置
async function handleMoveFromFolderToGridPosition(
  folderId: string,
  item: IconItem,
  targetId: string,
  sourcePageId: string | null,
  cleanPageGridItems: Record<string, GridItem[]>,
  state: DragState,
  setState: any
) {
  if (!sourcePageId) return;
  
  const currentGridItems = cleanPageGridItems[sourcePageId] || [];
  const folder = currentGridItems.find(f => f.id === folderId && isFolder(f)) as FolderItem | undefined;
  if (!folder) return;

  const targetIndex = currentGridItems.findIndex(i => i.id === targetId);
  if (targetIndex === -1) return;

  // 如果文件夹只剩2个图标，移除一个后解散文件夹
  if (folder.items.length === 2) {
    const remainingItem = folder.items.find(i => i.id !== item.id);
    if (remainingItem) {
      let newCurrentItems = currentGridItems.map(i => 
        i.id === folderId ? remainingItem : i
      );
      newCurrentItems.splice(targetIndex, 0, item);
      const newPageItems = { ...cleanPageGridItems, [sourcePageId]: newCurrentItems };
      setState.setPageGridItems(newPageItems);
      await savePageGridItems(newPageItems);
    }
  } else {
    // 更新文件夹，移除图标并插入到指定位置
    const updatedFolder: FolderItem = {
      ...folder,
      items: folder.items.filter(i => i.id !== item.id)
    };
    
    let newCurrentItems = currentGridItems.map(i => 
      i.id === folderId ? updatedFolder : i
    );
    newCurrentItems.splice(targetIndex, 0, item);
    const newPageItems = { ...cleanPageGridItems, [sourcePageId]: newCurrentItems };
    setState.setPageGridItems(newPageItems);
    await savePageGridItems(newPageItems);
  }
}


