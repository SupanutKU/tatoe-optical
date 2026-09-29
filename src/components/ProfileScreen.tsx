import React, { useState } from 'react';
import { UserProfile, ScreenId, UserAddress } from '../types';
import { AddressModal } from './AddressModal';
import { BranchAppointmentModal } from './BranchAppointmentModal';
import { CouponModal } from './CouponModal';
import { MemberBenefitsModal } from './MemberBenefitsModal';
import { BiometricVerificationModal } from './BiometricVerificationModal';
import { formatAddress } from '../data/mockData';
import {
  loadBiometricConfig,
  saveBiometricConfig,
  clearBiometricConfig,
  BiometricAuthConfig
} from '../constants/api';

/**
 * Helper to check whether a prescription's lastChecked date is older than 1 year.
 */
export const isPrescriptionDateOutdated = (lastChecked?: string): boolean => {
  if (!lastChecked || !lastChecked.trim()) return false;

  const normalized = lastChecked.trim().toLowerCase();

  // If marked as today / recently updated, it is fresh
  if (
    normalized.includes('วันนี้') ||
    normalized.includes('เมื่อวาน') ||
    normalized.includes('ล่าสุด') ||
    normalized.includes('today') ||
    normalized.includes('just now')
  ) {
    return false;
  }

  const ONE_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Standard ISO/RFC date string parsing
  const parsedTimestamp = Date.parse(normalized);
  if (!isNaN(parsedTimestamp)) {
    return now - parsedTimestamp > ONE_YEAR_MS;
  }

  // Thai short and full month names
  const THAI_MONTHS: Record<string, number> = {
    'ม.ค.': 0, 'มกราคม': 0, 'jan': 0, 'january': 0,
    'ก.พ.': 1, 'กุมภาพันธ์': 1, 'feb': 1, 'february': 1,
    'มี.ค.': 2, 'มีนาคม': 2, 'mar': 2, 'march': 2,
    'เม.ย.': 3, 'เมษายน': 3, 'apr': 3, 'april': 3,
    'พ.ค.': 4, 'พฤษภาคม': 4, 'may': 4,
    'มิ.ย.': 5, 'มิถุนายน': 5, 'jun': 5, 'june': 5,
    'ก.ค.': 6, 'กรกฎาคม': 6, 'jul': 6, 'july': 6,
    'ส.ค.': 7, 'สิงหาคม': 7, 'aug': 7, 'august': 7,
    'ก.ย.': 8, 'กันยายน': 8, 'sep': 8, 'september': 8,
    'ต.ค.': 9, 'ตุลาคม': 9, 'oct': 9, 'october': 9,
    'พ.ย.': 10, 'พฤศจิกายน': 10, 'nov': 10, 'november': 10,
    'ธ.ค.': 11, 'ธันวาคม': 11, 'dec': 11, 'december': 11
  };

  for (const [mName, mIdx] of Object.entries(THAI_MONTHS)) {
    if (normalized.includes(mName)) {
      const yearMatch = normalized.match(/\b(19\d\d|20\d\d|25\d\d)\b/);
      const dayMatch = normalized.match(/\b(\d{1,2})\b/);

      if (yearMatch) {
        let year = parseInt(yearMatch[1], 10);
        if (year > 2400) year -= 543; // Convert Buddhist Era (พ.ศ.) to Common Era (ค.ศ.)
        const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
        const dateObj = new Date(year, mIdx, day);
        return now - dateObj.getTime() > ONE_YEAR_MS;
      }
    }
  }

  // Fallback: check 4-digit year
  const yearOnlyMatch = normalized.match(/\b(19\d\d|20\d\d|25\d\d)\b/);
  if (yearOnlyMatch) {
    let year = parseInt(yearOnlyMatch[1], 10);
    if (year > 2400) year -= 543;
    const currentYear = new Date().getFullYear();
    return currentYear - year >= 1;
  }

  return false;
};

