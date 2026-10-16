import { drawSeamlessTexture } from './projectiveTexture';
import { cleanLensInteriors } from './lensCleanup';
import type { FaceMetrics, Point2D } from './faceGeometry';

export interface GlassesTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDeg: number;
  perspectiveScaleX: number;
  perspectiveScaleY: number;
  opacity: number;
  quad: [Point2D, Point2D, Point2D, Point2D];
  /** Screen positions of the two frame hinges (index 0 = screen-left). Projected with the SAME pose as the quad, so frame and arms are one rigid object. */
  hinges: [Point2D, Point2D];
  /** Effective (gain-adjusted) pose in radians, for arm foreshortening. */
  yawRad: number;
  pitchRad: number;
  rollRad: number;
}

export interface VirtualTryOnEngineInput {
  metrics: FaceMetrics;
  glassesNaturalWidth: number;
  glassesNaturalHeight: number;
  fitMultiplier?: number;
  verticalOffsetRatio?: number;
  maxHeightToEyeDistanceRatio?: number;
  /** The prepared frame image: analysed once (cached) to find its real bridge / hinge / lens positions. */
  image?: CanvasImageSource;
}

/**
 * Creates a perspective-aware destination quadrilateral from the 3D pose.
 * It is a pinhole-style approximation: the PNG remains 2D, but its four
 * corners are projected as if the frame were a thin object in 3D.
 */
export interface FrameAnchors {
  /** v (0..1 of image height) of the bridge bar between the lenses. */
  bridgeV: number;
  /** v of the lens centres (where the pupils should sit). */
  lensV: number;
  /** [u, v] of the left / right outer hinge (end-piece) in image space. */
  hingeL: [number, number];
  hingeR: [number, number];
  /** [u, v] of the optical centre of each lens (screen-left / screen-right of the product photo).
   *  These are what get pinned to the wearer's pupils. */
  lensL: [number, number];
  lensR: [number, number];
  source: 'default' | 'alpha' | 'ai';
  /** true when lensL/lensR are real lens openings measured from the alpha mask (pixel-accurate). */
  holes?: boolean;
}
const DEFAULT_ANCHORS: FrameAnchors = {
  bridgeV: 0.40, lensV: 0.50, hingeL: [0.03, 0.30], hingeR: [0.97, 0.30],
  lensL: [0.27, 0.50], lensR: [0.73, 0.50], source: 'default',
};
const anchorCache = new WeakMap<object, FrameAnchors>();
const aiAnchorCache = new WeakMap<object, FrameAnchors>();

/** AI (Gemini) reading of the product photo. Takes priority over the pixel heuristics below. */
export function setAiFrameAnchors(image: object, a: Omit<FrameAnchors, 'source'>): void {
  aiAnchorCache.set(image, { ...a, source: 'ai' });
}
export function hasAiFrameAnchors(image: object | undefined): boolean {
  return !!image && aiAnchorCache.has(image);
}

/** Centroids of the two biggest transparent "holes" (lens openings) fully enclosed by the frame. */
function findLensHoles(on: (x: number, y: number) => boolean, w: number, h: number, minX: number, maxX: number, boxesOut?: { x0: number; x1: number; y0: number; y1: number }[]): [number, number][] | null {
  const seen = new Uint8Array(w * h);
  const comps: { n: number; sx: number; sy: number; touches: boolean; x0: number; x1: number; y0: number; y1: number }[] = [];
  for (let y0 = 0; y0 < h; y0++) for (let x0 = 0; x0 < w; x0++) {
    if (seen[y0 * w + x0] || on(x0, y0)) continue;
    const st = [[x0, y0]]; seen[y0 * w + x0] = 1;
    const c = { n: 0, sx: 0, sy: 0, touches: false, x0: w, x1: 0, y0: h, y1: 0 };
    while (st.length) {
      const [x, y] = st.pop()!;
      c.n++; c.sx += x; c.sy += y; c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y);
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) c.touches = true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[ny * w + nx] || on(nx, ny)) continue;
        seen[ny * w + nx] = 1; st.push([nx, ny]);
      }
    }
    comps.push(c);
  }
  const bw = maxX - minX + 1;
  const top2 = comps.filter(c => !c.touches && c.n > w * h * 0.004).sort((a, b) => b.n - a.n).slice(0, 2)
    .map(c => ({ ...c, cx: c.sx / c.n / w, cy: c.sy / c.n / h })).sort((a, b) => a.cx - b.cx);
  const holes = top2.map(c => [c.cx, c.cy] as [number, number]);
  if (holes.length !== 2) return null;
  const span = holes[1][0] - holes[0][0];
  // sanity: two lenses, roughly level, roughly symmetric inside the frame
  if (span < 0.25 || span > 0.85 || Math.abs(holes[0][1] - holes[1][1]) > 0.5) return null;
  const mid = (holes[0][0] + holes[1][0]) / 2;
  if (Math.abs(mid - (minX + bw / 2) / w) > 0.12) return null;
  if (boxesOut) top2.forEach(c => boxesOut.push({ x0: c.x0 / w, x1: (c.x1 + 1) / w, y0: c.y0 / h, y1: (c.y1 + 1) / h }));
  return holes;
}

