import React, { useState } from 'react';
import { APP_LOGO } from '../data/mockData';
import { ScreenId } from '../types';
import {
  getApiLoginUrl,
  buildAuthHeaders,
  saveSession,
  StoredSession,
  loadBiometricConfig,
  BiometricAuthConfig
} from '../constants/api';
import { BiometricVerificationModal } from './BiometricVerificationModal';

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

  // Biometric Quick Authentication State
  const [biometricConfig] = useState<BiometricAuthConfig | null>(() => {
    return loadBiometricConfig();
  });
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);

  const handleBiometricLoginSuccess = () => {
    if (biometricConfig?.session) {
      if (rememberMe) saveSession(biometricConfig.session);
      onLoginSuccess(biometricConfig.session);
    }
    setIsBiometricModalOpen(false);
  };

  const canSubmit = emailOrPhone.trim().length > 0 && password.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const loginUrl = getApiLoginUrl();
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          password
        })
      });

      // Read text first so a non-JSON/empty server response does not throw
      // "Unexpected end of JSON input" and hide the real backend error.
      const raw = await response.text();
      let data: any = null;

      if (raw.trim()) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(
            `เซิร์ฟเวอร์ตอบกลับไม่ใช่ JSON (HTTP ${response.status})`
          );
        }
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
          `เข้าสู่ระบบไม่สำเร็จ (HTTP ${response.status})`
        );
      }

      const session: StoredSession = { token: data.token, user: data.user };
      if (rememberMe) saveSession(session);
      onLoginSuccess(session);
    } catch (error) {
      const isNetworkError = error instanceof TypeError && /fetch/i.test(error.message);
      setErrorMessage(
        isNetworkError
          ? `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (${getApiLoginUrl()}) กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต`
          : error instanceof Error
            ? error.message
            : 'อีเมล เบอร์โทรศัพท์ หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
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
          <div className="w-20 h-20 rounded-2xl bg-surface-container-low p-1.5 shadow-sm mb-2.5 flex items-center justify-center border border-outline-variant/20 overflow-hidden ring-2 ring-primary/15">
            <img
              src={APP_LOGO}
              alt="TATOE Optical Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <h2 className="font-bold text-headline-sm text-on-surface">เข้าสู่ระบบสมาชิก</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            TATOE Optical - แว่นตาตาโต
          </p>
        </div>

        {/* Biometric Quick Login (Touch ID / Face ID) */}
        {biometricConfig?.enabled && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-surface-container-low border border-primary/25 flex flex-col gap-2.5 shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">
                    {biometricConfig.deviceType === 'touch_id' ? 'fingerprint' : 'face'}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-on-surface">เข้าสู่ระบบด่วน</p>
                  <p className="text-[10px] text-on-surface-variant truncate max-w-[160px]">
                    {biometricConfig.userName || biometricConfig.userEmail}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                {biometricConfig.deviceType === 'touch_id' ? 'Touch ID' : 'Face ID'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsBiometricModalOpen(true)}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {biometricConfig.deviceType === 'touch_id' ? 'fingerprint' : 'face'}
              </span>
              <span>สแกนเข้าสู่ระบบ (Biometric Sign In)</span>
            </button>
          </div>
        )}

        {/* Divider if biometric is available */}
        {biometricConfig?.enabled && (
          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/70">
            <span className="h-px flex-1 bg-outline-variant/20"></span>
            <span>หรือเข้าสู่ระบบด้วยรหัสผ่าน</span>
            <span className="h-px flex-1 bg-outline-variant/20"></span>
          </div>
        )}

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
            <label className="font-semibold text-on-surface text-[11px] flex items-center justify-between">
              <span>อีเมล หรือ เบอร์โทรศัพท์</span>
              {emailOrPhone.trim().length > 0 && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-in fade-in">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  <span>กรอกแล้ว</span>
                </span>
              )}
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
                placeholder="เช่น customer@tatoe.com หรือ 089xxxxxxx"
                className={`w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 transition-all font-sans text-xs ${
                  emailOrPhone.trim().length > 0
                    ? 'border-emerald-500/40 focus:ring-emerald-500'
                    : 'border-outline-variant/20 focus:ring-primary'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-on-surface text-[11px] flex items-center gap-1.5">
                <span>รหัสผ่าน</span>
                {password.trim().length > 0 && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-in fade-in">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    <span>กรอกแล้ว</span>
                  </span>
                )}
              </label>
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
                placeholder="กรอกรหัสผ่านของคุณ"
                className={`w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:ring-1 transition-all font-sans text-xs ${
                  password.trim().length > 0
                    ? 'border-emerald-500/40 focus:ring-emerald-500'
                    : 'border-outline-variant/20 focus:ring-primary'
                }`}
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
          <label className="flex items-center gap-2 cursor-pointer select-none py-0.5">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded accent-primary"
            />
            <span className="text-[11px] text-on-surface-variant">จดจำการเข้าสู่ระบบ</span>
          </label>

          {/* Dynamic Login Button: Hidden unless both fields are filled */}
          {canSubmit ? (
            <div className="animate-in fade-in zoom-in-95 duration-200 mt-1 flex flex-col gap-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 hover:bg-primary-container transition-all"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      lock_open
                    </span>
                    <span>เข้าสู่ระบบ (Sign In)</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-emerald-700 font-medium">
                ✓ ข้อมูลครบทั้ง 2 ช่อง พร้อมเข้าสู่ระบบ
              </p>
            </div>
          ) : (
            /* Interactive helper state when inputs are incomplete */
            <div className="mt-1 p-3 rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-low/70 flex flex-col items-center justify-center gap-1.5 text-center transition-all animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-amber-500">
                  lock
                </span>
                <span>
                  {!emailOrPhone.trim() && !password.trim()
                    ? 'กรุณากรอกข้อมูลให้ครบทั้ง 2 ช่องเพื่อแสดงปุ่มเข้าสู่ระบบ'
                    : !emailOrPhone.trim()
                    ? 'กรุณากรอกอีเมลหรือเบอร์โทรศัพท์'
                    : 'กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบ'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span
                  className={`px-2 py-0.5 rounded-full font-bold transition-colors ${
                    emailOrPhone.trim()
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-surface-container-high text-on-surface-variant/80 border border-outline-variant/20'
                  }`}
                >
                  1. อีเมล/เบอร์โทร {emailOrPhone.trim() ? '✓' : '...'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold transition-colors ${
                    password.trim()
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-surface-container-high text-on-surface-variant/80 border border-outline-variant/20'
                  }`}
                >
                  2. รหัสผ่าน {password.trim() ? '✓' : '...'}
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Create account */}
        <div className="text-center text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/15">
          ยังไม่มีบัญชี?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-primary font-semibold hover:underline"
          >
            สมัครสมาชิก
          </button>
        </div>
      </div>

      {/* Biometric Verification Modal */}
      <BiometricVerificationModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onSuccess={handleBiometricLoginSuccess}
        mode="login"
        userName={biometricConfig?.userName}
        userEmail={biometricConfig?.userEmail}
      />
    </div>
  );
};
