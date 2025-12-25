"use client";

import { useState, useEffect } from "react";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { setSetting } from "@/lib/settings-api";
import { LockClosedIcon, ComponentInstanceIcon, MagicWandIcon } from "@radix-ui/react-icons";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export type LayoutMode = 'component' | 'minimal';

export const LayoutSettings = ({ 
  hasSecretKey, 
  initialLayoutMode 
}: { 
  hasSecretKey?: boolean;
  initialLayoutMode?: LayoutMode;
}) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialLayoutMode || 'component');
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

  const handleLayoutModeChange = async (mode: LayoutMode) => {
    try {
      await setSetting('layout_mode', mode);
      setLayoutMode(mode);
      
      // 触发自定义事件通知其他组件
      window.dispatchEvent(new CustomEvent('layoutModeChanged', { 
        detail: { mode } 
      }));
    } catch (error) {
      console.error('Failed to save layout mode:', error);
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
        <h3 className="text-lg font-semibold text-white mb-2">布局模式</h3>
        <p className="text-sm text-white/60">
          选择适合你的页面布局风格
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 组件模式 */}
        <button
          onClick={() => handleLayoutModeChange('component')}
          className={cn(
            "relative p-6 rounded-xl border-2 transition-all text-left",
            layoutMode === 'component'
              ? "border-blue-500 bg-blue-500/10"
              : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
              layoutMode === 'component' ? "bg-blue-500/20" : "bg-white/10"
            )}>
              <ComponentInstanceIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">组件模式</h4>
              <p className="text-sm text-white/60">
                显示所有功能组件，包括侧边栏、图标网格等
              </p>
            </div>
          </div>
          
          {layoutMode === 'component' && (
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}

          {/* 预览图 */}
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex gap-2">
              <div className="w-8 h-16 bg-white/20 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/20 rounded w-1/2"></div>
                <div className="h-3 bg-white/10 rounded w-3/4"></div>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  <div className="h-6 bg-white/20 rounded"></div>
                  <div className="h-6 bg-white/20 rounded"></div>
                  <div className="h-6 bg-white/20 rounded"></div>
                  <div className="h-6 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* 极简模式 */}
        <button
          onClick={() => handleLayoutModeChange('minimal')}
          className={cn(
            "relative p-6 rounded-xl border-2 transition-all text-left",
            layoutMode === 'minimal'
              ? "border-blue-500 bg-blue-500/10"
              : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
              layoutMode === 'minimal' ? "bg-blue-500/20" : "bg-white/10"
            )}>
              <MagicWandIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-1">极简模式</h4>
              <p className="text-sm text-white/60">
                隐藏侧边栏和图标，只显示时间和搜索框
              </p>
            </div>
          </div>
          
          {layoutMode === 'minimal' && (
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}

          {/* 预览图 */}
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className="h-4 bg-white/20 rounded w-1/3"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
        </button>
      </div>

      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-sm text-white/80">
          💡 <span className="font-medium">提示：</span>切换布局模式后会立即生效，无需刷新页面
        </p>
      </div>

      {/* 功能说明 */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white">各模式功能对比</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div className="font-medium text-white/80">组件模式</div>
            <ul className="space-y-1 text-white/60">
              <li>✓ 侧边栏</li>
              <li>✓ 图标网格</li>
              <li>✓ 时间显示</li>
              <li>✓ 搜索框</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-medium text-white/80">极简模式</div>
            <ul className="space-y-1 text-white/60">
              <li>✗ 侧边栏</li>
              <li>✗ 图标网格</li>
              <li>✓ 时间显示（居中）</li>
              <li>✓ 搜索框（居中）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
