// Pages Router API 调用函数

export async function getSetting(key: string) {
  const response = await fetch(`/api/settings?key=${encodeURIComponent(key)}`);
  if (!response.ok) {
    throw new Error('Failed to get setting');
  }
  return response.json();
}

export async function setSetting(key: string, value: string) {
  // 从 localStorage 获取密钥
  const secret = localStorage.getItem('secret_key');
  
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'setSetting', key, value, secret }),
  });
  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to set setting');
  }
  return response.json();
}

// 侧边栏按钮相关 API
export async function getSidebarItems() {
  const response = await fetch('/api/settings?key=sidebar_items');
  if (!response.ok) {
    throw new Error('Failed to get sidebar items');
  }
  const data = await response.json() as { value?: string };
  return data.value ? JSON.parse(data.value) : null;
}

export async function saveSidebarItems(items: any[]) {
  const secret = localStorage.getItem('secret_key');
  
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: 'setSetting', 
      key: 'sidebar_items', 
      value: JSON.stringify(items),
      secret 
    }),
  });
  
  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message || 'Failed to save sidebar items');
  }
  return response.json();
}
