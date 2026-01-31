import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {
    // 验证URL格式
    const iconUrl = new URL(url);
    
    // 只允许获取图标相关的文件
    const allowedExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    const allowedPaths = ['/favicon', '/apple-touch-icon', '/icon'];
    
    const isValidIcon = allowedExtensions.some(ext => 
      iconUrl.pathname.toLowerCase().endsWith(ext)
    ) || allowedPaths.some(path => 
      iconUrl.pathname.toLowerCase().includes(path)
    );

    if (!isValidIcon) {
      return new Response('Invalid icon URL', { status: 400 });
    }

    // 尝试获取图标的多个可能路径
    const urlsToTry = [
      url, // 原始 URL
      `${iconUrl.origin}/favicon.ico`, // 根目录 favicon.ico
      `${iconUrl.origin}/favicon.png`, // 根目录 favicon.png
    ];

    let response: Response | null = null;
    let lastError: Error | null = null;

    // 依次尝试每个 URL
    for (const tryUrl of urlsToTry) {
      try {
        const res = await fetch(tryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          // 5秒超时
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          response = res;
          break;
        }
      } catch (error) {
        lastError = error as Error;
        // 继续尝试下一个 URL
      }
    }

    if (!response) {
      throw lastError || new Error('All icon URLs failed');
    }

    // 检查内容类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Not an image');
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer();
    
    // 返回图片，设置长期缓存头
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable', // 30天缓存
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Icon proxy error:', error);
    
    // 返回一个简单的 SVG 占位符图标
    const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" fill="#e5e7eb" rx="4"/>
      <path d="M16 8a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12z" fill="#9ca3af"/>
    </svg>`;
    
    return new Response(placeholderSvg, { 
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}
