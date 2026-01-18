// 右键菜单 Hook
import { useState, useEffect } from 'react';

export function useContextMenu() {
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleClick = () => setContextMenuPosition(null);
    if (contextMenuPosition) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenuPosition]);

  return {
    contextMenuPosition,
    handleContextMenu,
    closeContextMenu: () => setContextMenuPosition(null),
  };
}
