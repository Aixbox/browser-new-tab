export type IconItem = {
  id: string;
  name: string;
  url: string;
  iconType: "logo" | "image" | "text";
  iconLogo?: string;
  iconImage?: string;
  iconText?: string;
  iconColor?: string;
  _tempPreview?: boolean;
};

export type FolderItem = {
  id: string;
  name: string;
  type: "folder";
  items: IconItem[];
  _tempPreview?: boolean;
};

export type GridItem = IconItem | FolderItem;

export type DockItem = IconItem;

export const isFolder = (item: GridItem): item is FolderItem => {
  return "type" in item && item.type === "folder";
};

export const isIcon = (item: GridItem): item is IconItem => {
  return !isFolder(item);
};

export const createFolder = (items: IconItem[], name = "新文件夹"): FolderItem => {
  return {
    id: `folder-${Date.now()}`,
    name,
    type: "folder",
    items,
  };
};

export const stripTempPreviews = (pageGridItems: Record<string, GridItem[]>): Record<string, GridItem[]> => {
  return Object.fromEntries(
    Object.entries(pageGridItems).map(([pageId, items]) => [
      pageId,
      items.filter((item) => !("_tempPreview" in item && item._tempPreview)),
    ])
  );
};
