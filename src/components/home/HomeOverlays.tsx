"use client";

import { DragOverlay, defaultDropAnimation } from "@dnd-kit/core";
import { ContextMenu } from "@/components/context-menu";
import { DragOverlayItem } from "@/components/drag-overlay-item";
import { SettingsDialog } from "@/components/settings-drawer";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";
import type { GridItem } from "@/lib/grid-model";

// 简化：移除多页面结构和 Dock
interface HomeOverlaysProps {
  contextMenuPosition: { x: number; y: number } | null;
  onContextMenuSettings: () => void;
  onCloseContextMenu: () => void;
  isSettingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  avatarUrl: string | null;
  hasSecretKey: boolean;
  openInNewTab: { search: boolean; icon: boolean };
  layoutMode: "component" | "minimal";
  iconStyle: IconStyleSettings;
  backgroundUrl: string | null;
  sidebarSettings: SidebarSettings;
  activeId: string | null;
  gridItems: GridItem[];  // 简化：移除多页面结构
  currentIconStyle: IconStyleSettings;
}

export const HomeOverlays = ({
  contextMenuPosition,
  onContextMenuSettings,
  onCloseContextMenu,
  isSettingsOpen,
  onSettingsOpenChange,
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
}: HomeOverlaysProps) => {
  return (
    <>
      {contextMenuPosition && (
        <ContextMenu
          position={contextMenuPosition}
          onSettingsClick={() => {
            onContextMenuSettings();
            onCloseContextMenu();
          }}
        />
      )}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={onSettingsOpenChange}
        initialAvatarUrl={avatarUrl}
        hasSecretKey={hasSecretKey}
        initialOpenInNewTab={openInNewTab}
        initialLayoutMode={layoutMode}
        initialIconStyle={iconStyle}
        initialBackgroundUrl={backgroundUrl}
        initialSidebarSettings={sidebarSettings}
      />
      <DragOverlay
        dropAnimation={{
          ...defaultDropAnimation,
          duration: 750 / 2,  // ANIMATION_DURATION_MS / 2，和官方示例一致
          dragSourceOpacity: 0,
        }}
      >
        {activeId ? (
          <DragOverlayItem
            id={activeId}
            gridItems={gridItems}
            iconStyle={currentIconStyle}
          />
        ) : null}
      </DragOverlay>
    </>
  );
};
