import { useState } from "react";
import type { SidebarItem } from "@/components/custom-sidebar";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";

type LayoutMode = "component" | "minimal";

interface HomeStateOptions {
  layoutMode: LayoutMode;
  iconStyle: IconStyleSettings;
  backgroundUrl: string | null;
  sidebarSettings: SidebarSettings;
  sidebarItems: SidebarItem[] | null;
}

export const useHomeState = ({
  layoutMode,
  iconStyle,
  backgroundUrl,
  sidebarSettings,
  sidebarItems,
}: HomeStateOptions) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentLayoutMode, setCurrentLayoutMode] = useState<LayoutMode>(layoutMode);
  const [currentIconStyle, setCurrentIconStyle] = useState<IconStyleSettings>(iconStyle);
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(backgroundUrl);
  const [currentSidebarSettings, setCurrentSidebarSettings] = useState<SidebarSettings>(sidebarSettings);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const [currentSidebarItems, setCurrentSidebarItems] = useState<SidebarItem[]>(sidebarItems || []);
  const [currentPageId, setCurrentPageId] = useState<string>(sidebarItems?.[0]?.id || "1");

  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);

  return {
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

    currentSidebarItems,
    setCurrentSidebarItems,
    currentPageId,
    setCurrentPageId,

    dragOverPageId,
    setDragOverPageId,
  };
};
