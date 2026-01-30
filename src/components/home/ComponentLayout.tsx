import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";
import { SidebarWrapper } from "@/components/home/SidebarWrapper";
import { IconGrid } from "@/components/icon-grid";
import type { SidebarItem } from "@/components/custom-sidebar";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";
import type { GridItem } from "@/lib/grid-model";

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
  currentIconStyle: IconStyleSettings;
  gridItems: GridItem[];
  onGridItemsChange: (items: GridItem[]) => void;
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
  currentIconStyle,
  gridItems,
  onGridItemsChange,
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 pb-8">
          <div className="w-full h-full" style={{ maxWidth: `${currentIconStyle.maxWidth}px`, margin: "0 auto" }}>
            <IconGrid
              items={gridItems}
              onItemsChange={onGridItemsChange}
              openInNewTab={openInNewTab.icon}
              iconStyle={currentIconStyle}
            />
          </div>
        </div>
      </div>
    </>
  );
};
