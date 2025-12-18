const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

// Cloudflare Pages 本地开发环境支持
if (process.env.NODE_ENV === 'development') {
  const { setupDevPlatform } = await import('@cloudflare/next-on-pages/next-dev');
  
  // 配置本地开发平台绑定
  await setupDevPlatform({
    bindings: {
      DB: {
        type: 'd1',
        databaseName: 'newsletter-db',
        databaseId: 'local-dev-db',
      },
    },
    persist: {
      path: '.wrangler/state/v3',
    },
  });
}

export default nextConfig;
