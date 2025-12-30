import type { NextRequest } from 'next/server';

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

export default async function handler(request: NextRequest) {
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(request.url);
    const market = url.searchParams.get('market') || 'zh-CN';
    const resolution = url.searchParams.get('resolution') || '1920x1080';
    const idx = url.searchParams.get('idx') || '0';
    const n = url.searchParams.get('n') || '8';
    
    // 使用必应官方 API
    // idx: 从今天开始往前数的天数 (0=今天, 1=昨天, 最大7)
    // n: 返回的图片数量 (最大8)
    // 注意：idx 和 n 配合使用，idx=0&n=8 会返回从今天开始往前的8天
    const bingApiUrl = `https://cn.bing.com/HPImageArchive.aspx?format=js&idx=${idx}&n=${n}&mkt=${market}`;
    
    const response = await fetch(bingApiUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Bing wallpaper');
    }

    const data = await response.json() as BingResponse;
    
    if (!data.images || data.images.length === 0) {
      throw new Error('No images found');
    }

    // 去重：使用 urlbase 作为唯一标识
    const uniqueImages = new Map<string, typeof data.images[0]>();
    data.images.forEach(image => {
      if (!uniqueImages.has(image.urlbase)) {
        uniqueImages.set(image.urlbase, image);
      }
    });

    const images = Array.from(uniqueImages.values()).map(image => {
      // 直接使用必应返回的 URL
      const imageUrl = `https://cn.bing.com${image.url}`;
      
      return {
        url: imageUrl,
        thumbnail: imageUrl,
        copyright: image.copyright,
        copyrightlink: image.copyrightlink,
        title: image.title,
        date: image.startdate,
        urlbase: image.urlbase,
      };
    });

    return new Response(
      JSON.stringify({
        images,
        total: images.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Bing wallpaper:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch Bing wallpaper',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