/**
 * Computer-vision pass over the frame's alpha mask (runs once per image): finds where
 * the bridge, the lens centres and the outer hinge corners really are, instead of
 * assuming fixed fractions. Fixes frames whose PNG has empty margins / tall aspect where
 * a fixed "30% from the top" hinge landed on the eyebrow.
 */
export function analyzeFrameImage(image: CanvasImageSource | undefined): FrameAnchors {
  if (!image) return DEFAULT_ANCHORS;
  const key = image as unknown as object;
  const ai = aiAnchorCache.get(key);
  if (ai) return ai;
  const cached = anchorCache.get(key);
  if (cached) return cached;
  let out = DEFAULT_ANCHORS;
  try {
    const sw = (image as HTMLImageElement).naturalWidth || (image as HTMLCanvasElement).width;
    const sh = (image as HTMLImageElement).naturalHeight || (image as HTMLCanvasElement).height;
    if (sw && sh && typeof document !== 'undefined') {
      const w = 120, h = Math.max(12, Math.round(w * sh / sw));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const cx = c.getContext('2d', { willReadFrequently: true });
      if (cx) {
        cx.drawImage(image, 0, 0, w, h);
        const d = cx.getImageData(0, 0, w, h).data;
        const on = (x: number, y: number) => d[(y * w + x) * 4 + 3] > 110;
        let minX = w, maxX = -1, opaque = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) { opaque++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
        // A fully opaque picture means the background was NOT removed: geometry cannot be read from alpha.
        if (opaque > 40 && opaque < w * h * 0.97 && maxX - minX > w * 0.4) {
          const bw = maxX - minX + 1;
          const ys = (x0: number, x1: number, pick: (a: number[]) => number) => {
            const arr: number[] = [];
            for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(w - 1, Math.ceil(x1)); x++)
              for (let y = 0; y < h; y++) if (on(x, y)) arr.push(y);
            return arr.length ? pick(arr.sort((p, q) => p - q)) / h : null;
          };
          const mean = (a: number[]) => a.reduce((p, q) => p + q, 0) / a.length;
          const cxm = (minX + maxX) / 2;
          // upper third of the centre strip = the bridge bar (rim tangents below it are ignored)
          const bridgeV = ys(cxm - bw * 0.025, cxm + bw * 0.025, a => a[Math.floor(a.length * 0.15)]);
          const lensV = (() => {
            const l = ys(minX + bw * 0.20, minX + bw * 0.30, mean);
            const r = ys(maxX - bw * 0.30, maxX - bw * 0.20, mean);
            return l !== null && r !== null ? (l + r) / 2 : null;
          })();
          // hinge = upper-middle of the outermost 6% of each side
          const hl = ys(minX, minX + bw * 0.06, a => a[Math.floor(a.length * 0.35)]);
          const hr = ys(maxX - bw * 0.06, maxX, a => a[Math.floor(a.length * 0.35)]);
          const cl = (v: number | null, lo: number, hi: number, dflt: number) => (v === null ? dflt : Math.min(hi, Math.max(lo, v)));
          const lv = cl(lensV, 0.30, 0.70, 0.50);
          const bv = Math.min(cl(bridgeV, 0.15, 0.60, 0.40), lv - 0.02); // the bridge sits above the lens centre
          const holes = findLensHoles(on, w, h, minX, maxX);
          const lensL: [number, number] = holes ? holes[0] : [(minX + bw * 0.26) / w, lv];
          const lensR: [number, number] = holes ? holes[1] : [(minX + bw * 0.74) / w, lv];
          out = {
            bridgeV: bv,
            lensV: holes ? (holes[0][1] + holes[1][1]) / 2 : lv,
            hingeL: [(minX + 1) / w, cl(hl, 0.10, 0.60, 0.30)],
            hingeR: [(maxX) / w, cl(hr, 0.10, 0.60, 0.30)],
            lensL, lensR, source: 'alpha', holes: !!holes,
          };
        }
      }
    }
  } catch { /* tainted canvas (CORS): use defaults */ }
  anchorCache.set(key, out);
  return out;
}

const frontCache = new WeakMap<object, CanvasImageSource>();
/**
 * Catalog photos often keep pieces of the temple arms (thin lines beside / above the frame). On a face those float
 * over the forehead. Two steps, both on the real pixels (nothing is regenerated):
 *  1. Connected-component filter: keep the main frame body; delete opaque fragments that are disconnected from it
 *     and sit outside its bounding box (floating arm remnants).
 *  2. When both lens openings can be measured, also clip to the frame FRONT (lens boxes + margin).
 * Falls back to the original image when the alpha mask cannot be read.
 */
