import { useEffect, useMemo, useRef, useCallback } from "react";
import { KVNamespace } from "@cloudflare/workers-types";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragStartEvent, DragOverEvent, DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ComponentLayout, HomeShell, MinimalLayout } from "@/components/home";
import type { SidebarItem } from "@/components/custom-sidebar";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";
import { useHomeState } from "@/hooks/use-home-state";
import { useSettingsSync } from "@/hooks/use-settings-sync";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useSidebarAutoHide } from "@/hooks/use-sidebar-auto-hide";
import { usePageWheelSwitch } from "@/hooks/use-page-wheel-switch";
import { usePreloadAssets } from "@/hooks/use-preload-assets";
import { useSyncListeners } from "@/hooks/use-sync-listeners";
import { closestCenter } from "@dnd-kit/core";
import { useGridStore } from "@/lib/grid-store";
import builtinIcons from "@/json/index";
import type { GridItem } from "@/lib/grid-model";



// 使用 Edge Runtime（与 UptimeFlare 对齐）
export const config = {
  runtime: 'experimental-edge',
};

interface HomeProps {
  avatarUrl: string | null;
  hasSecretKey: boolean;
  sidebarItems: SidebarItem[] | null;
  openInNewTab: { search: boolean; icon: boolean };
  layoutMode: 'component' | 'minimal';
  iconStyle: IconStyleSettings;
  backgroundUrl: string | null;
  sidebarSettings: SidebarSettings;
  iconItems: GridItem[] | null;
  dockItems: GridItem[] | null;

  searchEngines: any[] | null;
  selectedEngine: string | null;
}

