"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { PersonIcon, EyeOpenIcon, EyeNoneIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { getSetting, setSetting, verifySecret, setSecret } from "@/app/actions/settings";

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

export const AccountSettings = () => {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [currentSecret, setCurrentSecret] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 从 localStorage 加载密钥
  useEffect(() => {
    const savedSecret = localStorage.getItem('secret_key');
    if (savedSecret) {
      setSecretKey(savedSecret);
      verifySecretKey(savedSecret);
    } else {
      checkIfFirstTime();
    }
    loadAvatar();
  }, []);

  const checkIfFirstTime = async () => {
    try {
      const data = await getSetting('secret_key_hash');
      setIsFirstTime(!data.exists);
    } catch (error) {
      console.error('Failed to check secret key:', error);
    }
  };

  const verifySecretKey = async (secret: string) => {
    try {
      const data = await verifySecret(secret);
      setIsVerified(data.verified || false);
      setIsFirstTime(data.isFirstTime || false);
      return data.verified || false;
    } catch (error) {
      console.error('Failed to verify secret:', error);
      return false;
    }
  };

  const loadAvatar = async () => {
    try {
      const data = await getSetting('avatar_url');
      if (data.value) {
        setAvatarUrl(data.value);
        setTempAvatarUrl(data.value);
      }
    } catch (error) {
      console.error('Failed to load avatar:', error);
    }
  };

  const handleSaveAvatar = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const result = await setSetting('avatar_url', tempAvatarUrl);

      if (result.success) {
        setAvatarUrl(tempAvatarUrl);
        setMessage('头像已保存');
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

  const handleSetSecret = async () => {
    if (newSecret !== confirmSecret) {
      setMessage('两次输入的密钥不一致');
      return;
    }

    if (newSecret.length < 6) {
      setMessage('密钥长度至少为6个字符');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await setSecret(newSecret, isFirstTime ? '' : currentSecret);

      if (result.success) {
        // 保存到 localStorage
        localStorage.setItem('secret_key', newSecret);
        setSecretKey(newSecret);
        setIsVerified(true);
        setIsFirstTime(false);
        setCurrentSecret('');
        setNewSecret('');
        setConfirmSecret('');
        setMessage('密钥已设置');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(result.error || '设置失败');
      }
    } catch (error) {
      console.error('Failed to set secret:', error);
      setMessage('设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySecret = async () => {
    setIsLoading(true);
    setMessage('');

    const verified = await verifySecretKey(currentSecret);
    
    if (verified) {
      localStorage.setItem('secret_key', currentSecret);
      setSecretKey(currentSecret);
      setMessage('验证成功');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('密钥错误');
    }

    setIsLoading(false);
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

      {/* 密钥设置 */}
      <div className="space-y-4 pt-6 border-t border-white/20">
        <h3 className="text-lg font-semibold text-white">密钥管理</h3>
        
        {!isVerified ? (
          // 未验证状态
          <div className="space-y-3">
            <p className="text-sm text-white/70">
              {isFirstTime ? '首次使用，请设置密钥' : '请输入密钥以访问设置'}
            </p>
            <div>
              <Label htmlFor="current-secret" className="text-white">
                {isFirstTime ? '设置密钥' : '输入密钥'}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="current-secret"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="输入UUID密钥"
                  value={currentSecret}
                  onChange={(e) => setCurrentSecret(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showSecret ? <EyeNoneIcon className="w-4 h-4" /> : <EyeOpenIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {isFirstTime ? (
              <>
                <div>
                  <Label htmlFor="confirm-secret" className="text-white">确认密钥</Label>
                  <Input
                    id="confirm-secret"
                    type={showSecret ? 'text' : 'password'}
                    placeholder="再次输入密钥"
                    value={confirmSecret}
                    onChange={(e) => setConfirmSecret(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleSetSecret} disabled={isLoading}>
                  设置密钥
                </Button>
              </>
            ) : (
              <Button onClick={handleVerifySecret} disabled={isLoading}>
                验证密钥
              </Button>
            )}
          </div>
        ) : (
          // 已验证状态 - 可以修改密钥
          <div className="space-y-3">
            <p className="text-sm text-white/70">密钥已设置，可以修改</p>
            <div>
              <Label htmlFor="old-secret" className="text-white">当前密钥</Label>
              <div className="relative mt-1">
                <Input
                  id="old-secret"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="输入当前密钥"
                  value={currentSecret}
                  onChange={(e) => setCurrentSecret(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showSecret ? <EyeNoneIcon className="w-4 h-4" /> : <EyeOpenIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="new-secret" className="text-white">新密钥</Label>
              <Input
                id="new-secret"
                type={showSecret ? 'text' : 'password'}
                placeholder="至少6个字符"
                value={newSecret}
                onChange={(e) => setNewSecret(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm-new-secret" className="text-white">确认新密钥</Label>
              <Input
                id="confirm-new-secret"
                type={showSecret ? 'text' : 'password'}
                placeholder="再次输入新密钥"
                value={confirmSecret}
                onChange={(e) => setConfirmSecret(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleSetSecret} disabled={isLoading}>
              修改密钥
            </Button>
          </div>
        )}

        {message && (
          <div className={cn(
            "text-sm p-3 rounded-lg",
            message.includes('成功') || message.includes('已') ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"
          )}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
