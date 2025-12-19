import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
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
      return new NextResponse('Invalid icon URL', { status: 400 });
    }

    // 设置请求头，模拟浏览器请求
    const response = await fetch(url, {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 检查内容类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Not an image');
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer();
    
    // 返回图片，设置适当的缓存头
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // 缓存1天，过期后1周内可用旧版本
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Icon proxy error:', error);
    
    // 返回默认图标或错误
    return new NextResponse('Icon not found', { 
      status: 404,
      headers: {
        'Cache-Control': 'public, max-age=300', // 错误缓存5分钟
      }
    });
  }
}

export const runtime = 'edge';