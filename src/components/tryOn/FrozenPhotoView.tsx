import React, { useEffect, useRef } from 'react';
import { GlassesOverlay } from './GlassesOverlay';
import { FaceTracker, type FaceTrackerDisplayState } from './FaceTracker';
import type { FrozenPhoto } from '../../hooks/useVirtualTryOn';
import { computeGlassesTransform, drawGlasses } from '../../lib/virtualTryOnEngine';
import { loadCachedImage } from '../../lib/imageCache';

interface FrozenPhotoViewProps {
  photo: FrozenPhoto;
  glassesSrc: string | null;
  retakeLabel: string;
  onRetake: () => void;
}

export const FrozenPhotoView: React.FC<FrozenPhotoViewProps> = ({
  photo,
  glassesSrc,
  retakeLabel,
  onRetake,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo.src) return;

    let cancelled = false;

    Promise.all([
      loadCachedImage(photo.src),
      photo.metrics && photo.status === 'ready' && glassesSrc ? loadCachedImage(glassesSrc) : Promise.resolve(null),
    ])
      .then(([photoImg, glassesImg]) => {
        if (cancelled) return;
        canvas.width = photo.naturalWidth || photoImg.naturalWidth;
        canvas.height = photo.naturalHeight || photoImg.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Base photo first — the glasses are then multiply-blended against
        // these exact pixels (a canvas can only blend against content
        // already drawn on it, not against a separate <img> behind it).
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);

        if (glassesImg && photo.metrics) {
          const transform = computeGlassesTransform({
            metrics: photo.metrics,
            glassesNaturalWidth: glassesImg.naturalWidth,
            glassesNaturalHeight: glassesImg.naturalHeight,
          });
          drawGlasses(ctx, glassesImg, transform);
        }
      })
      .catch(() => {
        /* photo or glasses image failed to load — leave canvas as-is */
      });

    return () => {
      cancelled = true;
    };
  }, [photo, glassesSrc]);

  const trackerState: FaceTrackerDisplayState =
    photo.status === 'detecting'
      ? 'loading'
      : photo.status === 'ready'
      ? 'detected'
      : photo.status === 'multiple-faces'
      ? 'multiple'
      : 'error';

  const showBlockingMessage = photo.status === 'no-face' || photo.status === 'multiple-faces' || photo.status === 'error';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <GlassesOverlay ref={canvasRef} />

      {photo.src && <FaceTracker state={trackerState} />}

      {showBlockingMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 px-6 text-center">
          <span className="material-symbols-outlined text-[36px] text-white">
            {photo.status === 'multiple-faces' ? 'group' : 'face_retouching_off'}
          </span>
          <p className="text-white text-sm font-medium leading-relaxed whitespace-pre-line">
            {photo.errorMessage || 'ไม่พบใบหน้าในรูปภาพ\nกรุณาเลือกรูปที่เห็นใบหน้าชัดเจน'}
          </p>
          <button
            onClick={onRetake}
            className="mt-1 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold active:scale-95 transition-all"
          >
            {retakeLabel}
          </button>
        </div>
      )}

      {photo.status === 'ready' && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center z-10">
          <button
            onClick={onRetake}
            className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            {retakeLabel}
          </button>
        </div>
      )}
    </div>
  );
};
