import { create } from "zustand";
import type { GridItem } from "@/lib/grid-model";

interface GridStoreState {
  gridItems: GridItem[];  // 完整的图标数据
  gridItemIds: string[];  // 只存储 ID 顺序，用于拖拽时的快速更新
  activeId: string | null;
  setGridItems: (items: GridItem[] | ((prev: GridItem[]) => GridItem[])) => void;
  setGridItemIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setActiveId: (id: string | null) => void;
  initialize: (gridItems: GridItem[]) => void;
}

export const useGridStore = create<GridStoreState>((set) => ({
  gridItems: [],
  gridItemIds: [],
  activeId: null,
  setGridItems: (items) => set((state) => {
    const newItems = typeof items === 'function' ? items(state.gridItems) : items;
    // 如果数组引用相同，不触发更新
    if (newItems === state.gridItems) return state;
    // 同时更新 gridItemIds
    const newIds = newItems.map(item => item.id);
    return { gridItems: newItems, gridItemIds: newIds };
  }),
  setGridItemIds: (ids) => set((state) => {
    const newIds = typeof ids === 'function' ? ids(state.gridItemIds) : ids;
    if (newIds === state.gridItemIds) return state;
    return { gridItemIds: newIds };
  }),
  setActiveId: (id) => set({ activeId: id }),
  initialize: (gridItems) => set({ 
    gridItems, 
    gridItemIds: gridItems.map(item => item.id) 
  }),
}));
