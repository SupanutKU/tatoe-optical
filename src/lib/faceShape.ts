import type { FaceMetrics } from './faceGeometry';
import type { Product } from '../types';

export type FaceShapeId = 'oval' | 'round' | 'square' | 'heart' | 'oblong';

export interface FaceShapeResult {
  shape: FaceShapeId;
  labelTh: string;
  labelEn: string;
  confidencePercent: number;
}

const FACE_SHAPE_LABELS: Record<FaceShapeId, { th: string; en: string }> = {
  oval: { th: 'รูปไข่ (Oval)', en: 'Oval' },
  round: { th: 'กลม (Round)', en: 'Round' },
  square: { th: 'เหลี่ยม (Square)', en: 'Square' },
  heart: { th: 'หัวใจ (Heart)', en: 'Heart' },
  oblong: { th: 'ยาว (Oblong)', en: 'Oblong' },
};

/**
 * Stylistic-only heuristic classifier — NOT a medical or clinical analysis.
 * Uses simple proportional ratios derived from face landmarks:
 *  - lengthToWidthRatio: how long vs. wide the face is
 *  - cheekToJawRatio: how much narrower the jaw is than the cheekbones
 *  - foreheadToJawRatio: how much wider the forehead is than the jaw
 */
export function classifyFaceShape(metrics: FaceMetrics): FaceShapeResult {
  const lengthToWidthRatio = metrics.faceHeightPx / Math.max(1, metrics.faceWidthPx);
  const cheekToJawRatio = metrics.faceWidthPx / Math.max(1, metrics.jawWidthPx);
  const foreheadToJawRatio = metrics.foreheadWidthPx / Math.max(1, metrics.jawWidthPx);

  let shape: FaceShapeId;
  let confidencePercent: number;

  if (lengthToWidthRatio > 1.55) {
    shape = 'oblong';
    confidencePercent = clampConfidence(78 + (lengthToWidthRatio - 1.55) * 40);
  } else if (foreheadToJawRatio > 1.18 && lengthToWidthRatio > 1.15) {
    shape = 'heart';
    confidencePercent = clampConfidence(76 + (foreheadToJawRatio - 1.18) * 60);
  } else if (cheekToJawRatio > 1.12 && lengthToWidthRatio < 1.3) {
    shape = 'round';
    confidencePercent = clampConfidence(75 + (cheekToJawRatio - 1.12) * 70);
  } else if (cheekToJawRatio < 1.06 && lengthToWidthRatio < 1.25) {
    shape = 'square';
    confidencePercent = clampConfidence(74 + (1.06 - cheekToJawRatio) * 90);
  } else {
    shape = 'oval';
    confidencePercent = clampConfidence(82 - Math.abs(lengthToWidthRatio - 1.35) * 30);
  }

  return {
    shape,
    labelTh: FACE_SHAPE_LABELS[shape].th,
    labelEn: FACE_SHAPE_LABELS[shape].en,
    confidencePercent,
  };
}

function clampConfidence(value: number): number {
  return Math.round(Math.max(70, Math.min(97, value)));
}

export interface FrameRecommendation {
  shape: Product['shape'];
  labelTh: string;
  matchPercent: number;
}

const FRAME_SHAPE_LABELS_TH: Record<Product['shape'], string> = {
  round: 'ทรงกลม (Round)',
  square: 'ทรงเหลี่ยม (Square)',
  drop: 'ทรงหยดน้ำ / Aviator',
  'cat-eye': 'ทรงแคทอาย (Cat-eye)',
};

// Classic styling guidance: which frame shapes tend to balance each face shape.
// Ordered best-fit first.
const RECOMMENDATION_MAP: Record<FaceShapeId, { shape: Product['shape']; score: number }[]> = {
  oval: [
    { shape: 'square', score: 94 },
    { shape: 'cat-eye', score: 90 },
    { shape: 'round', score: 84 },
  ],
  round: [
    { shape: 'square', score: 93 },
    { shape: 'cat-eye', score: 88 },
    { shape: 'drop', score: 82 },
  ],
  square: [
    { shape: 'round', score: 92 },
    { shape: 'cat-eye', score: 87 },
    { shape: 'drop', score: 81 },
  ],
  heart: [
    { shape: 'round', score: 91 },
    { shape: 'drop', score: 89 },
    { shape: 'cat-eye', score: 79 },
  ],
  oblong: [
    { shape: 'round', score: 90 },
    { shape: 'square', score: 86 },
    { shape: 'cat-eye', score: 80 },
  ],
};

export function getRecommendedFrameShapes(shape: FaceShapeId): FrameRecommendation[] {
  return RECOMMENDATION_MAP[shape].map((r) => ({
    shape: r.shape,
    labelTh: FRAME_SHAPE_LABELS_TH[r.shape],
    matchPercent: r.score,
  }));
}

/** Picks products from the catalog matching the recommended shapes, best matches first. */
export function recommendProducts(
  products: Product[],
  faceShapeResult: FaceShapeResult,
  limit = 6
): { product: Product; matchPercent: number }[] {
  const recs = getRecommendedFrameShapes(faceShapeResult.shape);
  const scoreByShape = new Map(recs.map((r) => [r.shape, r.matchPercent]));

  return products
    .filter((p) => scoreByShape.has(p.shape))
    .map((p) => ({ product: p, matchPercent: scoreByShape.get(p.shape) ?? 75 }))
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, limit);
}
