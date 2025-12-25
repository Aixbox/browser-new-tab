"use client";

import { useState, useEffect } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { setSetting } from "@/lib/settings-api";
import { LockClosedIcon } from "@radix-ui/react-icons";

export const ThemeSettings = ({ 
  hasSecretKey, 
  initialBackgroundUrl 
}: { 
  hasSecretKey?: boolean;
  initialBackgroundUrl?: string | null;
}) => {
  const [backgroundUrl, setBackgroundUrl] = useState(initialBackgroundUrl || '');
  const [isVerified, setIsVerified] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      await setSetting('background_url', backgroundUrl);
      
      // 触发事件通知页面更新背景
      window.dispatchEvent(new CustomEvent('backgroundChanged', { 
        detail: { url: backgroundUrl } 
      }));
      
      setMessage('保存成功');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Failed to save background:', error);
      setMessage('保存失败');
    } finally {
      setIsSaving(false);
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
        <h3 className="text-lg font-semibold text-white mb-2">主题设置</h3>
        <p className="text-sm text-white/60">
          自定义页面背景，支持图片和视频
        </p>
      </div>

      {/* 背景链接 */}
      <div className="space-y-2">
        <Label htmlFor="background-url" className="text-white font-medium">
          背景链接
        </Label>
        <Input
          id="background-url"
          type="url"
          placeholder="https://example.com/background.mp4 或 .jpg/.png"
          value={backgroundUrl}
          onChange={(e) => setBackgroundUrl(e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-white/50">
          支持 MP4 视频或图片格式（JPG、PNG、GIF 等）
        </p>
      </div>

      {/* 保存按钮 */}
      <div className="flex gap-3">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={cn(
          "text-sm p-3 rounded-lg",
          message.includes('成功') ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"
        )}>
          {message}
        </div>
      )}

      {/* 说明 */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-sm text-white/80">
          💡 <span className="font-medium">提示：</span>
        </p>
        <ul className="text-sm text-white/70 mt-2 space-y-1 list-disc list-inside">
          <li>视频格式：推荐使用 MP4 格式</li>
          <li>图片格式：支持 JPG、PNG、GIF 等常见格式</li>
          <li>留空则使用默认背景</li>
        </ul>
      </div>
    </div>
  );
};
