import { useEffect, useRef, useState, type RefObject, type MutableRefObject } from 'react';
import { getVideoFaceLandmarker, isBrowserSupported } from '../lib/faceLandmarkerLoader';
import { computeFaceMetrics, type FaceMetrics } from '../lib/faceGeometry';

export type TrackingStatus =
  | 'idle' | 'unsupported' | 'loading-model' | 'no-face'
  | 'multiple-faces' | 'tracking' | 'error';

export interface UseFaceTrackingOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
}

export interface UseFaceTrackingResult {
  status: TrackingStatus;
  errorMessage: string | null;
  metrics: FaceMetrics | null;
  /** Mutable hot-path value: avoids React state latency in the 60 FPS renderer. */
  metricsRef: MutableRefObject<FaceMetrics | null>;
}

const UI_UPDATE_INTERVAL_MS = 80;

export function useFaceTracking({ videoRef, enabled }: UseFaceTrackingOptions): UseFaceTrackingResult {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FaceMetrics | null>(null);
  const metricsRef = useRef<FaceMetrics | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastUiUpdateRef = useRef(0);
  const lastStatusRef = useRef<TrackingStatus>('idle');

  useEffect(() => {
    if (!enabled) {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      metricsRef.current = null;
      setStatus('idle');
      setMetrics(null);
      return;
    }

    if (!isBrowserSupported()) {
      setStatus('unsupported');
      setErrorMessage('เบราว์เซอร์นี้ไม่รองรับการตรวจจับใบหน้าแบบเรียลไทม์');
      return;
    }

    let cancelled = false;
    setStatus('loading-model');
    setErrorMessage(null);

    getVideoFaceLandmarker()
      .then((landmarker) => {
        if (cancelled) return;

        const loop = (timestampMs: number) => {
          if (cancelled) return;
          rafIdRef.current = requestAnimationFrame(loop);

          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;

          let result;
          try {
            result = landmarker.detectForVideo(video, timestampMs);
          } catch {
            return;
          }

          const faces = result.faceLandmarks ?? [];
          let nextStatus: TrackingStatus = 'no-face';
          let nextMetrics: FaceMetrics | null = null;

          if (faces.length > 1) {
            nextStatus = 'multiple-faces';
          } else if (faces.length === 1) {
            nextMetrics = computeFaceMetrics(
              faces[0],
              video.videoWidth,
              video.videoHeight,
              result.facialTransformationMatrixes?.[0]?.data
            );
            if (nextMetrics) nextStatus = 'tracking';
          }

          // The renderer reads this every animation frame. No React render is
          // needed for each detector result.
          metricsRef.current = nextMetrics;

          const statusChanged = nextStatus !== lastStatusRef.current;
          if (statusChanged || timestampMs - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
            lastUiUpdateRef.current = timestampMs;
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
      rafIdRef.current = null;
      metricsRef.current = null;
    };
  }, [enabled, videoRef]);

  return { status, errorMessage, metrics, metricsRef };
}
