import type { NextRequest } from 'next/server';
import { KVNamespace } from '@cloudflare/workers-types';

export const runtime = 'edge';

// 获取 KV 命名空间
function getKV() {
  const { NEWTAB_KV } = process.env as unknown as {
    NEWTAB_KV: KVNamespace
  };
  
  if (!NEWTAB_KV) {
    throw new Error('KV namespace not available');
  }
  
  return NEWTAB_KV;
}

// 验证密钥
function verifySecret(secret: string | null): boolean {
  const storedSecret = process.env.SECRET_KEY;
  
  // 如果没有设置密钥，允许访问
  if (!storedSecret) {
    return true;
  }
  
  // 如果设置了密钥，必须验证
  return secret === storedSecret;
}

export default async function handler(request: NextRequest) {
  const { method } = request;
  const url = new URL(request.url);

  try {
    const KV = getKV();

    // GET - 获取设置（不需要验证）
    if (method === 'GET') {
      const key = url.searchParams.get('key');
      
      if (!key) {
        return new Response(
          JSON.stringify({ error: 'Key is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const value = await KV.get(key);

      return new Response(
        JSON.stringify({
          key,
          value: value || '',
          exists: !!value,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST - 设置配置（需要验证）
    if (method === 'POST') {
      const body = await request.json();
      const { action, key, value, secret } = body;

      // 验证密钥
      if (!verifySecret(secret)) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: '密钥验证失败' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'setSetting') {
        await KV.put(key, value);
        return new Response(
          JSON.stringify({ success: true, message: 'Setting updated' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Settings API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
