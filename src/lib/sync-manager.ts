// 数据同步管理器

export interface SyncTimestamps {
  account: number;           // 账号（头像）
  openMethod: number;        // 打开方式
  icon: number;              // 图标样式
  timeDate: number;          // 时间和日期（暂未使用）
  theme: number;             // 主题（背景）
  layout: number;            // 布局模式
  sidebar: number;           // 侧边栏设置
  sidebarButtons: number;    // 侧边栏按钮
  gridIcons: number;         // 宫格图标数据
  dockIcons: number;         // Dock栏图标数据
  searchEngines: number;     // 搜索引擎数据
}

export const SYNC_STORAGE_KEY = 'newtab_sync_timestamps';

// 获取本地缓存的同步时间戳
export function getLocalSyncTimestamps(): SyncTimestamps | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(SYNC_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get local sync timestamps:', error);
  }
  return null;
}

// 保存同步时间戳到本地
export function saveLocalSyncTimestamps(timestamps: SyncTimestamps): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(timestamps));
  } catch (error) {
    console.error('Failed to save local sync timestamps:', error);
  }
}

// 比较两个时间戳对象，返回需要更新的字段
export function compareTimestamps(
  local: SyncTimestamps | null,
  remote: SyncTimestamps
): (keyof SyncTimestamps)[] {
  if (!local) {
    // 本地没有数据，需要全部更新
    return Object.keys(remote) as (keyof SyncTimestamps)[];
  }

  const needsUpdate: (keyof SyncTimestamps)[] = [];
  
  for (const key in remote) {
    const k = key as keyof SyncTimestamps;
    if (local[k] !== remote[k]) {
      needsUpdate.push(k);
    }
  }

  return needsUpdate;
}

// 创建初始的同步时间戳对象
export function createInitialTimestamps(): SyncTimestamps {
  const now = Date.now();
  return {
    account: now,
    openMethod: now,
    icon: now,
    timeDate: now,
    theme: now,
    layout: now,
    sidebar: now,
    sidebarButtons: now,
    gridIcons: now,
    dockIcons: now,
    searchEngines: now,
  };
}

// 更新特定字段的时间戳
export function updateTimestamp(
  timestamps: SyncTimestamps,
  field: keyof SyncTimestamps
): SyncTimestamps {
  return {
    ...timestamps,
    [field]: Date.now(),
  };
}

// 字段到 KV key 的映射
export const FIELD_TO_KV_KEY: Record<keyof SyncTimestamps, string> = {
  account: 'avatar_url',
  openMethod: 'open_in_new_tab',
  icon: 'icon_style',
  timeDate: 'time_date_settings', // 预留
  theme: 'background_url',
  layout: 'layout_mode',
  sidebar: 'sidebar_settings',
  sidebarButtons: 'sidebar_items',
  gridIcons: 'page_grid_items',
  dockIcons: 'dock_items',
  searchEngines: 'search_engines,selected_engine', // 多个 key
};

// 从 KV key 反向查找字段
export function getFieldFromKVKey(kvKey: string): keyof SyncTimestamps | null {
  for (const [field, key] of Object.entries(FIELD_TO_KV_KEY)) {
    if (key.includes(kvKey)) {
      return field as keyof SyncTimestamps;
    }
  }
  return null;
}
