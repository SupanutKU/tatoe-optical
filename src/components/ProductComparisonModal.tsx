import React, { useState } from 'react';
import { Product } from '../types';

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparisonProducts: Product[];
  allProducts: Product[];
  onRemoveProduct: (productId: string) => void;
  onAddProduct: (product: Product) => void;
  onClearAll: () => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onOpenVirtualTryOn?: (product: Product) => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  isOpen,
  onClose,
  comparisonProducts,
  allProducts,
  onRemoveProduct,
  onAddProduct,
  onClearAll,
  onAddToCart,
  onSelectProduct,
  onOpenVirtualTryOn
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  if (!isOpen) return null;

  // Available products to add to comparison (not currently selected)
  const availableToAdd = allProducts.filter(
    (p) => !comparisonProducts.some((cp) => cp.id === p.id)
  );

  const getMaterialLabel = (material: string) => {
    switch (material) {
      case 'titanium':
        return {
          name: 'ไทเทเนียมบริสุทธิ์ (Pure Titanium)',
          badge: 'เบาพิเศษ ไม่ลอก ไม่ดำ',
          icon: 'grade',
          highlight: 'text-amber-700 bg-amber-500/10'
        };
      case 'acetate':
        return {
          name: 'อะซิเตทเกรดพรีเมียม (Premium Acetate)',
          badge: 'ผิวสัมผัสเรียบหรู สีไม่ซีดจาง',
          icon: 'palette',
          highlight: 'text-indigo-700 bg-indigo-500/10'
        };
      case 'tr90':
        return {
          name: 'TR-90 ยืดหยุ่นพิเศษ (Ultra TR-90)',
          badge: 'ทนแรงกระแทก ดัดงอได้',
          icon: 'fitness_center',
          highlight: 'text-emerald-700 bg-emerald-500/10'
        };
      case 'metal':
        return {
          name: 'โลหะอัลลอยด์น้ำหนักเบา (Light Alloy)',
          badge: 'คลาสสิก แข็งแรงทนทาน',
          icon: 'build',
          highlight: 'text-slate-700 bg-slate-500/10'
        };
      default:
        return {
          name: material,
          badge: 'วัสดุคุณภาพสูง',
          icon: 'check',
          highlight: 'text-primary bg-primary/10'
        };
    }
  };

  const getShapeLabel = (shape: string) => {
    switch (shape) {
      case 'square':
        return { name: 'ทรงเหลี่ยมมน (Square)', face: 'เหมาะกับคนหน้ากลม, รูปไข่' };
      case 'round':
        return { name: 'ทรงกลมวินเทจ (Round)', face: 'เหมาะกับคนหน้าเหลี่ยม, รูปเพชร' };
      case 'drop':
        return { name: 'ทรงหยดน้ำ (Drop / Aviator)', face: 'เหมาะกับทุกรูปหน้า, หน้าเรียวยาว' };
      case 'cat-eye':
        return { name: 'ทรงแคทอาย (Cat-Eye)', face: 'เหมาะกับหน้ารูปหัวใจ, รูปไข่' };
      default:
        return { name: shape, face: 'เหมาะกับทุกรูปหน้า' };
    }
  };

  // Convert weight string like '8.5g' or '11g' to number for comparison
  const parseWeightNumber = (wStr?: string): number => {
    if (!wStr) return 15;
    const matched = wStr.match(/([0-9.]+)/);
    return matched ? parseFloat(matched[1]) : 15;
  };

  // Find lowest price and lightest weight to highlight differences
  const lowestPrice = comparisonProducts.length > 1
    ? Math.min(...comparisonProducts.map((p) => p.price))
    : null;

  const lightestWeight = comparisonProducts.length > 1
    ? Math.min(...comparisonProducts.map((p) => parseWeightNumber(p.weight)))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[430px] h-[92vh] max-h-[820px] bg-surface rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/20">
        {/* Header */}
        <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">compare_arrows</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-on-surface">ตารางเปรียบเทียบแว่นตา</h2>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold">
                  {comparisonProducts.length}/3 รุ่น
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                เปรียบเทียบวัสดุ น้ำหนัก ราคา และขนาดชัดเจนเคียงข้างกัน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {comparisonProducts.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-on-surface-variant hover:text-error px-2 py-1 font-semibold rounded-lg hover:bg-surface-container transition-colors"
                title="ล้างทั้งหมด"
              >
                ล้างทั้งหมด
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-90 transition-transform"
              aria-label="ปิดหน้าต่างเปรียบเทียบ"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {comparisonProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline mb-3">
              <span className="material-symbols-outlined text-[36px]">balance</span>
            </div>
            <h3 className="font-bold text-base text-on-surface mb-1">ยังไม่ได้เลือกแว่นตาเพื่อเปรียบเทียบ</h3>
            <p className="text-xs text-on-surface-variant max-w-[260px] mb-4 leading-relaxed">
              คุณสามารถกดปุ่ม <span className="font-bold text-primary">"เปรียบเทียบ"</span> ที่การ์ดสินค้าได้สูงสุด 3 รุ่น เพื่อดูตารางเปรียบเทียบคุณสมบัติ
            </p>
            {availableToAdd.length > 0 && (
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>เลือกแว่นตาเพื่อเปรียบเทียบ</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {/* Slot Banner if < 3 */}
            {comparisonProducts.length < 3 && (
              <div className="bg-secondary-fixed/30 rounded-xl p-2.5 flex items-center justify-between text-xs border border-secondary/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
                  <span className="text-[11px] text-on-surface">
                    สามารถเพิ่มได้อีก <strong>{3 - comparisonProducts.length} รุ่น</strong> (สูงสุด 3 รุ่น)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-primary font-bold text-[11px] shadow-xs hover:bg-surface-container active:scale-95 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>เพิ่มรุ่น</span>
                </button>
              </div>
            )}

            {/* Side-by-Side Product Cards Header */}
            <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-xs border border-outline-variant/15">
              <div className="text-[11px] font-bold text-outline uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>รุ่นแว่นตาที่เลือกเปรียบเทียบ</span>
                <span className="text-[10px] text-on-surface-variant font-normal">แตะภาพเพื่อดูรายละเอียด</span>
              </div>

              <div className={`grid gap-2 ${
                comparisonProducts.length === 1
                  ? 'grid-cols-2'
                  : comparisonProducts.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
              }`}>
                {comparisonProducts.map((p) => (
                  <div
                    key={p.id}
                    className="relative flex flex-col bg-surface-container-low rounded-xl p-2 border border-outline-variant/20 hover:border-primary/40 transition-colors"
                  >
                    {/* Delete X Button */}
                    <button
                      type="button"
                      onClick={() => onRemoveProduct(p.id)}
                      className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-error hover:bg-error-container/20 flex items-center justify-center text-xs shadow-xs transition-colors"
                      title="ลบออกจากการเปรียบเทียบ"
                      aria-label="ลบ"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>

                    {/* Image */}
                    <div
                      onClick={() => {
                        onSelectProduct(p);
                        onClose();
                      }}
                      className="w-full aspect-square bg-surface-container-lowest rounded-lg p-1.5 flex items-center justify-center cursor-pointer mb-1.5 overflow-hidden"
                    >
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Title */}
                    <h4
                      onClick={() => {
                        onSelectProduct(p);
                        onClose();
                      }}
                      className="font-bold text-xs text-on-surface line-clamp-2 cursor-pointer hover:text-primary transition-colors leading-tight"
                    >
                      {p.name}
                    </h4>
                    <span className="text-[10px] text-on-surface-variant truncate mt-0.5">
                      {p.colorName}
                    </span>

                    {/* Quick Try-On Button */}
                    {onOpenVirtualTryOn && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenVirtualTryOn(p);
                          onClose();
                        }}
                        className="mt-1.5 w-full py-1 rounded-lg bg-surface-container-lowest text-primary font-bold text-[10px] flex items-center justify-center gap-1 border border-primary/20 hover:bg-primary/5 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[13px]">view_in_ar</span>
                        <span>ลอง 3D</span>
                      </button>
                    )}
                  </div>
                ))}

                {/* Empty Slot Card to prompt adding */}
                {comparisonProducts.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low/40 hover:bg-surface-container-low text-on-surface-variant transition-all group min-h-[140px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">add</span>
                    </div>
                    <span className="font-bold text-xs text-on-surface">เพิ่มรุ่นที่ {comparisonProducts.length + 1}</span>
                    <span className="text-[10px] text-outline mt-0.5">แตะเพื่อเลือกรุ่น</span>
                  </button>
                )}
              </div>
            </div>

            {/* SPECIFICATION 1: ราคา (Price) */}
            <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-outline-variant/15 flex flex-col gap-2">
              <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
                <span className="font-bold text-xs text-on-surface">1. เปรียบเทียบราคา (Price)</span>
              </div>
              <div className={`grid gap-2 ${comparisonProducts.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {comparisonProducts.map((p) => {
                  const isLowest = lowestPrice !== null && p.price === lowestPrice;
                  return (
                    <div
                      key={`price-${p.id}`}
                      className={`p-2.5 rounded-xl flex flex-col items-center text-center justify-center ${
                        isLowest
                          ? 'bg-emerald-500/10 border border-emerald-500/30'
                          : 'bg-surface-container-low'
                      }`}
                    >
                      <span className="font-bold text-sm text-primary">฿{p.price.toLocaleString()}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[10px] text-outline line-through">
                          ฿{p.originalPrice.toLocaleString()}
                        </span>
                      )}
                      {p.discountPercentage && (
                        <span className="mt-1 px-1.5 py-0.2 rounded text-[9px] bg-error-container text-on-error-container font-bold">
                          ลด {p.discountPercentage}%
                        </span>
                      )}
                      {isLowest && (
                        <span className="mt-1 px-1.5 py-0.2 rounded text-[9px] bg-emerald-600 text-white font-bold">
                          ★ ราคาคุ้มค่าที่สุด
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SPECIFICATION 2: วัสดุกรอบ (Material) */}
            <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-outline-variant/15 flex flex-col gap-2">
              <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-[18px] text-secondary">diamond</span>
                <span className="font-bold text-xs text-on-surface">2. เปรียบเทียบวัสดุ (Material)</span>
              </div>
              <div className={`grid gap-2 ${comparisonProducts.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {comparisonProducts.map((p) => {
                  const matInfo = getMaterialLabel(p.material);
                  return (
                    <div
                      key={`mat-${p.id}`}
                      className="p-2.5 rounded-xl bg-surface-container-low flex flex-col gap-1 text-center items-center"
                    >
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${matInfo.highlight}`}>
                        {p.material.toUpperCase()}
                      </span>
                      <span className="font-bold text-xs text-on-surface mt-1 leading-snug">
                        {matInfo.name}
                      </span>
                      <span className="text-[10px] text-on-surface-variant leading-tight">
                        {matInfo.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SPECIFICATION 3: น้ำหนัก (Weight) */}
            <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-outline-variant/15 flex flex-col gap-2">
              <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-[18px] text-amber-600">scale</span>
                <span className="font-bold text-xs text-on-surface">3. เปรียบเทียบน้ำหนัก (Weight)</span>
              </div>
              <div className={`grid gap-2 ${comparisonProducts.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {comparisonProducts.map((p) => {
                  const weightNum = parseWeightNumber(p.weight);
                  const isLightest = lightestWeight !== null && weightNum === lightestWeight;
                  return (
                    <div
                      key={`weight-${p.id}`}
                      className={`p-2.5 rounded-xl flex flex-col items-center text-center ${
                        isLightest
                          ? 'bg-amber-500/10 border border-amber-500/30'
                          : 'bg-surface-container-low'
                      }`}
                    >
                      <span className="text-base font-extrabold text-on-surface font-mono">
                        {p.weight || '12g'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">
                        {weightNum <= 9
                          ? 'ขนนก เบามากเป็นพิเศษ'
                          : weightNum <= 12
                          ? 'เบาสบาย ไม่กดทับดั้ง'
                          : 'น้ำหนักสมดุล พอดีกระชับ'}
                      </span>
                      {isLightest && (
                        <span className="mt-1 px-1.5 py-0.2 rounded text-[9px] bg-amber-600 text-white font-bold">
                          🪶 เบาที่สุดในกลุ่ม
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SPECIFICATION 4: รูปทรงกรอบ & รูปหน้าที่แนะนำ (Shape & Fit) */}
            <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-outline-variant/15 flex flex-col gap-2">
              <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-[18px] text-indigo-600">face</span>
                <span className="font-bold text-xs text-on-surface">4. ทรงกรอบและรูปหน้าที่เข้ากัน</span>
              </div>
              <div className={`grid gap-2 ${comparisonProducts.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {comparisonProducts.map((p) => {
                  const shapeInfo = getShapeLabel(p.shape);
                  return (
                    <div
                      key={`shape-${p.id}`}
                      className="p-2.5 rounded-xl bg-surface-container-low flex flex-col items-center text-center"
                    >
                      <span className="font-bold text-xs text-on-surface">{shapeInfo.name}</span>
                      <span className="text-[10px] text-on-surface-variant mt-1 leading-snug">
                        {shapeInfo.face}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SPECIFICATION 5: ขนาดกรอบแว่น (Dimensions) */}
            <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-outline-variant/15 flex flex-col gap-2">
              <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-[18px] text-teal-600">straighten</span>
                <span className="font-bold text-xs text-on-surface">5. ขนาดกรอบ (กว้าง-จมูก-ขา)</span>
              </div>
              <div className={`grid gap-2 ${comparisonProducts.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {comparisonProducts.map((p) => (
                  <div
                    key={`size-${p.id}`}
                    className="p-2.5 rounded-xl bg-surface-container-low flex flex-col items-center text-center font-mono"
                  >
                    <span className="font-bold text-xs text-on-surface">{p.size || '50-18-140 mm'}</span>
                    <span className="text-[9px] text-on-surface-variant font-sans mt-0.5">
                      มาตรฐานเอเชียฟิต
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SPECIFICATION 6: ชนิดเลนส์ & การรับประกัน (Lens & Warranty) */}
            <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-outline-variant/15 flex flex-col gap-2">
              <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
                <span className="font-bold text-xs text-on-surface">6. เลนส์ที่มาพร้อมกรอบ & ประกัน</span>
              </div>
              <div className={`grid gap-2 ${comparisonProducts.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {comparisonProducts.map((p) => (
                  <div
                    key={`lens-${p.id}`}
                    className="p-2.5 rounded-xl bg-surface-container-low flex flex-col items-center text-center gap-1"
                  >
                    <span className="text-[11px] font-semibold text-on-surface leading-tight">
                      {p.lensType || 'เลนส์มัลติโค้ต'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant text-[9px] font-semibold">
                      {p.warranty || 'ประกัน 1 ปี'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-outline-variant/15 flex flex-col gap-2">
              <span className="font-bold text-xs text-on-surface pb-1 border-b border-outline-variant/10">
                สั่งซื้อหรือใส่ตะกร้า
              </span>
              <div className={`grid gap-2 ${comparisonProducts.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {comparisonProducts.map((p) => (
                  <div key={`action-${p.id}`} className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(p);
                        onClose();
                      }}
                      className="w-full py-2 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1 shadow-xs hover:bg-primary-container active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[15px]">add_shopping_cart</span>
                      <span>ใส่ตะกร้า</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProduct(p);
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-xl bg-surface-container text-on-surface font-semibold text-[11px] hover:bg-surface-container-high active:scale-95 transition-all"
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Product Picker Overlay (when adding to comparison) */}
        {isPickerOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
            <div className="bg-surface-container-lowest rounded-t-3xl p-4 max-h-[70vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-outline-variant/20">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
                <div>
                  <h3 className="font-bold text-sm text-on-surface">เลือกรุ่นแว่นตาเพื่อเปรียบเทียบ</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    เลือกได้อีก {3 - comparisonProducts.length} รุ่น
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="overflow-y-auto py-2 space-y-2 flex-1">
                {availableToAdd.length === 0 ? (
                  <p className="text-center text-xs text-on-surface-variant py-6">
                    เลือกแว่นตาทุกรุ่นที่มีในร้านแล้ว
                  </p>
                ) : (
                  availableToAdd.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        onAddProduct(prod);
                        if (comparisonProducts.length + 1 >= 3) {
                          setIsPickerOpen(false);
                        }
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors border border-outline-variant/10 active:scale-98"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-surface-container-lowest p-1 flex items-center justify-center shrink-0">
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-on-surface">{prod.name}</h4>
                          <p className="text-[10px] text-on-surface-variant">
                            {prod.material.toUpperCase()} • {prod.weight} • {prod.shape}
                          </p>
                          <span className="font-bold text-xs text-primary">฿{prod.price.toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs flex items-center gap-1 shadow-2xs hover:bg-primary-container"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>เลือก</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
