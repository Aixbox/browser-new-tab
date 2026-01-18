"use client";

import { DragOverlay } from "@dnd-kit/core";
import { ContextMenu } from "@/components/context-menu";
import { DragOverlayItem } from "@/components/drag-overlay-item";
import { SettingsDialog } from "@/components/settings-drawer";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";
import type { DockItem, GridItem } from "@/lib/grid-model";


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
  pageGridItems: Record<string, GridItem[]>;
  currentPageId: string;
  dockItems: DockItem[];
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
  pageGridItems,
  currentPageId,
  dockItems,
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
    </>
  );
};
