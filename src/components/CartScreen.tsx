import React, { useState } from 'react';
import { CartItem, ScreenId } from '../types';

interface CartScreenProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onToggleSelectItem: (id: string) => void;
  onToggleSelectAll: (selected: boolean) => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenPrescriptionModal: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onToggleSelectItem,
  onToggleSelectAll,
  onNavigate,
  onOpenPrescriptionModal
}) => {
  const [promoCode, setPromoCode] = useState('STUDENT100');
  const [promoApplied, setPromoApplied] = useState(true);
  const [promoDiscount, setPromoDiscount] = useState(100);

  const allSelected = cartItems.length > 0 && cartItems.every((item) => item.selected);
  const selectedItems = cartItems.filter((item) => item.selected);

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const discount = promoApplied && selectedItems.length > 0 ? promoDiscount : 0;
  const netTotal = Math.max(0, subtotal - discount);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'STUDENT100' || promoCode.trim().toUpperCase() === 'BIGEYE') {
      setPromoApplied(true);
      setPromoDiscount(100);
    } else {
      alert('โค้ดส่วนลดไม่ถูกต้อง ลองใช้ "STUDENT100"');
    }
  };

  const handleRemoveSelected = () => {
    selectedItems.forEach((item) => onRemoveItem(item.id));
  };

  return (
    <div className="flex flex-col w-full pb-32">
      {/* Top Progress & Delivery Perks */}
      <div className="w-full bg-surface-container-low rounded-xl p-space-md mb-space-md flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0">
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs text-primary truncate">
              ยอดของคุณได้รับส่งฟรี EMS!
            </span>
            <span className="text-[11px] text-on-surface-variant truncate">
              จัดส่งพร้อมกล่อง Premium Boxset & ผ้าไมโครไฟเบอร์
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
          check_circle
        </span>
      </div>

      {/* Cart Header Control Bar */}
      <div className="flex items-center justify-between py-space-sm mb-space-sm">
        <label className="flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onToggleSelectAll(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shadow-sm ${
              allSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-high'
            }`}
          >
            {allSelected && (
              <span className="material-symbols-outlined text-[15px] font-bold">check</span>
            )}
          </div>
          <span className="ml-space-sm font-bold text-sm text-on-surface">
            ตะกร้าสินค้า{' '}
            <span className="text-primary font-normal text-xs">
              ({selectedItems.length} ชิ้นที่เลือก)
            </span>
          </span>
        </label>

        {selectedItems.length > 0 && (
          <button
            onClick={handleRemoveSelected}
            className="text-on-surface-variant hover:text-error transition-colors flex items-center gap-0.5 text-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            ลบที่เลือก
          </button>
        )}
      </div>

      {/* Items Stack */}
      {cartItems.length === 0 ? (
        <div className="p-8 text-center bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col items-center gap-3 my-4">
          <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[32px]">remove_shopping_cart</span>
          </div>
          <p className="font-bold text-sm text-on-surface">ไม่มีสินค้าในตะกร้า</p>
          <button
            onClick={() => onNavigate('search')}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-sm"
          >
            เลือกซื้อแว่นตา
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-space-md mb-space-lg">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="relative bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm transition-all"
            >
              <div className="flex items-start gap-space-md">
                {/* Selection Checkbox */}
                <label className="cursor-pointer pt-1 select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => onToggleSelectItem(item.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                      item.selected ? 'bg-primary text-on-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    {item.selected && (
                      <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                    )}
                  </div>
                </label>

                {/* Product Image */}
                <div className="relative w-20 h-20 rounded-lg bg-surface-container-low overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-surface-container-highest/90 backdrop-blur-xs px-1 rounded text-[9px] font-semibold text-on-surface-variant">
                    {item.product.tag || 'Blue Cut'}
                  </div>
                </div>

                {/* Details & Stepper */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-space-xs">
                    <h3 className="font-bold text-sm text-on-surface truncate leading-tight">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-outline hover:text-error transition-colors p-0.5 shrink-0 active:scale-90"
                      aria-label="ลบสินค้า"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                    สี: {item.selectedColor}
                  </p>
                  <div className="inline-flex items-center gap-1 mt-1 bg-surface-container-low px-2 py-0.5 rounded-full w-fit max-w-full">
                    <span className="material-symbols-outlined text-[12px] text-secondary">
                      verified
                    </span>
                    <span className="text-[10px] text-secondary font-medium truncate">
                      {item.lensUpgrade || item.product.lensType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-space-sm pt-space-xs">
                    <span className="font-bold text-sm text-primary">
                      ฿{item.product.price.toLocaleString()}
                    </span>
                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-surface-container-high rounded-full p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-xs active:scale-90 transition-transform text-xs"
                        aria-label="ลดจำนวน"
                      >
                        <span className="material-symbols-outlined text-[14px]">remove</span>
                      </button>
                      <span className="text-xs font-bold px-2.5 min-w-[24px] text-center text-on-surface">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-xs active:scale-90 transition-transform text-xs"
                        aria-label="เพิ่มจำนวน"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescription tag banner */}
              <div className="flex items-center justify-between bg-surface-container-low px-space-sm py-1.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    {item.hasPrescription ? 'description' : 'visibility'}
                  </span>
                  <span>{item.prescriptionNote}</span>
                </div>
                <button
                  onClick={onOpenPrescriptionModal}
                  className="text-[11px] text-primary font-semibold hover:underline"
                >
                  {item.hasPrescription ? 'แก้ไขค่าสายตา' : 'เพิ่มสายตา'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coupon Code Voucher Input Section */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            confirmation_number
          </span>
          <span className="font-bold text-sm text-on-surface">โค้ดส่วนลดและสิทธิพิเศษ</span>
        </div>
        <form onSubmit={handleApplyPromo} className="flex items-center gap-space-sm">
          <div className="relative flex-1">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="ใส่โค้ดส่วนลดนักศึกษา"
              className="w-full h-11 pl-9 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-xs uppercase tracking-wider focus:outline-none focus:bg-surface-container-high transition-colors"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              sell
            </span>
          </div>
          <button
            type="submit"
            className="h-11 px-5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
          >
            ใช้โค้ด
          </button>
        </form>

        {promoApplied && (
          <div className="mt-2.5 flex items-center justify-between bg-secondary-fixed/40 px-space-sm py-1.5 rounded-lg text-on-secondary-fixed">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-[16px] text-secondary">
                check_circle
              </span>
              <span className="text-[11px] font-semibold truncate">
                ส่วนลดพิเศษนักศึกษา ลดทันที ฿{promoDiscount}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPromoApplied(false)}
              className="text-on-secondary-fixed-variant hover:text-error transition-colors p-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}
      </div>

      {/* Order Price Summary Bento Card */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-md">
        <h4 className="font-bold text-sm text-on-surface mb-space-sm">สรุปยอดคำสั่งซื้อ</h4>
        <div className="flex flex-col gap-space-xs text-xs">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span>ยอดรวมสินค้า (Subtotal)</span>
            <span className="font-semibold text-on-surface">฿{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="flex items-center gap-1">
              ค่าจัดส่ง (Shipping)
              <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] px-1.5 py-0.2 rounded-full font-semibold">
                ฟรี
              </span>
            </span>
            <span className="text-secondary font-medium">฿0</span>
          </div>
          {promoApplied && (
            <div className="flex justify-between items-center text-rose-600">
              <span>ส่วนลดพิเศษ (Discount)</span>
              <span className="font-semibold">-฿{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="w-full h-px bg-surface-container-high my-space-xs"></div>
          <div className="flex justify-between items-baseline pt-0.5">
            <span className="font-bold text-sm text-on-surface">ยอดรวมสุทธิ (Total price)</span>
            <div className="flex flex-col items-end">
              <span className="font-bold text-[18px] text-primary">
                ฿{netTotal.toLocaleString()}
              </span>
              <span className="text-[10px] text-secondary font-medium">
                รวมภาษีมูลค่าเพิ่มแล้ว
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optical Guarantee Assurance */}
      <div className="bg-surface-container-low rounded-xl p-space-md mb-4 flex items-center gap-space-md">
        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xs text-on-surface">รับประกันความสบายตา 30 วัน</span>
          <span className="text-[11px] text-on-surface-variant">
            หากใส่แล้วมึนหรือไม่ชัด เปลี่ยนเลนส์ฟรีทันทีที่หน้าร้าน
          </span>
        </div>
      </div>

      {/* Sticky Bottom Checkout Bar (Fixed above bottom tab bar) */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl shadow-[0_-4px_20px_-2px_rgba(15,23,42,0.08)] py-3 px-margin border-t border-outline-variant/20">
        <div className="max-w-[430px] mx-auto flex items-center justify-between gap-space-md">
          {/* Price summary left */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] text-on-surface-variant">ยอดรวม</span>
              <span className="font-bold text-[18px] text-primary leading-tight">
                ฿{netTotal.toLocaleString()}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center gap-1 text-secondary text-[10px] font-semibold">
                <span className="material-symbols-outlined text-[13px]">savings</span>
                <span>ประหยัด ฿{discount}</span>
              </div>
            )}
          </div>
          {/* Proceed CTA right */}
          <button
            onClick={() => onNavigate('checkout')}
            disabled={selectedItems.length === 0}
            className="flex-1 max-w-[220px] h-12 rounded-full bg-primary disabled:opacity-50 text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-primary-container active:scale-[0.98] transition-all"
          >
            <span>ดำเนินการสั่งซื้อ ({selectedItems.length})</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
