/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

// Cloudflare Pages 本地开发环境支持（对齐 UptimeFlare 方式）
if (process.env.NODE_ENV === 'development') {
  const { setupDevBindings } = await import('@cloudflare/next-on-pages/next-dev');
  
  setupDevBindings({
    bindings: {
      NEWTAB_KV: {
        type: 'kv',
        id: 'NEWTAB_KV',
      },
    },
  });
}

export default nextConfig;
