import { useEffect, useMemo } from "react";
import Head from "next/head";
import { KVNamespace } from "@cloudflare/workers-types";
import { ComponentLayout, MinimalLayout, SidebarWrapper } from "@/components/home";
import type { SidebarItem } from "@/components/custom-sidebar";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";
import { Background } from "@/components/background";
import { ContextMenu } from "@/components/context-menu";
import { SettingsDialog } from "@/components/settings-drawer";
import { useHomeState } from "@/hooks/use-home-state";
import { useSettingsSync } from "@/hooks/use-settings-sync";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useSidebarAutoHide } from "@/hooks/use-sidebar-auto-hide";
import { useSyncListeners } from "@/hooks/use-sync-listeners";
import { usePreloadAssets } from "@/hooks/use-preload-assets";
import { useGridStore } from "@/lib/grid-store";
import { useDockStore } from "@/lib/dock-store";
import type { GridItem, DockItem } from "@/lib/grid-model";
import builtinIcons from "@/json/index";

// 使用 Edge Runtime
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
  dockItems: DockItem[] | null;
  searchEngines: any[] | null;
  selectedEngine: string | null;
}

export default function Home({ 
  avatarUrl, 
  hasSecretKey, 
  sidebarItems, 
  openInNewTab, 
  layoutMode, 
  iconStyle, 
  backgroundUrl, 
  sidebarSettings,
  iconItems,
  dockItems: initialDockItems,
  searchEngines,
  selectedEngine
}: HomeProps) {
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
    setCurrentSidebarItems,
    currentPageId,
    setCurrentPageId,
  } = useHomeState({
    layoutMode,
    iconStyle,
    backgroundUrl,
    sidebarSettings,
    sidebarItems,
  });

  const {
    gridItems,
    setGridItems,
    initialize,
  } = useGridStore();

  const {
    dockItems,
    setDockItems,
    hasInitialized: dockHasInitialized,
    initialize: initializeDock,
  } = useDockStore();

  // 初始化图标数据
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

  // 初始化 Dock 数据
  useEffect(() => {
    if (!dockHasInitialized) {
      initializeDock(initialDockItems || []);
    }
  }, [initializeDock, initialDockItems, dockHasInitialized]);

  // 监听 gridItems 变化，保存到服务器
  useEffect(() => {
    if (gridItems.length === 0) return;
    
    const saveToServer = async () => {
      try {
        const secret = localStorage.getItem('secret_key');
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: 'setSetting',
            key: "icon_items",
            value: JSON.stringify(gridItems),
            secret,
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

  // 监听 dockItems 变化，保存到服务器
  useEffect(() => {
    if (!dockHasInitialized) return;

    const saveToServer = async () => {
      try {
        const secret = localStorage.getItem('secret_key');
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: 'setSetting',
            key: "dock_items",
            value: JSON.stringify(dockItems),
            secret,
          }),
        });
        const { updateRemoteTimestamp } = await import("@/hooks/use-data-sync");
        await updateRemoteTimestamp("dockIcons");
      } catch (error) {
        console.error("Failed to save dock items:", error);
      }
    };

    saveToServer();
  }, [dockItems, dockHasInitialized]);

  useSettingsSync(setCurrentLayoutMode, setCurrentIconStyle, setCurrentBackgroundUrl, setCurrentSidebarSettings);
  useSidebarAutoHide(currentSidebarSettings, setIsSidebarVisible);
  const { contextMenuPosition, handleContextMenu, closeContextMenu } = useContextMenu();

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

  return (
    <>
      <Head>
        <title>新标签页</title>
      </Head>

      <div 
        className="relative w-screen h-screen overflow-hidden"
        onContextMenu={handleContextMenu}
      >
        {/* 背景 */}
        <Background src={currentBackgroundUrl || "/alt-placeholder.png"} />

        {/* 临时重置按钮 - 开发调试用 */}
        <button
          onClick={async () => {
            if (confirm('确定要重置所有图标数据吗？这将清除所有自定义图标并恢复默认状态。')) {
              try {
                const secret = localStorage.getItem('secret_key');
                const response = await fetch('/api/reset-icons', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ secret }),
                });
                
                const result = await response.json();
                
                if (result.success) {
                  // 清除本地存储
                  localStorage.removeItem('page_grid_items');
                  alert('数据已重置！页面即将刷新...');
                  window.location.reload();
                } else {
                  alert('重置失败: ' + (result.message || result.error));
                }
              } catch (error) {
                console.error('重置失败:', error);
                alert('重置失败，请查看控制台');
              }
            }
          }}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-500/80 hover:bg-red-600/80 text-white rounded-full backdrop-blur-sm border-2 border-white/30 shadow-lg transition-all"
        >
          🔄 重置图标数据
        </button>

        {/* 侧边栏 */}
        {currentLayoutMode === "component" && (
          <SidebarWrapper
            avatarUrl={avatarUrl}
            sidebarItems={sidebarItems}
            sidebarSettings={currentSidebarSettings}
            isSidebarVisible={isSidebarVisible}
            onAvatarClick={() => setIsSettingsOpen(true)}
            onPageChange={setCurrentPageId}
            currentPageId={currentPageId}
            onItemsChange={setCurrentSidebarItems}
          />
        )}

        {/* 主内容区域 */}
        {currentLayoutMode === "component" ? (
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
            currentIconStyle={currentIconStyle}
            gridItems={gridItems}
            onGridItemsChange={setGridItems}
            dockItems={dockItems}
            onDockItemsChange={setDockItems}
          />
        ) : (
          <MinimalLayout
            openInNewTab={openInNewTab}
            searchEngines={searchEngines}
            selectedEngine={selectedEngine}
          />
        )}

        {/* 右键菜单 */}
        {contextMenuPosition && (
          <ContextMenu
            position={contextMenuPosition}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
        )}

        {/* 设置对话框 */}
        <SettingsDialog
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          initialAvatarUrl={avatarUrl}
          hasSecretKey={hasSecretKey}
          initialOpenInNewTab={openInNewTab}
          initialLayoutMode={layoutMode}
          initialIconStyle={iconStyle}
          initialBackgroundUrl={backgroundUrl}
          initialSidebarSettings={sidebarSettings}
        />
      </div>
    </>
  );
}

