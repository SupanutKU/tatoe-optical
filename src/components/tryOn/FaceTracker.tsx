import React from 'react';

export type FaceTrackerDisplayState =
  | 'loading'
  | 'searching'
  | 'detected'
  | 'multiple'
  | 'error';

interface FaceTrackerProps {
  state: FaceTrackerDisplayState;
  pdMm?: number | null;
  message?: string;
}

const STATE_CONFIG: Record<FaceTrackerDisplayState, { label: string; dotClass: string }> = {
  loading: { label: 'กำลังเตรียมระบบตรวจจับใบหน้า...', dotClass: 'bg-amber-400 animate-pulse' },
  searching: { label: 'กรุณาหันหน้าเข้ากล้อง', dotClass: 'bg-amber-400 animate-pulse' },
  detected: { label: 'ตรวจพบใบหน้า ✓', dotClass: 'bg-emerald-400 animate-ping' },
  multiple: { label: 'พบมากกว่า 1 ใบหน้า', dotClass: 'bg-error animate-pulse' },
  error: { label: 'เกิดข้อผิดพลาด', dotClass: 'bg-error' },
};

export const FaceTracker: React.FC<FaceTrackerProps> = ({ state, pdMm, message }) => {
  const config = STATE_CONFIG[state];

  return (
    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white/95 text-[11px] px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md z-10">
      <span className="flex items-center gap-1.5 truncate">
        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClass}`}></span>
        <span className="truncate">{message || config.label}</span>
      </span>
      {state === 'detected' && pdMm ? (
        <span className="font-mono text-[10px] shrink-0 ml-2">PD: {pdMm} mm</span>
      ) : null}
    </div>
  );
};
