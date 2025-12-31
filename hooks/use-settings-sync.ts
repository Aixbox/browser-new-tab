// 设置同步 Hook
import { useEffect } from 'react';
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";

export function useSettingsSync(
  setLayoutMode: (mode: 'component' | 'minimal') => void,
  setIconStyle: (style: IconStyleSettings) => void,
  setBackgroundUrl: (url: string | null) => void,
  setSidebarSettings: (settings: SidebarSettings) => void
) {
  useEffect(() => {
    const handleLayoutModeChange = (e: CustomEvent) => {
      if (e.detail?.mode) {
        setLayoutMode(e.detail.mode);
      }
    };
    
    const handleIconStyleChange = (e: CustomEvent) => {
      if (e.detail) {
        setIconStyle(e.detail);
      }
    };
    
    const handleBackgroundChange = (e: CustomEvent) => {
      if (e.detail?.url !== undefined) {
        setBackgroundUrl(e.detail.url);
      }
    };
    
    const handleSidebarSettingsChange = (e: CustomEvent) => {
      if (e.detail) {
        setSidebarSettings(e.detail);
      }
    };
    
    window.addEventListener('layoutModeChanged', handleLayoutModeChange as EventListener);
    window.addEventListener('iconStyleChanged', handleIconStyleChange as EventListener);
    window.addEventListener('backgroundChanged', handleBackgroundChange as EventListener);
    window.addEventListener('sidebarSettingsChanged', handleSidebarSettingsChange as EventListener);
    
    return () => {
      window.removeEventListener('layoutModeChanged', handleLayoutModeChange as EventListener);
      window.removeEventListener('iconStyleChanged', handleIconStyleChange as EventListener);
      window.removeEventListener('backgroundChanged', handleBackgroundChange as EventListener);
      window.removeEventListener('sidebarSettingsChanged', handleSidebarSettingsChange as EventListener);
    };
  }, [setLayoutMode, setIconStyle, setBackgroundUrl, setSidebarSettings]);
}
