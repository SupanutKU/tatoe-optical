import type { Product } from '../types';

export const CATEGORY_LABELS: Record<string, string> = {
  prescription: 'แว่นสายตา', sunglasses: 'แว่นกันแดด', 'blue-light': 'กรองแสงสีฟ้า', sports: 'แว่นกีฬา',
};
export function stockQuantity(product: Product): number | null {
  if (product.stockStatus === 'out_of_stock') return 0;
  if (product.stockCount == null || !Number.isFinite(Number(product.stockCount))) return null;
  return Math.max(0, Math.floor(Number(product.stockCount)));
}
export function stockState(product: Product): 'out' | 'low' | 'ready' | 'unknown' {
  const quantity = stockQuantity(product);
  if (quantity === 0) return 'out';
  if (product.stockStatus === 'low_stock' || (quantity !== null && quantity <= 5)) return 'low';
  return quantity === null ? 'unknown' : 'ready';
}
export function summarizeCatalog(products: Product[]) {
  const categories: Record<string, number> = {};
  let units = 0, low = 0, out = 0, unknown = 0;
  for (const product of products) {
    const quantity = stockQuantity(product);
    units += quantity ?? 0;
    const state = stockState(product);
    if (state === 'low') low++;
    if (state === 'out') out++;
    if (quantity === null) unknown++;
    const label = CATEGORY_LABELS[product.category] ?? 'อื่น ๆ';
    categories[label] = (categories[label] ?? 0) + 1;
  }
  return { total: products.length, units, low, out, unknown, categories };
}
