import { create } from "zustand";
import type { DockItem, GridItem } from "@/lib/grid-model";

interface GridStoreState {
  pageGridItems: Record<string, GridItem[]>;
  dockItems: DockItem[];
  activeId: string | null;
  setPageGridItems: (items: Record<string, GridItem[]>) => void;
  setDockItems: (items: DockItem[]) => void;
  setActiveId: (id: string | null) => void;
  initialize: (pageGridItems: Record<string, GridItem[]>, dockItems?: DockItem[]) => void;
}

export const useGridStore = create<GridStoreState>((set) => ({
  pageGridItems: {},
  dockItems: [],
  activeId: null,
  setPageGridItems: (items) => set({ pageGridItems: items }),
  setDockItems: (items) => set({ dockItems: items }),
  setActiveId: (id) => set({ activeId: id }),
  initialize: (pageGridItems, dockItems = []) => set({ pageGridItems, dockItems }),
}));
