import { useState, useEffect } from "react";
import Head from "next/head";
import { KVNamespace } from '@cloudflare/workers-types';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { Background } from "@/components/background";
import { SidebarDemo } from "@/components/sidebar-demo";
import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";
import { DraggableGrid } from "@/components/draggable-grid";
import { SettingsDialog } from "@/components/settings-drawer";
import { Dock } from "@/components/dock";
import { SidebarItem } from "@/components/custom-sidebar";
import { GearIcon } from "@radix-ui/react-icons";
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
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentIconStyle, setCurrentIconStyle] = useState<IconStyleSettings>(iconStyle);
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(backgroundUrl);
  const [currentSidebarSettings, setCurrentSidebarSettings] = useState<SidebarSettings>(sidebarSettings);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [dockItems, setDockItems] = useState<any[]>([]);
  const [gridItems, setGridItems] = useState<any[]>(iconItems || []);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    const draggedFromGrid = gridItems.find(item => item.id === active.id);
    const draggedFromDock = dockItems.find(item => item.id === active.id);

    // 从宫格拖到 Dock
    if (over?.id === 'dock-droppable' && draggedFromGrid) {
      if (!dockItems.find(dockItem => dockItem.id === draggedFromGrid.id)) {
        // 添加到 Dock
        const newDockItems = [...dockItems, draggedFromGrid];
        setDockItems(newDockItems);
        
        // 从宫格移除
        const newGridItems = gridItems.filter(item => item.id !== active.id);
        setGridItems(newGridItems);
        
        // 保存到 KV
        try {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: 'icon_items',
              value: JSON.stringify(newGridItems),
            }),
          });
        } catch (error) {
          console.error('Failed to save icon items:', error);
        }
      }
      return;
    }

    // 从 Dock 拖回宫格
    if (over?.id === 'grid-droppable' && draggedFromDock) {
      if (!gridItems.find(item => item.id === draggedFromDock.id)) {
        // 添加到宫格
        const newGridItems = [...gridItems, draggedFromDock];
        setGridItems(newGridItems);
        
        // 从 Dock 移除
        const newDockItems = dockItems.filter(item => item.id !== active.id);
        setDockItems(newDockItems);
        
        // 保存到 KV
        try {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: 'icon_items',
              value: JSON.stringify(newGridItems),
            }),
          });
        } catch (error) {
          console.error('Failed to save icon items:', error);
        }
      }
      return;
    }

    // Grid 内部排序
    if (draggedFromGrid && active.id !== over?.id && over?.id) {
      const oldIndex = gridItems.findIndex((item) => item.id === active.id);
      const newIndex = gridItems.findIndex((item) => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = [...gridItems];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);
        setGridItems(newItems);
        
        // 保存到 KV
        try {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: 'icon_items',
              value: JSON.stringify(newItems),
            }),
          });
        } catch (error) {
          console.error('Failed to save icon items:', error);
        }
      }
    }

    // Dock 内部排序
    if (draggedFromDock && active.id !== over?.id && over?.id) {
      const oldIndex = dockItems.findIndex((item) => item.id === active.id);
      const newIndex = dockItems.findIndex((item) => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = [...dockItems];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);
        setDockItems(newItems);
        
        // 保存到 KV（这里需要保存 Dock 数据）
        // TODO: 添加保存 Dock 数据的逻辑
      }
    }
  };

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

  // 监听背景变化
  useEffect(() => {
    const handleBackgroundChange = (e: CustomEvent) => {
      if (e.detail?.url !== undefined) {
        setCurrentBackgroundUrl(e.detail.url);
      }
    };
    
    window.addEventListener('backgroundChanged', handleBackgroundChange as EventListener);
    return () => window.removeEventListener('backgroundChanged', handleBackgroundChange as EventListener);
  }, []);

  // 监听侧边栏设置变化
  useEffect(() => {
    const handleSidebarSettingsChange = (e: CustomEvent) => {
      if (e.detail) {
        setCurrentSidebarSettings(e.detail);
      }
    };
    
    window.addEventListener('sidebarSettingsChanged', handleSidebarSettingsChange as EventListener);
    return () => window.removeEventListener('sidebarSettingsChanged', handleSidebarSettingsChange as EventListener);
  }, []);

  // 自动隐藏侧边栏逻辑
  useEffect(() => {
    if (!currentSidebarSettings.autoHide) {
      setIsSidebarVisible(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const threshold = 50; // 触发区域宽度
      const isLeft = currentSidebarSettings.position === 'left';
      const isNearEdge = isLeft 
        ? e.clientX < threshold 
        : e.clientX > window.innerWidth - threshold;
      
      setIsSidebarVisible(isNearEdge);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [currentSidebarSettings.autoHide, currentSidebarSettings.position]);

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
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
                        initialItems={gridItems}
                        onItemsChange={setGridItems}
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
              initialBackgroundUrl={backgroundUrl}
              initialSidebarSettings={sidebarSettings}
            />

          </div>

          {/* DragOverlay - 拖拽时显示的图标副本 */}
          <DragOverlay dropAnimation={null}>
            {activeId ? (
              <DragOverlayItem 
                id={activeId}
                gridItems={gridItems}
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

// DragOverlay 中显示的图标组件
const DragOverlayItem = ({ 
  id, 
  gridItems, 
  dockItems, 
  iconStyle 
}: { 
  id: string;
  gridItems: any[];
  dockItems: any[];
  iconStyle: IconStyleSettings;
}) => {
  const item = [...gridItems, ...dockItems].find(i => i.id === id);
  
  if (!item) return null;

  const iconSize = iconStyle?.size || 80;
  const borderRadius = iconStyle?.borderRadius || 12;
  const opacity = (iconStyle?.opacity || 100) / 100;

  const iconStyle_css = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    borderRadius: `${borderRadius}px`,
    opacity: opacity,
  };

  const renderIcon = () => {
    if (item.iconType === 'text' && item.iconText && item.iconColor) {
      return (
        <div 
          className="flex items-center justify-center text-white font-semibold overflow-hidden"
          style={{
            ...iconStyle_css,
            backgroundColor: item.iconColor,
            fontSize: `${iconSize / 4}px`,
          }}
        >
          {item.iconText}
        </div>
      );
    }

    if (item.iconType === 'image' && item.iconImage) {
      return (
        <img 
          src={item.iconImage}
          alt={item.name}
          className="object-cover"
          style={iconStyle_css}
        />
      );
    }

    if (item.iconType === 'logo' && item.iconLogo) {
      return (
        <img 
          src={item.iconLogo}
          alt={item.name}
          className="object-contain"
          style={iconStyle_css}
        />
      );
    }

    return (
      <div 
        className="flex items-center justify-center bg-white/5"
        style={iconStyle_css}
      >
        <svg width="24" height="24" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
        </svg>
      </div>
    );
  };

  return (
    <div className="cursor-grabbing" style={{ opacity: 0.8 }}>
      {renderIcon()}
    </div>
  );
};

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

      // 读取图标数据
      const iconItemsStr = await NEWTAB_KV.get('icon_items');
      if (iconItemsStr) {
        iconItems = JSON.parse(iconItemsStr);
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
