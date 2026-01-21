"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { HexColorPicker } from "react-colorful";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GlobeIcon, PlusIcon, Cross2Icon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isFolder, isIcon } from "@/lib/grid-model";
import type { FolderItem, GridItem, IconItem } from "@/lib/grid-model";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import * as Portal from "@radix-ui/react-portal";
import { FolderItemComponent } from "./folder-item";
import { useGridStore } from "@/lib/grid-store";


// 图标加载组件 - 支持失败后使用代理
const IconImage = ({ src, alt, className, style }: { 
  src: string; 
  alt: string; 
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [hasError, setHasError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  const handleError = () => {
    if (!useProxy) {
      setUseProxy(true);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={cn("flex items-center justify-center bg-white/5", className)} style={style}>
        <GlobeIcon className="w-6 h-6 text-white" />
      </div>
    );
  }

  const imageUrl = useProxy ? `/api/icon?url=${encodeURIComponent(src)}` : src;

  return (
    <img 
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
    />
  );
};

// 文字图标组件 - 自动截断显示完整字符
const TextIcon = ({ text, color, size = 'small' }: { text: string; color: string; size?: 'small' | 'large' }) => {
  const [displayText, setDisplayText] = useState(text);
  const spanRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!spanRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const span = spanRef.current;
    const containerWidth = container.offsetWidth - 8; // 减去 padding

    // 测量文字宽度
    span.textContent = text;
    let currentText = text;
    
    while (span.offsetWidth > containerWidth && currentText.length > 0) {
      currentText = currentText.slice(0, -1);
      span.textContent = currentText;
    }

    setDisplayText(currentText);
  }, [text]);

  const sizeClasses = size === 'large' ? 'w-16 h-16 text-sm' : 'w-12 h-12 text-xs';

  return (
    <div 
      ref={containerRef}
      className={cn("flex items-center justify-center rounded-lg text-white font-semibold overflow-hidden px-1", sizeClasses)}
      style={{ backgroundColor: color }}
    >
      <span ref={spanRef} className="whitespace-nowrap">{displayText}</span>
    </div>
  );
};



