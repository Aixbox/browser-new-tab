import { useEffect } from "react";
import { imageCache } from "@/lib/image-cache";
import type { GridItem } from "@/lib/grid-model";

// 简化：移除多页面结构和 Dock
interface PreloadAssetsOptions {
  gridItems: GridItem[];
  avatarUrl: string | null;
}


export const usePreloadAssets = ({ gridItems, avatarUrl }: PreloadAssetsOptions) => {
  useEffect(() => {
    const imagesToPreload: string[] = [];

    gridItems.forEach((item) => {
      if ("iconLogo" in item && item.iconLogo) imagesToPreload.push(item.iconLogo);
      if ("iconImage" in item && item.iconImage) imagesToPreload.push(item.iconImage);
    });

    if (avatarUrl) imagesToPreload.push(avatarUrl);

    if (imagesToPreload.length > 0) {
      imageCache.preloadBatch(imagesToPreload);
    }
  }, [gridItems, avatarUrl]);
};
