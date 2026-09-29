/** Pure pixel helpers for the AI eyewear-model pipeline (no DOM, unit-testable). */

/** Removes a flat green (#00FF00-ish) studio background in place; returns the % of pixels removed. */
export function chromaKeyGreen(d: Uint8ClampedArray, w: number, h: number): number {
  let removed = 0;
  for (let i = 0; i < w * h; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    const greenness = g - Math.max(r, b);          // > 0 only for green-dominant pixels
    const key = Math.min(1, Math.max(0, (greenness - 35) / 70));
    if (key > 0) {
      d[i * 4 + 3] = Math.round(d[i * 4 + 3] * (1 - key));
      // despill: pull the green channel down to the other channels on edge pixels
      d[i * 4 + 1] = Math.min(g, Math.max(r, b) + 8);
      if (key > 0.5) removed++;
    }
  }
  return removed / (w * h);
}

/** Mean green-dominance of the four corner patches (is the background really flat green?). */
export function cornerGreenness(d: Uint8ClampedArray, w: number, h: number): number {
  const pts: [number, number][] = [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]];
  let s = 0;
  for (const [x, y] of pts) { const i = (y * w + x) * 4; s += d[i + 1] - Math.max(d[i], d[i + 2]); }
  return s / pts.length;
}

/** Tight alpha bounding box, or null if empty. */
export function alphaBounds(d: Uint8ClampedArray, w: number, h: number, thr = 40) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Left/right mirror overlap (IoU) of the alpha mask inside its bounds: ~1 for a straight-on symmetric front view. */
export function mirrorSymmetry(d: Uint8ClampedArray, w: number, h: number): number {
  const b = alphaBounds(d, w, h);
  if (!b) return 0;
  let inter = 0, uni = 0;
  for (let y = b.y; y < b.y + b.h; y++) for (let x = 0; x < b.w; x++) {
    const a = d[(y * w + b.x + x) * 4 + 3] > 40;
    const m = d[(y * w + b.x + (b.w - 1 - x)) * 4 + 3] > 40;
    if (a || m) uni++;
    if (a && m) inter++;
  }
  return uni ? inter / uni : 0;
}

export interface CleanModelVerdict { ok: boolean; reason?: string; symmetry: number; coverage: number; aspect: number }

/** Accepts an AI-produced cut-out only if it really looks like a straight-on pair of glasses. */
export function judgeCleanModel(d: Uint8ClampedArray, w: number, h: number): CleanModelVerdict {
  const b = alphaBounds(d, w, h);
  if (!b) return { ok: false, reason: 'empty', symmetry: 0, coverage: 0, aspect: 0 };
  let opaque = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 40) opaque++;
  const coverage = opaque / (b.w * b.h);
  const aspect = b.w / b.h;
  const symmetry = mirrorSymmetry(d, w, h);
  if (aspect < 1.25 || aspect > 4.8) return { ok: false, reason: 'aspect', symmetry, coverage, aspect };
  if (coverage < 0.04 || coverage > 0.85) return { ok: false, reason: 'coverage', symmetry, coverage, aspect };
  if (symmetry < 0.68) return { ok: false, reason: 'not-symmetric', symmetry, coverage, aspect };
  return { ok: true, symmetry, coverage, aspect };
}
