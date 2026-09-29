import React, { useState } from 'react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMaterial: string;
  onSelectMaterial: (material: string) => void;
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  onReset: () => void;
  resultCount: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  selectedMaterial,
  onSelectMaterial,
  minPrice,
  maxPrice,
  onPriceChange,
  onReset,
  resultCount
}) => {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const [localMaterial, setLocalMaterial] = useState(selectedMaterial);

  if (!isOpen) return null;

  const materials = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'titanium', label: 'ไทเทเนียม' },
    { id: 'acetate', label: 'อะซิเตท' },
    { id: 'tr90', label: 'TR90 ยืดหยุ่น' },
    { id: 'metal', label: 'โลหะผสม' }
  ];

  const presets = [
    { label: 'ทั้งหมด', min: 500, max: 3000 },
    { label: 'ประหยัด (≤ ฿1,200)', min: 500, max: 1200 },
    { label: 'ยอดนิยม (฿1,200 - ฿1,800)', min: 1200, max: 1800 },
    { label: 'พรีเมียม (≥ ฿1,800)', min: 1800, max: 3000 }
  ];

  const handleApply = () => {
    onSelectMaterial(localMaterial);
    onPriceChange(localMin, localMax);
    onClose();
  };

  const handleReset = () => {
    setLocalMin(500);
    setLocalMax(3000);
    setLocalMaterial('all');
    onReset();
  };

  const minPercent = Math.max(0, Math.min(100, ((localMin - 500) / (3000 - 500)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((localMax - 500) / (3000 - 500)) * 100));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[430px] max-h-[85vh] overflow-y-auto bg-surface rounded-t-3xl p-5 flex flex-col gap-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">tune</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-on-surface">ตัวกรองสินค้า</h2>
              <p className="text-[11px] text-on-surface-variant">ปรับแต่งช่วงราคาและวัสดุกรอบแว่น</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors"
            aria-label="ปิดตัวกรอง"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Price Range Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-on-surface">ช่วงราคา</span>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              ฿{localMin.toLocaleString()} – ฿{localMax.toLocaleString()}
            </span>
          </div>

          {/* Min / Max Display Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-2.5">
              <span className="text-[10px] text-on-surface-variant block mb-0.5">ราคาต่ำสุด (Min)</span>
              <span className="font-bold text-sm text-on-surface">฿{localMin.toLocaleString()}</span>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-2.5">
              <span className="text-[10px] text-on-surface-variant block mb-0.5">ราคาสูงสุด (Max)</span>
              <span className="font-bold text-sm text-on-surface">฿{localMax.toLocaleString()}</span>
            </div>
          </div>

          {/* Visual Dual Slider Track */}
          <div className="py-2 px-1">
            <div className="relative h-6 flex items-center">
              {/* Background Track */}
              <div className="absolute w-full h-2 rounded-full bg-surface-container-highest" />

              {/* Active Highlight Range */}
              <div
                className="absolute h-2 rounded-full bg-primary"
                style={{
                  left: `${minPercent}%`,
                  width: `${Math.max(0, maxPercent - minPercent)}%`
                }}
              />

              {/* Min Input Slider */}
              <input
                type="range"
                min="500"
                max="3000"
                step="50"
                value={localMin}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), localMax - 50);
                  setLocalMin(val);
                }}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer accent-primary"
                style={{ zIndex: localMin > 2500 ? 5 : 3 }}
                aria-label="ราคาต่ำสุด"
              />

              {/* Max Input Slider */}
              <input
                type="range"
                min="500"
                max="3000"
                step="50"
                value={localMax}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), localMin + 50);
                  setLocalMax(val);
                }}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer accent-primary"
                style={{ zIndex: 4 }}
                aria-label="ราคาสูงสุด"
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-medium mt-1">
              <span>฿500</span>
              <span>฿1,750</span>
              <span>฿3,000</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {presets.map((p) => {
              const isMatch = localMin === p.min && localMax === p.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setLocalMin(p.min);
                    setLocalMax(p.max);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-all active:scale-95 ${
                    isMatch
                      ? 'bg-primary text-on-primary font-bold shadow-2xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Frame Material */}
        <div className="flex flex-col gap-2.5 pt-1">
          <span className="font-semibold text-sm text-on-surface">วัสดุกรอบแว่น</span>
          <div className="flex flex-wrap gap-2">
            {materials.map((m) => {
              const isSelected = localMaterial === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLocalMaterial(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  {isSelected && (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  )}
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 h-11 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs active:scale-95 transition-all"
          >
            ล้างทั้งหมด
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-[1.4] h-11 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>ดูผลลัพธ์</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">
              {resultCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
