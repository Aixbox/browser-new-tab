import type { NextRequest } from 'next/server';
import { KVNamespace } from '@cloudflare/workers-types';
import type { SyncTimestamps } from '@/lib/sync-manager';

export const runtime = 'edge';

// 获取 KV 命名空间
function getKV() {
  const { NEWTAB_KV } = process.env as unknown as {
    NEWTAB_KV: KVNamespace
  };
  
  if (!NEWTAB_KV) {
    throw new Error('KV namespace not available');
  }
  
  return NEWTAB_KV;
}

// 字段到 KV key 的映射
const FIELD_TO_KV_KEYS: Record<keyof SyncTimestamps, string[]> = {
  account: ['avatar_url'],
  openMethod: ['open_in_new_tab'],
  icon: ['icon_style'],
  timeDate: ['time_date_settings'],
  theme: ['background_url'],
  layout: ['layout_mode'],
  sidebar: ['sidebar_settings'],
  sidebarButtons: ['sidebar_items'],
  gridIcons: ['page_grid_items'],
  dockIcons: ['dock_items'],
  searchEngines: ['search_engines', 'selected_engine'],
};

export default async function handler(request: NextRequest) {
  const { method } = request;
  const url = new URL(request.url);

  try {
    const KV = getKV();

    // GET - 获取指定字段的数据
    if (method === 'GET') {
      const fields = url.searchParams.get('fields');
      
      if (!fields) {
        return new Response(
          JSON.stringify({ error: 'Fields parameter is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const fieldList = fields.split(',') as (keyof SyncTimestamps)[];
      const data: Record<string, any> = {};

      // 获取每个字段对应的数据
      for (const field of fieldList) {
        const kvKeys = FIELD_TO_KV_KEYS[field];
        if (!kvKeys) continue;

        if (kvKeys.length === 1) {
          // 单个 key
          const value = await KV.get(kvKeys[0]);
          data[field] = value ? (value.startsWith('{') || value.startsWith('[') ? JSON.parse(value) : value) : null;
        } else {
          // 多个 key（如 searchEngines）
          const values: Record<string, any> = {};
          for (const key of kvKeys) {
            const value = await KV.get(key);
            values[key] = value ? (value.startsWith('{') || value.startsWith('[') ? JSON.parse(value) : value) : null;
          }
          data[field] = values;
        }
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync data API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
