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

  const handleApply = () => {
    onSelectMaterial(localMaterial);
    onPriceChange(localMin, localMax);
    onClose();
  };

  const handleReset = () => {
    setLocalMin(500);
    setLocalMax(2500);
    setLocalMaterial('all');
    onReset();
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-surface-container-lowest rounded-t-3xl p-margin flex flex-col gap-space-md shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
            <span className="font-bold text-headline-sm text-on-surface">ตัวกรองสินค้า</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Price Range */}
        <div className="flex flex-col gap-space-sm">
          <span className="font-semibold text-label-lg text-on-surface">ช่วงราคา</span>
          <div className="flex items-center gap-space-sm">
            <div className="flex-1 bg-surface-container rounded-xl p-2.5 flex flex-col">
              <span className="text-[11px] text-on-surface-variant">ต่ำสุด</span>
              <span className="font-bold text-title-md text-on-surface">฿{localMin.toLocaleString()}</span>
            </div>
            <span className="text-outline font-bold">-</span>
            <div className="flex-1 bg-surface-container rounded-xl p-2.5 flex flex-col">
              <span className="text-[11px] text-on-surface-variant">สูงสุด</span>
              <span className="font-bold text-title-md text-on-surface">฿{localMax.toLocaleString()}</span>
            </div>
          </div>
          <input
            type="range"
            min="500"
            max="2500"
            step="100"
            value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Frame Material */}
        <div className="flex flex-col gap-space-sm">
          <span className="font-semibold text-label-lg text-on-surface">วัสดุกรอบแว่น</span>
          <div className="flex flex-wrap gap-2">
            {materials.map((m) => {
              const isSelected = localMaterial === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setLocalMaterial(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-primary-fixed text-on-primary-fixed ring-1 ring-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isSelected && (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  )}
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-space-sm pt-2">
          <button
            onClick={handleReset}
            className="flex-1 h-12 rounded-xl bg-surface-container-high text-on-surface font-semibold text-title-md active:scale-95 transition-all"
          >
            ล้างทั้งหมด
          </button>
          <button
            onClick={handleApply}
            className="flex-1 h-12 rounded-xl bg-primary text-on-primary font-bold text-title-md shadow-md active:scale-95 transition-all"
          >
            ดูผลลัพธ์ ({resultCount})
          </button>
        </div>
      </div>
    </div>
  );
};