export default function Home({ avatarUrl, hasSecretKey, sidebarItems, openInNewTab, layoutMode, iconStyle, backgroundUrl, sidebarSettings, iconItems, dockItems: initialDockItems, searchEngines, selectedEngine }: HomeProps) {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    currentLayoutMode,
    setCurrentLayoutMode,
    currentIconStyle,
    setCurrentIconStyle,
    currentBackgroundUrl,
    setCurrentBackgroundUrl,
    currentSidebarSettings,
    setCurrentSidebarSettings,
    isSidebarVisible,
    setIsSidebarVisible,
    currentSidebarItems,
    setCurrentSidebarItems,
    currentPageId,
    setCurrentPageId,
    dragOverPageId,
    setDragOverPageId,
  } = useHomeState({
    layoutMode,
    iconStyle,
    backgroundUrl,
    sidebarSettings,
    sidebarItems,
  });

  const {
    gridItems,
    activeId,
    setGridItems,
    setGridItemIds,
    setActiveId,
    initialize,
  } = useGridStore();

  // 监听 gridItems 变化，保存到服务器
  useEffect(() => {
    if (gridItems.length === 0) return;
    
    const saveToServer = async () => {
      try {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "icon_items",
            value: JSON.stringify(gridItems),
          }),
        });
        const { updateRemoteTimestamp } = await import("@/hooks/use-data-sync");
        await updateRemoteTimestamp("gridIcons");
      } catch (error) {
        console.error("Failed to save grid items:", error);
      }
    };
    
    saveToServer();
  }, [gridItems]);

  const baseTime = useMemo(() => Date.now(), []);
  const initialGridItems = useMemo<GridItem[]>(() => {
    if (iconItems && iconItems.length > 0) {
      return iconItems as GridItem[];
    }

    const fallbackIcons: GridItem[] = builtinIcons.map((item, index) => ({
      ...item,
      iconType: item.iconType as "logo" | "image" | "text",
      id: `${item.id}-${baseTime}-${index}`,
    }));

    return fallbackIcons;
  }, [baseTime, iconItems]);

  useEffect(() => {
    if (gridItems.length === 0) {
      initialize(initialGridItems);
    }
  }, [initialize, initialGridItems, gridItems]);

  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  // 直接在组件中定义 drag handlers，可以访问最新的 store 状态
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, [setActiveId]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over, active } = event;

    if (!over) return;
    if (active.id === over.id) return;

    // 只更新 ID 顺序，不更新完整数据
    setGridItemIds((ids: string[]) => {
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      
      if (oldIndex === newIndex) return ids;
      
      console.log('[DragOver] 更新 ID 顺序:', active.id, '→', over.id);
      return arrayMove(ids, oldIndex, newIndex);
    });
  }, [setGridItemIds]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    
    // 直接从 store 获取最新的 gridItemIds
    const { gridItemIds: latestIds, gridItems: latestItems } = useGridStore.getState();
    
    console.log('[DragEnd] 使用最新的 gridItemIds:', latestIds);
    
    // 根据最新的 gridItemIds 重新排列 gridItems
    const itemMap = new Map(latestItems.map((item: GridItem) => [item.id, item]));
    const reorderedItems = latestIds
      .map((id: string) => itemMap.get(id))
      .filter((item): item is GridItem => item !== undefined);
    
    console.log('[DragEnd] 更新完整数据，保存到服务器');
    setGridItems(reorderedItems);
  }, [setActiveId, setGridItems]);

  useSettingsSync(setCurrentLayoutMode, setCurrentIconStyle, setCurrentBackgroundUrl, setCurrentSidebarSettings);
  useSidebarAutoHide(currentSidebarSettings, setIsSidebarVisible);
  const { contextMenuPosition, handleContextMenu, closeContextMenu } = useContextMenu();
  const { animationDirection } = usePageWheelSwitch(
    currentSidebarItems,
    currentPageId,
    setCurrentPageId,
    currentLayoutMode === "component"
  );

  useEffect(() => {
    console.log("[Animation] Direction changed to:", animationDirection, "Page:", currentPageId);
  }, [animationDirection, currentPageId]);



  useSyncListeners({
    avatarUrl,
    setCurrentIconStyle,
    setCurrentBackgroundUrl,
    setCurrentLayoutMode,
    setCurrentSidebarSettings,
  });

  usePreloadAssets({
    gridItems,
    avatarUrl,
  });

  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <HomeShell
      title="新标签页"
      backgroundUrl={currentBackgroundUrl}
      onContextMenu={handleContextMenu}
      dndContextProps={{
        sensors,
        collisionDetection: closestCenter,
        onDragStart: handleDragStart,
        onDragOver: handleDragOver,
        onDragEnd: handleDragEnd,
      }}
      overlays={{
        contextMenuPosition,
        onContextMenuSettings: () => setIsSettingsOpen(true),
        onCloseContextMenu: closeContextMenu,
        isSettingsOpen,
        onSettingsOpenChange: setIsSettingsOpen,
        avatarUrl,
        hasSecretKey,
        openInNewTab,
        layoutMode,
        iconStyle,
        backgroundUrl,
        sidebarSettings,
        activeId,
        gridItems,
        currentIconStyle,
      }}
    >
      {currentLayoutMode === "component" && (
        <ComponentLayout
          avatarUrl={avatarUrl}
          sidebarItems={sidebarItems}
          openInNewTab={openInNewTab}
          searchEngines={searchEngines}
          selectedEngine={selectedEngine}
          currentSidebarSettings={currentSidebarSettings}
          isSidebarVisible={isSidebarVisible}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onPageChange={setCurrentPageId}
          currentPageId={currentPageId}
          onSidebarItemsChange={setCurrentSidebarItems}
          currentSidebarItems={currentSidebarItems}
          currentIconStyle={currentIconStyle}
        />
      )}
      {currentLayoutMode === "minimal" && (
        <MinimalLayout
          openInNewTab={openInNewTab}
          searchEngines={searchEngines}
          selectedEngine={selectedEngine}
        />
      )}
    </HomeShell>
  );
}


