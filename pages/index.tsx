import { useState, useEffect } from "react";
import Head from "next/head";
import { KVNamespace } from '@cloudflare/workers-types';
import { Background } from "@/components/background";
import { SidebarDemo } from "@/components/sidebar-demo";
import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";
import { DraggableGrid } from "@/components/draggable-grid";
import { SettingsDialog } from "@/components/settings-drawer";
import { SecretInput } from "@/components/secret-input";

// 使用 Edge Runtime（与 UptimeFlare 对齐）
export const config = {
  runtime: 'experimental-edge',
};

interface HomeProps {
  avatarUrl: string | null;
  hasSecretKey: boolean;
}

export default function Home({ avatarUrl, hasSecretKey }: HomeProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isCheckingSecret, setIsCheckingSecret] = useState(true);

  // 检查是否需要密钥验证
  useEffect(() => {
    const checkSecret = async () => {
      // 如果没有设置密钥哈希，直接允许访问
      if (!hasSecretKey) {
        setIsVerified(true);
        setIsCheckingSecret(false);
        return;
      }

      // 检查 localStorage 中是否有密钥
      const storedSecret = localStorage.getItem('secret_key');
      if (storedSecret) {
        // 验证存储的密钥
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
              setIsCheckingSecret(false);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to verify stored secret:', error);
        }
      }

      // 需要用户输入密钥
      setIsCheckingSecret(false);
    };

    checkSecret();
  }, [hasSecretKey]);

  // 显示加载状态
  if (isCheckingSecret) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-black">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  // 显示密钥输入界面
  if (!isVerified) {
    return <SecretInput onVerified={() => setIsVerified(true)} />;
  }

  return (
    <>
      <Head>
        <title>新标签页</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="h-dvh w-full">
        <div className="relative h-full w-full">
          <Background 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/alt-g7Cv2QzqL3k6ey3igjNYkM32d8Fld7.mp4" 
            placeholder="/alt-placeholder.png" 
          />
          <SidebarDemo 
            onAvatarClick={() => setIsSettingsOpen(true)}
            avatarUrl={avatarUrl}
          />
          <div className="p-inset h-full w-full relative pl-16 flex flex-col items-center justify-center gap-8">
            <SimpleTimeDisplay />
            <SearchEngine />
            <DraggableGrid />
          </div>
          
          {/* 设置对话框 */}
          <SettingsDialog 
            isOpen={isSettingsOpen} 
            onOpenChange={setIsSettingsOpen}
            initialAvatarUrl={avatarUrl}
          />
        </div>
      </main>
    </>
  );
}

// SSR - 服务端获取数据（与 UptimeFlare 对齐）
export async function getServerSideProps() {
  const { NEWTAB_KV, SECRET_KEY } = process.env as unknown as {
    NEWTAB_KV: KVNamespace;
    SECRET_KEY?: string;
  };

  let avatarUrl: string | null = null;
  const hasSecretKey = !!SECRET_KEY;

  try {
    // 从 KV 读取头像 URL
    if (NEWTAB_KV) {
      avatarUrl = await NEWTAB_KV.get('avatar_url');
    }
  } catch (error) {
    console.error('Failed to load settings from KV:', error);
  }

  return {
    props: {
      avatarUrl,
      hasSecretKey,
    },
  };
}
