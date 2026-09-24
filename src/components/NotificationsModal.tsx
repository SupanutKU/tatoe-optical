import React from 'react';
import { AppNotification, DeliveryStage } from '../types';
import { DELIVERY_STAGE_CONFIG } from '../data/mockData';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onSelectNotification: (notification: AppNotification) => void;
  onTriggerTestStage?: (stage: DeliveryStage) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
  onTriggerTestStage
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-outline-variant/15 overflow-hidden animate-slideUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/15 bg-surface-container-lowest sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                การแจ้งเตือนพัสดุ
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unreadCount} ใหม่
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                ประวัติการแจ้งเตือนสถานะการจัดส่งคำสั่งซื้อ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[11px] text-primary hover:text-primary-container font-semibold px-2 py-1 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                อ่านทั้งหมด
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="ปิด"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Quick Simulator Bar inside Notifications Modal */}
        {onTriggerTestStage && (
          <div className="p-3 bg-surface-container-low/70 border-b border-outline-variant/10 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                ทดสอบส่ง Push Notification จำลอง
              </span>
              <span className="text-[10px] text-outline">คลิกเพื่อลองสถานะ</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onTriggerTestStage('at_sorting_hub');
                  onClose();
                }}
                className="py-1.5 px-2 rounded-xl bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 border border-emerald-500/20"
              >
                <span>📍</span>
                <span>ถึงสาขาปลายทางแล้ว</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTriggerTestStage('out_for_delivery');
                  onClose();
                }}
                className="py-1.5 px-2 rounded-xl bg-orange-500/10 text-orange-900 hover:bg-orange-500/20 text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 border border-orange-500/20"
              >
                <span>🛵</span>
                <span>พนักงานกำลังนำจ่าย</span>
              </button>
            </div>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[44px] text-outline/50 mb-2">
                notifications_off
              </span>
              <p className="text-xs font-semibold">ยังไม่มีการแจ้งเตือนใหม่</p>
              <p className="text-[11px] text-outline mt-0.5">
                เมื่อมีสถานะจัดส่งพัสดุอัปเดต ระบบจะแจ้งเตือนที่นี่
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const stageConfig = item.stage ? DELIVERY_STAGE_CONFIG[item.stage] : null;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectNotification(item);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 active:scale-[0.99] ${
                    !item.read
                      ? 'bg-primary/5 border-primary/25 shadow-2xs'
                      : 'bg-surface-container-low/60 border-outline-variant/10 hover:bg-surface-container-low'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                      !item.read
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {stageConfig?.icon || 'local_shipping'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          !item.read ? 'font-bold text-on-surface' : 'font-semibold text-on-surface-variant'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                      )}
                    </div>

                    <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">
                      {item.body}
                    </p>

                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-outline-variant/10 text-[10px] text-outline">
                      <span>{item.timestamp}</span>
                      <span className="text-primary font-semibold flex items-center gap-0.5">
                        <span>ดูในคำสั่งซื้อ</span>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-outline-variant/15 bg-surface-container-lowest flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container font-semibold text-xs active:scale-95 transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
