import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import generatePayload from 'promptpay-qr';
import { UserProfile, CartItem, ScreenId, UserAddress } from '../types';
import { formatAddress } from '../data/mockData';
import { OPTICAL_BRANCHES } from '../data/mockClaims';
import { COUPONS, validateCoupon } from '../constants/coupons';

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
  const [selectedMethod, setSelectedMethod] = useState<'promptpay' | 'store_pickup' | 'cod'>('promptpay');
  const [selectedPickupBranch, setSelectedPickupBranch] = useState<string>(OPTICAL_BRANCHES[0].name);
  const [isShowingQrPage, setIsShowingQrPage] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(900); // 15 mins
  const [uploadedSlip, setUploadedSlip] = useState<{ name: string; url: string } | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentVerifiedSuccess, setPaymentVerifiedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrRawPayload, setQrRawPayload] = useState<string>('');
  const [showPayloadDetails, setShowPayloadDetails] = useState(false);
  const slipInputRef = useRef<HTMLInputElement>(null);
  const customSlipInputRef = useRef<HTMLInputElement>(null);

  // PromptPay Mode & Target Configuration
  const [promptPayMode, setPromptPayMode] = useState<'dynamic_qr' | 'custom_slip' | 'bank_transfer'>(() => {
    return localStorage.getItem('tatoe_custom_qr_slip_url') ? 'custom_slip' : 'dynamic_qr';
  });
  const [promptPayTarget, setPromptPayTarget] = useState<string>(() => {
    return localStorage.getItem('tatoe_promptpay_target') || '0812345678';
  });
  const [targetInput, setTargetInput] = useState<string>(promptPayTarget);
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  // Original QR Slip Image Uploaded by User ("เอา QR Code พร้อมเพย์ อันนี้ไปใส่แทน")
  const [customQrSlipUrl, setCustomQrSlipUrl] = useState<string | null>(() => {
    return localStorage.getItem('tatoe_custom_qr_slip_url') || null;
  });

  // Bank Account Number (Kasikornbank)
  const [bankAccNumber, setBankAccNumber] = useState<string>(() => {
    return localStorage.getItem('tatoe_bank_account_full') || '049-9-90820-0';
  });
  const [bankAccInput, setBankAccInput] = useState<string>(bankAccNumber);
  const [isEditingBankAcc, setIsEditingBankAcc] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // ข้อมูลโค้ดส่วนลด (ซิงค์จาก localStorage หรือเพิ่มในหน้าสั่งซื้อ)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(() => {
    try {
      const saved = localStorage.getItem('tatoe_applied_coupon');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [checkoutPromoInput, setCheckoutPromoInput] = useState('');
  const [checkoutPromoError, setCheckoutPromoError] = useState<string | null>(null);

  const addresses = user.addresses || [];
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddr?.id || '');

  const activeAddress = addresses.find((a) => a.id === selectedAddressId) || defaultAddr;

  const selectedItems = cartItems.filter((i) => i.selected);
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // กฎสำคัญ: โค้ดส่วนลด จะลดเฉพาะราคาที่สูงกว่าโค้ดส่วนลด เช่นสินค้าราคา 10 บาท โค้ดส่วนลด 100 จะไม่สามารถใช้ได้
  const isCouponEligible = Boolean(
    appliedCoupon && subtotal > appliedCoupon.discount
  );
  const discount = isCouponEligible && appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal - discount);

  const handleApplyCheckoutPromo = (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    setCheckoutPromoError(null);
    const code = (overrideCode || checkoutPromoInput).trim().toUpperCase();
    if (!code) {
      setCheckoutPromoError('กรุณากรอกโค้ดส่วนลด');
      return;
    }
    const result = validateCoupon(code, subtotal);
    if (!result.valid) {
      setCheckoutPromoError(result.error || 'ไม่สามารถใช้โค้ดส่วนลดนี้ได้');
      return;
    }
    const coupon = result.coupon!;
    setAppliedCoupon({ code: coupon.code, discount: coupon.discountAmount });
    setCheckoutPromoInput('');
    try {
      localStorage.setItem(
        'tatoe_applied_coupon',
        JSON.stringify({ code: coupon.code, discount: coupon.discountAmount })
      );
    } catch (err) {}
    showToast(`ใช้โค้ด ${coupon.code} สำเร็จ ลด ฿${coupon.discountAmount}`);
  };

  const handleRemoveCheckoutPromo = () => {
    setAppliedCoupon(null);
    setCheckoutPromoError(null);
    try {
      localStorage.removeItem('tatoe_applied_coupon');
    } catch (err) {}
    showToast('ยกเลิกโค้ดส่วนลดแล้ว');
  };

  // Countdown timer for PromptPay QR code (15 minutes)
  useEffect(() => {
    if (!isShowingQrPage) return;
    const interval = setInterval(() => {
      setQrCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isShowingQrPage]);

  // Generate real scannable PromptPay QR Code according to Bank of Thailand EMVCo Standard using promptpay-qr
  useEffect(() => {
    try {
      const clean = promptPayTarget.replace(/[^0-9]/g, '');
      const validTarget = clean.length >= 10 ? clean : '0812345678';
      const payload = generatePayload(validTarget, { amount: total > 0 ? total : undefined });
      setQrRawPayload(payload);

      QRCode.toDataURL(payload, {
        width: 360,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate real PromptPay QR code:', err);
        });
    } catch (err) {
      console.error('Failed to generate real PromptPay QR payload:', err);
    }
  }, [promptPayTarget, total]);

  const handleCustomSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCustomQrSlipUrl(dataUrl);
        setPromptPayMode('custom_slip');
        try {
          localStorage.setItem('tatoe_custom_qr_slip_url', dataUrl);
        } catch {
          // ignore quota
        }
        showToast('ติดตั้งภาพ QR Code พร้อมเพย์ของคุณเรียบร้อยแล้ว 📸');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCustomSlip = () => {
    setCustomQrSlipUrl(null);
    localStorage.removeItem('tatoe_custom_qr_slip_url');
    setPromptPayMode('dynamic_qr');
    showToast('ลบภาพ QR ออกแล้ว เปลี่ยนเป็น QR พร้อมเพย์ของระบบ');
  };

  const handleSavePromptPayTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = targetInput.trim().replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      showToast('กรุณากรอกเบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก');
      return;
    }
    setPromptPayTarget(clean);
    localStorage.setItem('tatoe_promptpay_target', clean);
    setIsEditingTarget(false);
    showToast(`อัปเดตพร้อมเพย์โอนเงินจริง: ${clean} สำเร็จ ✅`);
  };

  const handleSaveBankAcc = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = bankAccInput.trim();
    if (!clean) return;
    setBankAccNumber(clean);
    localStorage.setItem('tatoe_bank_account_full', clean);
    setIsEditingBankAcc(false);
    showToast(`อัปเดตเลขที่บัญชี: ${clean} สำเร็จ ✅`);
  };

  const handleDownloadQr = () => {
    const downloadTargetUrl = promptPayMode === 'custom_slip' && customQrSlipUrl ? customQrSlipUrl : qrDataUrl;
    if (!downloadTargetUrl) {
      showToast('กำลังเตรียม QR Code กรุณารอสักครู่...');
      return;
    }
    const a = document.createElement('a');
    a.href = downloadTargetUrl;
    a.download = `PromptPay-Tatoe-${total}THB.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('บันทึกรูปภาพ QR Code พร้อมเพย์เรียบร้อยแล้ว 📸');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    if (selectedMethod === 'promptpay') {
      // Go to dedicated PromptPay QR Code page to scan and pay
      setIsShowingQrPage(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setOrderComplete(true);
      setTimeout(() => {
        onConfirmOrder();
      }, 1000);
    }, 1200);
  };

  const handleQrPaymentPaid = () => {
    setIsVerifyingPayment(true);
    setTimeout(() => {
      setIsVerifyingPayment(false);
      setPaymentVerifiedSuccess(true);
      setTimeout(() => {
        onConfirmOrder();
      }, 1200);
    }, 1500);
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedSlip({ name: file.name, url });
      showToast('แนบรูปสลิปการโอนเงินเรียบร้อยแล้ว 📄');
    }
  };

  // =========================================================================
  // VIEW 1: Dedicated PromptPay QR Scan Screen (หน้าสแกนจ่าย QR Code / พร้อมเพย์)
  // =========================================================================
  if (isShowingQrPage) {
    return (
      <div className="flex flex-col w-full pb-36 animate-in fade-in duration-200">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-xl border border-white/20 backdrop-blur-md animate-in slide-in-from-top duration-150">
            {toastMessage}
          </div>
        )}

        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2.5 pt-1 mb-2 border-b border-outline-variant/15">
          <button
            type="button"
            onClick={() => setIsShowingQrPage(false)}
            className="flex items-center gap-1 text-on-surface hover:text-primary transition-colors text-xs font-semibold py-1.5 px-2 -ml-1 rounded-xl hover:bg-surface-container-high active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>เปลี่ยนวิธีชำระเงิน</span>
          </button>

          <h1 className="font-bold text-xs text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-[16px]">qr_code_scanner</span>
            <span>สแกน QR Code ชำระเงิน</span>
          </h1>

          <button
            type="button"
            onClick={() => setIsCancelModalOpen(true)}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1 border border-rose-200"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
            <span>ยกเลิก</span>
          </button>
        </div>

        {/* Step Progress Indicator (Step 2 - QR Payment Active) */}
        <div className="flex items-center justify-between py-2 mb-3 px-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
              <span className="material-symbols-outlined text-[12px]">check</span>
            </div>
            <span className="text-xs font-medium text-on-surface">ที่อยู่จัดส่ง</span>
          </div>
          <div className="h-[2px] flex-1 bg-primary mx-2" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold ring-4 ring-primary/20">
              2
            </div>
            <span className="text-xs font-bold text-primary">สแกนจ่าย QR</span>
          </div>
          <div className="h-[2px] flex-1 bg-surface-container-highest mx-2" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center text-[10px]">
              3
            </div>
            <span className="text-xs text-on-surface-variant">สำเร็จ</span>
          </div>
        </div>

        {/* Hidden file input for uploading original K PLUS slip screenshot */}
        <input
          type="file"
          ref={customSlipInputRef}
          accept="image/*"
          onChange={handleCustomSlipUpload}
          className="hidden"
        />

        {/* Tab Selector: Choose between Dynamic BOT PromptPay QR, User's Own QR Image, and Direct Bank Account Transfer */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-high border border-outline-variant/20 mb-3 shadow-xs">
          <button
            type="button"
            onClick={() => setPromptPayMode('dynamic_qr')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              promptPayMode === 'dynamic_qr'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
            <span>1. QR พร้อมเพย์ (ระบบสร้าง)</span>
          </button>

          <button
            type="button"
            onClick={() => setPromptPayMode('custom_slip')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              promptPayMode === 'custom_slip'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">image</span>
            <span>2. ภาพ QR ของคุณ {customQrSlipUrl && '✓'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPromptPayMode('bank_transfer')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              promptPayMode === 'bank_transfer'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
            <span>3. เลขที่บัญชี</span>
          </button>
        </div>

        {/* =========================================================================
            MODE 1: Real Scannable Bank of Thailand (BOT) Standard PromptPay QR (ระบบสร้างตามยอดเงิน)
           ========================================================================= */}
        {promptPayMode === 'dynamic_qr' && (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col mb-3 select-none animate-in fade-in duration-150">
            {/* Header: Official THAI QR PAYMENT */}
            <div className="bg-[#003865] text-white px-5 py-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2" />
                    <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="8" y="8" width="8" height="8" rx="2" fill="white" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm tracking-wider leading-none">
                    THAI QR PAYMENT
                  </span>
                  <span className="text-[10px] text-sky-200 mt-0.5">
                    มาตรฐาน ธปท. (Bank of Thailand EMVCo)
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PromptPay</span>
              </span>
            </div>

            <div className="p-5 flex flex-col items-center text-center gap-3 bg-white">
              {/* Target PromptPay Input & Guidance Notice */}
              <div className="w-full p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-left flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-extrabold text-amber-950 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-amber-700">verified_user</span>
                      <span>เบอร์พร้อมเพย์รับเงินจริง:</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-900 mt-0.5">
                      {promptPayTarget} {promptPayTarget === '0812345678' ? '(เบอร์เริ่มต้น กรุณาเปลี่ยนเป็นเบอร์จริงของคุณ)' : '(นาย ศุภณัฐ เชื้อดี)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetInput(promptPayTarget);
                      setIsEditingTarget(!isEditingTarget);
                    }}
                    className="text-[11px] font-bold text-amber-800 bg-amber-200/90 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">{isEditingTarget ? 'close' : 'edit'}</span>
                    <span>{isEditingTarget ? 'ปิด' : 'เปลี่ยนเบอร์รับเงิน'}</span>
                  </button>
                </div>

                {isEditingTarget && (
                  <form onSubmit={handleSavePromptPayTarget} className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      placeholder="กรอกเบอร์มือถือ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก"
                      className="flex-1 h-9 px-3 rounded-lg border border-amber-400 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      className="h-9 px-3 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shrink-0"
                    >
                      บันทึก & สร้าง QR
                    </button>
                  </form>
                )}

                <p className="text-[10px] text-amber-900 leading-snug">
                  ℹ️ <strong>วิธีให้โอนเงินเข้าบัญชีจริง:</strong> ธนาคารจะอนุญาตให้โอนได้เมื่อหมายเลขนี้เป็นเบอร์มือถือหรือเลขบัตร ปชช. ที่ผูกกับบัญชีธนาคารไว้จริง (หากยังไม่ได้ผูก ธนาคารจะขึ้นว่าไม่พบบัญชีปลายทาง)
                </p>
              </div>

              {/* PromptPay Official Logo Badge */}
              <div className="inline-flex flex-col items-center justify-center border-2 border-[#003865] rounded-xl px-4 py-1 bg-white shadow-2xs">
                <span className="text-[10px] font-bold text-[#003865] leading-none">พร้อมเพย์</span>
                <span className="text-sm font-black text-[#003865] tracking-tight leading-none mt-0.5">PromptPay</span>
              </div>

              {/* Real Scannable Clean QR Code (NO center icon obscuring modules) */}
              <div className="relative p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-center">
                <img
                  src={qrDataUrl}
                  alt={`พร้อมเพย์ QR Code ชำระเงิน ฿${total.toLocaleString()}`}
                  className="w-[230px] h-[230px] object-contain rounded-lg select-none"
                />
              </div>

              {/* Amount to pay badge */}
              <div className="flex flex-col items-center pt-1 border-t border-slate-100 w-full">
                <span className="text-[11px] text-slate-500 font-medium">ยอดเงินที่ต้องชำระ (Total Amount)</span>
                <div className="text-2xl font-black text-primary font-mono tracking-tight mt-0.5">
                  ฿{total.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-1 font-semibold">
                  ✓ ล็อกยอด ฿{total.toLocaleString()} ใน QR Code อัตโนมัติ สแกนแล้วขึ้นยอดเงินทันที
                </span>
              </div>

              {/* Countdown Timer */}
              <div className="w-full bg-slate-50 rounded-xl p-2.5 flex items-center justify-between border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">
                    timer
                  </span>
                  <span>เหลือเวลาทำรายการ:</span>
                </div>
                <span className="font-mono font-bold text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  {formatTimer(qrCountdown)} นาที
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 active:scale-95 transition-all shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[17px] text-primary">download</span>
                  <span>บันทึกรูป QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(promptPayTarget);
                    showToast(`คัดลอกเบอร์พร้อมเพย์: ${promptPayTarget} แล้ว 📋`);
                  }}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 active:scale-95 transition-all shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[17px] text-secondary">content_copy</span>
                  <span>คัดลอกเบอร์พร้อมเพย์</span>
                </button>
              </div>

              {/* Quick switch to upload custom QR */}
              <button
                type="button"
                onClick={() => setPromptPayMode('custom_slip')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-0.5"
              >
                <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                <span>ต้องการนำรูป QR Code จากแอปธนาคารของคุณมาใส่แทน? แตะที่นี่</span>
              </button>

              {/* EMVCo technical string toggle */}
              <button
                type="button"
                onClick={() => setShowPayloadDetails(!showPayloadDetails)}
                className="text-[10px] text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto mt-1"
              >
                <span className="material-symbols-outlined text-[13px]">code</span>
                <span>{showPayloadDetails ? 'ซ่อนรหัส EMVCo' : 'ตรวจสอบรหัสมาตรฐาน BOT EMVCo'}</span>
              </button>

              {showPayloadDetails && qrRawPayload && (
                <div className="mt-1 p-2 rounded-xl bg-slate-50 text-left text-[9px] font-mono break-all text-slate-600 border border-slate-200 select-all w-full">
                  <span className="font-bold text-slate-800 block mb-0.5">Bank of Thailand EMVCo String:</span>
                  {qrRawPayload}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 py-2.5 px-4 flex items-center justify-center gap-2 text-[11px] text-slate-600 border-t border-slate-100">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
              <span>รองรับทุกแอปธนาคาร: K PLUS, SCB EASY, Krungthai NEXT, Bangkok Bank, ttb touch</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 2: Custom PromptPay QR Code Image Uploaded by User ("เอา QR Code พร้อมเพย์ อันนี้ไปใส่แทน")
           ========================================================================= */}
        {promptPayMode === 'custom_slip' && (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col mb-3 select-none animate-in fade-in duration-150">
            {/* Header */}
            <div className="bg-[#083e60] text-white px-5 py-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="material-symbols-outlined text-[20px]">image</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm tracking-wider leading-none">
                    ภาพ QR CODE พร้อมเพย์ของคุณ
                  </span>
                  <span className="text-[10px] text-sky-200 mt-0.5">
                    สแกนตรงเข้าบัญชีธนาคารของคุณ 100%
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>My QR</span>
              </span>
            </div>

            {/* Body */}
            {customQrSlipUrl ? (
              <div className="p-5 flex flex-col items-center text-center gap-3 bg-white">
                <div className="relative p-2 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <img
                    src={customQrSlipUrl}
                    alt="รูปภาพ QR Code พร้อมเพย์ของคุณ"
                    className="w-full max-w-[280px] max-h-[380px] object-contain rounded-xl shadow-xs"
                  />
                  <div className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1 shadow-2xs">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                    <span>รูปภาพ QR Code พร้อมเพย์ของคุณ (โอนเงินเข้าบัญชีจริง 100%)</span>
                  </div>
                </div>

                {/* Amount to pay */}
                <div className="flex flex-col items-center pt-1 border-t border-slate-100 w-full">
                  <span className="text-[11px] text-slate-500 font-medium">ยอดเงินที่ต้องชำระ (Total Amount)</span>
                  <div className="text-2xl font-black text-primary font-mono tracking-tight mt-0.5">
                    ฿{total.toLocaleString()}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 active:scale-95 transition-all shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[17px] text-primary">download</span>
                    <span>บันทึกรูปภาพ QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => customSlipInputRef.current?.click()}
                    className="h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-300 active:scale-95 transition-all shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[17px] text-emerald-600">change_circle</span>
                    <span>เปลี่ยนรูปภาพใหม่</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveCustomSlip}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold mt-1"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  <span>ลบรูปภาพนี้ และสลับกลับไปใช้ QR ที่ระบบคำนวณยอดเงิน</span>
                </button>
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center text-center gap-4 bg-white">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[36px]">add_photo_alternate</span>
                </div>
                <div className="flex flex-col gap-1 max-w-[300px]">
                  <h3 className="font-bold text-sm text-slate-900">นำรูปภาพ QR Code พร้อมเพย์ของคุณมาใส่แทน</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    บันทึกภาพหน้าจอ QR รับเงินจากแอปธนาคารของคุณ (เช่น K PLUS, SCB EASY, Krungthai NEXT) แล้วนำมาใส่ที่นี่ ลูกค้าจะสแกนโอนเงินเข้าบัญชีคุณได้จริง 100%
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => customSlipInputRef.current?.click()}
                  className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>แตะเพื่อเลือกรูปภาพ QR Code จากอุปกรณ์ของคุณ</span>
                </button>

                <p className="text-[11px] text-slate-400">
                  รองรับไฟล์รูปภาพ PNG, JPG, JPEG ทุกขนาด
                </p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            MODE 3: Direct Bank Account Transfer (Kasikornbank - นาย ศุภณัฐ เชื้อดี)
           ========================================================================= */}
        {promptPayMode === 'bank_transfer' && (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col mb-3 select-none animate-in fade-in duration-150">
            {/* Header */}
            <div className="bg-[#138f2d] text-white px-5 py-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
                  K
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm tracking-wide">ธนาคารกสิกรไทย (KBank)</span>
                  <span className="text-[10px] text-emerald-100">โอนเงินตรงผ่านเลขที่บัญชีธนาคาร</span>
                </div>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">ชื่อบัญชี:</span>
                  <span className="text-sm font-extrabold text-slate-900">นาย ศุภณัฐ เชื้อดี</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                  <span className="text-[11px] font-bold text-slate-600">เลขที่บัญชี:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-black text-[#138f2d]">
                      {bankAccNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingBankAcc(!isEditingBankAcc)}
                      className="text-[10px] text-emerald-700 hover:underline font-bold"
                    >
                      {isEditingBankAcc ? 'ปิด' : 'แก้ไขเลข'}
                    </button>
                  </div>
                </div>

                {isEditingBankAcc && (
                  <form onSubmit={handleSaveBankAcc} className="flex items-center gap-1.5 pt-1.5">
                    <input
                      type="text"
                      value={bankAccInput}
                      onChange={(e) => setBankAccInput(e.target.value)}
                      placeholder="เช่น 049-9-90820-0"
                      className="flex-1 h-9 px-3 rounded-lg border border-emerald-400 bg-white text-xs font-mono text-slate-800 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="h-9 px-3 rounded-lg bg-[#138f2d] hover:bg-emerald-800 text-white text-xs font-bold shrink-0"
                    >
                      บันทึก
                    </button>
                  </form>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                  <span className="text-[11px] font-bold text-slate-600">เลขอ้างอิง:</span>
                  <span className="text-xs font-mono text-slate-700">004999082008631</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                  <span className="text-[11px] font-bold text-slate-600">ยอดที่ต้องโอน:</span>
                  <span className="text-lg font-black text-primary font-mono">฿{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(bankAccNumber.replace(/[^0-9]/g, ''));
                    showToast(`คัดลอกเลขบัญชีกสิกรไทย: ${bankAccNumber} แล้ว 📋`);
                  }}
                  className="h-11 rounded-xl bg-[#138f2d] hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[17px]">content_copy</span>
                  <span>คัดลอกเลขที่บัญชี</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`${total}`);
                    showToast(`คัดลอกยอดเงิน ฿${total} แล้ว 📋`);
                  }}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 active:scale-95 transition-all shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[17px]">payments</span>
                  <span>คัดลอกยอดเงิน</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                เปิดแอปธนาคาร &gt; เลือก <strong>โอนเงิน (Transfer)</strong> &gt; เลือก <strong>ธนาคารกสิกรไทย</strong> &gt; วางเลขบัญชีที่คัดลอกมาเพื่อโอนได้ทันที 100%
              </p>
            </div>
          </div>
        )}

        {/* Transfer Slip Upload Box (Optional but realistic) */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col gap-2.5 mb-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[17px]">
                attach_file
              </span>
              <span>หลักฐานการโอนเงิน (สลิปธนาคาร)</span>
            </span>
            <span className="text-[10px] text-on-surface-variant">(ไม่บังคับ / Optional)</span>
          </div>

          <input
            type="file"
            ref={slipInputRef}
            accept="image/*"
            onChange={handleSlipUpload}
            className="hidden"
          />

          {uploadedSlip ? (
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={uploadedSlip.url}
                  alt="สลิปที่แนบ"
                  className="w-10 h-10 object-cover rounded-lg border border-emerald-300"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-emerald-900 truncate">
                    {uploadedSlip.name}
                  </span>
                  <span className="text-[10px] text-emerald-700">แนบสลิปเรียบร้อยแล้ว</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadedSlip(null)}
                className="text-rose-600 hover:text-rose-700 text-xs font-bold px-2 py-1"
              >
                ลบ
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => slipInputRef.current?.click()}
              className="w-full h-11 border border-dashed border-outline-variant hover:border-primary rounded-xl bg-surface-container-low text-on-surface-variant hover:text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              <span>แตะเพื่อแนบรูปสลิปจากแอปธนาคาร</span>
            </button>
          )}
        </div>

        {/* Instructions Card */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15 text-[11px] text-on-surface-variant flex flex-col gap-1.5 mb-3">
          <span className="font-bold text-on-surface flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary">info</span>
            <span>ขั้นตอนการชำระเงินง่ายๆ 3 ขั้นตอน:</span>
          </span>
          <ol className="list-decimal pl-4 flex flex-col gap-1 leading-relaxed">
            <li>เปิดแอปธนาคารใดก็ได้ (K PLUS, SCB EASY, Krungthai NEXT, ttb ฯลฯ)</li>
            <li>เลือกเมนู <strong>"สแกน (Scan QR)"</strong> แล้วสแกนภาพ QR Code ด้านบน</li>
            <li>ตรวจสอบชื่อผู้รับ <strong>"บจก. ทาโทเอะ ออพติคอล"</strong> ยอดเงิน <strong>฿{total.toLocaleString()}</strong> และกดยืนยันการโอน</li>
          </ol>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md shadow-lg pb-safe border-t border-outline-variant/20">
          <div className="max-w-[430px] mx-auto px-margin py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsShowingQrPage(false)}
                className="h-12 px-3.5 rounded-xl border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-[17px]">arrow_back</span>
                <span>ย้อนกลับ</span>
              </button>

              <button
                type="button"
                onClick={handleQrPaymentPaid}
                disabled={isVerifyingPayment || paymentVerifiedSuccess}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-60"
              >
                {isVerifyingPayment ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                    <span>กำลังตรวจสอบยอดเงิน...</span>
                  </>
                ) : paymentVerifiedSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>ชำระเงินสำเร็จแล้ว!</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <span>ฉันชำระเงินเรียบร้อยแล้ว (ยืนยัน)</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-[11px] text-on-surface-variant hover:text-rose-600 transition-colors flex items-center gap-1 font-medium"
              >
                <span className="material-symbols-outlined text-[13px]">close</span>
                <span>เปลี่ยนใจ? แตะเพื่อยกเลิกคำสั่งซื้อ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {isCancelModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-surface-container-lowest rounded-3xl p-5 w-full max-w-[340px] shadow-2xl border border-outline-variant/20 flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">remove_shopping_cart</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-base text-on-surface">ต้องการยกเลิกการสั่งซื้อ?</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  รายการสินค้าในตะกร้าของคุณจะยังคงอยู่ คุณสามารถกลับมาทำรายการใหม่ได้ตลอดเวลา
                </p>
              </div>
              <div className="flex flex-col w-full gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCancelModalOpen(false);
                    setIsShowingQrPage(false);
                    onNavigate('cart');
                  }}
                  className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  <span>ใช่, ยกเลิกและกลับไปที่ตะกร้า</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs active:scale-95 transition-all"
                >
                  ทำรายการต่อ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-36">
      {/* Top Header Bar with Cancel / Back Button */}
      <div className="flex items-center justify-between pb-2.5 pt-1 mb-1 border-b border-outline-variant/15">
        <button
          type="button"
          onClick={() => setIsCancelModalOpen(true)}
          className="flex items-center gap-1 text-on-surface hover:text-primary transition-colors text-xs font-semibold py-1.5 px-2 -ml-1 rounded-xl hover:bg-surface-container-high active:scale-95"
          aria-label="ย้อนกลับไปตะกร้าสินค้า"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>กลับไปตะกร้า</span>
        </button>

        <h1 className="font-bold text-xs text-on-surface flex items-center gap-1">
          <span className="material-symbols-outlined text-primary text-[16px]">credit_card</span>
          <span>ชำระเงินและสั่งซื้อ</span>
        </h1>

        <button
          type="button"
          onClick={() => setIsCancelModalOpen(true)}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1 border border-rose-200"
          title="ยกเลิกคำสั่งซื้อกรณีเปลี่ยนใจ"
        >
          <span className="material-symbols-outlined text-[15px]">close</span>
          <span>ยกเลิก</span>
        </button>
      </div>

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

          {/* Option 2: Pay at Store (Store Pickup) - Replaces Credit/Debit Card */}
          <label
            onClick={() => setSelectedMethod('store_pickup')}
            className={`relative flex items-start gap-space-md p-space-md rounded-xl cursor-pointer transition-all ${
              selectedMethod === 'store_pickup'
                ? 'bg-secondary-fixed/30 ring-1 ring-primary/40'
                : 'bg-surface-container-low hover:bg-surface-container'
            }`}
          >
            <div
              className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedMethod === 'store_pickup'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest'
              }`}
            >
              {selectedMethod === 'store_pickup' && (
                <span className="material-symbols-outlined text-[14px]">check</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-xs text-on-surface">
                  ชำระเงินที่ร้านค้า (กรณีรับสินค้าที่ร้าน)
                </span>
                <span className="material-symbols-outlined text-[18px] text-primary">
                  storefront
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                ชำระด้วยเงินสด, สแกน QR หรือบัตรเครดิต เมื่อเดินทางมารับแว่นตาที่สาขา
              </p>

              {/* Branch Selector when Store Pickup is active */}
              {selectedMethod === 'store_pickup' && (
                <div
                  className="mt-2.5 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/25 flex flex-col gap-1.5 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <label className="text-[10px] font-bold text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-secondary">
                      location_on
                    </span>
                    <span>เลือกสาขาที่สะดวกเข้ารับสินค้าและชำระเงิน:</span>
                  </label>
                  <select
                    value={selectedPickupBranch}
                    onChange={(e) => setSelectedPickupBranch(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    {OPTICAL_BRANCHES.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-emerald-600">
                      verified
                    </span>
                    <span>พร้อมบริการตรวจวัดสายตาซ้ำ & ดัดปรับแต่งทรงแว่นฟรีโดยผู้เชี่ยวชาญ</span>
                  </div>
                </div>
              )}
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
        <div className="flex items-center justify-between mb-space-md">
          <h3 className="font-bold text-sm text-on-surface">สรุปคำสั่งซื้อ</h3>
          <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
            ลดเฉพาะยอดที่สูงกว่าโค้ด
          </span>
        </div>

        {/* Coupon Code Input / Chips in Checkout */}
        <div className="mb-3 p-3 bg-surface-container-low rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface mb-2">
            <span className="material-symbols-outlined text-primary text-[18px]">confirmation_number</span>
            <span>โค้ดส่วนลด</span>
          </div>

          <form onSubmit={handleApplyCheckoutPromo} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={checkoutPromoInput}
              onChange={(e) => setCheckoutPromoInput(e.target.value.toUpperCase())}
              placeholder="ใส่โค้ด เช่น STUDENT100"
              className="flex-1 h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="h-9 px-3 bg-secondary text-on-secondary rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shrink-0"
            >
              ใช้โค้ด
            </button>
          </form>

          {/* Quick coupon buttons */}
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {COUPONS.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleApplyCheckoutPromo(undefined, c.code)}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                  appliedCoupon?.code === c.code && isCouponEligible
                    ? 'bg-secondary text-on-secondary border-secondary font-bold'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:border-primary/50'
                }`}
              >
                {c.code} ({c.discount})
              </button>
            ))}
          </div>

          {checkoutPromoError && (
            <div className="p-2 bg-error/10 border border-error/25 rounded-md text-error text-[11px] flex items-start gap-1 font-medium mt-1.5">
              <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">error</span>
              <span>{checkoutPromoError}</span>
            </div>
          )}

          {appliedCoupon && !isCouponEligible && (
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-900 text-[11px] flex items-start gap-1 mt-1.5">
              <span className="material-symbols-outlined text-amber-600 text-[15px] shrink-0 mt-0.5">warning</span>
              <div className="flex-1">
                <span className="font-bold">โค้ด {appliedCoupon.code} (ลด ฿{appliedCoupon.discount}) ไม่สามารถใช้งานได้</span>
                <p className="text-[10px] text-amber-800 mt-0.5">
                  ราคาสินค้าต้องสูงกว่ามูลค่าโค้ดส่วนลด (ยอดสินค้า ฿{subtotal.toLocaleString()} น้อยกว่าหรือเท่ากับโค้ดส่วนลด ฿{appliedCoupon.discount} เช่น สินค้าราคา ฿10 โค้ด ฿100 จะใช้ไม่ได้)
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveCheckoutPromo}
                className="text-amber-800 hover:text-error text-xs font-bold p-0.5"
                title="ลบโค้ด"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-space-xs text-xs">
          <div className="flex justify-between text-on-surface-variant">
            <span>รวมราคาสินค้า</span>
            <span className="font-semibold text-on-surface">฿{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>ค่าจัดส่งมาตรฐาน</span>
            <span className="text-secondary font-medium">ฟรี (โปรโมชั่น)</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-primary font-semibold">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">loyalty</span>
                ส่วนลด ({appliedCoupon?.code || 'STUDENT100'})
              </span>
              <div className="flex items-center gap-1.5">
                <span>-฿{discount.toLocaleString()}</span>
                <button
                  type="button"
                  onClick={handleRemoveCheckoutPromo}
                  className="text-on-surface-variant hover:text-error text-[10px] underline ml-1"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {appliedCoupon && !isCouponEligible && (
            <div className="flex justify-between text-amber-700 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">block</span>
                ส่วนลด ({appliedCoupon.code})
              </span>
              <span className="italic">ใช้ไม่ได้ (ยอดต่ำกว่าส่วนลด)</span>
            </div>
          )}

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
        <div className="max-w-[430px] mx-auto px-margin py-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-space-md">
            <div className="flex flex-col shrink-0">
              <span className="text-[10px] text-on-surface-variant font-medium">ยอดที่ต้องชำระ</span>
              <span className="font-bold text-headline-md text-primary">
                ฿{total.toLocaleString()}
              </span>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isProcessing || orderComplete}
              className="h-12 px-3.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shrink-0 disabled:opacity-50"
              title="ยกเลิกการสั่งซื้อกรณีเปลี่ยนใจ"
            >
              <span className="material-symbols-outlined text-[17px]">close</span>
              <span>ยกเลิก</span>
            </button>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={isProcessing || orderComplete}
              className="flex-1 h-12 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-space-xs shadow-md active:scale-98 transition-all disabled:opacity-50"
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
              ) : selectedMethod === 'promptpay' ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                  <span>ไปหน้าสแกนจ่าย QR Code</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span>ยืนยันการสั่งซื้อ</span>
                </>
              )}
            </button>
          </div>

          {/* Quick text button to return to cart */}
          <div className="flex items-center justify-center pt-0.5">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-[11px] text-on-surface-variant hover:text-rose-600 transition-colors flex items-center gap-1 font-medium py-0.5"
            >
              <span className="material-symbols-outlined text-[13px]">arrow_back</span>
              <span>เปลี่ยนใจ? แตะเพื่อยกเลิกและกลับไปแก้ไขตะกร้าสินค้า</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal (กรณีเปลี่ยนใจ) */}
      {isCancelModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-container-lowest rounded-3xl p-5 w-full max-w-[340px] shadow-2xl border border-outline-variant/20 flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">remove_shopping_cart</span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-base text-on-surface">
                ต้องการยกเลิกการสั่งซื้อ?
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                สินค้า {selectedItems.length} ชิ้นในตะกร้าของคุณจะยังคงอยู่ คุณสามารถกลับมาทำรายการสั่งซื้อใหม่ได้ตลอดเวลา
              </p>
            </div>

            <div className="flex flex-col w-full gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  onNavigate('cart');
                }}
                className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                <span>ใช่, ยกเลิกและกลับไปที่ตะกร้า</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs active:scale-95 transition-all"
              >
                สั่งซื้อรายการนี้ต่อ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
