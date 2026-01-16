export const HOME_EVENTS = {
  openInNewTabChanged: "openInNewTabChanged",
  iconStyleChanged: "iconStyleChanged",
  backgroundChanged: "backgroundChanged",
  layoutModeChanged: "layoutModeChanged",
  sidebarSettingsChanged: "sidebarSettingsChanged",
  sortingModeChange: "sortingModeChange",
} as const;

type HomeEventPayloads = {
  openInNewTabChanged: { search: boolean; icon: boolean };
  iconStyleChanged: unknown;
  backgroundChanged: { url: string | null };
  layoutModeChanged: { mode: "component" | "minimal" };
  sidebarSettingsChanged: unknown;
  sortingModeChange: { activeId?: string; targetId?: string; inSortingMode?: boolean };
};

export const dispatchHomeEvent = <T extends keyof HomeEventPayloads>(type: T, detail: HomeEventPayloads[T]) => {
  window.dispatchEvent(new CustomEvent(HOME_EVENTS[type], { detail }));
};
