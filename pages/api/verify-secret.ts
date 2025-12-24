import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export default async function handler(request: NextRequest) {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json() as { secret?: string };
    const { secret } = body;

    if (!secret) {
      return new Response(
        JSON.stringify({ error: 'Secret is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 从环境变量获取密钥
    const storedSecret = process.env.SECRET_KEY;

    if (!storedSecret) {
      // 如果没有设置密钥，则允许访问（未配置密钥保护）
      return new Response(
        JSON.stringify({ verified: true, isFirstTime: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证密钥
    const verified = secret === storedSecret;

    return new Response(
      JSON.stringify({ verified }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Secret verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
