import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { KVNamespace } from '@cloudflare/workers-types';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { Background } from "@/components/background";
import { SidebarDemo } from "@/components/sidebar-demo";
import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";
import { DraggableGrid } from "@/components/draggable-grid";
import { SettingsDialog } from "@/components/settings-drawer";
import { Dock } from "@/components/dock";
import { SidebarItem } from "@/components/custom-sidebar";
import { DragOverlayItem } from "@/components/drag-overlay-item";
import { ContextMenu } from "@/components/context-menu";
import { useSettingsSync } from "@/hooks/use-settings-sync";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useSidebarAutoHide } from "@/hooks/use-sidebar-auto-hide";
import { createDragHandlers } from "@/lib/drag-handlers";
import { createCustomCollisionDetection } from "@/lib/collision-detection";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";

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
}

export default function Home({ avatarUrl, hasSecretKey, sidebarItems, openInNewTab, layoutMode, iconStyle, backgroundUrl, sidebarSettings, iconItems }: HomeProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentLayoutMode, setCurrentLayoutMode] = useState<'component' | 'minimal'>(layoutMode);
  const [currentIconStyle, setCurrentIconStyle] = useState<IconStyleSettings>(iconStyle);
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(backgroundUrl);
  const [currentSidebarSettings, setCurrentSidebarSettings] = useState<SidebarSettings>(sidebarSettings);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [dockItems, setDockItems] = useState<any[]>([]);
  const [pageGridItems, setPageGridItems] = useState<Record<string, any[]>>(() => {
    const firstPageId = sidebarItems?.[0]?.id || '1';
    return { [firstPageId]: iconItems || [] };
  });
  const [currentPageId, setCurrentPageId] = useState<string>(sidebarItems?.[0]?.id || '1');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
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

  // 清理定时器
  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>新标签页</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="h-dvh w-full" onContextMenu={handleContextMenu}>
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={dragHandlers.onDragStart}
          onDragOver={dragHandlers.onDragOver}
          onDragEnd={dragHandlers.onDragEnd}
        >
          <div className="relative h-full w-full">
            <Background 
              src={currentBackgroundUrl || "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/alt-g7Cv2QzqL3k6ey3igjNYkM32d8Fld7.mp4"}
              placeholder="/alt-placeholder.png" 
            />
            
            {/* 组件模式 */}
            {currentLayoutMode === 'component' && (
              <>
                <div 
                  className={`absolute top-0 ${currentSidebarSettings.position === 'left' ? 'left-0' : 'right-0'} h-full transition-transform duration-300 z-20`}
                  style={{
                    transform: isSidebarVisible ? 'translateX(0)' : currentSidebarSettings.position === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
                    width: `${currentSidebarSettings.width}px`
                  }}
                >
                  <SidebarDemo 
                    onAvatarClick={() => setIsSettingsOpen(true)}
                    avatarUrl={avatarUrl}
                    initialSidebarItems={sidebarItems}
                    wheelScroll={currentSidebarSettings.wheelScroll}
                    width={currentSidebarSettings.width}
                    onPageChange={setCurrentPageId}
                    currentPageId={currentPageId}
                  />
                </div>
                <div 
                  className="h-full w-full relative flex flex-col overflow-hidden"
                  style={{
                    [currentSidebarSettings.position === 'left' ? 'paddingLeft' : 'paddingRight']: `${currentSidebarSettings.width}px`
                  }}
                >
                  {/* 顶部区域：时间和搜索框 */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center pt-12 pb-8 gap-6">
                    <SimpleTimeDisplay />
                    <SearchEngine openInNewTab={openInNewTab.search} />
                  </div>
                  
                  {/* 图标网格区域 */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center px-8 pb-8">
                    <div 
                      className="w-full"
                      style={{ maxWidth: `${currentIconStyle.maxWidth}px` }}
                    >
                      <DraggableGrid 
                        openInNewTab={openInNewTab.icon} 
                        iconStyle={currentIconStyle} 
                        allPageItems={pageGridItems}
                        currentPageId={currentPageId}
                        onItemsChange={(newPageGridItems) => {
                          setPageGridItems(newPageGridItems);
                          // 保存到 KV
                          fetch('/api/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              key: 'page_grid_items',
                              value: JSON.stringify(newPageGridItems),
                            }),
                          }).catch(error => console.error('Failed to save page grid items:', error));
                        }}
                      />
                    </div>
                  </div>

                  {/* Dock 栏 */}
                  <div className="flex-shrink-0">
                    <Dock 
                      items={dockItems}
                      onItemsChange={setDockItems}
                      openInNewTab={openInNewTab.icon}
                      iconStyle={currentIconStyle}
                    />
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
              <ContextMenu
                position={contextMenuPosition}
                onSettingsClick={() => {
                  setIsSettingsOpen(true);
                  closeContextMenu();
                }}
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

          {/* DragOverlay - 拖拽时显示的图标副本 */}
          <DragOverlay>
            {activeId ? (
              <DragOverlayItem 
                id={activeId}
                pageGridItems={pageGridItems}
                currentPageId={currentPageId}
                dockItems={dockItems}
                iconStyle={currentIconStyle}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
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
    },
  };
}
