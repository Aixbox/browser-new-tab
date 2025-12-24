"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { PersonIcon } from "@radix-ui/react-icons";
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

export const AccountSettings = ({ initialAvatarUrl }: { 
  initialAvatarUrl?: string | null;
}) => {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || '');
  const [tempAvatarUrl, setTempAvatarUrl] = useState(initialAvatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      setMessage('保存失败');
    } finally {
      setIsLoading(false);
    }
  };

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
