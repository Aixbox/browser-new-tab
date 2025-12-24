// Pages Router API 调用函数

export async function getSetting(key: string) {
  const response = await fetch(`/api/settings?key=${encodeURIComponent(key)}`);
  if (!response.ok) {
    throw new Error('Failed to get setting');
  }
  return response.json();
}

export async function setSetting(key: string, value: string) {
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'setSetting', key, value }),
  });
  if (!response.ok) {
    throw new Error('Failed to set setting');
  }
  return response.json();
}

export async function verifySecret(secret: string) {
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verifySecret', secret }),
  });
  if (!response.ok) {
    throw new Error('Failed to verify secret');
  }
  return response.json();
}

export async function setSecret(newSecret: string, currentSecret?: string) {
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'setSecret', newSecret, currentSecret }),
  });
  if (!response.ok) {
    throw new Error('Failed to set secret');
  }
  return response.json();
}
