import { motion } from "framer-motion";
import { DraggableGrid } from "@/components/draggable-grid";
import type { SidebarItem } from "@/components/custom-sidebar";
import type { IconStyleSettings } from "@/components/icon-settings";


interface PageGridCarouselProps {
  currentSidebarItems: SidebarItem[];
  currentPageId: string;
  currentIconStyle: IconStyleSettings;
  openInNewTab: boolean;
}

export const PageGridCarousel = ({
  currentSidebarItems,
  currentPageId,
  currentIconStyle,
  openInNewTab,
}: PageGridCarouselProps) => {
  return (
    <div className="flex-1 relative overflow-hidden">
      {/* 暂时移除轮播动画，简化到和官方示例一样 */}
      <div className="w-full h-full flex flex-col">
        <div
          className="w-full flex-shrink-0 overflow-y-auto overflow-x-visible flex justify-center px-8 pb-8"
          style={{ height: "100%" }}
        >
          <div className="w-full" style={{ maxWidth: `${currentIconStyle.maxWidth}px` }}>
            <DraggableGrid
              openInNewTab={openInNewTab}
              iconStyle={currentIconStyle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
