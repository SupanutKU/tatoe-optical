import React, { useState } from 'react';
import { AcuityResult, EyeSide } from '../../types/visionTest';

interface VisualAcuityTestProps {
  onComplete: (odResult: AcuityResult, osResult: AcuityResult) => void;
  onSkip?: () => void;
}

interface Question {
  level: string; // e.g. '20/200', '20/100', '20/70', '20/50', '20/40', '20/30', '20/25', '20/20'
  direction: 'up' | 'down' | 'left' | 'right';
  sizePx: number;
  sphEquiv: string; // estimated sphere diopter
}

const ACUITY_QUESTIONS: Question[] = [
  { level: '20/200', direction: 'right', sizePx: 84, sphEquiv: '-3.00' },
  { level: '20/100', direction: 'down', sizePx: 64, sphEquiv: '-2.25' },
  { level: '20/70', direction: 'left', sizePx: 48, sphEquiv: '-1.75' },
  { level: '20/50', direction: 'up', sizePx: 38, sphEquiv: '-1.25' },
  { level: '20/40', direction: 'right', sizePx: 30, sphEquiv: '-0.75' },
  { level: '20/30', direction: 'left', sizePx: 24, sphEquiv: '-0.50' },
  { level: '20/25', direction: 'down', sizePx: 18, sphEquiv: '-0.25' },
  { level: '20/20', direction: 'up', sizePx: 14, sphEquiv: '0.00' }
];

