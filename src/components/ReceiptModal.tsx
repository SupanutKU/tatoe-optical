import React, { useState } from 'react';
import { APP_LOGO } from '../data/mockData';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  orderId = '#BEY-2025058'
}) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
            <h3 className="font-bold text-[16px] text-on-surface">
              ใบเสร็จรับเงินอิเล็กทรอนิกส์ (e-Receipt)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 text-xs font-sans">
          {/* Shop Branding */}
          <div className="flex items-start justify-between pb-3 border-b border-dashed border-outline-variant">
            <div className="flex items-center gap-2.5">
              <img
                src={APP_LOGO}
                alt="Logo"
                className="w-10 h-10 object-contain rounded-lg bg-surface-container-low p-1"
              />
              <div>
                <p className="font-bold text-sm text-primary">บริษัท TATOE Optical จำกัด</p>
                <p className="text-[11px] text-on-surface-variant">
                  สาขาสยามสแควร์ เลขผู้เสียภาษี: 0105568019283
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  โทร: 02-123-4567 • www.bigeyeoptical.com
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ชำระแล้ว
              </span>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface-container-low p-3 rounded-xl">
            <div>
              <span className="text-on-surface-variant block">เลขที่คำสั่งซื้อ:</span>
              <span className="font-bold text-on-surface">{orderId}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block">วันที่สั่งซื้อ:</span>
              <span className="font-medium text-on-surface">14 พ.ค. 2025 10:30 น.</span>
            </div>
            <div>
              <span className="text-on-surface-variant block">ผู้สั่งซื้อ:</span>
              <span className="font-medium text-on-surface">คุณพิชญา วงศ์สว่าง</span>
            </div>
            <div>
              <span className="text-on-surface-variant block">การชำระเงิน:</span>
              <span className="font-medium text-on-surface">บัตรเครดิต ••4820</span>
            </div>
          </div>

          {/* Line items table */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-bold text-on-surface border-b border-outline-variant/30 pb-1">
              <span>รายการสินค้า</span>
              <span>จำนวนเงิน</span>
            </div>

            <div className="flex justify-between items-start py-1">
              <div className="flex-1 pr-2">
                <p className="font-semibold text-on-surface">1. Big Eye Urban Black (Titanium Edition)</p>
                <p className="text-[10px] text-on-surface-variant">
                  สีกรอบ: Matte Black • เลนส์ Auto Blue 1.60 (ตัดแสงฟ้า 99%)
                </p>
                <p className="text-[10px] text-primary">ค่าสายตา R: -1.75 | L: -2.00</p>
              </div>
              <span className="font-semibold text-on-surface">฿1,290</span>
            </div>

            <div className="flex justify-between items-start py-1 border-t border-outline-variant/20">
              <div className="flex-1 pr-2">
                <p className="font-semibold text-on-surface">2. Big Eye Classic 01 (Multi-Coat)</p>
                <p className="text-[10px] text-on-surface-variant">
                  สีกรอบ: Tortoise Gold • เลนส์ใสตัดแสงสะท้อน
                </p>
                <p className="text-[10px] text-on-surface-variant">ไม่มีค่าสายตา (เลนส์แฟชั่น)</p>
              </div>
              <span className="font-semibold text-on-surface">฿990</span>
            </div>
          </div>

          {/* Financial Calculation */}
          <div className="flex flex-col gap-1.5 pt-3 border-t border-dashed border-outline-variant text-[11px]">
            <div className="flex justify-between text-on-surface-variant">
              <span>ยอดรวมสินค้า (Subtotal)</span>
              <span>฿2,280</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>ค่าจัดส่งด่วน EMS</span>
              <span className="text-secondary font-medium">฿0 (ฟรี)</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>ส่วนลดรหัส STUDENT100</span>
              <span>-฿100</span>
            </div>
            <div className="flex justify-between font-bold text-[14px] text-primary pt-1 border-t border-outline-variant/30">
              <span>ยอดชำระสุทธิ (Net Total)</span>
              <span>฿2,180</span>
            </div>
            <p className="text-[10px] text-on-surface-variant text-right">
              (รวมภาษีมูลค่าเพิ่ม 7% จำนวน ฿142.62 แล้ว)
            </p>
          </div>

          {/* Warranty & Guarantee notice */}
          <div className="p-3 bg-secondary-fixed/40 rounded-xl flex items-center gap-2 text-on-secondary-fixed">
            <span className="material-symbols-outlined text-[20px] text-secondary">verified_user</span>
            <div className="text-[10px] leading-tight">
              <span className="font-bold block">รับประกันโครงสร้างและเลนส์ 1 ปีเต็ม</span>
              นำใบเสร็จนี้หรือหมายเลขคำสั่งซื้อเข้ารับบริการปรับแต่งทรงแว่นและทำความสะอาดอัลตราโซนิกได้ฟรีทุกสาขา
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">
              {downloaded ? 'check' : 'download'}
            </span>
            <span>{downloaded ? 'บันทึกไฟล์ PDF แล้ว' : 'บันทึก PDF'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 h-11 rounded-xl bg-surface-container-highest text-on-surface font-semibold text-xs active:scale-98 transition-all"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
