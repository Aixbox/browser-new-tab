import { useState } from "react";
import Head from "next/head";
import { KVNamespace } from '@cloudflare/workers-types';
import { Background } from "@/components/background";
import { SidebarDemo } from "@/components/sidebar-demo";
import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";
import { DraggableGrid } from "@/components/draggable-grid";
import { SettingsDialog } from "@/components/settings-drawer";

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
            hasSecretKey={hasSecretKey}
          />
        </div>
      </main>
    </>
  );
}

// SSR - 服务端获取数据（与 UptimeFlare 对齐）
export async function getServerSideProps() {
  const { NEWTAB_KV } = process.env as unknown as {
    NEWTAB_KV: KVNamespace
  };

  let avatarUrl: string | null = null;
  let hasSecretKey = false;

  try {
    // 从 KV 读取头像 URL
    if (NEWTAB_KV) {
      avatarUrl = await NEWTAB_KV.get('avatar_url');
      const secretHash = await NEWTAB_KV.get('secret_key_hash');
      hasSecretKey = !!secretHash;
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
