/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    // D1 数据库
    DB: D1Database;
  }
}

export {};
