"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { EyeOpenIcon, EyeNoneIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

// 简单的哈希函数（与服务端保持一致）
async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface SecretInputProps {
  onVerified: () => void;
}

export const SecretInput = ({ onVerified }: SecretInputProps) => {
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 检查 localStorage 中是否已有验证过的密钥
  useEffect(() => {
    const checkStoredSecret = async () => {
      const storedSecret = localStorage.getItem('secret_key');
      if (storedSecret) {
        setIsLoading(true);
        const verified = await verifySecret(storedSecret);
        if (verified) {
          onVerified();
        } else {
          // 清除无效的密钥
          localStorage.removeItem('secret_key');
        }
        setIsLoading(false);
      }
    };
    checkStoredSecret();
  }, [onVerified]);

  const verifySecret = async (secretToVerify: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/verify-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secretToVerify }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.verified || false;
    } catch (error) {
      console.error('Failed to verify secret:', error);
      return false;
    }
  };

  const handleVerify = async () => {
    if (!secret.trim()) {
      setError('请输入密钥');
      return;
    }

    setIsLoading(true);
    setError('');

    const verified = await verifySecret(secret);

    if (verified) {
      // 保存到 localStorage
      localStorage.setItem('secret_key', secret);
      onVerified();
    } else {
      setError('密钥错误，请检查后重试');
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-2xl shadow-2xl border border-white/10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <LockClosedIcon className="w-8 h-8 text-white/80" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">验证密钥</h2>
          <p className="text-sm text-white/60 text-center">
            请输入密钥以访问您的个性化设置
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="secret" className="text-white">密钥</Label>
            <div className="relative mt-2">
              <Input
                id="secret"
                type={showSecret ? 'text' : 'password'}
                placeholder="输入您的密钥"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {showSecret ? <EyeNoneIcon className="w-4 h-4" /> : <EyeOpenIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm p-3 rounded-lg bg-red-500/20 text-red-200 border border-red-500/30">
              {error}
            </div>
          )}

          <Button 
            onClick={handleVerify} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? '验证中...' : '验证'}
          </Button>

          <p className="text-xs text-white/40 text-center mt-4">
            密钥由管理员在 GitHub Secrets 中配置
          </p>
        </div>
      </div>
    </div>
  );
};
