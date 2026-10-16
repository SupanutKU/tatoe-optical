import React from 'react';
import type { Product } from '../types';
import { ProductModelPreview } from './ProductModelPreview';

export function ProductVisual({ product, className = '' }: { product: Product; className?: string }) {
  if (product.model3d) return <div className="relative w-full h-full">
    <ProductModelPreview modelUrl={product.model3d} name={product.name} fallbackSrc={product.images?.[0]} />
    <span className="absolute bottom-1 right-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-on-primary pointer-events-none">3D</span>
  </div>;
  if (product.images?.[0]) return <img src={product.images[0]} alt={product.name} className={className} />;
  return <span className="text-xs text-on-surface-variant">ยังไม่มีรูปสินค้า</span>;
}
