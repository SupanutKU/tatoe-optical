import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

type TryOnTab = 'live' | 'upload' | 'video';

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
  const [showHelp, setShowHelp] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<FaceMetrics | null>(null);

  const handleLiveMetricsUpdate = useCallback((metrics: FaceMetrics | null) => setLiveMetrics(metrics), []);

  useEffect(() => {
    if (!isOpen) {
      tryOn.setMode('camera');
      glasses.clearRecommendation();
      setLiveMetrics(null);
      setTab('live');
      setShowHelp(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (currentProduct) glasses.selectProduct(currentProduct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct?.id]);

  useEffect(() => {
    if (tryOn.mode !== 'camera' || tryOn.frozenPhoto) setLiveMetrics(null);
  }, [tryOn.mode, tryOn.frozenPhoto]);

  const glassesSrc = overlayImageForProduct(glasses.selected);
  const activeMetrics = tryOn.frozenPhoto?.status === 'ready' ? tryOn.frozenPhoto.metrics : liveMetrics;
  const canAnalyze = !!activeMetrics;
  const selectedIndex = useMemo(
    () => Math.max(0, products.findIndex((product) => product.id === glasses.selected.id)),
    [products, glasses.selected.id]
  );

  if (!isOpen) return null;

  const changeTab = (next: TryOnTab) => {
    setTab(next);
    if (next === 'upload') tryOn.setMode('upload');
    else tryOn.setMode('camera');
  };

  const handleSelectProduct = (product: Product) => {
    glasses.selectProduct(product);
    onSelectProduct?.(product);
  };

  const handleConfirm = () => {
    onSelectProduct?.(glasses.selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[1180px] h-[min(94dvh,820px)] bg-[#111318] text-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        {/* Top bar */}
        <div className="h-16 shrink-0 px-4 sm:px-7 flex items-center justify-between border-b border-white/10 bg-[#14161b]">
          <button
            onClick={() => setShowHelp((value) => !value)}
            aria-label="วิธีใช้งาน"
            className="w-10 h-10 rounded-full border border-white/60 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <span className="text-lg font-semibold">?</span>
          </button>

          <div className="flex items-center gap-1 p-1 rounded-full bg-white shadow-lg">
            {([
              ['live', 'สด'],
              ['upload', 'อัปโหลด'],
              ['video', 'วิดีโอ'],
            ] as [TryOnTab, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => changeTab(value)}
                className={`px-5 sm:px-7 h-9 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  tab === value ? 'bg-[#071b4b] text-white shadow-sm' : 'text-[#0a1740] hover:bg-black/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            aria-label="ปิด"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Help */}
        {showHelp && (
          <div className="absolute z-40 top-20 left-5 sm:left-8 max-w-sm rounded-2xl bg-white text-[#151821] p-4 shadow-2xl border border-black/5">
            <p className="font-bold text-sm">วิธีลองแว่น 3D</p>
            <ol className="mt-2 text-xs leading-6 text-black/65 list-decimal pl-4">
              <li>อนุญาตการใช้กล้อง</li>
              <li>หันหน้าเข้ากล้องให้เห็นตาและจมูกชัดเจน</li>
              <li>เลือกกรอบด้านล่าง ระบบจะเปลี่ยนโมเดล 3D ทันที</li>
              <li>ลองหันซ้าย–ขวา ระบบจะหมุนกรอบตามศีรษะ</li>
            </ol>
          </div>
        )}

        {/* Main preview */}
        <div className="relative flex-1 min-h-0 bg-[#050608] overflow-hidden">
          {tab === 'upload' ? (
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
          ) : tryOn.frozenPhoto ? (
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
              product={glasses.selected}
              onCapture={(video, metrics, mirrored) => tryOn.captureFromVideo(video, metrics, mirrored)}
              onMetricsUpdate={handleLiveMetricsUpdate}
            />
          )}

          {tab === 'video' && !tryOn.frozenPhoto && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-black/45 border border-white/10 backdrop-blur-md text-[11px] text-white/90">
              โหมดวิดีโอ • ขยับศีรษะเพื่อดูมิติของกรอบ
            </div>
          )}

          {/* Product info bar */}
          <div className="absolute left-0 right-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/55 to-transparent pt-14 px-5 sm:px-7 pb-5 pointer-events-none">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-medium text-white/90 truncate">{glasses.selected.subtitle || glasses.selected.category}</p>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{glasses.selected.name}</h2>
                <p className="mt-1 text-sm font-semibold text-white/85">฿{glasses.selected.price.toLocaleString()} <span className="font-normal text-white/55">• {glasses.selected.colorName}</span></p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-white/70 shrink-0">
                <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md">3D Preview</span>
                <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md">{selectedIndex + 1}/{products.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => changeTab('live')}
            className="absolute right-5 bottom-20 z-30 w-12 h-12 rounded-full bg-white/15 border border-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/25 transition-all"
            aria-label="เปิดกล้อง"
          >
            <span className="material-symbols-outlined text-[22px]">photo_camera</span>
          </button>
        </div>

        {/* Bottom product rail */}
        <div className="shrink-0 bg-[#f8f8fa] text-[#16181d] px-4 sm:px-7 pt-3 pb-4 sm:pb-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <p className="text-[11px] text-black/45">กรอบที่เลือก</p>
              <p className="text-sm font-bold truncate max-w-[260px]">{glasses.selected.name}</p>
            </div>
            <button
              onClick={handleConfirm}
              className="shrink-0 px-4 sm:px-5 h-9 rounded-full bg-[#071b4b] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              ใช้กรอบนี้
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-black/5 px-2 py-2 shadow-sm">
            <GlassesSelector products={glasses.glasses} selectedId={glasses.selected.id} onSelect={handleSelectProduct} />
          </div>

          <div className="mt-2">
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
          </div>
        </div>
      </div>
    </div>
  );
};
