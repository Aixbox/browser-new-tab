"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Cross2Icon, MagnifyingGlassIcon, ReloadIcon } from "@radix-ui/react-icons";

interface BingWallpaper {
  url: string;
  thumbnail: string;
  copyright: string;
  copyrightlink: string;
  title: string;
  date: string;
  urlbase: string;
}

interface BingWallpaperGalleryProps {
  onSelect: (url: string, info: { copyright?: string; title?: string }) => void;
}

export const BingWallpaperGallery = ({ onSelect }: BingWallpaperGalleryProps) => {
  const [wallpapers, setWallpapers] = useState<BingWallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<BingWallpaper | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false); // 防止重复加载

  // 加载壁纸
  const loadWallpapers = async (pageNum: number) => {
    if (loadingRef.current) {
      console.log('已有加载任务进行中，跳过');
      return;
    }
    
    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      // 优先从存档加载
      const archiveResponse = await fetch(`/api/bing-wallpaper-archive?page=${pageNum}&limit=20`);
      
      if (archiveResponse.ok) {
        const archiveData = await archiveResponse.json() as {
          wallpapers: BingWallpaper[];
          total: number;
          hasMore: boolean;
        };
        
        console.log(`从存档加载第 ${pageNum} 页，返回 ${archiveData.wallpapers.length} 张图片`);
        
        if (archiveData.wallpapers.length > 0) {
          // 去重后添加
          setWallpapers(prev => {
            const existing = new Set(prev.map(w => w.urlbase));
            const newWallpapers = archiveData.wallpapers.filter(w => !existing.has(w.urlbase));
            console.log(`去重后新增 ${newWallpapers.length} 张图片`);
            return [...prev, ...newWallpapers];
          });
          setHasMore(archiveData.hasMore);
          return;
        }
      }
      
      // 如果存档没有数据，从必应 API 加载
      const idx = pageNum * 8;
      const n = 8;
      
      console.log(`从必应 API 加载第 ${pageNum} 页，idx=${idx}`);
      
      const response = await fetch(`/api/bing-wallpaper?idx=${idx}&n=${n}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallpapers');
      }
      
      const data = await response.json() as { images: BingWallpaper[]; total: number };
      
      console.log(`加载第 ${pageNum} 页完成，返回 ${data.images.length} 张图片`);
      if (data.images.length > 0) {
        console.log('返回的图片日期:', data.images.map(img => img.date).join(', '));
      }
      
      if (data.images.length === 0) {
        setHasMore(false);
        return;
      }
      
      // 先检查是否有新图片
      const existing = new Set(wallpapers.map(w => w.urlbase));
      const newWallpapers = data.images.filter(w => !existing.has(w.urlbase));
      console.log(`去重后新增 ${newWallpapers.length} 张图片`);
      
      if (newWallpapers.length === 0) {
        console.log('没有新图片，停止加载');
        setHasMore(false);
        return;
      }
      
      // 有新图片，添加到列表
      setWallpapers(prev => [...prev, ...newWallpapers]);
      
      // 如果返回的图片少于8张，说明没有更多了
      if (data.images.length < 8) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load wallpapers:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  // 初始加载
  useEffect(() => {
    loadWallpapers(0);
  }, []);

  // 使用 Intersection Observer 实现滚动自动加载
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadWallpapers(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasMore, page]);

  // 选择壁纸
  const handleSelectWallpaper = (wallpaper: BingWallpaper) => {
    onSelect(wallpaper.url, {
      copyright: wallpaper.copyright,
      title: wallpaper.title,
    });
    setSelectedImage(null);
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">必应每日壁纸</h3>
          <p className="text-sm text-white/60 mt-1">
            点击图片选择作为背景，再次点击可放大查看
          </p>
        </div>
        <Button
          onClick={() => {
            setWallpapers([]);
            setPage(0);
            setHasMore(true);
            loadWallpapers(0);
          }}
          size="sm"
          disabled={isLoading}
        >
          <ReloadIcon className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* 壁纸网格 */}
      <div className="grid grid-cols-2 gap-4">
        {wallpapers.map((wallpaper, index) => (
          <div
            key={`${wallpaper.urlbase}-${index}`}
            className="group relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 border-white/10 hover:border-white/30 transition-all duration-300"
            onClick={() => setSelectedImage(wallpaper)}
          >
            <img
              src={wallpaper.thumbnail}
              alt={wallpaper.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* 悬浮信息 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-medium line-clamp-2">
                  {wallpaper.copyright}
                </p>
                <p className="text-white/60 text-xs mt-1">
                  {formatDate(wallpaper.date)}
                </p>
              </div>
            </div>

            {/* 放大图标 */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                <MagnifyingGlassIcon className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 滚动加载触发器 */}
      {hasMore && <div ref={observerRef} className="h-4" />}

      {/* 加载更多提示 */}
      {isLoading && (
        <div className="text-center py-4">
          <ReloadIcon className="w-5 h-5 text-white/60 animate-spin mx-auto" />
          <p className="text-sm text-white/60 mt-2">加载中...</p>
        </div>
      )}

      {!hasMore && wallpapers.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-white/60">已加载全部壁纸</p>
        </div>
      )}

      {/* 放大查看对话框 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"
            >
              <Cross2Icon className="w-6 h-6" />
            </button>

            {/* 图片 */}
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 信息和操作 */}
            <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {selectedImage.copyright}
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    {formatDate(selectedImage.date)}
                  </p>
                  {selectedImage.copyrightlink && (
                    <a
                      href={selectedImage.copyrightlink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
                    >
                      了解更多 →
                    </a>
                  )}
                </div>
                <Button
                  onClick={() => handleSelectWallpaper(selectedImage)}
                  size="sm"
                >
                  设为背景
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
