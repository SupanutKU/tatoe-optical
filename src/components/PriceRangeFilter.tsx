import React, { useState, useEffect } from 'react';

interface PriceRangeFilterProps {
  minPrice: number;
  maxPrice: number;
  minLimit?: number;
  maxLimit?: number;
  step?: number;
  onChange: (min: number, max: number) => void;
  onReset?: () => void;
  matchingCount?: number;
  className?: string;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  minPrice,
  maxPrice,
  minLimit = 500,
  maxLimit = 3000,
  step = 50,
  onChange,
  onReset,
  matchingCount,
  className = '',
  isCollapsible = true,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [minInputVal, setMinInputVal] = useState(String(minPrice));
  const [maxInputVal, setMaxInputVal] = useState(String(maxPrice));

  // Sync inputs when props change
  useEffect(() => {
    setMinInputVal(String(minPrice));
  }, [minPrice]);

  useEffect(() => {
    setMaxInputVal(String(maxPrice));
  }, [maxPrice]);

  const isFiltered = minPrice > minLimit || maxPrice < maxLimit;

  // Percentage for the track fill
  const minPercent = Math.max(0, Math.min(100, ((minPrice - minLimit) / (maxLimit - minLimit)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((maxPrice - minLimit) / (maxLimit - minLimit)) * 100));

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const clamped = Math.min(val, maxPrice - step);
    onChange(clamped, maxPrice);
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const clamped = Math.max(val, minPrice + step);
    onChange(minPrice, clamped);
  };

  const commitMinInput = () => {
    let val = parseInt(minInputVal, 10);
    if (isNaN(val)) val = minLimit;
    val = Math.max(minLimit, Math.min(val, maxPrice - step));
    setMinInputVal(String(val));
    onChange(val, maxPrice);
  };

  const commitMaxInput = () => {
    let val = parseInt(maxInputVal, 10);
    if (isNaN(val)) val = maxLimit;
    val = Math.min(maxLimit, Math.max(val, minPrice + step));
    setMaxInputVal(String(val));
    onChange(minPrice, val);
  };

  const handlePreset = (min: number, max: number) => {
    onChange(min, max);
  };

  return (
    <div
      className={`rounded-2xl bg-surface-container-low border border-outline-variant/20 shadow-2xs overflow-hidden transition-all ${className}`}
    >
      {/* Header bar */}
      <div className="p-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">payments</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-on-surface">ตัวกรองช่วงราคา</span>
              <span className="text-[10px] text-on-surface-variant font-normal hidden xs:inline">
                (Price Range)
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-black text-primary">
                ฿{minPrice.toLocaleString()} – ฿{maxPrice.toLocaleString()}
              </span>
              {matchingCount !== undefined && (
                <span className="text-[10px] text-on-surface-variant font-medium">
                  ({matchingCount} ชิ้น)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isFiltered && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] text-primary hover:text-primary-container font-semibold px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all flex items-center gap-1 active:scale-95"
              title="ล้างช่วงราคา กลับเป็นค่าเริ่มต้น"
            >
              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
              <span>รีเซ็ต</span>
            </button>
          )}

