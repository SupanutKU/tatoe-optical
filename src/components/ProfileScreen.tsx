import React, { useState } from 'react';
import { UserProfile, ScreenId, UserAddress } from '../types';
import { AddressModal } from './AddressModal';
import { BranchAppointmentModal } from './BranchAppointmentModal';
import { CouponModal } from './CouponModal';
import { MemberBenefitsModal } from './MemberBenefitsModal';
import { formatAddress } from '../data/mockData';

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
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-sm border border-outline-variant/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">eyeglasses</span>
            <h3 className="font-bold text-sm text-on-surface">ข้อมูลค่าสายตาของฉัน</h3>
          </div>
          <button
            onClick={onOpenPrescriptionModal}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            แก้ไข
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* OD Card */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col">
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              OD (ตาขวา)
            </span>
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
          </div>

          {/* OS Card */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col">
            <span className="text-xs font-bold text-secondary flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              OS (ตาซ้าย)
            </span>
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
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 px-1">
          <span>ระยะห่างรูม่านตา (PD): 62 mm</span>
          <span className="text-secondary font-medium">{user.prescription.lastChecked}</span>
        </div>
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
    </div>
  );
};
