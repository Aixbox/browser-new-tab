"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { setSetting } from "@/lib/settings-api";
import { LockClosedIcon, PlusIcon } from "@radix-ui/react-icons";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { HexColorPicker } from "react-colorful";
import * as Portal from "@radix-ui/react-portal";

export interface IconStyleSettings {
  size: number;
  borderRadius: number;
  opacity: number;
  spacing: number;
  showName: boolean;
  nameSize: number;
  nameColor: string;
  maxWidth: number;
}

export const IconSettings = ({ 
  hasSecretKey, 
  initialIconStyle 
}: { 
  hasSecretKey?: boolean;
  initialIconStyle?: IconStyleSettings;
}) => {
  const defaultSettings: IconStyleSettings = {
    size: 80,
    borderRadius: 12,
    opacity: 100,
    spacing: 16,
    showName: true,
    nameSize: 12,
    nameColor: '#ffffff',
    maxWidth: 1500,
  };

  const [iconStyle, setIconStyle] = useState<IconStyleSettings>(initialIconStyle || defaultSettings);
  const [isVerified, setIsVerified] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [tempColor, setTempColor] = useState('#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

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

  // 预设颜色
  const presetColors = [
    '#ffffff', // 白色
    '#000000', // 黑色
    '#3b82f6', // 蓝色
    '#ef4444', // 红色
    '#10b981', // 绿色
    '#f59e0b', // 橙色
    '#8b5cf6', // 紫色
    '#ec4899', // 粉色
  ];

  const handleColorChange = useCallback((color: string) => {
    setTempColor(color);
    const newStyle = { ...iconStyle, nameColor: color };
    setIconStyle(newStyle);
    
    // 立即触发事件更新页面
    window.dispatchEvent(new CustomEvent('iconStyleChanged', { 
      detail: newStyle 
    }));

    // 保存到 KV
    setSetting('icon_style', JSON.stringify(newStyle)).catch(error => {
      console.error('Failed to save icon style:', error);
    });
  }, [iconStyle]);

  const handlePresetColorClick = useCallback((color: string) => {
    handleColorChange(color);
    setShowColorPicker(false);
  }, [handleColorChange]);

  const handleCustomColorClick = useCallback(() => {
    if (colorButtonRef.current) {
      const rect = colorButtonRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setShowColorPicker(prev => !prev);
  }, []);

  // 点击外部关闭颜色选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node) &&
          colorButtonRef.current && !colorButtonRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

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

  const handleStyleChange = async (key: keyof IconStyleSettings, value: number | boolean | string) => {
    const newStyle = { ...iconStyle, [key]: value };
    setIconStyle(newStyle);
    
    // 立即触发事件更新页面
    window.dispatchEvent(new CustomEvent('iconStyleChanged', { 
      detail: newStyle 
    }));

    // 保存到 KV（防抖）
    try {
      await setSetting('icon_style', JSON.stringify(newStyle));
    } catch (error) {
      console.error('Failed to save icon style:', error);
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
        <h3 className="text-lg font-semibold text-white mb-2">图标样式</h3>
      </div>

      {/* 图标大小 */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label htmlFor="icon-size" className="text-white font-medium w-20 flex-shrink-0">
            图标大小
          </Label>
          <input
            id="icon-size"
            type="range"
            min="50"
            max="100"
            value={iconStyle.size}
            onChange={(e) => handleStyleChange('size', Number(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${((iconStyle.size - 50) / 50) * 100}%, rgba(255,255,255,0.2) ${((iconStyle.size - 50) / 50) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          <span className="text-sm text-white/60 w-16 text-right">{iconStyle.size}px</span>
        </div>
      </div>

      {/* 图标圆角 */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label htmlFor="icon-radius" className="text-white font-medium w-20 flex-shrink-0">
            图标圆角
          </Label>
          <input
            id="icon-radius"
            type="range"
            min="0"
            max={Math.floor(iconStyle.size / 2)}
            value={iconStyle.borderRadius}
            onChange={(e) => handleStyleChange('borderRadius', Number(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${(iconStyle.borderRadius / (iconStyle.size / 2)) * 100}%, rgba(255,255,255,0.2) ${(iconStyle.borderRadius / (iconStyle.size / 2)) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          <span className="text-sm text-white/60 w-16 text-right">{iconStyle.borderRadius}px</span>
        </div>
      </div>

      {/* 不透明度 */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label htmlFor="icon-opacity" className="text-white font-medium w-20 flex-shrink-0">
            不透明度
          </Label>
          <input
            id="icon-opacity"
            type="range"
            min="1"
            max="100"
            value={iconStyle.opacity}
            onChange={(e) => handleStyleChange('opacity', Number(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${iconStyle.opacity}%, rgba(255,255,255,0.2) ${iconStyle.opacity}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          <span className="text-sm text-white/60 w-16 text-right">{iconStyle.opacity}%</span>
        </div>
      </div>

      {/* 图标间距 */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label htmlFor="icon-spacing" className="text-white font-medium w-20 flex-shrink-0">
            图标间距
          </Label>
          <input
            id="icon-spacing"
            type="range"
            min="0"
            max="100"
            value={iconStyle.spacing}
            onChange={(e) => handleStyleChange('spacing', Number(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${iconStyle.spacing}%, rgba(255,255,255,0.2) ${iconStyle.spacing}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          <span className="text-sm text-white/60 w-16 text-right">{iconStyle.spacing}px</span>
        </div>
      </div>

      {/* 宫格最大宽度 */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label htmlFor="max-width" className="text-white font-medium w-20 flex-shrink-0">
            宫格宽度
          </Label>
          <input
            id="max-width"
            type="range"
            min="1000"
            max="2000"
            value={iconStyle.maxWidth}
            onChange={(e) => handleStyleChange('maxWidth', Number(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${((iconStyle.maxWidth - 1000) / 1000) * 100}%, rgba(255,255,255,0.2) ${((iconStyle.maxWidth - 1000) / 1000) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          <span className="text-sm text-white/60 w-16 text-right">{iconStyle.maxWidth}px</span>
        </div>
      </div>

      {/* 图标名称开关 */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label htmlFor="show-name" className="text-white font-medium w-20 flex-shrink-0">
            显示名称
          </Label>
          <Switch
            id="show-name"
            checked={iconStyle.showName}
            onCheckedChange={(checked) => handleStyleChange('showName', checked)}
          />
        </div>
      </div>

      {/* 名称文字大小 */}
      {iconStyle.showName && (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Label htmlFor="name-size" className="text-white font-medium w-20 flex-shrink-0">
              名称大小
            </Label>
            <input
              id="name-size"
              type="range"
              min="10"
              max="20"
              value={iconStyle.nameSize}
              onChange={(e) => handleStyleChange('nameSize', Number(e.target.value))}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${((iconStyle.nameSize - 10) / 10) * 100}%, rgba(255,255,255,0.2) ${((iconStyle.nameSize - 10) / 10) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <span className="text-sm text-white/60 w-16 text-right">{iconStyle.nameSize}px</span>
          </div>
        </div>
      )}

      {/* 名称颜色 */}
      {iconStyle.showName && (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Label className="text-white font-medium w-20 flex-shrink-0">名称颜色</Label>
            <div className="flex gap-2 flex-1 items-center flex-wrap">
              {/* 预设颜色圆点 */}
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handlePresetColorClick(color)}
                  className={cn(
                    "w-6 h-6 rounded-full cursor-pointer transition-transform flex-shrink-0 border border-white/20",
                    iconStyle.nameColor === color 
                      ? "ring-2 ring-white/80 ring-offset-2 ring-offset-transparent scale-110" 
                      : "hover:scale-110"
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              {/* 自定义颜色圆点 */}
              <div className="relative">
                <button
                  ref={colorButtonRef}
                  type="button"
                  onClick={handleCustomColorClick}
                  className={cn(
                    "w-6 h-6 rounded-full transition-transform flex items-center justify-center cursor-pointer border border-white/20",
                    !presetColors.includes(iconStyle.nameColor) 
                      ? "ring-2 ring-white/80 ring-offset-2 ring-offset-transparent scale-110" 
                      : "border-2 border-dashed border-white/50 hover:scale-110"
                  )}
                  style={{ 
                    backgroundColor: !presetColors.includes(iconStyle.nameColor) ? iconStyle.nameColor : 'transparent'
                  }}
                  title="自定义颜色"
                >
                  {presetColors.includes(iconStyle.nameColor) && (
                    <PlusIcon className="w-3 h-3 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 颜色选择器弹出层 */}
      {showColorPicker && (
        <Portal.Root>
          <div
            ref={colorPickerRef}
            className="fixed z-[100] p-3 bg-primary/20 backdrop-blur-md border-2 border-white/30 rounded-lg shadow-xl"
            style={{
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`,
            }}
          >
            <HexColorPicker color={tempColor} onChange={handleColorChange} />
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="text"
                value={tempColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-8 text-sm font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
        </Portal.Root>
      )}
    </div>
  );
};
