import React from 'react';
import { Product } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (productId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !product) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-outline-variant/20 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
      >
        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">delete_forever</span>
          </div>
          <div>
            <h3 className="font-bold text-base text-on-surface">ยืนยันการลบสินค้า</h3>
            <p className="text-[11px] text-on-surface-variant">
              การดำเนินการนี้จะนำสินค้าออกจากระบบ
            </p>
          </div>
        </div>

        {/* Product Card Preview */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
          <div className="w-14 h-14 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-outline-variant/10">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-on-surface truncate">{product.name}</h4>
            <p className="text-[10px] text-on-surface-variant truncate">
              {product.colorName || product.subtitle}
            </p>
            <p className="text-xs font-black text-primary mt-0.5">
              ฿{product.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Warning Text */}
        <p className="text-xs text-on-surface-variant leading-relaxed bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-amber-900">
          ⚠️ เมื่อลบแล้ว สินค้านี้จะถูกนำออกจากหน้าร้าน รายการค้นหา และตะกร้าสินค้าของผู้ใช้ทันที
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs active:scale-95 transition-all"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(product.id);
              onClose();
            }}
            className="flex-1 h-11 rounded-xl bg-error hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            <span>ยืนยันลบสินค้า</span>
          </button>
        </div>
      </div>
    </div>
  );
};
