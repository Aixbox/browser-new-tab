"use client";

import { useEffect, useRef, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { GlobeIcon } from "@radix-ui/react-icons";
import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GridItem, IconItem } from "@/lib/grid-model";
import type { IconStyleSettings } from "@/components/icon-settings";
import { isFolder, createFolder } from "@/lib/grid-model";
import type Sortable from "sortablejs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IconGridProps {
  items: GridItem[];
  onItemsChange: (items: GridItem[]) => void;
  openInNewTab?: boolean;
  iconStyle: IconStyleSettings;
}

// 单个图标组件
const IconItem = ({
  item,
  iconStyle,
  openInNewTab,
  onFolderClick,
}: {
  item: GridItem;
  iconStyle: IconStyleSettings;
  openInNewTab?: boolean;
  onFolderClick?: (folder: GridItem) => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  const handleClick = () => {
    if (isFolder(item)) {
      onFolderClick?.(item);
      return;
    }
    
    if (openInNewTab) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = item.url;
    }
  };

  const handleImageError = () => {
    if (!useProxy && !isFolder(item) && item.iconLogo) {
      setUseProxy(true);
      setImageError(false);
    } else {
      setImageError(true);
    }
  };

  const getIconSrc = () => {
    if (isFolder(item)) return null;
    if (item.iconType === "logo" && item.iconLogo) {
      return useProxy ? `/api/icon?url=${encodeURIComponent(item.iconLogo)}` : item.iconLogo;
    }
    if (item.iconType === "image" && item.iconImage) {
      return item.iconImage;
    }
    return null;
  };

  const iconSrc = getIconSrc();

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer group"
      onClick={handleClick}
      style={{
        width: `${iconStyle.size}px`,
      }}
    >
      {/* 图标容器 */}
      <div
        className={cn(
          "relative flex items-center justify-center bg-primary/20 backdrop-blur-xs border-2 border-white/30",
          "transition-all duration-200 group-hover:scale-110 group-hover:border-white/50"
        )}
        style={{
          width: `${iconStyle.size}px`,
          height: `${iconStyle.size}px`,
          borderRadius: `${iconStyle.borderRadius}px`,
          opacity: iconStyle.opacity / 100,
        }}
      >
        {/* 图标内容 */}
        {isFolder(item) ? (
          <Folder className="w-3/5 h-3/5 text-white/90" />
        ) : item.iconType === "text" ? (
          <span
            className="text-2xl font-bold"
            style={{ color: item.iconColor || "#ffffff" }}
          >
            {item.iconText || item.name.charAt(0)}
          </span>
        ) : iconSrc && !imageError ? (
          <img
            key={useProxy ? "proxy" : "direct"}
            src={iconSrc}
            alt={item.name}
            className="w-3/5 h-3/5 object-contain"
            onError={handleImageError}
          />
        ) : (
          <GlobeIcon className="w-3/5 h-3/5 text-white/60" />
        )}
      </div>

      {/* 图标名称 */}
      {iconStyle.showName && (
        <span
          className="text-center truncate w-full text-white/90"
          style={{
            fontSize: `${iconStyle.nameSize}px`,
            color: iconStyle.nameColor,
          }}
        >
          {item.name}
        </span>
      )}
    </div>
  );
};

