"use client";

import { useState, useEffect } from "react";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { setSetting } from "@/lib/settings-api";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";

export interface SidebarSettings {
  position: 'left' | 'right';
  autoHide: boolean;
  wheelScroll: boolean;
  width: number;
}

export const SidebarSettingsComponent = ({ 
  hasSecretKey, 
  initialSidebarSettings 
}: { 
  hasSecretKey?: boolean;
  initialSidebarSettings?: SidebarSettings;
}) => {
  const defaultSettings: SidebarSettings = {
    position: 'left',
    autoHide: false,
    wheelScroll: false,
    width: 64,
  };

  const [sidebarSettings, setSidebarSettings] = useState<SidebarSettings>(initialSidebarSettings || defaultSettings);
  const [isVerified, setIsVerified] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');

  // 检查是否已验证
  useEffect(() => {
    if (!hasSecretKey) {
      setIsVerified(true);
      return;
    }

    const checkSecret = async () => {
      const storedSecret = localStorage.getItem('secret_key');
      if (storedSecret) {
        try {
          const response = await fetch('/api/verify-secret', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: storedSecret }),
          });

          if (response.ok) {
            const data = await response.json() as { verified?: boolean };
            if (data.verified) {
              setIsVerified(true);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to verify stored secret:', error);
        }
      }
    };

    checkSecret();
  }, [hasSecretKey]);

  const handleVerifySecret = async () => {
    setIsVerifying(true);
    setMessage('');
    try {
      const response = await fetch('/api/verify-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secretInput }),
      });

      if (response.ok) {
        const data = await response.json() as { verified?: boolean };
        if (data.verified) {
          localStorage.setItem('secret_key', secretInput);
          setIsVerified(true);
          setMessage('验证成功');
          setTimeout(() => setMessage(''), 2000);
        } else {
          setMessage('密钥错误');
        }
      } else {
        setMessage('验证失败');
      }
    } catch (error) {
      console.error('Failed to verify secret:', error);
      setMessage('验证失败');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSettingChange = async (key: keyof SidebarSettings, value: string | boolean | number) => {
    const newSettings = { ...sidebarSettings, [key]: value };
    setSidebarSettings(newSettings);
    
    // 立即触发事件更新页面
    window.dispatchEvent(new CustomEvent('sidebarSettingsChanged', { 
      detail: newSettings 
    }));

    // 保存到 KV
    try {
      await setSetting('sidebar_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save sidebar settings:', error);
    }
  };

  // 如果需要密钥但未验证，显示密钥输入界面
  if (hasSecretKey && !isVerified) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-white/80">
          <LockClosedIcon className="w-5 h-5" />
          <h3 className="text-lg font-semibold">需要验证</h3>
        </div>
        <p className="text-white/60 text-sm">
          此功能需要密钥验证才能使用。请输入密钥以继续。
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="secret" className="text-white">密钥</Label>
            <Input
              id="secret"
              type="password"
              placeholder="请输入密钥"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifySecret()}
              className="mt-1"
            />
          </div>
          <Button onClick={handleVerifySecret} disabled={isVerifying || !secretInput}>
            {isVerifying ? '验证中...' : '验证'}
          </Button>
        </div>
        {message && (
          <div className={cn(
            "text-sm p-3 rounded-lg",
            message.includes('成功') ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"
          )}>
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">侧边栏设置</h3>
      </div>

      {/* 侧边栏位置 */}
      <div className="space-y-2">
        <Label className="text-white font-medium">侧边栏位置</Label>
        <div className="flex gap-3">
          <button
            onClick={() => handleSettingChange('position', 'left')}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg border-2 transition-all",
              sidebarSettings.position === 'left'
                ? "bg-blue-500/20 border-blue-500 text-white"
                : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
            )}
          >
            左侧
          </button>
          <button
            onClick={() => handleSettingChange('position', 'right')}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg border-2 transition-all",
              sidebarSettings.position === 'right'
                ? "bg-blue-500/20 border-blue-500 text-white"
                : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
            )}
          >
            右侧
          </button>
        </div>
      </div>

      {/* 自动隐藏 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-hide" className="text-white font-medium">
              自动隐藏
            </Label>
            <p className="text-xs text-white/50 mt-1">
              鼠标移到边缘时才显示侧边栏
            </p>
          </div>
          <Switch
            id="auto-hide"
            checked={sidebarSettings.autoHide}
            onCheckedChange={(checked) => handleSettingChange('autoHide', checked)}
          />
        </div>
      </div>

      {/* 滚轮切换分组 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="wheel-scroll" className="text-white font-medium">
              滚轮切换分组
            </Label>
            <p className="text-xs text-white/50 mt-1">
              使用鼠标滚轮切换侧边栏分组
            </p>
          </div>
          <Switch
            id="wheel-scroll"
            checked={sidebarSettings.wheelScroll}
            onCheckedChange={(checked) => handleSettingChange('wheelScroll', checked)}
          />
        </div>
      </div>

      {/* 侧边栏宽度 */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label htmlFor="sidebar-width" className="text-white font-medium w-24 flex-shrink-0">
            侧边栏宽度
          </Label>
          <input
            id="sidebar-width"
            type="range"
            min="40"
            max="100"
            value={sidebarSettings.width}
            onChange={(e) => handleSettingChange('width', Number(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${((sidebarSettings.width - 40) / 60) * 100}%, rgba(255,255,255,0.2) ${((sidebarSettings.width - 40) / 60) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          <span className="text-sm text-white/60 w-16 text-right">{sidebarSettings.width}px</span>
        </div>
      </div>
    </div>
  );
};
