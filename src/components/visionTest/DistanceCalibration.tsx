import React, { useState } from 'react';

interface DistanceCalibrationProps {
  onStart: () => void;
  onSelectSpecificMode: (mode: 'all' | 'acuity_only' | 'astigmatism_only' | 'color_blindness_only') => void;
}

export const DistanceCalibration: React.FC<DistanceCalibrationProps> = ({
  onStart,
  onSelectSpecificMode
}) => {
  const [scale, setScale] = useState(100);
  const [hasGlasses, setHasGlasses] = useState<'naked' | 'with_glasses'>('naked');

  return (
    <div className="flex flex-col w-full gap-4 text-xs">
      {/* Title Header */}
      <div className="flex flex-col gap-1 text-center py-2">
        <span className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-primary">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          TATOE Vision Suite 2025
        </span>
        <h2 className="text-xl font-bold text-on-surface">
          ระบบตรวจวัดสายตาออนไลน์
        </h2>
        <p className="text-[12px] text-on-surface-variant max-w-sm mx-auto">
          ตรวจวัดความคมชัดสายตา สั้น/ยาว, ค่าสายตาเอียง (Astigmatism), และคัดกรองตาบอดสี (Color Vision) ด้วยมาตรฐานทัศนมาตร
        </p>
      </div>

      {/* Quick Jump / Specific Mode Cards */}
      <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2.5">
        <span className="text-[11px] font-bold text-on-surface flex items-center gap-1">
          <span className="material-symbols-outlined text-primary text-[15px]">flash_on</span>
          เลือกตรวจเฉพาะด้าน หรือตรวจครบวงจร
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSelectSpecificMode('astigmatism_only')}
            className="p-2.5 rounded-xl bg-surface-container-lowest hover:bg-primary/5 border border-outline-variant/30 text-left flex items-start gap-2 active:scale-98 transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[16px]">clock_loader_60</span>
            </div>
            <div>
              <strong className="block text-[11px] text-on-surface group-hover:text-primary">วัดสายตาเอียง</strong>
              <span className="text-[9px] text-on-surface-variant">Clock Dial & Axis (2 นาที)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectSpecificMode('color_blindness_only')}
            className="p-2.5 rounded-xl bg-surface-container-lowest hover:bg-primary/5 border border-outline-variant/30 text-left flex items-start gap-2 active:scale-98 transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center shrink-0 group-hover:bg-secondary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[16px]">palette</span>
            </div>
            <div>
              <strong className="block text-[11px] text-on-surface group-hover:text-secondary">ตรวจตาบอดสี</strong>
              <span className="text-[9px] text-on-surface-variant">Ishihara 8 แผ่น (2 นาที)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectSpecificMode('acuity_only')}
            className="p-2.5 rounded-xl bg-surface-container-lowest hover:bg-primary/5 border border-outline-variant/30 text-left flex items-start gap-2 active:scale-98 transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[16px]">visibility</span>
            </div>
            <div>
              <strong className="block text-[11px] text-on-surface group-hover:text-teal-700">วัดความคมชัด สั้น/ยาว</strong>
              <span className="text-[9px] text-on-surface-variant">Tumbling E (2 นาที)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectSpecificMode('all')}
            className="p-2.5 rounded-xl bg-primary text-on-primary text-left flex items-start gap-2 active:scale-98 transition-all cursor-pointer shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">playlist_add_check</span>
            </div>
            <div>
              <strong className="block text-[11px] text-white">ตรวจครบทุกขั้นตอน</strong>
              <span className="text-[9px] text-white/80">ตรวจเต็มรูปแบบ (~4 นาที)</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3 Preparation Steps */}
      <div className="grid grid-cols-1 gap-2.5">
        {/* Step 1: Distance */}
        <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]">straighten</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-on-surface">1. รักษาระยะห่าง 40 ซม. (1 ช่วงแขน)</h4>
              <span className="text-[10px] text-primary font-bold">แนะนำ</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
              ถือสมาร์ตโฟนหรือนั่งห่างจากหน้าจอประมาณ 40 เซนติเมตร (ประมาณระยะเหยียดแขนตรง) ให้อุปกรณ์อยู่ในระดับสายตา
            </p>
          </div>
        </div>

        {/* Step 2: Lighting & Brightness */}
        <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]">wb_sunny</span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-xs text-on-surface">2. ปรับแสงสว่างหน้าจอ 70% - 100%</h4>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
              ปิดโหมดถนอมสายตา (Night Shift / True Tone) ชั่วคราว และปรับความสว่างของหน้าจอให้อยู่ในระดับสบายตา ไม่อยู่ในห้องมืด
            </p>
          </div>
        </div>

        {/* Step 3: Glasses option */}
        <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]">eyeglasses</span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-xs text-on-surface">3. สภาพการสวมแว่นตาขณะทดสอบ</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setHasGlasses('naked')}
                className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  hasGlasses === 'naked'
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">visibility</span>
                <span>ตาเปล่า (ไม่ใส่แว่น)</span>
              </button>
              <button
                type="button"
                onClick={() => setHasGlasses('with_glasses')}
                className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  hasGlasses === 'with_glasses'
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">eyeglasses</span>
                <span>ใส่แว่นเดิม (เช็กค่าแว่น)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Calibration Standard Slider (Credit Card Size Ratio) */}
      <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/25 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[17px]">aspect_ratio</span>
            <span className="font-bold text-xs text-on-surface">ปรับสัดส่วนหน้าจอ (Screen Scale Calibration)</span>
          </div>
          <span className="text-[10px] font-mono text-outline">{scale}%</span>
        </div>
        <p className="text-[10px] text-on-surface-variant">
          ความกว้างของแถบด้านล่างควรใกล้เคียงกับความกว้างของบัตรประชาชนหรือบัตรเครดิตทั่วไป (85.6 มม.)
        </p>
        <div className="flex items-center justify-center py-1">
          <div
            className="h-10 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-mono text-[10px] flex items-center justify-between px-3 shadow-sm border border-white/20"
            style={{ width: `${Math.round(230 * (scale / 100))}px` }}
          >
            <span>💳 บัตรมาตรฐาน</span>
            <span>85.6 mm</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(70, s - 5))}
            className="w-7 h-7 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center text-on-surface font-bold hover:bg-surface-container"
          >
            -
          </button>
          <input
            type="range"
            min="70"
            max="130"
            value={scale}
            onChange={(e) => setScale(parseInt(e.target.value, 10))}
            className="flex-1 accent-primary"
          />
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(130, s + 5))}
            className="w-7 h-7 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center text-on-surface font-bold hover:bg-surface-container"
          >
            +
          </button>
        </div>
      </div>

      {/* Start Button */}
      <button
        type="button"
        onClick={onStart}
        className="w-full h-12 rounded-2xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer mt-1"
      >
        <span>เริ่มการตรวจวัดสายตา</span>
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>
  );
};
