// Pages Router API 调用函数
import { updateRemoteTimestamp } from '@/hooks/use-data-sync';
import type { SyncTimestamps } from './sync-manager';

// KV key 到同步字段的映射
const KV_KEY_TO_FIELD: Record<string, keyof SyncTimestamps> = {
  'avatar_url': 'account',
  'open_in_new_tab': 'openMethod',
  'icon_style': 'icon',
  'background_url': 'theme',
  'layout_mode': 'layout',
  'sidebar_settings': 'sidebar',
  'sidebar_items': 'sidebarButtons',
  'page_grid_items': 'gridIcons',
  'dock_items': 'dockIcons',
  'search_engines': 'searchEngines',
  'selected_engine': 'searchEngines',
};

export async function getSetting(key: string) {
  const response = await fetch(`/api/settings?key=${encodeURIComponent(key)}`);
  if (!response.ok) {
    throw new Error('Failed to get setting');
  }
  return response.json();
}

export async function setSetting(key: string, value: string) {
  // 从 localStorage 获取密钥
  const secret = localStorage.getItem('secret_key');
  
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'setSetting', key, value, secret }),
  });
  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to set setting');
  }
  
  // 更新对应字段的时间戳
  const field = KV_KEY_TO_FIELD[key];
  if (field) {
    await updateRemoteTimestamp(field);
  }
  
  return response.json();
}

// 侧边栏按钮相关 API
export async function getSidebarItems() {
  const response = await fetch('/api/settings?key=sidebar_items');
  if (!response.ok) {
    throw new Error('Failed to get sidebar items');
  }
  const data = await response.json() as { value?: string };
  return data.value ? JSON.parse(data.value) : null;
}

export async function saveSidebarItems(items: any[]) {
  const secret = localStorage.getItem('secret_key');
  
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: 'setSetting', 
      key: 'sidebar_items', 
      value: JSON.stringify(items),
      secret 
    }),
  });
  
  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to save sidebar items');
  }
  
  // 更新时间戳
  await updateRemoteTimestamp('sidebarButtons');
  
  return response.json();
}
