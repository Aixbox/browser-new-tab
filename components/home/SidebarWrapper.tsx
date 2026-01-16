"use client";

import { SidebarDemo } from "@/components/sidebar-demo";
import type { SidebarItem } from "@/components/custom-sidebar";
import type { SidebarSettings } from "@/components/sidebar-settings";

interface SidebarWrapperProps {
  avatarUrl: string | null;
  sidebarItems: SidebarItem[] | null;
  sidebarSettings: SidebarSettings;
  isSidebarVisible: boolean;
  onAvatarClick: () => void;
  onPageChange: (pageId: string) => void;
  currentPageId: string;
  onItemsChange: (items: SidebarItem[]) => void;
}

export const SidebarWrapper = ({
  avatarUrl,
  sidebarItems,
  sidebarSettings,
  isSidebarVisible,
  onAvatarClick,
  onPageChange,
  currentPageId,
  onItemsChange,
}: SidebarWrapperProps) => {
  return (
    <div
      className={`absolute top-0 ${sidebarSettings.position === "left" ? "left-0" : "right-0"} h-full transition-transform duration-300 z-20`}
      style={{
        transform: isSidebarVisible
          ? "translateX(0)"
          : sidebarSettings.position === "left"
            ? "translateX(-100%)"
            : "translateX(100%)",
        width: `${sidebarSettings.width}px`,
      }}
    >
      <SidebarDemo
        onAvatarClick={onAvatarClick}
        avatarUrl={avatarUrl}
        initialSidebarItems={sidebarItems}
        wheelScroll={sidebarSettings.wheelScroll}
        width={sidebarSettings.width}
        onPageChange={onPageChange}
        currentPageId={currentPageId}
        onItemsChange={onItemsChange}
      />
    </div>
  );
};
