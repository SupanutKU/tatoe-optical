import React, { useState } from 'react';
import { AstigmatismDial } from './AstigmatismDial';
import { AstigmatismResult, EyeSide } from '../../types/visionTest';

interface AstigmatismTestProps {
  onComplete: (odResult: AstigmatismResult, osResult: AstigmatismResult) => void;
  onSkip?: () => void;
}

interface EyeState {
  hasAstigmatism: boolean | null;
  selectedHour: number | null;
  selectedAxis: number;
  cylinderPower: string;
  step: 'dial' | 'power';
}

export const AstigmatismTest: React.FC<AstigmatismTestProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentEye, setCurrentEye] = useState<EyeSide>('od'); // Start with OD (Right eye)

  // Track state for both eyes
  const [odState, setOdState] = useState<EyeState>({
    hasAstigmatism: null,
    selectedHour: null,
    selectedAxis: 90,
    cylinderPower: '-0.75',
    step: 'dial'
  });

  const [osState, setOsState] = useState<EyeState>({
    hasAstigmatism: null,
    selectedHour: null,
    selectedAxis: 90,
    cylinderPower: '-0.75',
    step: 'dial'
  });

  const currentState = currentEye === 'od' ? odState : osState;
  const setCurrentState = (updater: (prev: EyeState) => EyeState) => {
    if (currentEye === 'od') {
      setOdState(updater);
    } else {
      setOsState(updater);
    }
  };

  const handleNoAstigmatism = () => {
    const updated: EyeState = {
      ...currentState,
      hasAstigmatism: false,
      selectedHour: null,
      selectedAxis: 0,
      cylinderPower: '0.00'
    };
    setCurrentState(() => updated);
    proceedToNextEyeOrFinish(updated);
  };

  const handleHasAstigmatism = () => {
    setCurrentState((prev) => ({
      ...prev,
      hasAstigmatism: true,
      selectedHour: prev.selectedHour || 12,
      selectedAxis: prev.selectedAxis || 90
    }));
  };

  const handleHourSelect = (hour: number) => {
    setCurrentState((prev) => ({
      ...prev,
      hasAstigmatism: true,
      selectedHour: hour
    }));
  };

  const handleAxisSelect = (axis: number) => {
    setCurrentState((prev) => ({
      ...prev,
      hasAstigmatism: true,
      selectedAxis: axis
    }));
  };

  const handleProceedToPower = () => {
    setCurrentState((prev) => ({
      ...prev,
      step: 'power'
    }));
  };

  const handlePowerSelect = (power: string) => {
    const updated: EyeState = {
      ...currentState,
      cylinderPower: power
    };
    setCurrentState(() => updated);
    proceedToNextEyeOrFinish(updated);
  };

  const proceedToNextEyeOrFinish = (finalEyeState: EyeState) => {
    if (currentEye === 'od') {
      // Move to Left Eye (OS)
      setOdState(finalEyeState);
      setCurrentEye('os');
    } else {
      // Both eyes finished!
      const odRes: AstigmatismResult = {
        eye: 'od',
        hasAstigmatism: !!odState.hasAstigmatism,
        sharpestClockHour: odState.selectedHour || undefined,
        calculatedAxisDeg: odState.hasAstigmatism ? odState.selectedAxis : undefined,
        cylinderPower: odState.hasAstigmatism ? odState.cylinderPower : '0.00',
        note: odState.hasAstigmatism
          ? `สายตาเอียง CYL ${odState.cylinderPower} แกน ${odState.selectedAxis}°`
          : 'ไม่มีสายตาเอียง (เส้นคมชัดสม่ำเสมอทุกทิศทาง)'
      };

      const osRes: AstigmatismResult = {
        eye: 'os',
        hasAstigmatism: !!finalEyeState.hasAstigmatism,
        sharpestClockHour: finalEyeState.selectedHour || undefined,
        calculatedAxisDeg: finalEyeState.hasAstigmatism ? finalEyeState.selectedAxis : undefined,
        cylinderPower: finalEyeState.hasAstigmatism ? finalEyeState.cylinderPower : '0.00',
        note: finalEyeState.hasAstigmatism
          ? `สายตาเอียง CYL ${finalEyeState.cylinderPower} แกน ${finalEyeState.selectedAxis}°`
          : 'ไม่มีสายตาเอียง (เส้นคมชัดสม่ำเสมอทุกทิศทาง)'
      };

      onComplete(odRes, osRes);
    }
  };

  return (
    <div className="flex flex-col w-full gap-4 text-xs">
      {/* Eye Indicator Banner */}
      <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                currentEye === 'od' ? 'bg-primary' : 'bg-secondary'
              } animate-pulse`}
            ></span>
            <span className="font-bold text-sm text-on-surface">
              {currentEye === 'od'
                ? 'ตรวจสายตาเอียง: ตาขวา (OD - Right Eye)'
                : 'ตรวจสายตาเอียง: ตาซ้าย (OS - Left Eye)'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-lg bg-surface-container-lowest border border-outline-variant/25">
            {currentEye === 'od' ? 'ข้างที่ 1/2' : 'ข้างที่ 2/2'}
          </span>
        </div>

        {/* Eye covering instruction */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
          <span className="text-xl">
            {currentEye === 'od' ? '🙈' : '🙉'}
          </span>
          <p className="text-[11px] text-on-surface-variant leading-snug">
            {currentEye === 'od' ? (
              <>
                ปิด<strong>ตาซ้าย</strong> มองจุดกึ่งกลางของวงล้อนาฬิกาด้วย<strong>ตาขวา</strong>
              </>
            ) : (
              <>
                ปิด<strong>ตาขวา</strong> มองจุดกึ่งกลางของวงล้อนาฬิกาด้วย<strong>ตาซ้าย</strong>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Main Astigmatism Test Area */}
      {currentState.step === 'dial' ? (
        <div className="flex flex-col items-center gap-3">
          {/* Instructions */}
          <div className="text-center max-w-xs">
            <h3 className="font-bold text-sm text-on-surface mb-0.5">
              การทดสอบเส้นรัศมีนาฬิกา (Astigmatic Clock Dial)
            </h3>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              มองที่จุดศูนย์กลาง สังเกตว่าเส้นในแต่ละทิศทางดำชัดเท่ากันหรือไม่
            </p>
          </div>

          {/* Interactive Clock Dial */}
          <AstigmatismDial
            selectedHour={currentState.selectedHour}
            selectedAxis={currentState.selectedAxis}
            onSelectHour={handleHourSelect}
            onSelectAxis={handleAxisSelect}
          />

          {/* User Decision Buttons */}
          <div className="w-full flex flex-col gap-2 mt-1">
            <button
              type="button"
              onClick={handleNoAstigmatism}
              className="w-full py-2.5 px-4 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-on-surface font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-teal-600 text-[18px]">
                check_circle
              </span>
              <span>เส้นทุกเส้นดำชัดเท่ากันหมด (ไม่มีสายตาเอียง)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleHasAstigmatism();
                handleProceedToPower();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">adjust</span>
              <span>
                {currentState.selectedHour
                  ? `ยืนยันเส้นเข็ม ${currentState.selectedHour} (องศา ${currentState.selectedAxis}°) ชัดที่สุด`
                  : 'มีบางเส้นเข้มหรือชัดกว่าเส้นอื่นอย่างเห็นได้ชัด'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Step 2 of Astigmatism: Quantifying Cylinder Power (CYL) */
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1.5 text-center">
            <span className="text-[10px] font-bold text-primary">ประเมินกำลังสายตาเอียง (Cylinder Power)</span>
            <h4 className="font-bold text-sm text-on-surface">
              เปรียบเทียบความแตกต่างระหว่างเส้นที่ชัดกับเส้นที่เบลอ
            </h4>
            <p className="text-[11px] text-on-surface-variant">
              แกนที่ตรวจพบ: <strong>{currentState.selectedAxis}°</strong> (แนวเข็ม {currentState.selectedHour || 12})
            </p>
          </div>

          {/* Visual Comparison Graphic */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
            <div className="p-3 bg-white rounded-xl flex flex-col items-center justify-center gap-2 shadow-inner">
              <span className="text-[10px] font-bold text-primary">เส้นในแกนที่ชัด (Sharp)</span>
              <div className="w-16 h-12 flex items-center justify-center">
                <div className="w-12 h-1 bg-black rounded-full shadow-sm"></div>
              </div>
              <span className="text-[9px] text-slate-500">ดำสนิท คมชัด ไร้เงา</span>
            </div>

            <div className="p-3 bg-white rounded-xl flex flex-col items-center justify-center gap-2 shadow-inner">
              <span className="text-[10px] font-bold text-slate-700">เส้นในแกนตั้งฉาก (Blur)</span>
              <div className="w-16 h-12 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-300 rounded-full blur-[1px]"></div>
              </div>
              <span className="text-[9px] text-slate-500">สีเทาจาง หรือเป็นเงาซ้อน</span>
            </div>
          </div>

          <span className="text-[11px] font-bold text-on-surface mt-1">
            ความคมชัดต่างกันมากน้อยเพียงใด?
          </span>

          <div className="grid grid-cols-1 gap-2">
            {[
              {
                cyl: '-0.50',
                title: 'ต่างกันเล็กน้อย (Mild Astigmatism)',
                desc: 'เส้นที่ชัดเข้มกว่าเพียงเล็กน้อย เส้นอื่นยังพอมองเห็นชัด'
              },
              {
                cyl: '-0.75',
                title: 'ต่างกันปานกลาง (Moderate Astigmatism)',
                desc: 'เส้นหนึ่งเข้มคมชัดชัดเจน อีกทิศทางเริ่มเบลอ'
              },
              {
                cyl: '-1.25',
                title: 'ต่างกันชัดเจนมาก (Noticeable Astigmatism)',
                desc: 'เส้นที่เข้มคมมาก ขณะที่เส้นตั้งฉากเบลอจางอย่างเห็นได้ชัด'
              },
              {
                cyl: '-1.75',
                title: 'ต่างกันสูงมาก (High Astigmatism)',
                desc: 'เส้นทิศทางอื่นมองเห็นเป็นเงาซ้อน หรือไม่สามารถโฟกัสได้'
              }
            ].map((item) => (
              <button
                key={item.cyl}
                type="button"
                onClick={() => handlePowerSelect(item.cyl)}
                className="p-3 rounded-xl bg-surface-container-lowest hover:bg-primary/5 hover:border-primary border border-outline-variant/30 text-left flex items-start justify-between gap-3 active:scale-98 transition-all cursor-pointer group"
              >
                <div>
                  <strong className="block text-xs text-on-surface group-hover:text-primary">
                    {item.title}
                  </strong>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    {item.desc}
                  </span>
                </div>
                <span className="font-mono font-bold text-xs text-primary px-2 py-1 rounded-md bg-surface-container-low shrink-0">
                  CYL {item.cyl}
                </span>
              </button>
            ))}
          </div>

          {/* Back to dial button */}
          <button
            type="button"
            onClick={() => setCurrentState((prev) => ({ ...prev, step: 'dial' }))}
            className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer self-center mt-1"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>กลับไปปรับแกนองศาเอียงบนวงล้อ</span>
          </button>
        </div>
      )}

      {/* Skip button if needed */}
      {onSkip && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onSkip}
            className="text-[11px] text-outline hover:text-primary underline cursor-pointer"
          >
            ข้ามไปยังขั้นตอนถัดไป
          </button>
        </div>
      )}
    </div>
  );
};
