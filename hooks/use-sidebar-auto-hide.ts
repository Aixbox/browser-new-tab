// 侧边栏自动隐藏 Hook
import { useEffect } from 'react';
import type { SidebarSettings } from "@/components/sidebar-settings";

export function useSidebarAutoHide(
  sidebarSettings: SidebarSettings,
  setIsSidebarVisible: (visible: boolean) => void
) {
  useEffect(() => {
    if (!sidebarSettings.autoHide) {
      setIsSidebarVisible(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const threshold = 50;
      const isLeft = sidebarSettings.position === 'left';
      const isNearEdge = isLeft 
        ? e.clientX < threshold 
        : e.clientX > window.innerWidth - threshold;
      
      setIsSidebarVisible(isNearEdge);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sidebarSettings.autoHide, sidebarSettings.position, setIsSidebarVisible]);
}
