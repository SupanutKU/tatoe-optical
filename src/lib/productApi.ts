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
