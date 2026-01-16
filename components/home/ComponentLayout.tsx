import { Dock } from "@/components/dock";
import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";
import { SidebarWrapper } from "@/components/home/SidebarWrapper";
import { PageGridCarousel } from "@/components/home/PageGridCarousel";
import type { SidebarItem } from "@/components/custom-sidebar";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";

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
  pageGridItems: Record<string, any[]>;
  onPageGridItemsChange: (newPageGridItems: Record<string, any[]>) => void | Promise<void>;
  dockItems: any[];
  onDockItemsChange: (newDockItems: any[]) => void | Promise<void>;
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
  pageGridItems,
  onPageGridItemsChange,
  dockItems,
  onDockItemsChange,
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
          pageGridItems={pageGridItems}
          onItemsChange={onPageGridItemsChange}
        />
        <div className="flex-shrink-0">
          <Dock
            items={dockItems}
            onItemsChange={onDockItemsChange}
            openInNewTab={openInNewTab.icon}
            iconStyle={currentIconStyle}
          />
        </div>
      </div>
    </>
  );
};
