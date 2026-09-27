import React from 'react';

interface LowStockBadgeProps {
  stockStatus?: string;
  stockCount?: number;
  className?: string;
  variant?: 'badge' | 'inline' | 'compact';
}

/**
 * Checks if a product should display low stock urgency badge.
 * Matches when stockStatus is 'low_stock' or remaining units <= 5.
 */
export const isProductLowStock = (stockStatus?: string, stockCount?: number): boolean => {
  return stockStatus === 'low_stock' || (typeof stockCount === 'number' && stockCount > 0 && stockCount <= 5);
};

export const LowStockBadge: React.FC<LowStockBadgeProps> = ({
  stockStatus,
  stockCount,
  className = '',
  variant = 'badge'
}) => {
  if (!isProductLowStock(stockStatus, stockCount)) {
    return null;
  }

  const count = typeof stockCount === 'number' && stockCount > 0 ? stockCount : 3;

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/80 shadow-2xs ${className}`}
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
        </span>
        <span
          className="material-symbols-outlined text-[13px] text-amber-600"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          local_fire_department
        </span>
        <span>ใกล้หมด! เหลือเพียง {count} ชิ้น</span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[9px] font-black tracking-tight shadow-xs ring-1 ring-white/30 ${className}`}
      >
        <span
          className="material-symbols-outlined text-[11px] text-amber-200"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          local_fire_department
        </span>
        <span>เหลือ {count} ชิ้น</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-rose-600 via-rose-600 to-amber-600 text-white text-[10px] font-black tracking-tight shadow-md ring-1 ring-white/40 ${className}`}
      title={`สินค้าใกล้หมดสต็อก เหลือเพียง ${count} ชิ้นสุดท้าย`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-80"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-200"></span>
      </span>
      <span
        className="material-symbols-outlined text-[12px] text-amber-200 shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        local_fire_department
      </span>
      <span className="whitespace-nowrap">
        ใกล้หมด เหลือ {count} ชิ้น
      </span>
    </div>
  );
};
