import React, { useState } from 'react';
import { UserProfile, CartItem, ScreenId, UserAddress } from '../types';
import { formatAddress } from '../data/mockData';

interface CheckoutScreenProps {
  user: UserProfile;
  cartItems: CartItem[];
  onConfirmOrder: () => void;
  onOpenPrescriptionModal: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  user,
  cartItems,
  onConfirmOrder,
  onOpenPrescriptionModal,
  onNavigate
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'promptpay' | 'card' | 'cod'>('promptpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const addresses = user.addresses || [];
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddr?.id || '');

  const activeAddress = addresses.find((a) => a.id === selectedAddressId) || defaultAddr;

  const selectedItems = cartItems.filter((i) => i.selected);
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const discount = 100;
  const total = Math.max(0, subtotal - discount);

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setOrderComplete(true);
      setTimeout(() => {
        onConfirmOrder();
      }, 1000);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full pb-32">
      {/* Step Progress Indicator */}
      <div className="flex items-center justify-between py-space-md mb-space-sm px-2">
        <div className="flex items-center gap-space-xs">
          <div className="w-6 h-6 rounded-full bg-surface-container-high text-primary flex items-center justify-center text-[12px] font-bold">
            <span className="material-symbols-outlined text-[14px]">check</span>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">ที่อยู่</span>
        </div>
        <div className="flex-1 h-[2px] mx-space-xs bg-primary/30"></div>
        <div className="flex items-center gap-space-xs">
          <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[11px] font-bold shadow-sm">
            2
          </div>
          <span className="text-xs text-primary font-bold">ชำระเงิน</span>
        </div>
        <div className="flex-1 h-[2px] mx-space-xs bg-surface-container-high"></div>
        <div className="flex items-center gap-space-xs">
          <div className="w-6 h-6 rounded-full bg-surface-container-high text-outline flex items-center justify-center text-[11px] font-bold">
            3
          </div>
          <span className="text-xs text-outline font-medium">สำเร็จ</span>
        </div>
      </div>

