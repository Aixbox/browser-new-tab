"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { useSortable, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GlobeIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import type { DockItem } from "@/lib/grid-model";

// 图标加载组件

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



interface DockProps {
  items: DockItem[];
  onItemsChange: (items: DockItem[]) => void;
  openInNewTab?: boolean;
  iconStyle?: { size: number; borderRadius: number; opacity: number; showName: boolean; nameSize: number; nameColor: string; dockShowName: boolean };
}

// 可拖拽的 Dock 图标项
const DraggableDockItem = ({ 
  item, 
  index,
  iconSize,
  borderRadius,
  opacity,
  nameSize,
  nameColor,
  showName,
  openInNewTab,
  onHoverChange
}: {
  item: DockItem;
  index: number;
  iconSize: number;
  borderRadius: number;
  opacity: number;
  nameSize: number;
  nameColor: string;
  showName: boolean;
  openInNewTab: boolean;
  onHoverChange: (index: number | null) => void;
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
    transition: { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" },
  });


  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const iconStyle_css = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    borderRadius: `${borderRadius}px`,
    opacity: opacity,
  };

  const handleIconClick = (e: React.MouseEvent) => {
    // 如果正在拖拽，不触发点击
    if (isDragging) {
      e.preventDefault();
      return;
    }
    const target = openInNewTab ? '_blank' : '_self';
    window.open(item.url, target);
  };

  const renderIcon = () => {
    if (item.iconType === 'text' && item.iconText && item.iconColor) {
      return (
        <div 
          className="flex items-center justify-center text-white font-semibold overflow-hidden"
          style={{
            ...iconStyle_css,
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
          className="object-cover"
          style={iconStyle_css}
        />
      );
    }

    if (item.iconType === 'logo' && item.iconLogo) {
      return (
        <IconImage 
          src={item.iconLogo}
          alt={item.name}
          className="object-contain"
          style={iconStyle_css}
        />
      );
    }

    return (
      <div 
        className="flex items-center justify-center bg-white/5"
        style={iconStyle_css}
      >
        <GlobeIcon className="w-6 h-6 text-white" />
      </div>
    );
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-center"
      {...attributes}
      {...listeners}
    >
      <div
        className="cursor-grab active:cursor-grabbing relative hover:opacity-80 transition-opacity"
        onClick={handleIconClick}
        onMouseEnter={() => onHoverChange(index)}
        onMouseLeave={() => onHoverChange(null)}
      >
        {renderIcon()}
      </div>
      {showName && (
        <span 
          className="text-center font-medium leading-tight mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
          style={{
            fontSize: `${nameSize}px`,
            color: nameColor,
            width: `${iconSize + 20}px`,
          }}
        >
          {item.name}
        </span>
      )}
    </div>
  );
};

export const Dock = ({ items, onItemsChange, openInNewTab = true, iconStyle }: DockProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { setNodeRef, isOver } = useDroppable({
    id: 'dock-droppable',
  });

  const iconSize = iconStyle?.size || 80; // 使用宫格的图标大小
  const iconSpacing = 16; // 图标间距
  const nameSize = iconStyle?.nameSize || 12; // 使用宫格的名称大小
  const nameColor = iconStyle?.nameColor || '#ffffff'; // 使用宫格的名称颜色
  const showName = iconStyle?.dockShowName ?? false; // Dock 栏独立的名称显示开关
  const borderRadius = iconStyle?.borderRadius || 12;
  const opacity = (iconStyle?.opacity || 100) / 100;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full flex justify-center py-4"
    >
      <div
        ref={setNodeRef}
        className={cn(
          "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl px-3 py-3 transition-all duration-300",
          isOver && "bg-white/20 border-white/40 scale-105"
        )}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div 
            className="flex items-end"
            style={{ 
              gap: `${iconSpacing}px`,
              minHeight: `${iconSize}px`,
            }}
          >
            {items.length === 0 ? (
              <div 
                style={{
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                }}
                className="flex items-center justify-center"
              />
            ) : (
              items.map((item, index) => (
                <DraggableDockItem
                  key={item.id}
                  item={item}
                  index={index}
                  iconSize={iconSize}
                  borderRadius={borderRadius}
                  opacity={opacity}
                  nameSize={nameSize}
                  nameColor={nameColor}
                  showName={showName}
                  openInNewTab={openInNewTab}
                  onHoverChange={setHoveredIndex}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </motion.div>
  );
};
