"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { PersonIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { setSetting } from "@/lib/settings-api";

// 头像组件 - 支持失败后使用代理
const Avatar = ({ src, alt }: { src: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  const handleError = () => {
    if (!useProxy && src) {
      setUseProxy(true);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  if (!src || hasError) {
    return (
      <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
        <PersonIcon className="w-12 h-12 text-white/60" />
      </div>
    );
  }

  const imageUrl = useProxy ? `/api/icon?url=${encodeURIComponent(src)}` : src;

  return (
    <img 
      src={imageUrl}
      alt={alt}
      className="w-24 h-24 rounded-full object-cover"
      onError={handleError}
    />
  );
};

export const AccountSettings = ({ initialAvatarUrl, hasSecretKey }: { 
  initialAvatarUrl?: string | null;
  hasSecretKey?: boolean;
}) => {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || '');
  const [tempAvatarUrl, setTempAvatarUrl] = useState(initialAvatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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

  const handleSaveAvatar = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const result = await setSetting('avatar_url', tempAvatarUrl);

      if (result.success) {
        setAvatarUrl(tempAvatarUrl);
        setMessage('头像已保存，刷新页面后生效');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('保存失败');
      }
    } catch (error) {
      console.error('Failed to save avatar:', error);
      const errorMessage = error instanceof Error ? error.message : '保存失败';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
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
      {/* 头像设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">头像</h3>
        <div className="flex items-center gap-6">
          <Avatar src={avatarUrl} alt="用户头像" />
          <div className="flex-1 space-y-3">
            <div>
              <Label htmlFor="avatar" className="text-white">头像链接</Label>
              <Input
                id="avatar"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={tempAvatarUrl}
                onChange={(e) => setTempAvatarUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleSaveAvatar} disabled={isLoading}>
              保存头像
            </Button>
          </div>
        </div>
      </div>

      {message && (
        <div className={cn(
          "text-sm p-3 rounded-lg",
          message.includes('成功') || message.includes('已') ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"
        )}>
          {message}
        </div>
      )}
    </div>
  );
};
