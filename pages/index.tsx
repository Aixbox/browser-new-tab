import { useEffect, useRef, useState } from "react";
import { KVNamespace } from "@cloudflare/workers-types";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
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
import { useSortingMode } from "@/hooks/use-sorting-mode";
import { useSyncListeners } from "@/hooks/use-sync-listeners";
import { createDragHandlers } from "@/lib/drag-handlers";
import { createCustomCollisionDetection } from "@/lib/collision-detection";


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
  iconItems: any[] | null;
  dockItems: any[] | null;
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
    dockItems,
    setDockItems,
    currentSidebarItems,
    setCurrentSidebarItems,
    currentPageId,
    setCurrentPageId,
    activeId,
    setActiveId,
    dragOverPageId,
    setDragOverPageId,
  } = useHomeState({
    layoutMode,
    iconStyle,
    backgroundUrl,
    sidebarSettings,
    sidebarItems,
    dockItems: initialDockItems,
  });

  const [pageGridItems, setPageGridItems] = useState<Record<string, any[]>>(() => {
    const firstPageId = sidebarItems?.[0]?.id || "1";

    const testSites = [
      { name: "Bilibili", url: "https://www.bilibili.com/", icon: "https://www.bilibili.com/favicon.ico" },
      { name: "GitHub", url: "https://github.com/", icon: "https://github.com/favicon.ico" },
      { name: "Google", url: "https://www.google.com/", icon: "https://www.google.com/favicon.ico" },
      { name: "YouTube", url: "https://www.youtube.com/", icon: "https://www.youtube.com/favicon.ico" },
      { name: "Twitter", url: "https://twitter.com/", icon: "https://twitter.com/favicon.ico" },
      { name: "Reddit", url: "https://www.reddit.com/", icon: "https://www.reddit.com/favicon.ico" },
      { name: "Stack Overflow", url: "https://stackoverflow.com/", icon: "https://stackoverflow.com/favicon.ico" },
      { name: "MDN", url: "https://developer.mozilla.org/", icon: "https://developer.mozilla.org/favicon.ico" },
      { name: "Wikipedia", url: "https://www.wikipedia.org/", icon: "https://www.wikipedia.org/favicon.ico" },
      { name: "Amazon", url: "https://www.amazon.com/", icon: "https://www.amazon.com/favicon.ico" },
      { name: "Netflix", url: "https://www.netflix.com/", icon: "https://www.netflix.com/favicon.ico" },
      { name: "Spotify", url: "https://www.spotify.com/", icon: "https://www.spotify.com/favicon.ico" },
      { name: "Discord", url: "https://discord.com/", icon: "https://discord.com/favicon.ico" },
      { name: "Twitch", url: "https://www.twitch.tv/", icon: "https://www.twitch.tv/favicon.ico" },
      { name: "LinkedIn", url: "https://www.linkedin.com/", icon: "https://www.linkedin.com/favicon.ico" },
      { name: "Instagram", url: "https://www.instagram.com/", icon: "https://www.instagram.com/favicon.ico" },
      { name: "Facebook", url: "https://www.facebook.com/", icon: "https://www.facebook.com/favicon.ico" },
      { name: "TikTok", url: "https://www.tiktok.com/", icon: "https://www.tiktok.com/favicon.ico" },
      { name: "Zhihu", url: "https://www.zhihu.com/", icon: "https://www.zhihu.com/favicon.ico" },
      { name: "Weibo", url: "https://weibo.com/", icon: "https://weibo.com/favicon.ico" },
      { name: "Taobao", url: "https://www.taobao.com/", icon: "https://www.taobao.com/favicon.ico" },
      { name: "JD", url: "https://www.jd.com/", icon: "https://www.jd.com/favicon.ico" },
      { name: "Baidu", url: "https://www.baidu.com/", icon: "https://www.baidu.com/favicon.ico" },
      { name: "Douban", url: "https://www.douban.com/", icon: "https://www.douban.com/favicon.ico" },
      { name: "Dribbble", url: "https://dribbble.com/", icon: "https://dribbble.com/favicon.ico" },
      { name: "Behance", url: "https://www.behance.net/", icon: "https://www.behance.net/favicon.ico" },
      { name: "Medium", url: "https://medium.com/", icon: "https://medium.com/favicon.ico" },
      { name: "Dev.to", url: "https://dev.to/", icon: "https://dev.to/favicon.ico" },
      { name: "Hacker News", url: "https://news.ycombinator.com/", icon: "https://news.ycombinator.com/favicon.ico" },
      { name: "Product Hunt", url: "https://www.producthunt.com/", icon: "https://www.producthunt.com/favicon.ico" },
    ];

    const testIcons = testSites.map((site, i) => ({
      id: `test-icon-${Date.now()}-${i}`,
      name: site.name,
      url: site.url,
      iconType: "logo" as const,
      iconLogo: site.icon,
    }));

    return { [firstPageId]: testIcons };
  });

  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  const customCollisionDetection = createCustomCollisionDetection(currentSidebarSettings);

  const dragHandlers = createDragHandlers(
    { pageGridItems, currentPageId, dockItems },
    { setActiveId, setDragOverPageId, setCurrentPageId, setPageGridItems, setDockItems },
    switchTimeoutRef
  );

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

  useSortingMode({
    pageGridItems,
    currentPageId,
    setPageGridItems,
  });

  useSyncListeners({
    avatarUrl,
    setCurrentIconStyle,
    setCurrentBackgroundUrl,
    setCurrentLayoutMode,
    setCurrentSidebarSettings,
  });

  usePreloadAssets({
    pageGridItems,
    dockItems,
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
        collisionDetection: customCollisionDetection,
        onDragStart: dragHandlers.onDragStart,
        onDragOver: dragHandlers.onDragOver,
        onDragEnd: dragHandlers.onDragEnd,
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
        pageGridItems,
        currentPageId,
        dockItems,
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
          pageGridItems={pageGridItems}
          onPageGridItemsChange={async (newPageGridItems) => {
            setPageGridItems(newPageGridItems);
            try {
              await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  key: "page_grid_items",
                  value: JSON.stringify(newPageGridItems),
                }),
              });
              const { updateRemoteTimestamp } = await import("@/hooks/use-data-sync");
              await updateRemoteTimestamp("gridIcons");
            } catch (error) {
              console.error("Failed to save page grid items:", error);
            }
          }}
          dockItems={dockItems}
          onDockItemsChange={async (newDockItems) => {
            setDockItems(newDockItems);
            try {
              await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  key: "dock_items",
                  value: JSON.stringify(newDockItems),
                }),
              });
              const { updateRemoteTimestamp } = await import("@/hooks/use-data-sync");
              await updateRemoteTimestamp("dockIcons");
            } catch (error) {
              console.error("Failed to save dock items:", error);
            }
          }}
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
