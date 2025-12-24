import type { NextRequest } from 'next/server';
import { KVNamespace } from '@cloudflare/workers-types';

export const runtime = 'edge';

// 简单的哈希函数
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

export default async function handler(request: NextRequest) {
  const { method } = request;
  const url = new URL(request.url);

  try {
    const KV = getKV();

    // GET - 获取设置
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

    // POST - 设置配置
    if (method === 'POST') {
      const body = await request.json();
      const { action, key, value, secret, newSecret, currentSecret } = body;

      switch (action) {
        case 'setSetting':
          await KV.put(key, value);
          return new Response(
            JSON.stringify({ success: true, message: 'Setting updated' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        case 'verifySecret': {
          const storedHash = await KV.get('secret_key_hash');
          
          if (!storedHash) {
            return new Response(
              JSON.stringify({ verified: true, isFirstTime: true }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const inputHash = await hashPassword(secret);
          const verified = inputHash === storedHash;

          return new Response(
            JSON.stringify({ verified, isFirstTime: false }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        case 'setSecret': {
          const existingHash = await KV.get('secret_key_hash');
          
          if (existingHash && currentSecret) {
            const currentHash = await hashPassword(currentSecret);
            if (currentHash !== existingHash) {
              return new Response(
                JSON.stringify({ success: false, error: 'Invalid current secret key' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
              );
            }
          }

          const newHash = await hashPassword(newSecret);
          await KV.put('secret_key_hash', newHash);

          return new Response(
            JSON.stringify({ success: true, message: 'Secret key updated' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
      }
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
