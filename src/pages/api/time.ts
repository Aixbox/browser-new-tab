import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: NextRequest) {
  try {
    // 代理到 WorldTimeAPI
    const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Shanghai', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TimeProxy/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // 返回时间数据
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Time API proxy error:', error);
    
    // 如果外部API失败，返回服务器时间
    return new Response(JSON.stringify({
      datetime: new Date().toISOString(),
      timezone: 'Asia/Shanghai',
      fallback: true,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });
  }
}
