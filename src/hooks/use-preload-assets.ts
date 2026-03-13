import { useEffect } from "react";
import { imageCache } from "@/lib/image-cache";
import type { GridItem } from "@/lib/grid-model";
import type { PageGridItems } from "@/lib/grid-store";

interface PreloadAssetsOptions {
  pageGridItems: PageGridItems;
  avatarUrl: string | null;
}

export const usePreloadAssets = ({ pageGridItems, avatarUrl }: PreloadAssetsOptions) => {
  useEffect(() => {
    const imagesToPreload: string[] = [];

    // 遍历所有页面的图标进行预加载
    if (pageGridItems && typeof pageGridItems === "object") {
      for (const items of Object.values(pageGridItems)) {
        if (!Array.isArray(items)) continue;
        items.forEach((item) => {
          if ("iconLogo" in item && item.iconLogo) imagesToPreload.push(item.iconLogo);
          if ("iconImage" in item && item.iconImage) imagesToPreload.push(item.iconImage);
        });
      }
    }

    if (avatarUrl) imagesToPreload.push(avatarUrl);

    if (imagesToPreload.length > 0) {
      imageCache.preloadBatch(imagesToPreload);
    }
  }, [pageGridItems, avatarUrl]);
};
