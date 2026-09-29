import React from 'react';
import { Product } from '../../types';

interface GlassesSelectorProps {
  products: Product[];
  selectedId: string;
  onSelect: (product: Product) => void;
}

export const GlassesSelector: React.FC<GlassesSelectorProps> = ({ products, selectedId, onSelect }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-on-surface">เลือกกรอบแว่น</span>
        <span className="text-on-surface-variant text-[11px]">แตะเพื่อเปลี่ยนทรง</span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
        {products.map((p) => {
          const isChosen = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all shrink-0 w-24 text-center ${
                isChosen
                  ? 'border-primary bg-primary-fixed/30 ring-2 ring-primary/40 shadow-sm'
                  : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/50'
              }`}
            >
              <img src={p.images[0]} alt={p.name} className="w-16 h-10 object-contain" />
              <span className="text-[10px] font-medium text-on-surface line-clamp-1">
                {p.name.replace('Big Eye ', '')}
              </span>
              <span className="text-[10px] font-bold text-primary">฿{p.price.toLocaleString()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