interface ProfileScreenProps {
  user: UserProfile;
  wishlistCount: number;
  onOpenPrescriptionModal: () => void;
  onNavigate: (screen: ScreenId) => void;
  onLogout: () => void;
  onOpenAddProduct?: () => void;
  onResetProducts?: () => void;
  onAddAddress?: (newAddr: Omit<UserAddress, 'id'>) => void;
  onUpdateAddress?: (updatedAddr: UserAddress) => void;
  onDeleteAddress?: (addressId: string) => void;
  onSetDefaultAddress?: (addressId: string) => void;
  onOpenChat?: () => void;
  unreadChatCount?: number;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  wishlistCount,
  onOpenPrescriptionModal,
  onNavigate,
  onLogout,
  onOpenAddProduct,
  onResetProducts,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  onOpenChat,
  unreadChatCount = 0
}) => {
  const isAdmin = user.role === 'admin';
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isMemberBenefitsModalOpen, setIsMemberBenefitsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const addresses: UserAddress[] = user.addresses || [];
  const isPrescriptionOutdated = isPrescriptionDateOutdated(user.prescription?.lastChecked);

  // Biometric Authentication (Touch ID / Face ID) State
  const [biometricConfig, setBiometricConfig] = useState<BiometricAuthConfig | null>(() => {
    return loadBiometricConfig();
  });
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricModalMode, setBiometricModalMode] = useState<'enable' | 'test'>('enable');
  const [showEyeHealthInfo, setShowEyeHealthInfo] = useState(false);

  const isBiometricEnabled = !!biometricConfig?.enabled;

  const handleToggleBiometric = () => {
    if (isBiometricEnabled) {
      // Turn off
      clearBiometricConfig();
      setBiometricConfig(null);
    } else {
      // Turn on: open verification modal to register/verify biometric
      setBiometricModalMode('enable');
      setIsBiometricModalOpen(true);
    }
  };

  const handleBiometricSuccess = () => {
    if (biometricModalMode === 'enable') {
      const isApple = typeof navigator !== 'undefined' && /iPhone|iPad|Macintosh/i.test(navigator.userAgent);
      const newConfig: BiometricAuthConfig = {
        enabled: true,
        userEmail: user.email,
        userName: user.name,
        deviceType: isApple ? 'face_id' : 'touch_id',
        enabledAt: new Date().toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        session: {
          token: 'token-' + Date.now(),
          user: {
            id: user.id || 1,
            user_name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar_url: user.avatarUrl,
            member_tier: user.memberTier || null,
            member_points: user.points || 0,
            shipping_address: user.shippingAddress,
            prescription_od_sphere: user.prescription.od.sphere,
            prescription_od_cylinder: user.prescription.od.cylinder || null,
            prescription_os_sphere: user.prescription.os.sphere,
            prescription_os_cylinder: user.prescription.os.cylinder || null,
            prescription_last_checked: user.prescription.lastChecked
          }
        }
      };
      saveBiometricConfig(newConfig);
      setBiometricConfig(newConfig);
    }
    setIsBiometricModalOpen(false);
  };

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEdit = (addr: UserAddress) => {
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (addressData: Omit<UserAddress, 'id'> & { id?: string }) => {
    if (addressData.id && onUpdateAddress) {
      onUpdateAddress(addressData as UserAddress);
    } else if (onAddAddress) {
      onAddAddress(addressData);
    }
  };

  const handleDelete = (id: string) => {
    if (onDeleteAddress) {
      onDeleteAddress(id);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col w-full pb-4 gap-space-md">
      {/* User Header Profile Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col items-center text-center relative border border-outline-variant/15">
        <div className="relative mb-3">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20 shadow-md"
          />
          <button
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm active:scale-90 transition-transform"
            aria-label="แก้ไขรูปโปรไฟล์"
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
          </button>
        </div>

        <h2 className="font-bold text-headline-sm text-on-surface">{user.name}</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">{user.email}</p>
        <p className="text-xs text-on-surface-variant">{user.phone}</p>

        {/* Member Tier Badge (Clickable to view Member Benefits) */}
        <button
          type="button"
          onClick={() => setIsMemberBenefitsModalOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 text-xs font-bold shadow-xs hover:shadow-sm hover:from-amber-200 hover:to-amber-300 active:scale-95 transition-all group cursor-pointer border border-amber-300/40"
          title="แตะเพื่อดูสิทธิประโยชน์สมาชิก Big Eye Club"
        >
          <span className="material-symbols-outlined text-[16px] text-amber-700" style={{ fontVariationSettings: "'FILL' 1" }}>
            workspace_premium
          </span>
          <span>{user.memberTier}</span>
          <span className="text-amber-800/80 font-normal">• {user.points} คะแนน</span>
          <span className="material-symbols-outlined text-[14px] text-amber-800/70 ml-0.5 group-hover:translate-x-0.5 transition-transform">
            chevron_right
          </span>
        </button>
      </div>

      {/* Optical Prescription Bento Card */}
      <div
        id="profile-prescription-card"
        className={`rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-sm border transition-all ${
          isPrescriptionOutdated
            ? 'bg-gradient-to-b from-amber-500/[0.06] via-surface-container-lowest to-surface-container-lowest border-amber-400 ring-2 ring-amber-400/25 shadow-md'
            : 'bg-surface-container-lowest border-outline-variant/15'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`material-symbols-outlined text-[22px] ${
                isPrescriptionOutdated ? 'text-amber-600' : 'text-primary'
              }`}
            >
              eyeglasses
            </span>
            <h3 className="font-bold text-sm text-on-surface">ข้อมูลค่าสายตาของฉัน</h3>
            {isPrescriptionOutdated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>ควรตรวจวัดใหม่</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('vision-test')}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary text-on-primary shadow-2xs hover:bg-primary-container flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="ตรวจวัดสายตาออนไลน์ (วัดสั้น/ยาว เอียง ตาบอดสี)"
            >
              <span className="material-symbols-outlined text-[15px]">visibility</span>
              <span>ตรวจสายตา</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEyeHealthInfo((prev) => !prev)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                showEyeHealthInfo
                  ? 'bg-surface-container-highest text-on-surface shadow-2xs'
                  : 'bg-primary/10 text-primary hover:bg-primary/15'
              }`}
              title="ความสำคัญของการตรวจสายตาทุกปีและเกร็ดดูแลสายตา"
              aria-expanded={showEyeHealthInfo}
            >
              <span className="material-symbols-outlined text-[15px]">
                {showEyeHealthInfo ? 'visibility_off' : 'info'}
              </span>
              <span>{showEyeHealthInfo ? 'ซ่อนเกร็ด' : 'เกร็ดความรู้'}</span>
            </button>
            <button
              onClick={onOpenPrescriptionModal}
              className={`text-xs font-semibold hover:underline flex items-center gap-0.5 ${
                isPrescriptionOutdated ? 'text-amber-700 font-bold' : 'text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              แก้ไข
            </button>
          </div>
        </div>

        {/* Educational Card: Importance of Annual Eye Check-ups & Health Tips */}
        {showEyeHealthInfo && (
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary/25 shadow-xs flex flex-col gap-3 text-xs animate-in fade-in zoom-in-98 duration-200">
            {/* Header of educational card */}
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">ทำไมควรตรวจสายตาทุกปี?</h4>
                  <p className="text-[10px] text-on-surface-variant">Annual Eye Examination & Tips</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEyeHealthInfo(false)}
                className="w-6 h-6 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                aria-label="ปิดคำแนะนำ"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            </div>

            {/* Why annual check-ups are essential */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">health_and_safety</span>
                ความสำคัญของการตรวจวัดสายตาทุก 1 ปี
              </span>
              <ul className="space-y-1.5 text-[11px] text-on-surface-variant leading-relaxed pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold text-xs mt-px">•</span>
                  <span>
                    <strong className="text-on-surface">การปรับเปลี่ยนของค่าสายตา:</strong> ค่าสั้น ยาว หรือเอียง มักค่อยๆ เปลี่ยนแปลงโดยไม่รู้ตัว หากฝืนใช้แว่นเดิมอาจทำให้ตาล้า ตาแห้ง และปวดศีรษะเรื้อรัง
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold text-xs mt-px">•</span>
                  <span>
                    <strong className="text-on-surface">คัดกรองโรคตาตั้งแต่ระยะเริ่มแรก:</strong> โรคต้อหิน ต้อกระจก หรือความดันลูกตาสูง มักไม่แสดงอาการเตือนในระยะแรก การตรวจประจำปีช่วยป้องกันก่อนสูญเสียการมองเห็น
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold text-xs mt-px">•</span>
                  <span>
                    <strong className="text-on-surface">ปรับความคมชัดตรงไลฟ์สไตล์:</strong> เลนส์และค่า PD (ระยะรูม่านตา) ที่อัปเดต ช่วยให้การทำงานหน้าจอคอมพิวเตอร์และขับขี่ปลอดภัยสูงสุด
                  </span>
                </li>
              </ul>
            </div>

            {/* 4 Essential Eye Health Care Tips */}
            <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">tips_and_updates</span>
                เกร็ดความรู้ดูแลสุขภาพดวงตาประจำวัน
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-on-surface-variant">
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-surface-container-low/70">
                  <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">timer</span>
                  <div>
                    <strong className="text-on-surface block text-[10px]">กฎ 20-20-20</strong>
                    ทุก 20 นาที พักสายตามองไกล 20 ฟุต อย่างน้อย 20 วินาที
                  </div>
                </div>
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-surface-container-low/70">
                  <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">wb_sunny</span>
                  <div>
                    <strong className="text-on-surface block text-[10px]">ปกป้องแสง UV & จอภาพ</strong>
                    สวมเลนส์กันแดด UV400 หรือเลนส์กรองแสงบลูบล็อกเมื่ออยู่หน้าจอ
                  </div>
                </div>
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-surface-container-low/70">
                  <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">water_drop</span>
                  <div>
                    <strong className="text-on-surface block text-[10px]">ลดอาการตาแห้ง</strong>
                    กะพริบตาบ่อยขึ้น หรือใช้น้ำตาเทียมหยอดเมื่อรู้สึกล้า
                  </div>
                </div>
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-surface-container-low/70">
                  <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">nutrition</span>
                  <div>
                    <strong className="text-on-surface block text-[10px]">อาหารบำรุงจอประสาทตา</strong>
                    ผักใบเขียว แครอท ปลาทะเล (วิตามิน A, ลูทีน และโอเมก้า 3)
                  </div>
                </div>
              </div>
            </div>

            {/* Quick action button to book eye test at branch */}
            <button
              type="button"
              onClick={() => setIsBranchModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">storefront</span>
              <span>นัดวัดสายตาฟรีที่สาขา TATOE Optical</span>
            </button>
          </div>
        )}

        {/* Suggestion Callout Banner when Prescription is older than 1 year */}
        {isPrescriptionOutdated && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start justify-between gap-2.5 text-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-2 text-amber-950">
              <span
                className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-900 flex-wrap">
                  <span>ตรวจวัดสายตาล่าสุดเกิน 1 ปีแล้ว</span>
                  <span className="text-amber-700/80 font-normal">({user.prescription.lastChecked})</span>
                </div>
                <p className="text-[10px] text-amber-800/90 mt-0.5 leading-relaxed">
                  ค่าสายตาอาจมีการเปลี่ยนแปลงตามธรรมชาติ แนะนำให้อัปเดตข้อมูลค่าสายตาล่าสุดเพื่อความคมชัดและสบายตาสูงสุด
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenPrescriptionModal}
              className="shrink-0 px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">refresh</span>
              <span>อัปเดต</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* OD Card */}
          <div
            className={`p-3 rounded-xl border flex flex-col transition-colors ${
              isPrescriptionOutdated
                ? 'bg-amber-500/[0.04] border-amber-400/30'
                : 'bg-surface-container-low border-outline-variant/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                OD (ตาขวา)
              </span>
              {user.prescription.od.visualAcuity && (
                <span className="text-[10px] font-mono text-outline">{user.prescription.od.visualAcuity}</span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[10px] text-on-surface-variant">SPH:</span>
              <span className="font-mono font-bold text-sm text-on-surface">
                {user.prescription.od.sphere}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-on-surface-variant">CYL:</span>
              <span className="font-mono text-xs text-on-surface-variant">
                {user.prescription.od.cylinder || '0.00'}
              </span>
            </div>
            {user.prescription.od.axis && (
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-on-surface-variant">AXIS:</span>
                <span className="font-mono font-bold text-xs text-secondary">
                  {user.prescription.od.axis}
                </span>
              </div>
            )}
          </div>

          {/* OS Card */}
          <div
            className={`p-3 rounded-xl border flex flex-col transition-colors ${
              isPrescriptionOutdated
                ? 'bg-amber-500/[0.04] border-amber-400/30'
                : 'bg-surface-container-low border-outline-variant/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                OS (ตาซ้าย)
              </span>
              {user.prescription.os.visualAcuity && (
                <span className="text-[10px] font-mono text-outline">{user.prescription.os.visualAcuity}</span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[10px] text-on-surface-variant">SPH:</span>
              <span className="font-mono font-bold text-sm text-on-surface">
                {user.prescription.os.sphere}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-on-surface-variant">CYL:</span>
              <span className="font-mono text-xs text-on-surface-variant">
                {user.prescription.os.cylinder || '0.00'}
              </span>
            </div>
            {user.prescription.os.axis && (
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-on-surface-variant">AXIS:</span>
                <span className="font-mono font-bold text-xs text-secondary">
                  {user.prescription.os.axis}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Color Vision Status Row if available */}
        {user.prescription.colorVisionStatus && (
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">palette</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-on-surface">ผลการตรวจตาบอดสี (Ishihara)</span>
                <span className="text-[10px] text-on-surface-variant">
                  {user.prescription.colorVisionStatus === 'normal'
                    ? 'การมองเห็นสีปกติ (Normal Color Vision)'
                    : 'พบความบกพร่องการแยกสี แดง-เขียว'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface-container-lowest text-primary border border-outline-variant/30">
              {user.prescription.colorVisionScore || '8/8'}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 px-1">
          <span>ระยะห่างรูม่านตา (PD): 62 mm</span>
          {isPrescriptionOutdated ? (
            <span className="text-amber-800 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              <span className="material-symbols-outlined text-[14px] text-amber-600">history_toggle_off</span>
              <span>ตรวจเมื่อ: {user.prescription.lastChecked} (เกิน 1 ปี)</span>
            </span>
          ) : (
            <span className="text-secondary font-medium">ตรวจเมื่อ: {user.prescription.lastChecked}</span>
          )}
        </div>

        {/* Action button to open online vision test */}
        <button
          type="button"
          onClick={() => onNavigate('vision-test')}
          className="w-full py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-primary/25 text-primary font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          <span>ตรวจวัดสายตาออนไลน์ (มีวัดสายตาเอียงและตรวจตาบอดสี)</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        </button>
      </div>

      {/* Shipping Address Card (Multi-Address Management) */}
      <div
        id="profile-shipping-addresses-card"
        className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-3.5 border border-outline-variant/15"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">location_on</span>
            <div>
              <h3 className="font-bold text-sm text-on-surface">ที่อยู่จัดส่งของฉัน</h3>
              <p className="text-[11px] text-on-surface-variant">
                จัดการที่อยู่บ้าน บริษัท หรือตั้งเป็นที่อยู่หลัก
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="py-1.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-primary-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
            <span>+ เพิ่มที่อยู่</span>
          </button>
        </div>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="p-4 rounded-xl bg-surface-container-low text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[32px]">
              wrong_location
            </span>
            <span>ยังไม่มีข้อมูลที่อยู่จัดส่งที่บันทึกไว้</span>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="text-primary font-bold hover:underline"
            >
              + เพิ่มที่อยู่ใหม่ตอนนี้
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {addresses.map((addr) => {
              const isDefault = addr.isDefault;
              const isConfirmingDelete = confirmDeleteId === addr.id;

              return (
                <div
                  key={addr.id}
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                    isDefault
                      ? 'bg-primary-fixed/20 border-primary/30 shadow-2xs'
                      : 'bg-surface-container-low/70 border-outline-variant/20 hover:border-outline-variant/40'
                  }`}
                >
                  {/* Top Badges & Title */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Type Badge: Home, Office, Other */}
                      {addr.type === 'home' && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-900 border border-amber-500/25 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-amber-600">
                            home
                          </span>
                          ที่บ้าน
                        </span>
                      )}
                      {addr.type === 'office' && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/25 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">domain</span>
                          บริษัท / ที่ทำงาน
                        </span>
                      )}
                      {addr.type === 'other' && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          คอนโด / อื่นๆ
                        </span>
                      )}

                      <span className="font-bold text-xs text-on-surface">{addr.title}</span>
                    </div>

                    {/* Default Status Badge */}
                    {isDefault && (
                      <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-full flex items-center gap-0.5 shadow-2xs shrink-0">
                        <span className="material-symbols-outlined text-[12px]">star</span>
                        ที่อยู่หลัก
                      </span>
                    )}
                  </div>

                  {/* Recipient Details */}
                  <div className="flex flex-col gap-0.5 text-xs text-on-surface">
                    <div className="font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-primary shrink-0">
                        person
                      </span>
                      <span>{addr.recipientName}</span>
                      <span className="font-normal text-on-surface-variant font-mono text-[11px]">
                        ({addr.phone})
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed pl-5">
                      {formatAddress(addr)}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15 text-xs mt-0.5">
                    <div>
                      {!isDefault && onSetDefaultAddress && (
                        <button
                          type="button"
                          onClick={() => onSetDefaultAddress(addr.id)}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            check_circle
                          </span>
                          <span>ตั้งเป็นที่อยู่หลัก</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(addr)}
                        className="h-7 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-[11px] flex items-center gap-1 transition-colors active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span>แก้ไข</span>
                      </button>

                      {/* Delete Button / Inline Confirmation */}
                      {onDeleteAddress && (
                        <>
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1 animate-in fade-in duration-150">
                              <span className="text-[10px] text-error font-medium">ลบที่อยู่นี้?</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(addr.id)}
                                className="h-7 px-2 bg-error text-on-error rounded-lg font-bold text-[10px] active:scale-95"
                              >
                                ยืนยัน
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="h-7 px-1.5 bg-surface-container-high text-on-surface-variant rounded-lg text-[10px]"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(addr.id)}
                              className="h-7 px-2 rounded-lg text-error hover:bg-rose-50 transition-colors flex items-center justify-center"
                              title="ลบที่อยู่นี้"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Action Menu List */}
      <div className="bg-surface-container-lowest rounded-2xl p-2 shadow-sm flex flex-col divide-y divide-outline-variant/15 border border-outline-variant/15 text-xs">
        <button
          onClick={() => onNavigate('search')}
          className="flex items-center justify-between p-3 hover:bg-surface-container-low transition-colors rounded-xl text-on-surface"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-500 text-[20px]">favorite</span>
            <span className="font-medium">รายการโปรดที่บันทึกไว้ (Wishlist)</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span>{wishlistCount} รายการ</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className="flex items-center justify-between p-3 hover:bg-surface-container-low transition-colors rounded-xl text-on-surface"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
            <span className="font-medium">ประวัติการสั่งซื้อ & ใบเสร็จ</span>
          </div>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            chevron_right
          </span>
        </button>

        {/* Member Benefits Perks Menu Item */}
        <button
          type="button"
          onClick={() => setIsMemberBenefitsModalOpen(true)}
          className="flex items-center justify-between p-3 hover:bg-surface-container-low transition-colors rounded-xl text-on-surface active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-medium">สิทธิประโยชน์สมาชิก (Member Benefits)</span>
              <span className="text-[10px] text-amber-800/80">
                สิทธิ์ระดับ Gold • ส่งฟรีไม่มีขั้นต่ำ & ส่วนลดพิเศษ
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary text-xs font-bold">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] text-amber-800">
              ดูสิทธิพิเศษ
            </span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              chevron_right
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsCouponModalOpen(true)}
          className="flex items-center justify-between p-3 hover:bg-surface-container-low transition-colors rounded-xl text-on-surface active:scale-98"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">
              confirmation_number
            </span>
            <span className="font-medium">คูปองส่วนลดของฉัน (3 ใบ)</span>
          </div>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            chevron_right
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsBranchModalOpen(true)}
          className="flex items-center justify-between p-3 hover:bg-surface-container-low transition-colors rounded-xl text-on-surface active:scale-98"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              storefront
            </span>
            <span className="font-medium">ศูนย์บริการสาขา & นัดวัดสายตา</span>
          </div>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            chevron_right
          </span>
        </button>

        {/* Claim System Button */}
        <button
          type="button"
          onClick={() => onNavigate('claims')}
          className="flex items-center justify-between p-3 hover:bg-surface-container-low transition-colors rounded-xl text-on-surface active:scale-98"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[20px]">
              verified_user
            </span>
            <div className="flex flex-col text-left">
              <span className="font-medium">ใบเคลมสินค้า & ตรวจสอบสถานะ (Claim System)</span>
              <span className="text-[10px] text-on-surface-variant">ยื่นคำร้องเคลม และติดตาม 5 ขั้นตอนเรียลไทม์</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px]">ประกัน 1 ปี</span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              chevron_right
            </span>
          </div>
        </button>
      </div>

      {/* Biometric Authentication (Touch ID / Face ID) Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-3.5 border border-outline-variant/15">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                isBiometricEnabled
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {biometricConfig?.deviceType === 'touch_id' ? 'fingerprint' : 'face'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-on-surface">เข้าสู่ระบบด้วย Touch ID / Face ID</h3>
                {isBiometricEnabled && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    เปิดใช้งานแล้ว
                  </span>
                )}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                สแกนใบหน้าหรือลายนิ้วมือเพื่อเข้าใช้งานได้ทันทีอย่างรวดเร็วและปลอดภัย โดยไม่ต้องพิมพ์อีเมลและรหัสผ่านซ้ำ
              </p>
            </div>
          </div>

          {/* Biometric Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isBiometricEnabled}
            onClick={handleToggleBiometric}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 relative focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer ${
              isBiometricEnabled ? 'bg-primary' : 'bg-surface-container-highest'
            }`}
            title={isBiometricEnabled ? 'ปิดการใช้งานชีวมิติ' : 'เปิดใช้งานชีวมิติ'}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                isBiometricEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Status & Capabilities Details */}
        <div className="pt-2 border-t border-outline-variant/15 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">verified_user</span>
              <span>
                {isBiometricEnabled
                  ? `ผูกกับบัญชี ${user.email} (${biometricConfig?.enabledAt || 'ใช้งานได้'})`
                  : 'ยังไม่ได้เปิดใช้งานชีวมิติบนอุปกรณ์นี้'}
              </span>
            </div>

            {isBiometricEnabled && (
              <button
                type="button"
                onClick={() => {
                  setBiometricModalMode('test');
                  setIsBiometricModalOpen(true);
                }}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                <span>ทดสอบสแกน</span>
              </button>
            )}
          </div>

          {/* Device Hardware Support Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="px-2 py-0.5 rounded-lg bg-surface-container-low text-[10px] text-on-surface-variant border border-outline-variant/20 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">face</span>
              Face ID
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-surface-container-low text-[10px] text-on-surface-variant border border-outline-variant/20 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">fingerprint</span>
              Touch ID
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-surface-container-low text-[10px] text-on-surface-variant border border-outline-variant/20 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">laptop_mac</span>
              Windows Hello / Android
            </span>
          </div>
        </div>
      </div>

      {/* Role & Permissions Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-3 border border-outline-variant/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-700 text-[22px]">
              admin_panel_settings
            </span>
            <div>
              <h3 className="font-bold text-sm text-on-surface">สิทธิ์การใช้งานระบบ</h3>
              <p className="text-[11px] text-on-surface-variant">
                สถานะปัจจุบัน: <span className="font-bold text-primary">{isAdmin ? 'ผู้ดูแลระบบ (Admin)' : 'ลูกค้าทั่วไป (Customer)'}</span>
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              isAdmin
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {isAdmin ? 'Admin' : 'Customer'}
          </span>
        </div>

        {isAdmin && (
          <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
            <p className="text-[11px] text-on-surface-variant">
              ในฐานะแอดมิน คุณสามารถเพิ่มแว่นตารุ่นใหม่, แก้ไขราคา/คุณสมบัติ, ลบสินค้าออกจากระบบ และตอบแชทลูกค้าที่สอบถามสินค้าได้
            </p>

            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-xs active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  <span>ศูนย์ตอบแชทลูกค้า (ตอบคำถามเกี่ยวกับสินค้า)</span>
                </div>
                {unreadChatCount > 0 && (
                  <span className="px-2 py-0.5 bg-white text-amber-800 text-[10px] font-extrabold rounded-full animate-pulse">
                    {unreadChatCount} ข้อความใหม่
                  </span>
                )}
              </button>
            )}

            <div className="flex gap-2">
              {onOpenAddProduct && (
                <button
                  type="button"
                  onClick={onOpenAddProduct}
                  className="flex-1 py-2 px-3 bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform hover:bg-amber-800"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>+ เพิ่มสินค้าใหม่</span>
                </button>
              )}
              {onResetProducts && (
                <button
                  type="button"
                  onClick={onResetProducts}
                  className="py-2 px-3 bg-surface-container-low border border-outline-variant/30 text-on-surface-variant rounded-xl text-xs font-medium active:scale-95 transition-transform hover:bg-surface-container-high"
                >
                  รีเซ็ตค่าเดิม
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sign Out Button */}
      <button
        onClick={onLogout}
        className="w-full h-12 rounded-2xl bg-surface-container-low hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-colors border border-rose-200/50"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        <span>ออกจากระบบ (Sign Out)</span>
      </button>

      {/* Address Add/Edit Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        editingAddress={editingAddress}
      />

      {/* Branch & Eye Test Appointment Modal */}
      <BranchAppointmentModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onOpenChat={onOpenChat}
      />

      {/* Discount Coupons Modal */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onNavigate={(screen) => onNavigate(screen as ScreenId)}
      />

      {/* Member Benefits Modal */}
      <MemberBenefitsModal
        isOpen={isMemberBenefitsModalOpen}
        onClose={() => setIsMemberBenefitsModalOpen(false)}
        user={user}
        onNavigate={(screen) => onNavigate(screen as ScreenId)}
      />

      {/* Biometric Verification Modal */}
      <BiometricVerificationModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onSuccess={handleBiometricSuccess}
        mode={biometricModalMode}
        userName={user.name}
        userEmail={user.email}
      />
    </div>
  );
};
