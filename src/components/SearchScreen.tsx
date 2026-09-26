import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { FilterModal } from './FilterModal';
import { PriceRangeFilter } from './PriceRangeFilter';

export type SortOption = 'popular' | 'price_asc' | 'price_desc';

interface SortOptionConfig {
  id: SortOption;
  label: string;
  shortLabel: string;
  badge: string;
  subLabel: string;
  icon: string;
}

const SORT_OPTIONS: SortOptionConfig[] = [
  {
    id: 'popular',
    label: 'ยอดนิยม (คะแนนรีวิวสูงสุด)',
    shortLabel: 'ยอดนิยม ★',
    badge: 'Rating',
    subLabel: 'เรียงตามคะแนนความพึงพอใจและรีวิว (Popularity)',
    icon: 'star'
  },
  {
    id: 'price_asc',
    label: 'ราคา: จากต่ำไปสูง',
    shortLabel: 'ราคา: ต่ำ-สูง',
    badge: 'Price Low-High',
    subLabel: 'เรียงจากราคาประหยัดที่สุดไปแพงที่สุด (Low to High)',
    icon: 'arrow_upward'
  },
  {
    id: 'price_desc',
    label: 'ราคา: จากสูงไปต่ำ',
    shortLabel: 'ราคา: สูง-ต่ำ',
    badge: 'Price High-Low',
    subLabel: 'เรียงจากราคาสูงสุดระดับพรีเมียม (High to Low)',
    icon: 'arrow_downward'
  }
];

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
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(500);
  const [maxPrice, setMaxPrice] = useState(3000);
  const [showPriceSlider, setShowPriceSlider] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const isPriceFiltered = minPrice > 500 || maxPrice < 3000;

  // Close sort dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter products by search keywords and categories first
  const baseFilteredProducts = products.filter((item) => {
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

    return true;
  });

  // Filter by min and max price
  const filteredProducts = baseFilteredProducts.filter((item) => {
    return item.price >= minPrice && item.price <= maxPrice;
  });

  // Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'price_asc') return a.price - b.price;
    if (sortOption === 'price_desc') return b.price - a.price;
    // 'popular' sorts by rating descending, and if equal, by reviewCount
    if (b.rating !== a.rating) return b.rating - a.rating;
    return (b.reviewCount || 0) - (a.reviewCount || 0);
  });

  const currentSortConfig =
    SORT_OPTIONS.find((opt) => opt.id === sortOption) || SORT_OPTIONS[0];

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

          {/* Sort Dropdown Filter */}
          <div className="relative flex-shrink-0" ref={sortDropdownRef}>
            <button
              type="button"
              id="sort-dropdown-trigger"
              onClick={() => setIsSortDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold transition-all active:scale-95 shadow-xs border ${
                sortOption !== 'popular'
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
              }`}
              aria-haspopup="listbox"
              aria-expanded={isSortDropdownOpen}
              title="เลือกการเรียงลำดับสินค้า: ราคา หรือ ความนิยม"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  sortOption !== 'popular' ? 'text-on-primary' : 'text-primary'
                }`}
                style={sortOption === 'popular' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {currentSortConfig.icon}
              </span>
              <span className={sortOption !== 'popular' ? 'opacity-90 font-normal' : 'text-on-surface-variant font-normal'}>
                เรียง:
              </span>
              <span className="font-bold">{currentSortConfig.shortLabel}</span>
              <span
                className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                  isSortDropdownOpen ? 'rotate-180' : ''
                } ${sortOption !== 'popular' ? 'text-on-primary' : 'text-outline'}`}
              >
                expand_more
              </span>
            </button>

            {/* Dropdown Menu Popover */}
            {isSortDropdownOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-72 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/25 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1"
                role="listbox"
                aria-label="ตัวเลือกการเรียงลำดับสินค้า"
              >
                <div className="px-2.5 py-1 text-[11px] font-bold text-on-surface-variant flex items-center justify-between border-b border-outline-variant/15 mb-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">swap_vert</span>
                    <span>เรียงลำดับสินค้า (Sort by)</span>
                  </span>
                  <span className="text-[10px] text-outline">3 รูปแบบ</span>
                </div>

                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setSortOption(opt.id);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-start gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-bold shadow-2xs border border-primary/25'
                          : 'hover:bg-surface-container text-on-surface border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-[16px]"
                          style={opt.id === 'popular' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {opt.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-primary text-[17px] shrink-0">
                              check_circle
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-on-surface-variant font-normal mt-0.5 leading-snug">
                          {opt.subLabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-outline-variant/40 flex-shrink-0 mx-0.5"></div>

          {/* Price Range Chip Toggle */}
          <button
            type="button"
            onClick={() => setShowPriceSlider((prev) => !prev)}
            className={`flex-shrink-0 h-9 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 border ${
              isPriceFiltered
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : showPriceSlider
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-surface-container text-on-surface border-outline-variant/20 hover:bg-surface-container-high'
            }`}
            title="เปิด/ปิด แถบสไลเดอร์ปรับช่วงราคา (Min/Max Price)"
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={isPriceFiltered ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              payments
            </span>
            <span>ช่วงราคา:</span>
            <span className="font-bold">
              {isPriceFiltered
                ? `฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`
                : 'ทุกราคา'}
            </span>
            <span
              className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                showPriceSlider ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
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

      {/* Price Range Slider & Input Filter Section */}
      {showPriceSlider && (
        <PriceRangeFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          minLimit={500}
          maxLimit={3000}
          step={50}
          matchingCount={filteredProducts.length}
          onChange={(newMin, newMax) => {
            setMinPrice(newMin);
            setMaxPrice(newMax);
          }}
          onReset={() => {
            setMinPrice(500);
            setMaxPrice(3000);
          }}
          isCollapsible={true}
          defaultExpanded={true}
        />
      )}

      {/* Results Count Bar & Micro Tag & Dropdown Sort Selector */}
      <div className="flex flex-col gap-2 px-0.5 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-headline-sm text-on-surface tracking-tight">
              พบสินค้า {sortedProducts.length} รายการ
            </span>
            <span className="text-body-sm text-on-surface-variant truncate">
              สำหรับ "{searchKeyword || 'ทั้งหมด'}"
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Inline Dropdown Filter Select */}
            <div className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2.5 py-1.5 rounded-xl border border-outline-variant/20 text-xs transition-colors shadow-2xs">
              <span
                className="material-symbols-outlined text-[15px] text-primary"
                style={sortOption === 'popular' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {currentSortConfig.icon}
              </span>
              <label htmlFor="search-sort-dropdown" className="text-[11px] text-on-surface-variant font-medium hidden xs:inline">
                เรียงตาม:
              </label>
              <select
                id="search-sort-dropdown"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-transparent text-on-surface font-semibold text-xs focus:outline-none cursor-pointer pr-1"
                aria-label="ตัวกรองเรียงลำดับสินค้าตามราคาหรือความนิยม"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin && onOpenAddProduct && (
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="flex items-center gap-1 text-xs text-amber-900 font-bold bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-xl transition-colors border border-amber-300 active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span className="hidden sm:inline">เพิ่มสินค้า</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1 text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span className="text-label-sm font-semibold">ของแท้ 100%</span>
            </div>
          </div>
        </div>

        {/* Active Sort & Filter Indicator Badges */}
        {(sortOption !== 'popular' || isPriceFiltered || selectedShape !== 'all' || selectedMaterial !== 'all') && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-on-surface-variant pt-0.5">
            <span className="text-[11px] font-medium">ตัวกรองที่เลือก:</span>

            {/* Sort Badge */}
            {sortOption !== 'popular' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] border border-primary/25">
                <span className="material-symbols-outlined text-[13px]">{currentSortConfig.icon}</span>
                <span>{currentSortConfig.label}</span>
                <button
                  type="button"
                  onClick={() => setSortOption('popular')}
                  className="w-3.5 h-3.5 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors ml-0.5"
                  title="รีเซ็ตกลับเป็นความนิยม"
                  aria-label="รีเซ็ตกลับเป็นความนิยม"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </span>
            )}

            {/* Price Filter Badge */}
            {isPriceFiltered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] border border-primary/25">
                <span className="material-symbols-outlined text-[13px]">payments</span>
                <span>฿{minPrice.toLocaleString()} – ฿{maxPrice.toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice(500);
                    setMaxPrice(3000);
                  }}
                  className="w-3.5 h-3.5 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors ml-0.5"
                  title="ล้างช่วงราคา"
                  aria-label="ล้างช่วงราคา"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </span>
            )}

            {/* Shape Badge */}
            {selectedShape !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px]">
                <span>{selectedShape === 'drop' ? 'ทรงหยดน้ำ' : selectedShape === 'square' ? 'ทรงเหลี่ยม' : 'กรอบไทเทเนียม'}</span>
                <button
                  type="button"
                  onClick={() => setSelectedShape('all')}
                  className="w-3.5 h-3.5 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors ml-0.5"
                  title="ล้างตัวกรองทรงแว่น"
                  aria-label="ล้างตัวกรองทรงแว่น"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </span>
            )}

            {/* Material Badge */}
            {selectedMaterial !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px]">
                <span>วัสดุ: {selectedMaterial}</span>
                <button
                  type="button"
                  onClick={() => setSelectedMaterial('all')}
                  className="w-3.5 h-3.5 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors ml-0.5"
                  title="ล้างตัวกรองวัสดุ"
                  aria-label="ล้างตัวกรองวัสดุ"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </span>
            )}

            {/* Reset All Button */}
            <button
              type="button"
              onClick={() => {
                setSortOption('popular');
                setMinPrice(500);
                setMaxPrice(3000);
                setSelectedShape('all');
                setSelectedMaterial('all');
              }}
              className="text-[11px] text-error hover:underline font-semibold ml-1 cursor-pointer"
            >
              ล้างทั้งหมด
            </button>
          </div>
        )}
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
                      onDeleteProduct && onDeleteProduct(item.id);
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
          setMaxPrice(3000);
        }}
        resultCount={sortedProducts.length * 4}
      />
    </div>
  );
};
