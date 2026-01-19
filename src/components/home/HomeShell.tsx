"use client";

import Head from "next/head";
import { DndContext } from "@dnd-kit/core";
import { Background } from "@/components/background";
import { HomeOverlays } from "@/components/home/HomeOverlays";
import type { IconStyleSettings } from "@/components/icon-settings";
import type { SidebarSettings } from "@/components/sidebar-settings";
import type { GridItem } from "@/lib/grid-model";


interface HomeShellProps {
  title: string;
  backgroundUrl: string | null;
  onContextMenu: (event: React.MouseEvent) => void;
  dndContextProps: React.ComponentProps<typeof DndContext>;
  children: React.ReactNode;
  overlays: {
    contextMenuPosition: { x: number; y: number } | null;
    onContextMenuSettings: () => void;
    onCloseContextMenu: () => void;
    isSettingsOpen: boolean;
    onSettingsOpenChange: (open: boolean) => void;
    avatarUrl: string | null;
    hasSecretKey: boolean;
    openInNewTab: { search: boolean; icon: boolean };
    layoutMode: "component" | "minimal";
    iconStyle: IconStyleSettings;
    backgroundUrl: string | null;
    sidebarSettings: SidebarSettings;
    activeId: string | null;
    gridItems: GridItem[];  // 简化：移除多页面结构
    currentIconStyle: IconStyleSettings;
  };
}

export const HomeShell = ({ title, backgroundUrl, onContextMenu, dndContextProps, children, overlays }: HomeShellProps) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-dvh w-full" onContextMenu={onContextMenu}>
        <DndContext {...dndContextProps}>
          <div className="relative h-full w-full">
            <Background
              src={
                backgroundUrl ||
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/alt-g7Cv2QzqL3k6ey3igjNYkM32d8Fld7.mp4"
              }
              placeholder="/alt-placeholder.png"
            />
            {children}
            <HomeOverlays {...overlays} />
          </div>
        </DndContext>
      </main>
    </>
  );
};
