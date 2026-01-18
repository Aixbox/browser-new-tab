// 数据同步 Hook
import { useEffect, useRef } from 'react';
import {
  getLocalSyncTimestamps,
  saveLocalSyncTimestamps,
  compareTimestamps,
  type SyncTimestamps,
} from '@/lib/sync-manager';

export function useDataSync(onDataUpdate: (field: keyof SyncTimestamps, data: any) => void) {
  const hasChecked = useRef(false);

  useEffect(() => {
    // 只在首次加载时检查一次
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAndSync = async () => {
      try {
        console.log('[Sync] Checking for updates...');
        
        // 1. 获取远程时间戳
        const response = await fetch('/api/sync-timestamps');
        if (!response.ok) {
          console.error('[Sync] Failed to fetch remote timestamps');
          return;
        }

        const { timestamps: remoteTimestamps } = await response.json() as { timestamps: SyncTimestamps | null };
        
        if (!remoteTimestamps) {
          console.log('[Sync] No remote timestamps found');
          return;
        }

        // 2. 获取本地时间戳
        const localTimestamps = getLocalSyncTimestamps();

        // 3. 比较时间戳，找出需要更新的字段
        const needsUpdate = compareTimestamps(localTimestamps, remoteTimestamps);

        if (needsUpdate.length === 0) {
          console.log('[Sync] All data is up to date');
          return;
        }

        console.log('[Sync] Fields need update:', needsUpdate);

        // 4. 获取需要更新的数据
        const dataResponse = await fetch(`/api/sync-data?fields=${needsUpdate.join(',')}`);
        if (!dataResponse.ok) {
          console.error('[Sync] Failed to fetch data');
          return;
        }

        const { data } = await dataResponse.json() as { data: Record<string, any> };

        // 5. 更新每个字段的数据
        for (const field of needsUpdate) {
          const fieldData = data[field];
          if (fieldData !== undefined) {
            console.log(`[Sync] Updating ${field}:`, fieldData);
            onDataUpdate(field, fieldData);
          }
        }

        // 6. 保存新的时间戳到本地
        saveLocalSyncTimestamps(remoteTimestamps);
        console.log('[Sync] Sync completed');

      } catch (error) {
        console.error('[Sync] Error during sync:', error);
      }
    };

    // 延迟一点执行，避免阻塞页面渲染
    const timer = setTimeout(checkAndSync, 500);
    return () => clearTimeout(timer);
  }, [onDataUpdate]);
}

// 更新远程时间戳的辅助函数
export async function updateRemoteTimestamp(field: keyof SyncTimestamps): Promise<void> {
  try {
    // 1. 获取当前远程时间戳
    const response = await fetch('/api/sync-timestamps');
    if (!response.ok) {
      console.error('[Sync] Failed to fetch remote timestamps for update');
      return;
    }

    const { timestamps } = await response.json() as { timestamps: SyncTimestamps | null };
    
    // 2. 更新指定字段的时间戳
    const updatedTimestamps: SyncTimestamps = timestamps || {
      account: 0,
      openMethod: 0,
      icon: 0,
      timeDate: 0,
      theme: 0,
      layout: 0,
      sidebar: 0,
      sidebarButtons: 0,
      gridIcons: 0,
      dockIcons: 0,
      searchEngines: 0,
    };

    updatedTimestamps[field] = Date.now();

    // 3. 保存到远程
    const updateResponse = await fetch('/api/sync-timestamps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamps: updatedTimestamps }),
    });

    if (!updateResponse.ok) {
      console.error('[Sync] Failed to update remote timestamp');
      return;
    }

    // 4. 同时更新本地时间戳
    saveLocalSyncTimestamps(updatedTimestamps);
    
    console.log(`[Sync] Updated timestamp for ${field}`);
  } catch (error) {
    console.error('[Sync] Error updating timestamp:', error);
  }
}
