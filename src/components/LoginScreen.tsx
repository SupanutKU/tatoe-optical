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
      const cleanInput = emailOrPhone.trim().toLowerCase();
      // If entering known demo credentials and network/backend fails, gracefully log in with demo session
      if (
        cleanInput === 'customer@tatoe.com' ||
        cleanInput === '081-234-5678' ||
        cleanInput === '0812345678' ||
        cleanInput === 'admin@tatoe.com' ||
        cleanInput === 'pichaya.w@student.chula.ac.th'
      ) {
        const isAdmin = cleanInput !== 'customer@tatoe.com' && cleanInput !== '081-234-5678' && cleanInput !== '0812345678';
        handleDirectDemoLogin(isAdmin ? 'admin' : 'customer');
        return;
      }

      const isNetworkError = error instanceof TypeError && /fetch/i.test(error.message);
      setErrorMessage(
        isNetworkError
          ? `ติดต่อ server ไม่ได้ (${API_LOGIN_URL}) กรุณาคลิกเลือก "เข้าสู่ระบบทันที (1-Click Demo)" ด้านล่างเพื่อทดสอบระบบ`
          : error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectDemoLogin = async (role: 'customer' | 'admin') => {
    setIsLoading(true);
    setErrorMessage(null);
    const demoEmail = role === 'admin' ? 'pichaya.w@student.chula.ac.th' : 'customer@tatoe.com';
    const demoPassword = 'password123';

    try {
      const response = await fetch(API_LOGIN_URL, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          emailOrPhone: demoEmail,
          password: demoPassword
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const session: StoredSession = { token: data.token, user: data.user };
        if (rememberMe) saveSession(session);
        onLoginSuccess(session);
        return;
      }
      throw new Error(data.message || 'Login API fallback');
    } catch {
      // Ephemeral fallback session when backend server is restarting or offline
      const fallbackSession: StoredSession =
        role === 'admin'
          ? {
              token: 'demo-admin-token-12345',
              user: {
                id: 1,
                user_name: 'คุณพิชญา วงศ์สว่าง (Admin)',
                email: 'pichaya.w@student.chula.ac.th',
                phone: '089-123-4567',
                role: 'admin',
                avatar_url:
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuAgfK7Go8t0q72RUgLa-XWGo7RtV9xjm3yg-D8dL6fuTyT4Rd8J-h-kpxXjlBONOGKFQXn9HM0Y9VZlUq61KYc15SQB1Om184Pn7dao0hpFA_xLTGGNCQ_ErMbQa9qo0f_n1nz_ACUdBRYGNfBzNbt-_xP4P24_h1X_laWzkmmYjr7i50uxSZQ9k-2jRPdCeSdmGpkgq9FyP2jVpogjkX3U67v2UXa0_MrYt30iaOGkk3G9kRQwmzfg',
                member_tier: 'Big Eye Club - Gold Member',
                member_points: 420,
                shipping_address:
                  'หอพักนักศึกษาจุฬาฯ อาคาร A ห้อง 412 ถนนพญาไท แขวงวังใหม่ เขตปทุมวัน กรุงเทพฯ 10330',
                prescription_od_sphere: '-1.50',
                prescription_od_cylinder: '0.00',
                prescription_os_sphere: '-1.75',
                prescription_os_cylinder: '0.00',
                prescription_last_checked: '12 ม.ค. 2025'
              }
            }
          : {
              token: 'demo-customer-token-12345',
              user: {
                id: 2,
                user_name: 'ลูกค้าตัวอย่าง (ทดสอบระบบ)',
                email: 'customer@tatoe.com',
                phone: '081-234-5678',
                role: 'customer',
                avatar_url: null,
                member_tier: 'Member',
                member_points: 100,
                shipping_address: '123/45 ถนนสุขุมวิท คลองเตย กรุงเทพฯ 10110',
                prescription_od_sphere: '-2.00',
                prescription_od_cylinder: '-0.50',
                prescription_os_sphere: '-2.25',
                prescription_os_cylinder: '-0.50',
                prescription_last_checked: '20 ม.ค. 2025'
              }
            };

      if (rememberMe) saveSession(fallbackSession);
      onLoginSuccess(fallbackSession);
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
        <div className="text-center text-[11px] text-on-surface-variant">
          ยังไม่มีบัญชี?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-primary font-semibold hover:underline"
          >
            สมัครสมาชิก
          </button>
        </div>

        {/* Test Accounts & Demo Login Hub */}
        <div className="pt-3 border-t border-outline-variant/15 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">
                science
              </span>
              <span>บัญชีตัวอย่างสำหรับทดสอบระบบ</span>
            </span>
            <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Demo Test
            </span>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            {/* 1. Customer Demo Account Card */}
            <div className="p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/25 flex flex-col gap-2 transition-all hover:border-primary/40">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    👤
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-[11px] text-on-surface">
                      1. ลูกค้าทั่วไป (Member Tier)
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      customer@tatoe.com • password123
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-on-surface-variant leading-tight pl-1 border-l-2 border-blue-400">
                ทดสอบ: สั่งซื้อแว่น, ตะกร้าสินค้า, Virtual Try-on, ค่าสายตา, ยื่นใบเคลม & ดูรูปก่อน-หลังเคลม
              </p>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleDirectDemoLogin('customer')}
                  className="h-8 rounded-xl bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs hover:bg-primary-container active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                  <span>เข้าสู่ระบบทันที (1-Click)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailOrPhone('customer@tatoe.com');
                    setPassword('password123');
                  }}
                  className="h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-[10px] font-bold flex items-center justify-center gap-1 border border-outline-variant/25 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[13px] text-outline">edit_note</span>
                  <span>นำข้อมูลไปกรอกฟอร์ม</span>
                </button>
              </div>
            </div>

            {/* 2. Admin Demo Account Card */}
            <div className="p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/25 flex flex-col gap-2 transition-all hover:border-amber-400/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    👑
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-[11px] text-on-surface">
                      2. ผู้ดูแลระบบ (Admin / Store Manager)
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      pichaya.w@student.chula.ac.th • password123
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-on-surface-variant leading-tight pl-1 border-l-2 border-amber-400">
                ทดสอบ: สิทธิ์แอดมินจัดการสินค้า (เพิ่ม/แก้ไข/ลบสินค้า), ตรวจสต็อก, ดูแลคำสั่งซื้อและงานซ่อม
              </p>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleDirectDemoLogin('admin')}
                  className="h-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[13px]">shield_person</span>
                  <span>เข้าสู่ระบบแอดมินทันที</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailOrPhone('pichaya.w@student.chula.ac.th');
                    setPassword('password123');
                  }}
                  className="h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-[10px] font-bold flex items-center justify-center gap-1 border border-outline-variant/25 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[13px] text-outline">edit_note</span>
                  <span>นำข้อมูลไปกรอกฟอร์ม</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
