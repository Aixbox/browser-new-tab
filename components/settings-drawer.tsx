"use client";

import { useState, useEffect } from "react";
import { 
  GearIcon, 
  Cross2Icon, 
  PersonIcon, 
  ExternalLinkIcon, 
  ImageIcon, 
  ClockIcon, 
  MoonIcon, 
  LayoutIcon, 
  HamburgerMenuIcon, 
  DownloadIcon, 
  InfoCircledIcon 
} from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// 导航项配置
const navigationItems = [
  { id: 'account', label: '账号', icon: PersonIcon },
  { id: 'openMethod', label: '打开方式', icon: ExternalLinkIcon },
  { id: 'icons', label: '图标', icon: ImageIcon },
  { id: 'datetime', label: '时间/日期', icon: ClockIcon },
  { id: 'theme', label: '主题', icon: MoonIcon },
  { id: 'layout', label: '布局', icon: LayoutIcon },
  { id: 'sidebar', label: '侧边栏', icon: HamburgerMenuIcon },
  { id: 'backup', label: '备份与恢复', icon: DownloadIcon },
  { id: 'about', label: '关于', icon: InfoCircledIcon },
];

export const SettingsDialog = ({ children, isOpen, onOpenChange }: SettingsDialogProps) => {
  const [activeTab, setActiveTab] = useState('account');
  const isDialogOpen = isOpen ?? false;
  const setIsDialogOpen = onOpenChange ?? (() => {});

  // 阻止对话框内的点击事件冒泡
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* 对话框遮罩 */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsDialogOpen?.(false)}
          />
        )}
      </AnimatePresence>

      {/* 中间对话框 */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] max-w-[90vw] h-[600px] max-h-[80vh] bg-primary/20 backdrop-blur-md border-2 border-white/30 rounded-xl z-50 shadow-2xl"
            onClick={handleDialogClick}
          >
            {/* 对话框头部 */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h2 className="text-xl font-semibold text-white">设置</h2>
              <button
                onClick={() => setIsDialogOpen?.(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white/80 hover:text-white"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            {/* 对话框内容 - 左右布局 */}
            <div className="flex h-full">
              {/* 左侧导航栏 */}
              <div className="w-48 border-r border-white/20 p-4">
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                          activeTab === item.id
                            ? "bg-white/20 text-white"
                            : "text-white/70 hover:text-white hover:bg-white/10"
                        )}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* 右侧内容区域 */}
              <div className="flex-1 p-6 overflow-y-auto">
                {children || (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-white/60">
                      <div className="text-lg font-medium mb-2">
                        {navigationItems.find(item => item.id === activeTab)?.label}
                      </div>
                      <p className="text-sm">内容开发中...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};