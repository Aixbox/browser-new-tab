// 自定义碰撞检测逻辑
import { CollisionDetection, closestCenter, pointerWithin, rectIntersection, getFirstCollision, ClientRect } from "@dnd-kit/core";
import type { SidebarSettings } from "@/components/sidebar-settings";

// 全局状态用于跟踪悬停
let hoverState: {
  itemId: string | null;
  startTime: number;
  isInCenter: boolean;
  inFolderMode: boolean;
  inSortingMode: boolean;
  timerId: NodeJS.Timeout | null;
} = {
  itemId: null,
  startTime: 0,
  isInCenter: false,
  inFolderMode: false,
  inSortingMode: false,
  timerId: null,
};

const EDGE_HOVER_DELAY = 500; // 外围悬停 500ms 触发排序
const CENTER_HOVER_DELAY = 350; // 中心悬停 500ms 进入文件夹模式

// 清除定时器
function clearHoverTimer() {
  if (hoverState.timerId) {
    clearTimeout(hoverState.timerId);
    hoverState.timerId = null;
  }
}

// 检查点是否在矩形中心 50% 区域
function isInCenterRegion(x: number, y: number, rect: ClientRect): boolean {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const halfWidth = rect.width / 2.8; // 中心 50% 区域
  const halfHeight = rect.height / 2.8;
  
  return (
    x >= centerX - halfWidth &&
    x <= centerX + halfWidth &&
    y >= centerY - halfHeight &&
    y <= centerY + halfHeight
  );
}

