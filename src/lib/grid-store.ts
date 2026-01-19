import { create } from "zustand";
import { shallow } from "zustand/shallow";
import type { GridItem } from "@/lib/grid-model";

interface GridStoreState {
  gridItems: GridItem[];  // 简化：移除多页面结构
  activeId: string | null;
  setGridItems: (items: GridItem[] | ((prev: GridItem[]) => GridItem[])) => void;
  setActiveId: (id: string | null) => void;
  initialize: (gridItems: GridItem[]) => void;
}

export const useGridStore = create<GridStoreState>((set) => ({
  gridItems: [],
  activeId: null,
  setGridItems: (items) => set((state) => {
    const newItems = typeof items === 'function' ? items(state.gridItems) : items;
    // 如果数组引用相同，不触发更新
    if (newItems === state.gridItems) return state;
    return { gridItems: newItems };
  }),
  setActiveId: (id) => set({ activeId: id }),
  initialize: (gridItems) => set({ gridItems }),
}));
