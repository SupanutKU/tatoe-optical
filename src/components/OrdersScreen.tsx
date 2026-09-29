import React, { useState } from 'react';
import { UserProfile, ScreenId, DeliveryOrder } from '../types';
import { INITIAL_DELIVERY_ORDER, DELIVERY_STAGE_CONFIG } from '../data/mockData';

interface OrdersScreenProps {
  user: UserProfile;
  deliveryOrder?: DeliveryOrder;
  onOpenReceipt: () => void;
  onOpenChat: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  user,
  deliveryOrder = INITIAL_DELIVERY_ORDER,
  onOpenReceipt,
  onOpenChat,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'transit' | 'completed'>('transit');
  const [copiedTracking, setCopiedTracking] = useState(false);

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

  return (
    <div className="flex flex-col w-full pb-24 gap-space-md">
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
            <div className="w-12 h-12 rounded-lg bg-surface-container-lowest p-1 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-outline">inventory_2</span></div>
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-bold text-on-surface truncate">สินค้าในคำสั่งซื้อ</p>
              <p className="text-[10px] text-on-surface-variant">รายละเอียดจาก SQL</p>
              <p className="text-[10px] text-primary font-semibold">รายละเอียดเลนส์จาก SQL</p>
            </div>
            <span className="font-bold text-xs text-on-surface shrink-0">฿—</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-container-low">
            <div className="w-12 h-12 rounded-lg bg-surface-container-lowest p-1 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-outline">inventory_2</span></div>
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-bold text-on-surface truncate">สินค้าในคำสั่งซื้อ</p>
              <p className="text-[10px] text-on-surface-variant">รายละเอียดจาก SQL</p>
              <p className="text-[10px] text-on-surface-variant">รายละเอียดเลนส์จาก SQL</p>
            </div>
            <span className="font-bold text-xs text-on-surface shrink-0">฿—</span>
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
          สินค้าในคำสั่งซื้อ • รายละเอียดจาก SQL
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