export function frontOnlyImage(image: CanvasImageSource): CanvasImageSource {
  const key = image as unknown as object;
  const hit = frontCache.get(key);
  if (hit) return hit;
  let out: CanvasImageSource = image;
  try {
    const sw = (image as HTMLImageElement).naturalWidth || (image as HTMLCanvasElement).width;
    const sh = (image as HTMLImageElement).naturalHeight || (image as HTMLCanvasElement).height;
    if (sw && sh && typeof document !== 'undefined') {
      const w = 160, h = Math.max(12, Math.round(w * sh / sw));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const cx = c.getContext('2d', { willReadFrequently: true });
      if (cx) {
        cx.drawImage(image, 0, 0, w, h);
        const d = cx.getImageData(0, 0, w, h).data;
        const on = (x: number, y: number) => d[(y * w + x) * 4 + 3] > 60;
        let minX = w, maxX = -1, opaque = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) { opaque++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
        if (opaque > 40 && opaque < w * h * 0.97) {
          // ---- 1) connected components (8-neighbour) of the opaque pixels ----
          const label = new Int32Array(w * h).fill(-1);
          const comps: { n: number; x0: number; x1: number; y0: number; y1: number }[] = [];
          for (let y0 = 0; y0 < h; y0++) for (let x0 = 0; x0 < w; x0++) {
            if (label[y0 * w + x0] >= 0 || !on(x0, y0)) continue;
            const id = comps.length, comp = { n: 0, x0: w, x1: 0, y0: h, y1: 0 };
            const st = [y0 * w + x0]; label[y0 * w + x0] = id;
            while (st.length) {
              const i = st.pop()!, x = i % w, y = (i - x) / w;
              comp.n++; comp.x0 = Math.min(comp.x0, x); comp.x1 = Math.max(comp.x1, x); comp.y0 = Math.min(comp.y0, y); comp.y1 = Math.max(comp.y1, y);
              for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                const j = ny * w + nx;
                if (label[j] >= 0 || !on(nx, ny)) continue;
                label[j] = id; st.push(j);
              }
            }
            comps.push(comp);
          }
          let main = 0;
          comps.forEach((k, i) => { if (k.n > comps[main].n) main = i; });
          const m = comps[main], mx = w * 0.04, my = h * 0.04;
          const drop = comps.map((k, i) => i !== main && !(k.n >= 3 && k.x0 >= m.x0 - mx && k.x1 <= m.x1 + mx && k.y0 >= m.y0 - my && k.y1 <= m.y1 + my));
          const anyDrop = drop.some(Boolean);

          // ---- 2) lens openings -> front-only clip rectangle ----
          let rect: { u0: number; v0: number; u1: number; v1: number } | null = null;
          const boxes: { x0: number; x1: number; y0: number; y1: number }[] = [];
          if (findLensHoles(on, w, h, minX, maxX, boxes) && boxes.length === 2) {
            const lw = (boxes[0].x1 - boxes[0].x0 + boxes[1].x1 - boxes[1].x0) / 2;
            const lh = (boxes[0].y1 - boxes[0].y0 + boxes[1].y1 - boxes[1].y0) / 2;
            rect = {
              u0: Math.max(0, boxes[0].x0 - lw * 0.32), u1: Math.min(1, boxes[1].x1 + lw * 0.32),
              v0: Math.max(0, Math.min(boxes[0].y0, boxes[1].y0) - lh * 0.30), v1: Math.min(1, Math.max(boxes[0].y1, boxes[1].y1) + lh * 0.30),
            };
          }

          if (anyDrop || rect) {
            const oc = document.createElement('canvas'); oc.width = sw; oc.height = sh;
            const ox = oc.getContext('2d');
            if (ox) {
              if (rect) ox.drawImage(image, rect.u0 * sw, rect.v0 * sh, (rect.u1 - rect.u0) * sw, (rect.v1 - rect.v0) * sh, rect.u0 * sw, rect.v0 * sh, (rect.u1 - rect.u0) * sw, (rect.v1 - rect.v0) * sh);
              else ox.drawImage(image, 0, 0);
              if (anyDrop) {
                // erase dropped fragments (dilated 2px at mask scale so no fringe is left behind)
                const mc = document.createElement('canvas'); mc.width = w; mc.height = h;
                const mx2 = mc.getContext('2d');
                if (mx2) {
                  const md = mx2.createImageData(w, h);
                  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                    if (!on(x, y)) continue;
                    const id = label[y * w + x];
                    if (id < 0 || !drop[id]) continue;
                    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                      const nx = x + dx, ny = y + dy;
                      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                      md.data[(ny * w + nx) * 4 + 3] = 255;
                    }
                  }
                  mx2.putImageData(md, 0, 0);
                  ox.globalCompositeOperation = 'destination-out';
                  ox.imageSmoothingEnabled = true;
                  ox.drawImage(mc, 0, 0, sw, sh);
                  ox.globalCompositeOperation = 'source-over';
                }
              }
              out = oc;
            }
          }
        }
      }
    }
  } catch { /* tainted canvas (CORS): draw the original */ }
  // Clean the final front image, including arms attached to the rim inside lenses.
  // Copy first: asset dimensions and all existing anchors remain unchanged.
  try {
    const sw = (out as HTMLImageElement).naturalWidth || (out as HTMLCanvasElement).width;
    const sh = (out as HTMLImageElement).naturalHeight || (out as HTMLCanvasElement).height;
    const clean = document.createElement('canvas'); clean.width = sw; clean.height = sh;
    clean.getContext('2d')?.drawImage(out, 0, 0);
    if (cleanLensInteriors(clean)) out = clean;
  } catch { /* CORS: retain the readable/renderable original. */ }
  frontCache.set(key, out);
  return out;
}

const symCache = new WeakMap<object, { tilt: number; score: number } | null>();
/**
 * Photo tilt WITHOUT AI or lens holes: a front view of glasses is mirror-symmetric, so the rotation that makes the
 * frame's alpha mask most left/right symmetric (IoU with its own mirror) is the photo's tilt. Same sign convention
 * as the lens-line angle used in computeGlassesTransform (positive = right side lower on screen).
 * score = IoU at the best angle (0..1); callers only trust it when it is high.
 */
