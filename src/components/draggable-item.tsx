"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import type { IconItem } from "@/lib/grid-model";
import type { IconStyleSettings } from "@/components/icon-settings";
import { GlobeIcon } from "@radix-ui/react-icons";

const ANIMATION_DURATION_MS = 750;

interface DraggableItemProps {
  id: string;
  item: IconItem;
  iconStyle: IconStyleSettings;
  openInNewTab: boolean;
}

// 完全模仿官方示例的 Item 组件 - 使用 React.memo 防止不必要的重渲染
export const DraggableItem = React.memo(({ id, item, iconStyle, openInNewTab }: DraggableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({
    id,
    // 移除 transition 配置，让 dnd-kit 使用默认值
  });

  const handleClick = () => {
    if (!isDragging) {
      const target = openInNewTab ? '_blank' : '_self';
      window.open(item.url, target);
    }
  };

  const iconSize = iconStyle.size || 80;
  const borderRadius = iconStyle.borderRadius || 12;
  const opacity = (iconStyle.opacity || 100) / 100;
  const showName = iconStyle.showName ?? true;
  const nameSize = iconStyle.nameSize ?? 12;
  const nameColor = iconStyle.nameColor ?? '#ffffff';

  const iconStyle_css = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    borderRadius: `${borderRadius}px`,
    opacity: opacity,
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
        <img 
          src={item.iconImage}
          alt={item.name}
          className="object-cover"
          style={iconStyle_css}
        />
      );
    }

    if (item.iconType === 'logo' && item.iconLogo) {
      return (
        <img 
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

  // 和官方示例完全一致的结构
  return (
    <div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0 : 1,
      }}
    >
      <motion.div
        layoutId={id}
        style={{
          cursor: 'grab',
        }}
        transition={{
          type: "spring",
          duration: isDragging 
            ? ANIMATION_DURATION_MS / 1000 
            : (ANIMATION_DURATION_MS / 1000) * 3
        }}
        {...attributes}
        {...listeners}
        onClick={handleClick}
      >
        {renderIcon()}
        {showName && (
          <div 
            className="text-center mt-2 truncate"
            style={{
              fontSize: `${nameSize}px`,
              color: nameColor,
              width: `${iconSize}px`,
            }}
          >
            {item.name}
          </div>
        )}
      </motion.div>
    </div>
  );
});

DraggableItem.displayName = 'DraggableItem';