// SSR - 服务端获取数据（与 UptimeFlare 对齐）
export async function getServerSideProps() {
  const { NEWTAB_KV, SECRET_KEY } = process.env as unknown as {
    NEWTAB_KV: KVNamespace;
    SECRET_KEY?: string;
  };

  let avatarUrl: string | null = null;
  let sidebarItems: SidebarItem[] | null = null;
  let openInNewTab = { search: true, icon: true }; // 默认都在新标签页打开
  let layoutMode: 'component' | 'minimal' = 'component'; // 默认组件模式
  let iconStyle: IconStyleSettings = { size: 80, borderRadius: 12, opacity: 100, spacing: 16, showName: true, nameSize: 12, nameColor: '#ffffff', maxWidth: 1500, dockShowName: false }; // 默认图标样式
  let backgroundUrl: string | null = null; // 默认背景
  let sidebarSettings: SidebarSettings = { position: 'left', autoHide: false, wheelScroll: false, width: 64 }; // 默认侧边栏设置
  let iconItems: any[] | null = null; // 图标数据
  const hasSecretKey = !!SECRET_KEY;

  try {
    // 从 KV 读取数据
    if (NEWTAB_KV) {
      avatarUrl = await NEWTAB_KV.get('avatar_url');
      const sidebarItemsStr = await NEWTAB_KV.get('sidebar_items');
      if (sidebarItemsStr) {
        sidebarItems = JSON.parse(sidebarItemsStr);
      }
      
      // 读取打开方式设置
      const openInNewTabStr = await NEWTAB_KV.get('open_in_new_tab');
      if (openInNewTabStr) {
        const settings = JSON.parse(openInNewTabStr);
        openInNewTab = {
          search: settings.search ?? true,
          icon: settings.icon ?? true,
        };
      }

      // 读取布局模式
      const layoutModeStr = await NEWTAB_KV.get('layout_mode');
      if (layoutModeStr && (layoutModeStr === 'component' || layoutModeStr === 'minimal')) {
        layoutMode = layoutModeStr;
      }

      // 读取图标样式
      const iconStyleStr = await NEWTAB_KV.get('icon_style');
      if (iconStyleStr) {
        const style = JSON.parse(iconStyleStr);
        iconStyle = {
          size: style.size ?? 80,
          borderRadius: style.borderRadius ?? 12,
          opacity: style.opacity ?? 100,
          spacing: style.spacing ?? 16,
          showName: style.showName ?? true,
          nameSize: style.nameSize ?? 12,
          nameColor: style.nameColor ?? '#ffffff',
          maxWidth: style.maxWidth ?? 1500,
          dockShowName: style.dockShowName ?? false,
        };
      }

      // 读取背景链接
      backgroundUrl = await NEWTAB_KV.get('background_url');

      // 读取侧边栏设置
      const sidebarSettingsStr = await NEWTAB_KV.get('sidebar_settings');
      if (sidebarSettingsStr) {
        const settings = JSON.parse(sidebarSettingsStr);
        sidebarSettings = {
          position: settings.position ?? 'left',
          autoHide: settings.autoHide ?? false,
          wheelScroll: settings.wheelScroll ?? false,
          width: settings.width ?? 64,
        };
      }

      // 读取图标数据（兼容旧格式）
      const pageGridItemsStr = await NEWTAB_KV.get('page_grid_items');
      if (pageGridItemsStr) {
        const pageData = JSON.parse(pageGridItemsStr);
        // 使用第一个页面的数据作为 iconItems
        const firstPageId = Object.keys(pageData)[0];
        iconItems = firstPageId ? pageData[firstPageId] : null;
      } else {
        // 兼容旧的单页面数据
        const iconItemsStr = await NEWTAB_KV.get('icon_items');
        if (iconItemsStr) {
          iconItems = JSON.parse(iconItemsStr);
        }
      }

      // 读取 Dock 数据
      const dockItemsStr = await NEWTAB_KV.get('dock_items');
      let dockItems: any[] | null = null;
      if (dockItemsStr) {
        try {
          dockItems = JSON.parse(dockItemsStr);
        } catch (error) {
          console.error('Failed to parse dock items:', error);
        }
      }

      // 读取搜索引擎配置
      const searchEnginesStr = await NEWTAB_KV.get('search_engines');
      let searchEngines: any[] | null = null;
      if (searchEnginesStr) {
        try {
          searchEngines = JSON.parse(searchEnginesStr);
        } catch (error) {
          console.error('Failed to parse search engines:', error);
        }
      }

      // 读取选中的搜索引擎
      const selectedEngine = await NEWTAB_KV.get('selected_engine');

      return {
        props: {
          avatarUrl,
          hasSecretKey,
          sidebarItems,
          openInNewTab,
          layoutMode,
          iconStyle,
          backgroundUrl,
          sidebarSettings,
          iconItems,
          dockItems,
          searchEngines,
          selectedEngine,
        },
      };
    }
  } catch (error) {
    console.error('Failed to load settings from KV:', error);
  }

  return {
    props: {
      avatarUrl,
      hasSecretKey,
      sidebarItems,
      openInNewTab,
      layoutMode,
      iconStyle,
      backgroundUrl,
      sidebarSettings,
      iconItems,
      dockItems: null,
      searchEngines: null,
      selectedEngine: null,
    },
  };
}
