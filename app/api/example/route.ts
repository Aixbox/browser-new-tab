import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

// 必须使用 Edge Runtime 才能访问 Cloudflare 绑定
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // 获取 Cloudflare 环境（包含 D1 和 R2 绑定）
    const { env } = getRequestContext();

    // 示例：查询 D1 数据库
    const dbResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM subscribers'
    ).first();

    // 示例：列出 R2 存储桶中的对象
    const r2List = await env.ASSETS.list({ limit: 10 });

    return Response.json({
      success: true,
      data: {
        subscriberCount: dbResult?.count || 0,
        assetsCount: r2List.objects.length,
        message: 'Successfully connected to D1 and R2!',
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
