"use client";

import { useState } from "react";
import { CustomSidebar, type SidebarItem } from "./custom-sidebar";
import { toast } from "sonner";

interface SidebarDemoProps {
  onAvatarClick?: () => void;
}

export const SidebarDemo = ({ onAvatarClick }: SidebarDemoProps) => {
  const [items, setItems] = useState<SidebarItem[]>([
    { 
      id: "1", 
      title: "Home", 
      icon: "home",
      onClick: () => toast.success("点击了 Home 按钮")
    },
    { 
      id: "2", 
      title: "Profile", 
      icon: "profile",
      onClick: () => toast.success("点击了 Profile 按钮")
    },
    { 
      id: "3", 
      title: "Settings", 
      icon: "settings",
      onClick: () => toast.success("点击了 Settings 按钮")
    },
  ]);

  const handleItemsChange = (newItems: SidebarItem[]) => {
    setItems(newItems);
    if (newItems.length < items.length) {
      toast.success("按钮已删除");
    } else {
      toast.success("侧边栏已更新");
    }
  };

  return (
    <CustomSidebar 
      items={items} 
      onItemsChange={handleItemsChange}
      onAvatarClick={onAvatarClick}
    />
  );
};