import Head from "next/head";
import { KVNamespace } from "@cloudflare/workers-types";
import { MinimalLayout, SidebarWrapper } from "@/components/home";
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
  searchEngines, 
  selectedEngine 
}: HomeProps) {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    currentLayoutMode,
    setCurrentLayoutMode,
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
    gridItems: [],
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
        {currentBackgroundUrl && (
          <Background src={currentBackgroundUrl} />
        )}

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
        <MinimalLayout
          openInNewTab={openInNewTab}
          searchEngines={searchEngines}
          selectedEngine={selectedEngine}
        />

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
      searchEngines: null,
      selectedEngine: null,
    },
  };
}
