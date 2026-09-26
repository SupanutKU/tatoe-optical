import React, { useState, useEffect } from 'react';
import { UserProfile, ScreenId, DeliveryOrder, DeliveryStage } from '../types';
import { INITIAL_DELIVERY_ORDER, DELIVERY_STAGE_CONFIG } from '../data/mockData';

interface OrdersScreenProps {
  user: UserProfile;
  deliveryOrder?: DeliveryOrder;
  onUpdateDeliveryStage?: (stage: DeliveryStage) => void;
  onOpenReceipt: () => void;
  onOpenChat: () => void;
  onNavigate: (screen: ScreenId) => void;
}

const STAGES_ORDER: DeliveryStage[] = [
  'order_placed',
  'crafting',
  'in_transit',
  'at_sorting_hub',
  'out_for_delivery',
  'delivered'
];

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  user,
  deliveryOrder = INITIAL_DELIVERY_ORDER,
  onUpdateDeliveryStage,
  onOpenReceipt,
  onOpenChat,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'transit' | 'completed'>('transit');
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  const currentStage = deliveryOrder.currentStage || 'in_transit';
  const stageConfig = DELIVERY_STAGE_CONFIG[currentStage] || DELIVERY_STAGE_CONFIG.in_transit;
  const isDelivered = currentStage === 'delivered';

  const handleCopyTracking = () => {
    navigator.clipboard?.writeText(deliveryOrder.trackingNumber);
    setCopiedTracking(true);
    setTimeout(() => {
      setCopiedTracking(false);
    }, 2000);
  };

  const handleSelectStage = (newStage: DeliveryStage) => {
    if (onUpdateDeliveryStage) {
      onUpdateDeliveryStage(newStage);
    }
  };

  const handleNextStage = () => {
    const currentIndex = STAGES_ORDER.indexOf(currentStage);
    const nextIndex = (currentIndex + 1) % STAGES_ORDER.length;
    handleSelectStage(STAGES_ORDER[nextIndex]);
  };

  // Auto-simulation timer loop
  useEffect(() => {
    if (!isAutoSimulating) return;

    const interval = setInterval(() => {
      const currentIndex = STAGES_ORDER.indexOf(currentStage);
      if (currentIndex < STAGES_ORDER.length - 1) {
        handleSelectStage(STAGES_ORDER[currentIndex + 1]);
      } else {
        setIsAutoSimulating(false);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isAutoSimulating, currentStage]);

  return (
    <div className="flex flex-col w-full pb-24 gap-space-md">
      {/* Simulation Controller Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-surface-container-low to-secondary/10 rounded-2xl p-3.5 border border-primary/25 shadow-xs flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center text-xs shadow-2xs">
              <span className="material-symbols-outlined text-[17px] animate-pulse">
                notifications_active
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-xs text-on-surface">
                  จำลองสถานะพัสดุ (Push Notification)
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary text-[9px] font-bold">
                  Interactive
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant">
                คลิกเปลี่ยนสถานะเพื่อดู Push Notification เด้งแจ้งเตือนแบบเรียลไทม์
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextStage}
            className="px-2.5 py-1 rounded-xl bg-primary text-on-primary text-[11px] font-bold flex items-center gap-1 hover:bg-primary-container active:scale-95 shadow-2xs transition-all"
            title="ขยับไปยังสถานะถัดไป"
          >
            <span>ขั้นถัดไป</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Quick Selection Buttons for Delivery Stages */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {STAGES_ORDER.map((stageKey, idx) => {
            const cfg = DELIVERY_STAGE_CONFIG[stageKey];
            const isSelected = currentStage === stageKey;
            const isTargetHighlight = stageKey === 'at_sorting_hub';

            return (
              <button
                key={stageKey}
                type="button"
                onClick={() => handleSelectStage(stageKey)}
                className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs ring-2 ring-primary/30'
                    : isTargetHighlight
                    ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span>{idx + 1}.</span>
                <span>{cfg.label}</span>
                {isTargetHighlight && !isSelected && (
                  <span className="px-1 rounded bg-emerald-600 text-white text-[9px]">แนะนำ</span>
                )}
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Auto Simulator Button */}
        <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-[10px]">
          <span className="text-on-surface-variant">
            สถานะปัจจุบัน: <strong className="text-primary">{stageConfig.label}</strong>
          </span>
          <button
            type="button"
            onClick={() => setIsAutoSimulating(!isAutoSimulating)}
            className={`font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors ${
              isAutoSimulating
                ? 'bg-red-500/10 text-red-600 animate-pulse'
                : 'text-primary hover:bg-primary/10'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">
              {isAutoSimulating ? 'stop_circle' : 'play_circle'}
            </span>
            <span>{isAutoSimulating ? 'หยุดจำลองอัตโนมัติ' : 'เล่นจำลองทุก 4 วินาที'}</span>
          </button>
        </div>
      </div>

      {/* Order Tracking Status Navigation Tabs */}
      <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
            activeTab === 'all'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          ทั้งหมด (3)
        </button>
        <button
          onClick={() => setActiveTab('transit')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 flex items-center gap-1 ${
            activeTab === 'transit'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isDelivered ? 'bg-emerald-400' : 'bg-primary animate-pulse'}`}></span>
          {isDelivered ? 'จัดส่งสำเร็จแล้ว (1)' : 'กำลังจัดส่ง (1)'}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
            activeTab === 'completed'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
          }`}
        >
          สำเร็จแล้ว ({isDelivered ? '3' : '2'})
        </button>
      </div>

      {/* Main Active Tracking Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/15">
        {/* Header with Order ID & Status Badge */}
        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-space-sm">
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant font-medium">หมายเลขคำสั่งซื้อ</span>
            <span className="font-bold text-sm text-primary">{deliveryOrder.orderId}</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs shadow-xs ${stageConfig.badgeColor}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
            {stageConfig.label}
          </span>
        </div>

        {/* Dynamic Estimated Delivery Time Banner */}
        <div className={`p-3 rounded-xl flex items-center gap-3 ${
          isDelivered ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-secondary-fixed/30 text-on-secondary-fixed'
        }`}>
          <span className="material-symbols-outlined text-[24px] text-primary">
            {stageConfig.icon}
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-xs">
              {isDelivered ? 'จัดส่งสำเร็จเรียบร้อยแล้ว' : `กำหนดส่งโดยประมาณ ${deliveryOrder.estimatedDelivery}`}
            </span>
            <span className="text-[11px] opacity-90">{stageConfig.description}</span>
          </div>
        </div>

        {/* Courier & Tracking Number */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-xs">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs text-on-surface">{deliveryOrder.courier}</span>
              <span className="font-mono text-xs text-on-surface-variant">{deliveryOrder.trackingNumber}</span>
            </div>
          </div>

          <button
            onClick={handleCopyTracking}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-semibold text-[11px] shadow-xs hover:bg-surface-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copiedTracking ? 'check' : 'content_copy'}
            </span>
            <span>{copiedTracking ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        </div>

        {/* Dynamic Timeline Stepper */}
        <div className="flex flex-col pl-2 pt-1 relative">
          {deliveryOrder.steps.map((step, idx) => {
            const isLast = idx === deliveryOrder.steps.length - 1;
            const isCurrent = step.current;
            const isCompleted = step.completed;

            return (
              <div key={step.id} className={`flex items-start gap-3 relative ${isLast ? '' : 'pb-5'}`}>
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${
                      isCompleted && !isCurrent ? 'bg-primary' : 'bg-surface-container-high'
                    }`}
                  />
                )}

                {/* Node Icon */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 z-10 shadow-xs transition-all ${
                    isCurrent
                      ? 'bg-primary text-on-primary ring-4 ring-primary/20 animate-pulse'
                      : isCompleted
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {isCompleted ? 'check' : isCurrent ? 'local_shipping' : 'schedule'}
                  </span>
                </div>

                {/* Text Description */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs ${
                        isCurrent
                          ? 'font-bold text-primary'
                          : isCompleted
                          ? 'font-bold text-on-surface'
                          : 'font-semibold text-outline'
                      }`}
                    >
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary text-on-primary font-bold animate-pulse">
                        สถานะล่าสุด
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] mt-0.5 leading-relaxed ${
                      isCompleted || isCurrent ? 'text-on-surface' : 'text-outline'
                    }`}
                  >
                    {step.detail}
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-0.5">
                    {step.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ordered items summary in this order */}
        <div className="pt-3 border-t border-outline-variant/15 flex flex-col gap-2">
          <span className="font-bold text-xs text-on-surface">สินค้าในกล่องพัสดุนี้ (2 ชิ้น)</span>
          <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-container-low">
            <div className="w-12 h-12 rounded-lg bg-surface-container-lowest p-1 flex items-center justify-center shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD34F18cWkMwhn58xL3FpG9uG9mZqK816_x2qE4ErhE7YgI0x29kZ5g8h1Zqj_8o20y8qU=w300"
                alt="Urban Black"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-bold text-on-surface truncate">Big Eye Urban Black</p>
              <p className="text-[10px] text-on-surface-variant">สีกรอบ Matte Black • เลนส์ Auto Blue</p>
              <p className="text-[10px] text-primary font-semibold">ค่าสายตา R: -1.75 | L: -2.00</p>
            </div>
            <span className="font-bold text-xs text-on-surface shrink-0">฿1,290</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-container-low">
            <div className="w-12 h-12 rounded-lg bg-surface-container-lowest p-1 flex items-center justify-center shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCL3Jj59yE9L8mF2b8y24_G8c9K100Zk19y8U1_ErhG78yG_x34kL5g7h1Zqj_8o20y8qU=w300"
                alt="Classic 01"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-bold text-on-surface truncate">Big Eye Classic 01</p>
              <p className="text-[10px] text-on-surface-variant">สีกรอบ Tortoise Gold • เลนส์มัลติโค้ต</p>
              <p className="text-[10px] text-on-surface-variant">ไม่มีค่าสายตา</p>
            </div>
            <span className="font-bold text-xs text-on-surface shrink-0">฿990</span>
          </div>
        </div>

        {/* Action Buttons: Receipt, Claim & Chat */}
        <div className="grid grid-cols-3 gap-1.5 pt-2">
          <button
            onClick={onOpenReceipt}
            className="h-10 rounded-xl bg-surface-container-high text-on-surface font-semibold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">receipt_long</span>
            <span>ใบเสร็จ</span>
          </button>
          <button
            onClick={() => onNavigate('claims')}
            className="h-10 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-500/25 font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all hover:bg-amber-500/20"
            title="ส่งคำร้องเคลมสินค้านี้"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-700">verified_user</span>
            <span>ส่งเคลม</span>
          </button>
          <button
            onClick={onOpenChat}
            className="h-10 rounded-xl bg-primary text-on-primary font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>แชท</span>
          </button>
        </div>
      </div>

      {/* Past Completed Order Item preview */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-2 opacity-85">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-on-surface">#BEY-2024891</span>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">
            จัดส่งสำเร็จ (12 ก.พ. 2025)
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant">
          Big Eye Minimalist Silver • เลนส์ใสธรรมดา • ฿1,190
        </p>
        <div className="flex justify-end">
          <button
            onClick={() => onNavigate('search')}
            className="text-xs text-primary font-bold hover:underline"
          >
            สั่งซื้อซ้ำ
          </button>
        </div>
      </div>
    </div>
  );
};