export const VisualAcuityTest: React.FC<VisualAcuityTestProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentEye, setCurrentEye] = useState<EyeSide>('od'); // Start with OD (Right eye)
  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [odScoreLevel, setOdScoreLevel] = useState<Question>(ACUITY_QUESTIONS[0]);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  const currentQ = ACUITY_QUESTIONS[questionIdx];

  const handleAnswer = (chosenDir: 'up' | 'down' | 'left' | 'right' | 'unclear') => {
    const isCorrect = chosenDir === currentQ.direction;

    if (isCorrect) {
      // Record this level as currently achieved
      if (currentEye === 'od') {
        setOdScoreLevel(currentQ);
      }
      setConsecutiveErrors(0);

      // Move to next sharper level if available
      if (questionIdx + 1 < ACUITY_QUESTIONS.length) {
        setQuestionIdx(questionIdx + 1);
      } else {
        // Finished all questions for this eye
        finishEye(currentQ);
      }
    } else {
      // Wrong or unclear
      const newErrors = consecutiveErrors + 1;
      setConsecutiveErrors(newErrors);

      // If failed twice or at limit, lock in highest passed level
      if (newErrors >= 2 || questionIdx === 0) {
        const achievedLevel =
          questionIdx > 0 ? ACUITY_QUESTIONS[questionIdx - 1] : ACUITY_QUESTIONS[0];
        finishEye(achievedLevel);
      } else {
        // Give one more chance at same level with random variation
        setQuestionIdx(Math.min(questionIdx + 1, ACUITY_QUESTIONS.length - 1));
      }
    }
  };

  const finishEye = (finalQ: Question) => {
    if (currentEye === 'od') {
      // Right eye finished, switch to left eye
      setOdScoreLevel(finalQ);
      setCurrentEye('os');
      setQuestionIdx(0);
      setConsecutiveErrors(0);
    } else {
      // Left eye finished, package final results
      const odResult: AcuityResult = {
        eye: 'od',
        level: odScoreLevel.level,
        estimatedSph: odScoreLevel.sphEquiv,
        scoreText: `ระดับความคมชัด ${odScoreLevel.level} (ประมาณ SPH ${odScoreLevel.sphEquiv})`,
        passed: odScoreLevel.level === '20/20' || odScoreLevel.level === '20/25'
      };

      const osResult: AcuityResult = {
        eye: 'os',
        level: finalQ.level,
        estimatedSph: finalQ.sphEquiv,
        scoreText: `ระดับความคมชัด ${finalQ.level} (ประมาณ SPH ${finalQ.sphEquiv})`,
        passed: finalQ.level === '20/20' || finalQ.level === '20/25'
      };

      onComplete(odResult, osResult);
    }
  };

  // Rotation mapping for Tumbling E
  const ROTATIONS: Record<string, string> = {
    right: 'rotate-0',
    down: 'rotate-90',
    left: 'rotate-180',
    up: '-rotate-90'
  };

  return (
    <div className="flex flex-col w-full gap-4 text-xs">
      {/* Eye Indicator Badge & Instructions */}
      <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                currentEye === 'od' ? 'bg-primary' : 'bg-secondary'
              } animate-ping`}
            ></span>
            <span className="font-bold text-sm text-on-surface">
              {currentEye === 'od'
                ? 'ขั้นตอนที่ 1: ตรวจตาขวา (OD - Right Eye)'
                : 'ขั้นตอนที่ 2: ตรวจตาซ้าย (OS - Left Eye)'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-outline">
            {questionIdx + 1} / {ACUITY_QUESTIONS.length}
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
                ใช้ฝ่ามือซ้าย<strong>ปิดตาข้างซ้าย</strong> (ห้ามกดทับลูกตา) และมองที่ตัว E ด้วย<strong>ตาข้างขวา</strong>
              </>
            ) : (
              <>
                ใช้ฝ่ามือขวา<strong>ปิดตาข้างขวา</strong> และมองที่ตัว E ด้วย<strong>ตาข้างซ้าย</strong>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Tumbling E Target Box */}
      <div className="w-full aspect-[4/3] max-h-[220px] rounded-3xl bg-white shadow-inner border border-outline-variant/30 flex flex-col items-center justify-center relative overflow-hidden select-none">
        <div className="absolute top-2.5 left-3 text-[10px] font-mono text-slate-400">
          ระดับ: {currentQ.level}
        </div>
        <div className="absolute top-2.5 right-3 text-[10px] font-mono text-primary font-bold">
          SPH ประมาณ: {currentQ.sphEquiv}
        </div>

        {/* The Snellen / Tumbling E SVG */}
        <div
          className={`transition-all duration-200 transform ${ROTATIONS[currentQ.direction]} flex items-center justify-center`}
          style={{ width: currentQ.sizePx, height: currentQ.sizePx }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-black">
            {/* Standard Tumbling E geometric ratio: 5 units high x 5 units wide, 1 unit stroke */}
            <path d="M 0,0 L 100,0 L 100,20 L 20,20 L 20,40 L 80,40 L 80,60 L 20,60 L 20,80 L 100,80 L 100,100 L 0,100 Z" />
          </svg>
        </div>

        <div className="absolute bottom-2 text-[10px] text-slate-400">
          ตัว E มีขาชี้ไปทางทิศใด?
        </div>
      </div>

      {/* 4-Directional Response Pad */}
      <div className="flex flex-col items-center gap-2">
        <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
          {/* Row 1: Up */}
          <div className="col-start-2">
            <button
              type="button"
              onClick={() => handleAnswer('up')}
              className="w-full h-12 rounded-xl bg-surface-container-lowest hover:bg-primary hover:text-white border border-outline-variant/30 flex flex-col items-center justify-center text-on-surface shadow-xs active:scale-95 transition-all cursor-pointer group"
              aria-label="ชี้ขึ้นด้านบน"
            >
              <span className="material-symbols-outlined text-[24px] group-hover:translate-y-[-2px] transition-transform">
                arrow_upward
              </span>
              <span className="text-[9px] font-bold">ชี้ขึ้น</span>
            </button>
          </div>

          {/* Row 2: Left, Center Unclear, Right */}
          <div className="col-start-1 col-span-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleAnswer('left')}
              className="h-12 rounded-xl bg-surface-container-lowest hover:bg-primary hover:text-white border border-outline-variant/30 flex flex-col items-center justify-center text-on-surface shadow-xs active:scale-95 transition-all cursor-pointer group"
              aria-label="ชี้ไปทางซ้าย"
            >
              <span className="material-symbols-outlined text-[24px] group-hover:translate-x-[-2px] transition-transform">
                arrow_back
              </span>
              <span className="text-[9px] font-bold">ชี้ซ้าย</span>
            </button>

            <button
              type="button"
              onClick={() => handleAnswer('unclear')}
              className="h-12 rounded-xl bg-surface-container-low hover:bg-surface-container-highest border border-outline-variant/40 flex flex-col items-center justify-center text-on-surface-variant active:scale-95 transition-all cursor-pointer"
              aria-label="มองไม่ชัด / ไม่แน่ใจ"
            >
              <span className="material-symbols-outlined text-[20px] text-outline">
                help_outline
              </span>
              <span className="text-[9px] font-semibold text-outline">มองไม่ชัด</span>
            </button>

            <button
              type="button"
              onClick={() => handleAnswer('right')}
              className="h-12 rounded-xl bg-surface-container-lowest hover:bg-primary hover:text-white border border-outline-variant/30 flex flex-col items-center justify-center text-on-surface shadow-xs active:scale-95 transition-all cursor-pointer group"
              aria-label="ชี้ไปทางขวา"
            >
              <span className="material-symbols-outlined text-[24px] group-hover:translate-x-[2px] transition-transform">
                arrow_forward
              </span>
              <span className="text-[9px] font-bold">ชี้ขวา</span>
            </button>
          </div>

          {/* Row 3: Down */}
          <div className="col-start-2">
            <button
              type="button"
              onClick={() => handleAnswer('down')}
              className="w-full h-12 rounded-xl bg-surface-container-lowest hover:bg-primary hover:text-white border border-outline-variant/30 flex flex-col items-center justify-center text-on-surface shadow-xs active:scale-95 transition-all cursor-pointer group"
              aria-label="ชี้ลงด้านล่าง"
            >
              <span className="material-symbols-outlined text-[24px] group-hover:translate-y-[2px] transition-transform">
                arrow_downward
              </span>
              <span className="text-[9px] font-bold">ชี้ลง</span>
            </button>
          </div>
        </div>
      </div>

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
