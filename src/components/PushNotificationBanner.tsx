import React, { useEffect, useRef, useState } from 'react';
import { AppNotification } from '../types';
import { APP_LOGO } from '../data/mockData';

interface PushNotificationBannerProps {
  notification: AppNotification | null;
  onClose: () => void;
  onClick: (notification: AppNotification) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  notification,
  onClose,
  onClick
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayedRef = useRef<string | null>(null);

  // Play subtle pleasant chime on arrival
  useEffect(() => {
    if (!notification) return;
    if (audioPlayedRef.current === notification.id) return;
    audioPlayedRef.current = notification.id;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        // Two gentle tones (e.g., 587Hz -> 880Hz) like iOS notification
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.18);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12); // A5
        gain2.gain.setValueAtTime(0.1, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.45);
      }
    } catch (e) {
      // Audio autoplay policy might prevent sound before user gesture; gracefully ignore
    }
  }, [notification]);

  // Auto-dismiss after 6.5 seconds
  useEffect(() => {
    if (!notification) return;
    setIsClosing(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, 6500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification?.id]);

  if (!notification) return null;

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 280);
  };

  const handleClickBanner = () => {
    onClick(notification);
    handleDismiss();
  };

  return (
    <div className="fixed top-2 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none">
      <div
        onClick={handleClickBanner}
        className={`pointer-events-auto w-full max-w-[400px] bg-surface-container-lowest/95 backdrop-blur-xl border border-primary/25 rounded-2xl p-3.5 shadow-2xl shadow-primary/10 flex flex-col gap-2 cursor-pointer transition-all duration-300 transform select-none active:scale-[0.98] ${
          isClosing
            ? 'opacity-0 -translate-y-6 scale-95'
            : 'opacity-100 translate-y-0 scale-100 animate-slideDown'
        }`}
        role="alert"
        aria-live="assertive"
      >
        {/* Top App Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md overflow-hidden ring-1 ring-black/10 shrink-0 bg-primary/10 flex items-center justify-center">
              <img src={APP_LOGO} alt="App Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-on-surface tracking-tight">
                TATOE Optical
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">• Flash Express</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-outline">ตอนนี้</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              aria-label="ปิดการแจ้งเตือน"
            >
              <span className="material-symbols-outlined text-[13px]">close</span>
            </button>
          </div>
        </div>

        {/* Content Row with Icon & Message */}
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <span className="material-symbols-outlined text-[20px] animate-pulse">
              local_shipping
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[13px] text-on-surface leading-snug">
              {notification.title}
            </h4>
            <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 leading-relaxed">
              {notification.body}
            </p>
          </div>
        </div>

        {/* Action Prompt / Progress Bar Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-[10px]">
          <span className="text-primary font-bold flex items-center gap-1">
            <span>แตะเพื่อดูสถานะพัสดุใน Orders</span>
            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
          </span>
          <span className="text-outline">เลื่อนหรือแตะเพื่อเปิด</span>
        </div>
      </div>
    </div>
  );
};
