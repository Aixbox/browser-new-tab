"use client";

import Head from "next/head";
import { Background } from "@/components/background";

interface HomeShellProps {
  title: string;
  backgroundUrl: string | null;
  onContextMenu: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}

export const HomeShell = ({ title, backgroundUrl, onContextMenu, children }: HomeShellProps) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-dvh w-full" onContextMenu={onContextMenu}>
        <div className="relative h-full w-full">
          <Background
            src={
              backgroundUrl ||
              "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/alt-g7Cv2QzqL3k6ey3igjNYkM32d8Fld7.mp4"
            }
            placeholder="/alt-placeholder.png"
          />
          {children}
        </div>
      </main>
    </>
  );
};
