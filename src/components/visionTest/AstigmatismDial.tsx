import React from 'react';

interface AstigmatismDialProps {
  selectedHour: number | null; // 1 to 12 or null
  selectedAxis: number; // 0 to 180 degrees
  onSelectHour: (hour: number) => void;
  onSelectAxis: (deg: number) => void;
  interactive?: boolean;
}

export const AstigmatismDial: React.FC<AstigmatismDialProps> = ({
  selectedHour,
  selectedAxis,
  onSelectHour,
  onSelectAxis,
  interactive = true
}) => {
  // Clock hours 1 through 12. Opposite pairs are (hour, hour + 6)
  const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // Map hour to primary axis angle (0-180)
  // Standard clinical optometry formula for minus cylinder:
  // Hour x 30 deg. (e.g. 1 & 7 = 30°, 2 & 8 = 60°, 3 & 9 = 90°, 4 & 10 = 120°, 5 & 11 = 150°, 6 & 12 = 180°/90°)
  const getHourAngle = (hour: number): number => {
    const norm = hour % 6;
    return norm === 0 ? 180 : norm * 30;
  };

  const handleLineClick = (hour: number) => {
    if (!interactive) return;
    onSelectHour(hour);
    onSelectAxis(getHourAngle(hour));
  };

  const center = 150;
  const radius = 125;
  const innerRadius = 38;

  return (
    <div className="flex flex-col items-center select-none w-full">
      <div className="relative w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] bg-surface-container-lowest rounded-full p-2 shadow-inner border border-outline-variant/30 flex items-center justify-center">
        {/* SVG Astigmatism Clock Dial */}
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full cursor-pointer touch-none"
          aria-label="วงล้อตรวจสายตาเอียง Astigmatism Clock Dial"
        >
          <defs>
            {/* Soft background radial gradient */}
            <radialGradient id="dialGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="90%" stopColor="#f8fafc" stopOpacity="1" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* Background circle */}
          <circle cx={center} cy={center} r={radius + 18} fill="url(#dialGlow)" />
          <circle cx={center} cy={center} r={radius + 18} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx={center} cy={center} r={radius + 8} fill="none" stroke="#e2e8f0" strokeWidth="0.8" />

          {/* Center bullseye guide */}
          <circle cx={center} cy={center} r={innerRadius - 4} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
          <circle cx={center} cy={center} r="6" fill="#006194" />
          <circle cx={center} cy={center} r="2" fill="#ffffff" />

          {/* Highlight wedge for selected angle if any */}
          {selectedHour !== null && (
            <g opacity="0.3">
              <line
                x1={center - Math.cos((selectedAxis * Math.PI) / 180) * radius}
                y1={center - Math.sin((selectedAxis * Math.PI) / 180) * radius}
                x2={center + Math.cos((selectedAxis * Math.PI) / 180) * radius}
                y2={center + Math.sin((selectedAxis * Math.PI) / 180) * radius}
                stroke="#006194"
                strokeWidth="24"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* 12 Radial Clock Line Groups (Each radius consists of 3 parallel clinical lines) */}
          {HOURS.slice(0, 6).map((h) => {
            // angle in radians from vertical (12 o'clock is 0 rad / -90 deg in cartesian)
            const angleDeg = (h * 30) - 90;
            const rad = (angleDeg * Math.PI) / 180;
            const perpRad = rad + Math.PI / 2;

            // Opposite hour
            const oppH = (h + 6) % 12 || 12;
            const isSelected = selectedHour === h || selectedHour === oppH;

            // Offsets for the 3 parallel lines
            const offsets = [-2.8, 0, 2.8];

            return (
              <g
                key={h}
                onClick={() => handleLineClick(h)}
                className="group cursor-pointer transition-transform duration-150"
              >
                {/* Invisible wide hit area for easy touch targets */}
                <line
                  x1={center - Math.cos(rad) * radius}
                  y1={center - Math.sin(rad) * radius}
                  x2={center + Math.cos(rad) * radius}
                  y2={center + Math.sin(rad) * radius}
                  stroke="transparent"
                  strokeWidth="26"
                  className="cursor-pointer"
                />

                {/* 3 crisp parallel lines per meridian */}
                {offsets.map((off, idx) => {
                  const ox = Math.cos(perpRad) * off;
                  const oy = Math.sin(perpRad) * off;

                  return (
                    <line
                      key={idx}
                      x1={center + Math.cos(rad) * innerRadius + ox}
                      y1={center + Math.sin(rad) * innerRadius + oy}
                      x2={center + Math.cos(rad) * radius + ox}
                      y2={center + Math.sin(rad) * radius + oy}
                      stroke={isSelected ? '#006194' : '#1e293b'}
                      strokeWidth={isSelected ? (idx === 1 ? '3.4' : '2.2') : (idx === 1 ? '2.4' : '1.5')}
                      strokeLinecap="round"
                      className="transition-all duration-200"
                    />
                  );
                })}

                {/* Opposite side 3 parallel lines */}
                {offsets.map((off, idx) => {
                  const ox = Math.cos(perpRad) * off;
                  const oy = Math.sin(perpRad) * off;

                  return (
                    <line
                      key={`opp-${idx}`}
                      x1={center - Math.cos(rad) * innerRadius + ox}
                      y1={center - Math.sin(rad) * innerRadius + oy}
                      x2={center - Math.cos(rad) * radius + ox}
                      y2={center - Math.sin(rad) * radius + oy}
                      stroke={isSelected ? '#006194' : '#1e293b'}
                      strokeWidth={isSelected ? (idx === 1 ? '3.4' : '2.2') : (idx === 1 ? '2.4' : '1.5')}
                      strokeLinecap="round"
                      className="transition-all duration-200"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Clock Numerals (1 through 12) */}
          {HOURS.map((h) => {
            const angleDeg = (h * 30) - 90;
            const rad = (angleDeg * Math.PI) / 180;
            const numRadius = radius + 11;
            const nx = center + Math.cos(rad) * numRadius;
            const ny = center + Math.sin(rad) * numRadius;
            const isSelected = selectedHour === h || (selectedHour !== null && (selectedHour + 6) % 12 || 12) === h;

            return (
              <text
                key={`num-${h}`}
                x={nx}
                y={ny}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isSelected ? '#006194' : '#475569'}
                fontWeight={isSelected ? 'bold' : '600'}
                fontSize={isSelected ? '13' : '11'}
                className="select-none pointer-events-none transition-all duration-150 font-sans"
              >
                {h}
              </text>
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 m-auto w-16 h-16 rounded-full flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] font-bold text-primary leading-tight">
            {selectedHour ? `${selectedAxis}°` : 'จุดรวม'}
          </span>
          <span className="text-[8px] text-slate-500">
            {selectedHour ? `เข็ม ${selectedHour}` : 'จ้องตรงนี้'}
          </span>
        </div>
      </div>

      {/* Axis Degree Slider and Fine-tuner */}
      <div className="w-full max-w-[320px] mt-4 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[17px]">rotate_right</span>
            ปรับองศาแกนเอียง (Axis)
          </span>
          <span className="font-mono font-bold text-sm text-primary px-2 py-0.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
            {selectedAxis}°
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="180"
          step="5"
          value={selectedAxis}
          onChange={(e) => onSelectAxis(parseInt(e.target.value, 10))}
          className="w-full accent-primary h-2 bg-surface-container-highest rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-outline">
          <span>0° (แนวนอน)</span>
          <span>45°</span>
          <span>90° (แนวตั้ง)</span>
          <span>135°</span>
          <span>180°</span>
        </div>
      </div>
    </div>
  );
};
