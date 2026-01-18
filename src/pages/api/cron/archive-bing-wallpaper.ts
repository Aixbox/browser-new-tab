import type { NextRequest } from 'next/server';

export const runtime = 'edge';

// 这个 API 应该由 Cloudflare Cron Triggers 或外部定时任务调用
// 每天自动存档必应壁纸

export default async function handler(request: NextRequest) {
  // 验证请求来源（可选：添加密钥验证）
  const authorization = request.headers.get('authorization');
  const { CRON_SECRET } = process.env;
  
  if (CRON_SECRET && authorization !== `Bearer ${CRON_SECRET}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (request.method !== 'POST' && request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 调用存档 API
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    const response = await fetch(`${baseUrl}/api/bing-wallpaper-archive`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to archive wallpapers');
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Wallpapers archived successfully',
        data,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cron job failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to archive wallpapers',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
