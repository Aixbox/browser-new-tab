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
import { usePageWheelSwitch } from "@/hooks/use-page-wheel-switch";
import { useDataSync } from "@/hooks/use-data-sync";
import { createDragHandlers } from "@/lib/drag-handlers";
import { imageCache } from "@/lib/image-cache";
import { createCustomCollisionDetection } from "@/lib/collision-detection";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";
import { motion } from "framer-motion";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentLayoutMode, setCurrentLayoutMode] = useState<'component' | 'minimal'>(layoutMode);
  const [currentIconStyle, setCurrentIconStyle] = useState<IconStyleSettings>(iconStyle);
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(backgroundUrl);
  const [currentSidebarSettings, setCurrentSidebarSettings] = useState<SidebarSettings>(sidebarSettings);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [dockItems, setDockItems] = useState<any[]>(initialDockItems || []);
  const [currentSidebarItems, setCurrentSidebarItems] = useState<SidebarItem[]>(sidebarItems || []);
  const [pageGridItems, setPageGridItems] = useState<Record<string, any[]>>(() => {
    const firstPageId = sidebarItems?.[0]?.id || '1';
    
    // 创建 30 个不同的测试图标
    const testSites = [
      { name: 'Bilibili', url: 'https://www.bilibili.com/', icon: 'https://www.bilibili.com/favicon.ico' },
      { name: 'GitHub', url: 'https://github.com/', icon: 'https://github.com/favicon.ico' },
      { name: 'Google', url: 'https://www.google.com/', icon: 'https://www.google.com/favicon.ico' },
      { name: 'YouTube', url: 'https://www.youtube.com/', icon: 'https://www.youtube.com/favicon.ico' },
      { name: 'Twitter', url: 'https://twitter.com/', icon: 'https://twitter.com/favicon.ico' },
      { name: 'Reddit', url: 'https://www.reddit.com/', icon: 'https://www.reddit.com/favicon.ico' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com/', icon: 'https://stackoverflow.com/favicon.ico' },
      { name: 'MDN', url: 'https://developer.mozilla.org/', icon: 'https://developer.mozilla.org/favicon.ico' },
      { name: 'Wikipedia', url: 'https://www.wikipedia.org/', icon: 'https://www.wikipedia.org/favicon.ico' },
      { name: 'Amazon', url: 'https://www.amazon.com/', icon: 'https://www.amazon.com/favicon.ico' },
      { name: 'Netflix', url: 'https://www.netflix.com/', icon: 'https://www.netflix.com/favicon.ico' },
      { name: 'Spotify', url: 'https://www.spotify.com/', icon: 'https://www.spotify.com/favicon.ico' },
      { name: 'Discord', url: 'https://discord.com/', icon: 'https://discord.com/favicon.ico' },
      { name: 'Twitch', url: 'https://www.twitch.tv/', icon: 'https://www.twitch.tv/favicon.ico' },
      { name: 'LinkedIn', url: 'https://www.linkedin.com/', icon: 'https://www.linkedin.com/favicon.ico' },
      { name: 'Instagram', url: 'https://www.instagram.com/', icon: 'https://www.instagram.com/favicon.ico' },
      { name: 'Facebook', url: 'https://www.facebook.com/', icon: 'https://www.facebook.com/favicon.ico' },
      { name: 'TikTok', url: 'https://www.tiktok.com/', icon: 'https://www.tiktok.com/favicon.ico' },
      { name: 'Zhihu', url: 'https://www.zhihu.com/', icon: 'https://www.zhihu.com/favicon.ico' },
      { name: 'Weibo', url: 'https://weibo.com/', icon: 'https://weibo.com/favicon.ico' },
      { name: 'Taobao', url: 'https://www.taobao.com/', icon: 'https://www.taobao.com/favicon.ico' },
      { name: 'JD', url: 'https://www.jd.com/', icon: 'https://www.jd.com/favicon.ico' },
      { name: 'Baidu', url: 'https://www.baidu.com/', icon: 'https://www.baidu.com/favicon.ico' },
      { name: 'Douban', url: 'https://www.douban.com/', icon: 'https://www.douban.com/favicon.ico' },
      { name: 'Dribbble', url: 'https://dribbble.com/', icon: 'https://dribbble.com/favicon.ico' },
      { name: 'Behance', url: 'https://www.behance.net/', icon: 'https://www.behance.net/favicon.ico' },
      { name: 'Medium', url: 'https://medium.com/', icon: 'https://medium.com/favicon.ico' },
      { name: 'Dev.to', url: 'https://dev.to/', icon: 'https://dev.to/favicon.ico' },
      { name: 'Hacker News', url: 'https://news.ycombinator.com/', icon: 'https://news.ycombinator.com/favicon.ico' },
      { name: 'Product Hunt', url: 'https://www.producthunt.com/', icon: 'https://www.producthunt.com/favicon.ico' },
    ];
    
    const testIcons = testSites.map((site, i) => ({
      id: `test-icon-${Date.now()}-${i}`,
      name: site.name,
      url: site.url,
      iconType: 'logo' as const,
      iconLogo: site.icon,
    }));
    
    return { [firstPageId]: testIcons };
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
  const { animationDirection } = usePageWheelSwitch(currentSidebarItems, currentPageId, setCurrentPageId, currentLayoutMode === 'component');

  // 调试动画方向
  useEffect(() => {
    console.log('[Animation] Direction changed to:', animationDirection, 'Page:', currentPageId);
  }, [animationDirection, currentPageId]);

  // 监听排序模式变化 - 实时重排数组
  useEffect(() => {
    let lastSortTime = 0;
    const SORT_THROTTLE = 100; // 100ms 节流
    
    const handleSortingMode = (e: CustomEvent) => {
      console.log('[Index] Received sortingModeChange event:', e.detail);
      const { activeId, targetId, inSortingMode } = e.detail;
      
      if (inSortingMode && activeId && targetId) {
        const now = Date.now();
        if (now - lastSortTime < SORT_THROTTLE) {
          console.log('[Index] Throttled, skipping sort');
          return;
        }
        lastSortTime = now;
        
        console.log('[Index] Sorting mode activated, reordering:', activeId, '→', targetId);
        
        const currentItems = pageGridItems[currentPageId] || [];
        const oldIndex = currentItems.findIndex((item: any) => item.id === activeId);
        const newIndex = currentItems.findIndex((item: any) => item.id === targetId);
        
        console.log('[Index] oldIndex:', oldIndex, 'newIndex:', newIndex, 'currentItems:', currentItems.length);
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newItems = [...currentItems];
          // 移除拖动的图标
          const [movedItem] = newItems.splice(oldIndex, 1);
          // 插入到目标位置
          newItems.splice(newIndex, 0, movedItem);
          
          console.log('[Index] Reordered items, updating state');
          setPageGridItems({
            ...pageGridItems,
            [currentPageId]: newItems
          });
        }
      }
    };
    
    window.addEventListener('sortingModeChange', handleSortingMode as EventListener);
    return () => window.removeEventListener('sortingModeChange', handleSortingMode as EventListener);
  }, [pageGridItems, currentPageId]);

  // 数据同步 - 检查远程数据是否有更新
  useDataSync((field, data) => {
    console.log(`[Sync] Received update for ${field}:`, data);
    
    switch (field) {
      case 'account':
        // 头像更新需要刷新页面
        if (data !== avatarUrl) {
          window.location.reload();
        }
        break;
      
      case 'openMethod':
        // 打开方式设置
        window.dispatchEvent(new CustomEvent('openInNewTabChanged', { detail: data }));
        break;
      
      case 'icon':
        // 图标样式
        setCurrentIconStyle(data);
        window.dispatchEvent(new CustomEvent('iconStyleChanged', { detail: data }));
        break;
      
      case 'theme':
        // 背景
        setCurrentBackgroundUrl(data);
        window.dispatchEvent(new CustomEvent('backgroundChanged', { detail: { url: data } }));
        break;
      
      case 'layout':
        // 布局模式
        setCurrentLayoutMode(data);
        window.dispatchEvent(new CustomEvent('layoutModeChanged', { detail: { mode: data } }));
        break;
      
      case 'sidebar':
        // 侧边栏设置
        setCurrentSidebarSettings(data);
        window.dispatchEvent(new CustomEvent('sidebarSettingsChanged', { detail: data }));
        break;
      
      case 'sidebarButtons':
      case 'gridIcons':
      case 'dockIcons':
      case 'searchEngines':
        // 这些数据更新需要刷新页面
        window.location.reload();
        break;
    }
  });

  // 预加载所有图标和图片
  useEffect(() => {
    const imagesToPreload: string[] = [];

    // 收集所有页面的图标
    Object.values(pageGridItems).forEach((items: any[]) => {
      items.forEach((item: any) => {
        if (item.iconLogo) imagesToPreload.push(item.iconLogo);
        if (item.iconImage) imagesToPreload.push(item.iconImage);
      });
    });

    // 收集 Dock 图标
    dockItems.forEach((item: any) => {
      if (item.iconLogo) imagesToPreload.push(item.iconLogo);
      if (item.iconImage) imagesToPreload.push(item.iconImage);
    });

    // 收集头像
    if (avatarUrl) imagesToPreload.push(avatarUrl);

    // 批量预加载
    if (imagesToPreload.length > 0) {
      imageCache.preloadBatch(imagesToPreload);
    }
  }, [pageGridItems, dockItems, avatarUrl]);

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
                    onItemsChange={setCurrentSidebarItems}
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
                    <SearchEngine 
                      openInNewTab={openInNewTab.search}
                      initialSearchEngines={searchEngines}
                      initialSelectedEngine={selectedEngine}
                    />
                  </div>
                  
                  {/* 图标网格区域 - 轮播容器 */}
                  <div className="flex-1 relative overflow-hidden">
                    <motion.div
                      className="w-full h-full flex flex-col"
                      animate={{
                        y: (() => {
                          if (!currentSidebarItems || currentSidebarItems.length === 0) return '0%';
                          const currentIndex = currentSidebarItems.findIndex(item => item.id === currentPageId);
                          return `${-currentIndex * 100}%`;
                        })()
                      }}
                      transition={{
                        duration: 0.5,
                        ease: [0.32, 0.72, 0, 1]
                      }}
                    >
                      {currentSidebarItems && currentSidebarItems.map((item) => (
                        <div
                          key={item.id}
                          className="w-full flex-shrink-0 overflow-y-auto overflow-x-visible flex justify-center px-8 pb-8"
                          style={{ height: '100%' }}
                        >
                          <div 
                            className="w-full"
                            style={{ maxWidth: `${currentIconStyle.maxWidth}px` }}
                          >
                            <DraggableGrid 
                              openInNewTab={openInNewTab.icon} 
                              iconStyle={currentIconStyle} 
                              allPageItems={pageGridItems}
                              currentPageId={item.id}
                              onItemsChange={async (newPageGridItems) => {
                                setPageGridItems(newPageGridItems);
                                // 保存到 KV
                                try {
                                  await fetch('/api/settings', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      key: 'page_grid_items',
                                      value: JSON.stringify(newPageGridItems),
                                    }),
                                  });
                                  // 更新时间戳
                                  const { updateRemoteTimestamp } = await import('@/hooks/use-data-sync');
                                  await updateRemoteTimestamp('gridIcons');
                                } catch (error) {
                                  console.error('Failed to save page grid items:', error);
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Dock 栏 */}
                  <div className="flex-shrink-0">
                    <Dock 
                      items={dockItems}
                      onItemsChange={async (newDockItems) => {
                        setDockItems(newDockItems);
                        // 保存到 KV
                        try {
                          await fetch('/api/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              key: 'dock_items',
                              value: JSON.stringify(newDockItems),
                            }),
                          });
                          // 更新时间戳
                          const { updateRemoteTimestamp } = await import('@/hooks/use-data-sync');
                          await updateRemoteTimestamp('dockIcons');
                        } catch (error) {
                          console.error('Failed to save dock items:', error);
                        }
                      }}
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
                <SearchEngine 
                  openInNewTab={openInNewTab.search}
                  initialSearchEngines={searchEngines}
                  initialSelectedEngine={selectedEngine}
                />
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