export function symmetryTilt(image: CanvasImageSource | undefined): { tilt: number; score: number } | null {
  if (!image) return null;
  const key = image as unknown as object;
  if (symCache.has(key)) return symCache.get(key)!;
  let out: { tilt: number; score: number } | null = null;
  try {
    const src = frontOnlyImage(image);
    const sw = (src as HTMLImageElement).naturalWidth || (src as HTMLCanvasElement).width;
    const sh = (src as HTMLImageElement).naturalHeight || (src as HTMLCanvasElement).height;
    if (sw && sh && typeof document !== 'undefined') {
      const w = 128, h = Math.max(12, Math.round(w * sh / sw));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const cx = c.getContext('2d', { willReadFrequently: true });
      if (cx) {
        cx.drawImage(src, 0, 0, w, h);
        const d = cx.getImageData(0, 0, w, h).data;
        const xs: number[] = [], ys: number[] = [];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 110) { xs.push(x); ys.push(y); }
        const n = xs.length;
        if (n > 60 && n < w * h * 0.9) {
          const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
          const R = Math.ceil(Math.hypot(w, h)) + 2, G = 2 * R + 1;
          const grid = new Uint8Array(G * G);
          const iou = (theta: number) => {
            grid.fill(0);
            const ct = Math.cos(theta), st = Math.sin(theta);
            const px: number[] = [], py: number[] = [];
            for (let i = 0; i < n; i++) {
              const dx = xs[i] - mx, dy = ys[i] - my;
              // rotate by -theta (levels a photo whose lens line has angle theta)
              const rx = Math.round(dx * ct + dy * st), ry = Math.round(-dx * st + dy * ct);
              px.push(rx); py.push(ry);
              grid[(ry + R) * G + (rx + R)] = 1;
            }
            let inter = 0, cnt = 0;
            const seen = new Set<number>();
            for (let i = 0; i < n; i++) {
              const k = (py[i] + R) * G + (px[i] + R);
              if (seen.has(k)) continue; seen.add(k); cnt++;
              if (grid[(py[i] + R) * G + (-px[i] + R)]) inter++;
            }
            return inter / Math.max(1, 2 * cnt - inter);
          };
          let best = 0, bestS = -1;
          for (let deg = -30; deg <= 30; deg += 1) { const sc = iou(deg * Math.PI / 180); if (sc > bestS) { bestS = sc; best = deg; } }
          let fine = best, fineS = bestS;
          for (let deg = best - 1; deg <= best + 1; deg += 0.25) { const sc = iou(deg * Math.PI / 180); if (sc > fineS) { fineS = sc; fine = deg; } }
          out = { tilt: fine * Math.PI / 180, score: fineS };
          if (typeof console !== 'undefined') console.info('[VTO] product photo tilt (symmetry)', fine.toFixed(2) + '°', 'score', fineS.toFixed(2));
        }
      }
    }
  } catch { /* tainted canvas: no estimate */ }
  symCache.set(key, out);
  return out;
}

/** Pose gains (the 2D image is a flat cut-out, so we deliberately under-rotate a little). */
const YAW_GAIN = 0.9;
const PITCH_GAIN = 0.75;
const PERSPECTIVE_FOCAL = 3.0; // camera distance in frame widths

