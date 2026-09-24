import { useMemo, useState } from 'react';
import { Product } from '../types';
import { classifyFaceShape, recommendProducts, type FaceShapeResult } from '../lib/faceShape';
import type { FaceMetrics } from '../lib/faceGeometry';

export interface UseGlassesOptions {
  products: Product[];
  initialProduct?: Product;
}

export interface UseGlassesResult {
  glasses: Product[];
  selected: Product;
  selectProduct: (product: Product) => void;
  overlaySrc: (product: Product) => string;
  faceShapeResult: FaceShapeResult | null;
  recommendations: { product: Product; matchPercent: number }[];
  analyzeFaceShape: (metrics: FaceMetrics) => void;
  clearRecommendation: () => void;
}

/** The image used for the AR overlay — a dedicated cutout if provided, else the primary product photo. */
export function overlayImageForProduct(product: Product): string {
  return product.overlayImage || product.images[0];
}

export function useGlasses({ products, initialProduct }: UseGlassesOptions): UseGlassesResult {
  const [selected, setSelected] = useState<Product>(initialProduct || products[0]);
  const [faceShapeResult, setFaceShapeResult] = useState<FaceShapeResult | null>(null);

  const recommendations = useMemo(() => {
    if (!faceShapeResult) return [];
    return recommendProducts(products, faceShapeResult);
  }, [faceShapeResult, products]);

  return {
    glasses: products,
    selected,
    selectProduct: setSelected,
    overlaySrc: overlayImageForProduct,
    faceShapeResult,
    recommendations,
    analyzeFaceShape: (metrics: FaceMetrics) => setFaceShapeResult(classifyFaceShape(metrics)),
    clearRecommendation: () => setFaceShapeResult(null),
  };
}
