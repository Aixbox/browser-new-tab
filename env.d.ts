/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    // KV 命名空间
    NEWTAB_KV: KVNamespace;
  }
}

export {};
