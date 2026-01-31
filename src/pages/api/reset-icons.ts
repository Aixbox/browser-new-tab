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
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { secret } = body;

    // 验证密钥
    if (!verifySecret(secret)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: '密钥验证失败' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const KV = getKV();

    // 删除图标相关的 KV 数据
    await KV.delete('icon_items');
    await KV.delete('page_grid_items');
    
    console.log('✅ 已清除 KV 中的图标数据');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '图标数据已重置，请刷新页面' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Reset icons API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
