import React, { useState } from 'react';
import { DistanceCalibration } from './DistanceCalibration';
import { VisualAcuityTest } from './VisualAcuityTest';
import { AstigmatismTest } from './AstigmatismTest';
import { ColorBlindnessTest } from './ColorBlindnessTest';
import { VisionTestSummary } from './VisionTestSummary';
import {
  AcuityResult,
  AstigmatismResult,
  ColorBlindnessResult,
  VisionExamReport,
  VisionTestMode,
  VisionTestStep
} from '../../types/visionTest';
import { Prescription, ScreenId, UserProfile } from '../../types';
import { BranchAppointmentModal } from '../BranchAppointmentModal';

interface VisionTestScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenId) => void;
  onSavePrescription: (updatedRx: Prescription) => void;
  onShowToast: (message: string) => void;
}

export const VisionTestScreen: React.FC<VisionTestScreenProps> = ({
  user,
  onNavigate,
  onSavePrescription,
  onShowToast
}) => {
  const [step, setStep] = useState<VisionTestStep>('calibrate');
  const [mode, setMode] = useState<VisionTestMode>('all');
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  // Results state
  const [odAcuity, setOdAcuity] = useState<AcuityResult>({
    eye: 'od',
    level: '20/30',
    estimatedSph: user.prescription?.od?.sphere || '-1.50',
    scoreText: 'ระดับความคมชัด 20/30',
    passed: true
  });

  const [osAcuity, setOsAcuity] = useState<AcuityResult>({
    eye: 'os',
    level: '20/30',
    estimatedSph: user.prescription?.os?.sphere || '-1.75',
    scoreText: 'ระดับความคมชัด 20/30',
    passed: true
  });

  const [odAstigmatism, setOdAstigmatism] = useState<AstigmatismResult>({
    eye: 'od',
    hasAstigmatism: !!user.prescription?.od?.cylinder && user.prescription.od.cylinder !== '0.00',
    cylinderPower: user.prescription?.od?.cylinder || '0.00',
    calculatedAxisDeg: 90,
    note: 'ไม่มีสายตาเอียง'
  });

  const [osAstigmatism, setOsAstigmatism] = useState<AstigmatismResult>({
    eye: 'os',
    hasAstigmatism: !!user.prescription?.os?.cylinder && user.prescription.os.cylinder !== '0.00',
    cylinderPower: user.prescription?.os?.cylinder || '0.00',
    calculatedAxisDeg: 90,
    note: 'ไม่มีสายตาเอียง'
  });

  const [colorBlindness, setColorBlindness] = useState<ColorBlindnessResult>({
    totalPlates: 8,
    correctCount: 8,
    diagnosis: 'normal',
    diagnosisTitle: 'สายตาการมองเห็นสีปกติ (Normal Color Vision)',
    diagnosisDetails: 'สามารถจำแนกเฉดสีบนแผ่นทดสอบได้อย่างถูกต้องครบถ้วน',
    recommendations: ['สามารถสวมใส่เลนส์สายตาทุกประเภทและใช้งานหน้าจอได้ปกติ'],
    answers: []
  });

  // Flow controllers
  const handleStartCalibrate = () => {
    if (mode === 'astigmatism_only') {
      setStep('astigmatism');
    } else if (mode === 'color_blindness_only') {
      setStep('color_blindness');
    } else {
      setStep('acuity');
    }
  };

  const handleSelectModeAndStart = (selectedMode: VisionTestMode) => {
    setMode(selectedMode);
    if (selectedMode === 'astigmatism_only') {
      setStep('astigmatism');
    } else if (selectedMode === 'color_blindness_only') {
      setStep('color_blindness');
    } else if (selectedMode === 'acuity_only') {
      setStep('acuity');
    } else {
      setStep('acuity');
    }
  };

  const handleAcuityComplete = (od: AcuityResult, os: AcuityResult) => {
    setOdAcuity(od);
    setOsAcuity(os);

    if (mode === 'acuity_only') {
      setStep('summary');
    } else {
      setStep('astigmatism');
    }
  };

  const handleAstigmatismComplete = (od: AstigmatismResult, os: AstigmatismResult) => {
    setOdAstigmatism(od);
    setOsAstigmatism(os);

    if (mode === 'astigmatism_only') {
      setStep('summary');
    } else {
      setStep('color_blindness');
    }
  };

  const handleColorBlindnessComplete = (result: ColorBlindnessResult) => {
    setColorBlindness(result);
    setStep('summary');
  };

  const handleRetest = () => {
    setStep('calibrate');
  };

  const handleSaveToProfile = (updatedRx: Prescription) => {
    onSavePrescription(updatedRx);
    onShowToast('บันทึกผลการตรวจวัดสายตาและตาบอดสีลงในโปรไฟล์สำเร็จแล้ว!');
  };

  // Build the complete vision exam report object
  const report: VisionExamReport = {
    id: `exam-${Date.now()}`,
    testedAt: new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    od: {
      acuity: odAcuity,
      astigmatism: odAstigmatism
    },
    os: {
      acuity: osAcuity,
      astigmatism: osAstigmatism
    },
    colorVision: colorBlindness,
    recommendedLenses: [
      {
        name: 'Aspheric Freeform 1.60',
        reason: 'ให้ภาพคมชัดสมจริง ลดภาพบิดเบือนด้านข้าง เหมาะกับสายตาเอียง',
        icon: 'tune'
      },
      {
        name: 'Blue Cut UV400 Coating',
        reason: 'ปกป้องดวงตาจากแสงสีฟ้าของอุปกรณ์ดิจิทัล',
        icon: 'devices'
      }
    ],
    generalAdvice: [
      'ตรวจสายตาเป็นประจำอย่างน้อยปีละ 1 ครั้ง',
      'พักสายตาทุก 20 นาทีตามกฎ 20-20-20'
    ]
  };

  // Step names for progress tracking
  const STEPS_NAV: { id: VisionTestStep; label: string; icon: string }[] = [
    { id: 'calibrate', label: 'เตรียมพร้อม', icon: 'straighten' },
    { id: 'acuity', label: 'สั้น/ยาว', icon: 'visibility' },
    { id: 'astigmatism', label: 'สายตาเอียง', icon: 'clock_loader_60' },
    { id: 'color_blindness', label: 'ตาบอดสี', icon: 'palette' },
    { id: 'summary', label: 'ผลตรวจ', icon: 'assignment' }
  ];

  const currentStepIndex = STEPS_NAV.findIndex((s) => s.id === step);

  return (
    <div className="flex flex-col w-full pb-6 gap-3">
      {/* Top Navigation & Header Bar */}
      <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary active:scale-95 transition-all cursor-pointer py-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>หน้าหลัก</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-bold text-xs text-primary">ระบบตรวจวัดสายตาออนไลน์</span>
        </div>

        <button
          type="button"
          onClick={handleRetest}
          className="text-xs text-outline hover:text-primary active:scale-95 transition-all p-1"
          title="เริ่มตรวจใหม่"
          aria-label="เริ่มตรวจใหม่"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
        </button>
      </div>

      {/* Step Progress Tracker (Interactive tabs) */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
        {STEPS_NAV.map((s, idx) => {
          const isActive = s.id === step;
          const isPassed = currentStepIndex > idx;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                // Allow jumping to already completed steps or calibrate
                if (idx <= currentStepIndex || step === 'summary') {
                  setStep(s.id);
                }
              }}
              className={`flex-1 min-w-[62px] py-1.5 px-1 rounded-xl flex flex-col items-center gap-0.5 transition-all text-center ${
                isActive
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : isPassed
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-surface-container-low text-outline opacity-60'
              }`}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={isActive || isPassed ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {isPassed && !isActive ? 'check_circle' : s.icon}
              </span>
              <span className="text-[10px] whitespace-nowrap">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Step Content */}
      <div className="mt-1">
        {step === 'calibrate' && (
          <DistanceCalibration
            onStart={handleStartCalibrate}
            onSelectSpecificMode={handleSelectModeAndStart}
          />
        )}

        {step === 'acuity' && (
          <VisualAcuityTest
            onComplete={handleAcuityComplete}
            onSkip={() => setStep('astigmatism')}
          />
        )}

        {step === 'astigmatism' && (
          <AstigmatismTest
            onComplete={handleAstigmatismComplete}
            onSkip={() => setStep('color_blindness')}
          />
        )}

        {step === 'color_blindness' && (
          <ColorBlindnessTest
            onComplete={handleColorBlindnessComplete}
            onSkip={() => setStep('summary')}
          />
        )}

        {step === 'summary' && (
          <VisionTestSummary
            report={report}
            onSaveToProfile={handleSaveToProfile}
            onRetest={handleRetest}
            onBookAppointment={() => setIsBranchModalOpen(true)}
            onShopEyewear={() => onNavigate('search')}
          />
        )}
      </div>

      {/* Branch Appointment Modal */}
      <BranchAppointmentModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
      />
    </div>
  );
};
