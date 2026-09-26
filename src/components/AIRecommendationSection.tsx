import React, { useState } from 'react';
import { Product } from '../types';

interface AIRecommendationSectionProps {
  products: Product[];
  viewedShapes: Record<string, number>;
  wishlist: string[];
  comparisonProductIds?: string[];
  onToggleCompare?: (productId: string) => void;
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenVirtualTryOnWithProduct?: (product: Product) => void;
  onResetShapeHistory?: () => void;
  onSimulateClickShape?: (shape: string) => void;
}

// Shape metadata for rich optical advice
const SHAPE_CONFIG: Record<
  string,
  {
    nameTh: string;
    nameEn: string;
    icon: string;
    faceMatch: string;
    advice: string;
    accentColor: string;
  }
> = {
  square: {
    nameTh: 'ทรงสี่เหลี่ยม',
    nameEn: 'Square',
    icon: 'crop_square',
    faceMatch: 'เหมาะกับคนรูปหน้ากลม รูปไข่ หรือหน้ารูปหัวใจ',
    advice: 'ช่วยเสริมเส้นสายให้กรอบหน้าดูคมชัด มีมิติ และเพิ่มบุคลิกความเป็นมืออาชีพ',
    accentColor: 'from-blue-500/10 to-indigo-500/10 text-primary'
  },
  round: {
    nameTh: 'ทรงกลม/วินเทจ',
    nameEn: 'Round',
    icon: 'radio_button_unchecked',
    faceMatch: 'เหมาะกับคนรูปหน้าเหลี่ยม รูปเพชร หรือมีมุมกรามชัด',
    advice: 'ช่วยปรับความคมของกรอบหน้าให้ดูละมุน อบอุ่น และให้ลุคคลาสสิกดูอ่อนเยาว์',
    accentColor: 'from-amber-500/10 to-orange-500/10 text-amber-700'
  },
  drop: {
    nameTh: 'ทรงหยดน้ำ / Aviator',
    nameEn: 'Drop',
    icon: 'water_drop',
    faceMatch: 'เข้าได้ดีกับเกือบทุกรูปหน้า โดยเฉพาะหน้ารูปไข่และยาว',
    advice: 'ช่วยปรับสัดส่วนใบหน้าให้ดูเรียวได้รูป สมดุล และมีความนำสมัย',
    accentColor: 'from-teal-500/10 to-emerald-500/10 text-teal-700'
  },
  'cat-eye': {
    nameTh: 'ทรงแคทอาย',
    nameEn: 'Cat-Eye',
    icon: 'visibility',
    faceMatch: 'เหมาะกับคนหน้ารูปหัวใจและรูปไข่',
    advice: 'มุมแหลมเฉียงขึ้นช่วยยกกระชับช่วงโหนกแก้ม เสริมความโฉบเฉี่ยวมีเสน่ห์',
    accentColor: 'from-purple-500/10 to-pink-500/10 text-purple-700'
  }
};

