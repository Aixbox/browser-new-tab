import { Dock } from "@/components/dock";
import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";
import { SidebarWrapper } from "@/components/home/SidebarWrapper";
import { PageGridCarousel } from "@/components/home/PageGridCarousel";
import type { SidebarItem } from "@/components/custom-sidebar";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";
import type { DockItem, GridItem } from "@/lib/grid-model";


interface ComponentLayoutProps {
  avatarUrl: string | null;
  sidebarItems: SidebarItem[] | null;
  openInNewTab: { search: boolean; icon: boolean };
  searchEngines: any[] | null;
  selectedEngine: string | null;
  currentSidebarSettings: SidebarSettings;
  isSidebarVisible: boolean;
  onOpenSettings: () => void;
  onPageChange: (pageId: string) => void;
  currentPageId: string;
  onSidebarItemsChange: (items: SidebarItem[]) => void;
  currentSidebarItems: SidebarItem[];
  currentIconStyle: IconStyleSettings;
  itemIds: string[];  // 改用 id 数组（和官方示例一致）
  itemsMap: Record<string, GridItem>;  // Map 存储完整对象
  onItemsChange: (newItemIds: string[], newItemsMap: Record<string, GridItem>) => void | Promise<void>;
}

export const ComponentLayout = ({
  avatarUrl,
  sidebarItems,
  openInNewTab,
  searchEngines,
  selectedEngine,
  currentSidebarSettings,
  isSidebarVisible,
  onOpenSettings,
  onPageChange,
  currentPageId,
  onSidebarItemsChange,
  currentSidebarItems,
  currentIconStyle,
  itemIds,
  itemsMap,
  onItemsChange,
}: ComponentLayoutProps) => {
  return (
    <>
      <SidebarWrapper
        onAvatarClick={onOpenSettings}
        avatarUrl={avatarUrl}
        sidebarItems={sidebarItems}
        sidebarSettings={currentSidebarSettings}
        isSidebarVisible={isSidebarVisible}
        onPageChange={onPageChange}
        currentPageId={currentPageId}
        onItemsChange={onSidebarItemsChange}
      />
      <div
        className="h-full w-full relative flex flex-col overflow-hidden"
        style={{
          [currentSidebarSettings.position === "left" ? "paddingLeft" : "paddingRight"]:
            `${currentSidebarSettings.width}px`,
        }}
      >
        <div className="flex-shrink-0 flex flex-col items-center justify-center pt-12 pb-8 gap-6">
          <SimpleTimeDisplay />
          <SearchEngine
            openInNewTab={openInNewTab.search}
            initialSearchEngines={searchEngines}
            initialSelectedEngine={selectedEngine}
          />
        </div>
        <PageGridCarousel
          currentSidebarItems={currentSidebarItems}
          currentPageId={currentPageId}
          currentIconStyle={currentIconStyle}
          openInNewTab={openInNewTab.icon}
          itemIds={itemIds}
          itemsMap={itemsMap}
          onItemsChange={onItemsChange}
        />
        {/* Dock 暂时注释，简化到和官方示例一样 */}
        {/* <div className="flex-shrink-0">
          <Dock
            items={dockItems}
            onItemsChange={onDockItemsChange}
            openInNewTab={openInNewTab.icon}
            iconStyle={currentIconStyle}
          />
        </div> */}
      </div>
    </>
  );
};
