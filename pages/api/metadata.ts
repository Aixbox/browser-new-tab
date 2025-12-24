import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const targetUrl = new URL(url);
    
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new Response(JSON.stringify({ error: 'Invalid URL protocol' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN,zh;q=0.8',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    let title = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    if (!title) {
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      if (ogTitleMatch) {
        title = ogTitleMatch[1].trim();
      }
    }

    let favicon = '';
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

    if (!favicon) {
      favicon = `${targetUrl.protocol}//${targetUrl.host}/favicon.ico`;
    } else if (favicon.startsWith('//')) {
      favicon = targetUrl.protocol + favicon;
    } else if (favicon.startsWith('/')) {
      favicon = `${targetUrl.protocol}//${targetUrl.host}${favicon}`;
    } else if (!favicon.startsWith('http')) {
      const basePath = targetUrl.pathname.substring(0, targetUrl.pathname.lastIndexOf('/') + 1);
      favicon = `${targetUrl.protocol}//${targetUrl.host}${basePath}${favicon}`;
    }

    return new Response(JSON.stringify({
      title: title || targetUrl.hostname,
      favicon: favicon,
      url: url,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });

  } catch (error) {
    console.error('Metadata fetch error:', error);
    
    try {
      const targetUrl = new URL(url);
      return new Response(JSON.stringify({
        title: targetUrl.hostname,
        favicon: `${targetUrl.protocol}//${targetUrl.host}/favicon.ico`,
        url: url,
        error: 'Failed to fetch full metadata',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to fetch metadata' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}
