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
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_CLOUDFLARE_DEV === 'true') {
  const { setupDevPlatform } = await import('@cloudflare/next-on-pages/next-dev');
  
  // 配置本地开发平台绑定
  await setupDevPlatform({
    bindings: {
      NEWTAB_KV: {
        type: 'kv',
        id: 'local-kv',
      },
    },
    persist: {
      path: '.wrangler/state/v3',
    },
  });
}

export default nextConfig;
