"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { HexColorPicker } from "react-colorful";
import { GlobeIcon, PlusIcon, Cross2Icon } from "@radix-ui/react-icons";
import { Folder } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as Portal from "@radix-ui/react-portal";
import { cn } from "@/lib/utils";
import type { GridItem, IconItem } from "@/lib/grid-model";
import type { IconStyleSettings } from "@/components/icon-settings";
import { isFolder, isIcon, createFolder } from "@/lib/grid-model";
import type Sortable from "sortablejs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

// 添加新图标的占位符
const AddIconPlaceholder = ({ onClick, iconStyle }: { onClick: () => void; iconStyle: IconStyleSettings }) => {
  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer group"
      onClick={onClick}
      style={{ width: `${iconStyle.size}px` }}
    >
      <div
        className="flex items-center justify-center rounded-lg border-2 border-dashed border-white/30 hover:border-white/50 transition-colors"
        style={{
          width: `${iconStyle.size}px`,
          height: `${iconStyle.size}px`,
          borderRadius: `${iconStyle.borderRadius}px`,
        }}
      >
        <PlusIcon className="w-6 h-6 text-white/60" />
      </div>
      {iconStyle.showName && (
        <span
          className="text-center truncate w-full text-white/60"
          style={{
            fontSize: `${iconStyle.nameSize}px`,
          }}
        >
          添加
        </span>
      )}
    </div>
  );
};

