import { useEffect } from "react";
import { imageCache } from "@/lib/image-cache";
import type { GridItem } from "@/lib/grid-model";

type PageGridItems = Record<string, GridItem[]>;

interface PreloadAssetsOptions {
  pageGridItems: PageGridItems;
  dockItems: GridItem[];
  avatarUrl: string | null;
}


export const usePreloadAssets = ({ pageGridItems, dockItems, avatarUrl }: PreloadAssetsOptions) => {
  useEffect(() => {
    const imagesToPreload: string[] = [];

    Object.values(pageGridItems).forEach((items) => {
      items.forEach((item) => {
        if ("iconLogo" in item && item.iconLogo) imagesToPreload.push(item.iconLogo);
        if ("iconImage" in item && item.iconImage) imagesToPreload.push(item.iconImage);
      });
    });

    dockItems.forEach((item) => {
      if ("iconLogo" in item && item.iconLogo) imagesToPreload.push(item.iconLogo);
      if ("iconImage" in item && item.iconImage) imagesToPreload.push(item.iconImage);
    });

    if (avatarUrl) imagesToPreload.push(avatarUrl);

    if (imagesToPreload.length > 0) {
      imageCache.preloadBatch(imagesToPreload);
    }
  }, [pageGridItems, dockItems, avatarUrl]);
};
