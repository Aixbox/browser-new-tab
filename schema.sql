-- Newsletter 订阅者表
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'unsubscribed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);

-- 示例：插入测试数据（可选）
-- INSERT INTO subscribers (email, name) VALUES ('test@example.com', 'Test User');
