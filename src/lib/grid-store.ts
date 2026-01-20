import { create } from "zustand";
import type { GridItem } from "@/lib/grid-model";

interface GridStoreState {
  gridItems: GridItem[];
  activeId: string | null;
  setGridItems: (items: GridItem[] | ((prev: GridItem[]) => GridItem[])) => void;
  setActiveId: (id: string | null) => void;
  initialize: (gridItems: GridItem[]) => void;
}

export const useGridStore = create<GridStoreState>((set) => ({
  gridItems: [],
  activeId: null,
  setGridItems: (items) => set((state) => ({ 
    gridItems: typeof items === 'function' ? items(state.gridItems) : items 
  })),
  setActiveId: (id) => set({ activeId: id }),
  initialize: (gridItems) => set({ gridItems }),
}));
