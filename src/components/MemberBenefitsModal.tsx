import React, { useState } from 'react';
import { UserProfile, ScreenId } from '../types';
import { MEMBER_TIERS, MemberTierInfo, PERKS_COMPARISON_MATRIX } from '../constants/memberTiers';

interface MemberBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onNavigate?: (screen: ScreenId) => void;
}

export const MemberBenefitsModal: React.FC<MemberBenefitsModalProps> = ({
  isOpen,
  onClose,
  user,
  onNavigate
}) => {
  // Determine current user tier id based on user.memberTier or user.tier
  const userTierString = (user.memberTier || user.tier || '').toLowerCase();
  let defaultTierId: 'silver' | 'gold' | 'platinum' | 'diamond' = 'gold';
  if (userTierString.includes('diamond') || userTierString.includes('vip')) {
    defaultTierId = 'diamond';
  } else if (userTierString.includes('platinum')) {
    defaultTierId = 'platinum';
  } else if (userTierString.includes('silver')) {
    defaultTierId = 'silver';
  } else {
    defaultTierId = 'gold';
  }

  const [activeTierId, setActiveTierId] = useState<'silver' | 'gold' | 'platinum' | 'diamond' | 'compare'>(defaultTierId);
  const currentPoints = user.points ?? 420;

  if (!isOpen) return null;

  // Find tier details
  const activeTier = MEMBER_TIERS.find((t) => t.id === activeTierId) || MEMBER_TIERS[1];
  const userTier = MEMBER_TIERS.find((t) => t.id === defaultTierId) || MEMBER_TIERS[1];

  // Calculate points progress to next tier
  let nextTier: MemberTierInfo | null = null;
  let pointsToNext = 0;
  let progressPercent = 100;

  if (defaultTierId === 'silver') {
    nextTier = MEMBER_TIERS[1]; // gold
    pointsToNext = Math.max(0, 250 - currentPoints);
    progressPercent = Math.min(100, Math.round((currentPoints / 250) * 100));
  } else if (defaultTierId === 'gold') {
    nextTier = MEMBER_TIERS[2]; // platinum
    pointsToNext = Math.max(0, 1000 - currentPoints);
    progressPercent = Math.min(100, Math.round(((currentPoints - 250) / 750) * 100));
  } else if (defaultTierId === 'platinum') {
    nextTier = MEMBER_TIERS[3]; // diamond
    pointsToNext = Math.max(0, 2500 - currentPoints);
    progressPercent = Math.min(100, Math.round(((currentPoints - 1000) / 1500) * 100));
  } else {
    nextTier = null;
    pointsToNext = 0;
    progressPercent = 100;
  }

  const handleStartShopping = () => {
    onClose();
    if (onNavigate) {
      onNavigate('search');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-[460px] max-h-[92vh] bg-surface rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/20 animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-benefits-title"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-surface-container-lowest border-b border-outline-variant/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
            </div>
            <div>
              <h2 id="member-benefits-title" className="font-bold text-base text-on-surface">
                สิทธิประโยชน์สมาชิก (Member Benefits)
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                เอกสิทธิ์เฉพาะสมาชิก Big Eye Club ทุกระดับขั้น
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors active:scale-90"
            aria-label="ปิดหน้าต่างสิทธิประโยชน์"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* User's Virtual Membership Card */}
          <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden shadow-md text-white bg-gradient-to-br from-amber-600 via-amber-700 to-yellow-800 border border-amber-400/30">
            {/* Background luxury patterns */}
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
            <div className="absolute right-4 bottom-4 opacity-15 pointer-events-none">
              <span className="material-symbols-outlined text-[90px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] tracking-wider uppercase font-semibold text-amber-200">
                      TATOE OPTICAL • BIG EYE CLUB
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/20 backdrop-blur-xs text-white">
                      ACTIVE
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mt-0.5 tracking-tight">{user.name}</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-white text-amber-950 text-xs font-black shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-amber-700" style={{ fontVariationSettings: "'FILL' 1" }}>
                    stars
                  </span>
                  <span>{userTier.name}</span>
                </div>
              </div>

              {/* Points & Perks Quick Highlight */}
              <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-100/90 block">คะแนนสะสมของคุณ</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black">{currentPoints.toLocaleString()}</span>
                    <span className="text-xs text-amber-200">คะแนน</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-100/90 block">สิทธิประโยชน์หลัก</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-md">
                      🚚 ส่งฟรีทุกชิ้น
                    </span>
                    <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-md">
                      🏷️ ลด 5%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar to next tier */}
              {nextTier && (
                <div className="mt-1 pt-2 border-t border-white/15">
                  <div className="flex justify-between items-center text-[10px] text-amber-100 mb-1">
                    <span>สะสมอีก <strong className="text-white font-bold">{pointsToNext.toLocaleString()} คะแนน</strong> สู่ระดับ {nextTier.name}</span>
                    <span className="font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden p-0.5 border border-white/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-white shadow-xs transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tier Segmented Navigation Pills */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-on-surface">เลือกระดับสมาชิกเพื่อดูสิทธิประโยชน์:</span>
              <span className="text-[10px] text-on-surface-variant">แตะเพื่อเปรียบเทียบ</span>
            </div>
            <div className="grid grid-cols-5 gap-1 p-1 bg-surface-container-low rounded-2xl border border-outline-variant/20">
              {MEMBER_TIERS.map((tier) => {
                const isSelected = activeTierId === tier.id;
                const isCurrent = defaultTierId === tier.id;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setActiveTierId(tier.id)}
                    className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                    }`}
                  >
                    <span className="text-xs">{tier.name.split(' ')[0]}</span>
                    {isCurrent ? (
                      <span className="text-[9px] px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-800 font-bold scale-90 -mt-0.5">
                        คุณ
                      </span>
                    ) : (
                      <span className="text-[9px] text-on-surface-variant/70 scale-90 -mt-0.5">
                        {tier.minPoints}+
                      </span>
                    )}
                  </button>
                );
              })}
              
              {/* Compare All Tab */}
              <button
                type="button"
                onClick={() => setActiveTierId('compare')}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                  activeTierId === 'compare'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">table_chart</span>
                <span className="text-[10px] leading-tight">เปรียบเทียบ</span>
              </button>
            </div>
          </div>

          {/* Conditional View: Detail Tier vs Comparative Table */}
          {activeTierId !== 'compare' ? (
            <div className="space-y-3 animate-fade-in">
              {/* Selected Tier Banner */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                    activeTier.id === 'silver' ? 'bg-slate-200 text-slate-700' :
                    activeTier.id === 'gold' ? 'bg-amber-100 text-amber-700' :
                    activeTier.id === 'platinum' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {activeTier.icon}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-on-surface">{activeTier.name}</h4>
                      {defaultTierId === activeTier.id && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 border border-amber-500/30">
                          ระดับปัจจุบันของคุณ
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant">{activeTier.minSpendText}</p>
                  </div>
                </div>
              </div>

              {/* Key Hero Perks: Shipping & Exclusive Discounts (Direct User Request Fulfillment) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Free Shipping Perk */}
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300 font-bold text-xs mb-1">
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                    <span>สิทธิการจัดส่ง</span>
                  </div>
                  <p className="text-xs font-semibold text-sky-950 dark:text-sky-100">
                    {activeTier.shippingBenefit}
                  </p>
                  <span className="text-[10px] text-sky-700/80 dark:text-sky-400 mt-1">
                    {activeTier.id === 'silver' ? 'เมื่อซื้อขั้นต่ำ ฿800' : 'ทุกออเดอร์ ไม่มีขั้นต่ำ'}
                  </span>
                </div>

                {/* Exclusive Discount Perk */}
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs mb-1">
                    <span className="material-symbols-outlined text-[18px]">sell</span>
                    <span>ส่วนลดพิเศษ</span>
                  </div>
                  <p className="text-xs font-semibold text-amber-950 dark:text-amber-100">
                    {activeTier.discountBenefit}
                  </p>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-1">
                    {activeTier.id === 'silver' ? 'คูปองต้อนรับสมาชิก' : 'ลดทุกชิ้นตลอดทั้งปี'}
                  </span>
                </div>
              </div>

              {/* Full List of Perks for this Tier */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-on-surface px-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">featured_play_list</span>
                  <span>รายการสิทธิพิเศษทั้งหมด ({activeTier.perks.length} รายการ)</span>
                </h5>

                <div className="space-y-2">
                  {activeTier.perks.map((perk) => (
                    <div
                      key={perk.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                        perk.highlight
                          ? 'bg-amber-50/50 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40'
                          : 'bg-surface-container-lowest border-outline-variant/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        perk.highlight
                          ? 'bg-amber-500/20 text-amber-800'
                          : 'bg-surface-container-high text-primary'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">
                          {perk.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h6 className="font-bold text-xs text-on-surface leading-tight">
                            {perk.title}
                          </h6>
                          {perk.highlight && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-white">
                              HOT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                          {perk.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Comparison Table View */
            <div className="space-y-3 animate-fade-in">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">compare</span>
                <span>เปรียบเทียบสิทธิประโยชน์ของสมาชิกแต่ละระดับ</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/20">
                      <th className="p-2.5 font-bold text-on-surface min-w-[120px]">สิทธิประโยชน์</th>
                      <th className="p-2.5 font-bold text-slate-700 text-center min-w-[90px]">Silver</th>
                      <th className="p-2.5 font-bold text-amber-800 bg-amber-500/10 text-center min-w-[100px]">
                        Gold ⭐️
                        <span className="block text-[9px] text-amber-700 font-normal">(คุณ)</span>
                      </th>
                      <th className="p-2.5 font-bold text-indigo-700 text-center min-w-[90px]">Platinum</th>
                      <th className="p-2.5 font-bold text-purple-700 text-center min-w-[95px]">Diamond VIP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-[11px]">
                    {PERKS_COMPARISON_MATRIX.map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low/40">
                        <td className="p-2.5 font-semibold text-on-surface">{row.feature}</td>
                        <td className="p-2.5 text-center text-on-surface-variant">{row.silver}</td>
                        <td className="p-2.5 text-center font-bold text-amber-900 bg-amber-500/5">{row.gold}</td>
                        <td className="p-2.5 text-center text-on-surface-variant">{row.platinum}</td>
                        <td className="p-2.5 text-center font-semibold text-purple-900">{row.diamond}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Points & Policy Info Note */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5 text-xs text-on-surface-variant">
            <div className="flex items-center gap-1.5 font-bold text-on-surface">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">toll</span>
              <span>การสะสมคะแนนและการรักษาระดับ</span>
            </div>
            <ul className="text-[11px] list-disc list-inside space-y-0.5 text-on-surface-variant/90 pl-1">
              <li>ทุก 20 บาท จากการซื้อสินค้า รับ 1 Big Eye Point</li>
              <li>100 คะแนน แลกเป็นส่วนลดเงินสดได้ ฿50 ในหน้าชำระเงิน</li>
              <li>สถานะระดับสมาชิกมีอายุ 1 ปี และจะต่ออายุอัตโนมัติเมื่อมียอดสะสมตามเกณฑ์</li>
              <li>ติดต่อสอบถามข้อมูลเพิ่มเติมได้ที่ศูนย์บริการลูกค้าหน้าร้านทุกสาขา</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/15 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant/30 text-on-surface hover:bg-surface-container-low text-xs font-semibold active:scale-98 transition-all"
          >
            ปิด
          </button>
          <button
            type="button"
            onClick={handleStartShopping}
            className="flex-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
            <span>ช้อปสะสมคะแนนเพิ่ม</span>
          </button>
        </div>
      </div>
    </div>
  );
};
