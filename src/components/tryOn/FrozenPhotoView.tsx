import React, { useEffect, useRef, useState } from 'react';
import { ThreeGlassesOverlay } from './ThreeGlassesOverlay';
import { GlassesOverlay } from './GlassesOverlay';
import { FaceTracker, type FaceTrackerDisplayState } from './FaceTracker';
import type { FrozenPhoto } from '../../hooks/useVirtualTryOn';
import { computeGlassesTransform, drawGlasses } from '../../lib/virtualTryOnEngine';
import { loadCachedImage } from '../../lib/imageCache';
import { prepareEyewearAsset, type PreparedEyewearAsset } from '../../lib/eyewearAsset';
import { loadAiAnchors } from '../../lib/frameAiAnchors';
import type { Product } from '../../types';

interface FrozenPhotoViewProps {
  photo: FrozenPhoto;
  glassesSrc: string | null;
  /** Selected product: needed for the AI lens-centre fit (same path as the live camera). */
  product?: Product | null;
  retakeLabel: string;
  onRetake: () => void;
}

export const FrozenPhotoView: React.FC<FrozenPhotoViewProps> = ({
  photo,
  glassesSrc,
  product,
  retakeLabel,
  onRetake,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [saveError, setSaveError] = useState('');

  const savePhoto = () => {
    setSaveError('');
    // Copy in the same animation frame as WebGL rendering, before its drawing
    // buffer is cleared; use the preview's exact object-cover crop.
    requestAnimationFrame(() => {
      const host = hostRef.current, photoCanvas = canvasRef.current;
      if (!host || !photoCanvas) return;
      if (product?.model3d && !host.querySelector('[data-model-ready="true"]')) { setSaveError('กำลังเตรียมภาพลองแว่น กรุณารอสักครู่'); return; }
      try {
        const width = host.clientWidth, height = host.clientHeight;
        const output = document.createElement('canvas');
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        output.width = Math.round(width*ratio); output.height = Math.round(height*ratio);
        const ctx = output.getContext('2d'); if (!ctx) return;
        const scale = Math.max(width/photoCanvas.width,height/photoCanvas.height);
        ctx.drawImage(photoCanvas,(photoCanvas.width-width/scale)/2,(photoCanvas.height-height/scale)/2,width/scale,height/scale,0,0,output.width,output.height);
        const modelCanvas = host.querySelector<HTMLCanvasElement>('[data-tryon-layer] canvas');
        if (modelCanvas) ctx.drawImage(modelCanvas,0,0,output.width,output.height);
        const link = document.createElement('a');
        link.download = 'tatoe-try-on.png'; link.href = output.toDataURL('image/png'); link.click();
      } catch { setSaveError('บันทึกรูปไม่สำเร็จ กรุณาลองใหม่'); }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo.src) return;

    let cancelled = false;
    let photoImg: HTMLImageElement | null = null;

    // Base photo first, then the glasses, so they are composited against these exact pixels.
    const render = (glassesAsset: PreparedEyewearAsset | null) => {
      if (cancelled || !photoImg) return;
      canvas.width = photo.naturalWidth || photoImg.naturalWidth;
      canvas.height = photo.naturalHeight || photoImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);

      if (glassesAsset && photo.metrics) {
        const transform = computeGlassesTransform({
          metrics: photo.metrics,
          glassesNaturalWidth: glassesAsset.width,
          glassesNaturalHeight: glassesAsset.height,
          image: glassesAsset.image,
          fitMultiplier: product?.tryOnFitMultiplier ?? 2.12,
          verticalOffsetRatio: product?.tryOnVerticalOffset ?? 0.16,
        });
        drawGlasses(ctx, glassesAsset.image, transform, {
          metrics: photo.metrics,
          sourceSize: { width: canvas.width, height: canvas.height },
          mirrored: false,
          product: product ?? undefined,
          drawTemples: true,
        });
      }
    };

    Promise.all([
      loadCachedImage(photo.src),
      !product?.model3d && photo.metrics && photo.status === 'ready' && glassesSrc
        ? prepareEyewearAsset(glassesSrc, { maxDimension: 1400, backgroundThreshold: 46, feather: 18 })
        : Promise.resolve(null),
    ])
      .then(([img, glassesAsset]) => {
        if (cancelled) return;
        photoImg = img;
        // 1) Draw immediately with the pixel-based anchors.
        render(glassesAsset);
        // 2) Then refine with the AI lens-centre reading / de-rotated front-only photo
        //    (identical to the live camera path) and redraw once it arrives.
        if (glassesAsset && product) {
          void loadAiAnchors(glassesAsset, product).then(refined => {
            if (!cancelled) render(refined ?? glassesAsset);
          });
        }
      })
      .catch(() => {
        /* photo or glasses image failed to load — leave canvas as-is */
      });

    return () => {
      cancelled = true;
    };
  }, [photo, glassesSrc, product]);

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
    <div ref={hostRef} className="relative w-full h-full bg-black overflow-hidden">
      <GlassesOverlay ref={canvasRef} />
      {product?.model3d && photo.status === 'ready' && <ThreeGlassesOverlay
        modelUrl={product.model3d} metrics={photo.metrics}
        videoSize={{ width: photo.naturalWidth, height: photo.naturalHeight }}
        fitMultiplier={product.tryOnFitMultiplier} verticalOffset={product.tryOnVerticalOffset}
      />}

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
        <div className="absolute bottom-28 left-0 right-0 flex items-center justify-center gap-2 z-10">
          <button onClick={savePhoto} aria-label="บันทึกภาพลองแว่น" className="px-4 py-2 rounded-full bg-white text-[#071b4b] text-xs font-semibold flex items-center gap-1.5"><span aria-hidden="true" className="material-symbols-outlined text-[16px]">download</span>บันทึกภาพลองแว่น</button>
          <button
            onClick={onRetake}
            className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            {retakeLabel}
          </button>
        </div>
      )}
      {saveError && <div role="status" className="absolute bottom-40 left-0 right-0 text-center text-xs text-white">{saveError}</div>}
    </div>
  );
};
