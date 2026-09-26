import React, { useEffect, useState } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { useFaceTracking } from '../../hooks/useFaceTracking';
import { FaceTracker, type FaceTrackerDisplayState } from './FaceTracker';
import { BabylonGlassesOverlay } from './BabylonGlassesOverlay';
import type { FaceMetrics } from '../../lib/faceGeometry';
import type { Product } from '../../types';

interface CameraViewProps {
  active: boolean;
  product: Product;
  onCapture: (video: HTMLVideoElement, metrics: FaceMetrics | null, mirrored: boolean) => void;
  onMetricsUpdate?: (metrics: FaceMetrics | null) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ active, product, onCapture, onMetricsUpdate }) => {
  const camera = useCamera();
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  const tracking = useFaceTracking({
    videoRef: camera.videoRef,
    enabled: active && camera.isActive,
  });

  useEffect(() => {
    onMetricsUpdate?.(tracking.status === 'tracking' ? tracking.metrics : null);
  }, [tracking.status, tracking.metrics, onMetricsUpdate]);

  useEffect(() => {
    if (active) camera.start();
    else camera.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const video = camera.videoRef.current;
    if (!video) return;
    const sync = () => setVideoSize({ width: video.videoWidth, height: video.videoHeight });
    video.addEventListener('loadedmetadata', sync);
    sync();
    return () => video.removeEventListener('loadedmetadata', sync);
  }, [camera.isActive]);

  const trackerState: FaceTrackerDisplayState =
    tracking.status === 'loading-model'
      ? 'loading'
      : tracking.status === 'tracking'
      ? 'detected'
      : tracking.status === 'multiple-faces'
      ? 'multiple'
      : tracking.status === 'error' || tracking.status === 'unsupported'
      ? 'error'
      : 'searching';

  const mirrored = camera.facingMode === 'user';

  if (camera.error) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 bg-surface-container-high px-6 text-center">
        <span className="material-symbols-outlined text-[40px] text-error">videocam_off</span>
        <p className="text-sm text-on-surface font-medium">{camera.error.messageTh}</p>
        <button onClick={() => camera.start()} className="mt-1 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold active:scale-95 transition-all">ลองอีกครั้ง</button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={camera.videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${mirrored ? '-scale-x-100' : ''}`}
      />

      {camera.isActive && videoSize.width > 0 && (
        <BabylonGlassesOverlay
          metrics={tracking.metrics}
          product={product}
          mirrored={mirrored}
          videoSize={videoSize}
        />
      )}

      {(camera.isStarting || tracking.status === 'loading-model') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 text-white text-xs z-20">
          <span className="w-7 h-7 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <span>{camera.isStarting ? 'กำลังเปิดกล้อง...' : 'กำลังเตรียมระบบ 3D...'}</span>
        </div>
      )}

      {camera.isActive && (
        <FaceTracker
          state={trackerState}
          pdMm={tracking.metrics?.estimatedPdMm}
          message={tracking.status === 'unsupported' || tracking.status === 'error' ? tracking.errorMessage || undefined : undefined}
        />
      )}

      {camera.isActive && (
        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-4 z-20">
          {camera.hasMultipleCameras && (
            <button onClick={() => camera.switchCamera()} aria-label="สลับกล้อง" className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-all border border-white/15">
              <span className="material-symbols-outlined text-[21px]">cameraswitch</span>
            </button>
          )}
          <button
            onClick={() => onCapture(camera.videoRef.current as HTMLVideoElement, tracking.metrics, mirrored)}
            disabled={tracking.status !== 'tracking'}
            aria-label="ถ่ายภาพ"
            className="w-[68px] h-[68px] rounded-full bg-white flex items-center justify-center shadow-xl active:scale-90 transition-all disabled:opacity-40 border-[5px] border-white/40"
          >
            <span className="w-[52px] h-[52px] rounded-full border border-black/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[27px] text-on-surface">photo_camera</span>
            </span>
          </button>
          <button onClick={() => camera.stop()} aria-label="หยุดกล้อง" className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-all border border-white/15">
            <span className="material-symbols-outlined text-[20px]">videocam_off</span>
          </button>
        </div>
      )}

      {!camera.isActive && !camera.isStarting && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <button onClick={() => camera.start()} className="px-5 py-3 rounded-full bg-primary text-on-primary text-sm font-semibold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            เปิดกล้องอีกครั้ง
          </button>
        </div>
      )}
    </div>
  );
};
