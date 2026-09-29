import type { Product, VtoAssetAnalysis } from '../types';
import type { PreparedEyewearAsset } from './eyewearAsset';
import { analyzeVtoGlassesImageInBrowser, hasBrowserGeminiApiKey } from './geminiVtoClient';
import { analyzeFrameImage, setAiFrameAnchors, type FrameAnchors } from './virtualTryOnEngine';

const CACHE_VERSION = 'v1';
const inflight = new Set<string>();

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const centre = (r: { x: number; y: number; w: number; h: number }): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];

/** Turns the AI reading into engine anchors. Returns null when the reading is not trustworthy. */
export function analysisToAnchors(a: VtoAssetAnalysis, fallback: FrameAnchors): Omit<FrameAnchors, 'source'> | null {
  if (a.confidence < 0.45 || (a.frontFacing !== undefined && a.frontFacing < 0.25)) return null;
  const lenses = [centre(a.leftLens), centre(a.rightLens)].sort((p, q) => p[0] - q[0]);
  const span = lenses[1][0] - lenses[0][0];
  const level = Math.abs(lenses[0][1] - lenses[1][1]);
  const sized = a.leftLens.w > 0.08 && a.rightLens.w > 0.08 && a.leftLens.h > 0.08 && a.rightLens.h > 0.08;
  if (!sized || span < 0.25 || span > 0.85 || level > 0.35) return null;

  const lensV = (lenses[0][1] + lenses[1][1]) / 2;
  const temples = [a.leftTemple, a.rightTemple].sort((p, q) => p.x - q.x);
  const hingeOk = temples[0].x < 0.5 && temples[1].x > 0.5;
  const hv = (t: { y: number }, d: number) => clamp(t.y || d, 0.10, 0.60);
  return {
    bridgeV: Math.min(clamp(a.bridge.y || fallback.bridgeV, 0.15, 0.60), lensV - 0.02),
    lensV,
    lensL: lenses[0],
    lensR: lenses[1],
    hingeL: hingeOk ? [clamp(temples[0].x, 0, 0.2), hv(temples[0], fallback.hingeL[1])] : fallback.hingeL,
    hingeR: hingeOk ? [clamp(temples[1].x, 0.8, 1), hv(temples[1], fallback.hingeR[1])] : fallback.hingeR,
  };
}

/**
 * Asks the AI to locate lens centres / bridge / hinges on the real product photo (once per product,
 * cached in localStorage) and hands them to the renderer. The photo itself is never regenerated:
 * it is only measured, then drawn as-is on the face. On any failure the pixel-based anchors stay.
 */
export async function loadAiAnchors(asset: PreparedEyewearAsset, product: Product): Promise<PreparedEyewearAsset | null> {
  const key = `vto-ai:${CACHE_VERSION}:${product.id}:${asset.source}:${asset.width}x${asset.height}`;
  if (inflight.has(key)) return null;
  const fallback = analyzeFrameImage(asset.image);
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached) as VtoAssetAnalysis;
      const normalized = await normalizeAssetWithAi(asset, parsed);
      if (normalized) return normalized;
      const anchors = analysisToAnchors(parsed, fallback);
      if (anchors) setAiFrameAnchors(asset.image, anchors);
      return null;
    }
  } catch { /* storage unavailable: continue */ }
  if (!hasBrowserGeminiApiKey()) return null;

  inflight.add(key);
  try {
    const analysis = await analyzeVtoGlassesImageInBrowser(asset.dataUrl, product.name, product.colorName ?? '');
    try { localStorage.setItem(key, JSON.stringify(analysis)); } catch { /* ignore */ }
    const normalized = await normalizeAssetWithAi(asset, analysis);
    console.info('[VTO] AI analysis for', product.name, { confidence: analysis.confidence, frontFacing: analysis.frontFacing, normalized: !!normalized });
    if (normalized) return normalized;
    const anchors = analysisToAnchors(analysis, fallback);
    if (anchors) setAiFrameAnchors(asset.image, anchors);
  } catch (err) {
    console.warn('[VTO] AI anchor analysis failed, using image-based anchors:', err);
  } finally {
    inflight.delete(key);
  }
  return null;
}

type Pt = { x: number; y: number };

export interface NormalizationPlan {
  /** Rotate the photo by -tiltRad so both lens centres are level. */
  tiltRad: number;
  canvasW: number; canvasH: number;
  crop: { x: number; y: number; w: number; h: number };
  anchors: Omit<FrameAnchors, 'source'>;
}

/**
 * Catalog photos are often tilted and show the temple arms spread out. Both would be pasted onto the
 * face as-is. From the AI reading we (1) de-rotate the photo so the lenses are level and (2) crop to
 * the FRONT of the frame only, so arm pixels from the photo never float above the forehead.
 * Pure geometry (no canvas) so it can be unit-tested.
 */
