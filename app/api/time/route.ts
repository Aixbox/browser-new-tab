import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60', // 缓存1分钟
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Time API proxy error:', error);
    
    // 如果外部API失败，返回服务器时间
    return NextResponse.json({
      datetime: new Date().toISOString(),
      timezone: 'Asia/Shanghai',
      fallback: true,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30',
      },
    });
  }
}

export const runtime = 'edge';