import React, { useState } from 'react';
import { Product, ProductReview, UserProfile } from '../types';
import { ProductReviewsSection } from './ProductReviewsSection';

interface ProductDetailScreenProps {
  product: Product;
  isFavorite: boolean;
  isAdmin?: boolean;
  reviews?: ProductReview[];
  currentUser?: UserProfile;
  onToggleFavorite: () => void;
  onAddToCart: (product: Product, quantity: number, selectedColor: string) => void;
  onOpenChat: (product?: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onAddReview?: (review: Omit<ProductReview, 'id' | 'date'>) => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  isFavorite,
  isAdmin,
  reviews = [],
  currentUser = { name: 'คุณลูกค้า', role: 'customer' } as UserProfile,
  onToggleFavorite,
  onAddToCart,
  onOpenChat,
  onEditProduct,
  onDeleteProduct,
  onAddReview
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('ดำด้าน Matte Black');
  const [showToast, setShowToast] = useState(false);

  const images = product.images.length > 0 ? product.images : [product.images[0]];

  const colorOptions = [
    { name: 'ดำด้าน Matte Black', label: 'ดำด้าน', hex: '#1e232a', slide: 0 },
    { name: 'เงินด้าน Satin Silver', label: 'เงินด้าน', hex: '#d2d7df', slide: 1 },
    { name: 'กันเมทัล Gunmetal Grey', label: 'กันเมทัล', hex: '#525b62', slide: 2 }
  ];

  const handleSelectColor = (colorName: string, slideIdx: number) => {
    setSelectedColor(colorName);
    if (images[slideIdx]) {
      setCurrentSlide(slideIdx);
    }
  };

  const handleUpdateQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedColor);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2200);
  };

  return (
    <div className="flex flex-col w-full pb-32">
      {/* Top Showcase Carousel Container */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-low shadow-sm">
        <div
          className="flex transition-transform duration-300 ease-out w-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {images.map((imgUrl, idx) => (
            <div
              key={idx}
              className="min-w-full relative aspect-[4/3] flex items-center justify-center bg-surface-container-lowest"
            >
              <img
                src={imgUrl}
                alt={`${product.name} - slide ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Floating Badges Top Left */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-on-primary text-[11px] font-semibold shadow-sm">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            รุ่นยอดนิยม
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold shadow-sm">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            สินค้าพร้อมส่ง
          </span>
        </div>

        {/* Carousel Indicator Overlay Bottom */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-inverse-surface/75 text-inverse-on-surface backdrop-blur-md text-[11px] font-semibold">
          <span className="material-symbols-outlined text-[13px]">photo_camera</span>
          <span>{currentSlide + 1}/{images.length}</span>
        </div>

        {/* Micro Navigation Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`rounded-full transition-all duration-200 ${
                currentSlide === idx ? 'w-2.5 h-2 bg-primary' : 'w-1.5 h-1.5 bg-outline-variant'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Admin Quick Action Banner on Detail Screen */}
      {isAdmin && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            <span className="text-xs font-bold">จัดการสินค้านี้ (Admin)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditProduct && onEditProduct(product)}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              แก้ไข
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteProduct && onDeleteProduct(product.id);
              }}
              className="px-2.5 py-1 bg-error-container hover:bg-red-200 text-on-error-container font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              ลบ
            </button>
          </div>
        </div>
      )}

      {/* Header & Price Block */}
      <div className="flex flex-col mt-4 gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold text-headline-md text-on-surface leading-tight">
            {product.name}
            <span className="text-body-md text-primary font-normal block mt-0.5">
              {product.subtitle || '(Titanium Edition)'}
            </span>
          </h2>
          <button
            onClick={onToggleFavorite}
            className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-transform active:scale-95 ${
              isFavorite
                ? 'bg-error-container/30 text-error'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
            aria-label="ถูกใจ"
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              favorite
            </span>
          </button>
        </div>

        {/* Ratings and Sales */}
        <div className="flex items-center gap-2 text-on-surface-variant text-xs">
          <div className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface">
            <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            <span className="font-bold">{product.rating}</span>
          </div>
          <span className="text-[12px]">({product.reviewCount} รีวิว)</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
          <span className="text-secondary font-medium text-[12px]">ยอดขาย {product.salesCount}</span>
        </div>

        {/* Pricing Row */}
        <div className="flex items-baseline gap-2.5 mt-2">
          <span className="font-bold text-headline-lg text-primary">
            ฿{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-body-md text-outline line-through">
              ฿{product.originalPrice.toLocaleString()}
            </span>
          )}
          {product.discountPercentage && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-error-container text-on-error-container">
              -{product.discountPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* Micro Benefit Pills */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface-container-low">
          <span className="material-symbols-outlined text-[18px] text-primary">clock_loader_40</span>
          <div className="flex flex-col">
            <span className="font-bold text-[11px] text-on-surface">เบาพิเศษ</span>
            <span className="text-[10px] leading-tight text-on-surface-variant">เพียง {product.weight}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface-container-low">
          <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
          <div className="flex flex-col">
            <span className="font-bold text-[11px] text-on-surface">ประกัน 1 ปี</span>
            <span className="text-[10px] leading-tight text-on-surface-variant">ศูนย์ไทยแท้</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface-container-low">
          <span className="material-symbols-outlined text-[18px] text-primary">local_shipping</span>
          <div className="flex flex-col">
            <span className="font-bold text-[11px] text-on-surface">ส่งฟรี</span>
            <span className="text-[10px] leading-tight text-on-surface-variant">มีเก็บปลายทาง</span>
          </div>
        </div>
      </div>

      {/* Color Selection */}
      <div className="flex flex-col mt-5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-title-md text-on-surface">ตัวเลือกสี (Color)</span>
          <span className="text-xs font-semibold text-primary">{selectedColor}</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5 mt-2.5">
          {colorOptions.map((opt) => {
            const isSelected = selectedColor === opt.name;
            return (
              <button
                key={opt.name}
                onClick={() => handleSelectColor(opt.name, opt.slide)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-primary-fixed text-on-primary-fixed ring-1 ring-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <div
                  className="relative w-8 h-8 rounded-full shadow-inner flex items-center justify-center"
                  style={{ backgroundColor: opt.hex }}
                >
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] text-white">check</span>
                  )}
                </div>
                <span className="text-xs font-medium text-center">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Specifications Grid (Bento Style) */}
      <div className="flex flex-col mt-6">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="material-symbols-outlined text-primary text-[20px]">straighten</span>
          <h3 className="font-bold text-title-md text-on-surface">ข้อมูลจำเพาะกรอบ (Frame Specs)</h3>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
              <span className="material-symbols-outlined text-[18px] text-secondary">category</span>
              <span className="text-[11px] font-semibold">วัสดุกรอบ (Material)</span>
            </div>
            <span className="font-bold text-sm text-on-surface">Pure Titanium</span>
            <span className="text-[11px] text-secondary">น้ำหนักเบา {product.weight}</span>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
              <span className="material-symbols-outlined text-[18px] text-secondary">aspect_ratio</span>
              <span className="text-[11px] font-semibold">ขนาดแว่น (Size)</span>
            </div>
            <span className="font-bold text-sm text-on-surface">{product.size}</span>
            <span className="text-[11px] text-on-surface-variant">หน้ากว้างมาตรฐาน</span>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
              <span className="material-symbols-outlined text-[18px] text-secondary">face</span>
              <span className="text-[11px] font-semibold">รูปทรง (Shape)</span>
            </div>
            <span className="font-bold text-sm text-on-surface">Square Rounded</span>
            <span className="text-[11px] text-on-surface-variant">เหมาะกับทุกรูปหน้า</span>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
              <span className="material-symbols-outlined text-[18px] text-secondary">security</span>
              <span className="text-[11px] font-semibold">การรับประกัน</span>
            </div>
            <span className="font-bold text-sm text-on-surface">1 ปีเต็ม</span>
            <span className="text-[11px] text-on-surface-variant">จากศูนย์ไทย</span>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="flex flex-col mt-5 p-3.5 rounded-xl bg-surface-container-low">
        <h4 className="font-bold text-sm text-on-surface mb-1.5 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-primary">description</span>
          รายละเอียดสินค้า
        </h4>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Customer Reviews Section (ใต้ส่วนคำบรรยายสินค้า) */}
      <ProductReviewsSection
        product={product}
        reviews={reviews}
        currentUser={currentUser}
        onAddReview={(rev) => onAddReview && onAddReview(rev)}
      />

      {/* Optical Store Promise & Chat Inquiry Card */}
      <div className="flex flex-col gap-2 mt-4 p-3.5 rounded-xl bg-secondary-fixed/50 text-on-secondary-fixed border border-secondary-fixed">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[26px] text-primary shrink-0">visibility</span>
          <div className="flex flex-col flex-1">
            <span className="text-xs font-bold">มีข้อสงสัยเกี่ยวกับแว่นตารุ่นนี้?</span>
            <span className="text-[11px] text-on-surface-variant">
              สอบถามขนาดกรอบ ชนิดเลนส์ หรือสต็อกสินค้ากับแอดมินร้านได้ทันที
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenChat(product)}
          className="w-full mt-1 py-2 px-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high border border-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98"
        >
          <span className="material-symbols-outlined text-[16px]">chat</span>
          <span>ทักแชทสอบถามสินค้านี้กับแอดมิน</span>
        </button>
      </div>

      {/* Fixed Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg shadow-xl pb-safe border-t border-outline-variant/15">
        <div className="max-w-[430px] mx-auto px-margin py-2.5 flex items-center gap-3">
          {/* Chat Specialist Action */}
          <button
            onClick={() => onOpenChat(product)}
            className="flex flex-col items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all text-on-surface"
            title="คุยกับแอดมินร้านเกี่ยวกับสินค้านี้"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">chat</span>
            <span className="text-[10px] leading-tight font-medium">คุยร้าน</span>
          </button>

          {/* Stepper for Quantity */}
          <div className="flex items-center bg-surface-container rounded-xl p-1 shrink-0">
            <button
              onClick={() => handleUpdateQuantity(-1)}
              className="w-8 h-9 flex items-center justify-center text-on-surface active:scale-90 transition-transform"
              aria-label="ลดจำนวน"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span className="w-7 text-center font-bold text-sm text-on-surface">
              {quantity}
            </span>
            <button
              onClick={() => handleUpdateQuantity(1)}
              className="w-8 h-9 flex items-center justify-center text-on-surface active:scale-90 transition-transform"
              aria-label="เพิ่มจำนวน"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>

          {/* Primary Add to Cart CTA */}
          <button
            onClick={handleAdd}
            className="flex-1 h-12 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-between px-4 shadow-md active:scale-98 hover:bg-primary-container transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              <span>เพิ่มลงตะกร้า</span>
            </div>
            <span className="font-bold text-sm">
              ฿{(product.price * quantity).toLocaleString()}
            </span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full shadow-lg animate-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-secondary-container text-[20px]">check_circle</span>
          <span className="text-xs font-semibold">เพิ่ม {product.name} ลงตะกร้าแล้ว</span>
        </div>
      )}
    </div>
  );
};
