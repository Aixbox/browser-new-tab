"use client";

import { useState, useEffect } from "react";
import { CustomSidebar, type SidebarItem } from "./custom-sidebar";
import { toast } from "sonner";
import { saveSidebarItems } from "@/lib/settings-api";

interface SidebarDemoProps {
  onAvatarClick?: () => void;
  avatarUrl?: string | null;
  initialSidebarItems?: SidebarItem[] | null;
  wheelScroll?: boolean;
  width?: number;
}

const defaultItems: SidebarItem[] = [
  { 
    id: "1", 
    title: "Home", 
    icon: "home",
  },
  { 
    id: "2", 
    title: "Profile", 
    icon: "profile",
  },
  { 
    id: "3", 
    title: "Settings", 
    icon: "settings",
  },
];

export const SidebarDemo = ({ onAvatarClick, avatarUrl, initialSidebarItems, wheelScroll = false, width = 64 }: SidebarDemoProps) => {
  const [items, setItems] = useState<SidebarItem[]>(initialSidebarItems || defaultItems);
  const [isSaving, setIsSaving] = useState(false);

  // 当从服务端获取到初始数据时更新
  useEffect(() => {
    if (initialSidebarItems) {
      setItems(initialSidebarItems);
    }
  }, [initialSidebarItems]);

  const handleItemsChange = async (newItems: SidebarItem[]) => {
    const oldLength = items.length;
    setItems(newItems);
    
    // 保存到 KV
    setIsSaving(true);
    try {
      // 移除 onClick 函数，只保存可序列化的数据
      const itemsToSave = newItems.map(({ id, title, icon }) => ({ id, title, icon }));
      await saveSidebarItems(itemsToSave);
      
      if (newItems.length < oldLength) {
        toast.success("按钮已删除并同步");
      } else if (newItems.length > oldLength) {
        toast.success("按钮已添加并同步");
      } else {
        toast.success("侧边栏已更新并同步");
      }
    } catch (error) {
      console.error('Failed to save sidebar items:', error);
      toast.error(error instanceof Error ? error.message : '保存失败');
      // 恢复旧状态
      setItems(items);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CustomSidebar 
      items={items} 
      onItemsChange={handleItemsChange}
      onAvatarClick={onAvatarClick}
      avatarUrl={avatarUrl}
      wheelScroll={wheelScroll}
      width={width}
    />
  );
};