import React, { useState } from 'react';
import { Product } from '../types';
import { FilterModal } from './FilterModal';

interface SearchScreenProps {
  products: Product[];
  wishlist: string[];
  isAdmin?: boolean;
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenPrescriptionModal: () => void;
  onOpenAddProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  products,
  wishlist,
  isAdmin,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
  onOpenPrescriptionModal,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct
}) => {
  const [searchKeyword, setSearchKeyword] = useState('Big Eye');
  const [selectedShape, setSelectedShape] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'popular' | 'price_asc' | 'price_desc'>('popular');
  const [minPrice, setMinPrice] = useState(500);
  const [maxPrice, setMaxPrice] = useState(2500);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter products
  const filteredProducts = products.filter((item) => {
    // Keyword
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchColor = item.colorName.toLowerCase().includes(q);
      const matchTag = item.tag?.toLowerCase().includes(q);
      if (!matchName && !matchColor && !matchTag) return false;
    }

    // Shape
    if (selectedShape === 'drop' && item.shape !== 'drop' && item.shape !== 'round') return false;
    if (selectedShape === 'square' && item.shape !== 'square') return false;
    if (selectedShape === 'titanium' && item.material !== 'titanium') return false;

    // Material from modal
    if (selectedMaterial !== 'all' && item.material !== selectedMaterial) return false;

    // Price
    if (item.price < minPrice || item.price > maxPrice) return false;

    return true;
  });

  // Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'price_asc') return a.price - b.price;
    if (sortOption === 'price_desc') return b.price - a.price;
    return b.rating - a.rating;
  });

  const toggleSort = () => {
    if (sortOption === 'popular') setSortOption('price_asc');
    else if (sortOption === 'price_asc') setSortOption('price_desc');
    else setSortOption('popular');
  };

  const sortLabels = {
    popular: 'ยอดนิยม',
    price_asc: 'ราคาต่ำ-สูง',
    price_desc: 'ราคาสูง-ต่ำ'
  };

  return (
    <div className="flex flex-col w-full gap-space-md pb-4">
      {/* Sticky Search & Filter Header Section */}
      <div className="sticky top-16 z-30 -mx-margin px-margin py-space-sm bg-surface/95 backdrop-blur-md flex flex-col gap-space-sm shadow-sm border-b border-outline-variant/15">
        {/* Search Bar Input Box */}
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3.5 text-primary text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="ค้นหารุ่น ทรงแว่น หรือวัสดุกรอบ..."
            className="w-full h-11 pl-11 pr-10 rounded-xl bg-surface-container-high text-on-surface font-body-md text-sm focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-outline"
            aria-label="ค้นหาแว่นตา"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-2.5 w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant active:scale-90 transition-transform"
              aria-label="ล้างคำค้นหา"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Quick Action Controls & Dynamic Tag Filters */}
        <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-0.5">
          {/* Filter Button with Active Badge */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-full bg-surface-container-highest text-on-surface font-semibold text-xs active:scale-95 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
            <span>ตัวกรอง</span>
            <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center leading-none">
              {selectedMaterial !== 'all' || maxPrice < 2500 ? '2' : '1'}
            </span>
          </button>

          {/* Sort Selection Chip */}
          <button
            onClick={toggleSort}
            className="flex-shrink-0 flex items-center gap-1 h-9 px-3 rounded-full bg-surface-container text-on-surface text-xs active:scale-95 transition-all"
          >
            <span className="text-on-surface-variant font-normal">เรียง:</span>
            <span className="font-semibold text-primary">{sortLabels[sortOption]}</span>
            <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
          </button>

          <div className="w-px h-5 bg-outline-variant/40 flex-shrink-0 mx-0.5"></div>

          {/* Filter Pills */}
          <button
            onClick={() => setSelectedShape('all')}
            className={`flex-shrink-0 h-9 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm transition-transform active:scale-95 ${
              selectedShape === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {selectedShape === 'all' && (
              <span className="material-symbols-outlined text-[14px]">check</span>
            )}
            <span>ทั้งหมด</span>
          </button>

          <button
            onClick={() => setSelectedShape('drop')}
            className={`flex-shrink-0 h-9 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
              selectedShape === 'drop'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {selectedShape === 'drop' && (
              <span className="material-symbols-outlined text-[14px]">check</span>
            )}
            <span>ทรงหยดน้ำ</span>
          </button>

          <button
            onClick={() => setSelectedShape('square')}
            className={`flex-shrink-0 h-9 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
              selectedShape === 'square'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {selectedShape === 'square' && (
              <span className="material-symbols-outlined text-[14px]">check</span>
            )}
            <span>ทรงเหลี่ยม</span>
          </button>

          <button
            onClick={() => setSelectedShape('titanium')}
            className={`flex-shrink-0 h-9 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
              selectedShape === 'titanium'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {selectedShape === 'titanium' && (
              <span className="material-symbols-outlined text-[14px]">check</span>
            )}
            <span>กรอบไทเทเนียม</span>
          </button>
        </div>
      </div>

      {/* Results Count Bar & Micro Tag */}
      <div className="flex items-center justify-between px-0.5 pt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-headline-sm text-on-surface tracking-tight">
            พบสินค้า {sortedProducts.length} รายการ
          </span>
          <span className="text-body-sm text-on-surface-variant">สำหรับ "{searchKeyword || 'ทั้งหมด'}"</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && onOpenAddProduct && (
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="flex items-center gap-1 text-xs text-amber-900 font-bold bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors border border-amber-300"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              เพิ่มสินค้า
            </button>
          )}
          <div className="flex items-center gap-1 text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span className="text-label-sm font-semibold">ของแท้ 100%</span>
          </div>
        </div>
      </div>

      {/* 2-Column Product Grid */}
      <div className="grid grid-cols-2 gap-space-md w-full">
        {sortedProducts.map((item) => {
          const isWish = wishlist.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => onSelectProduct(item)}
              className="group relative flex flex-col rounded-xl bg-surface-container-lowest p-2.5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-outline-variant/10"
            >
              {/* Admin Overlay Controls */}
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
                      if (confirm(`คุณต้องการลบสินค้า "${item.name}" หรือไม่?`)) {
                        onDeleteProduct && onDeleteProduct(item.id);
                      }
                    }}
                    className="w-6 h-6 rounded bg-error-container text-on-error-container flex items-center justify-center hover:bg-red-200 active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              )}
              {/* Product Visual Showcase Box */}
              <div className="relative w-full aspect-[4/3] rounded-lg bg-surface-container-low overflow-hidden flex items-center justify-center p-2">
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                {/* Favorite Heart Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(item.id);
                  }}
                  className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center transition-all active:scale-75 shadow-sm ${
                    isWish ? 'text-error' : 'text-outline hover:text-error'
                  }`}
                  aria-label="บันทึกในรายการโปรด"
                >
                  <span
                    className="material-symbols-outlined text-[16px] pointer-events-none"
                    style={isWish ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    favorite
                  </span>
                </button>
                {/* Lens Feature Micro Pill */}
                {item.tag && (
                  <span
                    className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight ${
                      item.tag === 'Blue Block'
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : 'bg-surface-container-highest/90 text-on-surface'
                    }`}
                  >
                    {item.tag}
                  </span>
                )}
              </div>

              {/* Content Meta */}
              <div className="flex flex-col mt-2.5 gap-1 flex-1">
                {/* Stock status & Rating Row */}
                <div className="flex items-center justify-between text-xs">
                  {item.stockStatus === 'low_stock' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      เหลือ {item.stockCount || 3} ชิ้นสุดท้าย
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      มีสินค้า
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 text-on-surface font-semibold text-[11px]">
                    <span
                      className="material-symbols-outlined text-[14px] text-amber-500"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    {item.rating}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                  {item.name}
                </h3>

                {/* Frame Color Spec */}
                <span className="text-[11px] text-on-surface-variant truncate">
                  {item.colorName}
                </span>

                {/* Price & Action Trigger */}
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-outline">ราคาปกติ</span>
                    <span className="font-bold text-sm text-primary">
                      ฿{item.price.toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(item);
                    }}
                    className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-transform shadow-sm hover:bg-primary-container"
                    aria-label="ใส่ตะกร้า"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prescription Consult Floating Prompt / Banner */}
      <div className="mt-space-sm mb-2 p-4 rounded-xl bg-gradient-to-r from-primary-fixed to-secondary-fixed/50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">medical_services</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-on-primary-fixed leading-tight">
              มีใบวัดสายตาแล้ว?
            </span>
            <span className="text-[11px] text-on-primary-fixed-variant">
              อัปโหลดภาพเพื่อให้ผู้เชี่ยวชาญช่วยตัดเลนส์
            </span>
          </div>
        </div>
        <button
          onClick={onOpenPrescriptionModal}
          className="flex-shrink-0 px-3 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold active:scale-95 transition-all shadow-sm"
        >
          อัปโหลด
        </button>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedMaterial={selectedMaterial}
        onSelectMaterial={setSelectedMaterial}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onPriceChange={(min, max) => {
          setMinPrice(min);
          setMaxPrice(max);
        }}
        onReset={() => {
          setSelectedMaterial('all');
          setSelectedShape('all');
          setMinPrice(500);
          setMaxPrice(2500);
        }}
        resultCount={sortedProducts.length * 4}
      />
    </div>
  );
};
