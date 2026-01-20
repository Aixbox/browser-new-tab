import { useState, useMemo } from "react";
import { KVNamespace } from "@cloudflare/workers-types";
import { 
  DndContext,
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCenter,
  DragOverlay,
  defaultDropAnimation,
} from "@dnd-kit/core";
import { 
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { HomeShell } from "@/components/home";
import type { SidebarItem } from "@/components/custom-sidebar";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";
import { DraggableItem } from "@/components/draggable-item";
import { DragOverlayItem } from "@/components/drag-overlay-item";
import { SettingsDialog } from "@/components/settings-drawer";
import builtinIcons from "@/json/index";
import type { GridItem } from "@/lib/grid-model";

const ANIMATION_DURATION_MS = 750;

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

// 在组件外部初始化数据（和官方示例一样）
// 使用固定的时间戳，避免 StrictMode 导致的重复初始化问题
const INIT_TIMESTAMP = Date.now();

function createInitialItems(iconItems: GridItem[] | null): GridItem[] {
  return iconItems && iconItems.length > 0 
    ? iconItems as GridItem[]
    : builtinIcons.map((item, index) => ({
        ...item,
        iconType: item.iconType as "logo" | "image" | "text",
        id: `${item.id}-${INIT_TIMESTAMP}-${index}`,
      }));
}

export default function Home({ avatarUrl, hasSecretKey, sidebarItems, openInNewTab, layoutMode, iconStyle, backgroundUrl, sidebarSettings, iconItems, dockItems: initialDockItems, searchEngines, selectedEngine }: HomeProps) {
  // 和官方示例完全一致：维护 items 数组和 itemIds 数组
  const [items] = useState<GridItem[]>(() => createInitialItems(iconItems));
  const [itemIds, setItemIds] = useState<string[]>(() => items.map(item => item.id));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // 使用 useMemo 确保 iconStyle 引用稳定，避免子组件不必要的重渲染
  const currentIconStyle = useMemo(() => iconStyle, [
    iconStyle.size,
    iconStyle.borderRadius,
    iconStyle.opacity,
    iconStyle.spacing,
    iconStyle.showName,
    iconStyle.nameSize,
    iconStyle.nameColor,
    iconStyle.maxWidth,
    iconStyle.dockShowName,
  ]);
  const currentBackgroundUrl = backgroundUrl;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  // 完全模仿官方示例 - 使用普通函数，不是 useCallback
  function handleDragStart({ active }: any) {
    setActiveId(active.id as string);
  }

  function handleDragOver({ active, over }: any) {
    if (!over || !active) return;
    
    // 只更新 itemIds 的顺序，items 数组保持不变
    setItemIds((itemIds) => {
      const oldIndex = itemIds.indexOf(active.id);
      const newIndex = itemIds.indexOf(over.id);
      
      if (oldIndex === -1 || newIndex === -1) return itemIds;
      
      return arrayMove(itemIds, oldIndex, newIndex);
    });
  }

  function handleDragEnd() {
    setActiveId(null);
  }

  // 创建 id -> item 的映射，用于快速查找
  const itemsMap = useMemo(() => {
    const map: Record<string, GridItem> = {};
    items.forEach(item => {
      map[item.id] = item;
    });
    return map;
  }, [items]);

  return (
    <HomeShell
      title="新标签页"
      backgroundUrl={currentBackgroundUrl}
      onContextMenu={() => {}}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* 主内容区域 */}
        <div className="relative h-full w-full flex flex-col z-10">
          {/* 网格区域 - 完全模仿官方示例 */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div style={{ maxWidth: `${currentIconStyle.maxWidth}px`, width: '100%' }}>
              <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                <div
                  className="grid w-full"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, ${currentIconStyle.size}px)`,
                    gap: `${currentIconStyle.spacing}px`,
                  }}
                >
                  {itemIds.map((id) => {
                    const item = itemsMap[id];
                    if (!item || 'items' in item) return null;
                    
                    return (
                      <DraggableItem
                        key={id}
                        id={id}
                        item={item as any}
                        iconStyle={currentIconStyle}
                        openInNewTab={openInNewTab.icon}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </div>
          </div>
        </div>

        {/* DragOverlay */}
        <DragOverlay
          dropAnimation={{
            ...defaultDropAnimation,
            duration: ANIMATION_DURATION_MS / 2,
          }}
        >
          {activeId ? (
            <DragOverlayItem
              id={activeId}
              items={items}
              iconStyle={currentIconStyle}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Settings Dialog */}
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
