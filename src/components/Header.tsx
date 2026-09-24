import React from 'react';
import { ScreenId, UserProfile } from '../types';
import { APP_LOGO } from '../data/mockData';

interface HeaderProps {
  currentScreen: ScreenId;
  title?: string;
  subtitle?: string;
  user: UserProfile;
  onNavigate: (screen: ScreenId) => void;
  onBack?: () => void;
  onOpenNotifications?: () => void;
  onOpenShare?: () => void;
  onOpenChat?: () => void;
  unreadChatCount?: number;
  unreadNotificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  title,
  subtitle,
  user,
  onNavigate,
  onBack,
  onOpenNotifications,
  onOpenShare,
  onOpenChat,
  unreadChatCount = 0,
  unreadNotificationCount = 0
}) => {
  // Sub-pages with Back Arrow
  if (currentScreen === 'detail' || currentScreen === 'checkout') {
    return (
      <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="max-w-[430px] mx-auto px-space-sm h-14 flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button
              onClick={onBack || (() => onNavigate('home'))}
              className="w-11 h-11 flex items-center justify-center text-on-surface hover:bg-surface-container-high/50 rounded-full transition-colors active:scale-90"
              aria-label="ย้อนกลับ"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-bold text-headline-sm text-on-surface">
              {title || (currentScreen === 'detail' ? 'Product Detail' : 'Checkout')}
            </h1>
          </div>
          <div className="flex items-center gap-space-xs pr-space-xs">
            <button
              onClick={onOpenShare}
              className="w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 rounded-full transition-colors active:scale-90"
              aria-label="แชร์"
            >
              <span className="material-symbols-outlined text-[22px]">share</span>
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="w-8 h-8 rounded-full overflow-hidden focus:ring-2 focus:ring-primary transition-all active:scale-95"
              aria-label="โปรไฟล์ผู้ใช้"
            >
              <img
                src={APP_LOGO}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Welcome or Login have minimal/no default sticky header
  if (currentScreen === 'welcome' || currentScreen === 'login') {
    return null;
  }

  const screenSubtitles: Record<string, string> = {
    home: 'Home',
    search: 'Search',
    cart: 'Cart',
    orders: 'Orders',
    profile: 'Profile'
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="max-w-[430px] mx-auto px-margin h-16 flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-space-sm text-left active:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[17px] text-primary tracking-tight leading-none">
              TATOE Optical
            </span>
            <span className="text-[12px] font-semibold text-on-surface-variant mt-0.5">
              {subtitle || screenSubtitles[currentScreen] || 'Shop'}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-space-sm">
          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="w-11 h-11 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-colors relative active:scale-90"
              aria-label="แชทร้านค้า"
              title="แชทร้านค้า / ตอบแชทลูกค้า"
            >
              <span className="material-symbols-outlined text-[22px]">forum</span>
              {unreadChatCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-surface animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenNotifications}
            className="w-11 h-11 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-colors relative active:scale-90"
            aria-label="การแจ้งเตือน"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadNotificationCount > 0 ? (
              <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-surface animate-pulse">
                {unreadNotificationCount}
              </span>
            ) : (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary/40 rounded-full ring-2 ring-surface"></span>
            )}
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-outline-variant/30 active:scale-95 transition-transform"
            aria-label="ดูโปรไฟล์"
          >
            <img
              src={APP_LOGO}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
