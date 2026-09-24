import React, { useEffect } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { useFaceTracking } from '../../hooks/useFaceTracking';
import { GlassesOverlay } from './GlassesOverlay';
import { FaceTracker, type FaceTrackerDisplayState } from './FaceTracker';
import type { FaceMetrics } from '../../lib/faceGeometry';

interface CameraViewProps {
  active: boolean;
  glassesSrc: string | null;
  onCapture: (video: HTMLVideoElement, metrics: FaceMetrics | null, mirrored: boolean) => void;
  /** Fired whenever the live tracking status/metrics change, so the parent can use the current face (e.g. for the recommendation panel) without requiring a capture first. */
  onMetricsUpdate?: (metrics: FaceMetrics | null) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ active, glassesSrc, onCapture, onMetricsUpdate }) => {
  const camera = useCamera();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const tracking = useFaceTracking({
    videoRef: camera.videoRef,
    canvasRef,
    glassesSrc,
    enabled: active && camera.isActive,
  });

  useEffect(() => {
    onMetricsUpdate?.(tracking.status === 'tracking' ? tracking.metrics : null);
  }, [tracking.status, tracking.metrics, onMetricsUpdate]);

  useEffect(() => {
    if (active) {
      camera.start();
    } else {
      camera.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

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
        <button
          onClick={() => camera.start()}
          className="mt-1 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold active:scale-95 transition-all"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div className="relative w-full h-full">
        {/* The raw feed is invisible — the canvas draws the (mirrored) frame
            plus the glasses overlay together so they can be blended. The
            video element still needs to exist and keep playing so it can be
            sampled every frame. */}
        <video
          ref={camera.videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        />
        <GlassesOverlay ref={canvasRef} mirrored={mirrored} />
      </div>

      {(camera.isStarting || tracking.status === 'loading-model') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white text-xs">
          <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <span>กำลังเปิดกล้อง...</span>
        </div>
      )}

      {camera.isActive && (
        <FaceTracker
          state={trackerState}
          pdMm={tracking.metrics?.estimatedPdMm}
          message={
            tracking.status === 'unsupported' || tracking.status === 'error'
              ? tracking.errorMessage || undefined
              : undefined
          }
        />
      )}

      {camera.isActive && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 z-10">
          {camera.hasMultipleCameras && (
            <button
              onClick={() => camera.switchCamera()}
              aria-label="สลับกล้อง"
              className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">cameraswitch</span>
            </button>
          )}
          <button
            onClick={() => onCapture(camera.videoRef.current as HTMLVideoElement, tracking.metrics, mirrored)}
            disabled={tracking.status !== 'tracking'}
            aria-label="ถ่ายภาพ"
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[26px] text-on-surface">photo_camera</span>
          </button>
          <button
            onClick={() => camera.stop()}
            aria-label="หยุดกล้อง"
            className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">videocam_off</span>
          </button>
        </div>
      )}

      {!camera.isActive && !camera.isStarting && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => camera.start()}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">videocam</span>
            เปิดกล้องอีกครั้ง
          </button>
        </div>
      )}
    </div>
  );
};
