import { useEffect } from "react";
import { HOME_EVENTS } from "@/lib/home-events";

type PageGridItems = Record<string, any[]>;

type SortingModeEvent = CustomEvent<{
  activeId?: string;
  targetId?: string;
  inSortingMode?: boolean;
}>;

interface SortingModeOptions {
  pageGridItems: PageGridItems;
  currentPageId: string;
  setPageGridItems: (items: PageGridItems) => void;
}

export const useSortingMode = ({
  pageGridItems,
  currentPageId,
  setPageGridItems,
}: SortingModeOptions) => {
  useEffect(() => {
    let lastSortTime = 0;
    const SORT_THROTTLE = 100;

    const handleSortingMode = (event: SortingModeEvent) => {
      console.log("[Index] Received sortingModeChange event:", event.detail);
      const { activeId, targetId, inSortingMode } = event.detail;

      if (inSortingMode && activeId && targetId) {
        const now = Date.now();
        if (now - lastSortTime < SORT_THROTTLE) {
          console.log("[Index] Throttled, skipping sort");
          return;
        }
        lastSortTime = now;

        console.log("[Index] Sorting mode activated, reordering:", activeId, "→", targetId);

        const currentItems = pageGridItems[currentPageId] || [];
        const oldIndex = currentItems.findIndex((item: any) => item.id === activeId);
        const newIndex = currentItems.findIndex((item: any) => item.id === targetId);

        console.log(
          "[Index] oldIndex:",
          oldIndex,
          "newIndex:",
          newIndex,
          "currentItems:",
          currentItems.length
        );

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newItems = [...currentItems];
          const [movedItem] = newItems.splice(oldIndex, 1);
          newItems.splice(newIndex, 0, movedItem);

          console.log("[Index] Reordered items, updating state");
          setPageGridItems({
            ...pageGridItems,
            [currentPageId]: newItems,
          });
        }
      }
    };

    window.addEventListener(HOME_EVENTS.sortingModeChange, handleSortingMode as EventListener);
    return () => window.removeEventListener(HOME_EVENTS.sortingModeChange, handleSortingMode as EventListener);
  }, [pageGridItems, currentPageId, setPageGridItems]);
};
