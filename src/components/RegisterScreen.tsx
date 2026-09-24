import React, { useState } from 'react';
import { APP_LOGO } from '../data/mockData';
import { ScreenId } from '../types';
import { API_REGISTER_URL, buildAuthHeaders } from '../constants/api';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigate
}) => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit =
    userName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_REGISTER_URL, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          user_name: userName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'สมัครสมาชิกไม่สำเร็จ');
      }

      onRegisterSuccess();
    } catch (error) {
      const isNetworkError = error instanceof TypeError && /fetch/i.test(error.message);
      setErrorMessage(
        isNetworkError
          ? `ติดต่อ server ไม่ได้ (${API_REGISTER_URL}) กรุณาตรวจสอบว่า backend รันอยู่หรือยัง`
          : error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full py-6 animate-in fade-in duration-300">
      <div className="w-full max-w-[360px] bg-surface-container-lowest rounded-3xl p-space-lg shadow-sm border border-outline-variant/15 flex flex-col gap-space-md">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low p-2 shadow-sm mb-2.5 flex items-center justify-center">
            <img src={APP_LOGO} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-bold text-headline-sm text-on-surface">สมัครสมาชิก</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">TATOE Optical - แว่นตาตาโต</p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px]">
            <span className="material-symbols-outlined text-[16px] mt-px">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-on-surface text-[11px]">ชื่อผู้ใช้ / ชื่อ-นามสกุล</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">person</span>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all font-sans text-xs"
              />
            </div>
          </div>

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

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-on-surface text-[11px]">เบอร์โทรศัพท์ (ไม่บังคับ)</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">call</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all font-sans text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-on-surface text-[11px]">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <label className="font-semibold text-on-surface text-[11px]">ยืนยันรหัสผ่าน</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">lock_reset</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all font-sans text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 hover:bg-primary-container transition-all mt-1 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <>
                <span>สมัครสมาชิก (Create Account)</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/20">
          มีบัญชีอยู่แล้ว?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-primary font-semibold hover:underline"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
};
