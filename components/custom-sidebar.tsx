"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { 
  PlusIcon, 
  TrashIcon,
  Pencil1Icon,
  HomeIcon, 
  GearIcon, 
  PersonIcon,
  MagnifyingGlassIcon,
  EnvelopeClosedIcon,
  CalendarIcon,
  FileTextIcon,
  HeartIcon
} from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogOverlay, DialogPortal } from "./ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu";

// 可用的图标选项
const availableIcons = {
  home: HomeIcon,
  settings: GearIcon,
  profile: PersonIcon,
  search: MagnifyingGlassIcon,
  email: EnvelopeClosedIcon,
  calendar: CalendarIcon,
  document: FileTextIcon,
  heart: HeartIcon,
};

export interface SidebarItem {
  id: string;
  title: string;
  icon: keyof typeof availableIcons;
  onClick?: () => void;
}

interface CustomSidebarProps {
  items?: SidebarItem[];
  onItemsChange?: (items: SidebarItem[]) => void;
  onAvatarClick?: () => void;
  avatarUrl?: string | null;
  className?: string;
  wheelScroll?: boolean;
  width?: number;
}

const defaultItems: SidebarItem[] = [
  { id: "1", title: "Home", icon: "home" },
  { id: "2", title: "Profile", icon: "profile" },
  { id: "3", title: "Settings", icon: "settings" },
];

