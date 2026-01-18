"use client";

import { useState, useEffect } from "react";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { setSetting } from "@/lib/settings-api";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export const OpenMethodSettings = ({ 
  hasSecretKey, 
  initialOpenInNewTab 
}: { 
  hasSecretKey?: boolean;
  initialOpenInNewTab?: { search?: boolean; icon?: boolean };
}) => {
  const [openSearchInNewTab, setOpenSearchInNewTab] = useState(initialOpenInNewTab?.search ?? true);
  const [openIconInNewTab, setOpenIconInNewTab] = useState(initialOpenInNewTab?.icon ?? true);
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

  const handleSaveOpenInNewTab = async (type: 'search' | 'icon', value: boolean) => {
    try {
      const settings = { search: openSearchInNewTab, icon: openIconInNewTab };
      settings[type] = value;
      
      await setSetting('open_in_new_tab', JSON.stringify(settings));
      
      if (type === 'search') {
        setOpenSearchInNewTab(value);
      } else {
        setOpenIconInNewTab(value);
      }
      
      // 触发自定义事件通知其他组件
      window.dispatchEvent(new CustomEvent('openInNewTabChanged', { 
        detail: settings 
      }));
    } catch (error) {
      console.error('Failed to save open in new tab setting:', error);
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
        <h3 className="text-lg font-semibold text-white mb-2">打开方式</h3>
        <p className="text-sm text-white/60">
          控制链接和搜索结果的打开方式
        </p>
      </div>

      <div className="space-y-4">
        {/* 搜索结果打开方式 */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <div className="flex-1">
            <Label htmlFor="search-new-tab" className="text-white font-medium cursor-pointer">
              新标签页中打开搜索结果
            </Label>
            <p className="text-xs text-white/60 mt-1">
              搜索引擎的搜索结果将在新标签页中打开
            </p>
          </div>
          <button
            id="search-new-tab"
            type="button"
            role="switch"
            aria-checked={openSearchInNewTab}
            onClick={() => handleSaveOpenInNewTab('search', !openSearchInNewTab)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 flex-shrink-0",
              openSearchInNewTab ? "bg-blue-500" : "bg-white/20"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                openSearchInNewTab ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {/* 图标打开方式 */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <div className="flex-1">
            <Label htmlFor="icon-new-tab" className="text-white font-medium cursor-pointer">
              新标签页中打开图标
            </Label>
            <p className="text-xs text-white/60 mt-1">
              拖拽网格中的图标将在新标签页中打开
            </p>
          </div>
          <button
            id="icon-new-tab"
            type="button"
            role="switch"
            aria-checked={openIconInNewTab}
            onClick={() => handleSaveOpenInNewTab('icon', !openIconInNewTab)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 flex-shrink-0",
              openIconInNewTab ? "bg-blue-500" : "bg-white/20"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                openIconInNewTab ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-sm text-white/80">
          💡 <span className="font-medium">提示：</span>设置会立即生效，无需刷新页面
        </p>
      </div>
    </div>
  );
};
