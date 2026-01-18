import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const engine = searchParams.get('engine') || 'google';

  if (!query || query.trim().length < 2) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const suggestions = await getOnlineSuggestions(query, engine);

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function getOnlineSuggestions(query: string, engine: string): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

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
