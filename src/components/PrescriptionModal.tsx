import React, { useState } from 'react';
import { Prescription } from '../types';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription;
  onSave: (updated: Prescription) => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  prescription,
  onSave
}) => {
  const [odSph, setOdSph] = useState(prescription.od.sphere);
  const [osSph, setOsSph] = useState(prescription.os.sphere);
  const [odCyl, setOdCyl] = useState(prescription.od.cylinder || '0.00');
  const [osCyl, setOsCyl] = useState(prescription.os.cylinder || '0.00');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      od: { sphere: odSph, cylinder: odCyl },
      os: { sphere: osSph, cylinder: osCyl },
      lastChecked: 'วันนี้ (อัปเดตล่าสุด)'
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">eyeglasses</span>
            <h3 className="font-bold text-[16px] text-on-surface">
              บันทึกค่าสายตา (Prescription)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4 text-xs">
          <p className="text-on-surface-variant text-[12px] leading-relaxed">
            ระบุค่าสายตาสั้น/ยาว (SPH) และเอียง (CYL) เพื่อให้ช่างประกอบเลนส์ตัดแว่นได้อย่างแม่นยำตรงค่าสายตาของคุณ
          </p>

          {/* OD (Right Eye) */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                OD (ตาขวา - Oculus Dexter)
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">ข้างขวา</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface font-semibold block mb-1">
                  ค่าสายตา SPH (สั้น - / ยาว +)
                </label>
                <input
                  type="text"
                  value={odSph}
                  onChange={(e) => setOdSph(e.target.value)}
                  placeholder="-1.50"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 font-mono font-bold text-sm text-primary focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-on-surface font-semibold block mb-1">
                  ค่าสายตาเอียง CYL
                </label>
                <input
                  type="text"
                  value={odCyl}
                  onChange={(e) => setOdCyl(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 font-mono text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* OS (Left Eye) */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-secondary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                OS (ตาซ้าย - Oculus Sinister)
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">ข้างซ้าย</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface font-semibold block mb-1">
                  ค่าสายตา SPH (สั้น - / ยาว +)
                </label>
                <input
                  type="text"
                  value={osSph}
                  onChange={(e) => setOsSph(e.target.value)}
                  placeholder="-1.75"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 font-mono font-bold text-sm text-secondary focus:border-secondary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-on-surface font-semibold block mb-1">
                  ค่าสายตาเอียง CYL
                </label>
                <input
                  type="text"
                  value={osCyl}
                  onChange={(e) => setOsCyl(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 font-mono text-sm text-on-surface focus:border-secondary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Upload Button */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary-fixed/30 text-on-primary-fixed">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">photo_camera</span>
              <span className="text-[11px]">หรือถ่ายรูปใบวัดสายตาจากคลินิก</span>
            </div>
            <button
              type="button"
              className="px-2.5 py-1 bg-primary text-on-primary rounded-lg text-[11px] font-semibold active:scale-95 transition-transform"
            >
              อัปโหลดรูป
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-surface-container-high text-on-surface font-semibold text-xs active:scale-98 transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">
                {savedSuccess ? 'check' : 'save'}
              </span>
              <span>{savedSuccess ? 'บันทึกเรียบร้อย!' : 'บันทึกค่าสายตา'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
