'use server'

// 简单的哈希函数
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 获取 KV 命名空间
function getKV() {
  try {
    const { NEWTAB_KV } = process.env as unknown as {
      NEWTAB_KV: KVNamespace
    };
    
    if (!NEWTAB_KV) {
      throw new Error('KV namespace not available');
    }
    
    return NEWTAB_KV;
  } catch (error) {
    console.error('Failed to get KV context:', error);
    throw new Error('KV namespace not available');
  }
}

// 获取设置
export async function getSetting(key: string) {
  try {
    const KV = getKV();
    const value = await KV.get(key);

    return {
      key,
      value: value || '',
      exists: !!value,
    };
  } catch (error) {
    console.error('Get setting error:', error);
    throw error;
  }
}

// 验证密钥
export async function verifySecret(secret: string) {
  try {
    const KV = getKV();
    const storedHash = await KV.get('secret_key_hash');
    
    if (!storedHash) {
      // 没有设置过密钥
      return { verified: true, isFirstTime: true };
    }

    const inputHash = await hashPassword(secret);
    const verified = inputHash === storedHash;

    return { verified, isFirstTime: false };
  } catch (error) {
    console.error('Verify secret error:', error);
    throw error;
  }
}

// 设置密钥
export async function setSecret(newSecret: string, currentSecret?: string) {
  try {
    const KV = getKV();

    // 检查是否已存在密钥
    const existingHash = await KV.get('secret_key_hash');
    
    if (existingHash && currentSecret) {
      // 已存在密钥，需要验证
      const currentHash = await hashPassword(currentSecret);
      if (currentHash !== existingHash) {
        return { success: false, error: 'Invalid current secret key' };
      }
    }

    // 哈希新密钥
    const newHash = await hashPassword(newSecret);
    
    await KV.put('secret_key_hash', newHash);

    return { success: true, message: 'Secret key updated' };
  } catch (error) {
    console.error('Set secret error:', error);
    return { success: false, error: 'Failed to update secret key' };
  }
}

// 设置其他配置（如头像）
export async function setSetting(key: string, value: string) {
  try {
    const KV = getKV();
    await KV.put(key, value);

    return { success: true, message: 'Setting updated' };
  } catch (error) {
    console.error('Set setting error:', error);
    return { success: false, error: 'Failed to update setting' };
  }
}
