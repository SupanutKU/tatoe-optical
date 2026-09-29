import type { Product } from '../types';
import { buildAuthHeaders, getApiBaseUrl, loadSession } from '../constants/api';

const base = () => `${getApiBaseUrl()}/api/products`;

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }
  return payload as T;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(base(), { headers: { Accept: 'application/json' } });
  const payload = await parseResponse<{ success: boolean; products: Product[] }>(response);
  return Array.isArray(payload.products) ? payload.products : [];
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const session = loadSession();
  const response = await fetch(base(), {
    method: 'POST',
    headers: buildAuthHeaders(session?.token),
    body: JSON.stringify(data),
  });
  const payload = await parseResponse<{ success: boolean; product: Product }>(response);
  return payload.product;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  const session = loadSession();
  const response = await fetch(`${base()}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: buildAuthHeaders(session?.token),
    body: JSON.stringify(data),
  });
  const payload = await parseResponse<{ success: boolean; product: Product }>(response);
  return payload.product;
}

export async function deleteProduct(id: string): Promise<void> {
  const session = loadSession();
  const response = await fetch(`${base()}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(session?.token),
  });
  await parseResponse<{ success: boolean }>(response);
}

/** Downloads an image and returns it as base64 (used to send product photos to the AI). */
export async function fetchImageViaBackend(src: string): Promise<{ mimeType: string; data: string }> {
  const r = await fetch(src);
  if (!r.ok) throw new Error(`โหลดรูปไม่สำเร็จ (${r.status})`);
  const blob = await r.blob();
  const dataUrl: string = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error('อ่านรูปไม่สำเร็จ'));
    fr.readAsDataURL(blob);
  });
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) throw new Error('แปลงรูปเป็น base64 ไม่สำเร็จ');
  return { mimeType: m[1], data: m[2] };
}
