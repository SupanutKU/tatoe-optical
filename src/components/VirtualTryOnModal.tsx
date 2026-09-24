import React, { useCallback, useEffect, useState } from 'react';
import { Product } from '../types';
import { useVirtualTryOn } from '../hooks/useVirtualTryOn';
import { useGlasses, overlayImageForProduct } from '../hooks/useGlasses';
import { CameraView } from './tryOn/CameraView';
import { UploadView } from './tryOn/UploadView';
import { FrozenPhotoView } from './tryOn/FrozenPhotoView';
import { GlassesSelector } from './tryOn/GlassesSelector';
import { GlassesRecommendation } from './tryOn/GlassesRecommendation';
import type { FaceMetrics } from '../lib/faceGeometry';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentProduct?: Product;
  onSelectProduct?: (product: Product) => void;
}

export const VirtualTryOnModal: React.FC<VirtualTryOnModalProps> = ({
  isOpen,
  onClose,
  products,
  currentProduct,
  onSelectProduct,
}) => {
  const glasses = useGlasses({ products, initialProduct: currentProduct });
  const tryOn = useVirtualTryOn();
  // Latest metrics from the *live* camera feed (when there's no captured/
  // uploaded photo yet), so the recommendation button works before capture too.
  const [liveMetrics, setLiveMetrics] = useState<FaceMetrics | null>(null);
  const handleLiveMetricsUpdate = useCallback((metrics: FaceMetrics | null) => setLiveMetrics(metrics), []);

  // Reset the live/frozen state whenever the modal is closed, so reopening
  // it always starts from a clean "เปิดกล้อง" state.
  useEffect(() => {
    if (!isOpen) {
      tryOn.setMode('camera');
      glasses.clearRecommendation();
      setLiveMetrics(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (currentProduct) glasses.selectProduct(currentProduct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct?.id]);

  // Live metrics are only meaningful while the live camera view is actually
  // mounted (no frozen/captured photo, mode is "camera").
  useEffect(() => {
    if (tryOn.mode !== 'camera' || tryOn.frozenPhoto) setLiveMetrics(null);
  }, [tryOn.mode, tryOn.frozenPhoto]);

  if (!isOpen) return null;

  const glassesSrc = overlayImageForProduct(glasses.selected);
  const activeMetrics = tryOn.frozenPhoto?.status === 'ready' ? tryOn.frozenPhoto.metrics : liveMetrics;
  const canAnalyze = !!activeMetrics;

  const handleSelectProduct = (product: Product) => {
    glasses.selectProduct(product);
    if (onSelectProduct) onSelectProduct(product);
  };

  const handleConfirm = () => {
    if (onSelectProduct) onSelectProduct(glasses.selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[96dvh] sm:max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">view_in_ar</span>
            </div>
            <div>
              <h3 className="font-bold text-[16px] text-on-surface">3D Virtual Try-On</h3>
              <p className="text-[11px] text-on-surface-variant">
                ลองสวมแว่นเสมือนจริงด้วยระบบ AI Facial Tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-4 pt-3 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-container-high">
            <button
              onClick={() => tryOn.setMode('camera')}
              className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tryOn.mode === 'camera'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              เปิดกล้อง
            </button>
            <button
              onClick={() => tryOn.setMode('upload')}
              className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tryOn.mode === 'upload'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">image</span>
              อัปโหลดรูป
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="relative w-full flex-1 min-h-[320px] sm:aspect-[4/5] sm:flex-none bg-black mt-3 overflow-hidden">
          {tryOn.mode === 'camera' ? (
            tryOn.frozenPhoto ? (
              <FrozenPhotoView
                photo={tryOn.frozenPhoto}
                glassesSrc={glassesSrc}
                retakeLabel="ถ่ายใหม่"
                onRetake={() => {
                  glasses.clearRecommendation();
                  tryOn.retake();
                }}
              />
            ) : (
              <CameraView
                active={isOpen && tryOn.mode === 'camera'}
                glassesSrc={glassesSrc}
                onCapture={(video, metrics, mirrored) => tryOn.captureFromVideo(video, metrics, mirrored)}
                onMetricsUpdate={handleLiveMetricsUpdate}
              />
            )
          ) : (
            <UploadView
              photo={tryOn.frozenPhoto}
              isProcessing={tryOn.isProcessingUpload}
              glassesSrc={glassesSrc}
              onFileSelected={(file) => tryOn.handleUploadFile(file)}
              onRetake={() => {
                glasses.clearRecommendation();
                tryOn.retake();
              }}
            />
          )}

          {/* Floating Selected Glass Badge */}
          <div className="absolute bottom-16 left-3 right-3 bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-2xl shadow-lg flex items-center gap-2.5 z-10">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low p-1 flex items-center justify-center shrink-0">
              <img
                src={glasses.selected.images[0]}
                alt={glasses.selected.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[13px] text-on-surface truncate">{glasses.selected.name}</p>
              <p className="text-[11px] text-primary font-semibold">
                ฿{glasses.selected.price.toLocaleString()} • {glasses.selected.colorName}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-surface-container-lowest flex flex-col gap-3 overflow-y-auto">
          <GlassesRecommendation
            canAnalyze={canAnalyze}
            faceShapeResult={glasses.faceShapeResult}
            recommendations={glasses.recommendations}
            onAnalyze={() => {
              if (activeMetrics) glasses.analyzeFaceShape(activeMetrics);
            }}
            onDismiss={glasses.clearRecommendation}
            onPickProduct={handleSelectProduct}
          />

          <GlassesSelector
            products={glasses.glasses}
            selectedId={glasses.selected.id}
            onSelect={handleSelectProduct}
          />

          <button
            onClick={handleConfirm}
            className="w-full h-11 mt-1 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all shrink-0"
          >
            <span>เลือกกรอบแว่นรุ่นนี้ ({glasses.selected.name})</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
