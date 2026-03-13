import { create } from "zustand";
import type { DockItem } from "@/lib/grid-model";

interface DockStoreState {
  dockItems: DockItem[];
  hasInitialized: boolean;
  setDockItems: (items: DockItem[] | ((prev: DockItem[]) => DockItem[])) => void;
  initialize: (items: DockItem[]) => void;
}

export const useDockStore = create<DockStoreState>((set) => ({
  dockItems: [],
  hasInitialized: false,
  setDockItems: (items) => set((state) => {
    const newItems = typeof items === 'function' ? items(state.dockItems) : items;
    if (newItems === state.dockItems) return state;
    return { dockItems: newItems };
  }),
  initialize: (items) => set({
    dockItems: items,
    hasInitialized: true,
  }),
}));
