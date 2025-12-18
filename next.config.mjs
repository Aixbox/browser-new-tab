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
  
  // 直接配置本地开发绑定，不需要 wrangler.toml
  await setupDevPlatform({
    bindings: {
      DB: {
        type: 'd1',
        databaseName: 'newsletter-db',
        databaseId: 'local-dev-db',
      },
      ASSETS: {
        type: 'r2',
        bucketName: 'newsletter-assets',
      },
    },
  });
}

export default nextConfig;