export const AIRecommendationSection: React.FC<AIRecommendationSectionProps> = ({
  products,
  viewedShapes,
  wishlist,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
  onOpenVirtualTryOnWithProduct,
  onResetShapeHistory,
  onSimulateClickShape
}) => {
  // Find the shape with the highest clicks
  const sortedShapes = Object.entries(viewedShapes).sort((a, b) => b[1] - a[1]);
  const defaultTopShape = sortedShapes.length > 0 && sortedShapes[0][1] > 0
    ? sortedShapes[0][0].toLowerCase()
    : 'square';

  // Allow user to temporarily view recommendation for another shape if they tap a pill
  const [selectedShapeOverride, setSelectedShapeOverride] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const activeShape = (selectedShapeOverride || defaultTopShape).toLowerCase();
  const shapeInfo = SHAPE_CONFIG[activeShape] || {
    nameTh: `ทรง ${activeShape}`,
    nameEn: activeShape,
    icon: 'eyeglasses',
    faceMatch: 'เข้ากับรูปหน้าหลากหลายสไตล์',
    advice: 'ได้รับการออกแบบตามหลักสรีรศาสตร์เพื่อให้สวมใส่สบาย',
    accentColor: 'from-primary/10 to-secondary/10 text-primary'
  };

  const topClickCount = viewedShapes[activeShape] || 0;
  const isMostViewed = activeShape === defaultTopShape && topClickCount > 0;

  // Filter products matching this shape
  let matchingProducts = products.filter(
    (p) => (p.shape || '').toLowerCase() === activeShape
  );

  // Fallback if no products in this shape: show other top products
  if (matchingProducts.length === 0) {
    matchingProducts = products.slice(0, 3);
  }

  // Calculate dynamic match confidence percentage
  const matchPercentage = isMostViewed
    ? Math.min(99, 85 + Math.min(14, topClickCount * 3))
    : 88;

  // All shapes available in inventory
  const availableShapes = Array.from(
    new Set(products.map((p) => (p.shape || 'square').toLowerCase()))
  );

  return (
    <div className="flex flex-col space-y-3.5 pt-2">
      {/* Header with AI Sparkle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
            <span className="material-symbols-outlined text-[19px] animate-pulse">
              auto_awesome
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-headline-sm text-on-surface">
                แว่นตาที่เหมาะกับคุณ
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary text-[10px] font-bold shadow-2xs tracking-wide">
                AI Match
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant">
              วิเคราะห์จากทรงกรอบแว่นที่คุณคลิกดูบ่อยที่สุด
            </span>
          </div>
        </div>

        {/* Info button to explain the AI */}
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          className="text-[11px] text-primary hover:text-primary-container font-semibold flex items-center gap-0.5 py-1 px-2 rounded-lg bg-surface-container-low active:scale-95 transition-all"
          title="ดูสถิติการคลิกดูและคำนวณของ AI"
        >
          <span className="material-symbols-outlined text-[14px]">tune</span>
          <span>สถิติ AI</span>
        </button>
      </div>

      {/* AI Intelligence Insight Banner */}
      <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-surface-container-lowest to-surface-container-low border border-primary/20 shadow-xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        <div className="flex flex-col gap-2.5 relative z-10">
          {/* Top Line: Most Clicked Shape & Confidence */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">
                {shapeInfo.icon}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-on-surface">
                    {shapeInfo.nameTh} ({shapeInfo.nameEn})
                  </span>
                  {isMostViewed && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-800 text-[10px] font-bold">
                      คลิกดูบ่อยที่สุด 👑
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  {topClickCount > 0
                    ? `ประวัติการเข้าชม: คุณคลิกดูทรงนี้ ${topClickCount} ครั้ง`
                    : 'ทรงยอดนิยมเริ่มต้นสำหรับคุณ'}
                </span>
              </div>
            </div>

            {/* Match Score Badge */}
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-xs">
                <span className="material-symbols-outlined text-[13px]">bolt</span>
                <span>{matchPercentage}% Match</span>
              </div>
              <span className="text-[9px] text-outline mt-0.5">ความเข้ากันตามรูปหน้า</span>
            </div>
          </div>

          {/* AI Optical Advice Box */}
          <div className="p-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/15 text-xs text-on-surface leading-relaxed">
            <div className="flex items-start gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">
                psychology
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-primary text-[11px]">
                  คำแนะนำจากระบบอัจฉริยะ (AI Eyewear Stylist):
                </span>
                <span className="text-on-surface-variant text-[11px]">
                  {shapeInfo.advice} • <span className="font-medium text-on-surface">{shapeInfo.faceMatch}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Shape Selector Chips (Quick test / preview other shapes) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {availableShapes.map((shapeKey) => {
                const conf = SHAPE_CONFIG[shapeKey] || { nameTh: shapeKey, nameEn: shapeKey };
                const count = viewedShapes[shapeKey] || 0;
                const isSelected = activeShape === shapeKey;
                const isTop = shapeKey === defaultTopShape && count > 0;

                return (
                  <button
                    key={shapeKey}
                    type="button"
                    onClick={() => setSelectedShapeOverride(shapeKey)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 active:scale-95 ${
                      isSelected
                        ? 'bg-primary text-on-primary font-bold shadow-2xs'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>{conf.nameTh}</span>
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-surface-container text-outline'
                      }`}
                    >
                      {count}
                    </span>
                    {isTop && !isSelected && <span>👑</span>}
                  </button>
                );
              })}
            </div>

            {selectedShapeOverride && selectedShapeOverride !== defaultTopShape && (
              <button
                type="button"
                onClick={() => setSelectedShapeOverride(null)}
                className="text-[10px] text-primary underline shrink-0 ml-1"
                title="กลับไปที่ทรงที่คุณดูบ่อยที่สุด"
              >
                ดูทรงหลัก
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Products Carousel / Card Grid */}
      <div className="flex flex-col space-y-2.5">
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span className="font-semibold text-on-surface">
            พบ {matchingProducts.length} รุ่นที่เข้ากับทรง {shapeInfo.nameTh}:
          </span>
          <span className="text-[11px] text-outline">คลิกเพื่อดูรายละเอียด / อัปเดต AI</span>
        </div>

        {/* Horizontal scroll cards with nice elevation and spacing */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1.5 pt-0.5">
          {matchingProducts.map((item, index) => {
            const isFav = wishlist.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => onSelectProduct(item)}
                className="w-[200px] shrink-0 bg-surface-container-lowest rounded-2xl p-3 shadow-xs hover:shadow-md border border-outline-variant/15 flex flex-col cursor-pointer transition-all hover:-translate-y-0.5 group relative"
              >
                {/* AI Match Badge */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-primary text-on-primary text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                  <span className="material-symbols-outlined text-[11px]">auto_awesome</span>
                  <span>{index === 0 ? 'AI อันดับ 1' : 'แนะนำ'}</span>
                </div>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(item.id);
                  }}
                  className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center shadow-xs active:scale-90 transition-transform ${
                    isFav ? 'text-error' : 'text-outline hover:text-error'
                  }`}
                  aria-label="รายการโปรด"
                >
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={isFav ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    favorite
                  </span>
                </button>

                {/* Product Image */}
                <div className="relative w-full aspect-square bg-surface-container-low rounded-xl mb-2.5 flex items-center justify-center p-2.5 overflow-hidden">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.discountPercentage && item.discountPercentage > 0 && (
                    <span className="absolute bottom-1.5 left-1.5 bg-error text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                      -{item.discountPercentage}%
                    </span>
                  )}
                </div>

                {/* Rating & Shape */}
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    <span className="font-bold text-on-surface">{item.rating}</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface font-medium">
                    {shapeInfo.nameTh}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                  {item.name}
                </h4>
                <p className="text-[10px] text-on-surface-variant truncate mb-2">
                  {item.colorName || item.subtitle}
                </p>

                {/* Price & Action Buttons */}
                <div className="mt-auto pt-1 border-t border-outline-variant/10 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-black text-primary">
                        ฿{item.price.toLocaleString()}
                      </span>
                      {item.originalPrice && (
                        <span className="text-[10px] text-outline line-through ml-1">
                          ฿{item.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 mt-0.5">
                    {/* Shortcut to 3D Try-On */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenVirtualTryOnWithProduct) {
                          onOpenVirtualTryOnWithProduct(item);
                        }
                      }}
                      className="py-1 px-1.5 rounded-lg bg-secondary-fixed/70 text-on-secondary-fixed hover:bg-secondary-fixed text-[10px] font-bold flex items-center justify-center gap-0.5 active:scale-95 transition-all"
                      title="ลองสวมแบบ 3D ทันที"
                    >
                      <span className="material-symbols-outlined text-[12px]">view_in_ar</span>
                      <span>ลอง 3D</span>
                    </button>

                    {/* Quick Add To Cart */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(item);
                      }}
                      className="py-1 px-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-[10px] font-bold flex items-center justify-center gap-0.5 active:scale-95 transition-all shadow-2xs"
                      title="เพิ่มในตะกร้า"
                    >
                      <span className="material-symbols-outlined text-[12px]">add_shopping_cart</span>
                      <span>ใส่ตะกร้า</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI History & Stats Modal Dialog */}
      {showHistoryModal && (
        <div
          onClick={() => setShowHistoryModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-outline-variant/20 flex flex-col gap-4 animate-scaleUp"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">ระบบวิเคราะห์แว่นตา AI</h4>
                  <span className="text-[11px] text-on-surface-variant">สถิติการคลิกดูรูปทรงกรอบแว่น</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Explanation */}
            <p className="text-xs text-on-surface-variant leading-relaxed">
              ระบบ AI ติดตามรูปทรงกรอบแว่นที่คุณคลิกดูบ่อยที่สุด (Click-Frequency Analysis) และจับคู่กับกรอบแว่นตาในร้าน เพื่อแนะนำแบบที่เหมาะกับคุณที่สุดโดยอัตโนมัติ
            </p>

            {/* Shape Breakdown List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-on-surface">สถิติจำนวนครั้งที่คุณคลิกดู:</span>
              {availableShapes.map((shapeKey) => {
                const conf = SHAPE_CONFIG[shapeKey] || { nameTh: shapeKey, nameEn: shapeKey };
                const count = viewedShapes[shapeKey] || 0;
                const isTop = shapeKey === defaultTopShape && count > 0;

                return (
                  <div
                    key={shapeKey}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/10 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">{conf.nameTh}</span>
                      <span className="text-[10px] text-outline">({conf.nameEn})</span>
                      {isTop && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[9px]">
                          อันดับ 1
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{count} ครั้ง</span>
                      {onSimulateClickShape && (
                        <button
                          type="button"
                          onClick={() => onSimulateClickShape(shapeKey)}
                          className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] hover:bg-primary/20 active:scale-95"
                          title="จำลองการคลิกดูทรงนี้"
                        >
                          + เพิ่ม 1 คลิก
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-outline-variant/15">
              {onResetShapeHistory && (
                <button
                  type="button"
                  onClick={() => {
                    onResetShapeHistory();
                    setSelectedShapeOverride(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error/10 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                  <span>ล้างประวัติ</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="ml-auto px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold active:scale-95 transition-all shadow-xs"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
