import { Background } from "@/components/background";
import { SidebarDemo } from "@/components/sidebar-demo";
import { SearchEngine } from "@/components/search-engine";

export default function Home() {
  return (
    <main className="h-dvh w-full">
      <div className="relative h-full w-full">
        <Background src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/alt-g7Cv2QzqL3k6ey3igjNYkM32d8Fld7.mp4" placeholder="/alt-placeholder.png" />
        <SidebarDemo />
        <div className="p-inset h-full w-full relative pl-16 flex items-center justify-center">
          <SearchEngine />
        </div>
      </div>
    </main>
  );
}
