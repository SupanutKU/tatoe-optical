import React from 'react';
import { APP_LOGO } from '../data/mockData';
import { ScreenId } from '../types';

interface WelcomeScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-between min-h-[85vh] w-full py-8 text-center animate-in fade-in duration-300">
      {/* Brand Hero Visual */}
      <div className="flex flex-col items-center gap-4 mt-6">
        <div className="relative">
          <div className="w-28 h-28 rounded-3xl bg-surface-container-low shadow-lg flex items-center justify-center p-3 ring-4 ring-primary/10">
            <img
              src={APP_LOGO}
              alt="TATOE Optical - แว่นตาตาโต"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold shadow-sm">
            Est. 2025
          </span>
        </div>

        <div>
          <h1 className="font-bold text-headline-lg text-on-surface tracking-tight">
            TATOE
          </h1>
          <p className="font-bold text-title-md text-primary tracking-wide">
            TATOE Optical (แว่นตาตาโต)
          </p>
          <p className="text-xs text-on-surface-variant max-w-[280px] mx-auto mt-2 leading-relaxed">
            ร้านแว่นตาสำหรับคนรุ่นใหม่ สไตล์มินิมอล ใส่สบายตา พร้อมบริการตัดเลนส์คุณภาพสูง
          </p>
        </div>
      </div>

      {/* Feature Value Props */}
      <div className="w-full max-w-[340px] flex flex-col gap-3 my-6 text-left">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-lowest shadow-xs border border-outline-variant/15">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">eyeglasses</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-on-surface">กรอบแว่นน้ำหนักเบาพิเศษ</span>
            <span className="text-[11px] text-on-surface-variant">
              เพียง 8 กรัม ผลิตจาก Titanium & TR90 นุ่มแนบแก้ม
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-lowest shadow-xs border border-outline-variant/15">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">verified</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-on-surface">ตัดประกอบโดยผู้เชี่ยวชาญ</span>
            <span className="text-[11px] text-on-surface-variant">
              มาตรฐานคลินิกทัศนมาตรศาสตร์ แม่นยำจุดกึ่งกลางตา
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-lowest shadow-xs border border-outline-variant/15">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-on-surface">จัดส่งฟรี EMS ทั่วประเทศ</span>
            <span className="text-[11px] text-on-surface-variant">
              รับประกันโครงสร้างและเลนส์ 1 ปีเต็มจากศูนย์ไทย
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-[340px] flex flex-col gap-3">
        <button
          onClick={() => onNavigate('home')}
          className="w-full h-13 rounded-2xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all hover:bg-primary-container"
        >
          <span>เริ่มสำรวจสินค้า (Explore Now)</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>

        <button
          onClick={() => onNavigate('login')}
          className="w-full h-12 rounded-2xl bg-surface-container-high hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <span>เข้าสู่ระบบด้วยบัญชีสมาชิก</span>
        </button>
      </div>
    </div>
  );
};
