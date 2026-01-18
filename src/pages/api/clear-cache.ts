import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: NextRequest) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 返回成功响应，客户端会清除本地缓存
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