export const IconGrid = ({ items, onItemsChange, openInNewTab, iconStyle }: IconGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(6);
  const [openFolder, setOpenFolder] = useState<GridItem | null>(null);
  const [folderItems, setFolderItems] = useState<IconItem[]>([]);
  
  // 合并模式状态
  const mergeStateRef = useRef({
    mergeMode: false,
    mergePosition: null as 'before' | 'after' | null,
    highlightedElement: null as HTMLElement | null,
  });

  // 文件夹悬停状态
  const folderHoverStateRef = useRef({
    hoveredFolder: null as GridItem | null,
    hoverStartTime: null as number | null,
    hoverTimer: null as NodeJS.Timeout | null,
  });

  // 弹窗遮罩悬停状态
  const overlayHoverStateRef = useRef({
    isHovering: false,
    hoverStartTime: null as number | null,
    hoverTimer: null as NodeJS.Timeout | null,
  });

  useEffect(() => {
    const updateColumns = () => {
      if (!gridRef.current) return;
      const containerWidth = gridRef.current.offsetWidth;
      const itemWidth = iconStyle.size + iconStyle.spacing;
      const cols = Math.floor(containerWidth / itemWidth) || 1;
      setColumns(cols);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => {
      window.removeEventListener("resize", updateColumns);
      // 清理定时器
      if (folderHoverStateRef.current.hoverTimer) {
        clearTimeout(folderHoverStateRef.current.hoverTimer);
      }
      if (overlayHoverStateRef.current.hoverTimer) {
        clearTimeout(overlayHoverStateRef.current.hoverTimer);
      }
    };
  }, [iconStyle.size, iconStyle.spacing]);

  const handleFolderClick = (folder: GridItem) => {
    if (isFolder(folder)) {
      setOpenFolder(folder);
      setFolderItems([...folder.items]);
    }
  };

  const handleFolderItemsChange = (newItems: IconItem[]) => {
    setFolderItems(newItems);
  };

  // 处理文件夹内拖拽的 onMove 事件
  const handleFolderSortableMove = (evt: Sortable.MoveEvent) => {
    // 检查是否拖到了弹窗外部
    const related = evt.related;
    
    if (!related) {
      // 拖到容器外部，开始计时
      if (!overlayHoverStateRef.current.isHovering) {
        overlayHoverStateRef.current.isHovering = true;
        overlayHoverStateRef.current.hoverStartTime = Date.now();
        
        console.log('🎯 开始悬停在遮罩区域');
        
        // 设置1秒后关闭弹窗
        overlayHoverStateRef.current.hoverTimer = setTimeout(() => {
          console.log('🚪 关闭文件夹弹窗');
          handleCloseFolderModal();
        }, 1000);
      }
      return true;
    } else {
      // 拖回容器内部，取消计时
      if (overlayHoverStateRef.current.hoverTimer) {
        console.log('❌ 取消关闭弹窗');
        clearTimeout(overlayHoverStateRef.current.hoverTimer);
        overlayHoverStateRef.current.hoverTimer = null;
      }
      overlayHoverStateRef.current.isHovering = false;
      overlayHoverStateRef.current.hoverStartTime = null;
      return true;
    }
  };

  const handleCloseFolderModal = () => {
    if (!openFolder || !isFolder(openFolder)) return;

    // 更新文件夹内容
    const updatedItems = items.map(item => {
      if (item.id === openFolder.id && isFolder(item)) {
        // 如果只剩一个项目，解散文件夹
        if (folderItems.length === 1) {
          return folderItems[0];
        }
        // 更新文件夹内容
        return {
          ...item,
          items: folderItems,
        };
      }
      return item;
    });

    onItemsChange(updatedItems);
    setOpenFolder(null);
    setFolderItems([]);
  };

  const handleSortableMove = (evt: Sortable.MoveEvent, originalEvent: Event) => {
    const draggedRect = evt.draggedRect;
    const relatedRect = evt.relatedRect;
    const related = evt.related;
    
    if (!related) {
      if (mergeStateRef.current.highlightedElement) {
        mergeStateRef.current.highlightedElement.classList.remove('merge-highlight');
        mergeStateRef.current.highlightedElement = null;
      }
      mergeStateRef.current.mergeMode = false;
      
      // 清理文件夹悬停状态
      if (folderHoverStateRef.current.hoverTimer) {
        clearTimeout(folderHoverStateRef.current.hoverTimer);
        folderHoverStateRef.current.hoverTimer = null;
      }
      folderHoverStateRef.current.hoveredFolder = null;
      folderHoverStateRef.current.hoverStartTime = null;
      
      return true;
    }
    
    const mouseEvent = originalEvent as MouseEvent;
    const mouseX = mouseEvent.clientX;
    const mouseY = mouseEvent.clientY;
    
    const relatedLeft = relatedRect.left;
    const relatedRight = relatedRect.right;
    const relatedTop = relatedRect.top;
    const relatedBottom = relatedRect.bottom;
    const relatedWidth = relatedRect.width;
    const relatedCenter = relatedLeft + relatedWidth / 2;
    
    const draggedCenter = draggedRect.left + draggedRect.width / 2;
    const isTargetOnLeft = relatedCenter < draggedCenter;
    const isTargetOnRight = relatedCenter > draggedCenter;
    
    const leftZone = relatedLeft + relatedWidth * 0.33;
    const rightZone = relatedRight - relatedWidth * 0.33;
    
    const isMouseInLeftZone = mouseX < leftZone;
    const isMouseInRightZone = mouseX > rightZone;
    
    const distanceToLeft = Math.abs(mouseX - relatedLeft);
    const distanceToRight = Math.abs(mouseX - relatedRight);
    const distanceToTop = Math.abs(mouseY - relatedTop);
    const distanceToBottom = Math.abs(mouseY - relatedBottom);
    
    const edgeThreshold = 5;
    
    // 清除之前的高亮
    if (mergeStateRef.current.highlightedElement && mergeStateRef.current.highlightedElement !== related) {
      mergeStateRef.current.highlightedElement.classList.remove('merge-highlight');
      mergeStateRef.current.highlightedElement = null;
    }
    
    // 检查是否悬停在文件夹上
    const targetId = related.dataset.id;
    const targetItem = items.find(item => item.id === targetId);
    
    if (isTargetOnLeft) {
      if (isMouseInLeftZone) {
        // 拖到左边缘：避让（交换）
        mergeStateRef.current.mergeMode = false;
        related.classList.remove('merge-highlight');
        mergeStateRef.current.highlightedElement = null;
        
        // 清理文件夹悬停
        if (folderHoverStateRef.current.hoverTimer) {
          clearTimeout(folderHoverStateRef.current.hoverTimer);
          folderHoverStateRef.current.hoverTimer = null;
        }
        folderHoverStateRef.current.hoveredFolder = null;
        
        return -1;
      } else {
        // 拖到右边缘和中间
        const isNearRightEdge = distanceToRight < edgeThreshold;
        const isNearTopEdge = distanceToTop < edgeThreshold;
        const isNearBottomEdge = distanceToBottom < edgeThreshold;
        
        if (isNearRightEdge || isNearTopEdge || isNearBottomEdge) {
          mergeStateRef.current.mergeMode = false;
          related.classList.remove('merge-highlight');
          mergeStateRef.current.highlightedElement = null;
          
          // 清理文件夹悬停
          if (folderHoverStateRef.current.hoverTimer) {
            clearTimeout(folderHoverStateRef.current.hoverTimer);
            folderHoverStateRef.current.hoverTimer = null;
          }
          folderHoverStateRef.current.hoveredFolder = null;
          
          return false;
        } else {
          // 检查是否是文件夹
          if (targetItem && isFolder(targetItem)) {
            // 悬停在文件夹上
            if (folderHoverStateRef.current.hoveredFolder?.id !== targetItem.id) {
              // 切换到新文件夹，重置计时器
              if (folderHoverStateRef.current.hoverTimer) {
                clearTimeout(folderHoverStateRef.current.hoverTimer);
              }
              
              folderHoverStateRef.current.hoveredFolder = targetItem;
              folderHoverStateRef.current.hoverStartTime = Date.now();
              
              // 设置1秒后打开文件夹
              folderHoverStateRef.current.hoverTimer = setTimeout(() => {
                console.log('🗂️ 打开文件夹:', targetItem.name);
                handleFolderClick(targetItem);
              }, 1000);
            }
            
            // 不触发合并
            mergeStateRef.current.mergeMode = false;
            related.classList.remove('merge-highlight');
            mergeStateRef.current.highlightedElement = null;
            return false;
          } else {
            // 普通图标，触发合并
            mergeStateRef.current.mergeMode = true;
            mergeStateRef.current.mergePosition = 'after';
            related.classList.add('merge-highlight');
            mergeStateRef.current.highlightedElement = related;
            
            // 清理文件夹悬停
            if (folderHoverStateRef.current.hoverTimer) {
              clearTimeout(folderHoverStateRef.current.hoverTimer);
              folderHoverStateRef.current.hoverTimer = null;
            }
            folderHoverStateRef.current.hoveredFolder = null;
            
            return false;
          }
        }
      }
    } else if (isTargetOnRight) {
      if (isMouseInRightZone) {
        // 拖到右边缘：避让（交换）
        mergeStateRef.current.mergeMode = false;
        related.classList.remove('merge-highlight');
        mergeStateRef.current.highlightedElement = null;
        
        // 清理文件夹悬停
        if (folderHoverStateRef.current.hoverTimer) {
          clearTimeout(folderHoverStateRef.current.hoverTimer);
          folderHoverStateRef.current.hoverTimer = null;
        }
        folderHoverStateRef.current.hoveredFolder = null;
        
        return 1;
      } else {
        // 拖到左边缘和中间
        const isNearLeftEdge = distanceToLeft < edgeThreshold;
        const isNearTopEdge = distanceToTop < edgeThreshold;
        const isNearBottomEdge = distanceToBottom < edgeThreshold;
        
        if (isNearLeftEdge || isNearTopEdge || isNearBottomEdge) {
          mergeStateRef.current.mergeMode = false;
          related.classList.remove('merge-highlight');
          mergeStateRef.current.highlightedElement = null;
          
          // 清理文件夹悬停
          if (folderHoverStateRef.current.hoverTimer) {
            clearTimeout(folderHoverStateRef.current.hoverTimer);
            folderHoverStateRef.current.hoverTimer = null;
          }
          folderHoverStateRef.current.hoveredFolder = null;
          
          return false;
        } else {
          // 检查是否是文件夹
          if (targetItem && isFolder(targetItem)) {
            // 悬停在文件夹上
            if (folderHoverStateRef.current.hoveredFolder?.id !== targetItem.id) {
              // 切换到新文件夹，重置计时器
              if (folderHoverStateRef.current.hoverTimer) {
                clearTimeout(folderHoverStateRef.current.hoverTimer);
              }
              
              folderHoverStateRef.current.hoveredFolder = targetItem;
              folderHoverStateRef.current.hoverStartTime = Date.now();
              
              // 设置1秒后打开文件夹
              folderHoverStateRef.current.hoverTimer = setTimeout(() => {
                console.log('🗂️ 打开文件夹:', targetItem.name);
                handleFolderClick(targetItem);
              }, 1000);
            }
            
            // 不触发合并
            mergeStateRef.current.mergeMode = false;
            related.classList.remove('merge-highlight');
            mergeStateRef.current.highlightedElement = null;
            return false;
          } else {
            // 普通图标，触发合并
            mergeStateRef.current.mergeMode = true;
            mergeStateRef.current.mergePosition = 'before';
            related.classList.add('merge-highlight');
            mergeStateRef.current.highlightedElement = related;
            
            // 清理文件夹悬停
            if (folderHoverStateRef.current.hoverTimer) {
              clearTimeout(folderHoverStateRef.current.hoverTimer);
              folderHoverStateRef.current.hoverTimer = null;
            }
            folderHoverStateRef.current.hoveredFolder = null;
            
            return false;
          }
        }
      }
    }
    
    mergeStateRef.current.mergeMode = false;
    
    // 清理文件夹悬停
    if (folderHoverStateRef.current.hoverTimer) {
      clearTimeout(folderHoverStateRef.current.hoverTimer);
      folderHoverStateRef.current.hoverTimer = null;
    }
    folderHoverStateRef.current.hoveredFolder = null;
    
    return true;
  };

  const handleSortableEnd = (evt: Sortable.SortableEvent) => {
    // 清理文件夹悬停定时器
    if (folderHoverStateRef.current.hoverTimer) {
      clearTimeout(folderHoverStateRef.current.hoverTimer);
      folderHoverStateRef.current.hoverTimer = null;
    }
    folderHoverStateRef.current.hoveredFolder = null;
    folderHoverStateRef.current.hoverStartTime = null;
    
    if (mergeStateRef.current.highlightedElement) {
      mergeStateRef.current.highlightedElement.classList.remove('merge-highlight');
    }
    
    if (mergeStateRef.current.mergeMode && evt.oldIndex !== undefined && mergeStateRef.current.highlightedElement) {
      const draggedItem = items[evt.oldIndex];
      
      // 通过 highlightedElement 的 data-id 找到目标元素
      const targetId = mergeStateRef.current.highlightedElement.dataset.id;
      const targetIndex = items.findIndex(item => item.id === targetId);
      const targetItem = targetIndex >= 0 ? items[targetIndex] : null;
      
      console.log('🔄 合并操作:', {
        draggedItem: draggedItem?.name,
        targetItem: targetItem?.name,
        draggedIndex: evt.oldIndex,
        targetIndex,
        mergePosition: mergeStateRef.current.mergePosition
      });
      
      if (!draggedItem || !targetItem || targetIndex < 0) {
        console.error('❌ 合并失败: 找不到拖动或目标元素');
        mergeStateRef.current.mergeMode = false;
        mergeStateRef.current.mergePosition = null;
        mergeStateRef.current.highlightedElement = null;
        return;
      }
      
      // 提取图标项
      const draggedIcons: IconItem[] = isFolder(draggedItem) ? draggedItem.items : [draggedItem];
      const targetIcons: IconItem[] = isFolder(targetItem) ? targetItem.items : [targetItem];
      
      console.log('📦 提取的图标:', {
        draggedIcons: draggedIcons.map(i => i.name),
        targetIcons: targetIcons.map(i => i.name)
      });
      
      // 根据合并位置创建新文件夹
      const newFolderItems = mergeStateRef.current.mergePosition === 'before' 
        ? [...draggedIcons, ...targetIcons]
        : [...targetIcons, ...draggedIcons];
      
      const newFolder = createFolder(newFolderItems, targetItem.name);
      
      console.log('✅ 创建文件夹:', {
        folderName: newFolder.name,
        itemCount: newFolder.items.length,
        items: newFolder.items.map(i => i.name)
      });
      
      // 更新列表 - 移除拖动的元素和目标元素，在目标位置插入新文件夹
      const newItems = items.filter((_, index) => index !== evt.oldIndex && index !== targetIndex);
      
      // 计算插入位置：使用较小的索引
      const insertIndex = Math.min(evt.oldIndex, targetIndex);
      newItems.splice(insertIndex, 0, newFolder);
      
      console.log('📋 更新后的列表:', {
        原始数量: items.length,
        新数量: newItems.length,
        items: newItems.map(i => i.name)
      });
      
      onItemsChange(newItems);
    }
    
    mergeStateRef.current.mergeMode = false;
    mergeStateRef.current.mergePosition = null;
    mergeStateRef.current.highlightedElement = null;
  };

  return (
    <>
      <div ref={gridRef} className="w-full h-full">
        <ReactSortable
          list={items.map((item) => ({ ...item, chosen: false, selected: false }))}
          setList={(newState) => {
            // 如果处于合并模式，不执行默认的排序更新
            // 合并逻辑会在 onEnd 中处理
            if (!mergeStateRef.current.mergeMode) {
              onItemsChange(newState);
            }
          }}
          group="icon-grid"
          animation={200}
          delay={0}
          delayOnTouchOnly={true}
          touchStartThreshold={5}
          ghostClass="blue-background-class"
          dragClass="dragging-element"
          onMove={handleSortableMove}
          onEnd={handleSortableEnd}
          className={cn(
            "grid w-full h-full content-start"
          )}
          style={{
            gridTemplateColumns: `repeat(${columns}, ${iconStyle.size}px)`,
            gap: `${iconStyle.spacing}px`,
            justifyContent: "center",
          }}
        >
          {items.map((item) => (
            <div key={item.id} data-id={item.id}>
              <IconItem
                item={item}
                iconStyle={iconStyle}
                openInNewTab={openInNewTab}
                onFolderClick={handleFolderClick}
              />
            </div>
          ))}
        </ReactSortable>
      </div>

      {/* 文件夹弹窗 */}
      <Dialog open={!!openFolder} onOpenChange={(open) => !open && handleCloseFolderModal()}>
        <DialogContent 
          className="max-w-2xl backdrop-blur-xl bg-primary/20 border-2 border-border/50 text-foreground"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl font-semibold">{openFolder?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 min-h-[200px]">
            <ReactSortable
              list={folderItems.map((item) => ({ ...item, chosen: false, selected: false }))}
              setList={handleFolderItemsChange}
              group="icon-grid"
              animation={200}
              ghostClass="blue-background-class"
              dragClass="dragging-element"
              onMove={handleFolderSortableMove}
              className={cn(
                "grid gap-4 p-4"
              )}
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${iconStyle.size}px, 1fr))`,
              }}
            >
              {folderItems.map((item) => (
                <div key={item.id} data-id={item.id}>
                  <IconItem
                    item={item}
                    iconStyle={iconStyle}
                    openInNewTab={openInNewTab}
                  />
                </div>
              ))}
            </ReactSortable>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