export function createCustomCollisionDetection(
  sidebarSettings: SidebarSettings
): CollisionDetection {
  return (args) => {
    const { pointerCoordinates, droppableContainers, active } = args;
    
    if (pointerCoordinates) {
      const sidebarWidth = sidebarSettings.width || 64;
      const isInSidebar = sidebarSettings.position === 'left' 
        ? pointerCoordinates.x <= sidebarWidth 
        : pointerCoordinates.x >= window.innerWidth - sidebarWidth;
      
      if (isInSidebar) {
        const pointerCollisions = pointerWithin(args);
        const sidebarButtonCollision = pointerCollisions.find(
          collision => typeof collision.id === 'string' && collision.id.startsWith('sidebar-button-')
        );
        
        if (sidebarButtonCollision) {
          return [sidebarButtonCollision];
        }
      } else {
        // 在网格区域
        const filteredArgs = {
          ...args,
          droppableContainers: Array.from(droppableContainers).filter(
            container => !(typeof container.id === 'string' && container.id.startsWith('sidebar-button-'))
          )
        };
        
        // 使用 rectIntersection 检测重叠
        const intersections = rectIntersection(filteredArgs);
        
        // 过滤掉自己
        const otherIntersections = intersections.filter(
          collision => collision.id !== active.id
        );
        
        if (otherIntersections.length > 0) {
          const targetCollision = otherIntersections[0];
          const targetContainer = Array.from(droppableContainers).find(
            c => c.id === targetCollision.id
          );
          
          if (targetContainer && targetContainer.rect.current) {
            const rect = targetContainer.rect.current;
            const isInCenter = isInCenterRegion(
              pointerCoordinates.x,
              pointerCoordinates.y,
              rect
            );
            
            const now = Date.now();
            
            // 如果是新的目标，重置状态
            if (hoverState.itemId !== targetCollision.id) {
              console.log('[Collision] New target:', targetCollision.id, 'isInCenter:', isInCenter);
              
              // 清除旧的定时器
              clearHoverTimer();
              
              hoverState = {
                itemId: targetCollision.id as string,
                startTime: now,
                isInCenter: isInCenter,
                inFolderMode: false,
                inSortingMode: false,
                timerId: null,
              };
              
              // 设置新的定时器
              const delay = isInCenter ? CENTER_HOVER_DELAY : EDGE_HOVER_DELAY;
              hoverState.timerId = setTimeout(() => {
                if (isInCenter) {
                  // 进入文件夹创建模式
                  hoverState.inFolderMode = true;
                  console.log('[Collision] ✅ Entered folder creation mode! (via timer)');
                  
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('folderPreviewChange', { 
                      detail: { targetId: targetCollision.id, inFolderMode: true } 
                    }));
                  }
                } else {
                  // 进入排序模式
                  hoverState.inSortingMode = true;
                  console.log('[Collision] ✅ Entered sorting mode! (via timer)');
                  
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('sortingModeChange', { 
                      detail: { 
                        activeId: active.id,
                        targetId: targetCollision.id, 
                        inSortingMode: true 
                      } 
                    }));
                  }
                }
              }, delay);
              
            } else if (hoverState.isInCenter !== isInCenter) {
              // 位置改变（外围<->中心），重置计时器
              console.log('[Collision] Position changed to center:', isInCenter, 'resetting timer');
              
              // 清除旧的定时器
              clearHoverTimer();
              
              hoverState.startTime = now;
              hoverState.isInCenter = isInCenter;
              
              // 如果从中心移到外围，退出文件夹模式
              if (!isInCenter && hoverState.inFolderMode) {
                hoverState.inFolderMode = false;
                console.log('[Collision] Exited folder creation mode (moved to edge)');
                
                // 触发事件通知预览消失
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('folderPreviewChange', { 
                    detail: { targetId: null, inFolderMode: false } 
                  }));
                }
              }
              
              // 如果从外围移到中心，退出排序模式
              if (isInCenter && hoverState.inSortingMode) {
                hoverState.inSortingMode = false;
                console.log('[Collision] Exited sorting mode (moved to center)');
              }
              
              // 设置新的定时器
              const delay = isInCenter ? CENTER_HOVER_DELAY : EDGE_HOVER_DELAY;
              hoverState.timerId = setTimeout(() => {
                if (isInCenter) {
                  // 进入文件夹创建模式
                  hoverState.inFolderMode = true;
                  console.log('[Collision] ✅ Entered folder creation mode! (via timer)');
                  
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('folderPreviewChange', { 
                      detail: { targetId: targetCollision.id, inFolderMode: true } 
                    }));
                  }
                } else {
                  // 进入排序模式
                  hoverState.inSortingMode = true;
                  console.log('[Collision] ✅ Entered sorting mode! (via timer)');
                  
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('sortingModeChange', { 
                      detail: { 
                        activeId: active.id,
                        targetId: targetCollision.id, 
                        inSortingMode: true 
                      } 
                    }));
                  }
                }
              }, delay);
            }
            
            // 移除旧的基于 duration 的检查，现在完全依赖定时器
            
            // 始终返回碰撞结果，让 over 不为 undefined
            return [targetCollision];
          }
          
          return [targetCollision];
        }
        
        // 重置悬停状态（离开所有图标）
        if (hoverState.itemId !== null) {
          const wasInFolderMode = hoverState.inFolderMode;
          const wasInSortingMode = hoverState.inSortingMode;
          console.log('[Collision] Left all icons, resetting state');
          
          // 清除定时器
          clearHoverTimer();
          
          hoverState = {
            itemId: null,
            startTime: 0,
            isInCenter: false,
            inFolderMode: false,
            inSortingMode: false,
            timerId: null,
          };
          
          // 如果之前在文件夹模式，触发事件通知预览消失
          if (wasInFolderMode && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('folderPreviewChange', { 
              detail: { targetId: null, inFolderMode: false } 
            }));
          }
          
          // 如果之前在排序模式，触发事件通知退出排序
          if (wasInSortingMode && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sortingModeChange', { 
              detail: { activeId: null, targetId: null, inSortingMode: false } 
            }));
          }
        }
        
        // 如果没有重叠，使用 closestCenter
        return closestCenter(filteredArgs);
      }
    }
    
    return closestCenter(args);
  };
}

// 导出函数以便在 drag handlers 中检查状态
export function isInFolderCreationMode(): boolean {
  return hoverState.inFolderMode;
}

export function getCurrentHoverTarget(): string | null {
  return hoverState.inFolderMode ? hoverState.itemId : null;
}

export function resetHoverState(): void {
  // 清除定时器
  clearHoverTimer();
  
  hoverState = {
    itemId: null,
    startTime: 0,
    isInCenter: false,
    inFolderMode: false,
    inSortingMode: false,
    timerId: null,
  };
  
  // 触发事件通知预览消失
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('folderPreviewChange', { 
      detail: { targetId: null, inFolderMode: false } 
    }));
    window.dispatchEvent(new CustomEvent('sortingModeChange', { 
      detail: { activeId: null, targetId: null, inSortingMode: false } 
    }));
  }
}
