-- 创建设置表
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- 插入默认设置
INSERT OR IGNORE INTO settings (key, value) VALUES ('secret_key_hash', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('avatar_url', '');
