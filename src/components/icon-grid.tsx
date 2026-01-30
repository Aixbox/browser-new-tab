"use client";

import { useEffect, useRef, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { GlobeIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import type { GridItem } from "@/lib/grid-model";
import type { IconStyleSettings } from "@/components/icon-settings";
import { isFolder } from "@/lib/grid-model";

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
}: {
  item: GridItem;
  iconStyle: IconStyleSettings;
  openInNewTab?: boolean;
}) => {
  const [imageError, setImageError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  if (isFolder(item)) {
    return null; // 暂时不支持文件夹
  }

  const handleClick = () => {
    if (openInNewTab) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = item.url;
    }
  };

  const handleImageError = () => {
    if (!useProxy && item.iconLogo) {
      setUseProxy(true);
      setImageError(false);
    } else {
      setImageError(true);
    }
  };

  const getIconSrc = () => {
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
        {item.iconType === "text" ? (
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

  return (
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
            />
          </div>
        ))}
      </ReactSortable>
    </div>
  );
};
