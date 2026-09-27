export type VisionTestStep =
  | 'calibrate'
  | 'acuity'
  | 'astigmatism'
  | 'color_blindness'
  | 'summary';

export type VisionTestMode =
  | 'all'
  | 'acuity_only'
  | 'astigmatism_only'
  | 'color_blindness_only';

export type EyeSide = 'od' | 'os';

export interface AcuityResult {
  eye: EyeSide;
  level: string; // e.g. '20/20', '20/25', '20/40', etc.
  estimatedSph: string; // e.g. '-0.00', '-0.50', '-1.25', etc.
  scoreText: string;
  passed: boolean;
}

export interface AstigmatismResult {
  eye: EyeSide;
  hasAstigmatism: boolean;
  sharpestClockHour?: number; // 1-12 clock hour
  calculatedAxisDeg?: number; // 0-180 degrees
  cylinderPower?: string; // e.g. '0.00', '-0.50', '-0.75', '-1.25', etc.
  note: string;
}

export type ColorVisionDiagnosis =
  | 'normal'
  | 'red_green_mild'
  | 'red_green_moderate'
  | 'blue_yellow'
  | 'total_deficiency';

export interface IshiharaPlateDef {
  id: number;
  numberDisplay: string;
  normalSee: string;
  colorBlindSee: string;
  type: 'demo' | 'red_green_screening' | 'red_green_diagnostic' | 'transformation' | 'hidden';
  title: string;
  description: string;
  options: string[];
}

export interface ColorBlindnessResult {
  totalPlates: number;
  correctCount: number;
  diagnosis: ColorVisionDiagnosis;
  diagnosisTitle: string;
  diagnosisDetails: string;
  recommendations: string[];
  answers: {
    plateId: number;
    userAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface VisionExamReport {
  id: string;
  testedAt: string;
  od: {
    acuity: AcuityResult;
    astigmatism: AstigmatismResult;
  };
  os: {
    acuity: AcuityResult;
    astigmatism: AstigmatismResult;
  };
  colorVision: ColorBlindnessResult;
  recommendedLenses: {
    name: string;
    reason: string;
    icon: string;
  }[];
  generalAdvice: string[];
}
