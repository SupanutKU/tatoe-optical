import React from 'react';
import { Product } from '../../types';
import type { FaceShapeResult } from '../../lib/faceShape';

interface GlassesRecommendationProps {
  canAnalyze: boolean;
  faceShapeResult: FaceShapeResult | null;
  recommendations: { product: Product; matchPercent: number }[];
  onAnalyze: () => void;
  onDismiss: () => void;
  onPickProduct: (product: Product) => void;
}

export const GlassesRecommendation: React.FC<GlassesRecommendationProps> = ({
  canAnalyze,
  faceShapeResult,
  recommendations,
  onAnalyze,
  onDismiss,
  onPickProduct,
}) => {
  if (!faceShapeResult) {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="w-full h-10 rounded-xl border border-primary/40 text-primary bg-primary/5 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-40 disabled:active:scale-100"
        >
          <span>✨ แนะนำแว่นที่เหมาะกับฉัน</span>
        </button>
        {!canAnalyze && (
          <p className="text-center text-[10px] text-on-surface-variant">
            กรุณาหันหน้าเข้ากล้องให้ตรวจพบใบหน้าก่อน (หรือถ่าย/อัปโหลดรูป)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-on-surface-variant">รูปหน้าของคุณ</p>
          <p className="text-sm font-bold text-on-surface">{faceShapeResult.labelTh}</p>
        </div>
        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      {recommendations.length > 0 ? (
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {recommendations.map(({ product, matchPercent }) => (
            <button
              key={product.id}
              onClick={() => onPickProduct(product)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest shrink-0 w-24 text-center active:scale-95 transition-all"
            >
              <img src={product.images[0]} alt={product.name} className="w-16 h-10 object-contain" />
              <span className="text-[10px] font-medium text-on-surface line-clamp-1">
                {product.name.replace('Big Eye ', '')}
              </span>
              <span className="text-[10px] font-bold text-emerald-600">Match {matchPercent}%</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-on-surface-variant">ยังไม่มีกรอบแว่นที่ตรงกับคำแนะนำในคลังสินค้าขณะนี้</p>
      )}

      <p className="text-[10px] text-on-surface-variant/80 leading-relaxed">
        * เป็นคำแนะนำเชิงสไตล์จากสัดส่วนใบหน้าโดยประมาณ ไม่ใช่การวิเคราะห์หรือคำแนะนำทางการแพทย์
      </p>
    </div>
  );
};