export function computeGlassesTransform({
  metrics,
  glassesNaturalWidth,
  glassesNaturalHeight,
  fitMultiplier = 2.12,
  verticalOffsetRatio = 0.16,
  maxHeightToEyeDistanceRatio = 1.9,
  image,
}: VirtualTryOnEngineInput): GlassesTransform {
  const finite = (v: number | undefined, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const aspect = glassesNaturalHeight / Math.max(1, glassesNaturalWidth);
  const eyeDist = Math.max(1, finite(metrics.eyeDistancePx, 1));
  const fa = image && hasAiFrameAnchors(image as object)
    ? analyzeFrameImage(image)
    : analyzeFrameImage(image ? frontOnlyImage(image) : image);

  // ---- LENS-CENTRE FIT ----
  // The two lens centres of the PRODUCT PHOTO (read by AI, or from the alpha mask) are pinned to the
  // wearer's two pupils. That fixes the scale (pupil distance / lens-centre span) and the position
  // in one step, so the real product image lands on the eyes instead of relying on a face-width guess.
  const ldx = (fa.lensR[0] - fa.lensL[0]) * glassesNaturalWidth;
  const ldy = (fa.lensR[1] - fa.lensL[1]) * glassesNaturalHeight;
  let tau0 = Math.atan2(ldy, ldx);
  // Symmetry check works with no AI key and when lens holes could not be measured (default anchors => tau0 = 0,
  // so a tilted catalog photo would otherwise be pasted tilted). Trust it only when the mask is clearly symmetric.
  const sym = symmetryTilt(image);
  if (sym && sym.score > 0.50) {
    const lensLineKnown = fa.source === 'ai' || fa.holes === true;
    if (!lensLineKnown || Math.abs(sym.tilt - tau0) > 0.05) tau0 = sym.tilt;
  }
  // Photo tilt (lens line not level in the picture): counter-rotate the picture so the LENSES are level.
  const tau = Math.abs(tau0) > 0.02 && Math.abs(tau0) < 0.62 ? tau0 : 0;
  const ct = Math.cos(tau), st = Math.sin(tau);
  const lensSpanU = Math.max(0.2, Math.hypot(ldx, ldy) / Math.max(1, glassesNaturalWidth));
  const ou = (fa.lensL[0] + fa.lensR[0]) / 2;
  const ov = (fa.lensL[1] + fa.lensR[1]) / 2;
  const legacyWidth = finite(metrics.frameWidthPx) > 0 ? finite(metrics.frameWidthPx) : eyeDist * 2.12;
  const pd = finite(metrics.pdPx3D) > 0 ? finite(metrics.pdPx3D) : eyeDist;
  const fitWidth = pd / lensSpanU;
  // Trust the lens geometry only inside a sane band around the face-width estimate (bad crops / bad detections).
  let width = fa.source === 'default' ? legacyWidth : clampN(fitWidth, legacyWidth * 0.7, legacyWidth * 1.35);
  width = Math.max(40, width * (fitMultiplier / 2.12));
  let height = width * aspect;
  const maxHeight = eyeDist * maxHeightToEyeDistanceRatio;
  if (height > maxHeight) { const sc = maxHeight / height; width *= sc; height *= sc; }

  // ---- POSE (radians). Baseline-free values from the landmark cloud / transformation matrix. ----
  const yaw = clampN(finite(metrics.yawRad, finite(metrics.yawRatio) * 0.78), -0.9, 0.9) * YAW_GAIN;
  const pitch = clampN(finite(metrics.pitchRad, finite(metrics.pitchRatio) * 0.56), -0.7, 0.7) * PITCH_GAIN;
  // Roll: average of the outer-canthus roll and the pupil-line roll (paired by SCREEN x, so mirroring
  // cannot flip it). A single noisy landmark group can no longer tilt the frame 20-30 degrees.
  const eyesByX = [metrics.leftEye, metrics.rightEye].sort((p, q) => p.x - q.x);
  const irisRoll = Math.atan2(eyesByX[1].y - eyesByX[0].y, eyesByX[1].x - eyesByX[0].x);
  const metricRoll = finite(metrics.rollDeg) * Math.PI / 180;
  const roll = clampN(Number.isFinite(irisRoll) ? (irisRoll + metricRoll) / 2 : metricRoll, -0.7, 0.7);

  // ---- ANCHOR: lens-centre midpoint of the photo -> pupil midpoint ----
  // Horizontal: mostly the pupil midpoint, nudged toward the nose-bridge landmark so the frame's bridge
  // (its centre) rests on the nose instead of following the pupils when the head is slightly turned.
  const bridgeX = metrics.bridge && Number.isFinite(metrics.bridge.x) ? metrics.bridge.x : metrics.eyeCenter.x;
  const anchorX = metrics.eyeCenter.x + clampN(bridgeX - metrics.eyeCenter.x, -0.12 * eyeDist, 0.12 * eyeDist) * 0.35;
  const anchorY = metrics.eyeCenter.y + (verticalOffsetRatio - 0.16) * eyeDist;

  // ---- ONE rigid 3D pose applied to EVERYTHING (frame corners + hinges) ----
  // Local frame: origin = lens-centre midpoint, x right, y down, z away from the camera.
  const cyaw = Math.cos(yaw), syaw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cr = Math.cos(roll), sr = Math.sin(roll);
  const focal = Math.max(width * PERSPECTIVE_FOCAL, 1);
  const project = (lx0: number, ly0: number, lz = 0): Point2D => {
    const lx = lx0 * ct + ly0 * st, ly = -lx0 * st + ly0 * ct; // level the photo's lens line
    const x1 = lx * cyaw - lz * syaw;
    const z1 = lx * syaw + lz * cyaw;
    const y2 = ly * cp - z1 * sp;
    const z2 = ly * sp + z1 * cp;
    const persp = 1 / clampN(1 + z2 / focal, 0.5, 2);
    const x = x1 * persp, y = y2 * persp;
    return { x: anchorX + x * cr - y * sr, y: anchorY + x * sr + y * cr };
  };

  const left = -ou * width, right = (1 - ou) * width;
  const top = -ov * height;
  const bottom = (1 - ov) * height;
  let quad: [Point2D, Point2D, Point2D, Point2D] = [
    project(left, top), project(right, top), project(right, bottom), project(left, bottom),
  ];
  const hingeLocal = (uv: [number, number]) => project((uv[0] - ou) * width, (uv[1] - ov) * height);
  let hinges: [Point2D, Point2D] = [hingeLocal(fa.hingeL), hingeLocal(fa.hingeR)];

  // Safety net: any non-finite corner => plain rotated rectangle (frame + hinges together).
  if (![...quad, ...hinges].every(q => Number.isFinite(q.x) && Number.isFinite(q.y))) {
    const flat = (lx0: number, ly0: number): Point2D => { const lx = lx0 * ct + ly0 * st, ly = -lx0 * st + ly0 * ct; return { x: anchorX + lx * cr - ly * sr, y: anchorY + lx * sr + ly * cr }; };
    quad = [flat(left, top), flat(right, top), flat(right, bottom), flat(left, bottom)];
    hinges = [flat((fa.hingeL[0] - ou) * width, (fa.hingeL[1] - ov) * height), flat((fa.hingeR[0] - ou) * width, (fa.hingeR[1] - ov) * height)];
  }

  return {
    x: anchorX, y: anchorY, width, height,
    rotationDeg: roll * 180 / Math.PI,
    perspectiveScaleX: cyaw, perspectiveScaleY: cp,
    opacity: 1, quad, hinges,
    yawRad: yaw, pitchRad: pitch, rollRad: roll,
  };
}

type DrawImage = CanvasImageSource;

function affineTriangle(
  ctx: CanvasRenderingContext2D,
  image: DrawImage,
  sx0: number, sy0: number,
  sx1: number, sy1: number,
  sx2: number, sy2: number,
  dx0: number, dy0: number,
  dx1: number, dy1: number,
  dx2: number, dy2: number,
) {
  const denom =
    sx0 * (sy1 - sy2) +
    sx1 * (sy2 - sy0) +
    sx2 * (sy0 - sy1);
  if (Math.abs(denom) < 1e-6) return;

  // Affine matrix maps the source triangle to the destination triangle.
  const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / denom;
  const b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / denom;
  const c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / denom;
  const d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / denom;
  const e = dx0 - a * sx0 - c * sy0;
  const f = dy0 - b * sx0 - d * sy0;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dx0, dy0);
  ctx.lineTo(dx1, dy1);
  ctx.lineTo(dx2, dy2);
  ctx.closePath();
  ctx.clip();
  // IMPORTANT: multiply onto the current transform (which already holds the
  // canvas DPR scale and any translate). Using ctx.setTransform() here would
  // REPLACE it, so on displays with devicePixelRatio != 1 (e.g. Windows 125%)
  // the clip triangle (DPR space) and the image (raw canvas px) no longer
  // overlap and the whole front frame disappears.
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

function drawProjectiveImage(
  ctx: CanvasRenderingContext2D,
  image: DrawImage,
  quad: [Point2D, Point2D, Point2D, Point2D],
  subdivisions = 8
) {
  const sw = (image as HTMLImageElement).naturalWidth || (image as HTMLCanvasElement).width;
  const sh = (image as HTMLImageElement).naturalHeight || (image as HTMLCanvasElement).height;
  if (!sw || !sh) return;

  // Bilinear grid -> two affine triangles per cell. At 8x8 this is visually
  // smooth while remaining cheap enough for a 60 FPS canvas.
  const grid: Point2D[][] = [];
  for (let j = 0; j <= subdivisions; j++) {
    const v = j / subdivisions;
    const row: Point2D[] = [];
    for (let i = 0; i <= subdivisions; i++) {
      const u = i / subdivisions;
      const topX = quad[0].x + (quad[1].x - quad[0].x) * u;
      const topY = quad[0].y + (quad[1].y - quad[0].y) * u;
      const botX = quad[3].x + (quad[2].x - quad[3].x) * u;
      const botY = quad[3].y + (quad[2].y - quad[3].y) * u;
      row.push({ x: topX + (botX - topX) * v, y: topY + (botY - topY) * v });
    }
    grid.push(row);
  }

  for (let j = 0; j < subdivisions; j++) {
    for (let i = 0; i < subdivisions; i++) {
      const u0 = i / subdivisions, u1 = (i + 1) / subdivisions;
      const v0 = j / subdivisions, v1 = (j + 1) / subdivisions;
      const p00 = grid[j][i], p10 = grid[j][i + 1], p11 = grid[j + 1][i + 1], p01 = grid[j + 1][i];
      affineTriangle(ctx, image, u0 * sw, v0 * sh, u1 * sw, v0 * sh, u1 * sw, v1 * sh, p00.x, p00.y, p10.x, p10.y, p11.x, p11.y);
      affineTriangle(ctx, image, u0 * sw, v0 * sh, u1 * sw, v1 * sh, u0 * sw, v1 * sh, p00.x, p00.y, p11.x, p11.y, p01.x, p01.y);
    }
  }
}

function colorForProduct(product?: { colorName?: string; name?: string }) {
  const text = `${product?.colorName || ''} ${product?.name || ''}`.toLowerCase();
  if (/gold|ทอง|champagne/.test(text)) return '#b78b43';
  if (/silver|เงิน|chrome/.test(text)) return '#b9c0c6';
  if (/brown|น้ำตาล|tortoise|havanna/.test(text)) return '#573b2d';
  if (/blue|น้ำเงิน|ฟ้า/.test(text)) return '#293f64';
  if (/red|แดง|burgundy/.test(text)) return '#71343a';
  return '#1a1c20';
}

function mapSourceToScreen(
  p: Point2D,
  sourceW: number,
  sourceH: number,
  screenW: number,
  screenH: number,
  mirrored: boolean
): Point2D {
  const scale = Math.max(screenW / sourceW, screenH / sourceH);
  const renderedW = sourceW * scale;
  const renderedH = sourceH * scale;
  const cropX = (screenW - renderedW) / 2;
  const cropY = (screenH - renderedH) / 2;
  const x0 = p.x * scale + cropX;
  return { x: mirrored ? screenW - x0 : x0, y: p.y * scale + cropY };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function bilerp(q: [Point2D, Point2D, Point2D, Point2D], u: number, v: number): Point2D {
  const tx = q[0].x + (q[1].x - q[0].x) * u, ty = q[0].y + (q[1].y - q[0].y) * u;
  const bx = q[3].x + (q[2].x - q[3].x) * u, by = q[3].y + (q[2].y - q[3].y) * u;
  return { x: tx + (bx - tx) * v, y: ty + (by - ty) * v };
}

function rgba(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  const n = m ? parseInt(m[1], 16) : 0x1a1c20;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const frameColorCache = new WeakMap<object, string>();
/** Samples the darkest ~45% of the opaque pixels (= the frame material, not the lenses). */
function sampleFrameColor(image: DrawImage, fallback: string): string {
  const key = image as unknown as object;
  const hit = frameColorCache.get(key);
  if (hit) return hit;
  let out = fallback;
  try {
    const sw = (image as HTMLImageElement).naturalWidth || (image as HTMLCanvasElement).width;
    const sh = (image as HTMLImageElement).naturalHeight || (image as HTMLCanvasElement).height;
    if (sw && sh && typeof document !== 'undefined') {
      const w = 48, h = Math.max(8, Math.round(w * sh / sw));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const cx = c.getContext('2d', { willReadFrequently: true });
      if (cx) {
        cx.drawImage(image, 0, 0, w, h);
        const d = cx.getImageData(0, 0, w, h).data;
        const px: [number, number, number, number][] = [];
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] > 200) px.push([d[i], d[i + 1], d[i + 2], 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]]);
        }
        if (px.length > 20) {
          px.sort((a, b) => a[3] - b[3]);
          const take = px.slice(0, Math.max(10, Math.floor(px.length * 0.45)));
          const avg = [0, 1, 2].map(k => Math.round(take.reduce((sum, p) => sum + p[k], 0) / take.length * 0.9));
          out = '#' + avg.map(v => v.toString(16).padStart(2, '0')).join('');
        }
      }
    }
  } catch { /* tainted canvas (CORS): keep the name-based colour */ }
  frameColorCache.set(key, out);
  return out;
}

