import { motion } from "framer-motion";
import { DraggableGrid } from "@/components/draggable-grid";
import type { SidebarItem } from "@/components/custom-sidebar";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { GridItem } from "@/lib/grid-model";


interface PageGridCarouselProps {
  currentSidebarItems: SidebarItem[];
  currentPageId: string;
  currentIconStyle: IconStyleSettings;
  openInNewTab: boolean;
  itemIds: string[];  // 改用 id 数组
  itemsMap: Record<string, GridItem>;  // 和 Map
  onItemsChange: (newItemIds: string[], newItemsMap: Record<string, GridItem>) => void | Promise<void>;
}

export const PageGridCarousel = ({
  currentSidebarItems,
  currentPageId,
  currentIconStyle,
  openInNewTab,
  itemIds,
  itemsMap,
  onItemsChange,
}: PageGridCarouselProps) => {
  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <div
          className="w-full flex-shrink-0 overflow-y-auto overflow-x-visible flex justify-center px-8 pb-8"
          style={{ height: "100%" }}
        >
          <div className="w-full" style={{ maxWidth: `${currentIconStyle.maxWidth}px` }}>
            <DraggableGrid
              openInNewTab={openInNewTab}
              iconStyle={currentIconStyle}
              itemIds={itemIds}
              itemsMap={itemsMap}
              onItemsChange={onItemsChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
