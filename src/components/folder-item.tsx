"use client";

import { useState, useEffect, useRef } from "react";
import { rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import type { FolderItem, IconItem } from "@/lib/grid-model";
import * as Portal from "@radix-ui/react-portal";
import { cn } from "@/lib/utils";


interface FolderItemProps {
  folder: FolderItem;
  openInNewTab: boolean;
  iconStyle?: { 
    size: number; 
    borderRadius: number; 
    opacity: number; 
    spacing: number;
    showName: boolean; 
    nameSize: number; 
    nameColor: string;
    maxWidth: number;
  };
  nameMaxWidth: number;
  onDelete: (id: string) => void;
  onEdit: (folder: FolderItem) => void;
  onRemoveItem: (folderId: string, itemId: string) => void;
  onOpenItem: (item: IconItem) => void;
  isFolderPreviewTarget?: boolean;
}

// 文件夹图标预览 - 显示前4个图标的缩略图
const FolderPreview = ({ items, size }: { items: IconItem[]; size: number }) => {
  const displayItems = items.slice(0, 4);
  const gridSize = displayItems.length === 1 ? 1 : 2;

  return (
    <div 
      className="grid gap-0.5 p-1 bg-primary/20 backdrop-blur-md border-2 border-white/30 rounded-lg overflow-hidden"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {displayItems.map((item, index) => (
        <div
          key={item.id}
          className="rounded overflow-hidden bg-white/10 flex items-center justify-center"
        >
          {item.iconType === 'text' && item.iconText && item.iconColor ? (
            <div
              className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
              style={{ backgroundColor: item.iconColor }}
            >
              {item.iconText.substring(0, 2)}
            </div>
          ) : item.iconType === 'image' && item.iconImage ? (
            <img src={item.iconImage} alt={item.name} className="w-full h-full object-cover" />
          ) : item.iconType === 'logo' && item.iconLogo ? (
            <img src={item.iconLogo} alt={item.name} className="w-full h-full object-contain p-0.5" />
          ) : (
            <div className="w-full h-full bg-white/20" />
          )}
        </div>
      ))}
    </div>
  );
};

// 文件夹内的可拖动图标
const FolderIconItem = ({ 
  item, 
  iconSize, 
  borderRadius, 
  showName, 
  nameSize, 
  nameColor, 
  nameMaxWidth,
  onClick,
  onDragStart
}: {
  item: IconItem;
  iconSize: number;
  borderRadius: number;
  showName: boolean;
  nameSize: number;
  nameColor: string;
  nameMaxWidth: number;
  onClick: () => void;
  onDragStart?: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    transition: { duration: 300, easing: "cubic-bezier(0.14, 1, 0.28, 1)" },
  });


  // 当 isDragging 变为 true 时调用 onDragStart（延迟触发避免误触）
  useEffect(() => {
    if (isDragging && onDragStart) {
      // 延迟一点点，确保真的在拖动而不是点击
      const timer = setTimeout(() => {
        onDragStart();
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]); // 只依赖 isDragging，不依赖 onDragStart

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  } as React.CSSProperties;
  
  // 处理点击 - 只在没有拖动时触发
  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative cursor-grab active:cursor-grabbing"
      onClickCapture={handleClick}
    >

      <div 
        className="rounded-lg overflow-hidden flex items-center justify-center"
        style={{
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          borderRadius: `${borderRadius}px`,
        }}
      >
        {item.iconType === 'text' && item.iconText && item.iconColor ? (
          <div
            className="w-full h-full flex items-center justify-center text-white font-semibold"
            style={{ 
              backgroundColor: item.iconColor,
              fontSize: `${iconSize / 4}px`,
            }}
          >
            {item.iconText}
          </div>
        ) : item.iconType === 'image' && item.iconImage ? (
          <img src={item.iconImage} alt={item.name} className="w-full h-full object-cover" />
        ) : item.iconType === 'logo' && item.iconLogo ? (
          <img src={item.iconLogo} alt={item.name} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-white/10" />
        )}
      </div>
      {showName && (
        <p 
          className="font-medium leading-tight text-center block truncate"
          style={{
            fontSize: `${nameSize}px`,
            color: nameColor,
            marginTop: '8px',
            width: `${nameMaxWidth}px`,
            marginLeft: `${-(nameMaxWidth - iconSize) / 2}px`,
          }}
        >
          {item.name}
        </p>
      )}
    </div>
  );
};


export const FolderItemComponent = ({
  folder,
  openInNewTab,
  iconStyle,
  nameMaxWidth,
  onDelete,
  onEdit,
  onRemoveItem,
  onOpenItem,
  isFolderPreviewTarget = false,
}: FolderItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [folderItems, setFolderItems] = useState(folder.items);
  const [isDraggingFromFolder, setIsDraggingFromFolder] = useState(false);
  const [dragOverBackground, setDragOverBackground] = useState(false);
  const dragOverTimerRef = useRef<NodeJS.Timeout | null>(null);

  
  // 同步 folder.items 的变化
  useEffect(() => {
    setFolderItems(folder.items);
  }, [folder.items]);
  
  // 监听全局拖动结束事件 - 拖动结束后关闭文件夹
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      if (isDraggingFromFolder) {
        // 清除计时器
        if (dragOverTimerRef.current) {
          clearTimeout(dragOverTimerRef.current);
          dragOverTimerRef.current = null;
        }
        // 延迟关闭，确保拖动完全结束
        setTimeout(() => {
          setIsDraggingFromFolder(false);
          setDragOverBackground(false);
          setIsOpen(false);
        }, 100);
      }
    };
    
    window.addEventListener('folderDragEnd', handleGlobalDragEnd);
    
    return () => {
      window.removeEventListener('folderDragEnd', handleGlobalDragEnd);
      if (dragOverTimerRef.current) {
        clearTimeout(dragOverTimerRef.current);
      }
    };
  }, [isDraggingFromFolder]);


  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
    transition: { duration: 300, easing: "cubic-bezier(0.14, 1, 0.28, 1)" },
  });

  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    cursor: 'pointer',
  } as React.CSSProperties;


  const iconSize = iconStyle?.size || 80;
  const showName = iconStyle?.showName ?? true;
  const nameSize = iconStyle?.nameSize ?? 12;
  const nameColor = iconStyle?.nameColor ?? '#ffffff';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menu = document.createElement('div');
    menu.className = 'fixed bg-primary/20 backdrop-blur-md border-2 border-white/30 rounded-lg shadow-xl z-[100] py-1 min-w-[120px]';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    
    const editBtn = document.createElement('button');
    editBtn.className = 'w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors';
    editBtn.textContent = '重命名';
    editBtn.onclick = () => {
      onEdit(folder);
      document.body.removeChild(menu);
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'w-full px-4 py-2 text-left text-red-400 hover:bg-white/10 transition-colors';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = () => {
      if (window.confirm(`确定要删除文件夹 "${folder.name}" 吗？`)) {
        onDelete(folder.id);
      }
      document.body.removeChild(menu);
    };
    
    menu.appendChild(editBtn);
    menu.appendChild(deleteBtn);
    document.body.appendChild(menu);
    
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', closeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);
  };

  const handleItemClick = (item: IconItem) => {
    onOpenItem(item);
  };

  return (
    <>
      <motion.div
        layout
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="relative cursor-pointer"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        transition={{
          layout: {
            type: "spring",
            stiffness: 350,
            damping: 30
          }
        }}
      >
        <div 
          className={cn(
            "transition-all duration-300",
            isFolderPreviewTarget && "ring-4 ring-blue-400/80 rounded-xl scale-105"
          )}
          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
        >
          <FolderPreview items={folder.items} size={iconSize} />
        </div>
        {showName && !isDragging && (
          <span 
            className="font-medium leading-tight text-center block truncate"
            style={{
              fontSize: `${nameSize}px`,
              color: nameColor,
              marginTop: '8px',
              width: `${nameMaxWidth}px`,
              marginLeft: `${-(nameMaxWidth - iconSize) / 2}px`,
            }}
          >
            {folder.name}
          </span>
        )}
      </motion.div>

      {/* 文件夹打开对话框 */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <Portal.Root>
            {/* 遮罩 - 拖动时隐藏 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isDraggingFromFolder ? 0 : 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              style={{ pointerEvents: isDraggingFromFolder ? 'none' : 'auto' }}
              onClick={() => !isDraggingFromFolder && setIsOpen(false)}
            />

            {/* 文件夹名称 - 显示在对话框外顶部，拖动时隐藏 */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: isDraggingFromFolder ? 0 : 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-[calc(50%-45vh-3rem)] left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            >
              <h2 className="text-2xl font-semibold text-white drop-shadow-lg">{folder.name}</h2>
            </motion.div>


            {/* 对话框 - 拖动时隐藏但保持挂载 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: isDraggingFromFolder ? 0 : 1, 
                scale: 1,
                visibility: isDraggingFromFolder ? 'hidden' : 'visible'
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] max-h-[80vh] bg-primary/20 backdrop-blur-md border-2 border-white/30 rounded-xl z-50 shadow-2xl"
              style={{ pointerEvents: isDraggingFromFolder ? 'none' : 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 图标网格 */}
              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <SortableContext items={folderItems.map((item) => item.id)} strategy={rectSortingStrategy}>
                  <div 
                    className="grid w-full"
                    style={{
                      gridTemplateColumns: `repeat(auto-fill, ${iconStyle?.size || 80}px)`,
                      gap: `${iconStyle?.spacing ?? 16}px`
                    }}
                  >
                    {folderItems.map((item) => {
                      const iconSize = iconStyle?.size || 80;
                      const borderRadius = iconStyle?.borderRadius || 12;
                      const showName = iconStyle?.showName ?? true;
                      const nameSize = iconStyle?.nameSize ?? 12;
                      const nameColor = iconStyle?.nameColor ?? '#ffffff';
                      const nameMaxWidth = iconSize + (iconStyle?.spacing ?? 16) - 6;

                      return (
                        <FolderIconItem
                          key={item.id}
                          item={item}
                          iconSize={iconSize}
                          borderRadius={borderRadius}
                          showName={showName}
                          nameSize={nameSize}
                          nameColor={nameColor}
                          nameMaxWidth={nameMaxWidth}
                          onClick={() => handleItemClick(item)}
                          onDragStart={() => setIsDraggingFromFolder(true)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </div>
            </motion.div>
          </Portal.Root>
        )}
      </AnimatePresence>
    </>
  );
};
