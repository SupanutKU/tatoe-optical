import React, { useEffect, useRef } from 'react';
import { ArTryOnScene } from '../../lib/arScene';
import { loadGlassesCutout } from '../../lib/imageCache';
import type { FaceMetrics } from '../../lib/faceGeometry';

interface ARGlassesOverlayProps {
  /** Source pixel size of the video/photo the metrics were measured against — NOT the on-screen CSS size (see `arScene.ts` for why). */
  frameWidth: number;
  frameHeight: number;
  metrics: FaceMetrics | null;
  /** Flat PNG/JPG product photo, used as a fallback when the product has no `modelUrl`. */
  glassesSrc: string | null;
  /** Real 3D frame model — when present, renders instead of the flat cutout so temple arms occlude correctly. */
  modelUrl?: string | null;
  mirrored?: boolean;
  /**
   * true = live camera (continuous smoothing + video-brightness lighting
   * sampling). false = a single still photo (pose snaps instantly, no
   * lighting sampling — there's nothing new to sample).
   */
  live: boolean;
  /** The live video element, used only for the lighting sample in live mode. */
  video?: HTMLVideoElement | null;
  className?: string;
}

const LIVE_SMOOTHING = 0.35;

export const ARGlassesOverlay: React.FC<ARGlassesOverlayProps> = ({
  frameWidth,
  frameHeight,
  metrics,
  glassesSrc,
  modelUrl,
  mirrored = false,
  live,
  video,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ArTryOnScene | null>(null);
  const metricsRef = useRef<FaceMetrics | null>(metrics);
  metricsRef.current = metrics;

  // Scene lifecycle — one WebGL context per mount.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new ArTryOnScene(canvas);
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Match the canvas's internal render resolution to the source frame (not
  // its on-screen CSS size) so `object-cover` crops it identically to the
  // underlying video/photo and the AR projection math stays pixel-aligned.
  useEffect(() => {
    sceneRef.current?.resize(frameWidth, frameHeight);
  }, [frameWidth, frameHeight]);

  // Load whichever glasses source applies. A real 3D model takes priority
  // (it's the only source that can show temple arms wrapping realistically
  // around the head); otherwise fall back to the flat alpha-cutout plane.
  useEffect(() => {
    let cancelled = false;
    const scene = sceneRef.current;
    if (!scene) return;

    if (modelUrl) {
      scene.setGlasses({ kind: 'model', url: modelUrl });
      return;
    }
    if (!glassesSrc) {
      scene.setGlasses(null);
      return;
    }
    loadGlassesCutout(glassesSrc)
      .then((cutout) => {
        if (cancelled) return;
        sceneRef.current?.setGlasses({ kind: 'cutout', cutout });
      })
      .catch(() => {
        if (!cancelled) sceneRef.current?.setGlasses(null);
      });
    return () => {
      cancelled = true;
    };
  }, [glassesSrc, modelUrl]);

  // Render loop. Pose is recomputed every frame from `metricsRef` (not just
  // when the throttled `metrics` prop changes) so the smoothing in
  // `ArTryOnScene.updatePose` has something to interpolate toward smoothly.
  useEffect(() => {
    let raf = 0;
    const loop = (timestampMs: number) => {
      raf = requestAnimationFrame(loop);
      const scene = sceneRef.current;
      if (!scene) return;
      scene.updatePose(metricsRef.current, frameWidth, frameHeight, live ? LIVE_SMOOTHING : 1);
      if (live && video) scene.sampleVideoLighting(video, timestampMs);
      scene.render();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frameWidth, frameHeight, live, video]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
        mirrored ? '-scale-x-100' : ''
      } ${className}`}
    />
  );
};
