import type { NextApiRequest, NextApiResponse } from 'next';

// 这个 API 应该由 Cloudflare Cron Triggers 或外部定时任务调用
// 每天自动存档必应壁纸

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 验证请求来源（可选：添加密钥验证）
  const { authorization } = req.headers;
  const { CRON_SECRET } = process.env;
  
  if (CRON_SECRET && authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 调用存档 API
    const baseUrl = req.headers.host?.includes('localhost') 
      ? 'http://localhost:3000'
      : `https://${req.headers.host}`;
    
    const response = await fetch(`${baseUrl}/api/bing-wallpaper-archive`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to archive wallpapers');
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      message: 'Wallpapers archived successfully',
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to archive wallpapers',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
