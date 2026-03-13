"use client";

import { useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { GlobeIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import type { DockItem } from "@/lib/grid-model";
import { isFolder } from "@/lib/grid-model";
import type { IconStyleSettings } from "@/components/icon-settings";
import type Sortable from "sortablejs";

interface DockBarProps {
  items: DockItem[];
  onItemsChange: (items: DockItem[]) => void;
  openInNewTab?: boolean;
  iconStyle: IconStyleSettings;
}

const DOCK_ICON_SIZE = 48;

const DockIcon = ({
  item,
  iconStyle,
  openInNewTab,
}: {
  item: DockItem;
  iconStyle: IconStyleSettings;
  openInNewTab?: boolean;
}) => {
  const [imageError, setImageError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

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
      className="flex flex-col items-center gap-1 cursor-pointer group/dock-icon"
      onClick={handleClick}
    >
      <div
        className={cn(
          "relative flex items-center justify-center bg-primary/20 backdrop-blur-xs border-2 border-white/30",
          "transition-all duration-200 group-hover/dock-icon:scale-110 group-hover/dock-icon:-translate-y-1 group-hover/dock-icon:border-white/50"
        )}
        style={{
          width: `${DOCK_ICON_SIZE}px`,
          height: `${DOCK_ICON_SIZE}px`,
          borderRadius: `${iconStyle.borderRadius}px`,
          opacity: iconStyle.opacity / 100,
        }}
      >
        {item.iconType === "text" ? (
          <span
            className="text-lg font-bold"
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

      {iconStyle.dockShowName && (
        <span
          className="text-center truncate text-white/90"
          style={{
            fontSize: `${Math.min(iconStyle.nameSize, 11)}px`,
            maxWidth: `${DOCK_ICON_SIZE + 8}px`,
            color: iconStyle.nameColor,
          }}
        >
          {item.name}
        </span>
      )}
    </div>
  );
};

export const DockBar = ({ items, onItemsChange, openInNewTab, iconStyle }: DockBarProps) => {
  const handleMove = (evt: Sortable.MoveEvent) => {
    const draggedEl = evt.dragged;
    const draggedId = draggedEl?.dataset?.id || "";
    // 拒绝文件夹拖入 Dock
    if (draggedId.startsWith("folder-")) {
      return false;
    }
    return true;
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
      <div
        className={cn(
          "backdrop-blur-xl bg-primary/20 border-2 border-border/50 rounded-2xl shadow-button",
          "px-3 py-2 min-h-[64px] relative",
          items.length === 0 && "min-w-[200px]"
        )}
      >
        <ReactSortable
          list={items.map((item) => ({ ...item, chosen: false, selected: false }))}
          setList={(newState) => {
            // 过滤掉可能被拖入的文件夹
            const filtered = newState.filter((item) => !isFolder(item)) as DockItem[];
            onItemsChange(filtered);
          }}
          group="icon-grid"
          direction="horizontal"
          animation={200}
          delay={0}
          delayOnTouchOnly={true}
          ghostClass="blue-background-class"
          dragClass="dragging-element"
          onMove={handleMove}
          emptyInsertThreshold={20}
          className={cn(
            "flex items-end gap-1",
            items.length === 0 && "min-h-[48px] min-w-[180px]"
          )}
        >
          {items.map((item) => (
            <div key={item.id} data-id={item.id}>
              <DockIcon
                item={item}
                iconStyle={iconStyle}
                openInNewTab={openInNewTab}
              />
            </div>
          ))}
        </ReactSortable>
        {items.length === 0 && (
          <span className="text-white/40 text-xs select-none pointer-events-none absolute inset-0 flex items-center justify-center">
            拖拽图标到此处
          </span>
        )}
      </div>
    </div>
  );
};
