import React, { useEffect, useRef, useState } from 'react';
import { APP_LOGO } from '../data/mockData';
import { ScreenId } from '../types';
import {
  API_FORGOT_PASSWORD_URL,
  API_VERIFY_OTP_URL,
  API_RESET_PASSWORD_URL,
  buildAuthHeaders
} from '../constants/api';

interface ForgotPasswordScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

type Step = 'email' | 'otp' | 'password' | 'done';

const STEPS: { key: Step; label: string }[] = [
  { key: 'email', label: 'อีเมล' },
  { key: 'otp', label: 'ยืนยัน OTP' },
  { key: 'password', label: 'รหัสผ่านใหม่' }
];

const StepIndicator: React.FC<{ current: Step }> = ({ current }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-1.5 mb-1">
      {STEPS.map((s, idx) => {
        const isDone = currentIndex > idx || current === 'done';
        const isActive = s.key === current;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  isDone
                    ? 'bg-primary text-on-primary'
                    : isActive
                      ? 'bg-primary/15 text-primary border border-primary'
                      : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-[14px]">check</span>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-[9px] ${isActive || isDone ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-8 h-px mb-4 ${isDone ? 'bg-primary' : 'bg-outline-variant/40'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(30);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setSending(true);
    try {
      const response = await fetch(API_FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'ส่งรหัส OTP ไม่สำเร็จ');
      }
      setInfoMessage(data.message);
      setStep('otp');
      startCooldown();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || verifying) return;
    setErrorMessage(null);
    setVerifying(true);
    try {
      const response = await fetch(API_VERIFY_OTP_URL, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'รหัส OTP ไม่ถูกต้อง');
      }
      setResetToken(data.resetToken);
      setStep('password');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword || submitting) return;
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(API_RESET_PASSWORD_URL, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ resetToken, newPassword })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ');
      }
      setStep('done');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full py-6 animate-in fade-in duration-300">
      <div className="w-full max-w-[360px] bg-surface-container-lowest rounded-3xl p-space-lg shadow-sm border border-outline-variant/15 flex flex-col gap-space-md">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low p-2 shadow-sm mb-2.5 flex items-center justify-center">
            <img src={APP_LOGO} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-bold text-headline-sm text-on-surface">ลืมรหัสผ่าน</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">TATOE Optical - แว่นตาตาโต</p>
        </div>

        {step !== 'done' && <StepIndicator current={step} />}

        {errorMessage && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px]">
            <span className="material-symbols-outlined text-[16px] mt-px">error</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {infoMessage && step === 'otp' && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[11px]">
            <span className="material-symbols-outlined text-[16px] mt-px">info</span>
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Step 1: email */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-3 text-xs">
            <p className="text-[11px] text-on-surface-variant">
              กรอกอีเมลที่ใช้สมัครสมาชิก ระบบจะส่งรหัส OTP 6 หลักไปให้ทางอีเมลนี้
            </p>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">อีเมล</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all font-sans text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 hover:bg-primary-container transition-all mt-1 disabled:opacity-60"
            >
              {sending ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span>ส่งรหัส OTP</span>
              )}
            </button>
          </form>
        )}

        {/* Step 2: otp */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3 text-xs">
            <p className="text-[11px] text-on-surface-variant">
              กรอกรหัส OTP 6 หลักที่ส่งไปที่ <span className="font-semibold text-on-surface">{email}</span>
            </p>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">รหัส OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full h-12 px-3 rounded-xl bg-surface-container-low text-on-surface text-center tracking-[6px] font-bold text-base focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 hover:bg-primary-container transition-all mt-1 disabled:opacity-60"
            >
              {verifying ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span>ยืนยันรหัส OTP</span>
              )}
            </button>
            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-on-surface-variant hover:underline"
              >
                ← แก้ไขอีเมล
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || sending}
                onClick={handleSendOtp as any}
                className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {cooldown > 0 ? `ส่งอีกครั้งใน ${cooldown}s` : 'ส่งรหัสอีกครั้ง'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: new password */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">รหัสผ่านใหม่</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all font-sans text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-on-surface text-[11px]">ยืนยันรหัสผ่านใหม่</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all font-sans text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 hover:bg-primary-container transition-all mt-1 disabled:opacity-60"
            >
              {submitting ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span>ตั้งรหัสผ่านใหม่</span>
              )}
            </button>
          </form>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <span className="material-symbols-outlined text-primary text-[40px]">check_circle</span>
            <p className="text-xs text-on-surface font-semibold">ตั้งรหัสผ่านใหม่สำเร็จแล้ว</p>
            <p className="text-[11px] text-on-surface-variant">กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่ของคุณ</p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 hover:bg-primary-container transition-all mt-1"
            >
              ไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        )}

        {step !== 'done' && (
          <div className="text-center pt-1 border-t border-outline-variant/20">
            <button
              onClick={() => onNavigate('login')}
              className="text-xs text-primary font-semibold hover:underline"
            >
              ← กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
