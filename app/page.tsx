"use client";

import { useState } from "react";
import { Background } from "@/components/background";
import { SidebarDemo } from "@/components/sidebar-demo";
import { SearchEngine } from "@/components/search-engine";
import { SimpleTimeDisplay } from "@/components/simple-time-display";
import { DraggableGrid } from "@/components/draggable-grid";
import { SettingsDialog } from "@/components/settings-drawer";

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <main className="h-dvh w-full">
      <div className="relative h-full w-full">
        <Background src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/alt-g7Cv2QzqL3k6ey3igjNYkM32d8Fld7.mp4" placeholder="/alt-placeholder.png" />
        <SidebarDemo onAvatarClick={() => setIsSettingsOpen(true)} />
        <div className="p-inset h-full w-full relative pl-16 flex flex-col items-center justify-center gap-8">
          <SimpleTimeDisplay />
          <SearchEngine />
          <DraggableGrid />
        </div>
        
        {/* 设置对话框 */}
        <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      </div>
    </main>
  );
}
