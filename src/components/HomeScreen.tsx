import React, { useState } from 'react';
import { Product, UserProfile, ScreenId } from '../types';
import { APP_LOGO } from '../data/mockData';
import { AIRecommendationSection } from './AIRecommendationSection';

interface HomeScreenProps {
  user: UserProfile;
  products: Product[];
  wishlist: string[];
  viewedShapes?: Record<string, number>;
  comparisonProductIds?: string[];
  onToggleCompare?: (productId: string) => void;
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenVirtualTryOn: () => void;
  onOpenVirtualTryOnWithProduct?: (product: Product) => void;
  onResetShapeHistory?: () => void;
  onSimulateClickShape?: (shape: string) => void;
  onOpenAddProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onResetProducts?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  products,
  wishlist,
  viewedShapes = { square: 3, round: 1 },
  comparisonProductIds = [],
  onToggleCompare,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
  onNavigate,
  onOpenVirtualTryOn,
  onOpenVirtualTryOnWithProduct,
  onResetShapeHistory,
  onSimulateClickShape,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onResetProducts
}) => {
  const [activeCategory, setActiveCategory] = useState<'prescription' | 'sunglasses' | 'blue-light' | 'sports'>('prescription');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user.role === 'admin';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('search');
  };

  // Filter products by selected category for flexible browsing
  const categoryFiltered = products.filter(
    (p) => activeCategory === 'prescription' || p.category === activeCategory
  );

  const featuredList = categoryFiltered.slice(0, 2);
  const popularList = categoryFiltered.slice(2);

  return (
    <div className="flex flex-col w-full space-y-5 pb-4">
      {/* 1. Greeting Bar with User and Logo */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-space-md">
          <button
            onClick={() => onNavigate('profile')}
            className="relative active:scale-95 transition-transform"
            aria-label="ดูโปรไฟล์"
          >
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-secondary-container flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            </span>
          </button>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-headline-sm text-on-surface">
                สวัสดี 👋 {user.name.replace('คุณ', '')}
              </span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-800 text-[10px] font-bold border border-amber-500/30">
                  Admin
                </span>
              )}
            </div>
            <span className="text-body-sm text-on-surface-variant">
              {isAdmin ? 'ระบบจัดการร้านและคลังสินค้า' : 'ค้นพบกรอบแว่นที่ใช่สำหรับใบหน้าคุณ'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('home')}
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center p-1 shadow-sm active:scale-95 transition-transform overflow-hidden border border-outline-variant/15 ring-1 ring-primary/10"
            aria-label="TATOE Optical หน้าหลัก"
          >
            <img
              src={APP_LOGO}
              alt="TATOE Optical"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-lg"
            />
          </button>
        </div>
      </div>

      {/* Admin Quick Action Banner (When Role is Admin) */}
      {isAdmin && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700 text-[20px]">
                shield_person
              </span>
              <div>
                <h3 className="font-bold text-xs text-amber-950">โหมดผู้ดูแลระบบ (Admin Mode)</h3>
                <p className="text-[11px] text-amber-800">
                  มีสิทธิ์ เพิ่มสินค้าใหม่, แก้ไขราคา/รายละเอียด, และลบสินค้า
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold bg-amber-200 px-2 py-0.5 rounded-full text-amber-900">
              {products.length} ชิ้น
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
            {onOpenAddProduct && (
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform hover:bg-amber-800"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>เพิ่มสินค้าใหม่</span>
              </button>
            )}
            {onResetProducts && (
              <button
                type="button"
                onClick={onResetProducts}
                className="py-2 px-3 rounded-xl bg-white border border-amber-300 text-amber-900 font-semibold text-xs flex items-center gap-1 active:scale-95 transition-transform hover:bg-amber-50"
              >
                <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                <span>รีเซ็ตค่าเดิม</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-space-sm">
        <div className="flex-1 flex items-center h-12 px-space-md bg-surface-container-low rounded-xl text-on-surface-variant shadow-sm transition-all focus-within:bg-surface-container-lowest focus-within:ring-1 focus-within:ring-primary focus-within:text-on-surface">
          <span className="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาแว่นตา รุ่น หรือแบรนด์..."
            className="w-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline text-sm"
          />
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="text-outline hover:text-primary transition-colors flex items-center justify-center p-1"
            aria-label="ค้นหาด้วยเสียง"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('search')}
          className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-95 transition-transform shrink-0"
          aria-label="ไปหน้าค้นหาและตัวกรอง"
        >
          <span className="material-symbols-outlined text-[22px]">tune</span>
        </button>
      </form>

      {/* 2. Hero Promotional Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container via-primary to-secondary p-space-lg text-on-primary shadow-md">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="absolute top-2 right-4 opacity-15 pointer-events-none">
          <span className="material-symbols-outlined text-[110px]">visibility</span>
        </div>
        <div className="relative z-10 flex flex-col items-start max-w-[240px]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold text-on-primary mb-2 shadow-sm">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            คอลเลกชันใหม่ Big Eye 2025
          </span>
          <h2 className="font-bold text-[19px] tracking-tight text-on-primary mb-1 leading-snug">
            กรอบเบาพิเศษเพียง 8 กรัม
          </h2>
          <p className="text-[12px] text-surface-container-low/90 mb-3.5 leading-relaxed">
            ใส่สบายตลอดวัน สัมผัสนุ่มแนบแก้ม ไม่กดทับดั้งจมูก
          </p>
          <button
            onClick={() => {
              if (products.length > 0) onSelectProduct(products[0]);
              else onNavigate('search');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-lowest text-primary font-bold text-xs shadow-sm active:scale-95 transition-transform"
          >
            <span>ดูสินค้า</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* 3. Category Selector Tabs */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-title-md text-on-surface">หมวดหมู่แว่นตา</span>
          <span className="text-label-sm text-primary font-semibold">4 หมวดหมู่</span>
        </div>
        <div className="flex gap-space-sm overflow-x-auto no-scrollbar py-1 -mx-margin px-margin">
          {/* Active Pill: แว่นสายตา */}
          <button
            onClick={() => setActiveCategory('prescription')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shrink-0 shadow-sm transition-all active:scale-95 ${
              activeCategory === 'prescription'
                ? 'bg-secondary-fixed text-on-secondary-fixed ring-1 ring-primary/40 font-semibold'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="text-base">👓</span>
            <span className="text-xs font-semibold">แว่นสายตา</span>
            {activeCategory === 'prescription' && (
              <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            )}
          </button>

          {/* Pill 2: แว่นกันแดด */}
          <button
            onClick={() => setActiveCategory('sunglasses')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shrink-0 shadow-sm transition-all active:scale-95 ${
              activeCategory === 'sunglasses'
                ? 'bg-secondary-fixed text-on-secondary-fixed ring-1 ring-primary/40 font-semibold'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="text-base">🕶️</span>
            <span className="text-xs font-semibold">แว่นกันแดด</span>
            {activeCategory === 'sunglasses' && (
              <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            )}
          </button>

          {/* Pill 3: แว่นกรองแสง */}
          <button
            onClick={() => setActiveCategory('blue-light')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shrink-0 shadow-sm transition-all active:scale-95 ${
              activeCategory === 'blue-light'
                ? 'bg-secondary-fixed text-on-secondary-fixed ring-1 ring-primary/40 font-semibold'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="text-base">💻</span>
            <span className="text-xs font-semibold">แว่นกรองแสงฟ้า</span>
            {activeCategory === 'blue-light' && (
              <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            )}
          </button>

          {/* Pill 4: แว่นกีฬา */}
          <button
            onClick={() => setActiveCategory('sports')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shrink-0 shadow-sm transition-all active:scale-95 ${
              activeCategory === 'sports'
                ? 'bg-secondary-fixed text-on-secondary-fixed ring-1 ring-primary/40 font-semibold'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="text-base">🏃</span>
            <span className="text-xs font-semibold">แว่นกีฬา</span>
            {activeCategory === 'sports' && (
              <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            )}
          </button>
        </div>
      </div>

      {/* AI Recommendation: 'แว่นตาที่เหมาะกับคุณ' (วิเคราะห์จาก shape ที่คลิกดูบ่อยที่สุด) */}
      <AIRecommendationSection
        products={products}
        viewedShapes={viewedShapes}
        wishlist={wishlist}
        comparisonProductIds={comparisonProductIds}
        onToggleCompare={onToggleCompare}
        onToggleWishlist={onToggleWishlist}
        onSelectProduct={onSelectProduct}
        onAddToCart={onAddToCart}
        onOpenVirtualTryOnWithProduct={onOpenVirtualTryOnWithProduct}
        onResetShapeHistory={onResetShapeHistory}
        onSimulateClickShape={onSimulateClickShape}
      />

      {/* 4. Section 1: Featured Products (สินค้าแนะนำพิเศษ) */}
      <div className="flex flex-col space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <h3 className="font-bold text-headline-sm text-on-surface">สินค้าแนะนำพิเศษ</h3>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && onOpenAddProduct && (
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="flex items-center gap-1 text-xs text-amber-800 font-bold bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                เพิ่มสินค้า
              </button>
            )}
            <button
              onClick={() => onNavigate('search')}
              className="flex items-center text-xs text-primary font-semibold hover:underline"
            >
              ดูทั้งหมด
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        {featuredList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-container-low text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[32px]">inventory_2</span>
            <p className="text-xs text-on-surface-variant font-medium">ยังไม่มีสินค้าในหมวดนี้</p>
            {isAdmin && onOpenAddProduct && (
              <button
                onClick={onOpenAddProduct}
                className="mt-1 px-3 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold"
              >
                + เพิ่มสินค้าแรก
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-space-md">
            {featuredList.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectProduct(item)}
                className="group flex flex-col bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-shadow relative cursor-pointer border border-outline-variant/10"
              >
                {/* Admin Action Badges */}
                {isAdmin && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-surface-container-lowest/95 backdrop-blur-md p-1 rounded-lg shadow-md border border-amber-300"
                  >
                    <button
                      type="button"
                      title="แก้ไขสินค้า"
                      onClick={() => onEditProduct && onEditProduct(item)}
                      className="w-6 h-6 rounded bg-amber-100 text-amber-900 flex items-center justify-center hover:bg-amber-200 active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                    <button
                      type="button"
                      title="ลบสินค้า"
                      onClick={() => {
                        onDeleteProduct && onDeleteProduct(item.id);
                      }}
                      className="w-6 h-6 rounded bg-error-container text-on-error-container flex items-center justify-center hover:bg-red-200 active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                )}

                <div className="relative w-full aspect-square bg-surface-container-low rounded-xl mb-3 flex items-center justify-center p-3 overflow-hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(item.id);
                    }}
                    className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-transform ${
                      wishlist.includes(item.id) ? 'text-error' : 'text-outline'
                    }`}
                    aria-label="บันทึกในรายการโปรด"
                  >
                    <span
                      className="material-symbols-outlined text-[17px]"
                      style={wishlist.includes(item.id) ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      favorite
                    </span>
                  </button>

                  {!isAdmin && item.badge && (
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-secondary text-on-secondary text-[10px] font-bold shadow-xs">
                      {item.badge}
                    </span>
                  )}

                  {/* Compare Toggle Button */}
                  {onToggleCompare && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompare(item.id);
                      }}
                      className={`absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all active:scale-90 ${
                        comparisonProductIds?.includes(item.id)
                          ? 'bg-primary text-on-primary ring-2 ring-primary/40'
                          : 'bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface-variant hover:text-primary'
                      }`}
                      title="เปรียบเทียบแว่นตา (สูงสุด 3 รุ่น)"
                      aria-label="เปรียบเทียบ"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {comparisonProductIds?.includes(item.id) ? 'check' : 'compare_arrows'}
                      </span>
                      <span>{comparisonProductIds?.includes(item.id) ? 'เลือกแล้ว' : 'เปรียบเทียบ'}</span>
                    </button>
                  )}

                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex items-center gap-1 text-on-surface-variant text-[11px] mb-1">
                  <span className="material-symbols-outlined text-amber-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="font-semibold text-on-surface">{item.rating}</span>
                  <span>({item.reviewCount})</span>
                </div>

                <h4 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                  {item.name}
                </h4>
                <span className="text-[11px] text-on-surface-variant mb-2 truncate">
                  {item.colorName}
                </span>

                <div className="mt-auto flex items-center justify-between pt-1">
                  <span className="font-bold text-sm text-primary">฿{item.price.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(item);
                    }}
                    className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center active:scale-95 shadow-xs transition-transform hover:bg-primary hover:text-on-primary"
                    aria-label="ใส่ตะกร้า"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Section 2: Popular Frames (แว่นตากรยอดนิยม) */}
      <div className="flex flex-col space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <h3 className="font-bold text-headline-sm text-on-surface">แว่นตากรยอดนิยม</h3>
          </div>
          <span className="text-[11px] text-outline font-medium">ยอดฮิตเดือนนี้</span>
        </div>

        <div className="flex flex-col space-y-2.5">
          {popularList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectProduct(item)}
              className="flex items-center p-space-md bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-all gap-space-md cursor-pointer border border-outline-variant/10 relative"
            >
              <div className="w-24 h-24 rounded-xl bg-surface-container-low shrink-0 flex items-center justify-center p-2 relative overflow-hidden">
                {item.tag && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-bold text-[10px]">
                    {item.tag}
                  </span>
                )}
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-bold text-sm text-on-surface truncate">
                    {item.name}
                  </h4>
                  <span className="font-bold text-sm text-primary shrink-0 ml-2">
                    ฿{item.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-[12px] text-on-surface-variant line-clamp-1 mb-2">
                  {item.lensType || item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-tertiary bg-surface-container-low px-2 py-0.5 rounded-full truncate max-w-[170px]">
                    <span className="material-symbols-outlined text-[13px] text-primary">check</span>
                    {item.material === 'titanium' ? 'ไทเทเนียมแท้ น้ำหนักเบา' : 'วัสดุคุณภาพ สวมใส่สบาย'}
                  </span>

                  {/* If Admin, show Edit & Delete right here */}
                  {isAdmin ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 ml-auto"
                    >
                      <button
                        type="button"
                        onClick={() => onEditProduct && onEditProduct(item)}
                        className="px-2 py-1 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-lg hover:bg-amber-200 active:scale-95 transition-all flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-[13px]">edit</span>
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProduct && onDeleteProduct(item.id);
                        }}
                        className="px-2 py-1 bg-error-container text-on-error-container text-[11px] font-bold rounded-lg hover:bg-red-200 active:scale-95 transition-all flex items-center gap-0.5"
                      >
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                        ลบ
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-primary text-xs font-semibold hover:underline flex items-center ml-auto"
                    >
                      เลือกเลนส์
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Eyewear Quiz / Virtual Fit Delight Card (div:nth-of-type(6)) - Made fully scrollable and prominent */}
      <div
        id="virtual-try-on-card"
        className="p-space-md rounded-2xl bg-surface-container-low flex items-center justify-between shadow-xs border border-outline-variant/20 hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">face_retouching_natural</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-on-surface leading-tight">
              ลองแว่นเสมือนจริง (Virtual 3D)
            </span>
            <span className="text-[11px] text-on-surface-variant">
              สแกนใบหน้าและลองทรงแว่นก่อนสั่งซื้อ
            </span>
          </div>
        </div>
        <button
          onClick={onOpenVirtualTryOn}
          className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm active:scale-95 transition-transform shrink-0"
        >
          เปิดกล้อง
        </button>
      </div>

      {/* 7. Warranty & Optical Claim System Service Card */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-sm text-on-surface">ระบบใบเคลมสินค้า (Claim System)</h3>
              <p className="text-[11px] text-on-surface-variant">
                บริการหลังการขาย • ดัดทรง • ซ่อมแซม • ติดตาม 5 ขั้นตอน
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={() => onNavigate('claims')}
            className="h-10 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">edit_document</span>
            <span>กรอกใบเคลม</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('claims')}
            className="h-10 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">track_changes</span>
            <span>ตรวจสถานะเคลม</span>
          </button>
        </div>
      </div>
    </div>
  );
};