/**
 * Draws both temple arms. The arm START is the frame's hinge (projected together with the
 * frame quad, so the two can never separate). The END is the ear anchor (#127/#234 blend),
 * expressed in the glasses' own rolled frame and clamped so the arm can only run
 * OUTWARD and DOWNWARD-or-level toward the ear - it can never climb to the eyebrow/forehead.
 */
function drawTemples(
  ctx: CanvasRenderingContext2D,
  transform: GlassesTransform,
  metrics: FaceMetrics,
  color: string,
) {
  const W = transform.width;
  const yaw = transform.yawRad;
  const pitch = transform.pitchRad;
  const armWidth = clamp(W * 0.02, 2, 8);
  const cr = Math.cos(transform.rollRad), sr = Math.sin(transform.rollRad);
  const down = { x: -sr, y: cr };                       // "down" of the tilted glasses

  // Pair by SCREEN position (metrics may be mirrored, so "left" != screen-left).
  const ears = [metrics.leftEar, metrics.rightEar].sort((a, b) => a.x - b.x);

  ([-1, 1] as const).forEach((side, i) => {
    const hinge = transform.hinges[i];
    const ear = ears[i];
    if (![hinge.x, hinge.y, ear.x, ear.y].every(Number.isFinite)) return;
    const out = { x: side * cr, y: side * sr };         // outward along the frame axis

    // yaw > 0 => screen-right side is farther (see project()).
    const far = side * yaw > 0 ? clamp(Math.abs(yaw) / 0.6, 0, 1) : 0;
    if (far > 0.18) return;
    const minRun = 0;

    const vx = ear.x - hinge.x, vy = ear.y - hinge.y;
    let run = vx * out.x + vy * out.y;                  // outward distance to the ear
    let drop = vx * down.x + vy * down.y;               // downward distance to the ear
    run = clamp(Math.max(run, minRun), 0, W * 0.6);
    if (run < armWidth * 1.5 || Math.abs(yaw) < 0.08) return;                   // far arm hidden behind the face
    drop = clamp(drop, -0.10 * run, 0.70 * run);        // never steeply up

    // Only the first part of the arm is shown, fading to nothing: it reads as tucking behind the cheek / hair
    // (and never lands on top of headphones or hair like a full-length arm would).
    const SHOW = 0.42;
    const end = { x: hinge.x + (out.x * run + down.x * drop) * SHOW, y: hinge.y + (out.y * run + down.y * drop) * SHOW };
    const bend = -pitch * run * 0.10;                   // looking down => arm bows up a little
    const mid = {
      x: (hinge.x + end.x) / 2 + down.x * bend,
      y: (hinge.y + end.y) / 2 + down.y * bend,
    };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = armWidth;

    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.moveTo(hinge.x, hinge.y + armWidth * 0.6);
    ctx.quadraticCurveTo(mid.x, mid.y + armWidth * 0.6, end.x, end.y + armWidth * 0.6);
    ctx.stroke();

    const g = ctx.createLinearGradient(hinge.x, hinge.y, end.x, end.y);
    g.addColorStop(0, rgba(color, 0.95));
    g.addColorStop(0.45, rgba(color, 0.60 * (1 - 0.6 * far)));
    g.addColorStop(1, rgba(color, 0));
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(hinge.x, hinge.y);
    ctx.quadraticCurveTo(mid.x, mid.y, end.x, end.y);
    ctx.stroke();
    ctx.restore();
  });
}