export const CustomSidebar = ({ 
  items = defaultItems, 
  onItemsChange,
  onAvatarClick,
  avatarUrl,
  className,
  wheelScroll = false,
  width = 64
}: CustomSidebarProps) => {
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>(items);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SidebarItem | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemIcon, setNewItemIcon] = useState<keyof typeof availableIcons>("home");
  const [avatarError, setAvatarError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 当 avatarUrl 改变时重置错误状态
  useEffect(() => {
    setAvatarError(false);
    setUseProxy(false);
  }, [avatarUrl]);

  // 滚轮切换分组
  useEffect(() => {
    if (!wheelScroll) return;

    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      
      if (delta > 0) {
        // 向下滚动，切换到下一个
        setCurrentIndex(prev => Math.min(prev + 1, sidebarItems.length - 1));
      } else {
        // 向上滚动，切换到上一个
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
    };

    // 监听整个页面的滚轮事件
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [wheelScroll, sidebarItems.length]);

  // 当滚轮切换时，自动选中当前项
  useEffect(() => {
    if (wheelScroll && sidebarItems[currentIndex]) {
      setSelectedItemId(sidebarItems[currentIndex].id);
    }
  }, [currentIndex, wheelScroll, sidebarItems]);

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;
    
    const newItem: SidebarItem = {
      id: Date.now().toString(),
      title: newItemTitle.trim(),
      icon: newItemIcon,
    };
    
    const updatedItems = [...sidebarItems, newItem];
    setSidebarItems(updatedItems);
    onItemsChange?.(updatedItems);
    
    // 重置表单
    setNewItemTitle("");
    setNewItemIcon("home");
    setIsAddDialogOpen(false);
  };

  const handleRemoveItem = (id: string) => {
    // 如果只有一个按钮，不允许删除
    if (sidebarItems.length <= 1) {
      return;
    }
    
    const updatedItems = sidebarItems.filter(item => item.id !== id);
    setSidebarItems(updatedItems);
    onItemsChange?.(updatedItems);
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const handleItemClick = (item: SidebarItem) => {
    // 选中项目
    setSelectedItemId(item.id);
    item.onClick?.();
  };

  const handleAvatarError = () => {
    if (!useProxy && avatarUrl) {
      // 第一次失败，尝试使用代理
      setUseProxy(true);
      setAvatarError(false);
    } else {
      // 代理也失败了，显示默认图标
      setAvatarError(true);
    }
  };

  const handleEditItem = (item: SidebarItem) => {
    setEditingItem(item);
    setNewItemTitle(item.title);
    setNewItemIcon(item.icon);
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !newItemTitle.trim()) return;
    
    const updatedItems = sidebarItems.map(item => 
      item.id === editingItem.id 
        ? { ...item, title: newItemTitle.trim(), icon: newItemIcon }
        : item
    );
    
    setSidebarItems(updatedItems);
    onItemsChange?.(updatedItems);
    
    // 重置表单
    setEditingItem(null);
    setNewItemTitle("");
    setNewItemIcon("home");
    setIsEditDialogOpen(false);
  };

  return (
    <motion.div
      id="custom-sidebar"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "fixed left-0 top-0 h-full bg-primary/20 backdrop-blur-xs border-r border-white/20 z-50",
        "flex flex-col items-center",
        className
      )}
      style={{ width: `${width}px` }}
    >
      {/* 头像图标 - 固定在顶部 */}
      <div className="w-full flex items-center justify-center py-4 border-b border-white/20">
        <button
          onClick={onAvatarClick}
          className={cn(
            "w-10 h-10 rounded-full bg-primary/20 backdrop-blur-xs",
            "flex items-center justify-center text-white group",
            "transition-all duration-200 overflow-hidden"
          )}
        >
          {avatarUrl && !avatarError ? (
            <img 
              key={useProxy ? 'proxy' : 'direct'}
              src={useProxy ? `/api/icon?url=${encodeURIComponent(avatarUrl)}` : avatarUrl}
              alt="Avatar" 
              className="w-full h-full object-cover"
              onError={handleAvatarError}
            />
          ) : (
            <PersonIcon className="w-5 h-5 transition-transform duration-200 ease-out group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* 侧边栏项目 */}
      <div className="flex flex-col flex-1 w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <AnimatePresence>
          {sidebarItems.map((item, index) => {
            const IconComponent = availableIcons[item.icon];
            const isSelected = selectedItemId === item.id;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <ContextMenu>
                  <ContextMenuTrigger>
                    <div
                      className={cn(
                        "w-full h-[52px] flex flex-col gap-0.5 py-1 cursor-pointer group",
                        "transition-colors duration-300 ease-out items-center justify-center",
                        isSelected && "bg-primary/30"
                      )}
                      onClick={() => handleItemClick(item)}
                    >
                      <IconComponent className="w-5 h-5 transition-transform duration-200 ease-out group-hover:scale-110" />
                      <span className="text-[11px] font-medium truncate max-w-full leading-tight">
                        {item.title}
                      </span>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleEditItem(item)}>
                      <Pencil1Icon className="w-4 h-4 mr-2" />
                      编辑
                    </ContextMenuItem>
                    <ContextMenuItem 
                      onClick={() => handleRemoveItem(item.id)}
                      className={cn(
                        "text-destructive focus:text-destructive",
                        sidebarItems.length <= 1 && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={sidebarItems.length <= 1}
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      删除
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 添加按钮 - 固定在底部 */}
      <div className="w-full">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <div
              className="w-full h-12 flex items-center justify-center cursor-pointer bg-primary/20 hover:bg-primary/30 transition-colors duration-300 ease-out"
            >
              <PlusIcon className="w-4 h-4" />
            </div>
          </DialogTrigger>
        
        <DialogPortal>
          <DialogOverlay className="bg-black/20" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-primary/20 backdrop-blur-xs p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
            )}
          >
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">添加新按钮</h2>
            </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="输入按钮标题"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddItem();
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="icon">图标</Label>
              <Select value={newItemIcon} onValueChange={(value: keyof typeof availableIcons) => setNewItemIcon(value)}>
                <SelectTrigger className="bg-primary/20 backdrop-blur-xs border-2 border-white/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-primary/20 backdrop-blur-xs border-2 border-white/50 text-white">
                  {Object.entries(availableIcons).map(([key, IconComponent]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <span className="capitalize">{key}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setIsAddDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={!newItemTitle.trim()}
              >
                添加
              </Button>
            </div>
          </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/20" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-primary/20 backdrop-blur-xs p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
            )}
          >
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">编辑按钮</h2>
            </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">标题</Label>
              <Input
                id="edit-title"
                placeholder="输入按钮标题"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateItem();
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-icon">图标</Label>
              <Select value={newItemIcon} onValueChange={(value: keyof typeof availableIcons) => setNewItemIcon(value)}>
                <SelectTrigger className="bg-primary/20 backdrop-blur-xs border-2 border-white/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-primary/20 backdrop-blur-xs border-2 border-white/50 text-white">
                  {Object.entries(availableIcons).map(([key, IconComponent]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <span className="capitalize">{key}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingItem(null);
                  setNewItemTitle("");
                  setNewItemIcon("home");
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleUpdateItem}
                disabled={!newItemTitle.trim()}
              >
                保存
              </Button>
            </div>
          </div>
          </DialogPrimitive.Content>
        </DialogPortal>
        </Dialog>
      </div>
    </motion.div>
  );
};