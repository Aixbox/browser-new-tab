import type { NextRequest } from 'next/server';
import { KVNamespace } from '@cloudflare/workers-types';

export const runtime = 'edge';

interface BingImage {
  url: string;
  urlbase: string;
  copyright: string;
  copyrightlink: string;
  title: string;
  startdate: string;
  enddate: string;
}

interface BingResponse {
  images: BingImage[];
}

interface ArchivedWallpaper {
  url: string;
  thumbnail: string;
  copyright: string;
  copyrightlink: string;
  title: string;
  date: string;
  urlbase: string;
  archivedAt: string;
}

export default async function handler(request: NextRequest) {
  const { NEWTAB_KV } = process.env as unknown as {
    NEWTAB_KV: KVNamespace;
  };

  if (!NEWTAB_KV) {
    return new Response(
      JSON.stringify({ error: 'KV storage not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // GET: 获取存档的壁纸
  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      // 从 KV 读取存档列表
      const archiveListStr = await NEWTAB_KV.get('bing_wallpaper_archive_list');
      const archiveList: string[] = archiveListStr ? JSON.parse(archiveListStr) : [];

      // 分页
      const start = page * limit;
      const end = start + limit;
      const pageKeys = archiveList.slice(start, end);

      // 批量读取壁纸数据
      const wallpapers: ArchivedWallpaper[] = [];
      for (const key of pageKeys) {
        const dataStr = await NEWTAB_KV.get(`bing_wallpaper_${key}`);
        if (dataStr) {
          wallpapers.push(JSON.parse(dataStr));
        }
      }

      return new Response(
        JSON.stringify({
          wallpapers,
          total: archiveList.length,
          page,
          hasMore: end < archiveList.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Failed to get archived wallpapers:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to get archived wallpapers' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // POST: 存档新壁纸（定时任务调用）
  if (request.method === 'POST') {
    try {
      // 获取最近16天的壁纸
      // idx=-1 可以获取最新的壁纸（包括今天）
      const bingApiUrl = `https://cn.bing.com/HPImageArchive.aspx?format=js&idx=-1&n=16&mkt=zh-CN`;
      const response = await fetch(bingApiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Bing wallpaper');
      }

      const data = await response.json() as BingResponse;
      
      if (!data.images || data.images.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No new wallpapers', archived: 0 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 读取现有存档列表
      const archiveListStr = await NEWTAB_KV.get('bing_wallpaper_archive_list');
      const archiveList: string[] = archiveListStr ? JSON.parse(archiveListStr) : [];
      const existingDates = new Set(archiveList);

      let archivedCount = 0;

      // 存档新壁纸
      for (const image of data.images) {
        const date = image.startdate;
        
        console.log(`处理壁纸: ${date}, 已存在: ${existingDates.has(date)}`);
        
        // 如果已存档，跳过
        if (existingDates.has(date)) {
          continue;
        }

        const imageUrl = `https://cn.bing.com${image.url}`;
        
        const wallpaper: ArchivedWallpaper = {
          url: imageUrl,
          thumbnail: imageUrl,
          copyright: image.copyright,
          copyrightlink: image.copyrightlink,
          title: image.title,
          date: date,
          urlbase: image.urlbase,
          archivedAt: new Date().toISOString(),
        };

        // 存储壁纸数据
        await NEWTAB_KV.put(`bing_wallpaper_${date}`, JSON.stringify(wallpaper));
        
        console.log(`✅ 已存档: ${date}`);
        
        // 添加到列表（最新的在前面）
        archiveList.unshift(date);
        archivedCount++;
      }

      // 更新存档列表
      if (archivedCount > 0) {
        await NEWTAB_KV.put('bing_wallpaper_archive_list', JSON.stringify(archiveList));
      }

      return new Response(
        JSON.stringify({
          message: 'Wallpapers archived successfully',
          archived: archivedCount,
          total: archiveList.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Failed to archive wallpapers:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to archive wallpapers',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
}
