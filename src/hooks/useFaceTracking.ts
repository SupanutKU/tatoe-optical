import { useEffect, useRef, useState, type RefObject } from 'react';
import { getVideoFaceLandmarker, isBrowserSupported } from '../lib/faceLandmarkerLoader';
import { computeFaceMetrics, type FaceMetrics } from '../lib/faceGeometry';

export type TrackingStatus =
  | 'idle'
  | 'unsupported'
  | 'loading-model'
  | 'no-face'
  | 'multiple-faces'
  | 'tracking'
  | 'error';

export interface UseFaceTrackingOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Run the detection loop. */
  enabled: boolean;
}

export interface UseFaceTrackingResult {
  status: TrackingStatus;
  errorMessage: string | null;
  metrics: FaceMetrics | null;
}

const STATE_UPDATE_INTERVAL_MS = 120;

/** MediaPipe-only tracking. Rendering is intentionally separate from tracking
 * so the live camera can stay visible while a transparent WebGL/Babylon 3D
 * layer renders the glasses above it. */
export function useFaceTracking({ videoRef, enabled }: UseFaceTrackingOptions): UseFaceTrackingResult {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FaceMetrics | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastStateUpdateRef = useRef(0);
  const lastStatusRef = useRef<TrackingStatus>('idle');

  useEffect(() => {
    if (!enabled) {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
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
            nextMetrics = computeFaceMetrics(faces[0], video.videoWidth, video.videoHeight);
            if (nextMetrics) nextStatus = 'tracking';
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
      rafIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { status, errorMessage, metrics };
}