          {isCollapsible && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-all active:scale-95"
              aria-label={isExpanded ? 'ย่อตัวกรองราคา' : 'ขยายตัวกรองราคา'}
              title={isExpanded ? 'ย่อตัวกรองราคา' : 'ขยายตัวกรองราคา'}
            >
              <span
                className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Controls Body */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-outline-variant/15 flex flex-col gap-3.5 animate-in fade-in duration-150">
          {/* Dual Thumb Range Slider */}
          <div className="flex flex-col gap-1.5 pt-2">
            <div className="relative w-full h-8 flex items-center">
              {/* Track Background */}
              <div className="absolute w-full h-2 rounded-full bg-surface-container-high"></div>

              {/* Active Fill Track */}
              <div
                className="absolute h-2 rounded-full bg-primary transition-[left,width] duration-75"
                style={{
                  left: `${minPercent}%`,
                  width: `${Math.max(0, maxPercent - minPercent)}%`,
                }}
              ></div>

              {/* Min Range Slider */}
              <input
                type="range"
                min={minLimit}
                max={maxLimit}
                step={step}
                value={minPrice}
                onChange={handleMinSliderChange}
                aria-label="ราคาต่ำสุด"
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none z-20 accent-primary cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:shadow-md"
              />

              {/* Max Range Slider */}
              <input
                type="range"
                min={minLimit}
                max={maxLimit}
                step={step}
                value={maxPrice}
                onChange={handleMaxSliderChange}
                aria-label="ราคาสูงสุด"
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none z-20 accent-primary cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
              />
            </div>

            {/* Slider Scale Labels */}
            <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium px-0.5">
              <span>฿{minLimit.toLocaleString()}</span>
              <span>฿{((minLimit + maxLimit) / 2).toLocaleString()}</span>
              <span>฿{maxLimit.toLocaleString()}</span>
            </div>
          </div>

          {/* Direct Numeric Input Boxes */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-on-surface-variant flex items-center justify-between">
                <span>ราคาต่ำสุด (Min)</span>
                <span className="text-[10px] text-outline">บาท</span>
              </label>
              <div className="relative flex items-center rounded-xl bg-surface-container border border-outline-variant/20 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden transition-all">
                <span className="pl-3 text-xs font-bold text-primary select-none">฿</span>
                <input
                  type="number"
                  min={minLimit}
                  max={maxPrice - step}
                  step={step}
                  value={minInputVal}
                  onChange={(e) => setMinInputVal(e.target.value)}
                  onBlur={commitMinInput}
                  onKeyDown={(e) => e.key === 'Enter' && commitMinInput()}
                  className="w-full bg-transparent py-1.5 pl-1.5 pr-2.5 text-xs font-bold text-on-surface focus:outline-none"
                  aria-label="กำหนดราคาต่ำสุดเป็นตัวเลข"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-on-surface-variant flex items-center justify-between">
                <span>ราคาสูงสุด (Max)</span>
                <span className="text-[10px] text-outline">บาท</span>
              </label>
              <div className="relative flex items-center rounded-xl bg-surface-container border border-outline-variant/20 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary overflow-hidden transition-all">
                <span className="pl-3 text-xs font-bold text-primary select-none">฿</span>
                <input
                  type="number"
                  min={minPrice + step}
                  max={maxLimit}
                  step={step}
                  value={maxInputVal}
                  onChange={(e) => setMaxInputVal(e.target.value)}
                  onBlur={commitMaxInput}
                  onKeyDown={(e) => e.key === 'Enter' && commitMaxInput()}
                  className="w-full bg-transparent py-1.5 pl-1.5 pr-2.5 text-xs font-bold text-on-surface focus:outline-none"
                  aria-label="กำหนดราคาสูงสุดเป็นตัวเลข"
                />
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-col gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              ช่วงราคายอดนิยม
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handlePreset(minLimit, maxLimit)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                  minPrice === minLimit && maxPrice === maxLimit
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                ทั้งหมด (฿{minLimit} - ฿{maxLimit.toLocaleString()})
              </button>

              <button
                type="button"
                onClick={() => handlePreset(minLimit, 1200)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                  minPrice === minLimit && maxPrice === 1200
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                ประหยัด (≤ ฿1,200)
              </button>

              <button
                type="button"
                onClick={() => handlePreset(1200, 1800)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                  minPrice === 1200 && maxPrice === 1800
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                ยอดนิยม (฿1,200 - ฿1,800)
              </button>

              <button
                type="button"
                onClick={() => handlePreset(1800, maxLimit)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                  minPrice === 1800 && maxPrice === maxLimit
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                พรีเมียม (≥ ฿1,800)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
