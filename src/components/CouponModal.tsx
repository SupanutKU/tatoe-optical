import React, { useState } from 'react';
import { COUPONS } from '../constants/coupons';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: 'search' | 'checkout' | 'home') => void;
}

export const CouponModal: React.FC<CouponModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode((curr) => (curr === code ? null : curr));
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-[400px] max-h-[90vh] bg-surface rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/20 animate-scale-up">
        {/* Header */}
        <div className="px-5 py-4 bg-surface-container-lowest border-b border-outline-variant/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-on-surface">คูปองส่วนลดของฉัน</h2>
              <p className="text-[11px] text-on-surface-variant">มีคูปองพร้อมใช้งาน 3 ใบ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors active:scale-90"
            aria-label="ปิดหน้าต่าง"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Terms notice */}
        <div className="mx-4 mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs text-amber-900">
          <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">info</span>
          <div className="leading-snug">
            <span className="font-bold">เงื่อนไขการใช้โค้ดส่วนลด:</span>
            <p className="text-[11px] text-amber-800 mt-0.5">
              โค้ดส่วนลดจะลดเฉพาะคำสั่งซื้อที่มียอดสินค้าสูงกว่ามูลค่าโค้ดเท่านั้น เช่น สินค้าราคา ฿10 โค้ดส่วนลด ฿100 จะไม่สามารถใช้ได้
            </p>
          </div>
        </div>

        {/* Coupons List */}
        <div className="p-4 overflow-y-auto space-y-3 no-scrollbar">
          {COUPONS.map((coupon) => {
            const isCopied = copiedCode === coupon.code;

            return (
              <div
                key={coupon.code}
                className="relative bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/20 shadow-xs flex flex-col gap-2.5 overflow-hidden"
              >
                {/* Left decorative punch holes */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface"></div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface"></div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 inline-block mb-1">
                      {coupon.tag}
                    </span>
                    <h3 className="font-bold text-xs text-on-surface leading-tight">{coupon.title}</h3>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                      {coupon.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-sm text-primary block">{coupon.discount}</span>
                    <span className="text-[10px] text-outline">{coupon.minSpendText}</span>
                  </div>
                </div>

                {/* Code Voucher Bar & Copy Action */}
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-outline-variant/30 text-xs">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-on-surface bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[14px] text-primary">sell</span>
                    <span>{coupon.code}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-on-surface-variant">{coupon.expires}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-2xs ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-primary text-on-primary hover:bg-primary-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isCopied ? 'check' : 'content_copy'}
                      </span>
                      <span>{isCopied ? 'คัดลอกแล้ว' : 'ใช้โค้ด'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant/15 flex items-center justify-between text-xs">
          <span className="text-[11px] text-on-surface-variant">คัดลอกโค้ดไปกรอกในหน้าชำระเงิน</span>
          {onNavigate && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('search');
              }}
              className="px-3 py-1.5 rounded-xl bg-surface-container-highest text-primary font-bold hover:underline"
            >
              ไปเลือกแว่นตา
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
