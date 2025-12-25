import { useState, useEffect } from "react";
import Head from "next/head";
import { KVNamespace } from '@cloudflare/workers-types';
import { Background } from "@/components/background";
import { SidebarDemo } from "@/components/sidebar-demo";
import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";
import { DraggableGrid } from "@/components/draggable-grid";
import { SettingsDialog } from "@/components/settings-drawer";
import { SidebarItem } from "@/components/custom-sidebar";
import { GearIcon } from "@radix-ui/react-icons";
import type { IconStyleSettings } from "@/components/icon-settings";

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
}

export default function Home({ avatarUrl, hasSecretKey, sidebarItems, openInNewTab, layoutMode, iconStyle }: HomeProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentLayoutMode, setCurrentLayoutMode] = useState<'component' | 'minimal'>(layoutMode);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentIconStyle, setCurrentIconStyle] = useState<IconStyleSettings>(iconStyle);

  // 监听布局模式变化
  useEffect(() => {
    const handleLayoutModeChange = (e: CustomEvent) => {
      if (e.detail?.mode) {
        setCurrentLayoutMode(e.detail.mode);
      }
    };
    
    window.addEventListener('layoutModeChanged', handleLayoutModeChange as EventListener);
    return () => window.removeEventListener('layoutModeChanged', handleLayoutModeChange as EventListener);
  }, []);

  // 监听图标样式变化
  useEffect(() => {
    const handleIconStyleChange = (e: CustomEvent) => {
      if (e.detail) {
        setCurrentIconStyle(e.detail);
      }
    };
    
    window.addEventListener('iconStyleChanged', handleIconStyleChange as EventListener);
    return () => window.removeEventListener('iconStyleChanged', handleIconStyleChange as EventListener);
  }, []);

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // 点击其他地方关闭菜单
  useEffect(() => {
    const handleClick = () => setContextMenuPosition(null);
    if (contextMenuPosition) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenuPosition]);

  return (
    <>
      <Head>
        <title>新标签页</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="h-dvh w-full" onContextMenu={handleContextMenu}>
        <div className="relative h-full w-full">
          <Background 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/alt-g7Cv2QzqL3k6ey3igjNYkM32d8Fld7.mp4" 
            placeholder="/alt-placeholder.png" 
          />
          
          {/* 组件模式 */}
          {currentLayoutMode === 'component' && (
            <>
              <SidebarDemo 
                onAvatarClick={() => setIsSettingsOpen(true)}
                avatarUrl={avatarUrl}
                initialSidebarItems={sidebarItems}
              />
              <div className="h-full w-full relative pl-16 flex flex-col">
                {/* 顶部区域：时间和搜索框 */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center pt-12 pb-8 gap-6">
                  <SimpleTimeDisplay />
                  <SearchEngine openInNewTab={openInNewTab.search} />
                </div>
                
                {/* 图标网格区域 */}
                <div className="flex-1 overflow-y-auto flex justify-center px-8 pb-8">
                  <div 
                    className="w-full"
                    style={{ maxWidth: `${currentIconStyle.maxWidth}px` }}
                  >
                    <DraggableGrid openInNewTab={openInNewTab.icon} iconStyle={currentIconStyle} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 极简模式 */}
          {currentLayoutMode === 'minimal' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-8 z-10">
              <SimpleTimeDisplay />
              <SearchEngine openInNewTab={openInNewTab.search} />
            </div>
          )}

          {/* 右键菜单 */}
          {contextMenuPosition && (
            <div
              className="fixed bg-primary/20 backdrop-blur-md border-2 border-white/30 rounded-lg shadow-xl z-[100] py-1 min-w-[160px]"
              style={{
                left: `${contextMenuPosition.x}px`,
                top: `${contextMenuPosition.y}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setIsSettingsOpen(true);
                  setContextMenuPosition(null);
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <GearIcon className="w-4 h-4" />
                <span>设置</span>
              </button>
            </div>
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
          />
        </div>
      </main>
    </>
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
  let iconStyle: IconStyleSettings = { size: 80, borderRadius: 12, opacity: 100, spacing: 16, showName: true, nameSize: 12, nameColor: '#ffffff', maxWidth: 1500 }; // 默认图标样式
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
        };
      }
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
    },
  };
}