export function planNormalization(a: VtoAssetAnalysis, W: number, H: number): NormalizationPlan | null {
  if (a.confidence < 0.45 || (a.frontFacing !== undefined && a.frontFacing < 0.25)) return null;
  const px = (p: Pt): Pt => ({ x: p.x * W, y: p.y * H });
  const lc = [centre(a.leftLens), centre(a.rightLens)].map(c => px({ x: c[0], y: c[1] })).sort((p, q) => p.x - q.x);
  const tilt = Math.atan2(lc[1].y - lc[0].y, lc[1].x - lc[0].x);
  if (!Number.isFinite(tilt) || Math.abs(tilt) > 0.62) return null; // > ~35 deg: reading not trustworthy
  const use = Math.abs(tilt) < 0.026 ? 0 : tilt; // < 1.5 deg: leave the photo alone

  const cs = Math.cos(-use), sn = Math.sin(-use);
  const canvasW = Math.ceil(Math.abs(W * Math.cos(use)) + Math.abs(H * Math.sin(use)));
  const canvasH = Math.ceil(Math.abs(W * Math.sin(use)) + Math.abs(H * Math.cos(use)));
  const rot = (p: Pt): Pt => {
    const dx = p.x - W / 2, dy = p.y - H / 2;
    return { x: canvasW / 2 + dx * cs - dy * sn, y: canvasH / 2 + dx * sn + dy * cs };
  };

  const rects = [a.bbox, a.leftLens, a.rightLens];
  const pts: Pt[] = [];
  for (const r of rects) for (const [cx, cy] of [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]]) pts.push(rot(px({ x: cx, y: cy })));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const m = 0.02 * Math.max(...xs) ;
  let x0 = Math.max(0, Math.min(...xs) - m), x1 = Math.min(canvasW, Math.max(...xs) + m);
  let y0 = Math.max(0, Math.min(...ys) - m), y1 = Math.min(canvasH, Math.max(...ys) + m);
  const crop = { x: Math.floor(x0), y: Math.floor(y0), w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0) };
  if (crop.w < 40 || crop.h < 20) return null;

  const uv = (p: Pt): [number, number] => { const r = rot(p); return [(r.x - crop.x) / crop.w, (r.y - crop.y) / crop.h]; };
  const L = uv(lc[0]), R = uv(lc[1]);
  const span = R[0] - L[0];
  if (span < 0.25 || span > 0.85) return null;
  const lensV = (L[1] + R[1]) / 2;
  const temples = [a.leftTemple, a.rightTemple].map(t => uv(px(t))).sort((p, q) => p[0] - q[0]);
  const bridge = uv(px(a.bridge));
  return {
    tiltRad: use, canvasW, canvasH, crop,
    anchors: {
      bridgeV: Math.min(clamp(bridge[1], 0.15, 0.60), lensV - 0.02),
      lensV, lensL: L, lensR: R,
      hingeL: [clamp(temples[0][0], 0, 0.12), clamp(temples[0][1], 0.10, 0.65)],
      hingeR: [clamp(temples[1][0], 0.88, 1), clamp(temples[1][1], 0.10, 0.65)],
    },
  };
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image-load-failed'));
    img.src = src;
  });
}

/** Applies the plan to the real product photo (rotate + crop only; pixels are never regenerated). */
async function renderNormalized(asset: PreparedEyewearAsset, plan: NormalizationPlan): Promise<PreparedEyewearAsset> {
  const src = asset.image;
  const W = src.naturalWidth || asset.width, H = src.naturalHeight || asset.height;
  const full = document.createElement('canvas');
  full.width = plan.canvasW; full.height = plan.canvasH;
  const fx = full.getContext('2d');
  if (!fx) throw new Error('no-canvas');
  fx.translate(plan.canvasW / 2, plan.canvasH / 2);
  fx.rotate(-plan.tiltRad);
  fx.drawImage(src, -W / 2, -H / 2, W, H);
  const out = document.createElement('canvas');
  out.width = plan.crop.w; out.height = plan.crop.h;
  const ox = out.getContext('2d');
  if (!ox) throw new Error('no-canvas');
  ox.drawImage(full, plan.crop.x, plan.crop.y, plan.crop.w, plan.crop.h, 0, 0, plan.crop.w, plan.crop.h);
  const dataUrl = out.toDataURL('image/png'); // throws on a tainted canvas -> caller keeps the original asset
  const image = await loadImg(dataUrl);
  return { source: asset.source, dataUrl, width: out.width, height: out.height, image };
}

/** Returns a de-rotated, front-only version of the asset (with AI anchors attached), or null. */
export async function normalizeAssetWithAi(asset: PreparedEyewearAsset, a: VtoAssetAnalysis): Promise<PreparedEyewearAsset | null> {
  const W = asset.image.naturalWidth || asset.width, H = asset.image.naturalHeight || asset.height;
  // Pixel-measured lens openings beat the AI's rough boxes for POSITION and TILT: an AI error of a few
  // percent in lens height would otherwise turn a perfectly level photo into a visibly tilted frame.
  const fa = analyzeFrameImage(asset.image);
  let reading = a;
  if (fa.holes) {
    const move = (r: VtoAssetAnalysis['leftLens'], c: [number, number]) => ({ x: c[0] - r.w / 2, y: c[1] - r.h / 2, w: r.w, h: r.h });
    const [hl, hr] = [fa.lensL, fa.lensR];
    const aiLeftIsLeft = centre(a.leftLens)[0] <= centre(a.rightLens)[0];
    reading = { ...a, leftLens: move(aiLeftIsLeft ? a.leftLens : a.rightLens, hl), rightLens: move(aiLeftIsLeft ? a.rightLens : a.leftLens, hr) };
  }
  const plan = planNormalization(reading, W, H);
  if (!plan) return null;
  try {
    const next = await renderNormalized(asset, plan);
    setAiFrameAnchors(next.image, plan.anchors);
    return next;
  } catch { return null; }
}
