import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ClaimComparisonPhoto, ClaimStepId } from '../types';

interface ClaimComparisonViewerProps {
  comparisons?: ClaimComparisonPhoto[];
  claimId: string;
  productName?: string;
  currentStepId?: ClaimStepId;
}

export const ClaimComparisonViewer: React.FC<ClaimComparisonViewerProps> = ({
  comparisons = [],
  claimId,
  productName,
  currentStepId
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'toggle'>('slider');
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [toggleState, setToggleState] = useState<'before' | 'after'>('after');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const lightboxContainerRef = useRef<HTMLDivElement>(null);

  // If no comparisons provided, offer a fallback sample
  const effectiveComparisons: ClaimComparisonPhoto[] =
    comparisons && comparisons.length > 0
      ? comparisons
      : [
          {
            id: 'sample-cmp',
            partName: 'ข้อต่อขาแว่นและโครงสร้างหน้าแว่น (Frame Structure & Hinge)',
            beforeUrl:
              'https://images.unsplash.com/photo-1591076482161-42ce6da69f68?w=800&auto=format&fit=crop&q=80',
            afterUrl:
              'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
            beforeDescription:
              'ขาแว่นง้างผิดศูนย์ 115° น็อตยึดหลวมคลอน และมีรอยขูดขีดบนข้อต่อบานพับ',
            afterDescription:
              'ดัดปรับสมดุล 92° คืนรูปมาตรฐานโรงงาน เปลี่ยนน็อต Micro-Torx ชุบทองคำขาว ขันแน่น 0.15 Nm',
            technicianNote:
              'ช่างเอกชัย (Optical Master #T08): ผ่านการตั้งศูนย์ 4 จุดสัมผัสและทดสอบแรงพับ 1,000 ครั้ง',
            completedAt: '23 ก.ย. 2026',
            inspectorName: 'หัวหน้าช่าง ธีรเดช (QC Lead)'
          }
        ];

  const currentItem = effectiveComparisons[activeTab] || effectiveComparisons[0];

  // Mouse & Touch Drag Handlers for Curtain Slider
  const handleMove = useCallback((clientX: number, targetContainer: HTMLElement | null) => {
    if (!targetContainer) return;
    const rect = targetContainer.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX, isLightboxOpen ? lightboxContainerRef.current : containerRef.current);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      handleMove(e.touches[0].clientX, isLightboxOpen ? lightboxContainerRef.current : containerRef.current);
    };

    const onEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, handleMove, isLightboxOpen]);

  return (
    <section
      aria-label="เปรียบเทียบรูปภาพสินค้าก่อนและหลังเคลม"
      className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col gap-3.5 transition-all overflow-hidden"
    >
      {/* Header with Title & QC Badge */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-outline-variant/15 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary flex items-center justify-center shrink-0 shadow-2xs border border-primary/20">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_fix_high
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs font-black text-on-surface">
                เปรียบเทียบรูปภาพก่อน - หลังเคลม
              </h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 font-mono">
                Before / After
              </span>
            </div>
            <span className="text-[10px] text-on-surface-variant">
              ภาพถ่ายจริงจากห้องปฏิบัติการ TATOE Optical Lab เพื่อความโปร่งใสและตรวจสอบได้
            </span>
          </div>
        </div>

        {/* Certified QC Badge */}
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl border border-emerald-300 text-[10px] font-bold shadow-2xs">
          <span
            className="material-symbols-outlined text-[15px] text-emerald-600"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
          <span>QC รับรองคุณภาพ 100%</span>
        </div>
      </div>

      {/* Part Tabs Selector (if multiple parts) */}
      {effectiveComparisons.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-on-surface-variant shrink-0">
            จุดซ่อมแซม:
          </span>
          {effectiveComparisons.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all active:scale-95 shrink-0 border flex items-center gap-1.5 ${
                activeTab === idx
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{item.partName.split(' (')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mode Switcher Buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <span className="text-[10px] font-extrabold text-on-surface flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-primary">visibility</span>
          <span>{currentItem.partName}</span>
        </span>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center bg-surface-container p-0.5 rounded-xl border border-outline-variant/20">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
              viewMode === 'slider'
                ? 'bg-surface-container-lowest text-primary shadow-2xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="เลื่อนแถบเปรียบเทียบซ้าย-ขวา"
          >
            <span className="material-symbols-outlined text-[14px]">compare</span>
            <span>สไลเดอร์</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
              viewMode === 'side-by-side'
                ? 'bg-surface-container-lowest text-primary shadow-2xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="ดูภาพคู่กันซ้าย-ขวา"
          >
            <span className="material-symbols-outlined text-[14px]">view_column</span>
            <span>ดูคู่กัน</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('toggle')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
              viewMode === 'toggle'
                ? 'bg-surface-container-lowest text-primary shadow-2xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="สลับดูภาพเดี่ยว"
          >
            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
            <span>สลับดู</span>
          </button>
        </div>
      </div>

      {/* Main Comparison Viewport Area */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-outline-variant/25 shadow-inner">
        {/* ======================================================== */}
        {/* Mode 1: Interactive Slider (Curtain Split)                */}
        {/* ======================================================== */}
        {viewMode === 'slider' && (
          <div
            ref={containerRef}
            className="relative w-full aspect-[16/10] sm:aspect-[16/9] select-none overflow-hidden cursor-ew-resize group"
            onMouseDown={(e) => {
              setIsDragging(true);
              handleMove(e.clientX, containerRef.current);
            }}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                setIsDragging(true);
                handleMove(e.touches[0].clientX, containerRef.current);
              }
            }}
          >
            {/* Background Layer: "Before" Image */}
            <img
              src={currentItem.beforeUrl}
              alt="ภาพก่อนการเคลมซ่อมแซม"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              loading="lazy"
            />

            {/* Foreground Layer: "After" Image with Clip Path */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
            >
              <img
                src={currentItem.afterUrl}
                alt="ภาพหลังการเคลมซ่อมแซมเสร็จสมบูรณ์"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Draggable Divider Line & Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] pointer-events-none transition-none"
              style={{ left: `${sliderPos}%` }}
            >
              {/* Handle Button */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-slate-900 shadow-xl border-2 border-primary flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[18px]">
                  unfold_more
                </span>
              </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md border border-white/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>ก่อนเคลม (Before)</span>
              </span>
            </div>

            <div className="absolute top-3 right-3 pointer-events-none">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md border border-white/20 flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-[13px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span>หลังซ่อมแซม (After)</span>
              </span>
            </div>

            {/* Quick Fullscreen / Expand Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-xl bg-black/65 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-md border border-white/15"
              title="ขยายดูภาพขนาดใหญ่"
            >
              <span className="material-symbols-outlined text-[17px]">fullscreen</span>
            </button>

            {/* Bottom Slider Position Helper Bar */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-white/90 border border-white/10 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-amber-400">
                touch_app
              </span>
              <span>เลื่อนซ้าย-ขวาเพื่อเปรียบเทียบ</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* Mode 2: Side-by-Side Dual View                           */}
        {/* ======================================================== */}
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1.5 bg-surface-container">
            {/* Before Box */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-rose-300/30">
              <img
                src={currentItem.beforeUrl}
                alt="ภาพก่อนการเคลม"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[9px] font-extrabold backdrop-blur-md shadow-sm">
                  ก่อนเคลม (Before)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                title="ขยายภาพ"
              >
                <span className="material-symbols-outlined text-[15px]">zoom_in</span>
              </button>
            </div>

            {/* After Box */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-emerald-400/40">
              <img
                src={currentItem.afterUrl}
                alt="ภาพหลังการซ่อมแซม"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[9px] font-extrabold backdrop-blur-md shadow-sm">
                  หลังซ่อมแซม (After)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                title="ขยายภาพ"
              >
                <span className="material-symbols-outlined text-[15px]">zoom_in</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* Mode 3: Toggle Switch View                               */}
        {/* ======================================================== */}
        {viewMode === 'toggle' && (
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden">
            <img
              src={toggleState === 'before' ? currentItem.beforeUrl : currentItem.afterUrl}
              alt={toggleState === 'before' ? 'ก่อนเคลม' : 'หลังเคลม'}
              className="w-full h-full object-cover transition-all duration-300"
              loading="lazy"
            />

            {/* Top Status Badge */}
            <div className="absolute top-3 left-3">
              <span
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md border ${
                  toggleState === 'before'
                    ? 'bg-rose-600/90 text-white border-white/20'
                    : 'bg-emerald-600/90 text-white border-white/20'
                }`}
              >
                {toggleState === 'before' ? '🔴 สภาพก่อนเคลม (Before)' : '🟢 สภาพหลังซ่อมแซม (After)'}
              </span>
            </div>

            {/* Center Switch Button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                type="button"
                onClick={() =>
                  setToggleState((prev) => (prev === 'before' ? 'after' : 'before'))
                }
                className="pointer-events-auto px-4 py-2 rounded-2xl bg-black/75 hover:bg-black/90 text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-2 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-400">
                  swap_horiz
                </span>
                <span>
                  แตะเพื่อสลับดู {toggleState === 'before' ? 'ภาพหลังซ่อม' : 'ภาพก่อนเคลม'}
                </span>
              </button>
            </div>

            {/* Expand button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-xl bg-black/65 text-white flex items-center justify-center backdrop-blur-md transition-colors"
              title="ขยายภาพ"
            >
              <span className="material-symbols-outlined text-[17px]">fullscreen</span>
            </button>
          </div>
        )}
      </div>

      {/* Accessible Range Input slider controller */}
      {viewMode === 'slider' && (
        <div className="flex items-center gap-3 px-1">
          <span className="text-[10px] font-bold text-rose-600 shrink-0">
            ก่อน (0%)
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
            aria-label="ตำแหน่งการเปรียบเทียบภาพก่อนหลัง"
          />
          <span className="text-[10px] font-bold text-emerald-600 shrink-0">
            หลัง (100%)
          </span>
        </div>
      )}

      {/* Defect vs Repair Technical Details Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Before Info Box */}
        <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/30 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-extrabold text-[11px]">
            <span className="material-symbols-outlined text-[16px]">report_problem</span>
            <span>สภาพเดิมก่อนเคลม (Defect Diagnosis):</span>
          </div>
          <p className="text-[11px] leading-relaxed text-on-surface">
            {currentItem.beforeDescription}
          </p>
        </div>

        {/* After Info Box */}
        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <span>ผลการซ่อมแซมและเปลี่ยนสภาพ (Restoration):</span>
          </div>
          <p className="text-[11px] leading-relaxed text-on-surface">
            {currentItem.afterDescription}
          </p>
        </div>
      </div>

      {/* Technician Lab Note & Inspector Certification */}
      {currentItem.technicianNote && (
        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">
                engineering
              </span>
              <span className="text-[11px] font-bold text-on-surface">
                บันทึกช่างเทคนิคห้องปฏิบัติการ (Lab Technician Report):
              </span>
            </div>

            {currentItem.completedAt && (
              <span className="text-[10px] text-on-surface-variant font-mono flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">event</span>
                <span>{currentItem.completedAt}</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-on-surface leading-relaxed pl-5 border-l-2 border-primary/40 italic">
            "{currentItem.technicianNote}"
          </p>

          {currentItem.inspectorName && (
            <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-[10px] text-on-surface-variant">
              <span>ผู้ตรวจรับรองมาตรฐาน QC:</span>
              <span className="font-bold text-on-surface flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{currentItem.inspectorName}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* Lightbox Modal (Full Resolution View)                     */}
      {/* ======================================================== */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/15">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-amber-400">
                zoom_in
              </span>
              <div className="flex flex-col">
                <h4 className="text-xs font-bold">{currentItem.partName}</h4>
                <span className="text-[10px] text-white/70">
                  {claimId} • {productName || 'TATOE Eyewear'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-white/10 rounded-xl p-1 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                  className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center"
                  title="ซูมออก"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="text-[10px] font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center"
                  title="ซูมเข้า"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomLevel(1);
                }}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white"
                aria-label="ปิดมุมมองขยาย"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Lightbox Body with Slider */}
          <div className="flex-1 relative flex items-center justify-center overflow-auto p-2">
            <div
              ref={lightboxContainerRef}
              className="relative max-w-4xl w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize select-none border border-white/20"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              onMouseDown={(e) => {
                setIsDragging(true);
                handleMove(e.clientX, lightboxContainerRef.current);
              }}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  setIsDragging(true);
                  handleMove(e.touches[0].clientX, lightboxContainerRef.current);
                }
              }}
            >
              {/* Before */}
              <img
                src={currentItem.beforeUrl}
                alt="ก่อนเคลม"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* After with Clip Path */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
              >
                <img
                  src={currentItem.afterUrl}
                  alt="หลังเคลม"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {/* Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_15px_rgba(0,0,0,0.9)] pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-slate-900 shadow-2xl border-2 border-primary flex items-center justify-center pointer-events-auto">
                  <span className="material-symbols-outlined text-[20px]">
                    unfold_more
                  </span>
                </div>
              </div>

              <div className="absolute top-4 left-4 pointer-events-none">
                <span className="px-3 py-1 rounded-xl bg-rose-600/90 text-white text-[11px] font-black uppercase backdrop-blur-md shadow-md">
                  ก่อนเคลม (Before)
                </span>
              </div>

              <div className="absolute top-4 right-4 pointer-events-none">
                <span className="px-3 py-1 rounded-xl bg-emerald-600/90 text-white text-[11px] font-black uppercase backdrop-blur-md shadow-md">
                  หลังซ่อมแซม (After)
                </span>
              </div>
            </div>
          </div>

          {/* Lightbox Footer Slider Controller */}
          <div className="max-w-md mx-auto w-full pt-3 flex items-center gap-3 text-white">
            <span className="text-[10px] font-bold text-rose-400">ก่อน (0%)</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-white/20 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-bold text-emerald-400">หลัง (100%)</span>
          </div>
        </div>
      )}
    </section>
  );
};
