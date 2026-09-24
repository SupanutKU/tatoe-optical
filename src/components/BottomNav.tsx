import React from 'react';
import { ScreenId } from '../types';

interface BottomNavProps {
  currentScreen: ScreenId;
  cartCount: number;
  onNavigate: (screen: ScreenId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  cartCount,
  onNavigate
}) => {
  // Don't show bottom nav on welcome, login, detail, or checkout screens to match the exact mockups
  const hiddenScreens: ScreenId[] = ['welcome', 'login', 'detail', 'checkout'];
  if (hiddenScreens.includes(currentScreen)) {
    return null;
  }

  const navItems: { id: ScreenId; label: string; icon: string; badge?: number }[] = [
    { id: 'home', label: 'หน้าหลัก', icon: 'home' },
    { id: 'search', label: 'ค้นหา', icon: 'search' },
    { id: 'cart', label: 'ตะกร้า', icon: 'shopping_bag', badge: cartCount },
    { id: 'orders', label: 'คำสั่งซื้อ', icon: 'local_shipping' },
    { id: 'profile', label: 'โปรไฟล์', icon: 'person' }
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_16px_-2px_rgba(15,23,42,0.05)] border-t border-outline-variant/20"
      aria-label="เมนูหลัก"
    >
      <div className="max-w-[430px] mx-auto h-16 px-space-sm flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-primary font-semibold scale-105'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-secondary text-on-secondary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none ring-2 ring-surface">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
