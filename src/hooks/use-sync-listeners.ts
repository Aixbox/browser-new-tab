import type { Dispatch, SetStateAction } from "react";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";
import type { SyncTimestamps } from "@/lib/sync-manager";
import { dispatchHomeEvent } from "@/lib/home-events";
import { useDataSync } from "@/hooks/use-data-sync";

type LayoutMode = "component" | "minimal";

interface SyncListenersOptions {
  avatarUrl: string | null;
  setCurrentIconStyle: Dispatch<SetStateAction<IconStyleSettings>>;
  setCurrentBackgroundUrl: Dispatch<SetStateAction<string | null>>;
  setCurrentLayoutMode: Dispatch<SetStateAction<LayoutMode>>;
  setCurrentSidebarSettings: Dispatch<SetStateAction<SidebarSettings>>;
}

export const useSyncListeners = ({
  avatarUrl,
  setCurrentIconStyle,
  setCurrentBackgroundUrl,
  setCurrentLayoutMode,
  setCurrentSidebarSettings,
}: SyncListenersOptions) => {
  useDataSync((field: keyof SyncTimestamps, data: any) => {
    console.log(`[Sync] Received update for ${field}:`, data);

    switch (field) {
      case "account":
        if (data !== avatarUrl) {
          window.location.reload();
        }
        break;

      case "openMethod":
        dispatchHomeEvent("openInNewTabChanged", data);
        break;

      case "icon":
        setCurrentIconStyle(data);
        dispatchHomeEvent("iconStyleChanged", data);
        break;

      case "theme":
        setCurrentBackgroundUrl(data);
        dispatchHomeEvent("backgroundChanged", { url: data });
        break;

      case "layout":
        setCurrentLayoutMode(data);
        dispatchHomeEvent("layoutModeChanged", { mode: data });
        break;

      case "sidebar":
        setCurrentSidebarSettings(data);
        dispatchHomeEvent("sidebarSettingsChanged", data);
        break;

      case "sidebarButtons":
      case "gridIcons":
      case "dockIcons":
      case "searchEngines":
        window.location.reload();
        break;

      case "timeDate":
        break;
    }
  });
};
