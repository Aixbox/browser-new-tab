// 客户端图片缓存管理
class ImageCache {
  private cache: Map<string, string>;
  private maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.loadFromStorage();
  }

  // 从 localStorage 加载缓存
  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('image_cache');
      if (stored) {
        const data = JSON.parse(stored) as [string, string][];
        this.cache = new Map(data.slice(0, this.maxSize));
      }
    } catch (error) {
      console.error('Failed to load image cache:', error);
    }
  }

  // 保存到 localStorage
  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('image_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save image cache:', error);
    }
  }

  // 获取缓存的图片 URL
  get(url: string): string | undefined {
    return this.cache.get(url);
  }

  // 设置缓存
  set(url: string, cachedUrl: string) {
    // 如果超过最大容量，删除最早的条目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(url, cachedUrl);
    this.saveToStorage();
  }

  // 检查是否已缓存
  has(url: string): boolean {
    return this.cache.has(url);
  }

  // 清除缓存
  clear() {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('image_cache');
    }
  }

  // 预加载图片
  async preload(url: string): Promise<boolean> {
    if (this.has(url)) return true;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.set(url, url);
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  // 批量预加载
  async preloadBatch(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.preload(url));
    await Promise.allSettled(promises);
  }
}

// 单例实例
export const imageCache = new ImageCache();

// 预加载图片的 Hook
export const useImagePreload = (urls: string[]) => {
  if (typeof window !== 'undefined') {
    imageCache.preloadBatch(urls);
  }
};
