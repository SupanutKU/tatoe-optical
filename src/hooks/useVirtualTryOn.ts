import { useCallback, useState } from 'react';
import { getImageFaceLandmarker, isBrowserSupported } from '../lib/faceLandmarkerLoader';
import { computeFaceMetrics, mirrorFaceMetrics, type FaceMetrics } from '../lib/faceGeometry';

export type TryOnMode = 'camera' | 'upload';

export type PhotoStatus = 'detecting' | 'no-face' | 'multiple-faces' | 'ready' | 'error';

export interface FrozenPhoto {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  status: PhotoStatus;
  metrics: FaceMetrics | null;
  errorMessage?: string;
}

export interface UseVirtualTryOnResult {
  mode: TryOnMode;
  setMode: (mode: TryOnMode) => void;
  frozenPhoto: FrozenPhoto | null;
  isProcessingUpload: boolean;
  captureFromVideo: (video: HTMLVideoElement, liveMetrics: FaceMetrics | null, mirrored: boolean) => void;
  handleUploadFile: (file: File) => Promise<void>;
  retake: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image-load-failed'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('file-read-failed'));
    reader.readAsDataURL(file);
  });
}

export function useVirtualTryOn(): UseVirtualTryOnResult {
  const [mode, setModeState] = useState<TryOnMode>('camera');
  const [frozenPhoto, setFrozenPhoto] = useState<FrozenPhoto | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  const setMode = useCallback((next: TryOnMode) => {
    setModeState(next);
    setFrozenPhoto(null);
  }, []);

  const retake = useCallback(() => setFrozenPhoto(null), []);

  const captureFromVideo = useCallback(
    (video: HTMLVideoElement, liveMetrics: FaceMetrics | null, mirrored: boolean) => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (mirrored) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);

      const src = canvas.toDataURL('image/jpeg', 0.92);
      const metrics = liveMetrics ? (mirrored ? mirrorFaceMetrics(liveMetrics, width) : liveMetrics) : null;

      setFrozenPhoto({
        src,
        naturalWidth: width,
        naturalHeight: height,
        status: metrics ? 'ready' : 'no-face',
        metrics,
      });
    },
    []
  );

  const handleUploadFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFrozenPhoto({
        src: '',
        naturalWidth: 0,
        naturalHeight: 0,
        status: 'error',
        metrics: null,
        errorMessage: 'รองรับเฉพาะไฟล์ JPG, JPEG, PNG หรือ WEBP เท่านั้น',
      });
      return;
    }

    if (!isBrowserSupported()) {
      setFrozenPhoto({
        src: '',
        naturalWidth: 0,
        naturalHeight: 0,
        status: 'error',
        metrics: null,
        errorMessage: 'เบราว์เซอร์นี้ไม่รองรับการตรวจจับใบหน้า',
      });
      return;
    }

    setIsProcessingUpload(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const imgEl = await loadImageElement(dataUrl);

      setFrozenPhoto({
        src: dataUrl,
        naturalWidth: imgEl.naturalWidth,
        naturalHeight: imgEl.naturalHeight,
        status: 'detecting',
        metrics: null,
      });

      const landmarker = await getImageFaceLandmarker();
      const result = landmarker.detect(imgEl);
      const faces = result.faceLandmarks ?? [];

      if (faces.length === 0) {
        setFrozenPhoto({
          src: dataUrl,
          naturalWidth: imgEl.naturalWidth,
          naturalHeight: imgEl.naturalHeight,
          status: 'no-face',
          metrics: null,
          errorMessage: 'ไม่พบใบหน้าในรูปภาพ กรุณาเลือกรูปที่เห็นใบหน้าชัดเจน',
        });
        return;
      }

      if (faces.length > 1) {
        setFrozenPhoto({
          src: dataUrl,
          naturalWidth: imgEl.naturalWidth,
          naturalHeight: imgEl.naturalHeight,
          status: 'multiple-faces',
          metrics: null,
          errorMessage: 'พบมากกว่า 1 ใบหน้าในรูปภาพ กรุณาเลือกรูปที่มีใบหน้าเดียว',
        });
        return;
      }

      const metrics = computeFaceMetrics(faces[0], imgEl.naturalWidth, imgEl.naturalHeight);
      setFrozenPhoto({
        src: dataUrl,
        naturalWidth: imgEl.naturalWidth,
        naturalHeight: imgEl.naturalHeight,
        status: metrics ? 'ready' : 'error',
        metrics,
        errorMessage: metrics ? undefined : 'ไม่สามารถวิเคราะห์ใบหน้าได้ กรุณาลองรูปอื่น',
      });
    } catch {
      setFrozenPhoto({
        src: '',
        naturalWidth: 0,
        naturalHeight: 0,
        status: 'error',
        metrics: null,
        errorMessage: 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setIsProcessingUpload(false);
    }
  }, []);

  return {
    mode,
    setMode,
    frozenPhoto,
    isProcessingUpload,
    captureFromVideo,
    handleUploadFile,
    retake,
  };
}
