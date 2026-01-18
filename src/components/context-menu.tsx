// 右键菜单组件
import { GearIcon } from "@radix-ui/react-icons";

interface ContextMenuProps {
  position: { x: number; y: number };
  onSettingsClick: () => void;
}

export function ContextMenu({ position, onSettingsClick }: ContextMenuProps) {
  return (
    <div
      className="fixed bg-primary/20 backdrop-blur-md border-2 border-white/30 rounded-lg shadow-xl z-[100] py-1 min-w-[160px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onSettingsClick}
        className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
      >
        <GearIcon className="w-4 h-4" />
        <span>设置</span>
      </button>
    </div>
  );
}
