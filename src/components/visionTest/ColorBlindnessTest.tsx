import React, { useState } from 'react';
import { IshiharaPlateCanvas } from './IshiharaPlateCanvas';
import { ColorBlindnessResult, IshiharaPlateDef } from '../../types/visionTest';

interface ColorBlindnessTestProps {
  onComplete: (result: ColorBlindnessResult) => void;
  onSkip?: () => void;
}

const ISHIHARA_PLATES: IshiharaPlateDef[] = [
  {
    id: 1,
    numberDisplay: '12',
    normalSee: '12',
    colorBlindSee: '12',
    type: 'demo',
    title: 'แผ่นที่ 1 (แผ่นทดสอบเบื้องต้น)',
    description: 'แผ่นสาธิต: บุคคลสายตาปกติและผู้มีภาวะตาบอดสีทุกคนสามารถมองเห็นตัวเลขนี้ได้ชัดเจน',
    options: ['12', '72', '17', 'none']
  },
  {
    id: 2,
    numberDisplay: '8',
    normalSee: '8',
    colorBlindSee: '3',
    type: 'red_green_screening',
    title: 'แผ่นที่ 2 (คัดกรองสีแดง-เขียว)',
    description: 'สายตาปกติจะเห็นเลข 8 ผู้มีภาวะตาบอดสีแดง-เขียวมักเห็นเป็นเลข 3',
    options: ['8', '3', '9', 'none']
  },
  {
    id: 3,
    numberDisplay: '6',
    normalSee: '6',
    colorBlindSee: 'none',
    type: 'red_green_screening',
    title: 'แผ่นที่ 3 (ตรวจจับจุดบกพร่อง)',
    description: 'สายตาปกติจะเห็นเลข 6 ผู้มีความบกพร่องในการแยกสีแดง-เขียวมักจะมองไม่เห็นตัวเลข',
    options: ['6', '5', '9', 'none']
  },
  {
    id: 4,
    numberDisplay: '29',
    normalSee: '29',
    colorBlindSee: '70',
    type: 'transformation',
    title: 'แผ่นที่ 4 (แยกแยะคู่สีขัดแย้ง)',
    description: 'สายตาปกติจะเห็นเลข 29 ผู้มีภาวะตาบอดสีแดง-เขียวจะเห็นเป็นเลข 70',
    options: ['29', '70', '28', 'none']
  },
  {
    id: 5,
    numberDisplay: '5',
    normalSee: '5',
    colorBlindSee: '2',
    type: 'red_green_screening',
    title: 'แผ่นที่ 5 (ตรวจการตอบสนองต่อเม็ดสีเขียว)',
    description: 'สายตาปกติจะเห็นเลข 5 ผู้มีภาวะตาบอดสีแดง-เขียวมักเห็นเป็นเลข 2',
    options: ['5', '2', '6', 'none']
  },
  {
    id: 6,
    numberDisplay: '74',
    normalSee: '74',
    colorBlindSee: '21',
    type: 'transformation',
    title: 'แผ่นที่ 6 (ความละเอียดคู่สีผสม)',
    description: 'สายตาปกติจะเห็นเลข 74 ผู้มีภาวะตาบอดสีแดง-เขียวจะเห็นเป็นเลข 21',
    options: ['74', '21', '71', 'none']
  },
  {
    id: 7,
    numberDisplay: '16',
    normalSee: '16',
    colorBlindSee: 'none',
    type: 'red_green_diagnostic',
    title: 'แผ่นที่ 7 (ระดับความรุนแรง)',
    description: 'สายตาปกติจะเห็นเลข 16 ผู้มีความบกพร่องระดับปานกลางถึงรุนแรงจะมองไม่เห็นหรือเห็นเลือนราง',
    options: ['16', '18', '10', 'none']
  },
  {
    id: 8,
    numberDisplay: '73',
    normalSee: '73',
    colorBlindSee: 'none',
    type: 'red_green_screening',
    title: 'แผ่นที่ 8 (ตรวจยืนยันผลลัพธ์)',
    description: 'สายตาปกติจะเห็นเลข 73 ผู้มีภาวะตาบอดสีแดง-เขียวจะไม่สามารถระบุตัวเลขได้',
    options: ['73', '13', '78', 'none']
  }
];

