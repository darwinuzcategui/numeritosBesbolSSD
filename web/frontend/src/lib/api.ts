export const API_URL = 'http://localhost:3000';

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<{ status: number; data: T }> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data: data as T };
}

export async function me() {
  return api<{ id: number; username: string; role: 'admin' | 'capturador' }>('/auth/me');
}

export async function logout() {
  return api('/auth/logout', { method: 'POST' });
}
