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
    return () => window.removeEventListener("resize", updateColumns);
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
    
    if (isTargetOnLeft) {
      if (isMouseInLeftZone) {
        // 拖到左边缘：避让（交换）
        mergeStateRef.current.mergeMode = false;
        related.classList.remove('merge-highlight');
        mergeStateRef.current.highlightedElement = null;
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
          return false;
        } else {
          mergeStateRef.current.mergeMode = true;
          mergeStateRef.current.mergePosition = 'after';
          related.classList.add('merge-highlight');
          mergeStateRef.current.highlightedElement = related;
          return false;
        }
      }
    } else if (isTargetOnRight) {
      if (isMouseInRightZone) {
        // 拖到右边缘：避让（交换）
        mergeStateRef.current.mergeMode = false;
        related.classList.remove('merge-highlight');
        mergeStateRef.current.highlightedElement = null;
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
          return false;
        } else {
          mergeStateRef.current.mergeMode = true;
          mergeStateRef.current.mergePosition = 'before';
          related.classList.add('merge-highlight');
          mergeStateRef.current.highlightedElement = related;
          return false;
        }
      }
    }
    
    mergeStateRef.current.mergeMode = false;
    return true;
  };

  const handleSortableEnd = (evt: Sortable.SortableEvent) => {
    if (mergeStateRef.current.highlightedElement) {
      mergeStateRef.current.highlightedElement.classList.remove('merge-highlight');
    }
    
    if (mergeStateRef.current.mergeMode && evt.oldIndex !== undefined && evt.newIndex !== undefined) {
      const draggedItem = items[evt.oldIndex];
      const targetIndex = evt.newIndex;
      const targetItem = items[targetIndex];
      
      if (!draggedItem || !targetItem) {
        mergeStateRef.current.mergeMode = false;
        mergeStateRef.current.mergePosition = null;
        mergeStateRef.current.highlightedElement = null;
        return;
      }
      
      // 提取图标项
      const draggedIcons: IconItem[] = isFolder(draggedItem) ? draggedItem.items : [draggedItem];
      const targetIcons: IconItem[] = isFolder(targetItem) ? targetItem.items : [targetItem];
      
      // 根据合并位置创建新文件夹
      const newFolderItems = mergeStateRef.current.mergePosition === 'before' 
        ? [...draggedIcons, ...targetIcons]
        : [...targetIcons, ...draggedIcons];
      
      const newFolder = createFolder(newFolderItems, targetItem.name);
      
      // 更新列表
      const newItems = items.filter((_, index) => index !== evt.oldIndex && index !== targetIndex);
      newItems.splice(Math.min(evt.oldIndex, targetIndex), 0, newFolder);
      
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
            onItemsChange(newState);
          }}
          animation={200}
          delay={0}
          delayOnTouchOnly={true}
          touchStartThreshold={5}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{openFolder?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ReactSortable
              list={folderItems.map((item) => ({ ...item, chosen: false, selected: false }))}
              setList={handleFolderItemsChange}
              animation={200}
              className={cn(
                "grid gap-4"
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
