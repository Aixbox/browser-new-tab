// 滚轮切换页面 Hook（带动画效果）
import { useEffect, useState, useRef } from 'react';
import type { SidebarItem } from "@/components/custom-sidebar";

export type AnimationDirection = 'up' | 'down' | null;

export function usePageWheelSwitch(
  sidebarItems: SidebarItem[] | null,
  currentPageId: string,
  onPageChange: (pageId: string) => void,
  enabled: boolean = true
) {
  const [animationDirection, setAnimationDirection] = useState<AnimationDirection>(null);
  const isAnimatingRef = useRef(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastWheelTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled || !sidebarItems || sidebarItems.length <= 1) return;

    const handleWheel = (e: WheelEvent) => {
      // 如果正在动画中，忽略滚轮事件
      if (isAnimatingRef.current) {
        e.preventDefault();
        return;
      }

      // 防抖：短时间内只响应一次滚轮（更严格的防抖）
      const now = Date.now();
      if (now - lastWheelTimeRef.current < 800) {
        e.preventDefault();
        return;
      }

      const currentIndex = sidebarItems.findIndex(item => item.id === currentPageId);
      if (currentIndex === -1) return;

      let nextIndex = -1;
      let direction: AnimationDirection = null;

      // 增加滚动阈值，避免轻微滚动就触发
      const threshold = 30;

      if (e.deltaY > threshold) {
        // 向下滚动 - 切换到下一页
        if (currentIndex < sidebarItems.length - 1) {
          nextIndex = currentIndex + 1;
          direction = 'down';
        }
      } else if (e.deltaY < -threshold) {
        // 向上滚动 - 切换到上一页
        if (currentIndex > 0) {
          nextIndex = currentIndex - 1;
          direction = 'up';
        }
      }

      if (nextIndex !== -1 && direction) {
        e.preventDefault();
        
        lastWheelTimeRef.current = now;
        
        // 设置动画方向
        setAnimationDirection(direction);
        isAnimatingRef.current = true;

        // 立即切换页面
        onPageChange(sidebarItems[nextIndex].id);
        
        // 动画完成后重置状态
        setTimeout(() => {
          setAnimationDirection(null);
          isAnimatingRef.current = false;
        }, 600); // 与动画时长匹配
      }
    };

    // 使用捕获阶段，确保优先处理
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [enabled, sidebarItems, currentPageId, onPageChange]);

  return { animationDirection };
}
