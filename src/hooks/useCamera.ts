import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export type CameraFacing = 'user' | 'environment';

export type CameraErrorCode =
  | 'permission-denied'
  | 'not-found'
  | 'unsupported'
  | 'unknown';

export interface CameraError {
  code: CameraErrorCode;
  messageTh: string;
}

const ERROR_MESSAGES: Record<CameraErrorCode, string> = {
  'permission-denied': 'ไม่ได้รับอนุญาตให้ใช้กล้อง กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์',
  'not-found': 'ไม่พบกล้องบนอุปกรณ์นี้',
  unsupported: 'เบราว์เซอร์นี้ไม่รองรับการใช้งานกล้อง กรุณาลองใช้ Chrome, Safari หรือ Edge เวอร์ชันล่าสุด',
  unknown: 'เกิดข้อผิดพลาดในการเปิดกล้อง กรุณาลองใหม่อีกครั้ง',
};

function toCameraError(err: unknown): CameraError {
  const name = err instanceof DOMException ? err.name : '';
  let code: CameraErrorCode = 'unknown';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') code = 'permission-denied';
  else if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError')
    code = 'not-found';
  return { code, messageTh: ERROR_MESSAGES[code] };
}

export interface UseCameraResult {
  videoRef: RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isStarting: boolean;
  error: CameraError | null;
  facingMode: CameraFacing;
  hasMultipleCameras: boolean;
  start: () => Promise<void>;
  stop: () => void;
  switchCamera: () => Promise<void>;
  clearError: () => void;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacing>('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stop = useCallback(() => {
    stopTracks();
    setIsActive(false);
  }, [stopTracks]);

  const start = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError({ code: 'unsupported', messageTh: ERROR_MESSAGES.unsupported });
      return;
    }

    setIsStarting(true);
    stopTracks();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          /* autoplay can reject before the user gesture settles; ignore */
        });
      }
      setIsActive(true);

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {
        setHasMultipleCameras(false);
      }
    } catch (err) {
      setIsActive(false);
      setError(toCameraError(err));
    } finally {
      setIsStarting(false);
    }
  }, [facingMode, stopTracks]);

  const switchCamera = useCallback(async () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // Restart the stream whenever facingMode changes while the camera is active.
  useEffect(() => {
    if (isActive) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  useEffect(() => {
    return () => stopTracks();
  }, [stopTracks]);

  return {
    videoRef,
    isActive,
    isStarting,
    error,
    facingMode,
    hasMultipleCameras,
    start,
    stop,
    switchCamera,
    clearError: () => setError(null),
  };
}