      {/* Delivery Address Section */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-md border border-outline-variant/15">
        <div className="flex items-center justify-between mb-space-xs">
          <div className="flex items-center gap-space-xs text-primary">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-on-surface">ที่อยู่จัดส่ง</span>
              {activeAddress && (
                <>
                  {activeAddress.type === 'home' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-900 border border-amber-500/25 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">home</span>
                      บ้าน
                    </span>
                  )}
                  {activeAddress.type === 'office' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/25 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">domain</span>
                      บริษัท
                    </span>
                  )}
                  {activeAddress.type === 'other' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">location_on</span>
                      อื่นๆ
                    </span>
                  )}
                  {activeAddress.isDefault && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-on-primary">
                      ที่อยู่หลัก
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddressModalOpen(true)}
            className="text-xs font-semibold text-primary hover:text-primary-container transition-colors py-1 px-2.5 rounded-lg bg-surface-container-low flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
            <span>เปลี่ยน</span>
          </button>
        </div>
        <div className="pl-7">
          <p className="font-bold text-sm text-on-surface mb-0.5">
            {activeAddress ? activeAddress.recipientName : user.name}{' '}
            <span className="text-xs text-on-surface-variant font-normal font-mono">
              ({activeAddress ? activeAddress.phone : user.phone})
            </span>
          </p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {activeAddress ? formatAddress(activeAddress) : user.shippingAddress}
          </p>
          <div className="mt-space-xs inline-flex items-center gap-1 text-[11px] text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded-full font-medium">
            <span className="material-symbols-outlined text-[13px]">bolt</span>
            จัดส่งด่วนโดย Kerry Express (1-2 วัน)
          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
      {isAddressModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddressModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] border border-outline-variant/20 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 px-5 border-b border-outline-variant/15 bg-surface-container-low/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  pin_drop
                </span>
                <h2 className="font-bold text-base text-on-surface">เลือกที่อยู่จัดส่ง</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex flex-col gap-2.5 max-h-[60vh]">
              {addresses.map((addr) => {
                const isSelected = (activeAddress?.id || defaultAddr?.id) === addr.id;

                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddressId(addr.id);
                      setIsAddressModalOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-primary-fixed/20 border-primary shadow-xs'
                        : 'bg-surface-container-low/60 border-outline-variant/20 hover:border-outline-variant/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {addr.type === 'home' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-900 border border-amber-500/25 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">home</span>
                            บ้าน
                          </span>
                        )}
                        {addr.type === 'office' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/25 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">domain</span>
                            บริษัท
                          </span>
                        )}
                        {addr.type === 'other' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            อื่นๆ
                          </span>
                        )}
                        <span className="font-bold text-xs text-on-surface">{addr.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {addr.isDefault && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary text-on-primary">
                            ที่อยู่หลัก
                          </span>
                        )}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-primary bg-primary text-on-primary'
                              : 'border-outline-variant'
                          }`}
                        >
                          {isSelected && (
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-on-surface font-semibold">
                      {addr.recipientName}{' '}
                      <span className="font-normal text-on-surface-variant font-mono">
                        ({addr.phone})
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {formatAddress(addr)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 px-4 border-t border-outline-variant/15 bg-surface-container-low/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsAddressModalOpen(false);
                  onNavigate('profile');
                }}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">edit_location_alt</span>
                <span>จัดการที่อยู่ทั้งหมด / เพิ่มที่อยู่ใหม่</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="py-1.5 px-3 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Note Section */}
      <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm mb-space-md flex items-center justify-between">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">visibility</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-on-surface">แนบใบวัดสายตาแล้ว</span>
              <span
                className="material-symbols-outlined text-[16px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <p className="text-xs text-primary font-semibold mt-0.5">
              ค่าสายตา: OD {user.prescription.od.sphere}, OS {user.prescription.os.sphere}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenPrescriptionModal}
          className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-primary shadow-sm transition-transform active:scale-95"
          aria-label="แก้ไขค่าสายตา"
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
        </button>
      </div>

      {/* Order Items Preview */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-md">
        <div className="flex items-center justify-between mb-space-md">
          <span className="font-bold text-sm text-on-surface">
            รายการสินค้า ({selectedItems.length} ชิ้น)
          </span>
          <span className="text-[11px] text-secondary bg-surface-container-high px-2 py-0.5 rounded-full font-semibold">
            เลนส์บลูบล็อกพรีเมียม
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {selectedItems.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-space-md ${
                idx > 0 ? 'pt-3 border-t border-outline-variant/20' : ''
              }`}
            >
              <div className="w-16 h-16 rounded-xl bg-surface-container-low p-1.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-on-surface truncate">
                  {item.product.name}
                </h4>
                <p className="text-[11px] text-on-surface-variant truncate">
                  {item.lensUpgrade || item.product.lensType}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-outline">จำนวน x {item.quantity}</span>
                  <span className="font-bold text-xs text-primary">
                    ฿{item.product.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-md">
        <h3 className="font-bold text-sm text-on-surface mb-space-md">วิธีการชำระเงิน</h3>
        <div className="flex flex-col gap-space-sm">
          {/* Option 1: Mobile Banking / PromptPay (Recommended) */}
          <label
            onClick={() => setSelectedMethod('promptpay')}
            className={`relative flex items-start gap-space-md p-space-md rounded-xl cursor-pointer transition-all ${
              selectedMethod === 'promptpay'
                ? 'bg-secondary-fixed/30 ring-1 ring-primary/40'
                : 'bg-surface-container-low hover:bg-surface-container'
            }`}
          >
            <div
              className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedMethod === 'promptpay'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest'
              }`}
            >
              {selectedMethod === 'promptpay' && (
                <span className="material-symbols-outlined text-[14px]">check</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-xs text-on-surface">พร้อมเพย์ / QR Code</span>
                <span className="text-[10px] font-semibold bg-primary text-on-primary px-2 py-0.5 rounded-full">
                  แนะนำ
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                สแกนจ่ายได้ทันที ทุกแอปธนาคาร ไม่มีค่าธรรมเนียม
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-[10px] font-semibold text-secondary shadow-xs">
                  PromptPay
                </span>
                <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-[10px] font-semibold text-secondary shadow-xs">
                  K PLUS
                </span>
                <span className="px-2 py-0.5 bg-surface-container-lowest rounded text-[10px] font-semibold text-secondary shadow-xs">
                  SCB EASY
                </span>
              </div>
            </div>
          </label>

          {/* Option 2: Credit / Debit Card */}
          <label
            onClick={() => setSelectedMethod('card')}
            className={`relative flex items-start gap-space-md p-space-md rounded-xl cursor-pointer transition-all ${
              selectedMethod === 'card'
                ? 'bg-secondary-fixed/30 ring-1 ring-primary/40'
                : 'bg-surface-container-low hover:bg-surface-container'
            }`}
          >
            <div
              className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedMethod === 'card'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest'
              }`}
            >
              {selectedMethod === 'card' && (
                <span className="material-symbols-outlined text-[14px]">check</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-xs text-on-surface">บัตรเครดิต / เดบิต</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  credit_card
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Visa, Mastercard, JCB และ UnionPay
              </p>
            </div>
          </label>

          {/* Option 3: Cash on Delivery */}
          <label
            onClick={() => setSelectedMethod('cod')}
            className={`relative flex items-start gap-space-md p-space-md rounded-xl cursor-pointer transition-all ${
              selectedMethod === 'cod'
                ? 'bg-secondary-fixed/30 ring-1 ring-primary/40'
                : 'bg-surface-container-low hover:bg-surface-container'
            }`}
          >
            <div
              className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedMethod === 'cod'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest'
              }`}
            >
              {selectedMethod === 'cod' && (
                <span className="material-symbols-outlined text-[14px]">check</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-xs text-on-surface">เก็บเงินปลายทาง (COD)</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  local_shipping
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                ชำระเงินสดกับเจ้าหน้าที่จัดส่งพัสดุเมื่อได้รับสินค้า
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-lg">
        <h3 className="font-bold text-sm text-on-surface mb-space-md">สรุปคำสั่งซื้อ</h3>
        <div className="flex flex-col gap-space-xs text-xs">
          <div className="flex justify-between text-on-surface-variant">
            <span>รวมราคาสินค้า</span>
            <span className="font-semibold text-on-surface">฿{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>ค่าจัดส่งมาตรฐาน</span>
            <span className="text-secondary font-medium">ฟรี (โปรโมชั่น)</span>
          </div>
          <div className="flex justify-between text-primary font-semibold">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">loyalty</span>
              ส่วนลดลูกค้าใหม่
            </span>
            <span>-฿{discount}</span>
          </div>
          <div className="h-[1px] bg-surface-container-high my-space-xs"></div>
          <div className="flex justify-between items-baseline pt-1">
            <span className="font-bold text-sm text-on-surface">ยอดชำระสุทธิ</span>
            <div className="text-right">
              <span className="font-bold text-[18px] text-primary">
                ฿{total.toLocaleString()}
              </span>
              <p className="text-[10px] text-on-surface-variant font-normal">
                รวมภาษีมูลค่าเพิ่มแล้ว
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center justify-around py-space-sm px-space-md rounded-xl bg-surface-container-low mb-space-sm text-on-surface-variant text-xs">
        <div className="flex items-center gap-1 font-semibold">
          <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
          รับประกันแท้ 100%
        </div>
        <div className="flex items-center gap-1 font-semibold">
          <span className="material-symbols-outlined text-[16px] text-primary">
            published_with_changes
          </span>
          เปลี่ยนฟรีใน 14 วัน
        </div>
      </div>

      {/* Sticky Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md shadow-lg pb-safe border-t border-outline-variant/20">
        <div className="max-w-[430px] mx-auto px-margin py-3 flex items-center gap-space-md">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant">ยอดที่ต้องชำระ</span>
            <span className="font-bold text-headline-md text-primary">
              ฿{total.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || orderComplete}
            className="flex-1 h-12 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-space-xs shadow-md active:scale-98 transition-all"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
                <span>กำลังดำเนินการ...</span>
              </>
            ) : orderComplete ? (
              <>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>สั่งซื้อสำเร็จ!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>ยืนยันการสั่งซื้อ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