export const ColorBlindnessTest: React.FC<ColorBlindnessTestProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<
    { plateId: number; userAnswer: string; isCorrect: boolean }[]
  >([]);
  const [customInput, setCustomInput] = useState('');

  const currentPlate = ISHIHARA_PLATES[currentIdx];

  const handleSelectOption = (answer: string) => {
    const isCorrect =
      answer.toLowerCase().trim() === currentPlate.normalSee.toLowerCase().trim();

    const record = {
      plateId: currentPlate.id,
      userAnswer: answer,
      isCorrect
    };

    const nextAnswers = [...userAnswers, record];
    setUserAnswers(nextAnswers);
    setCustomInput('');

    if (currentIdx + 1 < ISHIHARA_PLATES.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishTest(nextAnswers);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    handleSelectOption(customInput.trim());
  };

  const finishTest = (
    answers: { plateId: number; userAnswer: string; isCorrect: boolean }[]
  ) => {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const total = answers.length;

    // Diagnose based on errors
    // Specifically check if transformation errors occurred (e.g. answered 3 on plate 2, 70 on plate 4, 21 on plate 6)
    const redGreenConfusionCount = answers.filter((a) => {
      const p = ISHIHARA_PLATES.find((item) => item.id === a.plateId);
      return (
        p &&
        p.colorBlindSee !== 'none' &&
        a.userAnswer.trim() === p.colorBlindSee
      );
    }).length;

    let diagnosis: ColorBlindnessResult['diagnosis'] = 'normal';
    let diagnosisTitle = 'สายตาการมองเห็นสีปกติ (Normal Color Vision)';
    let diagnosisDetails =
      'คุณสามารถจำแนกเฉดสีและมองเห็นตัวเลขบนแผ่นทดสอบอิชิฮาระได้อย่างถูกต้องแม่นยำ ไม่พบความผิดปกติในการแยกแยะสีแดง-เขียว หรือน้ำเงิน-เหลือง';
    let recommendations = [
      'สามารถสวมใส่เลนส์สายตาทุกประเภทและใช้งานหน้าจอได้ปกติ',
      'ผ่านเกณฑ์มาตรฐานการตรวจสายตาสมัครงานและสอบใบขับขี่'
    ];

    if (correctCount >= 7) {
      // Normal
      diagnosis = 'normal';
    } else if (redGreenConfusionCount >= 2 || (correctCount >= 4 && correctCount < 7)) {
      diagnosis = 'red_green_mild';
      diagnosisTitle = 'มีความบกพร่องในการแยกสี แดง-เขียว เล็กน้อย (Mild Red-Green Deficiency)';
      diagnosisDetails =
        'ตรวจพบแนวโน้มความสับสนระหว่างเฉดสีแดงและเขียวในบางสภาวะแสง (เช่น แผ่นที่ 2 หรือ 4) ซึ่งเป็นลักษณะที่พบได้บ่อยในประชากรชายประมาณ 8%';
      recommendations = [
        'แนะนำเลนส์กรองแสงที่ช่วยเพิ่ม Contrast (High-Contrast Tinted Lenses)',
        'ระมัดระวังเป็นพิเศษเมื่อขับขี่ในเวลากลางคืนหรือสภาวะหมอกควัน',
        'ปรึกษานักทัศนมาตรเพื่อตรวจยืนยันด้วย Farnsworth D-15 เพิ่มเติม'
      ];
    } else if (correctCount <= 3) {
      diagnosis = 'red_green_moderate';
      diagnosisTitle = 'มีความบกพร่องในการแยกสี แดง-เขียว ปานกลางถึงมาก (Moderate/Strong Color Deficiency)';
      diagnosisDetails =
        'ไม่สามารถระบุตัวเลขบนแผ่นทดสอบส่วนใหญ่ได้อย่างชัดเจน บ่งชี้ว่าเซลล์รูปกรวย (Cone Cells) ในจอประสาทตารับช่วงคลื่นแสงสีแดงหรือเขียวได้น้อยกว่าปกติ';
      recommendations = [
        'พิจารณาใช้เลนส์สำหรับแก้ไขตาบอดสี (Color Blind Corrective Lenses)',
        'ตั้งค่า Display Color Filters บนสมาร์ตโฟน/คอมพิวเตอร์ (โหมด Protanopia/Deuteranopia)',
        'ตรวจยืนยันอย่างละเอียดกับจักษุแพทย์หรือนักทัศนมาตรประจำสาขา'
      ];
    }

    const finalResult: ColorBlindnessResult = {
      totalPlates: total,
      correctCount,
      diagnosis,
      diagnosisTitle,
      diagnosisDetails,
      recommendations,
      answers
    };

    onComplete(finalResult);
  };

  return (
    <div className="flex flex-col w-full gap-4 text-xs">
      {/* Header Banner */}
      <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-bold text-sm text-on-surface">
              การตรวจคัดกรองตาบอดสี (Ishihara Color Test)
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-surface-container-lowest border border-outline-variant/30">
            {currentIdx + 1} / {ISHIHARA_PLATES.length}
          </span>
        </div>

        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-secondary h-full transition-all duration-300 rounded-full"
            style={{
              width: `${((currentIdx + 1) / ISHIHARA_PLATES.length) * 100}%`
            }}
          ></div>
        </div>

        <p className="text-[11px] text-on-surface-variant">
          {currentPlate.title}: มองภาพในวงกลม แล้วเลือกตัวเลขที่คุณเห็นได้ชัดเจนที่สุด
        </p>
      </div>

      {/* Ishihara Plate Display */}
      <div className="flex flex-col items-center justify-center py-2">
        <IshiharaPlateCanvas
          plateId={currentPlate.id}
          numberDisplay={currentPlate.numberDisplay}
          size={270}
        />
        <span className="text-[10px] text-on-surface-variant mt-2">
          💡 สังเกตตัวเลขที่ซ่อนอยู่ภายในจุดสี
        </span>
      </div>

      {/* Answer Options Grid */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-xs text-on-surface">
          คุณมองเห็นตัวเลขใดในภาพ?
        </span>

        <div className="grid grid-cols-2 gap-2">
          {currentPlate.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelectOption(opt)}
              className="h-12 rounded-xl bg-surface-container-lowest hover:bg-primary hover:text-white border border-outline-variant/30 font-bold text-sm text-on-surface flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer group"
            >
              {opt === 'none' ? (
                <>
                  <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-white">
                    visibility_off
                  </span>
                  <span className="text-xs font-medium">มองไม่เห็นตัวเลข</span>
                </>
              ) : (
                <span className="font-mono text-base">{opt}</span>
              )}
            </button>
          ))}
        </div>

        {/* Or Type Custom Input */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 mt-1">
          <input
            type="number"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="หรือพิมพ์ตัวเลขที่เห็น..."
            className="flex-1 h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            className="h-10 px-4 rounded-xl bg-secondary disabled:opacity-40 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            ส่งคำตอบ
          </button>
        </form>
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
