import React, { useState } from 'react';
import { MAP_IMAGE } from '../data/mockData';

interface BranchAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat?: () => void;
}

interface Branch {
  id: string;
  name: string;
  badge: string;
  address: string;
  floor: string;
  hours: string;
  phone: string;
  optometrist: string;
  status: 'open' | 'closing_soon';
}

const BRANCHES: Branch[] = [
  {
    id: 'siam',
    name: 'สาขาสยามสแควร์วัน (Flagship Store)',
    badge: 'สาขาหลัก',
    address: 'อาคารสยามสแควร์วัน ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
    floor: 'ชั้น 2 (ตรงข้ามลิฟต์แก้วฝั่ง BTS สยาม)',
    hours: 'เปิดทุกวัน 10:30 - 20:30 น.',
    phone: '02-123-4567',
    optometrist: 'ทัศนมาตรวิชาชีพ (O.D.) ประจำสาขา 2 ท่าน',
    status: 'open'
  },
  {
    id: 'ladprao',
    name: 'สาขาเซ็นทรัลพลาซา ลาดพร้าว',
    badge: 'ยอดนิยม',
    address: 'ศูนย์การค้าเซ็นทรัลพลาซา ลาดพร้าว ถนนพหลโยธิน แขวงจตุจักร กรุงเทพฯ 10900',
    floor: 'ชั้น 3 (โซนธนาคาร ใกล้บันไดเลื่อนกลาง)',
    hours: 'เปิดทุกวัน 10:00 - 21:00 น.',
    phone: '02-987-6543',
    optometrist: 'ทัศนมาตรวิชาชีพ (O.D.) ประจำสาขา 1 ท่าน',
    status: 'open'
  },
  {
    id: 'emquartier',
    name: 'สาขาเอ็มควอเทียร์ (The EmQuartier)',
    badge: 'พรีเมียม',
    address: 'ศูนย์การค้าเอ็มควอเทียร์ ถนนสุขุมวิท แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
    floor: 'อาคาร Helix ชั้น 2 (BTS พร้อมพงษ์)',
    hours: 'เปิดทุกวัน 10:30 - 20:30 น.',
    phone: '02-555-8888',
    optometrist: 'ผู้เชี่ยวชาญการฟิตติ้งเลนส์โปรเกรสซีฟ',
    status: 'open'
  }
];

const TIME_SLOTS = [
  '11:00 - 11:45 น.',
  '13:30 - 14:15 น.',
  '15:00 - 15:45 น.',
  '16:30 - 17:15 น.',
  '18:00 - 18:45 น.'
];