// 可拖拽的图标项
const DraggableItem = React.memo(({ item, openInNewTab, iconStyle, nameMaxWidth, onDelete, onEdit, isFolderPreviewTarget }: { 
  item: IconItem;
  openInNewTab: boolean;
  iconStyle?: { size: number; borderRadius: number; opacity: number; showName: boolean; nameSize: number; nameColor: string };
  nameMaxWidth: number;
  onDelete: (id: string) => void;
  onEdit: (item: IconItem) => void;
  isFolderPreviewTarget: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    active,
    over,
    rect,
  } = useSortable({
    id: item.id
  });

  // 判断是否应该应用 transform
  const shouldApplyTransform = useMemo(() => {
    // 如果没有 transform，直接返回 true（不影响）
    if (!transform) return true;
    
    // 如果是正在拖拽的元素，始终应用 transform
    if (isDragging) return true;
    
    // 如果没有 active 或 over，应用 transform
    if (!active || !over) return true;
    
    // 只有当前元素是 over 目标时才需要判断
    if (over.id !== item.id) return true;
    
    // 获取当前元素和拖拽元素的位置信息
    const currentRect = rect.current;
    const activeRect = active.rect.current.translated;
    
    if (!currentRect || !activeRect) return true;
    
    // 1. 判断是否在同一行（Y 坐标差距小于元素高度的一半）
    const isSameRow = Math.abs(currentRect.top - activeRect.top) < currentRect.height / 2;
    
    if (!isSameRow) {
      console.log('[DraggableItem] 不在同一行，不交换', {
        current: item.id,
        active: active.id,
        currentY: Math.round(currentRect.top),
        activeY: Math.round(activeRect.top),
      });
      return false;
    }
    
    // 2. 判断拖拽元素的中心点位置
    const activeCenterX = activeRect.left + activeRect.width / 2;
    const activeCenterY = activeRect.top + activeRect.height / 2;
    
    // 3. 判断当前元素（交换目标）在拖拽元素的左边还是右边
    const currentCenterX = currentRect.left + currentRect.width / 2;
    const isCurrentOnLeft = currentCenterX < activeCenterX;
    
    // 4. 定义边缘区域（左右各 1/4 为边缘，中间 1/2 为中心）
    const leftEdge = currentRect.left + currentRect.width / 2.5;
    const rightEdge = currentRect.right - currentRect.width / 2.5;
    const topEdge = currentRect.top + currentRect.height / 4;
    const bottomEdge = currentRect.bottom - currentRect.height / 4;
    
    // 5. 判断是否触碰上下边缘
    if (activeCenterY < topEdge || activeCenterY > bottomEdge) {
      console.log('[DraggableItem] 触碰上下边缘，不交换', {
        current: item.id,
        active: active.id,
        activeCenterY: Math.round(activeCenterY),
        topEdge: Math.round(topEdge),
        bottomEdge: Math.round(bottomEdge),
      });
      return false;
    }
    
    // 6. 根据相对位置判断是否应该交换
    if (isCurrentOnLeft) {
      // 当前元素在拖拽元素左边：只有拖拽元素在左边缘时才交换
      const shouldSwap = activeCenterX < leftEdge;
      console.log('[DraggableItem] 当前在左边', {
        current: item.id,
        active: active.id,
        activeCenterX: Math.round(activeCenterX),
        leftEdge: Math.round(leftEdge),
        shouldSwap,
      });
      return shouldSwap;
    } else {
      // 当前元素在拖拽元素右边：只有拖拽元素在右边缘时才交换
      const shouldSwap = activeCenterX > rightEdge;
      console.log('[DraggableItem] 当前在右边', {
        current: item.id,
        active: active.id,
        activeCenterX: Math.round(activeCenterX),
        rightEdge: Math.round(rightEdge),
        shouldSwap,
      });
      
      return shouldSwap;
    }
  }, [transform, isDragging, active, over, rect, item.id]);

  // 应用 transform 和 transition
  const style = {
    transform: shouldApplyTransform ? CSS.Transform.toString(transform) : undefined,
    transition: shouldApplyTransform ? transition : undefined,
    opacity: isDragging ? 0 : 1,
  } as React.CSSProperties;

  const renderIcon = () => {
    const iconSize = iconStyle?.size || 80;
    const borderRadius = iconStyle?.borderRadius || 12;
    const opacity = (iconStyle?.opacity || 100) / 100;  // 移除 isDragging 检查，因为外层已经处理了

    const iconStyle_css = {
      width: `${iconSize}px`,
      height: `${iconSize}px`,
      borderRadius: `${borderRadius}px`,
      opacity: opacity,
    };

    const hoverClass = "hover:opacity-80 transition-opacity relative";
    const zIndexStyle = { zIndex: 10 };

    if (item.iconType === 'text' && item.iconText && item.iconColor) {
      return (
        <div 
          className={cn("flex items-center justify-center text-white font-semibold overflow-hidden transition-all duration-200", hoverClass)}
          style={{
            ...iconStyle_css,
            ...zIndexStyle,
            backgroundColor: item.iconColor,
            fontSize: `${iconSize / 4}px`,
          }}
        >
          {item.iconText}
        </div>
      );
    }

    if (item.iconType === 'image' && item.iconImage) {
      return (
        <IconImage 
          src={item.iconImage}
          alt={item.name}
          className={cn("object-cover transition-all duration-200", hoverClass)}
          style={{...iconStyle_css, ...zIndexStyle}}
        />
      );
    }

    if (item.iconType === 'logo' && item.iconLogo) {
      return (
        <IconImage 
          src={item.iconLogo}
          alt={item.name}
          className={cn("object-contain transition-all duration-200", hoverClass)}
          style={{...iconStyle_css, ...zIndexStyle}}
        />
      );
    }

    return (
      <div 
        className={cn("flex items-center justify-center bg-white/5 transition-all duration-200", hoverClass)}
        style={{...iconStyle_css, ...zIndexStyle}}
      >
        <GlobeIcon className="w-6 h-6 text-white" />
      </div>
    );
  };

  const handleClick = () => {
    if (!isDragging) {
      const target = openInNewTab ? '_blank' : '_self';
      window.open(item.url, target);
    }
  };

  const showName = iconStyle?.showName ?? true;
  const nameSize = iconStyle?.nameSize ?? 12;
  const nameColor = iconStyle?.nameColor ?? '#ffffff';
  const iconSize = iconStyle?.size || 80;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menu = document.createElement('div');
    menu.className = 'fixed bg-primary/20 backdrop-blur-md border-2 border-white/30 rounded-lg shadow-xl z-[100] py-1 min-w-[120px]';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    
    const editBtn = document.createElement('button');
    editBtn.className = 'w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors';
    editBtn.textContent = '编辑';
    editBtn.onclick = () => {
      onEdit(item);
      document.body.removeChild(menu);
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'w-full px-4 py-2 text-left text-red-400 hover:bg-white/10 transition-colors';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = () => {
      if (window.confirm(`确定要删除 "${item.name}" 吗？`)) {
        onDelete(item.id);
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div
        className="relative cursor-grab active:cursor-grabbing overflow-visible"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div 
          className={cn(
            "transition-all duration-300",
            isFolderPreviewTarget && "ring-4 ring-blue-400/80 rounded-xl scale-105"
          )}
          style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
        >
          {renderIcon()}
        </div>
        {showName && (
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
            {item.name}
          </span>
        )}
      </div>
    </div>
  );
});

// 添加新图标的占位符
const AddIconItem = ({ onClick, iconSize = 80, nameMaxWidth }: { onClick: () => void; iconSize?: number; nameMaxWidth: number }) => {
  return (
    <div
      className="relative cursor-pointer group"
      onClick={onClick}
    >

      <div 
        className="flex items-center justify-center rounded-lg border-2 border-dashed border-white/30 hover:border-white/50 transition-colors relative"
        style={{
          width: `${iconSize}px`,
          height: `${iconSize}px`,
        }}
      >
        <PlusIcon className="w-6 h-6 text-white/60" />
      </div>
      <span 
        className="text-xs text-white/60 text-center font-medium block truncate" 
        style={{ 
          marginTop: '8px', 
          width: `${nameMaxWidth}px`,
          marginLeft: `${-(nameMaxWidth - iconSize) / 2}px`,
        }}
      >
        添加
      </span>
    </div>
  );
};


export const DraggableGrid = ({ openInNewTab: initialOpenInNewTab = true, iconStyle }: { 
  openInNewTab?: boolean;
  iconStyle?: { size: number; borderRadius: number; opacity: number; spacing: number; showName: boolean; nameSize: number; nameColor: string; maxWidth: number };
}) => {
  // 直接从 store 获取数据
  const { gridItems, gridItemIds, setGridItems } = useGridStore();
  const currentItems = gridItems;
  
  // 使用 gridItemIds 作为 SortableContext 的 items（这样拖拽时会实时更新）
  const itemIds = useMemo(() => gridItemIds.length > 0 ? gridItemIds : gridItems.map(item => item.id), [gridItemIds, gridItems]);



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
  const [openInNewTab, setOpenInNewTab] = useState(initialOpenInNewTab);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });



  // 让宫格区域成为 droppable
  const { setNodeRef: setGridDroppableRef, isOver: isGridOver } = useDroppable({
    id: 'grid-droppable',
  });



  // 监听设置变化
  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent) => {
      if (e.detail?.icon !== undefined) {
        setOpenInNewTab(e.detail.icon);
      }
    };
    
    window.addEventListener('openInNewTabChanged', handleSettingsChange as EventListener);
    return () => window.removeEventListener('openInNewTabChanged', handleSettingsChange as EventListener);
  }, []);





  // 预设颜色
  const presetColors = [
    '#3b82f6', // 蓝色
    '#ef4444', // 红色
    '#10b981', // 绿色
    '#f59e0b', // 橙色
    '#8b5cf6', // 紫色
    '#ec4899', // 粉色
    '#06b6d4', // 青色
    '#84cc16', // 黄绿色
  ];

  const handleDelete = async (id: string) => {
    const newCurrentItems = currentItems.filter(item => item.id !== id);
    setGridItems(newCurrentItems);
  };


  // 处理文件夹编辑（重命名）
  const handleFolderEdit = (folder: FolderItem) => {
    const newName = prompt('请输入新的文件夹名称', folder.name);
    if (newName && newName.trim()) {
      const newCurrentItems = currentItems.map(item => 
        item.id === folder.id && isFolder(item)
          ? { ...item, name: newName.trim() }
          : item
      );
      setGridItems(newCurrentItems);
    }
  };

  // 从文件夹中移除图标
  const handleRemoveFromFolder = (folderId: string, itemId: string) => {
    const folder = currentItems.find(item => item.id === folderId && isFolder(item)) as FolderItem | undefined;
    if (!folder) return;

    const removedItem = folder.items.find(item => item.id === itemId);
    if (!removedItem) return;

    // 如果文件夹只剩2个图标，移除一个后解散文件夹
    if (folder.items.length === 2) {
      const remainingItem = folder.items.find(item => item.id !== itemId);
      if (remainingItem) {
        const newCurrentItems = currentItems.map(item => 
          item.id === folderId ? remainingItem : item
        );
        setGridItems(newCurrentItems);
      }
    } else {
      // 更新文件夹，移除图标并将其添加到网格
      const updatedFolder: FolderItem = {
        ...folder,
        items: folder.items.filter(item => item.id !== itemId)
      };
      
      const folderIndex = currentItems.findIndex(item => item.id === folderId);
      const newCurrentItems = [...currentItems];
      newCurrentItems[folderIndex] = updatedFolder;
      newCurrentItems.push(removedItem);
      setGridItems(newCurrentItems);
    }
  };

  // 打开文件夹中的图标
  const handleOpenFolderItem = (item: IconItem) => {
    const target = openInNewTab ? '_blank' : '_self';
    window.open(item.url, target);
  };

  const handleEdit = (item: IconItem) => {
    setEditingItem(item);
    setIsEditMode(true);
    setFormData({
      url: item.url,
      name: item.name,
      iconLogo: item.iconLogo || '',
      iconImage: item.iconImage || '',
      iconText: item.iconText || '',
      iconColor: item.iconColor || '#3b82f6',
    });
    setSelectedIconType(item.iconType);
    setIsDialogOpen(true);
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
      setPickerPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
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

  const handleSave = async (continueAdding: boolean = false) => {
    if (!formData.url.trim() || !formData.name.trim()) return;

    let newCurrentItems: GridItem[];

    if (isEditMode && editingItem) {
      // 编辑模式：更新现有图标
      newCurrentItems = currentItems.map(item => {
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
      // 添加模式：创建新图标
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
      newCurrentItems = [...currentItems, newItem];
    }

    // 更新 store
    setGridItems(newCurrentItems);

    if (continueAdding && !isEditMode) {
      // 重置表单但保持对话框打开（仅在添加模式）
      setFormData({
        url: '',
        name: '',
        iconLogo: '',
        iconImage: '',
        iconText: '',
        iconColor: '#3b82f6',
      });
      setSelectedIconType('logo');
    } else {
      // 关闭对话框并重置状态
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingItem(null);
      setFormData({
        url: '',
        name: '',
        iconLogo: '',
        iconImage: '',
        iconText: '',
        iconColor: '#3b82f6',
      });
      setSelectedIconType('logo');
    }
  };

  const renderIconPreview = () => {
    const previews = [];

    // Logo预览
    if (formData.iconLogo) {
      previews.push(
        <div
          key="logo"
          className={cn(
            "w-16 h-16 flex items-center justify-center rounded-lg bg-white/5 cursor-pointer transition-all",
            selectedIconType === 'logo' 
              ? "ring-4 ring-white/80 scale-105" 
              : "ring-2 ring-white/30 hover:ring-white/50"
          )}
          onClick={() => setSelectedIconType('logo')}
        >
          <IconImage src={formData.iconLogo} alt="Logo" className="w-10 h-10 rounded" />
        </div>
      );
    }

    // 图片预览
    if (formData.iconImage) {
      previews.push(
        <div
          key="image"
          className={cn(
            "w-16 h-16 rounded-lg cursor-pointer transition-all overflow-hidden",
            selectedIconType === 'image' 
              ? "ring-4 ring-white/80 scale-105" 
              : "ring-2 ring-white/30 hover:ring-white/50"
          )}
          onClick={() => setSelectedIconType('image')}
        >
          <IconImage src={formData.iconImage} alt="Icon" className="w-full h-full object-cover" />
        </div>
      );
    }

    // 文字预览
    if (formData.iconText && formData.iconColor) {
      previews.push(
        <div
          key="text"
          className={cn(
            "cursor-pointer transition-all",
            selectedIconType === 'text' 
              ? "ring-4 ring-white/80 scale-105 rounded-lg" 
              : "ring-2 ring-white/30 hover:ring-white/50 rounded-lg"
          )}
          onClick={() => setSelectedIconType('text')}
        >
          <TextIcon text={formData.iconText} color={formData.iconColor} size="large" />
        </div>
      );
    }

    return previews.length > 0 ? previews : (
      <div className="text-sm text-white/60">暂无图标预览</div>
    );
  };

  const iconSize = iconStyle?.size || 80;
  const iconSpacing = iconStyle?.spacing ?? 16;
  const showName = iconStyle?.showName ?? true;
  const nameSize = iconStyle?.nameSize ?? 12;
  // Grid 列宽度只基于图标大小，不包含名称
  const gridMinSize = iconSize;
  // 名称最大宽度 = 图标宽度 + 间距 - 5px（左右各留 2.5px 间距）
  const nameMaxWidth = iconSize + iconSpacing - 6;

  return (
    <>
      <div className="w-full overflow-visible p-2" ref={setGridDroppableRef}>
        <SortableContext items={itemIds} >
          <div
            className={cn(
              "grid w-full overflow-visible",
              isGridOver && "bg-white/5 rounded-lg"
            )}
            style={{
              gridTemplateColumns: `repeat(auto-fill, ${gridMinSize}px)`,
              gap: `${iconSpacing}px`,
              transition: "all 0.3s ease-out",
            }}
          >
            {currentItems.map((item) => {
              if (isFolder(item)) {
                return (
                  <FolderItemComponent
                    key={item.id}
                    folder={item}
                    openInNewTab={openInNewTab}
                    iconStyle={iconStyle}
                    nameMaxWidth={nameMaxWidth}
                    onDelete={handleDelete}
                    onEdit={handleFolderEdit}
                    onRemoveItem={handleRemoveFromFolder}
                    onOpenItem={handleOpenFolderItem}
                  />
                );
              }
              return (
                <DraggableItem
                  key={item.id}
                  item={item}
                  openInNewTab={openInNewTab}
                  iconStyle={iconStyle}
                  nameMaxWidth={nameMaxWidth}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  isFolderPreviewTarget={false}
                />
              );
            })}
            <AddIconItem onClick={() => setIsDialogOpen(true)} iconSize={iconSize} nameMaxWidth={nameMaxWidth} />
          </div>
        </SortableContext>
      </div>

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
              onClick={() => setIsDialogOpen(false)}
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
                  onClick={() => {
                    setIsDialogOpen(false);
                    setIsEditMode(false);
                    setEditingItem(null);
                    setFormData({
                      url: '',
                      name: '',
                      iconLogo: '',
                      iconImage: '',
                      iconText: '',
                      iconColor: '#3b82f6',
                    });
                    setSelectedIconType('logo');
                  }}
                  className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/80 hover:text-white"
                >
                  <Cross2Icon className="w-4 h-4" />
                </button>
              </div>

              {/* 表单内容 */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* 地址 */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="url" className="text-white w-24 flex-shrink-0">地址</Label>
                  <Input
                    id="url"
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
                  <Label htmlFor="name" className="text-white w-24 flex-shrink-0">名称</Label>
                  <Input
                    id="name"
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
                  <Label htmlFor="iconImage" className="text-white w-24 flex-shrink-0">图标链接</Label>
                  <Input
                    id="iconImage"
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
                    {/* 预设颜色圆点 */}
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
                    {/* 自定义颜色圆点 */}
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

                {/* 颜色选择器弹出层 - 使用 Portal */}
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
                  <Label htmlFor="iconText" className="text-white w-24 flex-shrink-0">图标文字</Label>
                  <Input
                    id="iconText"
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
                  onClick={() => handleSave(false)}
                  disabled={!formData.url.trim() || !formData.name.trim()}
                  className="flex-1"
                >
                  {isEditMode ? '保存' : '添加'}
                </Button>
                {!isEditMode && (
                  <Button
                    onClick={() => handleSave(true)}
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