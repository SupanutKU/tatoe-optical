import React, { useState } from 'react';
import { Product, ProductReview, UserProfile } from '../types';

interface ProductReviewsSectionProps {
  product: Product;
  reviews: ProductReview[];
  currentUser: UserProfile;
  onAddReview: (review: Omit<ProductReview, 'id' | 'date'>) => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
  reviews,
  currentUser,
  onAddReview
}) => {
  const [filter, setFilter] = useState<'all' | 'with_photos' | '5_star' | '4_star'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [selectedColor, setSelectedColor] = useState(product.colorName || 'ดำด้าน Matte Black');
  const [selectedLens, setSelectedLens] = useState(product.lensType || 'เลนส์มัลติโค้ตตัดแสงสะท้อน');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});

  // Filter reviews for this product
  const productReviews = reviews.filter((r) => r.productId === product.id);

  // Calculate actual average rating and breakdown
  const totalCount = productReviews.length;
  const avgRating = totalCount > 0
    ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
    : product.rating.toFixed(1);

  const filteredReviews = productReviews.filter((r) => {
    if (filter === 'with_photos') return r.photos && r.photos.length > 0;
    if (filter === '5_star') return r.rating === 5;
    if (filter === '4_star') return r.rating === 4;
    return true;
  });

  // Handle Photo upload from device
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input value
    e.target.value = '';
  };

  const handleAddSamplePhoto = (url: string) => {
    if (!photos.includes(url)) {
      setPhotos((prev) => [...prev, url]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onAddReview({
        productId: product.id,
        authorName: currentUser.name || 'คุณลูกค้า',
        authorAvatar: currentUser.avatarUrl,
        rating,
        comment: comment.trim(),
        photos,
        colorName: selectedColor,
        lensType: selectedLens,
        verifiedPurchase: true,
        helpfulCount: 0
      });

      // Reset form
      setComment('');
      setPhotos([]);
      setRating(5);
      setIsFormOpen(false);
      setIsSubmitting(false);
    }, 400);
  };

  const handleToggleHelpful = (reviewId: string) => {
    setHelpfulClicked((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5: return 'ยอดเยี่ยมมาก ⭐⭐⭐⭐⭐';
      case 4: return 'ดีมาก ⭐⭐⭐⭐';
      case 3: return 'ปานกลาง ⭐⭐⭐';
      case 2: return 'พอใช้ ⭐⭐';
      case 1: return 'ควรปรับปรุง ⭐';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col mt-6 pt-5 border-t border-outline-variant/20">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <h3 className="font-bold text-base text-on-surface">
            รีวิวจากลูกค้า ({totalCount} รีวิว)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="py-1.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all hover:bg-primary-container"
        >
          <span className="material-symbols-outlined text-[16px]">rate_review</span>
          <span>{isFormOpen ? 'ปิดฟอร์ม' : 'เขียนรีวิว'}</span>
        </button>
      </div>

      {/* Rating Score Summary Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/15 shadow-xs mb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Big Score */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center bg-amber-500/10 rounded-2xl p-2.5 min-w-[72px]">
              <span className="text-2xl font-black text-amber-600 font-mono leading-none">{avgRating}</span>
              <span className="text-[10px] text-on-surface-variant mt-1 font-semibold">เต็ม 5.0</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: star <= Math.round(Number(avgRating)) ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="text-xs text-on-surface font-semibold mt-1">
                ความพึงพอใจ 98%
              </span>
              <span className="text-[11px] text-on-surface-variant">
                จากผู้ใช้จริงที่ตัดเลนส์กับทางร้าน
              </span>
            </div>
          </div>

          {/* Quick stats badge */}
          <div className="flex flex-col items-end gap-1 text-[11px] text-on-surface-variant">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              ตรวจวัดจริง 100%
            </span>
            <span className="text-[10px] text-outline">ยอดสั่งซื้อ {product.salesCount}</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 mt-3 border-t border-outline-variant/15">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
              filter === 'all'
                ? 'bg-primary text-on-primary shadow-2xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            ทั้งหมด ({productReviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('with_photos')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1 transition-all ${
              filter === 'with_photos'
                ? 'bg-primary text-on-primary shadow-2xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">photo_camera</span>
            <span>มีรูปภาพ ({productReviews.filter((r) => r.photos && r.photos.length > 0).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('5_star')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1 transition-all ${
              filter === '5_star'
                ? 'bg-primary text-on-primary shadow-2xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>5 ดาว ⭐</span>
            <span>({productReviews.filter((r) => r.rating === 5).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('4_star')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1 transition-all ${
              filter === '4_star'
                ? 'bg-primary text-on-primary shadow-2xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>4 ดาว ⭐</span>
            <span>({productReviews.filter((r) => r.rating === 4).length})</span>
          </button>
        </div>
      </div>

      {/* Add Review Form (Collapsible / Modal Card) */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface-container-lowest rounded-2xl p-4 border border-primary/30 shadow-md mb-5 space-y-3.5 animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
              <h4 className="font-bold text-xs text-on-surface">เขียนรีวิวและให้คะแนนสินค้า</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Interactive Star Rating */}
          <div className="flex flex-col items-center py-2 bg-surface-container-low rounded-xl">
            <span className="text-[11px] font-semibold text-on-surface-variant mb-1">
              กดเลือกระดับความพึงพอใจ
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-500 hover:scale-125 active:scale-95 transition-transform"
                  aria-label={`ให้คะแนน ${star} ดาว`}
                >
                  <span
                    className="material-symbols-outlined text-[28px]"
                    style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-700 mt-1">
              {getRatingLabel(rating)}
            </span>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
              <span>ความคิดเห็นของคุณ</span>
              <span className="text-[10px] text-outline">{comment.length}/500 ตัวอักษร</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="แบ่งปันประสบการณ์การใช้งาน ความคมชัดของเลนส์ น้ำหนักกรอบแว่น หรือความประทับใจ..."
              rows={3}
              maxLength={500}
              required
              className="w-full p-3 bg-surface-container-low rounded-xl text-xs text-on-surface placeholder:text-outline border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>

          {/* Option Tags: Color & Lens */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                สีกรอบที่สั่ง
              </label>
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-surface-container-low rounded-lg text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                ชนิดเลนส์
              </label>
              <input
                type="text"
                value={selectedLens}
                onChange={(e) => setSelectedLens(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-surface-container-low rounded-lg text-xs text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">add_a_photo</span>
                <span>แนบรูปภาพสินค้า / รูปถ่ายขณะสวมใส่</span>
              </label>
              <span className="text-[10px] text-on-surface-variant">({photos.length}/4 รูป)</span>
            </div>

            {/* Photo Thumbnails & Add Button */}
            <div className="flex flex-wrap gap-2">
              {photos.map((photoUrl, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-outline-variant/30 group">
                  <img src={photoUrl} alt={`รูปรีวิว ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="ลบรูปนี้"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ))}

              {photos.length < 4 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-outline-variant/40 hover:border-primary/60 bg-surface-container-low flex flex-col items-center justify-center gap-0.5 cursor-pointer text-on-surface-variant hover:text-primary transition-all active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                  <span className="text-[9px] font-bold">+ เพิ่มรูป</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Quick Sample Photos for Testing */}
            {photos.length === 0 && (
              <div className="pt-1">
                <span className="text-[10px] text-outline block mb-1">หรือเลือกรูปตัวอย่างการสวมใส่:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddSamplePhoto(product.images[0])}
                    className="text-[10px] px-2 py-1 bg-surface-container-high rounded-lg text-on-surface hover:bg-surface-container flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px]">image</span>
                    รูปกรอบแว่น
                  </button>
                  {product.images[1] && (
                    <button
                      type="button"
                      onClick={() => handleAddSamplePhoto(product.images[1])}
                      className="text-[10px] px-2 py-1 bg-surface-container-high rounded-lg text-on-surface hover:bg-surface-container flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[12px]">image</span>
                      มุมมองด้านข้าง
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button Row */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="py-2.5 px-4 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm active:scale-98 transition-all hover:bg-primary-container disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>{isSubmitting ? 'กำลังบันทึกรีวิว...' : 'โพสต์รีวิวสินค้า'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-container-low text-center flex flex-col items-center gap-2 border border-outline-variant/15">
          <span className="material-symbols-outlined text-outline text-[32px]">rate_review</span>
          <p className="text-xs text-on-surface font-semibold">ยังไม่มีรีวิวตามเงื่อนไขที่เลือก</p>
          <p className="text-[11px] text-on-surface-variant">
            คุณสามารถเป็นคนแรกที่แชร์ความประทับใจสำหรับแว่นตารุ่นนี้ได้เลย!
          </p>
          {!isFormOpen && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-2 py-1.5 px-3.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-2xs"
            >
              + เขียนรีวิวเป็นคนแรก
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredReviews.map((rev) => {
            const isHelpful = helpfulClicked[rev.id];
            const helpfulCount = (rev.helpfulCount || 0) + (isHelpful ? 1 : 0);

            return (
              <div
                key={rev.id}
                className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/15 shadow-xs space-y-2.5 transition-shadow hover:shadow-sm"
              >
                {/* Author Info & Rating */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={rev.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt={rev.authorName}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/30"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-on-surface">{rev.authorName}</span>
                        {rev.verifiedPurchase && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px]">verified</span>
                            ผู้ซื้อจริง
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-on-surface-variant block mt-0.5">{rev.date}</span>
                    </div>
                  </div>

                  {/* Stars Display */}
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className="material-symbols-outlined text-[15px]"
                        style={{ fontVariationSettings: star <= rev.rating ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>

                {/* Variant Specs Tag */}
                {(rev.colorName || rev.lensType) && (
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {rev.colorName && (
                      <span className="px-2 py-0.5 rounded-md bg-surface-container-low text-on-surface-variant font-medium">
                        สี: {rev.colorName}
                      </span>
                    )}
                    {rev.lensType && (
                      <span className="px-2 py-0.5 rounded-md bg-surface-container-low text-primary font-medium">
                        เลนส์: {rev.lensType}
                      </span>
                    )}
                  </div>
                )}

                {/* Review Comment Text */}
                <p className="text-xs text-on-surface leading-relaxed font-normal">
                  {rev.comment}
                </p>

                {/* Review Photos Gallery */}
                {rev.photos && rev.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rev.photos.map((photoUrl, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setEnlargedPhoto(photoUrl)}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-outline-variant/30 hover:opacity-90 active:scale-95 transition-all shadow-2xs"
                      >
                        <img
                          src={photoUrl}
                          alt={`รูปรีวิว ${pIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Helpful Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10 text-[11px] text-on-surface-variant">
                  <span className="text-[10px] text-outline">แว่นตารุ่น {product.name}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleHelpful(rev.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all active:scale-95 ${
                      isHelpful
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                    <span>มีประโยชน์ ({helpfulCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enlarged Photo Preview Modal */}
      {enlargedPhoto && (
        <div
          onClick={() => setEnlargedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn cursor-pointer"
        >
          <div className="relative max-w-[400px] w-full max-h-[85vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <img
              src={enlargedPhoto}
              alt="รูปภาพรีวิวขนาดเต็ม"
              className="w-full h-auto max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <span className="text-white/80 text-xs mt-2.5 font-medium">คลิกที่ใดก็ได้เพื่อปิด</span>
          </div>
        </div>
      )}
    </div>
  );
};