export const BranchAppointmentModal: React.FC<BranchAppointmentModalProps> = ({
  isOpen,
  onClose,
  onOpenChat
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('siam');
  const [selectedDate, setSelectedDate] = useState<string>('พรุ่งนี้ (17 พ.ค.)');
  const [selectedTime, setSelectedTime] = useState<string>('13:30 - 14:15 น.');
  const [customerName, setCustomerName] = useState('คุณพิชญา วงศ์สว่าง');
  const [customerPhone, setCustomerPhone] = useState('089-123-4567');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isCopiedPhone, setIsCopiedPhone] = useState(false);

  if (!isOpen) return null;

  const currentBranch = BRANCHES.find((b) => b.id === selectedBranchId) || BRANCHES[0];

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingConfirmed(true);
  };

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(currentBranch.phone);
    setIsCopiedPhone(true);
    setTimeout(() => setIsCopiedPhone(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-[420px] max-h-[92vh] bg-surface rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/20 animate-scale-up">
        {/* Header */}
        <div className="px-5 py-4 bg-surface-container-lowest border-b border-outline-variant/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-on-surface">สาขา & นัดวัดสายตาฟรี</h2>
              <p className="text-[11px] text-on-surface-variant">3 สาขาครอบคลุมใจกลางกรุงเทพฯ</p>
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

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {bookingConfirmed ? (
            /* Booking Confirmation State */
            <div className="py-6 flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-bounce">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <h3 className="font-bold text-lg text-on-surface">นัดตรวจสายตาสำเร็จแล้ว!</h3>
              <p className="text-xs text-on-surface-variant max-w-[280px]">
                ระบบส่ง SMS ยืนยันไปยังเบอร์ <span className="font-bold text-on-surface">{customerPhone}</span> เรียบร้อยแล้วค่ะ
              </p>

              <div className="w-full bg-surface-container-low rounded-2xl p-4 text-left space-y-2 border border-outline-variant/20 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant">รหัสการนัดหมาย</span>
                  <span className="font-mono font-bold text-primary">#EYE-20250517</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">สาขา</span>
                  <span className="font-bold text-on-surface text-right">{currentBranch.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">วันและเวลา</span>
                  <span className="font-bold text-secondary">{selectedDate} • {selectedTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">ผู้เข้ารับบริการ</span>
                  <span className="font-medium text-on-surface">{customerName}</span>
                </div>
              </div>

              <div className="p-3 bg-primary-fixed/25 rounded-xl border border-primary/20 text-[11px] text-on-primary-fixed-variant text-left w-full flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
                <span>กรุณามาก่อนเวลานัด 5-10 นาที หากใส่คอนแทคเลนส์ แนะนำถอดพักตาก่อนตรวจอย่างน้อย 15 นาที</span>
              </div>

              <div className="w-full pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setBookingConfirmed(false)}
                  className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  แก้ไขเวลานัด
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm active:scale-95 transition-transform"
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Branch Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                  <span>เลือกสาขาหน้าร้าน</span>
                  <span className="text-[11px] text-primary font-normal">บริการตรวจวัดสายตาฟรี</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {BRANCHES.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all border ${
                        selectedBranchId === b.id
                          ? 'bg-primary-fixed border-primary text-on-primary-fixed shadow-xs font-bold'
                          : 'bg-surface-container-low border-outline-variant/20 text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="text-[11px] truncate w-full">{b.name.split(' (')[0].replace('สาขา', '')}</span>
                      <span className="text-[9px] px-1 rounded bg-surface/60 text-primary font-semibold mt-0.5">
                        {b.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Branch Details Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/20 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-xs text-on-surface">{currentBranch.name}</h3>
                    <p className="text-[11px] text-primary font-medium mt-0.5">{currentBranch.floor}</p>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">{currentBranch.address}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                    เปิดให้บริการ
                  </span>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-outline-variant/15">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
                    <span>{currentBranch.hours}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-outline">call</span>
                    <span className="font-mono">{currentBranch.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-secondary font-medium bg-secondary/10 p-2 rounded-xl">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>{currentBranch.optometrist}</span>
                </div>

                {/* Location Map Visual Preview */}
                <div className="relative w-full h-24 rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container">
                  <img
                    src={MAP_IMAGE}
                    alt="แผนที่สาขา"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5 justify-between">
                    <span className="text-white text-[10px] font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">pin_drop</span>
                      {currentBranch.name.split(' (')[0]}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="px-2 py-1 rounded-lg bg-surface/90 text-on-surface text-[10px] font-bold flex items-center gap-1 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[12px]">content_copy</span>
                      <span>{isCopiedPhone ? 'คัดลอกเบอร์แล้ว' : 'คัดลอกเบอร์โทร'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Action Row: Call & Chat */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`tel:${currentBranch.phone.replace(/-/g, '')}`}
                    className="py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">phone_in_talk</span>
                    <span>โทรติดต่อสาขา</span>
                  </a>
                  {onOpenChat && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenChat();
                      }}
                      className="py-2 px-3 rounded-xl bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>แชทสอบถามสาขา</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Appointment Booking Form */}
              <form onSubmit={handleConfirmBooking} className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/20 space-y-3 shadow-xs">
                <div className="flex items-center gap-1.5 pb-1 border-b border-outline-variant/15">
                  <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
                  <h4 className="font-bold text-xs text-on-surface">จองคิวนัดตรวจวัดสายตา (ฟรี ไม่มีค่าใช้จ่าย)</h4>
                </div>

                {/* Date selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant">เลือกวันที่ต้องการ</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['วันนี้ (16 พ.ค.)', 'พรุ่งนี้ (17 พ.ค.)', 'มะรืนนี้ (18 พ.ค.)'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDate(d)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                          selectedDate === d
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-container-low border-outline-variant/20 text-on-surface'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-on-surface-variant">เลือกรอบเวลา</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                          selectedTime === t
                            ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                            : 'bg-surface-container-low border-outline-variant/20 text-on-surface'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-on-surface-variant">ชื่อผู้จอง</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-container-high rounded-xl text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-on-surface-variant">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      className="w-full mt-0.5 px-2.5 py-1.5 bg-surface-container-high rounded-xl text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all hover:bg-primary-container"
                >
                  <span className="material-symbols-outlined text-[18px]">event_available</span>
                  <span>ยืนยันการนัดวัดสายตากับนักทัศนมาตร</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
