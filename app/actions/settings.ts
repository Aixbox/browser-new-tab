'use server'

// 简单的哈希函数
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 获取设置
export async function getSetting(key: string) {
  try {
    const { DB } = process.env as unknown as { DB: D1Database };
    
    if (!DB) {
      throw new Error('Database not available');
    }

    const result = await DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind(key)
      .first();

    return {
      key,
      value: result?.value || '',
      exists: !!result?.value,
    };
  } catch (error) {
    console.error('Get setting error:', error);
    throw error;
  }
}

// 验证密钥
export async function verifySecret(secret: string) {
  try {
    const { DB } = process.env as unknown as { DB: D1Database };
    
    if (!DB) {
      throw new Error('Database not available');
    }

    const result = await DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind('secret_key_hash')
      .first();
    
    if (!result?.value) {
      // 没有设置过密钥
      return { verified: true, isFirstTime: true };
    }

    const inputHash = await hashPassword(secret);
    const verified = inputHash === result.value;

    return { verified, isFirstTime: false };
  } catch (error) {
    console.error('Verify secret error:', error);
    throw error;
  }
}

// 设置密钥
export async function setSecret(newSecret: string, currentSecret?: string) {
  try {
    const { DB } = process.env as unknown as { DB: D1Database };
    
    if (!DB) {
      throw new Error('Database not available');
    }

    // 检查是否已存在密钥
    const existingResult = await DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind('secret_key_hash')
      .first();
    
    if (existingResult?.value && currentSecret) {
      // 已存在密钥，需要验证
      const currentHash = await hashPassword(currentSecret);
      if (currentHash !== existingResult.value) {
        return { success: false, error: 'Invalid current secret key' };
      }
    }

    // 哈希新密钥
    const newHash = await hashPassword(newSecret);
    
    await DB.prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP'
    ).bind('secret_key_hash', newHash, newHash).run();

    return { success: true, message: 'Secret key updated' };
  } catch (error) {
    console.error('Set secret error:', error);
    return { success: false, error: 'Failed to update secret key' };
  }
}

// 设置其他配置（如头像）
export async function setSetting(key: string, value: string) {
  try {
    const { DB } = process.env as unknown as { DB: D1Database };
    
    if (!DB) {
      throw new Error('Database not available');
    }

    await DB.prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP'
    ).bind(key, value, value).run();

    return { success: true, message: 'Setting updated' };
  } catch (error) {
    console.error('Set setting error:', error);
    return { success: false, error: 'Failed to update setting' };
  }
}