// SSR - 服务端获取数据
export async function getServerSideProps() {
  const { NEWTAB_KV, SECRET_KEY } = process.env as unknown as {
    NEWTAB_KV: KVNamespace;
    SECRET_KEY?: string;
  };

  let avatarUrl: string | null = null;
  let sidebarItems: SidebarItem[] | null = null;
  let openInNewTab = { search: true, icon: true };
  let layoutMode: 'component' | 'minimal' = 'component';
  let iconStyle: IconStyleSettings = { 
    size: 80, 
    borderRadius: 12, 
    opacity: 100, 
    spacing: 16, 
    showName: true, 
    nameSize: 12, 
    nameColor: '#ffffff', 
    maxWidth: 1500, 
    dockShowName: false 
  };
  let backgroundUrl: string | null = null;
  let sidebarSettings: SidebarSettings = { 
    position: 'left', 
    autoHide: false, 
    wheelScroll: false, 
    width: 64 
  };
  const hasSecretKey = !!SECRET_KEY;

  try {
    if (NEWTAB_KV) {
      avatarUrl = await NEWTAB_KV.get('avatar_url');
      
      const sidebarItemsStr = await NEWTAB_KV.get('sidebar_items');
      if (sidebarItemsStr) {
        sidebarItems = JSON.parse(sidebarItemsStr);
      }
      
      const openInNewTabStr = await NEWTAB_KV.get('open_in_new_tab');
      if (openInNewTabStr) {
        const settings = JSON.parse(openInNewTabStr);
        openInNewTab = {
          search: settings.search ?? true,
          icon: settings.icon ?? true,
        };
      }

      const layoutModeStr = await NEWTAB_KV.get('layout_mode');
      if (layoutModeStr && (layoutModeStr === 'component' || layoutModeStr === 'minimal')) {
        layoutMode = layoutModeStr;
      }

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

      backgroundUrl = await NEWTAB_KV.get('background_url');

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

      const searchEnginesStr = await NEWTAB_KV.get('search_engines');
      let searchEngines: any[] | null = null;
      if (searchEnginesStr) {
        try {
          searchEngines = JSON.parse(searchEnginesStr);
        } catch (error) {
          console.error('Failed to parse search engines:', error);
        }
      }

      const selectedEngine = await NEWTAB_KV.get('selected_engine');

      // 读取图标数据
      const iconItemsStr = await NEWTAB_KV.get('icon_items');
      let iconItems: any[] | null = null;
      if (iconItemsStr) {
        try {
          iconItems = JSON.parse(iconItemsStr);
        } catch (error) {
          console.error('Failed to parse icon items:', error);
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
      iconItems: null,
      dockItems: null,
      searchEngines: null,
      selectedEngine: null,
    },
  };
}