// 预设颜色
const presetColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export const IconGrid = ({ items, onItemsChange, openInNewTab, iconStyle }: IconGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(6);
  const [openFolder, setOpenFolder] = useState<GridItem | null>(null);
  const [folderItems, setFolderItems] = useState<IconItem[]>([]);

  // 添加图标对话框状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<IconItem | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    iconLogo: '',
    iconImage: '',
    iconText: '',
    iconColor: '#3b82f6',
  });
  const [selectedIconType, setSelectedIconType] = useState<'logo' | 'image' | 'text'>('logo');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [tempColor, setTempColor] = useState('#3b82f6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  
  // 保存最后打开的文件夹 ID，用于弹窗关闭后的数据同步
  const lastOpenFolderIdRef = useRef<string | null>(null);
  
  // 保存最新的 folderItems，用于外部网格 setList 读取（避免读取过期的 state）
  const latestFolderItemsRef = useRef<IconItem[]>([]);
  
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
    
    // 全局拖拽事件监听
    const handleDragOver = (e: DragEvent) => {
      if (!openFolder) return;
      
      // 获取弹窗内容区域
      const dialogContent = document.querySelector('[role="dialog"]');
      if (!dialogContent) return;
      
      const rect = dialogContent.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // 检查鼠标是否在弹窗外（遮罩区域）
      const isOutside = mouseX < rect.left || mouseX > rect.right || 
                        mouseY < rect.top || mouseY > rect.bottom;
      
      if (isOutside) {
        // 鼠标在遮罩区域
        if (!overlayHoverStateRef.current.isHovering) {
          overlayHoverStateRef.current.isHovering = true;
          overlayHoverStateRef.current.hoverStartTime = Date.now();
          
          console.log('🎯 开始悬停在遮罩区域');
          
          // 设置1秒后关闭弹窗
          overlayHoverStateRef.current.hoverTimer = setTimeout(() => {
            console.log('🚪 关闭文件夹弹窗（拖拽中）');
            setOpenFolder(null);
            overlayHoverStateRef.current.isHovering = false;
          }, 1000);
        }
      } else {
        // 鼠标回到弹窗内
        if (overlayHoverStateRef.current.hoverTimer) {
          console.log('❌ 取消关闭弹窗');
          clearTimeout(overlayHoverStateRef.current.hoverTimer);
          overlayHoverStateRef.current.hoverTimer = null;
        }
        overlayHoverStateRef.current.isHovering = false;
        overlayHoverStateRef.current.hoverStartTime = null;
      }
    };
    
    const handleDragEnd = () => {
      // 拖拽结束，清理状态
      if (overlayHoverStateRef.current.hoverTimer) {
        clearTimeout(overlayHoverStateRef.current.hoverTimer);
        overlayHoverStateRef.current.hoverTimer = null;
      }
      overlayHoverStateRef.current.isHovering = false;
      overlayHoverStateRef.current.hoverStartTime = null;
      console.log('📍 拖拽结束');
    };
    
    // 添加全局事件监听
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragend', handleDragEnd);
    
    return () => {
      window.removeEventListener("resize", updateColumns);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragend', handleDragEnd);
      
      // 清理定时器
      if (folderHoverStateRef.current.hoverTimer) {
        clearTimeout(folderHoverStateRef.current.hoverTimer);
      }
      if (overlayHoverStateRef.current.hoverTimer) {
        clearTimeout(overlayHoverStateRef.current.hoverTimer);
      }
    };
  }, [iconStyle.size, iconStyle.spacing, openFolder]);

  const handleFolderClick = (folder: GridItem) => {
    if (isFolder(folder)) {
      setOpenFolder(folder);
      setFolderItems([...folder.items]);
      lastOpenFolderIdRef.current = folder.id;
      latestFolderItemsRef.current = [...folder.items];  // ← 同步初始化 ref
    }
  };

  const handleFolderItemsChange = (newItems: IconItem[]) => {
    console.log('📝 handleFolderItemsChange 被调用:', {
      lastOpenFolderId: lastOpenFolderIdRef.current,
      newItemsCount: newItems.length,
      newItems: newItems.map(i => i.name)
    });
    
    // 立即更新 ref（同步）
    latestFolderItemsRef.current = newItems;
    
    // 更新 state（用于 UI 渲染）
    setFolderItems(newItems);
    
    // 如果文件夹被清空或只剩1个，关闭弹窗
    if (newItems.length <= 1) {
      setOpenFolder(null);
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
    lastOpenFolderIdRef.current = null;  // ← 清除保存的 ID
  };

  // 从URL获取网站元数据
  const fetchMetadata = async (url: string) => {
    if (!url.trim()) return;
    setIsLoadingMetadata(true);
    try {
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json() as { title?: string; favicon?: string };
        setFormData(prev => ({
          ...prev,
          name: data.title || prev.name,
          iconText: data.title?.substring(0, 4) || prev.iconText,
          iconLogo: data.favicon || prev.iconLogo,
        }));
      }
    } catch (error) {
      console.error('获取网站元数据失败:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleUrlBlur = useCallback(() => {
    if (formData.url) {
      fetchMetadata(formData.url);
    }
  }, [formData.url]);

  const handleColorChange = useCallback((color: string) => {
    setTempColor(color);
    setFormData(prev => ({ ...prev, iconColor: color }));
  }, []);

  const handlePresetColorClick = useCallback((color: string) => {
    setFormData(prev => ({ ...prev, iconColor: color }));
    setTempColor(color);
    setShowColorPicker(false);
  }, []);

  const handleCustomColorClick = useCallback(() => {
    if (colorButtonRef.current) {
      const rect = colorButtonRef.current.getBoundingClientRect();
      setPickerPosition({ top: rect.bottom + 8, left: rect.left });
    }
    setShowColorPicker(prev => !prev);
  }, []);

  // 点击外部关闭颜色选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

  const resetForm = () => {
    setFormData({ url: '', name: '', iconLogo: '', iconImage: '', iconText: '', iconColor: '#3b82f6' });
    setSelectedIconType('logo');
    setIsEditMode(false);
    setEditingItem(null);
    setShowColorPicker(false);
  };

  const handleSaveIcon = (continueAdding: boolean = false) => {
    if (!formData.url.trim() || !formData.name.trim()) return;

    let newItems: GridItem[];

    if (isEditMode && editingItem) {
      newItems = items.map(item => {
        if (item.id === editingItem.id && isIcon(item)) {
          return {
            ...item,
            name: formData.name.trim(),
            url: formData.url.trim(),
            iconType: selectedIconType,
            iconLogo: formData.iconLogo || undefined,
            iconImage: formData.iconImage || undefined,
            iconText: formData.iconText || undefined,
            iconColor: formData.iconColor || undefined,
          };
        }
        return item;
      });
    } else {
      const newItem: IconItem = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        url: formData.url.trim(),
        iconType: selectedIconType,
        iconLogo: formData.iconLogo || undefined,
        iconImage: formData.iconImage || undefined,
        iconText: formData.iconText || undefined,
        iconColor: formData.iconColor || undefined,
      };
      newItems = [...items, newItem];
    }

    onItemsChange(newItems);

    if (continueAdding && !isEditMode) {
      setFormData({ url: '', name: '', iconLogo: '', iconImage: '', iconText: '', iconColor: '#3b82f6' });
      setSelectedIconType('logo');
    } else {
      resetForm();
      setIsDialogOpen(false);
    }
  };

  const renderIconPreview = () => {
    const previews = [];
    if (formData.iconLogo) {
      previews.push(
        <div
          key="logo"
          className={cn(
            "w-16 h-16 flex items-center justify-center rounded-lg bg-white/5 cursor-pointer transition-all",
            selectedIconType === 'logo' ? "ring-4 ring-white/80 scale-105" : "ring-2 ring-white/30 hover:ring-white/50"
          )}
          onClick={() => setSelectedIconType('logo')}
        >
          <img src={formData.iconLogo} alt="Logo" className="w-10 h-10 rounded object-contain" />
        </div>
      );
    }
    if (formData.iconImage) {
      previews.push(
        <div
          key="image"
          className={cn(
            "w-16 h-16 rounded-lg cursor-pointer transition-all overflow-hidden",
            selectedIconType === 'image' ? "ring-4 ring-white/80 scale-105" : "ring-2 ring-white/30 hover:ring-white/50"
          )}
          onClick={() => setSelectedIconType('image')}
        >
          <img src={formData.iconImage} alt="Icon" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (formData.iconText && formData.iconColor) {
      previews.push(
        <div
          key="text"
          className={cn(
            "w-16 h-16 flex items-center justify-center rounded-lg cursor-pointer transition-all",
            selectedIconType === 'text' ? "ring-4 ring-white/80 scale-105" : "ring-2 ring-white/30 hover:ring-white/50"
          )}
          style={{ backgroundColor: formData.iconColor }}
          onClick={() => setSelectedIconType('text')}
        >
          <span className="text-white text-lg font-bold">{formData.iconText.substring(0, 4)}</span>
        </div>
      );
    }
    if (previews.length === 0) {
      return <p className="text-sm text-white/40">输入地址后自动获取图标</p>;
    }
    return previews;
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
            // 拖动到文件夹上：触发合并高亮 + 悬停计时器
            mergeStateRef.current.mergeMode = true;
            mergeStateRef.current.mergePosition = 'after';
            related.classList.add('merge-highlight');
            mergeStateRef.current.highlightedElement = related;
            
            // 悬停在文件夹上，设置计时器
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
            // 拖动到文件夹上：触发合并高亮 + 悬停计时器
            mergeStateRef.current.mergeMode = true;
            mergeStateRef.current.mergePosition = 'before';
            related.classList.add('merge-highlight');
            mergeStateRef.current.highlightedElement = related;
            
            // 悬停在文件夹上，设置计时器
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

    // 跨容器拖拽（拖到 Dock 或从 Dock 拖入），跳过合并逻辑
    if (evt.from !== evt.to) {
      mergeStateRef.current.mergeMode = false;
      mergeStateRef.current.mergePosition = null;
      mergeStateRef.current.highlightedElement = null;
      return;
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
        mergePosition: mergeStateRef.current.mergePosition,
        targetIsFolder: targetItem ? isFolder(targetItem) : false
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
      
      // 判断目标是否是文件夹
      if (isFolder(targetItem)) {
        // 目标是文件夹：将拖动的图标添加到文件夹内
        console.log('� 添加到文件夹:', targetItem.name);
        
        const updatedFolder = {
          ...targetItem,
          items: [...targetItem.items, ...draggedIcons]
        };
        
        // 更新列表：移除拖动的元素，更新目标文件夹
        const newItems = items
          .filter((_, index) => index !== evt.oldIndex)
          .map((item, index) => {
            // 注意：过滤后索引会变化
            const originalIndex = index >= evt.oldIndex ? index + 1 : index;
            return originalIndex === targetIndex ? updatedFolder : item;
          });
        
        console.log('✅ 更新后的列表:', {
          原始数量: items.length,
          新数量: newItems.length,
          items: newItems.map(i => i.name)
        });
        
        onItemsChange(newItems);
      } else {
        // 目标是普通图标：创建新文件夹
        const targetIcons: IconItem[] = [targetItem];
        
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
            const currentRefCount = latestFolderItemsRef.current.length;

            console.log('🔵 外部网格 setList 被调用:', {
              lastOpenFolderId: lastOpenFolderIdRef.current,
              newStateCount: newState.length,
              folderItemsCount: folderItems.length,
              latestFolderItemsRefCount: currentRefCount
            });

            // 跨容器拖拽：项目数量变化时，强制清除合并状态
            if (newState.length !== items.length) {
              mergeStateRef.current.mergeMode = false;
              mergeStateRef.current.mergePosition = null;
              if (mergeStateRef.current.highlightedElement) {
                mergeStateRef.current.highlightedElement.classList.remove('merge-highlight');
                mergeStateRef.current.highlightedElement = null;
              }
            }

            // 如果处于合并模式，不执行默认的排序更新
            // 合并逻辑会在 onEnd 中处理
            if (!mergeStateRef.current.mergeMode) {
              // 如果有最近打开的文件夹，需要保留最新的 folderItems
              if (lastOpenFolderIdRef.current) {
                // 使用 requestAnimationFrame 在下一帧更新，减少闪烁
                requestAnimationFrame(() => {
                  const latestFolderItems = latestFolderItemsRef.current;
                  
                  console.log('🎬 下一帧更新，使用最新的文件夹内容:', {
                    folderId: lastOpenFolderIdRef.current,
                    itemCount: latestFolderItems.length,
                    items: latestFolderItems.map(i => i.name)
                  });
                  
                  const updatedState = newState.map(item => {
                    if (item.id === lastOpenFolderIdRef.current && isFolder(item)) {
                      console.log('🔄 替换文件夹内容:', {
                        folderId: item.id,
                        oldCount: isFolder(item) ? item.items.length : 0,
                        newCount: latestFolderItems.length
                      });
                      
                      // 如果只剩一个图标，解散文件夹
                      if (latestFolderItems.length === 1) {
                        console.log('📂 文件夹只剩1个图标，自动解散');
                        return latestFolderItems[0];
                      }
                      // 如果为空，移除文件夹
                      if (latestFolderItems.length === 0) {
                        console.log('📂 文件夹为空，移除');
                        return null;
                      }
                      // 更新文件夹内容
                      return {
                        ...item,
                        items: latestFolderItems,
                      };
                    }
                    return item;
                  }).filter((item): item is GridItem => item !== null);
                  
                  onItemsChange(updatedState);
                  
                  // 如果文件夹被解散或移除，清除引用
                  if (latestFolderItems.length <= 1) {
                    lastOpenFolderIdRef.current = null;
                    setOpenFolder(null);
                  }
                });
              } else {
                onItemsChange(newState);
              }
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
          filter=".add-icon-placeholder"
          preventOnFilter={false}
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
          <div key="__add__" className="add-icon-placeholder">
            <AddIconPlaceholder onClick={() => setIsDialogOpen(true)} iconStyle={iconStyle} />
          </div>
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

      {/* 添加图标对话框 */}
      <AnimatePresence>
        {isDialogOpen && (
          <Portal.Root>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => { setIsDialogOpen(false); resetForm(); }}
            />

            {/* 对话框 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] bg-primary/20 backdrop-blur-md border-2 border-white/30 rounded-xl z-50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 对话框头部 */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <h2 className="text-xl font-semibold text-white">
                  {isEditMode ? '编辑图标' : '添加图标'}
                </h2>
                <button
                  onClick={() => { setIsDialogOpen(false); resetForm(); }}
                  className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/80 hover:text-white"
                >
                  <Cross2Icon className="w-4 h-4" />
                </button>
              </div>

              {/* 表单内容 */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* 地址 */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="icon-url" className="text-white w-24 flex-shrink-0">地址</Label>
                  <Input
                    id="icon-url"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    onBlur={handleUrlBlur}
                    disabled={isLoadingMetadata}
                    className="flex-1"
                  />
                </div>

                {/* 名称 */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="icon-name" className="text-white w-24 flex-shrink-0">名称</Label>
                  <Input
                    id="icon-name"
                    placeholder="网站名称"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex-1"
                  />
                </div>

                {/* 图标预览 */}
                <div className="flex items-start gap-4">
                  <Label className="text-white w-24 flex-shrink-0 pt-2">图标</Label>
                  <div className="flex-1">
                    <div className="flex gap-3 flex-wrap">
                      {renderIconPreview()}
                    </div>
                    <p className="text-xs text-white/60 mt-2">点击选择要使用的图标样式</p>
                  </div>
                </div>

                {/* 图标链接 */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="icon-image" className="text-white w-24 flex-shrink-0">图标链接</Label>
                  <Input
                    id="icon-image"
                    type="url"
                    placeholder="https://example.com/icon.png（可选）"
                    value={formData.iconImage}
                    onChange={(e) => setFormData({ ...formData, iconImage: e.target.value })}
                    className="flex-1"
                  />
                </div>

                {/* 图标颜色 */}
                <div className="flex items-center gap-4">
                  <Label className="text-white w-24 flex-shrink-0">图标颜色</Label>
                  <div className="flex gap-2 flex-1 items-center flex-wrap">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handlePresetColorClick(color)}
                        className={cn(
                          "w-6 h-6 rounded-full cursor-pointer transition-transform flex-shrink-0",
                          formData.iconColor === color
                            ? "ring-2 ring-white/80 ring-offset-2 ring-offset-transparent scale-110"
                            : "hover:scale-110"
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <div className="relative">
                      <button
                        ref={colorButtonRef}
                        type="button"
                        onClick={handleCustomColorClick}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform flex items-center justify-center cursor-pointer",
                          !presetColors.includes(formData.iconColor)
                            ? "ring-2 ring-white/80 ring-offset-2 ring-offset-transparent scale-110"
                            : "border-2 border-dashed border-white/50 hover:scale-110"
                        )}
                        style={{
                          backgroundColor: !presetColors.includes(formData.iconColor) ? formData.iconColor : 'transparent'
                        }}
                        title="自定义颜色"
                      >
                        {presetColors.includes(formData.iconColor) && (
                          <PlusIcon className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 颜色选择器弹出层 */}
                {showColorPicker && (
                  <Portal.Root>
                    <div
                      ref={colorPickerRef}
                      className="fixed z-[100] p-3 bg-primary/20 backdrop-blur-md border-2 border-white/30 rounded-lg shadow-xl"
                      style={{
                        top: `${pickerPosition.top}px`,
                        left: `${pickerPosition.left}px`,
                      }}
                    >
                      <HexColorPicker color={tempColor} onChange={handleColorChange} />
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="text"
                          value={tempColor}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="h-8 text-sm font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </Portal.Root>
                )}

                {/* 图标文字 */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="icon-text" className="text-white w-24 flex-shrink-0">图标文字</Label>
                  <Input
                    id="icon-text"
                    placeholder="图标中显示的文字（可选）"
                    value={formData.iconText}
                    onChange={(e) => setFormData({ ...formData, iconText: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* 按钮区域 */}
              <div className="flex gap-3 p-6 border-t border-white/20">
                <Button
                  onClick={() => handleSaveIcon(false)}
                  disabled={!formData.url.trim() || !formData.name.trim()}
                  className="flex-1"
                >
                  {isEditMode ? '保存' : '添加'}
                </Button>
                {!isEditMode && (
                  <Button
                    onClick={() => handleSaveIcon(true)}
                    disabled={!formData.url.trim() || !formData.name.trim()}
                    variant="ghost"
                    className="flex-1"
                  >
                    保存并继续
                  </Button>
                )}
              </div>
            </motion.div>
          </Portal.Root>
        )}
      </AnimatePresence>
    </>
  );
};
