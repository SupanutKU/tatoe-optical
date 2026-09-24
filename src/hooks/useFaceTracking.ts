import { useEffect, useRef, useState, type RefObject } from 'react';
import { getVideoFaceLandmarker, isBrowserSupported } from '../lib/faceLandmarkerLoader';
import { computeFaceMetrics, type FaceMetrics } from '../lib/faceGeometry';
import { computeGlassesTransform, drawGlasses } from '../lib/virtualTryOnEngine';
import { loadCachedImage } from '../lib/imageCache';

export type TrackingStatus =
  | 'idle'
  | 'unsupported'
  | 'loading-model'
  | 'no-face'
  | 'multiple-faces'
  | 'tracking'
  | 'error';

export interface UseFaceTrackingOptions {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  glassesSrc: string | null;
  /** Run the detection + draw loop. Set false to pause (e.g. modal closed, tab hidden). */
  enabled: boolean;
}

export interface UseFaceTrackingResult {
  status: TrackingStatus;
  errorMessage: string | null;
  /** Throttled snapshot of the latest face metrics, for UI (PD readout, recommendation engine). */
  metrics: FaceMetrics | null;
}

const STATE_UPDATE_INTERVAL_MS = 150;

export function useFaceTracking({
  videoRef,
  canvasRef,
  glassesSrc,
  enabled,
}: UseFaceTrackingOptions): UseFaceTrackingResult {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FaceMetrics | null>(null);

  const glassesImageRef = useRef<HTMLImageElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastStateUpdateRef = useRef(0);
  const lastStatusRef = useRef<TrackingStatus>('idle');

  // Keep the glasses image ready without restarting the detection loop.
  useEffect(() => {
    if (!glassesSrc) {
      glassesImageRef.current = null;
      return;
    }
    let cancelled = false;
    loadCachedImage(glassesSrc)
      .then((img) => {
        if (!cancelled) glassesImageRef.current = img;
      })
      .catch(() => {
        if (!cancelled) glassesImageRef.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, [glassesSrc]);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    if (!isBrowserSupported()) {
      setStatus('unsupported');
      setErrorMessage('เบราว์เซอร์นี้ไม่รองรับการตรวจจับใบหน้าแบบเรียลไทม์');
      return;
    }

    let cancelled = false;
    setStatus('loading-model');

    getVideoFaceLandmarker()
      .then((landmarker) => {
        if (cancelled) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loop = (timestampMs: number) => {
          if (cancelled) return;
          rafIdRef.current = requestAnimationFrame(loop);

          if (video.readyState < 2 || video.videoWidth === 0) return;

          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          let result;
          try {
            result = landmarker.detectForVideo(video, timestampMs);
          } catch {
            return;
          }

          // Draw the live video frame onto the canvas itself first. The
          // glasses are then composited (multiply blend) against these
          // pixels — a canvas can only blend against content already drawn
          // on it, not against the <video> element sitting behind it.
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const faces = result.faceLandmarks ?? [];
          let nextStatus: TrackingStatus = 'no-face';
          let nextMetrics: FaceMetrics | null = null;

          if (faces.length > 1) {
            nextStatus = 'multiple-faces';
          } else if (faces.length === 1) {
            nextMetrics = computeFaceMetrics(faces[0], canvas.width, canvas.height);
            if (nextMetrics) {
              nextStatus = 'tracking';
              const glassesImg = glassesImageRef.current;
              if (glassesImg) {
                const transform = computeGlassesTransform({
                  metrics: nextMetrics,
                  glassesNaturalWidth: glassesImg.naturalWidth,
                  glassesNaturalHeight: glassesImg.naturalHeight,
                });
                drawGlasses(ctx, glassesImg, transform);
              }
            }
          }

          const now = timestampMs;
          const statusChanged = nextStatus !== lastStatusRef.current;
          if (statusChanged || now - lastStateUpdateRef.current > STATE_UPDATE_INTERVAL_MS) {
            lastStateUpdateRef.current = now;
            lastStatusRef.current = nextStatus;
            setStatus(nextStatus);
            setMetrics(nextMetrics);
          }
        };

        rafIdRef.current = requestAnimationFrame(loop);
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage('โหลดระบบตรวจจับใบหน้าไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่');
        }
      });

    return () => {
      cancelled = true;
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { status, errorMessage, metrics };
}
