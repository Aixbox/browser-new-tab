import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

// 必须使用 Edge Runtime 才能访问 Cloudflare 绑定
export const runtime = 'edge';

export async function GET(_request: NextRequest) {
  try {
    // 获取 Cloudflare 环境（包含 KV 绑定）
    const { env } = getRequestContext();

    // 示例：从 KV 读取数据
    const exampleValue = await env.NEWTAB_KV.get('example-key');

    return Response.json({
      success: true,
      data: {
        exampleValue: exampleValue || 'No value found',
        message: 'Successfully connected to KV!',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
