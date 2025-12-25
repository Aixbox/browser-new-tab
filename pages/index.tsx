import { useState } from "react";
import Head from "next/head";
import { KVNamespace } from '@cloudflare/workers-types';
import { Background } from "@/components/background";
import { SidebarDemo } from "@/components/sidebar-demo";
import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";
import { DraggableGrid } from "@/components/draggable-grid";
import { SettingsDialog } from "@/components/settings-drawer";
import { SidebarItem } from "@/components/custom-sidebar";

// 使用 Edge Runtime（与 UptimeFlare 对齐）
export const config = {
  runtime: 'experimental-edge',
};

interface HomeProps {
  avatarUrl: string | null;
  hasSecretKey: boolean;
  sidebarItems: SidebarItem[] | null;
  openInNewTab: { search: boolean; icon: boolean };
}

export default function Home({ avatarUrl, hasSecretKey, sidebarItems, openInNewTab }: HomeProps) {
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
            initialSidebarItems={sidebarItems}
          />
          <div className="p-inset h-full w-full relative pl-16 flex flex-col items-center justify-center gap-8">
            <SimpleTimeDisplay />
            <SearchEngine openInNewTab={openInNewTab.search} />
            <DraggableGrid openInNewTab={openInNewTab.icon} />
          </div>
          
          {/* 设置对话框 */}
          <SettingsDialog 
            isOpen={isSettingsOpen} 
            onOpenChange={setIsSettingsOpen}
            initialAvatarUrl={avatarUrl}
            hasSecretKey={hasSecretKey}
            initialOpenInNewTab={openInNewTab}
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
  let sidebarItems: SidebarItem[] | null = null;
  let openInNewTab = { search: true, icon: true }; // 默认都在新标签页打开
  const hasSecretKey = !!SECRET_KEY;

  try {
    // 从 KV 读取数据
    if (NEWTAB_KV) {
      avatarUrl = await NEWTAB_KV.get('avatar_url');
      const sidebarItemsStr = await NEWTAB_KV.get('sidebar_items');
      if (sidebarItemsStr) {
        sidebarItems = JSON.parse(sidebarItemsStr);
      }
      
      // 读取打开方式设置
      const openInNewTabStr = await NEWTAB_KV.get('open_in_new_tab');
      if (openInNewTabStr) {
        const settings = JSON.parse(openInNewTabStr);
        openInNewTab = {
          search: settings.search ?? true,
          icon: settings.icon ?? true,
        };
      }
    }
  } catch (error) {
    console.error('Failed to load settings from KV:', error);
  }

  return {
    props: {
      avatarUrl,
      hasSecretKey,
      sidebarItems,
      openInNewTab,
    },
  };
}
