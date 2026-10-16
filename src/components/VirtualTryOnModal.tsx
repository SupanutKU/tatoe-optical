import React, { useCallback, useEffect, useState } from 'react';
import { Product } from '../types';
import { useVirtualTryOn } from '../hooks/useVirtualTryOn';
import { useGlasses, overlayImageForProduct } from '../hooks/useGlasses';
import { CameraView } from './tryOn/CameraView';
import { UploadView } from './tryOn/UploadView';
import { FrozenPhotoView } from './tryOn/FrozenPhotoView';
import { GlassesRecommendation } from './tryOn/GlassesRecommendation';
import { EssilorStyleRail } from './tryOn/EssilorStyleRail';
import type { FaceMetrics } from '../lib/faceGeometry';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentProduct?: Product;
  onSelectProduct?: (product: Product) => void;
}

type TryOnTab = 'live' | 'upload' | 'video';

/** Essilor-inspired interaction model: large camera, compact top mode switch,
 * floating camera controls and a collapsible horizontal frame rail. It uses
 * the user's own catalog data; no product is hard-coded here. */
export const VirtualTryOnModal: React.FC<VirtualTryOnModalProps> = ({
  isOpen,
  onClose,
  products,
  currentProduct,
  onSelectProduct,
}) => {
  const glasses = useGlasses({ products, initialProduct: currentProduct });
  const tryOn = useVirtualTryOn();
  const [tab, setTab] = useState<TryOnTab>('live');
  const [help, setHelp] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<FaceMetrics | null>(null);

  const handleMetrics = useCallback((metrics: FaceMetrics | null) => setLiveMetrics(metrics), []);

  useEffect(() => {
    if (!isOpen) {
      tryOn.setMode('camera');
      glasses.clearRecommendation();
      setLiveMetrics(null);
      setTab('live');
      setHelp(false);
      setRailExpanded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (currentProduct) glasses.selectProduct(currentProduct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct?.id]);

  const changeTab = (next: TryOnTab) => {
    setTab(next);
    setRailExpanded(false);
    if (next === 'upload') tryOn.setMode('upload');
    else tryOn.setMode('camera');
  };

  if (!isOpen) return null;

  const activeMetrics = tryOn.frozenPhoto?.status === 'ready' ? tryOn.frozenPhoto.metrics : liveMetrics;
  const glassesSrc = overlayImageForProduct(glasses.selected);
  const renderProduct = glasses.selected || undefined;

  const selectProduct = (product: Product) => {
    glasses.selectProduct(product);
    onSelectProduct?.(product);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0 sm:p-4">
      <div className="relative w-full max-w-[1240px] h-[100dvh] sm:h-[min(94dvh,860px)] bg-black overflow-hidden sm:rounded-2xl shadow-2xl">
        {/* Minimal top chrome */}
        <div className="absolute top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 sm:px-7 bg-gradient-to-b from-black/65 to-transparent">
          <button onClick={() => setHelp(v => !v)} className="w-10 h-10 rounded-full border border-white/75 text-white text-lg bg-black/20 backdrop-blur-md" aria-label="วิธีใช้">?</button>

          <div className="flex items-center gap-0.5 p-1 rounded-full bg-white shadow-lg text-[#071b4b]">
            {([['live', 'สด'], ['upload', 'อัปโหลด'], ['video', 'วิดีโอ']] as [TryOnTab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => changeTab(key)} className={`h-9 px-5 sm:px-7 rounded-full text-xs sm:text-sm font-semibold ${tab === key ? 'bg-[#061b52] text-white' : ''}`}>
                {label}
              </button>
            ))}
          </div>

          <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center" aria-label="ปิด">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {help && (
          <div className="absolute top-16 left-4 z-50 w-[min(360px,calc(100%-32px))] rounded-2xl bg-white text-[#17191f] p-4 shadow-2xl">
            <div className="font-bold text-sm">ลองแว่นเสมือนจริง</div>
            <p className="mt-1 text-xs leading-5 text-black/60">อนุญาตกล้อง แล้วหันหน้าเข้าหากล้องให้เห็นดวงตาชัดเจน ระบบจะวางกรอบตามใบหน้าโดยอัตโนมัติ ไม่ต้องกดเลือกกรอบก่อน</p>
          </div>
        )}

        <div className="absolute inset-0">
          {tab === 'upload' ? (
            <UploadView photo={tryOn.frozenPhoto} isProcessing={tryOn.isProcessingUpload} glassesSrc={glassesSrc} product={renderProduct} onFileSelected={file => tryOn.handleUploadFile(file)} onRetake={() => tryOn.retake()} />
          ) : tryOn.frozenPhoto ? (
            <FrozenPhotoView photo={tryOn.frozenPhoto} glassesSrc={glassesSrc} product={renderProduct} retakeLabel="ถ่ายใหม่" onRetake={() => tryOn.retake()} />
          ) : (
            <CameraView
              active={isOpen && tryOn.mode === 'camera'}
              product={renderProduct}
              onCapture={(video, metrics, mirrored) => tryOn.captureFromVideo(video, metrics, mirrored)}
              onMetricsUpdate={handleMetrics}
              controlsVisible={!railExpanded}
            />
          )}

          {tab === 'video' && !tryOn.frozenPhoto && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 rounded-full px-4 py-2 bg-black/45 border border-white/15 text-white/90 text-xs backdrop-blur-md">โหมดวิดีโอ • ขยับศีรษะเพื่อดูการติดตาม</div>
          )}

          <EssilorStyleRail products={products} selectedId={glasses.selected?.id} onSelect={selectProduct} expanded={railExpanded} onToggle={() => setRailExpanded(v => !v)} />
        </div>

        {activeMetrics && products.length > 0 && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-1 z-50 hidden sm:block">
            <button onClick={() => glasses.analyzeFaceShape(activeMetrics)} className="text-[10px] text-white/75 hover:text-white">แนะนำกรอบที่เหมาะกับใบหน้า</button>
          </div>
        )}

        {glasses.faceShapeResult && glasses.recommendations.length > 0 && railExpanded && (
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-white p-4 rounded-t-2xl">
            <GlassesRecommendation canAnalyze={!!activeMetrics} faceShapeResult={glasses.faceShapeResult} recommendations={glasses.recommendations} onAnalyze={() => activeMetrics && glasses.analyzeFaceShape(activeMetrics)} onDismiss={glasses.clearRecommendation} onPickProduct={selectProduct} />
          </div>
        )}
      </div>
    </div>
  );
};
