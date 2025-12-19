import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const engine = searchParams.get('engine') || 'google';

  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const suggestions = await getOnlineSuggestions(query, engine);

    return NextResponse.json(suggestions, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 缓存5分钟
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    return NextResponse.json([]);
  }
}

// 获取在线建议
async function getOnlineSuggestions(query: string, engine: string): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

  try {
    let url = '';
    switch (engine) {
      case 'google':
        url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
        break;
      case 'bing':
        url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`;
        break;
      default:
        url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Google 和 Bing 的响应格式不同
    if (Array.isArray(data) && data.length > 1) {
      return data[1] || [];
    } else if (data.suggestions) {
      return data.suggestions.map((s: any) => s.displayText || s);
    }
    
    return [];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}





export const runtime = 'edge';