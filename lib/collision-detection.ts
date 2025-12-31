// 自定义碰撞检测逻辑
import { CollisionDetection, closestCenter, pointerWithin } from "@dnd-kit/core";
import type { SidebarSettings } from "@/components/sidebar-settings";

export function createCustomCollisionDetection(
  sidebarSettings: SidebarSettings
): CollisionDetection {
  return (args) => {
    const { pointerCoordinates, droppableContainers } = args;
    
    if (pointerCoordinates) {
      const sidebarWidth = sidebarSettings.width || 64;
      const isInSidebar = sidebarSettings.position === 'left' 
        ? pointerCoordinates.x <= sidebarWidth 
        : pointerCoordinates.x >= window.innerWidth - sidebarWidth;
      
      console.log('Collision Detection - x:', pointerCoordinates.x, 'sidebarWidth:', sidebarWidth, 'isInSidebar:', isInSidebar);
      
      if (isInSidebar) {
        const pointerCollisions = pointerWithin(args);
        const sidebarButtonCollision = pointerCollisions.find(
          collision => typeof collision.id === 'string' && collision.id.startsWith('sidebar-button-')
        );
        
        if (sidebarButtonCollision) {
          console.log('Found sidebar button collision:', sidebarButtonCollision.id);
          return [sidebarButtonCollision];
        }
      } else {
        const filteredArgs = {
          ...args,
          droppableContainers: Array.from(droppableContainers).filter(
            container => !(typeof container.id === 'string' && container.id.startsWith('sidebar-button-'))
          )
        };
        return closestCenter(filteredArgs);
      }
    }
    
    return closestCenter(args);
  };
}