export function drawGlasses(
  ctx: CanvasRenderingContext2D,
  image: DrawImage,
  transform: GlassesTransform,
  options?: {
    metrics?: FaceMetrics;
    /** Display-space size in CSS pixels. Metrics passed here are already display-space. */
    sourceSize?: { width: number; height: number };
    mirrored?: boolean;
    product?: { colorName?: string; name?: string };
    drawTemples?: boolean;
    /** Faint lens glare; default on. */
    lensGlare?: boolean;
  }
): void {
  const metrics = options?.metrics;
  // `metrics` is already in display space (mapMetricsToDisplay). Never map twice.
  void options?.mirrored;
  void options?.sourceSize;

  const front = frontOnlyImage(image);
  // Compose lens pixels once. Arms carry their own soft shadow.

  // Temples first so the hinge end tucks under the front frame.
  if (metrics && options?.drawTemples !== false) {
    const color = sampleFrameColor(image, colorForProduct(options?.product));
    drawTemples(ctx, transform, metrics, color);
  }

  ctx.save();
  ctx.globalAlpha = transform.opacity;
  ctx.globalCompositeOperation = 'source-over';
  if (!drawSeamlessTexture(ctx, front, transform.quad)) {
    drawProjectiveImage(ctx, front, transform.quad, 8);
  }
  ctx.restore();

  // Very faint window-light glare on each lens (top-left), like a real lens surface. Alpha stays low
  // so it never looks like a pasted circle.
  if (options?.lensGlare !== false) {
    const fa = analyzeFrameImage(image);
    const q = transform.quad;
    const span = Math.max(0.2, fa.lensR[0] - fa.lensL[0]);
    const r = transform.width * span * 0.30;
    if (r > 6 && Number.isFinite(r)) {
      for (const uv of [fa.lensL, fa.lensR]) {
        const c = bilerp(q, uv[0], uv[1]);
        const gx = c.x - r * 0.35, gy = c.y - r * 0.40;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * 0.75);
        g.addColorStop(0, 'rgba(255,255,255,0.10)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.globalAlpha = transform.opacity;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillRect(c.x - r, c.y - r, r * 2, r * 2);
        ctx.restore();
      }
    }
  }
}

