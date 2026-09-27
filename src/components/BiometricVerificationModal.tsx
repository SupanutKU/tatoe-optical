import React, { useState, useEffect } from 'react';

interface BiometricVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'enable' | 'login' | 'test';
  userName?: string;
  userEmail?: string;
}

export const BiometricVerificationModal: React.FC<BiometricVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'login',
  userName = 'คุณลูกค้า',
  userEmail = ''
}) => {
  const [status, setStatus] = useState<'scanning' | 'success' | 'error'>('scanning');
  const [sensorType, setSensorType] = useState<'face_id' | 'touch_id'>('face_id');

  useEffect(() => {
    if (!isOpen) {
      setStatus('scanning');
      return;
    }

    // Detect likely platform sensor
    const isApple = /iPhone|iPad|Macintosh/i.test(navigator.userAgent);
    setSensorType(isApple ? 'face_id' : 'touch_id');
    setStatus('scanning');

    // Simulate authentic biometric sensor interaction
    const timer = setTimeout(() => {
      setStatus('success');
      const finishTimer = setTimeout(() => {
        onSuccess();
      }, 700);
      return () => clearTimeout(finishTimer);
    }, 1400);

    return () => clearTimeout(timer);
  }, [isOpen, onSuccess]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="ยืนยันตัวตนด้วย Touch ID หรือ Face ID"
    >
      <div className="w-full max-w-[340px] bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/20 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Subtle Ambient Glow */}
        <div
          className={`absolute -top-12 -left-12 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            status === 'success'
              ? 'bg-emerald-500/20'
              : 'bg-primary/20'
          }`}
        />
        <div
          className={`absolute -bottom-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            status === 'success'
              ? 'bg-emerald-500/20'
              : 'bg-primary/20'
          }`}
        />

        {/* Biometric Sensor Icon Box */}
        <div className="relative mb-4 mt-1">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
              status === 'success'
                ? 'bg-emerald-500 text-white scale-105'
                : 'bg-gradient-to-br from-primary to-primary-container text-on-primary ring-4 ring-primary/20'
            }`}
          >
            {status === 'success' ? (
              <span
                className="material-symbols-outlined text-[44px] animate-in zoom-in duration-200"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            ) : sensorType === 'face_id' ? (
              <span className="material-symbols-outlined text-[42px] animate-pulse">
                face
              </span>
            ) : (
              <span className="material-symbols-outlined text-[42px] animate-pulse">
                fingerprint
              </span>
            )}
          </div>

          {/* Radar scan ripples */}
          {status === 'scanning' && (
            <>
              <span className="absolute inset-0 rounded-2xl border-2 border-primary animate-ping opacity-40 pointer-events-none" />
              <span className="absolute -inset-2 rounded-3xl border border-primary/40 animate-pulse pointer-events-none" />
            </>
          )}
        </div>

        {/* Title & Mode */}
        <h3 className="font-bold text-base text-on-surface">
          {status === 'success'
            ? 'ยืนยันตัวตนสำเร็จ!'
            : mode === 'enable'
            ? 'ลงทะเบียน Touch ID / Face ID'
            : mode === 'test'
            ? 'ทดสอบระบบสแกนชีวมิติ'
            : 'เข้าสู่ระบบด้วยชีวมิติ'}
        </h3>

        {/* Subtitle / Details */}
        <div className="mt-1 flex flex-col items-center">
          {userEmail && (
            <span className="text-[11px] font-semibold text-primary">
              {userEmail}
            </span>
          )}
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-[260px]">
            {status === 'success'
              ? mode === 'enable'
                ? 'เปิดใช้งาน Touch ID / Face ID สำหรับบัญชีนี้เรียบร้อยแล้ว'
                : mode === 'test'
                ? 'ระบบสแกนชีวมิติทำงานได้ตามปกติ พร้อมเข้าสู่ระบบได้ทันที'
                : `ยินดีต้อนรับกลับ คุณ${userName}`
              : sensorType === 'face_id'
              ? 'จัดตำแหน่งใบหน้าให้อยู่ในกรอบ หรือมองตรงที่หน้าจอ'
              : 'แตะนิ้วที่เซ็นเซอร์สแกนลายนิ้วมือเพื่อยืนยัน'}
          </p>
        </div>

        {/* Device hardware badge */}
        <div className="mt-4 px-3 py-1 rounded-full bg-surface-container-low text-[10px] font-medium text-on-surface-variant flex items-center gap-1.5 border border-outline-variant/20">
          <span className="material-symbols-outlined text-[13px] text-emerald-600">
            lock
          </span>
          <span>เข้ารหัสความปลอดภัยระดับฮาร์ดแวร์ (Device Biometrics)</span>
        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors active:scale-95"
        >
          {status === 'success' ? 'ตกลง' : 'ยกเลิก'}
        </button>
      </div>
    </div>
  );
};
