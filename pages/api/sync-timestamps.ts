import type { NextRequest } from 'next/server';
import { KVNamespace } from '@cloudflare/workers-types';
import type { SyncTimestamps } from '@/lib/sync-manager';

export const runtime = 'edge';

const SYNC_TIMESTAMPS_KEY = 'sync_timestamps';

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

export default async function handler(request: NextRequest) {
  const { method } = request;

  try {
    const KV = getKV();

    // GET - 获取同步时间戳
    if (method === 'GET') {
      const timestampsStr = await KV.get(SYNC_TIMESTAMPS_KEY);
      
      if (timestampsStr) {
        const timestamps = JSON.parse(timestampsStr) as SyncTimestamps;
        return new Response(
          JSON.stringify({ success: true, timestamps }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        // 如果不存在，返回空对象
        return new Response(
          JSON.stringify({ success: true, timestamps: null }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // POST - 更新同步时间戳
    if (method === 'POST') {
      const body = await request.json() as { timestamps?: SyncTimestamps };
      const { timestamps } = body;

      if (!timestamps) {
        return new Response(
          JSON.stringify({ error: 'Timestamps are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await KV.put(SYNC_TIMESTAMPS_KEY, JSON.stringify(timestamps));

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Sync timestamps API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
