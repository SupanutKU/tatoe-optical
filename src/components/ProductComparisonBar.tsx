import React from 'react';
import { Product } from '../types';

interface ProductComparisonBarProps {
  comparisonProducts: Product[];
  onOpenModal: () => void;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
}

export const ProductComparisonBar: React.FC<ProductComparisonBarProps> = ({
  comparisonProducts,
  onOpenModal,
  onRemoveProduct,
  onClearAll
}) => {
  if (comparisonProducts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-[410px] animate-in slide-in-from-bottom duration-200">
      <div className="bg-surface-container-lowest/95 backdrop-blur-xl border border-primary/25 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2 ring-1 ring-black/5">
        {/* Thumbnails of selected glasses */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {comparisonProducts.map((p) => (
            <div
              key={p.id}
              className="relative w-11 h-11 rounded-xl bg-surface-container-low p-1 border border-outline-variant/30 shrink-0 flex items-center justify-center group"
            >
              <img
                src={p.images[0]}
                alt={p.name}
                className="w-full h-full object-contain mix-blend-multiply"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveProduct(p.id);
                }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error text-white flex items-center justify-center text-[10px] shadow-sm hover:scale-110 active:scale-95 transition-all"
                title={`ลบ ${p.name} ออกจากการเปรียบเทียบ`}
                aria-label={`ลบ ${p.name}`}
              >
                ×
              </button>
            </div>
          ))}

          {/* Empty slot indicators up to 3 */}
          {Array.from({ length: 3 - comparisonProducts.length }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="w-11 h-11 rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low/50 flex flex-col items-center justify-center text-[9px] text-outline shrink-0 font-medium"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>{comparisonProducts.length + idx + 1}/3</span>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-on-surface-variant hover:text-error px-1.5 py-1 font-semibold transition-colors"
            title="ล้างรายการเปรียบเทียบทั้งหมด"
          >
            ล้าง
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="px-3 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-primary-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[17px]">compare_arrows</span>
            <span>เปรียบเทียบ ({comparisonProducts.length}/3)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
