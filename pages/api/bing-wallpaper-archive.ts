import type { NextApiRequest, NextApiResponse } from 'next';
import { KVNamespace } from '@cloudflare/workers-types';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { NEWTAB_KV } = process.env as unknown as {
    NEWTAB_KV: KVNamespace;
  };

  if (!NEWTAB_KV) {
    return res.status(500).json({ error: 'KV storage not configured' });
  }

  // GET: 获取存档的壁纸
  if (req.method === 'GET') {
    try {
      const { page = '0', limit = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      // 从 KV 读取存档列表
      const archiveListStr = await NEWTAB_KV.get('bing_wallpaper_archive_list');
      const archiveList: string[] = archiveListStr ? JSON.parse(archiveListStr) : [];

      // 分页
      const start = pageNum * limitNum;
      const end = start + limitNum;
      const pageKeys = archiveList.slice(start, end);

      // 批量读取壁纸数据
      const wallpapers: ArchivedWallpaper[] = [];
      for (const key of pageKeys) {
        const dataStr = await NEWTAB_KV.get(`bing_wallpaper_${key}`);
        if (dataStr) {
          wallpapers.push(JSON.parse(dataStr));
        }
      }

      return res.status(200).json({
        wallpapers,
        total: archiveList.length,
        page: pageNum,
        hasMore: end < archiveList.length,
      });
    } catch (error) {
      console.error('Failed to get archived wallpapers:', error);
      return res.status(500).json({ error: 'Failed to get archived wallpapers' });
    }
  }

  // POST: 存档新壁纸（定时任务调用）
  if (req.method === 'POST') {
    try {
      // 获取最近16天的壁纸
      const bingApiUrl = `https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=16&mkt=zh-CN`;
      const response = await fetch(bingApiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Bing wallpaper');
      }

      const data = await response.json() as BingResponse;
      
      if (!data.images || data.images.length === 0) {
        return res.status(200).json({ message: 'No new wallpapers', archived: 0 });
      }

      // 读取现有存档列表
      const archiveListStr = await NEWTAB_KV.get('bing_wallpaper_archive_list');
      const archiveList: string[] = archiveListStr ? JSON.parse(archiveListStr) : [];
      const existingDates = new Set(archiveList);

      let archivedCount = 0;

      // 存档新壁纸
      for (const image of data.images) {
        const date = image.startdate;
        
        // 如果已存档，跳过
        if (existingDates.has(date)) {
          continue;
        }

        const imageUrl = `https://www.bing.com${image.url}`;
        
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
        
        // 添加到列表（最新的在前面）
        archiveList.unshift(date);
        archivedCount++;
      }

      // 更新存档列表
      if (archivedCount > 0) {
        await NEWTAB_KV.put('bing_wallpaper_archive_list', JSON.stringify(archiveList));
      }

      return res.status(200).json({
        message: 'Wallpapers archived successfully',
        archived: archivedCount,
        total: archiveList.length,
      });
    } catch (error) {
      console.error('Failed to archive wallpapers:', error);
      return res.status(500).json({ 
        error: 'Failed to archive wallpapers',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
