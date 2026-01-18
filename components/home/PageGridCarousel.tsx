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
  pageGridItems: Record<string, GridItem[]>;
  onItemsChange: (newPageGridItems: Record<string, GridItem[]>) => void | Promise<void>;

}

export const PageGridCarousel = ({
  currentSidebarItems,
  currentPageId,
  currentIconStyle,
  openInNewTab,
  pageGridItems,
  onItemsChange,
}: PageGridCarouselProps) => {
  return (
    <div className="flex-1 relative overflow-hidden">
      <motion.div
        className="w-full h-full flex flex-col"
        animate={{
          y: (() => {
            if (!currentSidebarItems || currentSidebarItems.length === 0) return "0%";
            const currentIndex = currentSidebarItems.findIndex((item) => item.id === currentPageId);
            return `${-currentIndex * 100}%`;
          })(),
        }}
        transition={{
          duration: 0.5,
          ease: [0.32, 0.72, 0, 1],
        }}
      >
        {currentSidebarItems &&
          currentSidebarItems.map((item) => (
            <div
              key={item.id}
              className="w-full flex-shrink-0 overflow-y-auto overflow-x-visible flex justify-center px-8 pb-8"
              style={{ height: "100%" }}
            >
              <div className="w-full" style={{ maxWidth: `${currentIconStyle.maxWidth}px` }}>
                <DraggableGrid
                  openInNewTab={openInNewTab}
                  iconStyle={currentIconStyle}
                  allPageItems={pageGridItems}
                  currentPageId={item.id}
                  onItemsChange={onItemsChange}
                />
              </div>
            </div>
          ))}
      </motion.div>
    </div>
  );
};
