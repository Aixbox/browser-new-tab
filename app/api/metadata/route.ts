import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    // 验证URL格式
    const targetUrl = new URL(url);
    
    // 只允许 http 和 https 协议
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
    }

    // 获取网页内容
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN,zh;q=0.8',
        'Cache-Control': 'no-cache',
      },
      // 10秒超时
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // 提取标题
    let title = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // 如果没有找到 title 标签，尝试 og:title
    if (!title) {
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      if (ogTitleMatch) {
        title = ogTitleMatch[1].trim();
      }
    }

    // 提取 favicon
    let favicon = '';
    
    // 尝试查找各种 favicon 链接
    const faviconPatterns = [
      /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
      /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i,
    ];

    for (const pattern of faviconPatterns) {
      const match = html.match(pattern);
      if (match) {
        favicon = match[1];
        break;
      }
    }

    // 如果没有找到 favicon，使用默认路径
    if (!favicon) {
      favicon = `${targetUrl.protocol}//${targetUrl.host}/favicon.ico`;
    } else if (favicon.startsWith('//')) {
      // 处理协议相对 URL
      favicon = targetUrl.protocol + favicon;
    } else if (favicon.startsWith('/')) {
      // 处理相对路径
      favicon = `${targetUrl.protocol}//${targetUrl.host}${favicon}`;
    } else if (!favicon.startsWith('http')) {
      // 处理相对路径（无斜杠开头）
      const basePath = targetUrl.pathname.substring(0, targetUrl.pathname.lastIndexOf('/') + 1);
      favicon = `${targetUrl.protocol}//${targetUrl.host}${basePath}${favicon}`;
    }

    // 返回元数据
    return NextResponse.json(
      {
        title: title || targetUrl.hostname,
        favicon: favicon,
        url: url,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // 缓存1小时
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      }
    );

  } catch (error) {
    console.error('Metadata fetch error:', error);
    
    // 返回基本信息
    try {
      const targetUrl = new URL(url);
      return NextResponse.json(
        {
          title: targetUrl.hostname,
          favicon: `${targetUrl.protocol}//${targetUrl.host}/favicon.ico`,
          url: url,
          error: 'Failed to fetch full metadata',
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=300', // 错误缓存5分钟
          },
        }
      );
    } catch {
      return NextResponse.json(
        { error: 'Failed to fetch metadata' },
        { status: 500 }
      );
    }
  }
}

export const runtime = 'edge';
