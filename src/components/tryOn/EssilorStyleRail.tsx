import React from 'react';
import { Product } from '../../types';

interface Props {
  products: Product[];
  selectedId?: string;
  onSelect: (product: Product) => void;
  expanded: boolean;
  onToggle: () => void;
}

export const EssilorStyleRail: React.FC<Props> = ({ products, selectedId, onSelect, expanded, onToggle }) => {
  if (!products.length) {
    return (
      <div className="absolute left-0 right-0 bottom-0 z-30 bg-gradient-to-t from-black/85 to-black/10 pt-14 pb-4 px-5 text-white">
        <div className="flex justify-center">
          <button onClick={onToggle} className="rounded-full bg-black/60 border border-white/20 px-4 py-2 text-xs">⌃ เพิ่มเติม</button>
        </div>
        <div className="mt-3 text-center text-xs text-white/70">ระบบพร้อมใช้งาน • เพิ่มข้อมูลกรอบจาก SQL เพื่อแสดงตัวเลือก</div>
      </div>
    );
  }

  return (
    <div className={`absolute left-0 right-0 bottom-0 z-30 text-white transition-all duration-300 ${expanded ? 'bg-[#10131a]/96' : 'bg-gradient-to-t from-black/90 via-black/65 to-transparent'}`}>
      <div className="flex items-end gap-4 px-5 sm:px-8 pt-2 pb-3">
        <button onClick={onToggle} className="shrink-0 rounded-full bg-black/60 border border-white/20 px-4 py-2 text-xs backdrop-blur-md">{expanded ? '⌄ ซ่อน' : '⌃ เพิ่มเติม'}</button>
        <div className="min-w-0 pb-1">
          <div className="text-xs text-white/70">{products.find(p => p.id === selectedId)?.subtitle || 'Virtual Try-On'}</div>
          <div className="font-bold text-lg leading-tight truncate">{products.find(p => p.id === selectedId)?.name || 'เลือกกรอบแว่น'}</div>
        </div>
        <div className="ml-auto flex gap-2 overflow-x-auto no-scrollbar max-w-[72%]">
          {products.map(product => (
            <button key={product.id} onClick={() => onSelect(product)} className={`shrink-0 w-14 h-14 rounded-full border-2 overflow-hidden bg-white/90 ${product.id === selectedId ? 'border-white scale-105' : 'border-white/20 opacity-80'}`} title={product.name} aria-label={`ลองแว่น ${product.name}${product.model3d ? ' 3D' : ''}`}>
              <img src={product.images?.[0]} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      </div>
      {expanded && (
        <div className="px-5 sm:px-8 pb-5 pt-1 border-t border-white/10">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {products.map(product => (
              <button key={product.id} onClick={() => onSelect(product)} className={`shrink-0 w-28 rounded-xl p-2 bg-white ${product.id === selectedId ? 'ring-2 ring-white' : ''}`}>
                <div className="h-14 rounded-lg bg-[#f2f3f5] flex items-center justify-center overflow-hidden"><img src={product.images?.[0]} alt={product.name} className="w-full h-full object-contain" /></div>
                <div className="mt-1 text-[10px] font-semibold text-black truncate">{product.name}</div>
                {product.model3d && <span className="text-[10px] text-blue-700">ลองแว่น 3D</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
