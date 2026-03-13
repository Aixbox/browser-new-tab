import { create } from "zustand";
import type { GridItem } from "@/lib/grid-model";

export type PageGridItems = Record<string, GridItem[]>;

interface GridStoreState {
  pageGridItems: PageGridItems;
  currentPageId: string;
  hasInitialized: boolean;

  // 派生视图（从 pageGridItems[currentPageId] 计算）
  gridItems: GridItem[];
  gridItemIds: string[];

  activeId: string | null;

  // 多页面 actions
  setPageGridItems: (items: PageGridItems) => void;
  setCurrentPageId: (pageId: string) => void;
  initialize: (pageGridItems: PageGridItems, currentPageId: string) => void;

  // 兼容 actions（操作映射到当前页面）
  setGridItems: (items: GridItem[] | ((prev: GridItem[]) => GridItem[])) => void;
  setGridItemIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setActiveId: (id: string | null) => void;
}

function deriveCurrentPage(pageGridItems: PageGridItems | null | undefined, pageId: string) {
  const raw = pageGridItems?.[pageId];
  const items = Array.isArray(raw) ? raw : [];
  return {
    gridItems: items,
    gridItemIds: items.map((item) => item.id),
  };
}

export const useGridStore = create<GridStoreState>((set) => ({
  pageGridItems: {},
  currentPageId: "1",
  hasInitialized: false,

  gridItems: [],
  gridItemIds: [],
  activeId: null,

  setPageGridItems: (items) =>
    set((state) => {
      const derived = deriveCurrentPage(items, state.currentPageId);
      return { pageGridItems: items, ...derived };
    }),

  setCurrentPageId: (pageId) =>
    set((state) => {
      if (pageId === state.currentPageId) return state;
      const derived = deriveCurrentPage(state.pageGridItems, pageId);
      return { currentPageId: pageId, ...derived };
    }),

  initialize: (pageGridItems, currentPageId) =>
    set(() => {
      const derived = deriveCurrentPage(pageGridItems, currentPageId);
      return {
        pageGridItems,
        currentPageId,
        hasInitialized: true,
        ...derived,
      };
    }),

  setGridItems: (items) =>
    set((state) => {
      const newItems =
        typeof items === "function" ? items(state.gridItems) : items;
      if (newItems === state.gridItems) return state;
      const newIds = newItems.map((item) => item.id);
      const newPageGridItems = {
        ...state.pageGridItems,
        [state.currentPageId]: newItems,
      };
      return {
        pageGridItems: newPageGridItems,
        gridItems: newItems,
        gridItemIds: newIds,
      };
    }),

  setGridItemIds: (ids) =>
    set((state) => {
      const newIds =
        typeof ids === "function" ? ids(state.gridItemIds) : ids;
      if (newIds === state.gridItemIds) return state;
      return { gridItemIds: newIds };
    }),

  setActiveId: (id) => set({ activeId: id }),
}));
