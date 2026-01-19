// DragOverlay 中显示的图标组件
import type { IconStyleSettings } from "@/components/icon-settings";
import type { GridItem } from "@/lib/grid-model";
import { isFolder, isIcon } from "@/lib/grid-model";

interface DragOverlayItemProps {
  id: string;
  gridItems: GridItem[];  // 简化：移除多页面结构
  iconStyle: IconStyleSettings;
}


export function DragOverlayItem({ 
  id, 
  gridItems,
  iconStyle
}: DragOverlayItemProps) {

  // 先在顶层查找
  let item = gridItems.find((candidate) => candidate.id === id) || null;

  // 如果没找到，在文件夹内部查找
  if (!item) {
    for (const gridItem of gridItems) {
      if (isFolder(gridItem)) {
        const foundInFolder = gridItem.items.find((folderItem) => folderItem.id === id);
        if (foundInFolder) {
          item = foundInFolder;
          break;
        }
      }
    }
  }

  if (!item || !isIcon(item)) return null;


  const iconSize = iconStyle?.size || 80;
  const borderRadius = iconStyle?.borderRadius || 12;
  const opacity = (iconStyle?.opacity || 100) / 100;

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
        <svg width="24" height="24" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
        </svg>
      </div>
    );
  };

  return (
    <div className="cursor-grabbing" style={{ transform: "scale(1.03)", filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.35))" }}>
      {renderIcon()}
    </div>
  );

}