/** Source-video -> display-space conversion used by the live renderer. */
export function mapMetricsToDisplay(
  metrics: FaceMetrics,
  sourceW: number,
  sourceH: number,
  displayW: number,
  displayH: number,
  mirrored: boolean
): FaceMetrics {
  const map = (p: Point2D): Point2D => mapSourceToScreen(p, sourceW, sourceH, displayW, displayH, mirrored);
  const sx = Math.max(displayW / sourceW, displayH / sourceH);
  const scaleMetric = (v: number) => v * sx;
  return {
    ...metrics,
    faceSurface: metrics.faceSurface?.map(p => ({ ...map(p), z: scaleMetric(p.z) })),
    bridgeDepth: metrics.bridgeDepth !== undefined ? scaleMetric(metrics.bridgeDepth) : undefined,
    eyeCenter: map(metrics.eyeCenter),
    noseBridge: map(metrics.noseBridge),
    noseTip: { ...metrics.noseTip, ...map(metrics.noseTip) },
    leftEye: { ...map(metrics.leftEye), z: scaleMetric(metrics.leftEye.z) },
    rightEye: { ...map(metrics.rightEye), z: scaleMetric(metrics.rightEye.z) },
    leftOuterEye: map(metrics.leftOuterEye),
    rightOuterEye: map(metrics.rightOuterEye),
    leftEar: map(metrics.leftEar),
    rightEar: map(metrics.rightEar),
    bridge: metrics.bridge ? map(metrics.bridge) : undefined,
    pdPx3D: metrics.pdPx3D !== undefined ? scaleMetric(metrics.pdPx3D) : undefined,
    templeWidthPx3D: metrics.templeWidthPx3D !== undefined ? scaleMetric(metrics.templeWidthPx3D) : undefined,
    frameWidthPx: metrics.frameWidthPx !== undefined ? scaleMetric(metrics.frameWidthPx) : undefined,
    eyeDistancePx: scaleMetric(metrics.eyeDistancePx),
    faceWidthPx: scaleMetric(metrics.faceWidthPx),
    faceHeightPx: scaleMetric(metrics.faceHeightPx),
    jawWidthPx: scaleMetric(metrics.jawWidthPx),
    foreheadWidthPx: scaleMetric(metrics.foreheadWidthPx),
    rollDeg: mirrored ? -metrics.rollDeg : metrics.rollDeg,
    yawRatio: mirrored ? -metrics.yawRatio : metrics.yawRatio,
    yawRad: metrics.yawRad !== undefined ? (mirrored ? -metrics.yawRad : metrics.yawRad) : undefined,
    headQuaternion: metrics.headQuaternion && mirrored ? [metrics.headQuaternion[0], -metrics.headQuaternion[1], -metrics.headQuaternion[2], metrics.headQuaternion[3]] : metrics.headQuaternion,
    outerEyeDistPx3D: metrics.outerEyeDistPx3D !== undefined ? scaleMetric(metrics.outerEyeDistPx3D) : undefined,
  };
}
