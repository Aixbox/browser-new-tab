import { useEffect } from "react";
import { imageCache } from "@/lib/image-cache";

type PageGridItems = Record<string, any[]>;

interface PreloadAssetsOptions {
  pageGridItems: PageGridItems;
  dockItems: any[];
  avatarUrl: string | null;
}

export const usePreloadAssets = ({ pageGridItems, dockItems, avatarUrl }: PreloadAssetsOptions) => {
  useEffect(() => {
    const imagesToPreload: string[] = [];

    Object.values(pageGridItems).forEach((items: any[]) => {
      items.forEach((item: any) => {
        if (item.iconLogo) imagesToPreload.push(item.iconLogo);
        if (item.iconImage) imagesToPreload.push(item.iconImage);
      });
    });

    dockItems.forEach((item: any) => {
      if (item.iconLogo) imagesToPreload.push(item.iconLogo);
      if (item.iconImage) imagesToPreload.push(item.iconImage);
    });

    if (avatarUrl) imagesToPreload.push(avatarUrl);

    if (imagesToPreload.length > 0) {
      imageCache.preloadBatch(imagesToPreload);
    }
  }, [pageGridItems, dockItems, avatarUrl]);
};
