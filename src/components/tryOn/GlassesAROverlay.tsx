import React, { useEffect, useRef, type MutableRefObject } from 'react';
import type { Product } from '../../types';
import type { FaceMetrics } from '../../lib/faceGeometry';
import { computeGlassesTransform, drawGlasses, mapMetricsToDisplay } from '../../lib/virtualTryOnEngine';
import { prepareEyewearAsset, type PreparedEyewearAsset } from '../../lib/eyewearAsset';
import { loadAiAnchors } from '../../lib/frameAiAnchors';

interface Props {
  metrics: FaceMetrics | null;
  /** Hot-path detector ref. When supplied, rendering does not wait for React state. */
  metricsRef?: MutableRefObject<FaceMetrics | null>;
  product?: Product;
  mirrored?: boolean;
  videoSize: { width: number; height: number };
}

const smooth = (a: number, b: number, alpha: number) => a + (b - a) * alpha;

/** True when every number in the metrics object is finite (rejects NaN/Infinity frames). */
function isFiniteMetrics(v: unknown): boolean {
  if (typeof v === 'number') return Number.isFinite(v);
  if (v && typeof v === 'object') return Object.values(v as Record<string, unknown>).every(isFiniteMetrics);
  return true;
}

/** Recursively low-pass filters every numeric field (points, sizes, angles). */
function blendDeep<T>(prev: T, next: T, alpha: number): T {
  if (typeof next === 'number' && typeof prev === 'number') return smooth(prev, next, alpha) as unknown as T;
  if (next && typeof next === 'object' && prev && typeof prev === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(next as Record<string, unknown>)) {
      out[k] = blendDeep((prev as Record<string, unknown>)[k], (next as Record<string, unknown>)[k], alpha);
    }
    return out as T;
  }
  return next;
}

/**
 * Adaptive smoothing (1-Euro style): heavy smoothing when the head is still
 * (no jitter), light smoothing when it moves fast (no lag / "swimming" glasses).
 * The frame SCALE gets its own slower filter with a per-frame rate limit so a
 * single bad detection can never make the glasses balloon or collapse.
 */
function blendMetrics(prev: FaceMetrics, next: FaceMetrics): FaceMetrics {
  const ref = Math.max(1, next.frameWidthPx ?? next.eyeDistancePx * 2.12);
  const speed = Math.hypot(next.eyeCenter.x - prev.eyeCenter.x, next.eyeCenter.y - prev.eyeCenter.y) / ref;
  const alpha = Math.min(0.85, 0.22 + speed * 6);
  const out = blendDeep(prev, next, alpha);

  const limitedScale = (p: number | undefined, n: number | undefined) => {
    if (!p || !n) return n;
    const target = p * Math.min(1.12, Math.max(0.89, n / p));
    return smooth(p, target, 0.28);
  };
  out.eyeDistancePx = limitedScale(prev.eyeDistancePx, next.eyeDistancePx) ?? next.eyeDistancePx;
  out.frameWidthPx = limitedScale(prev.frameWidthPx, next.frameWidthPx);
  return out;
}

export const GlassesAROverlay: React.FC<Props> = ({
  metrics,
  metricsRef,
  product,
  mirrored = true,
  videoSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assetRef = useRef<PreparedEyewearAsset | null>(null);
  const targetRef = useRef<FaceMetrics | null>(metrics);
  const currentRef = useRef<FaceMetrics | null>(null);
  const productKeyRef = useRef<string | null>(null);
  const assetErrorRef = useRef(false);

  useEffect(() => {
    targetRef.current = metrics;
  }, [metrics]);

  useEffect(() => {
    let cancelled = false;
    assetRef.current = null;
    assetErrorRef.current = false;
    productKeyRef.current = product?.id ?? null;

    const sources = [product?.overlayImage, ...(product?.images || [])].filter(Boolean) as string[];
    const uniqueSources = [...new Set(sources)];
    if (!uniqueSources.length) return;

    // Try the dedicated transparent/cutout asset first, then the normal product
    // image. This prevents a broken overlay_image record from disabling VTO.
    const loadCandidate = async (index: number): Promise<void> => {
      if (cancelled || productKeyRef.current !== product?.id || index >= uniqueSources.length) return;
      const src = uniqueSources[index];
      try {
        const asset = await prepareEyewearAsset(src, {
          maxDimension: 1200,
          backgroundThreshold: 46,
          feather: 18,
        });
        if (!cancelled && productKeyRef.current === product?.id) {
          assetRef.current = asset;
          if (product) void loadAiAnchors(asset, product).then(n => { if (n && !cancelled && productKeyRef.current === product.id) assetRef.current = n; });
        }
      } catch {
        // If preprocessing cannot read a remote image, load it directly.
        try {
          const raw = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });
          if (!cancelled && productKeyRef.current === product?.id) {
            const fallbackAsset = { source: src, dataUrl: src, width: raw.naturalWidth, height: raw.naturalHeight, image: raw };
            assetRef.current = fallbackAsset;
            if (product) void loadAiAnchors(fallbackAsset, product).then(n => { if (n && !cancelled && productKeyRef.current === product.id) assetRef.current = n; });
          }
        } catch {
          await loadCandidate(index + 1);
        }
      }
    };

    void loadCandidate(0);

    return () => { cancelled = true; };
  }, [product?.id, product?.overlayImage, product?.images]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let raf = 0;
    let lastW = 0;
    let lastH = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      lastW = rect.width;
      lastH = rect.height;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const ctx = canvas.getContext('2d');
      if (!ctx || !lastW || !lastH || !videoSize.width || !videoSize.height) return;

      const dpr = canvas.width / lastW;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, lastW, lastH);

      const sourceMetrics = metricsRef?.current ?? targetRef.current;
      const asset = assetRef.current;
      if (!sourceMetrics || !asset || !product) {
        currentRef.current = null;
        return;
      }

      const displayMetrics = mapMetricsToDisplay(
        sourceMetrics,
        videoSize.width,
        videoSize.height,
        lastW,
        lastH,
        mirrored
      );

      // Smoothing is applied to geometry only. The detector stays on its native
      // cadence while the visual layer runs at requestAnimationFrame cadence.
      const prev = currentRef.current;
      const blended = prev && isFiniteMetrics(displayMetrics)
        ? blendMetrics(prev, displayMetrics)
        : (isFiniteMetrics(displayMetrics) ? displayMetrics : prev);
      if (!blended) return;
      currentRef.current = blended;

      const transform = computeGlassesTransform({
        metrics: blended,
        glassesNaturalWidth: asset.width,
        glassesNaturalHeight: asset.height,
        image: asset.image,
        fitMultiplier: product.tryOnFitMultiplier ?? 2.12,
        verticalOffsetRatio: product.tryOnVerticalOffset ?? 0.16,
      });

      drawGlasses(ctx, asset.image, transform, {
        metrics: blended,
        sourceSize: { width: lastW, height: lastH },
        mirrored: false,
        product,
        drawTemples: true,
      });
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [product, videoSize.width, videoSize.height, mirrored, metricsRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[12]"
      aria-hidden="true"
    />
  );
};
