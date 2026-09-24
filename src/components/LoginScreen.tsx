import React, { useState } from 'react';
import { APP_LOGO } from '../data/mockData';
import { ScreenId } from '../types';
import { API_LOGIN_URL, buildAuthHeaders, saveSession, StoredSession } from '../constants/api';

interface LoginScreenProps {
  onLoginSuccess: (session: StoredSession) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigate
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = emailOrPhone.trim().length > 0 && password.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(API_LOGIN_URL, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      const session: StoredSession = { token: data.token, user: data.user };
      if (rememberMe) saveSession(session);
      onLoginSuccess(session);
    } catch (error) {
      const isNetworkError = error instanceof TypeError && /fetch/i.test(error.message);
      setErrorMessage(
        isNetworkError
          ? `ติดต่อ server ไม่ได้ (${API_LOGIN_URL}) กรุณาตรวจสอบว่า backend รันอยู่หรือยัง`
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
        {/* Logo & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low p-2 shadow-sm mb-2.5 flex items-center justify-center">
            <img src={APP_LOGO} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-bold text-headline-sm text-on-surface">เข้าสู่ระบบสมาชิก</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            TATOE Optical - แว่นตาตาโต
          </p>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px]">
            <span className="material-symbols-outlined text-[16px] mt-px">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {/* Email / phone */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-on-surface text-[11px]">
              อีเมล หรือ เบอร์โทรศัพท์
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                mail
              </span>
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                autoComplete="username"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all font-sans text-xs"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-on-surface text-[11px]">รหัสผ่าน</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-[11px] text-primary hover:underline"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

          {/* Remember me */}
          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded accent-primary"
            />
            <span className="text-[11px] text-on-surface-variant">จดจำการเข้าสู่ระบบ</span>
          </label>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 hover:bg-primary-container transition-all mt-1 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
            ) : (
              <>
                <span>เข้าสู่ระบบ (Sign In)</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Create account */}
        <div className="text-center text-[11px] text-on-surface-variant">
          ยังไม่มีบัญชี?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-primary font-semibold hover:underline"
          >
            สมัครสมาชิก
          </button>
        </div>

      </div>
    </div>
  );
};
